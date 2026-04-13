/**
 * CF & Physio Research Hub — Backend Server
 * Daily 6:00 AM EST auto-update via cron:
 *   1. Fetches new research from PubMed (free API)
 *   2. Fetches world news via Claude web search
 *   3. Generates AI clinical summaries
 *   4. Archives previous days automatically (30-day rolling)
 *
 * Deploy FREE on Railway.app — see DEPLOY.md
 */

const express   = require('express');
const cron      = require('node-cron');
const fs        = require('fs');
const path      = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const app      = express();
const PORT     = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, '..', 'public', 'data');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

app.use(express.json());
app.use(require('cors')());
app.use(express.static(path.join(__dirname, '..')));

// ── API routes ────────────────────────────────────────────────────────────────

app.get('/api/today', (req, res) => {
  const file = path.join(DATA_DIR, `${todayKey()}.json`);
  if (fs.existsSync(file)) res.json(JSON.parse(fs.readFileSync(file, 'utf8')));
  else res.json({ date: todayKey(), articles: {}, news: [], generated: false });
});

app.get('/api/archive', (req, res) => {
  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.json$/))
    .map(f => f.replace('.json', '')).sort().reverse();
  res.json(files);
});

app.get('/api/archive/:date', (req, res) => {
  const file = path.join(DATA_DIR, `${req.params.date}.json`);
  if (fs.existsSync(file)) res.json(JSON.parse(fs.readFileSync(file, 'utf8')));
  else res.status(404).json({ error: 'Not found' });
});

app.post('/api/refresh', (req, res) => {
  res.json({ status: 'refresh started', time: new Date().toISOString() });
  runDailyUpdate();
});

app.post('/api/subscribe', (req, res) => {
  const { email, topics, time } = req.body;
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Invalid email' });
  const f = path.join(DATA_DIR, 'subscribers.json');
  const subs = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f)) : [];
  if (!subs.find(s => s.email === email)) {
    subs.push({ email, topics: topics || [], deliveryTime: time || '06:00', subscribedAt: new Date().toISOString() });
    fs.writeFileSync(f, JSON.stringify(subs, null, 2));
  }
  res.json({ success: true });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function log(msg) {
  const ts = new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' });
  console.log(`[${ts} Toronto] ${msg}`);
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── PubMed fetch (completely free, no API key needed) ────────────────────────

async function fetchPubMed(query, maxResults = 4) {
  try {
    const base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
    const search = await fetch(
      `${base}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&sort=pub+date&retmode=json&reldate=60`
    );
    const sData = await search.json();
    const ids = sData.esearchresult?.idlist || [];
    if (!ids.length) return [];

    const summary = await fetch(
      `${base}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`
    );
    const sumData = await summary.json();
    const result = sumData.result || {};

    return ids.map(id => {
      const r = result[id]; if (!r) return null;
      const doi = (r.articleids || []).find(a => a.idtype === 'doi')?.value || '';
      return {
        pmid: id,
        title: r.title?.replace(/\.$/, '') || 'Untitled',
        authors: (r.authors || []).slice(0, 4).map(a => a.name).join(', ')
          + (r.authors?.length > 4 ? ', et al.' : ''),
        journal: r.source || '',
        year: (r.pubdate || '').slice(0, 4),
        vol: r.volume || '',
        pages: r.pages || '',
        doi,
        url: doi ? `https://doi.org/${doi}` : `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        r: 'ww', c: 0, isNew: true, cat: 'all',
      };
    }).filter(Boolean);
  } catch (e) {
    log(`PubMed error: ${e.message}`);
    return [];
  }
}

// ── AI summary ────────────────────────────────────────────────────────────────

async function aiSummary(title, authors, journal, year) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Clinical physiotherapy educator. In 2-3 sentences state what physiotherapists should DO differently based on this research. Concrete and actionable only.\n\n"${title}" — ${authors}. ${journal}. ${year}.`
      }]
    });
    return msg.content[0]?.text || null;
  } catch { return null; }
}

// ── Teaching point generator ──────────────────────────────────────────────────

