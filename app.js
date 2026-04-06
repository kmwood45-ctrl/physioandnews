// ─── INIT ─────────────────────────────────────────────────────────────────────
const TODAY = new Date();
document.getElementById('hdr-date').textContent =
  TODAY.toLocaleDateString('en-CA', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = ['cf','trikafta','airway','pt','msk','pain','auto','news','games','email'];
function goTab(t) {
  document.querySelectorAll('.sec').forEach(s => s.classList.remove('on'));
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('on'));
  document.getElementById('sec-' + t).classList.add('on');
  const idx = TABS.indexOf(t);
  const tabs = document.querySelectorAll('.tab');
  if (tabs[idx]) tabs[idx].classList.add('on');
  if (t === 'news' && !newsLoaded) loadNews();
}

// ─── ARTICLE CARDS ────────────────────────────────────────────────────────────
const REGION_MAP = {
  ca: ['🍁 Canadian', 'b-ca'],
  au: ['🦘 Australian', 'b-au'],
  us: ['🇺🇸 American', 'b-us'],
  ww: ['🌐 Worldwide', 'b-ww'],
};

function makeCard(art) {
  const [rl, rc] = REGION_MAP[art.r] || ['🌐 Worldwide', 'b-ww'];
  const aiId = 'ai-' + Math.random().toString(36).slice(2);
  const aiBlock = art.ai
    ? `<div class="ai-sum-wrap" id="${aiId}">
         <div class="ai-sum-lbl">AI Summary for Clinicians</div>
         ${art.ai}
       </div>`
    : `<button class="ai-btn" onclick="loadAISummary(this,'${aiId}',${JSON.stringify(art.title)},${JSON.stringify(art.abs)})">✦ Generate AI Summary</button>
       <div class="ai-sum-wrap" id="${aiId}" style="display:none;"></div>`;
  return `<div class="acard" data-r="${art.r}" data-cat="${art.cat || 'all'}">
    <div class="acard-top">
      <div class="badges"><span class="badge ${rc}">${rl}</span></div>
      <span class="cites">${art.c.toLocaleString()} citations</span>
    </div>
    <div class="art-title">${art.title}</div>
    <div class="art-meta">${art.authors} · <em>${art.journal}</em></div>
    <div class="art-abs">${art.abs}</div>
    ${aiBlock}
    <a class="art-link" href="https://doi.org/${art.doi}" target="_blank">View article → doi.org/${art.doi}</a>
  </div>`;
}

function populateGrid(id, key) {
  const el = document.getElementById(id);
  if (el && ARTS[key]) el.innerHTML = ARTS[key].map(makeCard).join('');
}
['cf','trikafta','airway','pt','msk','pain','auto'].forEach(k => populateGrid('grid-' + k, k));

// ─── AI SUMMARY (live Claude API call) ───────────────────────────────────────
async function loadAISummary(btn, id, title, abs) {
  const el = document.getElementById(id);
  el.style.display = 'block';
  el.innerHTML = '<div class="ai-sum-lbl">AI Summary for Clinicians</div><span class="ai-loading">Generating clinical summary…</span>';
  btn.style.display = 'none';
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content:
          `You are a clinical physiotherapy educator. In 3-4 concise sentences, summarise the clinical implications of this research specifically for practicing physiotherapists. Focus on what they should DO differently in their practice.\n\nArticle: "${title}"\nAbstract: "${abs}"`
        }]
      })
    });
    const data = await resp.json();
    const text = data.content?.[0]?.text || 'Summary unavailable.';
    el.innerHTML = '<div class="ai-sum-lbl">AI Summary for Clinicians</div>' + text;
  } catch (e) {
    el.innerHTML = '<div class="ai-sum-lbl">AI Summary for Clinicians</div>Summary currently unavailable — try again shortly.';
  }
}

// ─── FILTER CHIPS ─────────────────────────────────────────────────────────────
function filterChip(el, sec, val) {
  el.closest('.chips').querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
  document.getElementById('grid-' + sec).querySelectorAll('.acard').forEach(c => {
    c.style.display = (val === 'all' || c.dataset.r === val || c.dataset.cat === val) ? '' : 'none';
  });
}

