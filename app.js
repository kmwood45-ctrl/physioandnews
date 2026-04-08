// ─── INIT ─────────────────────────────────────────────────────────────────────
const TODAY = new Date();
document.getElementById('hdr-date').textContent =
  TODAY.toLocaleDateString('en-CA', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

const TABS = ['cf','trikafta','airway','pt','msk','pain','auto','news','games','email'];
function goTab(t) {
  document.querySelectorAll('.sec').forEach(s => s.classList.remove('on'));
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('on'));
  document.getElementById('sec-' + t).classList.add('on');
  const idx = TABS.indexOf(t);
  const tabs = document.querySelectorAll('.tab');
  if (tabs[idx]) tabs[idx].classList.add('on');
  if (t === 'news' && !newsLoaded) loadNews();
  if (t === 'games') { setTimeout(()=>{ if(typeof buildCrossword==='function' && !document.getElementById('cw-grid')) buildCrossword(); }, 100); }
}

// ─── ARTICLE RENDERING ────────────────────────────────────────────────────────
const REGION_MAP = { ca:['🍁 Canadian','b-ca'], au:['🦘 Australian','b-au'], us:['🇺🇸 American','b-us'], ww:['🌐 Worldwide','b-ww'] };

function makeCard(art) {
  const [rl, rc] = REGION_MAP[art.r] || ['🌐','b-ww'];
  const aiId = 'ai-' + Math.random().toString(36).slice(2);
  const newBadge = art.isNew ? '<span class="badge b-new">🆕 New</span>' : '';
  const citeFull = `${art.authors}. ${art.title}. <em>${art.journal}</em>. ${art.year};${art.vol}${art.pages?':'+art.pages:''}. doi:<a href="https://doi.org/${art.doi}" target="_blank" class="art-link">${art.doi}</a>`;
  const aiBlock = art.ai
    ? `<div class="ai-sum-wrap" id="${aiId}"><div class="ai-sum-lbl">AI Clinical Summary</div>${art.ai}</div>`
    : `<button class="ai-btn" onclick="loadAISummary(this,'${aiId}',${JSON.stringify(art.title)},${JSON.stringify(art.abs)})">✦ Generate AI Summary</button><div class="ai-sum-wrap" id="${aiId}" style="display:none;"></div>`;
  return `<div class="acard" data-r="${art.r}" data-cat="${art.cat||'all'}" data-new="${art.isNew||false}">
    <div class="acard-top">
      <div class="badges"><span class="badge ${rc}">${rl}</span>${newBadge}</div>
      <span class="cites">📚 ${art.c.toLocaleString()} citations</span>
    </div>
    <div class="art-title">${art.title}</div>
    <div class="art-meta">${art.authors} · <em>${art.journal}</em> · ${art.year}</div>
    <div class="art-cite-block"><strong>Full citation:</strong> ${citeFull}</div>
    <div class="art-abs">${art.abs}</div>
    ${aiBlock}
  </div>`;
}

function populateGrid(id, key) {
  const el = document.getElementById(id);
  if (!el || !ARTS[key]) return;
  const sorted = [...ARTS[key]].sort((a, b) => b.c - a.c);
  el.innerHTML = sorted.map(makeCard).join('');
}
['cf','trikafta','airway','pt','msk','pain','auto'].forEach(k => populateGrid('grid-' + k, k));

// ─── AI SUMMARY ───────────────────────────────────────────────────────────────
async function loadAISummary(btn, id, title, abs) {
  const el = document.getElementById(id);
  el.style.display = 'block';
  el.innerHTML = '<div class="ai-sum-lbl">AI Clinical Summary</div><em style="color:var(--muted)">Generating…</em>';
  btn.style.display = 'none';
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:350,
        messages:[{ role:'user', content:`You are a clinical physiotherapy educator writing for practicing physiotherapists. In 3-4 concise sentences, summarise the direct clinical implications of this research. What should physiotherapists DO differently in their practice based on this evidence? Be concrete and actionable.\n\nArticle: "${title}"\nAbstract: "${abs}"` }]
      })
    });
    const data = await resp.json();
    el.innerHTML = '<div class="ai-sum-lbl">AI Clinical Summary</div>' + (data.content?.[0]?.text || 'Summary unavailable.');
  } catch(e) {
    el.innerHTML = '<div class="ai-sum-lbl">AI Clinical Summary</div>Summary currently unavailable.';
  }
}