async function generateTeachingPoint(section, articles) {
  if (!process.env.ANTHROPIC_API_KEY || !articles.length) return null;
  try {
    const titles = articles.slice(0, 3).map(a => a.title).join('; ');
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Based on these recent papers in ${section}: "${titles}" — write one clinical teaching point for physiotherapists today. Start with bold topic. 2-3 sentences. Practical and specific.`
      }]
    });
    return msg.content[0]?.text || null;
  } catch { return null; }
}

// ── World news fetch ──────────────────────────────────────────────────────────

async function fetchNews() {
  if (!process.env.ANTHROPIC_API_KEY) return [];
  try {
    const today = new Date().toLocaleDateString('en-CA', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      timeZone: 'America/Toronto'
    });
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 5000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `Today is ${today} Toronto time. Search for today's top news from: New York Times, Washington Post, Reuters, Financial Times, FiveThirtyEight, The Athletic, CBC, BBC, The Economist, Toronto Star, AP.

Return a JSON array. Each object must have:
- "title": verbatim published headline
- "source": exact outlet name
- "authors": byline as published (e.g. "By Jane Smith and John Doe") or empty string
- "published": exact date and time with timezone (e.g. "April 13, 2026, 6:42 AM EDT")
- "category": politics/world/business/health/sports/canada/toronto/data/science
- "opening": first 1-2 sentences verbatim from the article
- "summary": your 3-5 sentence factual summary
- "url": direct article URL

Return ONLY the JSON array. No markdown. No explanation. 15-20 stories minimum.`
      }]
    });

    const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const s = clean.indexOf('['), e = clean.lastIndexOf(']');
    if (s > -1 && e > -1) return JSON.parse(clean.slice(s, e + 1));
    return [];
  } catch (e) {
    log(`News fetch error: ${e.message}`);
    return [];
  }
}

// ── PubMed query map ──────────────────────────────────────────────────────────

const QUERIES = {
  cf:       'cystic fibrosis pulmonary physiotherapy',
  trikafta: 'elexacaftor tezacaftor ivacaftor CFTR modulator outcomes',
  airway:   'airway clearance positive expiratory pressure mucus',
  pt:       'physiotherapy rehabilitation clinical trial 2024',
  msk:      'musculoskeletal physiotherapy exercise rehabilitation',
  pain:     'chronic pain CRPS graded motor imagery physiotherapy',
  auto:     'autonomic dysreflexia spinal cord injury management',
};

// ── Main daily update ─────────────────────────────────────────────────────────

async function runDailyUpdate() {
  log('========= DAILY UPDATE START =========');

  // 1. Fetch articles per section
  const articles = {};
  const teachingPoints = {};
  for (const [sec, query] of Object.entries(QUERIES)) {
    log(`  PubMed [${sec}]: ${query}`);
    const raw = await fetchPubMed(query, 4);
    const enriched = [];
    for (const art of raw) {
      const ai = await aiSummary(art.title, art.authors, art.journal, art.year);
      enriched.push({ ...art, ai: ai || undefined });
      await sleep(600);
    }
    articles[sec] = enriched;

    // Generate daily teaching point from new articles
    const tp = await generateTeachingPoint(sec, enriched);
    if (tp) teachingPoints[sec] = tp;
    await sleep(500);
  }

  // 2. Fetch news
  log('  Fetching world news...');
  const news = await fetchNews();
  log(`  Got ${news.length} news stories`);

  // 3. Save
  const today = todayKey();
  const payload = {
    date: today,
    generatedAt: new Date().toISOString(),
    generatedAtToronto: new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' }),
    articles,
    teachingPoints,
    news,
    generated: true,
  };

  fs.writeFileSync(
    path.join(DATA_DIR, `${today}.json`),
    JSON.stringify(payload, null, 2)
  );
  log(`  Saved ${today}.json`);

  // 4. Trim archive to 30 days
  const allFiles = fs.readdirSync(DATA_DIR)
    .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.json$/))
    .sort();
  for (const old of allFiles.slice(0, Math.max(0, allFiles.length - 30))) {
    fs.unlinkSync(path.join(DATA_DIR, old));
    log(`  Archived out: ${old}`);
  }

  log('========= DAILY UPDATE COMPLETE =========');
}

// ── Cron: 6:00 AM Toronto every day ──────────────────────────────────────────
cron.schedule('0 6 * * *', () => {
  log('Cron triggered → 6:00 AM Toronto');
  runDailyUpdate();
}, { timezone: 'America/Toronto' });

// ── Auto-run on startup if today not yet fetched ──────────────────────────────
const todayFile = path.join(DATA_DIR, `${todayKey()}.json`);
if (!fs.existsSync(todayFile)) {
  log('No data for today — running startup fetch in 5s...');
  setTimeout(runDailyUpdate, 5000);
} else {
  const d = JSON.parse(fs.readFileSync(todayFile));
  log(`Today's data loaded: ${d.news?.length || 0} news, generated ${d.generatedAtToronto || d.generatedAt}`);
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' }),
    todayExists: fs.existsSync(todayFile),
    archiveDays: fs.readdirSync(DATA_DIR).filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.json$/)).length,
  });
});

app.listen(PORT, () => log(`Server on :${PORT} — cron set for 6:00 AM Toronto`));