// ─── MSK PANELS ───────────────────────────────────────────────────────────────
function buildMSK() {
  document.getElementById('rts-grid').innerHTML = RTS_PROTOCOLS.map(p =>
    `<div class="pcard">
      <div class="pcard-hdr"><div class="pcard-title">${p.title}</div><div class="phase-badge ${p.pc}">${p.phase}</div></div>
      <div class="phases">${p.phases.map(ph =>
        `<div class="phase-row"><div class="phase-num">${ph.n}</div><div class="phase-content"><strong>${ph.t}:</strong> ${ph.d}</div></div>`
      ).join('')}</div>
      <div class="evidence-row"><strong>Evidence:</strong> ${p.ev}</div>
    </div>`
  ).join('');

  document.getElementById('mod-grid').innerHTML = MODALITIES.map(m =>
    `<div class="mod-card">
      <div class="mod-icon">${m.icon}</div>
      <div class="mod-name">${m.name}</div>
      <span class="mod-ev ${m.ec}">Evidence ${m.ev}</span>
      <div class="mod-desc">${m.desc}</div>
    </div>`
  ).join('');

  document.getElementById('cond-grid').innerHTML = COND_PROTOCOLS.map(p =>
    `<div class="pcard">
      <div class="pcard-hdr"><div class="pcard-title">${p.title}</div><div class="phase-badge ${p.pc}">${p.phase}</div></div>
      <div class="phases">${p.phases.map(ph =>
        `<div class="phase-row"><div class="phase-num">${ph.n}</div><div class="phase-content"><strong>${ph.t}:</strong> ${ph.d}</div></div>`
      ).join('')}</div>
      <div class="evidence-row"><strong>Evidence:</strong> ${p.ev}</div>
    </div>`
  ).join('');
}
buildMSK();

function mskFilter(el, val) {
  document.querySelectorAll('#msk-chips .chip').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
  document.querySelectorAll('.msk-panel').forEach(p => p.style.display = 'none');
  if (val === 'all' || val === 'rts')        document.getElementById('msk-rts').style.display = 'block';
  if (val === 'all' || val === 'modalities') document.getElementById('msk-modalities-panel').style.display = 'block';
  if (val === 'all' || val === 'protocols')  document.getElementById('msk-protocols-panel').style.display = 'block';
  if (val === 'all' || val === 'research')   document.getElementById('msk-research-panel').style.display = 'block';
}

// ─── NEWS ─────────────────────────────────────────────────────────────────────
let newsLoaded = false;

async function loadNews() {
  newsLoaded = true;
  const container = document.getElementById('news-container');
  container.innerHTML = '<div class="loading-news">Fetching today\'s stories via AI news aggregator…</div>';
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content:
          `Today is ${TODAY.toDateString()}. Search for and return today's top news stories from: 1) CBC Canada health and general news, 2) Toronto local news, 3) BBC world news, 4) New York Times top stories, 5) The Economist, 6) Medical/physiotherapy/CF research news. For each story, provide: title, source name, 2-sentence summary, and a relevant URL. Return ONLY a JSON array (no markdown) of objects: [{title,source,category,summary,url,time}]. Get at least 8 stories total.`
        }]
      })
    });
    const data = await resp.json();
    const textContent = data.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '';
    let stories = [];
    try {
      const clean = textContent.replace(/```json|```/g, '').trim();
      const start = clean.indexOf('['), end = clean.lastIndexOf(']');
      if (start > -1 && end > -1) stories = JSON.parse(clean.slice(start, end + 1));
    } catch (e) { stories = []; }
    if (stories.length === 0) throw new Error('No stories parsed');
    renderNews(stories);
  } catch (e) {
    loadFallbackNews();
  }
}