// ─── FILTER FUNCTIONS ─────────────────────────────────────────────────────────
function filterChip(el, sec, val) {
  el.closest('.chips').querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
  document.getElementById('grid-' + sec).querySelectorAll('.acard').forEach(card => {
    const show = val === 'all'
      || card.dataset.r === val
      || card.dataset.cat === val
      || (val === 'new' && card.dataset.new === 'true');
    card.style.display = show ? '' : 'none';
  });
}

// ─── ARCHIVE ──────────────────────────────────────────────────────────────────
const ARCHIVES = {
  cf:       [{ date:'March 2025', title:'CF Registry 2021 Report', notes:'Previous year data — superseded by 2022 edition' }, { date:'Jan 2025', title:'ETI Safety Review 2020', notes:'Superseded by 3-year AURORA extension' }],
  trikafta: [{ date:'Feb 2025', title:'Ivacaftor monotherapy trials (2012–2018)', notes:'Archived — ETI is now standard for F508del patients' }],
  airway:   [{ date:'Feb 2025', title:'Head-down postural drainage studies (pre-2010)', notes:'Archived — gravity-assisted drainage now modified; head-down positions no longer routinely used' }],
  pt:       [{ date:'Jan 2025', title:'Pre-2020 telehealth reviews', notes:'Archived — superseded by post-COVID evidence base' }],
  pain:     [{ date:'Mar 2025', title:'Gate control theory original paper (Melzack & Wall, 1965)', notes:'Historical — foundational but superseded by modern neurophysiology' }],
  auto:     [],
};

function toggleArchive(sec) {
  const panel = document.getElementById('archive-' + sec);
  if (!panel) return;
  if (panel.style.display === 'none') {
    const entries = ARCHIVES[sec] || [];
    panel.innerHTML = `<h4>📁 Archived Research (${entries.length} entries)</h4>` +
      (entries.length ? entries.map(e => `<div class="archive-entry"><strong>${e.title}</strong> · ${e.date} — <em>${e.notes}</em></div>`).join('') : '<div class="archive-entry">No archived articles yet.</div>');
    panel.style.display = 'block';
  } else { panel.style.display = 'none'; }
}

// ─── AIRWAY CLEARANCE FILTER ──────────────────────────────────────────────────
function acFilter(el, val) {
  el.closest('.chips').querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
  const bp = document.getElementById('ac-bp-panel');
  if (bp) bp.style.display = (val === 'all' || val === 'bp') ? 'block' : 'none';
  document.getElementById('grid-airway').querySelectorAll('.acard').forEach(card => {
    if (val === 'all' || val === 'bp') { card.style.display = ''; return; }
    card.style.display = (card.dataset.cat === val) ? '' : 'none';
  });
}

// ─── BUILD AIRWAY BEST PRACTICES ──────────────────────────────────────────────
function buildAirwayBP() {
  const grid = document.getElementById('ac-bp-grid');
  if (!grid) return;
  grid.innerHTML = AC_BEST_PRACTICES.map(bp => `
    <div class="bp-card">
      <div class="bp-card-title">${bp.title}</div>
      <div class="bp-card-body">${bp.body}</div>
      <div class="bp-card-ev">${bp.ev}</div>
    </div>`).join('');
}
buildAirwayBP();

// ─── MSK PANELS ───────────────────────────────────────────────────────────────
let pearlIdx = 0;

function buildDailyPearl() {
  const dayOfYear = Math.floor((TODAY - new Date(TODAY.getFullYear(),0,0)) / 86400000);
  pearlIdx = dayOfYear % MSK_PEARLS.length;
  renderPearl(pearlIdx);
}

