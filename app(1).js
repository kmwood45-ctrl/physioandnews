'use strict';

// ── CONFIG ────────────────────────────────────────────────────────────────────
// Detects whether we're on GitHub Pages (needs Railway URL) or Railway itself (relative)
const RAILWAY_URL = (() => {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return '';
  if (host.includes('github.io')) {
    // *** REPLACE THIS with your actual Railway URL after deploying ***
    return 'https://physioandnews-production.up.railway.app';
  }
  return ''; // same-origin when served from Railway
})();

const TODAY       = new Date();
const DAY_OF_YEAR = Math.floor((TODAY - new Date(TODAY.getFullYear(), 0, 0)) / 86400000);

// ── BOOT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderDate();
  buildStaticContent();
  fetchServerData();
});

function renderDate() {
  const el = document.getElementById('hdr-date');
  if (el) el.textContent = TODAY.toLocaleDateString('en-CA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ── TABS ──────────────────────────────────────────────────────────────────────
const TABS = ['cf','trikafta','airway','nacfc','pt','msk','pain','auto','news','games','email'];
let newsLoaded   = false;
let nacfcBuilt   = false;

function goTab(t) {
  document.querySelectorAll('.sec').forEach(s => s.classList.remove('on'));
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('on'));
  document.getElementById('sec-' + t)?.classList.add('on');
  const tabs = document.querySelectorAll('.tab');
  const idx  = TABS.indexOf(t);
  if (tabs[idx]) tabs[idx].classList.add('on');
  if (t === 'news')  loadNewsTab();
  if (t === 'nacfc' && !nacfcBuilt) { nacfcBuilt = true; renderNACFC(); }
  if (t === 'games') setTimeout(() => { if (typeof buildCrossword === 'function' && !document.getElementById('cw-grid')) buildCrossword(); }, 150);
}

// ── SERVER DATA ───────────────────────────────────────────────────────────────
let serverData  = null;
let cachedNews  = [];

async function fetchServerData() {
  const updateEl = document.getElementById('hdr-update');
  try {
    const res = await fetch(`${RAILWAY_URL}/api/today`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    serverData = await res.json();

    if (!serverData.generated) {
      if (updateEl) updateEl.textContent = 'Daily update pending — runs at 6:00 AM Toronto';
      return;
    }

    // ① New research articles → prepend to each section
    ['cf','trikafta','airway','pt','msk','pain','auto'].forEach(sec => {
      const arts = serverData.articles?.[sec] || [];
      if (arts.length) prependNewArticles(sec, arts);
    });

    // ② Dynamic teaching points from today's papers
    Object.entries(serverData.teachingPoints || {}).forEach(([sec, tp]) => {
      setBanner(sec, `<strong>🔴 Live Teaching Point</strong><br>${tp}`, true);
    });

    // ③ Cache news
    if (serverData.news?.length) {
      cachedNews = serverData.news;
      // If news tab is open, refresh it immediately
      if (document.getElementById('sec-news')?.classList.contains('on')) renderNews(cachedNews);
    }

    // ④ Timestamp
    if (updateEl) {
      const t = serverData.generatedAtToronto || serverData.generatedAt;
      updateEl.textContent = `Updated: ${fmtTime(t)}`;
    }

    console.log(`[Hub] Server: ${Object.values(serverData.articles||{}).flat().length} new articles, ${serverData.news?.length||0} stories`);

  } catch (e) {
    console.warn('[Hub] Server unreachable:', e.message);
    if (updateEl) updateEl.textContent = 'Using cached data (server offline?)';
  }
}

function fmtTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-CA', {
      month:'short', day:'numeric', hour:'2-digit', minute:'2-digit',
      timeZone:'America/Toronto'
    }) + ' ET';
  } catch { return iso.slice(0,16); }
}

function prependNewArticles(sec, arts) {
  const grid = document.getElementById('grid-' + sec);
  if (!grid || !arts.length) return;

  // Remove any previous "new today" section
  grid.querySelectorAll('.new-today-banner,.daily-new-articles').forEach(el => el.remove());

  const banner = document.createElement('div');
  banner.className = 'new-today-banner';
  banner.innerHTML = `<span>🆕 New today from PubMed — ${arts.length} article${arts.length>1?'s':''}</span>`;

  const wrapper = document.createElement('div');
  wrapper.className = 'daily-new-articles';
  wrapper.innerHTML = arts.map(a => makeCard({...a, isNew:true})).join('');

  grid.prepend(wrapper);
  grid.prepend(banner);
}

