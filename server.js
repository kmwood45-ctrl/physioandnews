/**
 * CF & Physio Research Hub — server.js (ROOT LEVEL)
 * Daily 6:00 AM Toronto cron job.
 * Node 18+ built-in fetch used (no node-fetch needed).
 * Deploy on Railway.app free tier.
 */

'use strict';

const express  = require('express');
const cron     = require('node-cron');
const cors     = require('cors');
const fs       = require('fs');
const path     = require('path');

// Anthropic is optional — server works without it (just no AI features)
let Anthropic = null;
try {
  Anthropic = require('@anthropic-ai/sdk');
} catch (e) {
  console.warn('[WARN] @anthropic-ai/sdk not available — AI features disabled');
}

const app     = express();
const PORT    = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY || '';

// All paths relative to THIS file (server.js at repo root)
const ROOT     = __dirname;
const DATA_DIR = path.join(ROOT, 'public', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(ROOT));   // serves index.html, *.js, style.css

// ── Utilities ─────────────────────────────────────────────────────────────────
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function log(msg) {
  const ts = new Date().toLocaleString('en-CA', {
    timeZone: 'America/Toronto',
    hour12: false
  });
  console.log(`[${ts} Toronto] ${msg}`);
}

function readJSON(filename) {
  const fp = path.join(DATA_DIR, filename);
  if (!fs.existsSync(fp)) return null;
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch { return null; }
}

function writeJSON(filename, data) {
  fs.writeFileSync(
    path.join(DATA_DIR, filename),
    JSON.stringify(data, null, 2),
    'utf8'
  );
}

// ── API Routes ────────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  const files = fs.existsSync(DATA_DIR)
    ? fs.readdirSync(DATA_DIR).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    : [];
  res.json({
    status: 'ok',
    version: '4.1.0',
    serverTime: new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' }),
    todayExists: !!readJSON(`${todayKey()}.json`),
    archiveDays: files.length,
    apiKeySet: !!API_KEY,
    nodeVersion: process.version,
  });
});

app.get('/api/today', (req, res) => {
  const data = readJSON(`${todayKey()}.json`);
  if (data) return res.json(data);
  res.json({
    date: todayKey(),
    articles: {},
    news: [],
    teachingPoints: {},
    generated: false,
    message: 'No data yet for today — check back after 6:00 AM Toronto time, or POST /api/refresh to trigger now.'
  });
});

app.get('/api/archive', (req, res) => {
  if (!fs.existsSync(DATA_DIR)) return res.json([]);
  const dates = fs.readdirSync(DATA_DIR)
    .filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .map(f => f.replace('.json', ''))
    .sort().reverse();
  res.json(dates);
});

app.get('/api/archive/:date', (req, res) => {
  const { date } = req.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Use YYYY-MM-DD format' });
  }
  const data = readJSON(`${date}.json`);
  if (data) return res.json(data);
  res.status(404).json({ error: `No archive for ${date}` });
});

app.post('/api/refresh', (req, res) => {
  log('Manual refresh triggered via POST /api/refresh');
  res.json({ status: 'refresh started', time: new Date().toISOString() });
  setTimeout(() => runDailyUpdate(), 200);
});

app.post('/api/subscribe', (req, res) => {
  const { email, topics, deliveryTime } = req.body || {};
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  const subsFile = path.join(DATA_DIR, 'subscribers.json');
  let subs = [];
  try { subs = JSON.parse(fs.readFileSync(subsFile, 'utf8')); } catch {}
  if (!subs.find(s => s.email === email)) {
    subs.push({ email, topics: topics || [], deliveryTime: deliveryTime || '06:00', subscribedAt: new Date().toISOString() });
    fs.writeFileSync(subsFile, JSON.stringify(subs, null, 2));
    log(`New subscriber: ${email}`);
  }
  res.json({ success: true });
});

// ── PubMed (completely free, no key needed) ───────────────────────────────────
const PUBMED_QUERIES = {
  cf:       'cystic+fibrosis[MH]+AND+(physiotherapy+OR+exercise+OR+airway+clearance)',
  trikafta: 'elexacaftor+tezacaftor+ivacaftor+CFTR+modulator',
  airway:   'airway+clearance+AND+(cystic+fibrosis+OR+bronchiectasis)',
  pt:       'physiotherapy+rehabilitation+randomized+controlled+trial+2024+2025',
  msk:      'musculoskeletal+physiotherapy+exercise+rehabilitation',
  pain:     'chronic+pain+CRPS+physiotherapy+graded+motor+imagery',
  auto:     'autonomic+dysreflexia+spinal+cord+injury',
};

async function fetchPubMed(query, max = 4) {
  const base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
  try {
    const sr = await fetch(
      `${base}/esearch.fcgi?db=pubmed&term=${query}&retmax=${max}&sort=pub+date&retmode=json&reldate=90`,
      { signal: AbortSignal.timeout(12000) }
    );
    if (!sr.ok) throw new Error(`PubMed search ${sr.status}`);
    const sd = await sr.json();
    const ids = sd?.esearchresult?.idlist || [];
    if (!ids.length) return [];

    const sumr = await fetch(
      `${base}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`,
      { signal: AbortSignal.timeout(12000) }
    );
    if (!sumr.ok) throw new Error(`PubMed summary ${sumr.status}`);
    const sumd = await sumr.json();
    const result = sumd?.result || {};

    return ids.map(id => {
      const r = result[id];
      if (!r || r.error) return null;
      const doi = (r.articleids || []).find(a => a.idtype === 'doi')?.value || '';
      const authorList = r.authors || [];
      const authors = authorList.slice(0, 4).map(a => a.name).join(', ')
        + (authorList.length > 4 ? ', et al.' : '');
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
        r: 'ww', c: 0, isNew: true, cat: 'all',
      };
    }).filter(Boolean);
  } catch (e) {
    log(`PubMed error [${query.slice(0,30)}]: ${e.message}`);
    return [];
  }
}