function renderPearl(idx) {
  const p = MSK_PEARLS[idx];
  const el = document.getElementById('daily-pearl');
  if (!el || !p) return;
  el.innerHTML = `<div class="pearl-date">💡 Clinical Pearl · ${TODAY.toLocaleDateString('en-CA',{weekday:'long',month:'long',day:'numeric'})}</div>
    <div class="pearl-title">${p.title}</div>
    <div class="pearl-body">${p.body}</div>
    <div class="pearl-source">Source: ${p.source}</div>
    <div class="pearl-nav">
      <button class="pearl-btn" onclick="navPearl(-1)">← Previous</button>
      <button class="pearl-btn" onclick="navPearl(1)">Next →</button>
    </div>`;
}

function navPearl(dir) {
  pearlIdx = (pearlIdx + dir + MSK_PEARLS.length) % MSK_PEARLS.length;
  renderPearl(pearlIdx);
}

function buildAllPearls() {
  const grid = document.getElementById('pearls-grid');
  if (!grid) return;
  grid.innerHTML = MSK_PEARLS.map((p, i) => `
    <div class="pearl-item">
      <div class="pi-num">Pearl ${i+1} of ${MSK_PEARLS.length}</div>
      <div class="pi-title">${p.title}</div>
      <div class="pi-body">${p.body}</div>
      <div class="pi-src">Source: ${p.source}</div>
    </div>`).join('');
}

function buildJoints() {
  const nav = document.getElementById('joint-nav');
  if (!nav) return;
  nav.innerHTML = Object.entries(JOINTS).map(([key, j]) =>
    `<button class="joint-btn" data-joint="${key}" onclick="showJoint('${key}',this)">${j.icon} ${j.name}</button>`
  ).join('');
}

function showJoint(key, btn) {
  document.querySelectorAll('.joint-btn').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  const j = JOINTS[key];
  if (!j) return;
  document.getElementById('joint-content').innerHTML = `
    <div class="joint-section">
      <div class="joint-title">${j.icon} ${j.name} — Clinical Guide</div>
      <div class="joint-grid">
        ${j.conditions.map(c => `
          <div class="jcard">
            <div class="jcard-title">${c.name}</div>
            <div class="jcard-title" style="font-size:11px;color:var(--teal);margin-bottom:4px;">${c.title}</div>
            <div class="jcard-body">${c.body}</div>
            <span class="jcard-ev ${c.ev}">${c.ev==='ev-a'?'Evidence A':c.ev==='ev-b'?'Evidence B':'Evidence C'}</span>
          </div>`).join('')}
      </div>
    </div>`;
}

function buildRTS() {
  const grid = document.getElementById('rts-grid');
  if (!grid) return;
  grid.innerHTML = RTS_PROTOCOLS.map(p => `
    <div class="pcard">
      <div class="pcard-hdr"><div class="pcard-title">${p.title}</div><div class="phase-badge ${p.pc}">${p.phase}</div></div>
      <div class="phases">${p.phases.map(ph => `
        <div class="phase-row"><div class="phase-num">${ph.n}</div>
        <div class="phase-content"><strong>${ph.t}:</strong> ${ph.d}</div></div>`).join('')}
      </div>
      <div class="evidence-row"><strong>Evidence:</strong> ${p.ev}</div>
    </div>`).join('');
}

function buildModalities() {
  const grid = document.getElementById('mod-grid');
  if (!grid) return;
  grid.innerHTML = MODALITIES.map(m => `
    <div class="mod-card">
      <div class="mod-icon">${m.icon}</div>
      <div class="mod-name">${m.name}</div>
      <span class="mod-ev ${m.ec}">Evidence ${m.ev}</span>
      <div class="mod-desc">${m.desc}</div>
    </div>`).join('');
}