// ── ARCHIVE ───────────────────────────────────────────────────────────────────
async function toggleArchive(sec) {
  const panel = document.getElementById('archive-' + sec);
  if (!panel) return;
  if (panel.style.display !== 'none') { panel.style.display = 'none'; return; }
  panel.style.display = 'block';
  panel.innerHTML = '<div class="archive-loading">Loading archive…</div>';

  try {
    const res   = await fetch(`${RAILWAY_URL}/api/archive`, { signal: AbortSignal.timeout(8000) });
    const dates = await res.json();
    if (!Array.isArray(dates) || !dates.length) {
      panel.innerHTML = '<div class="archive-entry">No archived dates yet — builds daily after 6 AM.</div>';
      return;
    }
    panel.innerHTML = `
      <div class="archive-header">
        <strong>📁 Daily Archive — ${dates.length} days stored (last 30)</strong>
        <span style="font-size:10px;color:var(--muted)">Click a date to view that day's articles</span>
      </div>
      <div class="archive-dates">
        ${dates.map(d => `<button class="archive-date-btn" onclick="loadArchiveDate('${sec}','${d}')">${fmtDate(d)}</button>`).join('')}
      </div>`;
  } catch {
    panel.innerHTML = '<div class="archive-entry">Archive unavailable — server starting up?</div>';
  }
}

function fmtDate(s) {
  try { return new Date(s + 'T12:00:00').toLocaleDateString('en-CA', {weekday:'short',month:'short',day:'numeric',year:'numeric'}); }
  catch { return s; }
}

async function loadArchiveDate(sec, date) {
  const panel = document.getElementById('archive-' + sec);
  panel.innerHTML = `<div class="archive-loading">Loading ${fmtDate(date)}…</div>`;
  try {
    const res  = await fetch(`${RAILWAY_URL}/api/archive/${date}`, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    const arts = data.articles?.[sec] || [];
    if (!arts.length) {
      panel.innerHTML = `<div class="archive-entry">No ${sec} articles for ${fmtDate(date)}.</div>
        <button class="archive-date-btn" onclick="toggleArchive('${sec}')">← Back</button>`;
      return;
    }
    panel.innerHTML = `
      <div class="archive-header">
        <strong>📅 ${fmtDate(date)} — ${arts.length} articles</strong>
        <button class="archive-date-btn" onclick="toggleArchive('${sec}')">← Back</button>
      </div>
      <div class="art-grid">${arts.map(a => makeCard(a)).join('')}</div>`;
  } catch {
    panel.innerHTML = `<div class="archive-entry">Error loading date.</div>
      <button class="archive-date-btn" onclick="toggleArchive('${sec}')">← Back</button>`;
  }
}

// ── ARTICLE CARDS ─────────────────────────────────────────────────────────────
const RMAP = { ca:['🍁 Canadian','b-ca'], au:['🦘 Australian','b-au'], us:['🇺🇸 American','b-us'], ww:['🌐 Worldwide','b-ww'] };

function makeCitation(a) {
  const link = a.doi
    ? `doi:<a href="https://doi.org/${a.doi}" target="_blank" style="color:var(--teal);word-break:break-all">${a.doi}</a>`
    : (a.pubmedUrl ? `<a href="${a.pubmedUrl}" target="_blank" style="color:var(--teal)">View on PubMed</a>` : '');
  const vol  = a.vol   ? `;${a.vol}`            : '';
  const iss  = a.issue ? `(${a.issue})`          : '';
  const pgs  = a.pages ? `:${a.pages}`           : '';
  const cites = a.c    ? `<span class="cite-count">📚 ${Number(a.c).toLocaleString()} citations</span>` : '';
  return `<div class="art-cite-block">
    <strong>Citation:</strong> ${a.authors||''}. ${a.title||''}.
    <em>${a.journal||''}</em>. ${a.year||''}${vol}${iss}${pgs}. ${link} ${cites}
  </div>`;
}

function makeCard(art) {
  const [rl, rc] = RMAP[art.r] || ['🌐 Worldwide','b-ww'];
  const uid      = 'ai-' + Math.random().toString(36).slice(2, 9);
  const newBadge = art.isNew ? '<span class="badge b-new">🆕 New</span>' : '';
  const aiBlock  = art.ai
    ? `<div class="ai-sum-wrap"><div class="ai-sum-lbl">AI Clinical Summary</div>${art.ai}</div>`
    : `<button class="ai-btn" onclick="genAI(this,'${uid}',${JSON.stringify(art.title||'')},${JSON.stringify(art.abs||art.abstract||'')})">✦ AI Summary</button>
       <div class="ai-sum-wrap" id="${uid}" style="display:none;"></div>`;
  const teach = art.teach
    ? `<div class="teach-block"><div class="teach-lbl">📖 Teaching Point</div>${art.teach}</div>` : '';
  return `<div class="acard" data-r="${art.r||'ww'}" data-cat="${art.cat||'all'}" data-new="${!!art.isNew}">
    <div class="acard-top"><div class="badges"><span class="badge ${rc}">${rl}</span>${newBadge}</div></div>
    <div class="art-title">${art.title||'Untitled'}</div>
    <div class="art-meta">${art.authors||''} · <em>${art.journal||''}</em> · ${art.year||''}</div>
    ${makeCitation(art)}
    <div class="art-abs">${art.abs||art.abstract||''}</div>
    ${teach}${aiBlock}
  </div>`;
}

async function genAI(btn, id, title, abs) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML = '<div class="ai-sum-lbl">AI Clinical Summary</div><em style="color:var(--muted)">Generating…</em>';
  btn.style.display = 'none';
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:280,
        messages:[{role:'user',content:`Physiotherapy educator. 3 sentences: what should physios DO differently based on this research? Concrete only.\n\nTitle: "${title}"\nAbstract: "${abs}"`}]
      })
    });
    const d = await r.json();
    el.innerHTML = '<div class="ai-sum-lbl">AI Clinical Summary</div>' + (d.content?.[0]?.text || 'Unavailable.');
  } catch { el.innerHTML = '<div class="ai-sum-lbl">AI Clinical Summary</div>Unavailable — API key needed.'; }
}