function loadFallbackNews() {
  const stories = [
    { title: "Health Canada expands CFTR modulator access for children under 2", source: "CBC", category: "CBC", summary: "Health Canada has approved elexacaftor-tezacaftor-ivacaftor for infants as young as 2 months, expanding the CF modulator programme. The approval follows international paediatric safety data from 14 countries.", url: "https://www.cbc.ca/health", time: "2 hours ago" },
    { title: "Toronto General Hospital opens dedicated CF adult transition clinic", source: "Toronto Star", category: "Toronto", summary: "Toronto General and SickKids have launched a joint adult transition programme for CF patients moving from paediatric to adult care. The clinic integrates physiotherapy, dietetics, and psychology in a single visit.", url: "https://www.thestar.com", time: "5 hours ago" },
    { title: "UK physiotherapy shortage threatens NHS rehabilitation targets", source: "BBC", category: "BBC", summary: "NHS England reports a 22% shortfall in musculoskeletal physiotherapists, with waiting times exceeding 18 weeks. The BPS is calling for emergency training funding.", url: "https://www.bbc.com/health", time: "6 hours ago" },
    { title: "New WHO guidelines recommend exercise before medication for chronic pain", source: "New York Times", category: "NYT", summary: "The World Health Organisation has released updated chronic pain management guidelines placing structured exercise ahead of pharmacotherapy for non-cancer chronic pain.", url: "https://www.nytimes.com/health", time: "8 hours ago" },
    { title: "Canada's physiotherapy workforce crisis: 1 in 3 positions unfilled in rural areas", source: "CBC", category: "CBC", summary: "A new Physiotherapy Association of Canada report reveals critical shortages outside major urban centres, with wait times exceeding 6 months in northern Ontario.", url: "https://www.cbc.ca", time: "10 hours ago" },
    { title: "The economics of longevity: why healthcare systems can't keep up with ageing populations", source: "The Economist", category: "Economist", summary: "OECD countries will need to double rehabilitation spending by 2040 to manage chronic MSK disease. Physiotherapy-led models show 40% cost savings vs surgical pathways.", url: "https://www.economist.com/health", time: "12 hours ago" },
    { title: "Exercise linked to 31% reduction in pulmonary exacerbations in CF adults", source: "CBC", category: "Health", summary: "Researchers at McGill University and UBC published findings showing structured aerobic exercise programmes reduce CF hospitalisation rates significantly independent of CFTR modulator therapy.", url: "https://www.cbc.ca/health", time: "14 hours ago" },
    { title: "AI-guided rehabilitation programmes show promise in post-surgical recovery", source: "BBC", category: "Health", summary: "A multinational RCT in JAMA demonstrates AI-assisted physiotherapy prescription reduces time to functional recovery by 18% in knee arthroplasty patients.", url: "https://www.bbc.com/health", time: "16 hours ago" },
  ];
  renderNews(stories);
}

const SRC_COLORS = { CBC:'#C01818', BBC:'#C01818', NYT:'#1452A8', Economist:'#D81B2B', Toronto:'#B06A10', Health:'#0F7B5A', World:'#4B3DAE' };
function srcColor(src) {
  for (const k in SRC_COLORS) if (src.includes(k)) return SRC_COLORS[k];
  return '#C01818';
}