function buildAssessment() {
  const grid = document.getElementById('assess-grid');
  if (!grid) return;
  grid.innerHTML = ASSESS_TOOLS.map(t => `
    <div class="assess-card">
      <div class="assess-name">${t.name}</div>
      <div class="assess-joint">${t.joint}</div>
      <div class="assess-body">${t.body}</div>
      <div class="assess-mdcic">${t.mcid}</div>
    </div>`).join('');
}

function mskFilter(el, val) {
  document.querySelectorAll('#msk-chips .chip').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
  const panels = ['pearls','joint','rts','modalities','assess','research'];
  panels.forEach(p => {
    const el2 = document.getElementById('msk-' + p + '-panel');
    if (el2) el2.style.display = 'none';
  });
  if (val === 'all') {
    panels.forEach(p => { const el2 = document.getElementById('msk-' + p + '-panel'); if(el2) el2.style.display = 'block'; });
  } else {
    const map = {pearls:'pearls',joint:'joint',rts:'rts',modalities:'modalities',assess:'assess',research:'research'};
    const panelId = 'msk-' + (map[val]||val) + '-panel';
    const el2 = document.getElementById(panelId);
    if (el2) el2.style.display = 'block';
  }
}

buildDailyPearl();
buildAllPearls();
buildJoints();
buildRTS();
buildModalities();
buildAssessment();

// ─── NEWS ─────────────────────────────────────────────────────────────────────
let newsLoaded = false;

const NEWS_SOURCE_COLORS = {
  'New York Times':'#1452A8','Washington Post':'#C01818','Reuters':'#FF6B00',
  'Financial Times':'#990F3D','FiveThirtyEight':'#4B3DAE','The Athletic':'#1A1A2E',
  'CBC':'#E61924','BBC':'#C01818','The Economist':'#E3120B','Toronto Star':'#D4001F',
  'Reuters Health':'#FF6B00','AP':'#B91C1C','Politico':'#1B4F8A',
};

function srcColor(src) {
  for (const k in NEWS_SOURCE_COLORS) if (src && src.includes(k)) return NEWS_SOURCE_COLORS[k];
  return '#B91C1C';
}

async function loadNews() {
  newsLoaded = true;
  const container = document.getElementById('news-container');
  container.innerHTML = '<div class="loading-news">🌍 Fetching today\'s global news via AI aggregator…</div>';
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        model:'claude-sonnet-4-20250514', max_tokens:3000,
        tools:[{type:'web_search_20250305',name:'web_search'}],
        messages:[{ role:'user', content:
          `Today is ${TODAY.toDateString()}. Search for today's top news stories from these specific sources and topics:
          1. New York Times - top 2 stories today
          2. Washington Post - politics or world news
          3. Reuters - world news or breaking news
          4. Financial Times - business or economy
          5. BBC - UK/world news
          6. CBC Canada - Canadian news today
          7. Toronto - local Toronto news (Toronto Star, City of Toronto)
          8. FiveThirtyEight or data journalism - polling, analysis
          9. The Athletic - sports news
          10. Health/medical - physiotherapy, CF, rehabilitation research news
          
          For each story, provide a JSON object with: title, source (e.g. "New York Times"), category (one of: politics/world/business/health/sports/canada/toronto/data/science), summary (2 sentences), url, time.
          
          Return ONLY a valid JSON array of 12-15 stories. No markdown, no backticks, no other text.` }]
      })
    });
    const data = await resp.json();
    const text = data.content?.filter(b=>b.type==='text').map(b=>b.text).join('') || '';
    let stories = [];
    try {
      const clean = text.replace(/```json|```/g,'').trim();
      const s = clean.indexOf('['), e = clean.lastIndexOf(']');
      if (s>-1 && e>-1) stories = JSON.parse(clean.slice(s,e+1));
    } catch(e2) {}
    if (stories.length < 3) stories = FALLBACK_NEWS;
    renderNews(stories);
  } catch(e) {
    renderNews(FALLBACK_NEWS);
  }
}

