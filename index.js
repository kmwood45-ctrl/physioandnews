/**
 * CF & Physio Research Hub — Express Server
 * Node 18+ built-in fetch used throughout (no node-fetch needed)
 * Cron: daily 6:00 AM America/Toronto
 * Deploy: Railway.app (free tier)
 */

'use strict';

const express  = require('express');
const cron     = require('node-cron');
const cors     = require('cors');
const fs       = require('fs');
const path     = require('path');

// ── Anthropic SDK (optional — gracefully disabled if key missing) ─────────────
let Anthropic = null;
try {
  Anthropic = require('@anthropic-ai/sdk');
} catch (e) {
  console.warn('[WARN] @anthropic-ai/sdk not found — AI features disabled');
}

const app      = express();
const PORT     = process.env.PORT || 3000;
const API_KEY  = process.env.ANTHROPIC_API_KEY || '';
const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const ROOT_DIR = path.join(__dirname, '..');

// ── Ensure directories exist ──────────────────────────────────────────────────
[DATA_DIR, path.join(ROOT_DIR, 'public')].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(ROOT_DIR));   // serves index.html, style.css, *.js

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function log(msg) {
  const ts = new Date().toLocaleString('en-CA', {
    timeZone: 'America/Toronto',
    hour12: false
  });
  console.log(`[${ts}] ${msg}`);
}

function saveJSON(filename, data) {
  fs.writeFileSync(
    path.join(DATA_DIR, filename),
    JSON.stringify(data, null, 2),
    'utf8'
  );
}

function loadJSON(filename) {
  const fp = path.join(DATA_DIR, filename);
  if (!fs.existsSync(fp)) return null;
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); }
  catch (e) { return null; }
}

// ── API Routes ────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  const todayFile = `${todayKey()}.json`;
  const archiveFiles = fs.existsSync(DATA_DIR)
    ? fs.readdirSync(DATA_DIR).filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.json$/))
    : [];
  res.json({
    status: 'ok',
    version: '4.0.0',
    serverTime: new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' }),
    todayDataExists: fs.existsSync(path.join(DATA_DIR, todayFile)),
    archiveDays: archiveFiles.length,
    anthropicKeySet: !!API_KEY,
  });
});

// Today's data
app.get('/api/today', (req, res) => {
  const data = loadJSON(`${todayKey()}.json`);
  if (data) {
    res.json(data);
  } else {
    res.json({
      date: todayKey(),
      articles: {},
      news: [],
      teachingPoints: {},
      generated: false,
      message: 'Today\'s data not yet generated — check back after 6:00 AM Toronto time'
    });
  }
});

// Archive list
app.get('/api/archive', (req, res) => {
  if (!fs.existsSync(DATA_DIR)) return res.json([]);
  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.json$/))
    .map(f => f.replace('.json', ''))
    .sort()
    .reverse();
  res.json(files);
});

// Specific archive date
app.get('/api/archive/:date', (req, res) => {
  const date = req.params.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format' });
  }
  const data = loadJSON(`${date}.json`);
  if (data) res.json(data);
  else res.status(404).json({ error: `No data found for ${date}` });
});

// Manual refresh trigger
app.post('/api/refresh', (req, res) => {
  const secret = req.headers['x-refresh-secret'];
  // Optional: protect with secret  
  // if (secret !== process.env.REFRESH_SECRET) return res.status(403).json({error:'Forbidden'});
  log('Manual refresh triggered via API');
  res.json({ status: 'refresh started', time: new Date().toISOString() });
  setTimeout(() => runDailyUpdate(), 100);
});

// Subscribe
app.post('/api/subscribe', (req, res) => {
  const { email, topics, deliveryTime } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  const subsFile = path.join(DATA_DIR, 'subscribers.json');
  let subs = [];
  try { subs = JSON.parse(fs.readFileSync(subsFile, 'utf8')); } catch (e) {}
  if (!subs.find(s => s.email === email)) {
    subs.push({
      email,
      topics: topics || [],
      deliveryTime: deliveryTime || '06:00',
      subscribedAt: new Date().toISOString()
    });
    fs.writeFileSync(subsFile, JSON.stringify(subs, null, 2));
    log(`New subscriber: ${email}`);
  }
  res.json({ success: true, message: 'Subscribed successfully' });
});

