/**
 * CF & Physio Research Hub — server.js
 * - Daily 6:00 AM Toronto cron: fetches PubMed + news, saves JSON
 * - Daily 7:00 AM Toronto cron: sends digest email to all subscribers via Resend
 * - Free tier: Resend (3,000 emails/month), PubMed API (free), Railway hobby plan
 */

'use strict';

const express  = require('express');
const cron     = require('node-cron');
const cors     = require('cors');
const fs       = require('fs');
const path     = require('path');

let Anthropic = null;
try { Anthropic = require('@anthropic-ai/sdk'); } catch {}

const app      = express();
const PORT     = process.env.PORT || 3000;
const API_KEY  = process.env.ANTHROPIC_API_KEY || '';
const RESEND_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'digest@physioandnews.com';

const ROOT     = __dirname;
const DATA_DIR = path.join(ROOT, 'public', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.static(ROOT));

// ── Utilities ─────────────────────────────────────────────────────────────────
const todayKey = () => new Date().toISOString().slice(0, 10);

function log(msg) {
  const ts = new Date().toLocaleString('en-CA', { timeZone:'America/Toronto', hour12:false });
  console.log(`[${ts}] ${msg}`);
}

function readJSON(f) {
  const fp = path.join(DATA_DIR, f);
  if (!fs.existsSync(fp)) return null;
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch { return null; }
}

function writeJSON(f, d) {
  fs.writeFileSync(path.join(DATA_DIR, f), JSON.stringify(d, null, 2));
}

function getSubscribers() {
  return readJSON('subscribers.json') || [];
}

// ── API Routes ────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const files = fs.existsSync(DATA_DIR)
    ? fs.readdirSync(DATA_DIR).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    : [];
  res.json({
    status: 'ok',
    time: new Date().toLocaleString('en-CA', { timeZone:'America/Toronto' }),
    todayExists: !!readJSON(`${todayKey()}.json`),
    archiveDays: files.length,
    subscribers: getSubscribers().length,
    anthropicKey: !!API_KEY,
    resendKey: !!RESEND_KEY,
  });
});

app.get('/api/today', (req, res) => {
  const d = readJSON(`${todayKey()}.json`);
  if (d) return res.json(d);
  res.json({ date: todayKey(), articles:{}, news:[], generated:false });
});

app.get('/api/archive', (req, res) => {
  if (!fs.existsSync(DATA_DIR)) return res.json([]);
  const dates = fs.readdirSync(DATA_DIR)
    .filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .map(f => f.replace('.json',''))
    .sort().reverse();
  res.json(dates);
});

app.get('/api/archive/:date', (req, res) => {
  const { date } = req.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error:'Invalid date' });
  const d = readJSON(`${date}.json`);
  if (d) return res.json(d);
  res.status(404).json({ error:'Not found' });
});

app.post('/api/refresh', (req, res) => {
  log('Manual refresh triggered');
  res.json({ status:'started', time: new Date().toISOString() });
  setTimeout(runDailyUpdate, 200);
});

app.post('/api/subscribe', (req, res) => {
  const { email, topics, deliveryTime } = req.body || {};
  if (!email || !email.includes('@')) return res.status(400).json({ error:'Invalid email' });
  const subsFile = path.join(DATA_DIR, 'subscribers.json');
  let subs = [];
  try { subs = JSON.parse(fs.readFileSync(subsFile, 'utf8')); } catch {}
  if (!subs.find(s => s.email === email)) {
    subs.push({ email, topics: topics||[], deliveryTime: deliveryTime||'07:00', subscribedAt: new Date().toISOString() });
    fs.writeFileSync(subsFile, JSON.stringify(subs, null, 2));
    log(`New subscriber: ${email} (total: ${subs.length})`);
  }
  res.json({ success:true, total: subs.length });
});

app.delete('/api/unsubscribe/:email', (req, res) => {
  const subsFile = path.join(DATA_DIR, 'subscribers.json');
  let subs = [];
  try { subs = JSON.parse(fs.readFileSync(subsFile, 'utf8')); } catch {}
  subs = subs.filter(s => s.email !== req.params.email);
  fs.writeFileSync(subsFile, JSON.stringify(subs, null, 2));
  res.json({ success:true });
});