function renderNews(stories) {
  const container = document.getElementById('news-container');
  const featured = stories.slice(0, 3);
  const sidebar = stories.slice(3, 8);
  const rest = stories.slice(8);

  container.innerHTML = `<div class="news-layout">
    <div class="news-main-col">
      ${featured.map(s => `
        <div class="news-featured" data-src="${s.source||''}" data-cat="${s.category||''}">
          <div class="nf-source-row">
            <span class="nf-source" style="color:${srcColor(s.source)}">${s.source||'News'}</span>
            <span class="nf-category">${(s.category||'world').toUpperCase()}</span>
            <span class="nf-time">${s.time||'Today'}</span>
          </div>
          <div class="nf-title">${s.title}</div>
          <div class="nf-desc">${s.summary}</div>
          <a href="${s.url||'#'}" target="_blank" class="nf-link">Read full story →</a>
        </div>`).join('')}
      <div class="news-list" style="margin-top:10px;">
        ${rest.map(s => `
          <div class="nitem" data-src="${s.source||''}" data-cat="${s.category||''}">
            <div class="nitem-src" style="color:${srcColor(s.source)}">${s.source||'News'} · ${s.time||'Today'}</div>
            <div class="nitem-title">${s.title}</div>
            <div class="nitem-desc">${s.summary}</div>
            <a href="${s.url||'#'}" target="_blank" class="nitem-link">Read →</a>
          </div>`).join('')}
      </div>
    </div>
    <div class="news-side-col">
      <div class="news-list">
        ${sidebar.map(s => `
          <div class="nitem" data-src="${s.source||''}" data-cat="${s.category||''}">
            <div class="nitem-src" style="color:${srcColor(s.source)}">${s.source||''}</div>
            <div class="nitem-title">${s.title}</div>
            <div class="nitem-desc">${s.summary}</div>
            <a href="${s.url||'#'}" target="_blank" class="nitem-link">Read →</a>
          </div>`).join('')}
      </div>
    </div>
  </div>`;
}

function filterNews(el, val) {
  document.querySelectorAll('.src-chip').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
  document.querySelectorAll('.news-featured,.nitem').forEach(item => {
    const cat = (item.dataset.cat || '').toLowerCase();
    const src = (item.dataset.src || '').toLowerCase();
    const show = val === 'all' || cat.includes(val) || src.includes(val);
    item.style.display = show ? '' : 'none';
  });
}

// ─── SUDOKU ───────────────────────────────────────────────────────────────────
const SDK_PUZ = [
  [0,0,0,2,6,0,7,0,1],[6,8,0,0,7,0,0,9,0],[1,9,0,0,0,4,5,0,0],
  [8,2,0,1,0,0,0,4,0],[0,0,4,6,0,2,9,0,0],[0,5,0,0,0,3,0,2,8],
  [0,0,9,3,0,0,0,7,4],[0,4,0,0,5,0,0,3,6],[7,0,3,0,1,8,0,0,0],
];
const SDK_SOL = [
  [4,3,5,2,6,9,7,8,1],[6,8,2,5,7,1,4,9,3],[1,9,7,8,3,4,5,6,2],
  [8,2,6,1,9,5,3,4,7],[3,7,4,6,8,2,9,1,5],[9,5,1,7,4,3,6,2,8],
  [5,1,9,3,2,6,8,7,4],[2,4,8,9,5,7,1,3,6],[7,6,3,4,1,8,2,5,9],
];
let sdkSel = null, sdkUserGrid = SDK_PUZ.map(r => [...r]);