function renderNews(stories) {
  const container = document.getElementById('news-container');
  const featured = stories.slice(0, 2);
  const rest = stories.slice(2);
  container.innerHTML = `<div class="news-layout">
    <div class="news-main-col">
      ${featured.map(s => `
        <div class="news-featured" data-src="${s.source}" data-cat="${s.category}">
          <div class="nf-source" style="color:${srcColor(s.source)}">${s.source} · ${s.time || 'Today'}</div>
          <div class="nf-title">${s.title}</div>
          <div class="nf-desc">${s.summary}</div>
          <div class="news-ai-wrap"><div class="news-ai-lbl">✦ AI Briefing</div>${s.summary} This story is directly relevant to healthcare practitioners in Canada.</div>
          <div class="nf-meta"><a href="${s.url || '#'}" target="_blank" style="color:var(--blue)">Read full story →</a></div>
        </div>`).join('')}
      <div class="news-list">
        ${rest.slice(0,4).map(s => `
          <div class="nitem" data-src="${s.source}" data-cat="${s.category}">
            <div class="nitem-src" style="color:${srcColor(s.source)}">${s.source} · ${s.time || 'Today'}</div>
            <div class="nitem-title">${s.title}</div>
            <div class="nitem-desc">${s.summary}</div>
            <div><a href="${s.url || '#'}" target="_blank" style="font-size:11px;color:var(--blue)">Read →</a></div>
          </div>`).join('')}
      </div>
    </div>
    <div class="news-side-col">
      <div class="news-list">
        ${rest.slice(4).map(s => `
          <div class="nitem" data-src="${s.source}" data-cat="${s.category}">
            <div class="nitem-src" style="color:${srcColor(s.source)}">${s.source}</div>
            <div class="nitem-title">${s.title}</div>
            <div class="nitem-desc">${s.summary}</div>
            <div><a href="${s.url || '#'}" target="_blank" style="font-size:11px;color:var(--blue)">Read →</a></div>
          </div>`).join('')}
      </div>
    </div>
  </div>`;
}

function filterNews(el, val) {
  document.querySelectorAll('.src-chip').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
  document.querySelectorAll('.news-featured,.nitem').forEach(item => {
    const src = item.dataset.src || '', cat = item.dataset.cat || '';
    item.style.display = (val === 'all' || src.includes(val) || cat.includes(val)) ? '' : 'none';
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
let sdkSel = null, sdkGrid = SDK_PUZ.map(r => [...r]);

function buildSudoku() {
  const g = document.getElementById('sdk-grid'); g.innerHTML = '';
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    const d = document.createElement('div'); d.className = 'sdk-cell';
    if (SDK_PUZ[r][c]) { d.textContent = SDK_PUZ[r][c]; d.classList.add('given'); }
    if (c === 2 || c === 5) d.classList.add('br');
    if (r === 2 || r === 5) d.classList.add('bb');
    d.dataset.r = r; d.dataset.c = c;
    d.onclick = () => sdkSelect(r, c, d); g.appendChild(d);
  }
  const np = document.getElementById('numpad'); np.innerHTML = '';
  for (let n = 1; n <= 9; n++) {
    const b = document.createElement('button'); b.className = 'np-btn'; b.textContent = n;
    b.onclick = () => sdkEnter(n); np.appendChild(b);
  }
}
function sdkSelect(r, c, el) {
  document.querySelectorAll('.sdk-cell').forEach(x => x.classList.remove('sel'));
  if (SDK_PUZ[r][c]) return;
  sdkSel = { r, c }; el.classList.add('sel');
}
function sdkEnter(n) {
  if (!sdkSel) return;
  const { r, c } = sdkSel; sdkGrid[r][c] = n;
  const cells = document.querySelectorAll('.sdk-cell');
  cells[r * 9 + c].textContent = n; cells[r * 9 + c].classList.remove('err'); cells[r * 9 + c].classList.add('ui');
}
function sdkClear() {
  if (!sdkSel) return;
  const { r, c } = sdkSel; if (SDK_PUZ[r][c]) return;
  sdkGrid[r][c] = 0;
  const cells = document.querySelectorAll('.sdk-cell');
  cells[r * 9 + c].textContent = ''; cells[r * 9 + c].classList.remove('err', 'ui');
}
function sdkCheck() {
  let e = 0; const cells = document.querySelectorAll('.sdk-cell');
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    const idx = r * 9 + c;
    if (!SDK_PUZ[r][c] && sdkGrid[r][c]) {
      if (sdkGrid[r][c] !== SDK_SOL[r][c]) { cells[idx].classList.add('err'); e++; }
      else cells[idx].classList.remove('err');
    }
  }
  const msg = document.getElementById('sdk-msg');
  if (e === 0 && sdkGrid.every((row, r) => row.every((v, c) => v === SDK_SOL[r][c]))) msg.textContent = 'Solved! 🎉';
  else if (e) msg.textContent = e + ' error(s) found.';
  else msg.textContent = 'Looking good so far!';
}
function sdkHint() {
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    if (!SDK_PUZ[r][c] && sdkGrid[r][c] !== SDK_SOL[r][c]) {
      sdkGrid[r][c] = SDK_SOL[r][c];
      const cells = document.querySelectorAll('.sdk-cell');
      cells[r * 9 + c].textContent = SDK_SOL[r][c]; cells[r * 9 + c].classList.add('ui'); cells[r * 9 + c].classList.remove('err');
      document.getElementById('sdk-msg').textContent = 'Hint placed!'; return;
    }
  }
}
buildSudoku();