// ── PubMed (free, no key needed) ──────────────────────────────────────────────
const QUERIES = {
  cf:       'cystic+fibrosis[MH]+AND+(physiotherapy+OR+exercise)',
  trikafta: 'elexacaftor+tezacaftor+ivacaftor+CFTR+modulator',
  airway:   'airway+clearance+AND+(cystic+fibrosis+OR+bronchiectasis)',
  pt:       'physiotherapy+rehabilitation+randomized+controlled+trial',
  msk:      'musculoskeletal+physiotherapy+exercise+rehabilitation',
  pain:     'chronic+pain+CRPS+physiotherapy+graded+motor+imagery',
  auto:     'autonomic+dysreflexia+spinal+cord+injury',
};

async function fetchPubMed(query, max = 3) {
  try {
    const base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
    const sr = await fetch(`${base}/esearch.fcgi?db=pubmed&term=${query}&retmax=${max}&sort=pub+date&retmode=json&reldate=90`, { signal: AbortSignal.timeout(12000) });
    const sd = await sr.json();
    const ids = sd?.esearchresult?.idlist || [];
    if (!ids.length) return [];
    const sumr = await fetch(`${base}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`, { signal: AbortSignal.timeout(12000) });
    const sumd = await sumr.json();
    const result = sumd?.result || {};
    return ids.map(id => {
      const r = result[id]; if (!r || r.error) return null;
      const doi = (r.articleids||[]).find(a => a.idtype==='doi')?.value || '';
      const authors = (r.authors||[]).slice(0,3).map(a=>a.name).join(', ') + ((r.authors?.length>3)?', et al.':'');
      return { pmid:id, title:(r.title||'').replace(/\.$/,''), authors, journal:r.source||'', year:(r.pubdate||'').slice(0,4), doi, url: doi?`https://doi.org/${doi}`:`https://pubmed.ncbi.nlm.nih.gov/${id}/`, r:'ww', c:0, isNew:true, cat:'all' };
    }).filter(Boolean);
  } catch (e) { log(`PubMed error: ${e.message}`); return []; }
}

async function aiSummary(title, authors, journal, year) {
  if (!API_KEY || !Anthropic) return null;
  try {
    const client = new Anthropic({ apiKey: API_KEY });
    const msg = await client.messages.create({ model:'claude-sonnet-4-20250514', max_tokens:180,
      messages:[{role:'user', content:`Physiotherapy educator. 2 sentences: what should physios DO based on this research? Concrete.\n\n"${title}" — ${authors}. ${journal}. ${year}.`}] });
    return msg.content?.[0]?.text || null;
  } catch { return null; }
}