// ── FILTER ────────────────────────────────────────────────────────────────────
function filterChip(el, sec, val) {
  el.closest('.chips').querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
  document.getElementById('grid-' + sec)?.querySelectorAll('.acard').forEach(card => {
    const show = val==='all' || card.dataset.r===val || card.dataset.cat===val || (val==='new' && card.dataset.new==='true');
    card.style.display = show ? '' : 'none';
  });
}
function acFilter(el, val) {
  el.closest('.chips').querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
  const bp = document.getElementById('ac-bp-panel');
  if (bp) bp.style.display = (val==='all'||val==='bp') ? 'block' : 'none';
  document.getElementById('grid-airway')?.querySelectorAll('.acard').forEach(card => {
    card.style.display = (val==='all'||val==='bp'||card.dataset.cat===val) ? '' : 'none';
  });
}

// ── TEACHING BANNERS ─────────────────────────────────────────────────────────
function setBanner(sec, html, isLive) {
  const el = document.getElementById('teach-' + sec);
  if (!el) return;
  el.innerHTML = html;
  el.style.cssText = `background:${isLive?'var(--teal-lt)':'var(--amber-lt)'};border:1px solid rgba(${isLive?'15,123,90':'176,106,16'},.2);border-radius:8px;padding:12px 14px;font-size:12px;line-height:1.6;margin-bottom:14px;color:${isLive?'var(--teal-dk)':'var(--amber-dk)'};`;
}

// ── STATIC CONTENT ────────────────────────────────────────────────────────────
function buildStaticContent() {
  // Research grids
  ['cf','trikafta','airway','pt','msk','pain','auto'].forEach(k => {
    const grid = document.getElementById('grid-' + k);
    if (grid && typeof ARTS !== 'undefined' && ARTS[k]) {
      grid.innerHTML = [...ARTS[k]].sort((a,b)=>(b.c||0)-(a.c||0)).map(makeCard).join('');
    }
  });

  // Teaching banners from modalities_data.js
  if (typeof TEACHING_POINTS !== 'undefined') {
    Object.entries(TEACHING_POINTS).forEach(([sec, pts]) => {
      const arr = Array.isArray(pts) ? pts : [pts];
      const tp  = arr[DAY_OF_YEAR % arr.length];
      if (tp) setBanner(sec, `<strong>📖 ${tp.title}</strong><br>${tp.body}<br><em style="font-size:10px">Source: ${tp.source}</em>`, false);
    });
  }

  buildAirwayBP();
  buildMSK();
  buildSudoku();
  buildWordle();
}

function buildAirwayBP() {
  const el = document.getElementById('ac-bp-grid');
  if (!el || typeof AC_BEST_PRACTICES === 'undefined') return;
  el.innerHTML = AC_BEST_PRACTICES.map(bp => `
    <div class="bp-card">
      <div class="bp-card-title">${bp.title}</div>
      <div class="bp-card-body">${bp.body}</div>
      <div class="bp-card-ev">${bp.ev}</div>
    </div>`).join('');
}