// ── PubMed fetch (completely free, no API key needed) ─────────────────────────
const PUBMED_QUERIES = {
  cf:       'cystic+fibrosis[MH]+AND+physiotherapy+OR+exercise',
  trikafta: 'elexacaftor+tezacaftor+ivacaftor+CFTR+modulator',
  airway:   'airway+clearance+AND+cystic+fibrosis+OR+bronchiectasis',
  pt:       'physiotherapy+rehabilitation+randomized+controlled+trial',
  msk:      'musculoskeletal+physiotherapy+exercise+rehabilitation',
  pain:     'chronic+pain+CRPS+physiotherapy+graded+motor+imagery',
  auto:     'autonomic+dysreflexia+spinal+cord+injury',
};

async function fetchPubMed(query, maxResults = 4) {
  try {
    const base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

    // Search
    const searchURL = `${base}/esearch.fcgi?db=pubmed&term=${query}&retmax=${maxResults}&sort=pub+date&retmode=json&reldate=90`;
    const searchRes = await fetch(searchURL, { signal: AbortSignal.timeout(10000) });
    if (!searchRes.ok) throw new Error(`PubMed search HTTP ${searchRes.status}`);
    const searchData = await searchRes.json();
    const ids = searchData?.esearchresult?.idlist || [];
    if (ids.length === 0) return [];

    // Summary
    const sumURL = `${base}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
    const sumRes = await fetch(sumURL, { signal: AbortSignal.timeout(10000) });
    if (!sumRes.ok) throw new Error(`PubMed summary HTTP ${sumRes.status}`);
    const sumData = await sumRes.json();
    const result = sumData?.result || {};

    return ids.map(id => {
      const r = result[id];
      if (!r || r.error) return null;
      const doi = (r.articleids || []).find(a => a.idtype === 'doi')?.value || '';
      const authors = (r.authors || [])
        .slice(0, 4)
        .map(a => a.name)
        .join(', ')
        + (r.authors?.length > 4 ? ', et al.' : '');
      return {
        pmid: id,
        title: (r.title || 'Untitled').replace(/\.$/, ''),
        authors,
        journal: r.source || '',
        year: (r.pubdate || '').slice(0, 4),
        vol: r.volume || '',
        issue: r.issue || '',
        pages: r.pages || '',
        doi,
        url: doi ? `https://doi.org/${doi}` : `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        pubmedUrl: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        r: 'ww',
        c: 0,
        isNew: true,
        cat: 'all',
      };
    }).filter(Boolean);
  } catch (e) {
    log(`PubMed error for "${query}": ${e.message}`);
    return [];
  }
}