async function fetchNews() {
  if (!API_KEY || !Anthropic) return [];
  try {
    const client = new Anthropic({ apiKey: API_KEY });
    const today = new Date().toLocaleDateString('en-CA', { weekday:'long', year:'numeric', month:'long', day:'numeric', timeZone:'America/Toronto' });
    const response = await client.messages.create({
      model:'claude-sonnet-4-20250514', max_tokens:5000,
      tools:[{ type:'web_search_20250305', name:'web_search' }],
      messages:[{ role:'user', content:
        `Today is ${today} Toronto time. Search for today's top news from: New York Times, Washington Post, Reuters, Financial Times, FiveThirtyEight, The Athletic, CBC, BBC, The Economist, Toronto Star, AP News.
Return ONLY a JSON array (no markdown) where each object has:
- "title": verbatim headline
- "source": outlet name
- "authors": byline or ""
- "published": exact date and time with timezone (e.g. "April 13, 2026, 9:47 AM EDT")
- "category": politics/world/business/health/sports/canada/toronto/data/science
- "opening": first 1-2 sentences verbatim
- "summary": 3-5 sentence factual summary
- "url": direct article URL
15-20 stories minimum.` }]
    });
    const text = response.content.filter(b=>b.type==='text').map(b=>b.text).join('');
    const clean = text.replace(/```json|```/g,'').trim();
    const s = clean.indexOf('['), e = clean.lastIndexOf(']');
    if (s>-1&&e>s) return JSON.parse(clean.slice(s,e+1));
    return [];
  } catch (e) { log(`News error: ${e.message}`); return []; }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runDailyUpdate() {
  log('=== DAILY UPDATE START ===');
  const today = todayKey();
  const articles = {}, teachingPoints = {};
  for (const [sec, query] of Object.entries(QUERIES)) {
    try {
      log(`  PubMed [${sec}]...`);
      const raw = await fetchPubMed(query, 3);
      const enriched = [];
      for (const art of raw) {
        const ai = await aiSummary(art.title, art.authors, art.journal, art.year);
        enriched.push({ ...art, ...(ai?{ai}:{}) });
        await sleep(700);
      }
      articles[sec] = enriched;
      log(`    → ${enriched.length} articles`);
    } catch (e) { log(`  [${sec}] error: ${e.message}`); articles[sec] = []; }
    await sleep(400);
  }
  log('  Fetching news...');
  const news = await fetchNews();
  log(`  → ${news.length} stories`);
  const payload = { date:today, generatedAt:new Date().toISOString(), generatedAtToronto:new Date().toLocaleString('en-CA',{timeZone:'America/Toronto',hour12:false}), articles, teachingPoints, news, generated:true };
  writeJSON(`${today}.json`, payload);
  log(`  Saved ${today}.json`);
  // Trim to 30 days
  const all = fs.readdirSync(DATA_DIR).filter(f=>/^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  for (const old of all.slice(0, Math.max(0, all.length-30))) { fs.unlinkSync(path.join(DATA_DIR,old)); log(`  Trimmed: ${old}`); }
  log('=== DAILY UPDATE COMPLETE ===');
}

// ── EMAIL via Resend ──────────────────────────────────────────────────────────
async function sendDigestEmails() {
  if (!RESEND_KEY) { log('No RESEND_API_KEY — skipping email send'); return; }
  const subs = getSubscribers();
  if (!subs.length) { log('No subscribers — skipping email'); return; }

  const data = readJSON(`${todayKey()}.json`);
  if (!data?.generated) { log('No data for today — skipping email'); return; }

  const html = buildEmailHTML(data);
  const subject = `CF & Physio Hub — ${new Date().toLocaleDateString('en-CA',{weekday:'long',month:'long',day:'numeric'})}`;

  log(`Sending digest to ${subs.length} subscribers...`);
  let sent = 0, failed = 0;

  for (const sub of subs) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM_EMAIL, to: sub.email, subject, html }),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) { sent++; log(`  ✓ Sent to ${sub.email}`); }
      else { const err = await res.json(); failed++; log(`  ✗ Failed ${sub.email}: ${JSON.stringify(err)}`); }
      await sleep(200); // small delay between sends
    } catch (e) { failed++; log(`  ✗ Error ${sub.email}: ${e.message}`); }
  }
  log(`Email complete: ${sent} sent, ${failed} failed`);
}