// ── MSK ───────────────────────────────────────────────────────────────────────
function buildMSK() {
  let pi = DAY_OF_YEAR % ((typeof MSK_PEARLS!=='undefined') ? MSK_PEARLS.length : 1);

  function renderP(idx) {
    const p = MSK_PEARLS?.[idx]; const el = document.getElementById('daily-pearl'); if (!el||!p) return;
    el.innerHTML = `<div class="pearl-date">💡 Pearl ${idx+1}/${MSK_PEARLS.length} · ${TODAY.toLocaleDateString('en-CA',{weekday:'long',month:'long',day:'numeric'})}</div>
      <div class="pearl-title">${p.title}</div><div class="pearl-body">${p.body}</div>
      <div class="pearl-source">Source: ${p.source}</div>
      <div class="pearl-nav">
        <button class="pearl-btn" onclick="this.closest('#daily-pearl')||document.getElementById('daily-pearl');navP(-1)">← Prev</button>
        <button class="pearl-btn" onclick="navP(1)">Next →</button>
      </div>`;
  }
  window.navP = d => { pi=(pi+d+MSK_PEARLS.length)%MSK_PEARLS.length; renderP(pi); };
  window.navPearl = window.navP;
  renderP(pi);

  // All pearls grid
  const pg = document.getElementById('pearls-grid');
  if (pg && typeof MSK_PEARLS!=='undefined') {
    pg.innerHTML = MSK_PEARLS.map((p,i)=>`<div class="pearl-item"><div class="pi-num">Pearl ${i+1}</div><div class="pi-title">${p.title}</div><div class="pi-body">${p.body}</div><div class="pi-src">Source: ${p.source}</div></div>`).join('');
  }

  // Joint nav
  const jn = document.getElementById('joint-nav');
  if (jn && typeof JOINTS!=='undefined') {
    jn.innerHTML = Object.entries(JOINTS).map(([k,j])=>`<button class="joint-btn" onclick="showJoint('${k}',this)">${j.icon} ${j.name}</button>`).join('');
  }

  // RTS
  const rg = document.getElementById('rts-grid');
  if (rg && typeof RTS_PROTOCOLS!=='undefined') {
    rg.innerHTML = RTS_PROTOCOLS.map(p=>`<div class="pcard"><div class="pcard-hdr"><div class="pcard-title">${p.title}</div><div class="phase-badge ${p.pc}">${p.phase}</div></div><div class="phases">${p.phases.map(ph=>`<div class="phase-row"><div class="phase-num">${ph.n}</div><div class="phase-content"><strong>${ph.t}:</strong> ${ph.d}</div></div>`).join('')}</div><div class="evidence-row"><strong>Evidence:</strong> ${p.ev}</div></div>`).join('');
  }

  // Modalities with parameters
  const mg = document.getElementById('mod-grid');
  if (mg && typeof MODALITIES!=='undefined') {
    mg.innerHTML = MODALITIES.map(m=>`<div class="mod-card">
      <div class="mod-icon">${m.icon}</div><div class="mod-name">${m.name}</div>
      <span class="mod-ev ${m.ec}">Evidence ${m.ev}</span>
      <div class="mod-desc">${m.desc}</div>
      ${m.params?`<div class="mod-params">${m.params.map(p=>`<div class="param-row"><span class="param-label">${p.label}:</span> <span class="param-value">${p.value}</span></div>`).join('')}</div>`:''}
      ${m.contra?`<div class="param-contra"><strong>⚠ Contraindications:</strong> ${m.contra}</div>`:''}
    </div>`).join('');
  }

  // Assessment
  const ag = document.getElementById('assess-grid');
  if (ag && typeof ASSESS_TOOLS!=='undefined') {
    ag.innerHTML = ASSESS_TOOLS.map(t=>`<div class="assess-card"><div class="assess-name">${t.name}</div><div class="assess-joint">${t.joint}</div><div class="assess-body">${t.body}</div><div class="assess-mdcic">${t.mcid}</div></div>`).join('');
  }
}