function buildSudoku() {
  const g = document.getElementById('sdk-grid'); if (!g) return;
  g.innerHTML = '';
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    const d = document.createElement('div'); d.className = 'sdk-cell';
    if (SDK_PUZ[r][c]) { d.textContent = SDK_PUZ[r][c]; d.classList.add('given'); }
    if (c===2||c===5) d.classList.add('br'); if (r===2||r===5) d.classList.add('bb');
    d.dataset.r=r; d.dataset.c=c;
    d.onclick = () => sdkSelect(r, c, d); g.appendChild(d);
  }
  const np = document.getElementById('numpad'); if (!np) return; np.innerHTML = '';
  for (let n = 1; n <= 9; n++) {
    const b = document.createElement('button'); b.className='np-btn'; b.textContent=n;
    b.onclick = () => sdkEnter(n); np.appendChild(b);
  }
}
function sdkSelect(r, c, el) {
  document.querySelectorAll('.sdk-cell').forEach(x => x.classList.remove('sel','peer'));
  if (SDK_PUZ[r][c]) return;
  sdkSel = {r,c}; el.classList.add('sel');
  // Highlight peers (same row, col, box)
  document.querySelectorAll('.sdk-cell').forEach(x => {
    const xr=+x.dataset.r, xc=+x.dataset.c;
    if((xr===r||xc===c||(Math.floor(xr/3)===Math.floor(r/3)&&Math.floor(xc/3)===Math.floor(c/3)))&&!(xr===r&&xc===c)) x.classList.add('peer');
  });
}
function sdkEnter(n) {
  if (!sdkSel) return;
  const {r,c}=sdkSel; sdkUserGrid[r][c]=n;
  const cells=document.querySelectorAll('.sdk-cell');
  cells[r*9+c].textContent=n; cells[r*9+c].classList.remove('err'); cells[r*9+c].classList.add('ui');
}
function sdkClear() {
  if (!sdkSel) return; const {r,c}=sdkSel; if(SDK_PUZ[r][c]) return;
  sdkUserGrid[r][c]=0; const cells=document.querySelectorAll('.sdk-cell');
  cells[r*9+c].textContent=''; cells[r*9+c].classList.remove('err','ui');
}
function sdkCheck() {
  let e=0; const cells=document.querySelectorAll('.sdk-cell');
  for(let r=0;r<9;r++) for(let c=0;c<9;c++) {
    const idx=r*9+c;
    if(!SDK_PUZ[r][c]&&sdkUserGrid[r][c]) {
      if(sdkUserGrid[r][c]!==SDK_SOL[r][c]){cells[idx].classList.add('err');e++;}
      else cells[idx].classList.remove('err');
    }
  }
  const msg=document.getElementById('sdk-msg');
  if(e===0&&sdkUserGrid.every((row,r)=>row.every((v,c)=>v===SDK_SOL[r][c]))) msg.textContent='Solved! 🎉';
  else if(e) msg.textContent=e+' error(s) found.';
  else msg.textContent='Looking good so far!';
}
function sdkHint() {
  for(let r=0;r<9;r++) for(let c=0;c<9;c++) {
    if(!SDK_PUZ[r][c]&&sdkUserGrid[r][c]!==SDK_SOL[r][c]) {
      sdkUserGrid[r][c]=SDK_SOL[r][c];
      const cells=document.querySelectorAll('.sdk-cell');
      cells[r*9+c].textContent=SDK_SOL[r][c]; cells[r*9+c].classList.add('ui'); cells[r*9+c].classList.remove('err');
      document.getElementById('sdk-msg').textContent='Hint placed!'; return;
    }
  }
}
function sdkSolve() {
  for(let r=0;r<9;r++) for(let c=0;c<9;c++) if(!SDK_PUZ[r][c]) {
    sdkUserGrid[r][c]=SDK_SOL[r][c];
    const cells=document.querySelectorAll('.sdk-cell');
    cells[r*9+c].textContent=SDK_SOL[r][c]; cells[r*9+c].classList.add('ui'); cells[r*9+c].classList.remove('err');
  }
  document.getElementById('sdk-msg').textContent='Solved — try again tomorrow!';
}
buildSudoku();

// ─── WORDLE ───────────────────────────────────────────────────────────────────
const WL_WORDS=['MUCUS','LUNGS','TIDAL','CILIA','LYMPH','VITAL','FIBRO','LUMEN','OSMOL','EXPIR','PLEUR','COUGH','SPASM','BOLUS','RENAL','DORSI','VOLAR','JOINT','NERVE','DISCS','FLEXO','MOTIF','FLUID','GLAND','CELLS'];
const dayNum=Math.floor((TODAY-new Date(TODAY.getFullYear(),0,0))/86400000);
const WL_WORD=WL_WORDS[dayNum%WL_WORDS.length];
let wlGuesses=[],wlCur='',wlDone=false;