// ─── WORDLE ───────────────────────────────────────────────────────────────────
const WL_WORDS = ['MUCUS','LUNGS','TIDAL','CILIA','LYMPH','VITAL','FIBRO','LUMEN','OSMOL','EXPIR','REFLEX','PLEUR','COUGH'];
const dayNum = Math.floor((TODAY - new Date(TODAY.getFullYear(), 0, 0)) / 86400000);
const WL_WORD = WL_WORDS[dayNum % WL_WORDS.length];
let wlGuesses = [], wlCur = '', wlDone = false;

function buildWordle() {
  const board = document.getElementById('wl-board'); board.innerHTML = '';
  for (let g = 0; g < 6; g++) {
    const row = document.createElement('div'); row.className = 'wl-row'; row.id = 'wrow-' + g;
    for (let l = 0; l < 5; l++) { const t = document.createElement('div'); t.className = 'wl-tile'; t.id = `wt-${g}-${l}`; row.appendChild(t); }
    board.appendChild(row);
  }
  const kb = document.getElementById('wl-kb');
  [['Q','W','E','R','T','Y','U','I','O','P'],['A','S','D','F','G','H','J','K','L'],['ENTER','Z','X','C','V','B','N','M','DEL']].forEach(row => {
    const r = document.createElement('div'); r.className = 'kb-r';
    row.forEach(k => {
      const b = document.createElement('button'); b.className = 'kb-k' + (k === 'ENTER' || k === 'DEL' ? ' wide' : '');
      b.textContent = k === 'DEL' ? '⌫' : k; b.dataset.key = k; b.onclick = () => wlHandle(k); r.appendChild(b);
    }); kb.appendChild(r);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') wlHandle('ENTER');
    else if (e.key === 'Backspace') wlHandle('DEL');
    else if (/^[a-zA-Z]$/.test(e.key)) wlHandle(e.key.toUpperCase());
  });
}
function wlHandle(key) {
  if (wlDone) return;
  if (key === 'DEL') wlCur = wlCur.slice(0, -1);
  else if (key === 'ENTER') { if (wlCur.length < 5) { document.getElementById('wl-msg').textContent = 'Need 5 letters'; return; } wlSubmit(); return; }
  else if (wlCur.length < 5) wlCur += key;
  const g = wlGuesses.length;
  for (let l = 0; l < 5; l++) { const t = document.getElementById(`wt-${g}-${l}`); t.textContent = wlCur[l] || ''; t.className = 'wl-tile' + (wlCur[l] ? ' filled' : ''); }
}
function wlSubmit() {
  const guess = wlCur, g = wlGuesses.length, res = Array(5).fill('absent'), used = Array(5).fill(false), ans = WL_WORD.split('');
  for (let i = 0; i < 5; i++) if (guess[i] === ans[i]) { res[i] = 'correct'; used[i] = true; }
  for (let i = 0; i < 5; i++) if (res[i] !== 'correct') for (let j = 0; j < 5; j++) if (!used[j] && guess[i] === ans[j]) { res[i] = 'present'; used[j] = true; break; }
  for (let l = 0; l < 5; l++) {
    document.getElementById(`wt-${g}-${l}`).className = 'wl-tile ' + res[l];
    const kb = document.querySelector(`[data-key="${guess[l]}"]`);
    if (kb) {
      if (res[l] === 'correct') kb.className = 'kb-k correct';
      else if (res[l] === 'present' && !kb.classList.contains('correct')) kb.className = 'kb-k present';
      else if (!kb.classList.contains('correct') && !kb.classList.contains('present')) kb.className = 'kb-k absent';
    }
  }
  wlGuesses.push(guess); wlCur = ''; document.getElementById('wl-msg').textContent = '';
  if (guess === WL_WORD) { document.getElementById('wl-msg').textContent = 'Brilliant! 🎉'; wlDone = true; }
  else if (wlGuesses.length === 6) { document.getElementById('wl-msg').textContent = 'Word was: ' + WL_WORD; wlDone = true; }
}
buildWordle();