function buildEmailHTML(data) {
  const date = new Date().toLocaleDateString('en-CA', { weekday:'long', year:'numeric', month:'long', day:'numeric', timeZone:'America/Toronto' });

  // Top 3 news stories
  const newsHTML = (data.news || []).slice(0, 5).map(s => `
    <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
      <div style="font-size:10px;font-weight:700;color:#C01818;text-transform:uppercase;margin-bottom:3px">${s.source||''} · ${s.published||''}</div>
      ${s.authors ? `<div style="font-size:10px;color:#666;font-style:italic;margin-bottom:3px">${s.authors}</div>` : ''}
      <div style="font-size:15px;font-weight:600;color:#111;margin-bottom:5px">${s.title||''}</div>
      ${s.opening ? `<div style="font-size:12px;color:#333;font-style:italic;border-left:3px solid #C01818;padding-left:8px;margin-bottom:5px">${s.opening}</div>` : ''}
      <div style="font-size:12px;color:#555;line-height:1.5;margin-bottom:5px">${s.summary||''}</div>
      <a href="${s.url||'#'}" style="font-size:11px;color:#1452A8">Read full story →</a>
    </td></tr>`).join('');

  // Top new articles per section
  const sections = { cf:'Cystic Fibrosis', trikafta:'Trikafta/CFTR', airway:'Airway Clearance', pt:'Physiotherapy', msk:'MSK & Rehab', pain:'Pain & CRPS', auto:'Autonomic' };
  const articlesHTML = Object.entries(sections).map(([key, label]) => {
    const arts = (data.articles?.[key] || []).slice(0, 2);
    if (!arts.length) return '';
    return `
      <tr><td style="padding:12px 0;">
        <div style="font-size:13px;font-weight:700;color:#06382A;border-bottom:2px solid #0F7B5A;padding-bottom:4px;margin-bottom:10px">${label}</div>
        ${arts.map(a => `
          <div style="margin-bottom:10px;padding:10px;background:#f9f9f9;border-radius:6px;border-left:3px solid #0F7B5A">
            <div style="font-size:13px;font-weight:600;color:#111;margin-bottom:3px">${a.title||''}</div>
            <div style="font-size:11px;color:#666;margin-bottom:5px">${a.authors||''} · <em>${a.journal||''}</em> · ${a.year||''}</div>
            ${a.doi ? `<div style="font-size:10px;color:#666;margin-bottom:5px">doi: ${a.doi}</div>` : ''}
            ${a.ai  ? `<div style="font-size:12px;color:#06382A;background:#E0F5EE;padding:7px;border-radius:4px;margin-top:5px"><strong>AI Summary:</strong> ${a.ai}</div>` : ''}
            <a href="${a.url||'#'}" style="font-size:11px;color:#0F7B5A">View article →</a>
          </div>`).join('')}
      </td></tr>`;
  }).join('');

  // Daily Sudoku hint
  const sudokuHint = `Today's Sudoku (Hard) — Puzzle ${(Math.floor((new Date()-new Date(new Date().getFullYear(),0,0))/86400000) % 3) + 1} of 3. Play at: <a href="https://kmwood45-ctrl.github.io/physioandnews/#games" style="color:#0F7B5A">physioandnews</a>`;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:20px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;max-width:600px">

  <!-- Header -->
  <tr><td style="background:#06382A;padding:24px 28px">
    <div style="font-size:22px;color:#fff;font-weight:700">CF &amp; Physio Research Hub</div>
    <div style="font-size:12px;color:#6DDBB8;margin-top:4px">${date}</div>
    <div style="font-size:11px;color:#9FD9C8;margin-top:2px">Your daily research &amp; news digest</div>
  </td></tr>

  <!-- World News -->
  <tr><td style="padding:20px 28px">
    <div style="font-size:16px;font-weight:700;color:#C01818;border-bottom:2px solid #C01818;padding-bottom:6px;margin-bottom:4px">📰 World News</div>
    <table width="100%" cellpadding="0" cellspacing="0">${newsHTML}</table>
  </td></tr>

  <!-- New Research -->
  <tr><td style="padding:0 28px 20px">
    <div style="font-size:16px;font-weight:700;color:#06382A;border-bottom:2px solid #0F7B5A;padding-bottom:6px;margin-bottom:4px">🔬 New Research Today</div>
    <table width="100%" cellpadding="0" cellspacing="0">${articlesHTML}</table>
  </td></tr>

  <!-- Games -->
  <tr><td style="padding:16px 28px;background:#E0F5EE">
    <div style="font-size:14px;font-weight:700;color:#06382A;margin-bottom:6px">🎮 Daily Games</div>
    <div style="font-size:12px;color:#06382A">${sudokuHint}</div>
    <div style="margin-top:8px">
      <a href="https://kmwood45-ctrl.github.io/physioandnews/" style="background:#0F7B5A;color:#fff;padding:8px 18px;border-radius:6px;text-decoration:none;font-size:12px;font-weight:600">Open Hub →</a>
    </div>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:16px 28px;background:#f5f5f0;text-align:center">
    <div style="font-size:10px;color:#999">CF &amp; Physio Research Hub · Toronto, Canada</div>
    <div style="font-size:10px;color:#999;margin-top:4px">
      To unsubscribe, reply with "unsubscribe" or visit the hub's email settings.
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

// ── Cron: 6:00 AM Toronto — fetch data ───────────────────────────────────────
cron.schedule('0 6 * * *', () => {
  log('Cron: 6:00 AM — running daily update');
  runDailyUpdate();
}, { timezone:'America/Toronto' });

// ── Cron: 7:00 AM Toronto — send email digest ────────────────────────────────
cron.schedule('0 7 * * *', () => {
  log('Cron: 7:00 AM — sending email digest');
  sendDigestEmails();
}, { timezone:'America/Toronto' });

// ── Startup fetch if today's data missing ─────────────────────────────────────
if (!readJSON(`${todayKey()}.json`)) {
  log('No data for today — fetching in 10s...');
  setTimeout(runDailyUpdate, 10000);
} else {
  const d = readJSON(`${todayKey()}.json`);
  log(`Today's data present (${d?.generatedAtToronto||'unknown'})`);
}

app.listen(PORT, '0.0.0.0', () => {
  log(`Server on :${PORT}`);
  log(`Anthropic key: ${API_KEY?'SET ✓':'NOT SET'}`);
  log(`Resend key:    ${RESEND_KEY?'SET ✓':'NOT SET'}`);
  log(`Subscribers:   ${getSubscribers().length}`);
});

process.on('uncaughtException', err => { log(`Uncaught: ${err.message}`); console.error(err.stack); });
process.on('unhandledRejection', r  => { log(`Rejection: ${r}`); });