function showJoint(key, btn) {
  document.querySelectorAll('.joint-btn').forEach(b=>b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  const j = typeof JOINTS!=='undefined' ? JOINTS[key] : null; if (!j) return;
  document.getElementById('joint-content').innerHTML=`<div class="joint-section"><div class="joint-title">${j.icon} ${j.name}</div><div class="joint-grid">${j.conditions.map(c=>`<div class="jcard"><div class="jcard-title">${c.name}</div><div style="font-size:11px;color:var(--teal);font-weight:600;margin-bottom:4px">${c.title}</div><div class="jcard-body">${c.body}</div><span class="jcard-ev ${c.ev}">${c.ev==='ev-a'?'A':c.ev==='ev-b'?'B':'C'}</span></div>`).join('')}</div></div>`;
}

function mskFilter(el, val) {
  document.querySelectorAll('#msk-chips .chip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
  ['pearls','joint','rts','modalities','assess','research'].forEach(p=>{
    const pe=document.getElementById('msk-'+p+'-panel');
    if (pe) pe.style.display=(val==='all'||val===p)?'block':'none';
  });
}

// ── NACFC ─────────────────────────────────────────────────────────────────────
function nacfcFilter(el, val) {
  document.querySelectorAll('#nacfc-chips .chip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
  document.querySelectorAll('.nacfc-card').forEach(card=>{
    card.style.display=(val==='all'||card.dataset.year===val||card.dataset.type===val||card.dataset.tag===val)?'':'none';
  });
}
function renderNACFC() {
  const grid=document.getElementById('nacfc-grid');
  if (!grid||typeof NACFC_DATA==='undefined') return;
  grid.innerHTML=NACFC_DATA.map(n=>{
    const ti=n.type==='video'?'📹':n.type==='abstract'?'📄':'🎤';
    const tc=n.tag==='keynote'?'b-ca':n.tag==='abstract'?'b-us':'b-ww';
    return `<div class="nacfc-card acard" data-year="${n.year}" data-type="${n.type}" data-tag="${n.tag}">
      <div class="acard-top"><div class="badges"><span class="badge ${tc}">${ti} ${n.tag.toUpperCase()}</span><span class="badge b-ww">NACFC ${n.year}</span></div></div>
      <div class="art-title">${n.title}</div>
      <div class="art-meta"><strong>${n.speaker}</strong> · ${n.role}</div>
      <div class="art-abs">${n.abstract}</div>
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
        <a href="${n.youtube}" target="_blank" class="nacfc-link yt-link">📹 YouTube</a>
        <a href="${n.pubmed}" target="_blank" class="nacfc-link pm-link">🔬 PubMed</a>
      </div>
    </div>`;
  }).join('');
}

// ── NEWS ──────────────────────────────────────────────────────────────────────
function loadNewsTab() {
  if (cachedNews.length > 0) { renderNews(cachedNews); return; }
  if (serverData?.news?.length > 0) { cachedNews = serverData.news; renderNews(cachedNews); return; }

  const box = document.getElementById('news-container');
  if (!box) return;
  box.innerHTML = `<div class="loading-news">Loading today's news…<br>
    <small style="color:var(--muted);display:block;margin-top:8px">
      News refreshes daily at 6:00 AM Toronto time.
      <button class="news-refresh" onclick="forceFetchNews()" style="margin-left:8px">⟳ Fetch now</button>
    </small></div>`;

  // Try re-fetching server in case it was slow on load
  fetch(`${RAILWAY_URL}/api/today`,{signal:AbortSignal.timeout(12000)})
    .then(r=>r.json()).then(d=>{
      if (d.news?.length) { cachedNews=d.news; renderNews(cachedNews); }
      else showNewsNotReady();
    }).catch(showNewsNotReady);
}

function showNewsNotReady() {
  const box = document.getElementById('news-container'); if (!box) return;
  box.innerHTML=`<div class="news-err">
    <strong>Today's news not yet fetched.</strong><br>
    The server auto-fetches at 6:00 AM Toronto daily.<br><br>
    <button class="news-refresh" onclick="forceFetchNews()">⟳ Trigger fetch now (takes ~30 sec)</button>
  </div>`;
}

async function forceFetchNews() {
  const box = document.getElementById('news-container'); if (!box) return;
  box.innerHTML='<div class="loading-news">Fetching world news now… (~30 seconds)…</div>';
  try {
    await fetch(`${RAILWAY_URL}/api/refresh`,{method:'POST',signal:AbortSignal.timeout(5000)});
    setTimeout(async()=>{
      await fetchServerData();
      if (cachedNews.length) renderNews(cachedNews); else showNewsNotReady();
    }, 38000);
  } catch {
    box.innerHTML='<div class="news-err">Cannot reach server. Is Railway deployed and running?<br><a href="'+RAILWAY_URL+'/health" target="_blank">Check /health</a></div>';
  }
}

const SRC_CLR = {'New York Times':'#1452A8','Washington Post':'#C01818','Reuters':'#FF6B00','Financial Times':'#990F3D','FiveThirtyEight':'#4B3DAE','The Athletic':'#1A1A2E','CBC':'#E61924','BBC':'#C01818','The Economist':'#E3120B','Toronto Star':'#D4001F','AP':'#B91C1C','AP News':'#B91C1C'};
function sColor(s){for(const k in SRC_CLR) if(s&&s.includes(k)) return SRC_CLR[k]; return '#B91C1C';}

function renderNews(stories) {
  const box=document.getElementById('news-container'); if(!box||!stories?.length){showNewsNotReady();return;}
  const fc=(s,big)=>{const c=sColor(s.source||'');
    return big
      ? `<div class="news-featured" data-src="${s.source||''}" data-cat="${s.category||''}">
          <div class="nf-source-row"><span class="nf-source" style="color:${c}">${s.source||''}</span><span class="nf-category">${(s.category||'').toUpperCase()}</span></div>
          ${s.published?`<div class="nf-published">📅 ${s.published}</div>`:''}
          ${s.authors?`<div class="nf-authors">${s.authors}</div>`:''}
          <div class="nf-title">${s.title||''}</div>
          ${s.opening?`<div class="nf-opening">"${s.opening}"</div>`:''}
          <div class="nf-desc">${s.summary||''}</div>
          <a href="${s.url||'#'}" target="_blank" class="nf-link">Read at ${s.source} →</a>
        </div>`
      : `<div class="nitem" data-src="${s.source||''}" data-cat="${s.category||''}">
          <div class="nitem-src" style="color:${c}">${s.source||''}</div>
          ${s.published?`<div style="font-size:10px;color:var(--muted)">📅 ${s.published}</div>`:''}
          ${s.authors?`<div style="font-size:10px;color:var(--muted);font-style:italic">${s.authors}</div>`:''}
          <div class="nitem-title">${s.title||''}</div>
          ${s.opening?`<div class="nitem-opening">"${s.opening}"</div>`:''}
          <div class="nitem-desc">${s.summary||''}</div>
          <a href="${s.url||'#'}" target="_blank" class="nitem-link">Read at ${s.source} →</a>
        </div>`;};
  box.innerHTML=`<div class="news-meta">📅 ${serverData?.generatedAtToronto?fmtTime(serverData.generatedAt):'Today'} · ${stories.length} stories</div>
    <div class="news-layout">
      <div class="news-main-col">${stories.slice(0,3).map(s=>fc(s,true)).join('')}<div class="news-list" style="margin-top:10px">${stories.slice(5).map(s=>fc(s,false)).join('')}</div></div>
      <div class="news-side-col"><div class="news-list">${stories.slice(3,5).map(s=>fc(s,false)).join('')}</div></div>
    </div>`;
}

function filterNews(el,val){
  document.querySelectorAll('.src-chip').forEach(c=>c.classList.remove('on'));el.classList.add('on');
  document.querySelectorAll('.news-featured,.nitem').forEach(item=>{
    const cat=(item.dataset.cat||'').toLowerCase(),src=(item.dataset.src||'').toLowerCase();
    item.style.display=(val==='all'||cat.includes(val)||src.includes(val))?'':'none';
  });
}

// ── SUDOKU (rotates daily) ────────────────────────────────────────────────────
const SDK_BANK=[
  {puz:[[0,0,0,2,6,0,7,0,1],[6,8,0,0,7,0,0,9,0],[1,9,0,0,0,4,5,0,0],[8,2,0,1,0,0,0,4,0],[0,0,4,6,0,2,9,0,0],[0,5,0,0,0,3,0,2,8],[0,0,9,3,0,0,0,7,4],[0,4,0,0,5,0,0,3,6],[7,0,3,0,1,8,0,0,0]],sol:[[4,3,5,2,6,9,7,8,1],[6,8,2,5,7,1,4,9,3],[1,9,7,8,3,4,5,6,2],[8,2,6,1,9,5,3,4,7],[3,7,4,6,8,2,9,1,5],[9,5,1,7,4,3,6,2,8],[5,1,9,3,2,6,8,7,4],[2,4,8,9,5,7,1,3,6],[7,6,3,4,1,8,2,5,9]]},
  {puz:[[0,2,0,0,0,0,0,0,0],[0,0,0,6,0,0,0,0,3],[0,7,4,0,8,0,0,0,0],[0,0,0,0,0,3,0,0,2],[0,8,0,0,4,0,0,1,0],[6,0,0,5,0,0,0,0,0],[0,0,0,0,1,0,7,8,0],[5,0,0,0,0,9,0,0,0],[0,0,0,0,0,0,0,4,0]],sol:[[1,2,6,4,3,7,9,5,8],[8,9,5,6,2,1,4,7,3],[3,7,4,9,8,5,1,2,6],[4,5,7,1,9,3,8,6,2],[9,8,3,2,4,6,5,1,7],[6,1,2,5,7,8,3,9,4],[2,6,9,3,1,4,7,8,5],[5,4,8,7,6,9,2,3,1],[7,3,1,8,5,2,6,4,9]]},
  {puz:[[8,0,0,0,0,0,0,0,0],[0,0,3,6,0,0,0,0,0],[0,7,0,0,9,0,2,0,0],[0,5,0,0,0,7,0,0,0],[0,0,0,0,4,5,7,0,0],[0,0,0,1,0,0,0,3,0],[0,0,1,0,0,0,0,6,8],[0,0,8,5,0,0,0,1,0],[0,9,0,0,0,0,4,0,0]],sol:[[8,1,2,7,5,3,6,4,9],[9,4,3,6,8,2,1,7,5],[6,7,5,4,9,1,2,8,3],[1,5,4,2,3,7,8,9,6],[3,6,9,8,4,5,7,2,1],[2,8,7,1,6,9,5,3,4],[5,2,1,9,7,4,3,6,8],[4,3,8,5,2,6,9,1,7],[7,9,6,3,1,8,4,5,2]]},
];
const SDK = SDK_BANK[DAY_OF_YEAR % SDK_BANK.length];
let sdkSel=null, sdkUG=SDK.puz.map(r=>[...r]);

function buildSudoku(){
  const g=document.getElementById('sdk-grid');if(!g)return;g.innerHTML='';
  for(let r=0;r<9;r++)for(let c=0;c<9;c++){
    const d=document.createElement('div');d.className='sdk-cell';
    if(SDK.puz[r][c]){d.textContent=SDK.puz[r][c];d.classList.add('given');}
    if(c===2||c===5)d.classList.add('br');if(r===2||r===5)d.classList.add('bb');
    d.dataset.r=r;d.dataset.c=c;d.onclick=()=>sdkSel2(r,c,d);g.appendChild(d);
  }
  const np=document.getElementById('numpad');if(!np)return;np.innerHTML='';
  for(let n=1;n<=9;n++){const b=document.createElement('button');b.className='np-btn';b.textContent=n;b.onclick=()=>sdkEnt(n);np.appendChild(b);}
  document.addEventListener('keydown',e=>{if(!document.getElementById('sec-games')?.classList.contains('on'))return;if(e.key>='1'&&e.key<='9')sdkEnt(+e.key);if(e.key==='Backspace')sdkClr();});
}
function sdkSel2(r,c,el){document.querySelectorAll('.sdk-cell').forEach(x=>x.classList.remove('sel','peer'));if(SDK.puz[r][c])return;sdkSel={r,c};el.classList.add('sel');document.querySelectorAll('.sdk-cell').forEach(x=>{const xr=+x.dataset.r,xc=+x.dataset.c;if((xr===r||xc===c||(Math.floor(xr/3)===Math.floor(r/3)&&Math.floor(xc/3)===Math.floor(c/3)))&&!(xr===r&&xc===c))x.classList.add('peer');});}
function sdkEnt(n){if(!sdkSel)return;const{r,c}=sdkSel;sdkUG[r][c]=n;const cs=document.querySelectorAll('.sdk-cell');cs[r*9+c].textContent=n;cs[r*9+c].classList.remove('err');cs[r*9+c].classList.add('ui');}
function sdkClr(){if(!sdkSel)return;const{r,c}=sdkSel;if(SDK.puz[r][c])return;sdkUG[r][c]=0;const cs=document.querySelectorAll('.sdk-cell');cs[r*9+c].textContent='';cs[r*9+c].classList.remove('err','ui');}
function sdkClear(){sdkClr();}
function sdkCheck(){let e=0;const cs=document.querySelectorAll('.sdk-cell');for(let r=0;r<9;r++)for(let c=0;c<9;c++){const i=r*9+c;if(!SDK.puz[r][c]&&sdkUG[r][c]){if(sdkUG[r][c]!==SDK.sol[r][c]){cs[i].classList.add('err');e++;}else cs[i].classList.remove('err');}}const m=document.getElementById('sdk-msg');if(e===0&&sdkUG.every((row,r)=>row.every((v,c)=>v===SDK.sol[r][c])))m.textContent='🎉 Solved!';else if(e)m.textContent=e+' error(s)';else m.textContent='Looking good!';}
function sdkHint(){for(let r=0;r<9;r++)for(let c=0;c<9;c++){if(!SDK.puz[r][c]&&sdkUG[r][c]!==SDK.sol[r][c]){sdkUG[r][c]=SDK.sol[r][c];const cs=document.querySelectorAll('.sdk-cell');cs[r*9+c].textContent=SDK.sol[r][c];cs[r*9+c].classList.add('ui');cs[r*9+c].classList.remove('err');document.getElementById('sdk-msg').textContent='Hint!';return;}}}
function sdkSolve(){for(let r=0;r<9;r++)for(let c=0;c<9;c++)if(!SDK.puz[r][c]){sdkUG[r][c]=SDK.sol[r][c];const cs=document.querySelectorAll('.sdk-cell');cs[r*9+c].textContent=SDK.sol[r][c];cs[r*9+c].classList.add('ui');}document.getElementById('sdk-msg').textContent='Solved — new puzzle tomorrow!';}

// ── WORDLE (rotates daily) ────────────────────────────────────────────────────
const WL_BANK=['MAPLE','GRAIN','BLEND','CRISP','PLUME','DRAPE','FLINT','GROVE','SHEEN','BLAZE','CREST','DWARF','FROZE','GLIDE','HENCE','INFER','KNEEL','LANCE','MIRTH','NOTCH','OPTIC','PERCH','QUIRK','RIVET','SCOFF','TRITE','UNIFY','VOUCH','WRECK','YEARN','ABIDE','BROTH','CHIDE','DUCHY','ENACT','FJORD','GLEAN','HOIST','IDYLL','JOUST'];
const WL_WORD=WL_BANK[DAY_OF_YEAR%WL_BANK.length];
let wlGuesses=[],wlCur='',wlDone=false;
function buildWordle(){
  const board=document.getElementById('wl-board');if(!board)return;board.innerHTML='';
  for(let g=0;g<6;g++){const row=document.createElement('div');row.className='wl-row';row.id='wrow-'+g;for(let l=0;l<5;l++){const t=document.createElement('div');t.className='wl-tile';t.id=`wt-${g}-${l}`;row.appendChild(t);}board.appendChild(row);}
  const kb=document.getElementById('wl-kb');if(!kb)return;
  [['Q','W','E','R','T','Y','U','I','O','P'],['A','S','D','F','G','H','J','K','L'],['ENTER','Z','X','C','V','B','N','M','DEL']].forEach(row=>{const r=document.createElement('div');r.className='kb-r';row.forEach(k=>{const b=document.createElement('button');b.className='kb-k'+(k==='ENTER'||k==='DEL'?' wide':'');b.textContent=k==='DEL'?'⌫':k;b.dataset.key=k;b.onclick=()=>wlH(k);r.appendChild(b);});kb.appendChild(r);});
  document.addEventListener('keydown',e=>{if(!document.getElementById('sec-games')?.classList.contains('on'))return;if(e.key==='Enter')wlH('ENTER');else if(e.key==='Backspace')wlH('DEL');else if(/^[a-zA-Z]$/.test(e.key))wlH(e.key.toUpperCase());});
}
function wlH(k){if(wlDone)return;if(k==='DEL')wlCur=wlCur.slice(0,-1);else if(k==='ENTER'){if(wlCur.length<5){document.getElementById('wl-msg').textContent='Need 5 letters';return;}wlSub();return;}else if(wlCur.length<5)wlCur+=k;const g=wlGuesses.length;for(let l=0;l<5;l++){const t=document.getElementById(`wt-${g}-${l}`);if(t){t.textContent=wlCur[l]||'';t.className='wl-tile'+(wlCur[l]?' filled':'');}}}
function wlSub(){const guess=wlCur,g=wlGuesses.length,res=Array(5).fill('absent'),used=Array(5).fill(false),ans=WL_WORD.split('');for(let i=0;i<5;i++)if(guess[i]===ans[i]){res[i]='correct';used[i]=true;}for(let i=0;i<5;i++)if(res[i]!=='correct')for(let j=0;j<5;j++)if(!used[j]&&guess[i]===ans[j]){res[i]='present';used[j]=true;break;}for(let l=0;l<5;l++){const t=document.getElementById(`wt-${g}-${l}`);if(t)t.className='wl-tile '+res[l];const kb=document.querySelector(`[data-key="${guess[l]}"]`);if(kb){if(res[l]==='correct')kb.className='kb-k correct';else if(res[l]==='present'&&!kb.classList.contains('correct'))kb.className='kb-k present';else if(!kb.classList.contains('correct')&&!kb.classList.contains('present'))kb.className='kb-k absent';}}wlGuesses.push(guess);wlCur='';document.getElementById('wl-msg').textContent='';if(guess===WL_WORD){document.getElementById('wl-msg').textContent='🎉 Brilliant!';wlDone=true;}else if(wlGuesses.length===6){document.getElementById('wl-msg').textContent='Word: '+WL_WORD;wlDone=true;}}

// ── EMAIL ─────────────────────────────────────────────────────────────────────
function doSubscribe(){
  const em=document.getElementById('sub-em')?.value;
  if(!em||!em.includes('@')){alert('Please enter a valid email.');return;}
  fetch(`${RAILWAY_URL}/api/subscribe`,{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:em,deliveryTime:'06:00'})})
  .finally(()=>{document.getElementById('sub-ok').style.display='block';});
}