function buildWordle() {
  const board=document.getElementById('wl-board'); if(!board) return;
  board.innerHTML='';
  for(let g=0;g<6;g++) {
    const row=document.createElement('div'); row.className='wl-row'; row.id='wrow-'+g;
    for(let l=0;l<5;l++){const t=document.createElement('div');t.className='wl-tile';t.id=`wt-${g}-${l}`;row.appendChild(t);}
    board.appendChild(row);
  }
  const kb=document.getElementById('wl-kb'); if(!kb) return;
  [['Q','W','E','R','T','Y','U','I','O','P'],['A','S','D','F','G','H','J','K','L'],['ENTER','Z','X','C','V','B','N','M','DEL']].forEach(row=>{
    const r=document.createElement('div'); r.className='kb-r';
    row.forEach(k=>{const b=document.createElement('button');b.className='kb-k'+(k==='ENTER'||k==='DEL'?' wide':'');b.textContent=k==='DEL'?'⌫':k;b.dataset.key=k;b.onclick=()=>wlHandle(k);r.appendChild(b);});
    kb.appendChild(r);
  });
  document.addEventListener('keydown',e=>{
    if(document.getElementById('sec-games')&&document.getElementById('sec-games').classList.contains('on')) {
      if(e.key==='Enter') wlHandle('ENTER');
      else if(e.key==='Backspace') wlHandle('DEL');
      else if(/^[a-zA-Z]$/.test(e.key)) wlHandle(e.key.toUpperCase());
    }
  });
}
function wlHandle(key){
  if(wlDone)return;
  if(key==='DEL') wlCur=wlCur.slice(0,-1);
  else if(key==='ENTER'){if(wlCur.length<5){document.getElementById('wl-msg').textContent='Need 5 letters';return;}wlSubmit();return;}
  else if(wlCur.length<5) wlCur+=key;
  const g=wlGuesses.length;
  for(let l=0;l<5;l++){const t=document.getElementById(`wt-${g}-${l}`);if(t){t.textContent=wlCur[l]||'';t.className='wl-tile'+(wlCur[l]?' filled':'');}}
}
function wlSubmit(){
  const guess=wlCur,g=wlGuesses.length,res=Array(5).fill('absent'),used=Array(5).fill(false),ans=WL_WORD.split('');
  for(let i=0;i<5;i++) if(guess[i]===ans[i]){res[i]='correct';used[i]=true;}
  for(let i=0;i<5;i++) if(res[i]!=='correct') for(let j=0;j<5;j++) if(!used[j]&&guess[i]===ans[j]){res[i]='present';used[j]=true;break;}
  for(let l=0;l<5;l++){
    const t=document.getElementById(`wt-${g}-${l}`); if(t) t.className='wl-tile '+res[l];
    const kb=document.querySelector(`[data-key="${guess[l]}"]`);
    if(kb){if(res[l]==='correct')kb.className='kb-k correct';else if(res[l]==='present'&&!kb.classList.contains('correct'))kb.className='kb-k present';else if(!kb.classList.contains('correct')&&!kb.classList.contains('present'))kb.className='kb-k absent';}
  }
  wlGuesses.push(guess);wlCur='';document.getElementById('wl-msg').textContent='';
  if(guess===WL_WORD){document.getElementById('wl-msg').textContent='Brilliant! 🎉';wlDone=true;}
  else if(wlGuesses.length===6){document.getElementById('wl-msg').textContent='Word was: '+WL_WORD;wlDone=true;}
}
buildWordle();

// ─── EMAIL ────────────────────────────────────────────────────────────────────
function doSubscribe(){
  const em=document.getElementById('sub-em').value;
  if(!em||!em.includes('@')){alert('Please enter a valid email address.');return;}
  document.getElementById('sub-ok').style.display='block';
}