// ── AI summary ────────────────────────────────────────────────────────────────
async function aiSummary(title, authors, journal, year) {
  if (!API_KEY || !Anthropic) return null;
  try {
    const client = new Anthropic({ apiKey: API_KEY });
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Clinical physiotherapy educator. 2-3 sentences: what should physiotherapists DO differently based on this research? Concrete and actionable only.\n\n"${title}" — ${authors}. ${journal}. ${year}.`
      }]
    });
    return msg.content?.[0]?.text || null;
  } catch (e) {
    log(`AI summary error: ${e.message}`);
    return null;
  }
}

// ── Daily teaching point ──────────────────────────────────────────────────────
async function generateTeachingPoint(section, articles) {
  if (!API_KEY || !Anthropic || !articles.length) return null;
  try {
    const client = new Anthropic({ apiKey: API_KEY });
    const titles = articles.slice(0, 3).map(a => a.title).join('; ');
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 180,
      messages: [{
        role: 'user',
        content: `Based on recent ${section} research: "${titles}" — write ONE clinical teaching point for physiotherapists. Bold topic at start. 2-3 sentences. Specific and practical.`
      }]
    });
    return msg.content?.[0]?.text || null;
  } catch (e) {
    return null;
  }
}

// ── News fetch via Claude web search ─────────────────────────────────────────
async function fetchNews() {
  if (!API_KEY || !Anthropic) {
    log('No API key — skipping news fetch');
    return [];
  }
  try {
    const client = new Anthropic({ apiKey: API_KEY });
    const today = new Date().toLocaleDateString('en-CA', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      timeZone: 'America/Toronto'
    });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 5000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `Today is ${today} (Toronto time). Search for today's top news stories from: New York Times, Washington Post, Reuters, Financial Times, FiveThirtyEight, The Athletic, CBC, BBC, The Economist, Toronto Star, AP News.

Return a JSON array. Each object must have EXACTLY these fields:
- "title": verbatim published headline as it appears on the website
- "source": exact outlet name (e.g. "New York Times")
- "authors": byline as published (e.g. "By Jane Smith and John Doe") — empty string if not available
- "published": exact publication date and time with timezone (e.g. "April 13, 2026, 9:47 AM EDT") — NOT relative time like "2 hours ago"
- "category": exactly one of: politics / world / business / health / sports / canada / toronto / data / science
- "opening": first 1-2 sentences of the article verbatim
- "summary": your own 3-5 sentence factual summary of the complete story
- "url": direct URL to the article

Return ONLY the JSON array. No markdown fences. No explanation text. 15-20 stories.`
      }]
    });

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    const clean = text.replace(/```json|```/g, '').trim();
    const s = clean.indexOf('[');
    const e = clean.lastIndexOf(']');
    if (s > -1 && e > s) {
      return JSON.parse(clean.slice(s, e + 1));
    }
    log('News: could not parse JSON from response');
    return [];
  } catch (e) {
    log(`News fetch error: ${e.message}`);
    return [];
  }
}

// ── Main daily update ─────────────────────────────────────────────────────────
async function runDailyUpdate() {
  log('========= DAILY UPDATE START =========');
  const today = todayKey();

  try {
    // 1. Fetch new articles from PubMed per section
    const articles = {};
    const teachingPoints = {};

    for (const [sec, query] of Object.entries(PUBMED_QUERIES)) {
      log(`  PubMed [${sec}]...`);
      try {
        const raw = await fetchPubMed(query, 4);
        const enriched = [];
        for (const art of raw) {
          const ai = await aiSummary(art.title, art.authors, art.journal, art.year);
          enriched.push({ ...art, ai: ai || undefined });
          await new Promise(r => setTimeout(r, 700)); // rate limit
        }
        articles[sec] = enriched;
        log(`    → ${enriched.length} articles`);

        // Daily teaching point from today's articles
        const tp = await generateTeachingPoint(sec, enriched);
        if (tp) teachingPoints[sec] = tp;
        await new Promise(r => setTimeout(r, 500));
      } catch (secErr) {
        log(`  [${sec}] error: ${secErr.message}`);
        articles[sec] = [];
      }
    }

    // 2. Fetch world news
    log('  Fetching world news...');
    const news = await fetchNews();
    log(`  → ${news.length} stories`);

    // 3. Save today's data
    const payload = {
      date: today,
      generatedAt: new Date().toISOString(),
      generatedAtToronto: new Date().toLocaleString('en-CA', {
        timeZone: 'America/Toronto', hour12: false
      }),
      articles,
      teachingPoints,
      news,
      generated: true,
    };
    saveJSON(`${today}.json`, payload);
    log(`  Saved ${today}.json ✓`);

    // 4. Trim archive to 30 days
    const allFiles = fs.readdirSync(DATA_DIR)
      .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.json$/))
      .sort();
    const toDelete = allFiles.slice(0, Math.max(0, allFiles.length - 30));
    for (const old of toDelete) {
      fs.unlinkSync(path.join(DATA_DIR, old));
      log(`  Archived out: ${old}`);
    }

    log('========= DAILY UPDATE COMPLETE =========');
  } catch (e) {
    log(`DAILY UPDATE FAILED: ${e.message}`);
    console.error(e);
  }
}

// ── Cron: 6:00 AM Toronto every day ──────────────────────────────────────────
cron.schedule('0 6 * * *', () => {
  log('Cron triggered → 6:00 AM Toronto');
  runDailyUpdate();
}, {
  scheduled: true,
  timezone: 'America/Toronto'
});

// ── Auto-run on startup if today's data is missing ────────────────────────────
const startupFile = path.join(DATA_DIR, `${todayKey()}.json`);
if (!fs.existsSync(startupFile)) {
  log('No data for today — scheduling startup fetch in 8 seconds...');
  setTimeout(runDailyUpdate, 8000);
} else {
  const d = loadJSON(`${todayKey()}.json`);
  log(`Today's data already exists (generated: ${d?.generatedAtToronto || 'unknown'})`);
}

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  log(`Server listening on port ${PORT}`);
  log(`Cron scheduled: 6:00 AM America/Toronto daily`);
  log(`Anthropic API key: ${API_KEY ? 'SET ✓' : 'NOT SET — AI features disabled'}`);
  log(`Data directory: ${DATA_DIR}`);
});

// Handle uncaught errors gracefully
process.on('uncaughtException', (err) => {
  log(`Uncaught exception: ${err.message}`);
  console.error(err);
});
process.on('unhandledRejection', (reason) => {
  log(`Unhandled rejection: ${reason}`);
});