// ── AI clinical summary ───────────────────────────────────────────────────────
async function aiSummary(title, authors, journal, year) {
  if (!API_KEY || !Anthropic) return null;
  try {
    const client = new Anthropic({ apiKey: API_KEY });
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Clinical physiotherapy educator. 2-3 sentences: what should physiotherapists DO differently in practice based on this research? Concrete and actionable only.\n\nPaper: "${title}" — ${authors}. ${journal}. ${year}.`
      }]
    });
    return msg.content?.[0]?.text || null;
  } catch (e) {
    log(`AI summary error: ${e.message}`);
    return null;
  }
}

// ── World news via Claude web search ─────────────────────────────────────────
async function fetchNews() {
  if (!API_KEY || !Anthropic) {
    log('No Anthropic key — skipping news fetch');
    return [];
  }
  const today = new Date().toLocaleDateString('en-CA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/Toronto'
  });
  try {
    const client = new Anthropic({ apiKey: API_KEY });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 5000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `Today is ${today} Toronto time. Search for today's top news from: New York Times, Washington Post, Reuters, Financial Times, FiveThirtyEight, The Athletic, CBC, BBC, The Economist, Toronto Star, AP News.

Return ONLY a JSON array — no markdown, no explanation — where each object has:
- "title": verbatim published headline
- "source": exact outlet name
- "authors": byline as published, or ""
- "published": exact date and time with timezone (e.g. "April 13, 2026, 9:47 AM EDT") — NOT relative like "2 hours ago"
- "category": one of: politics / world / business / health / sports / canada / toronto / data / science
- "opening": first 1-2 sentences from the article verbatim
- "summary": 3-5 sentence factual summary of the full story
- "url": direct article URL

15 to 20 stories. JSON array only.`
      }]
    });

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    const clean = text.replace(/```json|```/g, '').trim();
    const s = clean.indexOf('[');
    const e = clean.lastIndexOf(']');
    if (s > -1 && e > s) return JSON.parse(clean.slice(s, e + 1));
    log('News: could not extract JSON array from response');
    return [];
  } catch (e) {
    log(`News fetch error: ${e.message}`);
    return [];
  }
}

// ── Daily teaching point ──────────────────────────────────────────────────────
async function genTeachingPoint(section, articles) {
  if (!API_KEY || !Anthropic || !articles.length) return null;
  try {
    const client = new Anthropic({ apiKey: API_KEY });
    const titles = articles.slice(0, 3).map(a => a.title).join('; ');
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 180,
      messages: [{
        role: 'user',
        content: `Based on recent ${section} research: "${titles}" — write ONE clinical teaching point for physiotherapists. Bold topic. 2-3 specific actionable sentences.`
      }]
    });
    return msg.content?.[0]?.text || null;
  } catch { return null; }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Main daily update ─────────────────────────────────────────────────────────
async function runDailyUpdate() {
  log('====== DAILY UPDATE START ======');
  const today = todayKey();

  try {
    const articles = {};
    const teachingPoints = {};

    for (const [sec, query] of Object.entries(PUBMED_QUERIES)) {
      log(`  PubMed [${sec}]...`);
      try {
        const raw = await fetchPubMed(query, 4);
        const enriched = [];
        for (const art of raw) {
          const ai = await aiSummary(art.title, art.authors, art.journal, art.year);
          enriched.push({ ...art, ...(ai ? { ai } : {}) });
          await sleep(800);
        }
        articles[sec] = enriched;
        log(`    → ${enriched.length} articles`);

        const tp = await genTeachingPoint(sec, enriched);
        if (tp) teachingPoints[sec] = tp;
        await sleep(600);
      } catch (e) {
        log(`  [${sec}] skipped: ${e.message}`);
        articles[sec] = [];
      }
    }

    log('  Fetching world news...');
    const news = await fetchNews();
    log(`  → ${news.length} stories`);

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

    writeJSON(`${today}.json`, payload);
    log(`  Saved ${today}.json ✓`);

    // Trim to 30 days
    const all = fs.readdirSync(DATA_DIR)
      .filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .sort();
    for (const old of all.slice(0, Math.max(0, all.length - 30))) {
      fs.unlinkSync(path.join(DATA_DIR, old));
      log(`  Trimmed: ${old}`);
    }

    log('====== DAILY UPDATE COMPLETE ======');
  } catch (e) {
    log(`DAILY UPDATE ERROR: ${e.message}`);
    console.error(e);
  }
}

// ── Cron: 6:00 AM Toronto every day ──────────────────────────────────────────
cron.schedule('0 6 * * *', () => {
  log('Cron fired → 6:00 AM Toronto');
  runDailyUpdate();
}, { timezone: 'America/Toronto' });

// ── Run on startup if today's file is missing ─────────────────────────────────
if (!readJSON(`${todayKey()}.json`)) {
  log('No data for today — will fetch in 10 seconds...');
  setTimeout(runDailyUpdate, 10000);
} else {
  const d = readJSON(`${todayKey()}.json`);
  log(`Today's data present — generated ${d?.generatedAtToronto || 'unknown'}`);
}

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  log(`Listening on port ${PORT}`);
  log(`Anthropic key: ${API_KEY ? 'SET ✓' : 'NOT SET — AI/news disabled'}`);
  log(`Data dir: ${DATA_DIR}`);
  log(`Static root: ${ROOT}`);
});

process.on('uncaughtException', err => {
  log(`Uncaught exception: ${err.message}`);
  console.error(err.stack);
});
process.on('unhandledRejection', reason => {
  log(`Unhandled rejection: ${reason}`);
});