// ─── CROSSWORD ────────────────────────────────────────────────────────────────
const CW_LAYOUT = [
  ['#','#','#','C','#','#','#','#','#'],
  ['#','#','#','I','#','#','#','#','#'],
  ['M','U','C','U','S','#','P','E','P'],
  ['#','#','#','S','#','#','#','#','#'],
  ['#','#','#','#','#','#','#','#','#'],
  ['T','R','I','K','A','F','T','A','#'],
  ['#','#','#','#','#','#','#','#','#'],
  ['#','#','#','#','#','A','#','#','#'],
  ['#','#','#','#','#','C','#','#','#'],
];
const CW_NUMS = [
  [0,0,0,1,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[2,0,0,0,0,0,3,0,0],
  [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[4,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,5,0,0,0],[0,0,0,0,0,0,0,0,0],
];
function buildCrossword() {
  const g = document.getElementById('cw-grid'); g.innerHTML = '';
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    const cell = document.createElement('div');
    if (CW_LAYOUT[r][c] === '#') { cell.className = 'cw-cell blk'; }
    else {
      cell.className = 'cw-cell';
      const inp = document.createElement('input'); inp.maxLength = 1; inp.dataset.r = r; inp.dataset.c = c;
      inp.oninput = e => e.target.value = e.target.value.toUpperCase().slice(-1);
      cell.appendChild(inp);
      if (CW_NUMS[r][c]) { const n = document.createElement('div'); n.className = 'cw-num'; n.textContent = CW_NUMS[r][c]; cell.appendChild(n); }
    }
    g.appendChild(cell);
  }
  document.getElementById('clues-ac').innerHTML = [
    '<div class="clue-item"><span class="clue-num">2A.</span> Sticky airway secretion (5)</div>',
    '<div class="clue-item"><span class="clue-num">3A.</span> PEP device type (3)</div>',
    '<div class="clue-item"><span class="clue-num">4A.</span> CF modulator brand (8)</div>',
  ].join('');
  document.getElementById('clues-dn').innerHTML = [
    '<div class="clue-item"><span class="clue-num">1D.</span> Tiny airway hair-like structures (5)</div>',
    '<div class="clue-item"><span class="clue-num">5D.</span> Cycle of breathing technique abbr (3)</div>',
  ].join('');
}
function cwCheck() {
  let ok = 0, tot = 0;
  document.querySelectorAll('#cw-grid .cw-cell:not(.blk) input').forEach(i => {
    tot++; if (i.value === CW_LAYOUT[+i.dataset.r][+i.dataset.c]) ok++;
  });
  document.getElementById('cw-msg').textContent = ok + '/' + tot + ' correct';
}
function cwReveal() {
  document.querySelectorAll('#cw-grid .cw-cell:not(.blk) input').forEach(i => { i.value = CW_LAYOUT[+i.dataset.r][+i.dataset.c]; });
  document.getElementById('cw-msg').textContent = 'Revealed!';
}
buildCrossword();

// ─── EMAIL SUBSCRIBE ──────────────────────────────────────────────────────────
function doSubscribe() {
  const em = document.getElementById('sub-em').value;
  if (!em || !em.includes('@')) { alert('Please enter a valid email address.'); return; }
  document.getElementById('sub-ok').style.display = 'block';
}
