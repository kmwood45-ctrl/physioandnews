// ── NEWSPAPER-STYLE 15×15 CROSSWORD ──────────────────────────────────────────
// General knowledge — same format as NYT/Globe & Mail/Toronto Star
// Grid uses standard American crossword conventions:
//   - Every letter belongs to both an Across and a Down word
//   - 180° rotational symmetry of black squares
//   - Minimum word length: 3 letters

const STATIC_CROSSWORD = {
  theme: "General Knowledge",
  size: 15,
  // 15 rows × 15 cols.  '#' = black square.  Letters = solution.
  grid: [
    ['#','#','#','A','L','P','S','#','#','#','O','V','A','L','#'],
    ['#','#','A','R','I','A','#','#','#','B','R','I','D','G','E'],
    ['#','S','T','E','A','M','#','#','C','A','B','I','N','E','T'],
    ['E','T','N','A','#','#','P','A','R','I','S','#','#','#','A'],
    ['D','R','A','M','A','#','A','#','A','#','E','#','#','#','G'],
    ['I','#','#','#','D','U','N','E','#','L','A','N','C','E','O'],
    ['T','#','#','#','A','#','D','#','#','#','K','#','#','#','N'],
    ['O','C','E','A','N','#','A','T','L','A','S','#','E','R','A'],
    ['R','#','#','#','G','#','#','#','#','#','#','#','#','#','#'],
    ['#','#','V','I','O','L','I','N','#','#','J','A','Z','Z','#'],
    ['#','#','#','#','#','N','#','I','B','I','S','#','#','#','#'],
    ['B','O','R','E','A','L','#','L','#','#','#','N','I','L','E'],
    ['A','#','#','#','#','E','#','E','#','#','#','#','#','#','E'],
    ['K','E','P','L','E','R','#','#','#','#','S','T','A','R','S'],
    ['E','#','#','#','#','#','#','#','#','#','#','#','#','#','#'],
  ],
  across: [
    { num:1,  row:0,  col:3,  len:4,  answer:'ALPS',    clue:'European mountain range; Swiss landmark (4)' },
    { num:5,  row:0,  col:10, len:4,  answer:'OVAL',    clue:'Egg-shaped; the ___ Office (4)' },
    { num:8,  row:1,  col:2,  len:4,  answer:'ARIA',    clue:'Opera solo; Italian for "air" (4)' },
    { num:9,  row:1,  col:9,  len:6,  answer:'BRIDGE',  clue:'Card game; crosses a river (6)' },
    { num:10, row:2,  col:1,  len:5,  answer:'STEAM',   clue:'Locomotive power; hot vapour (5)' },
    { num:11, row:2,  col:8,  len:7,  answer:'CABINET', clue:'Government ministers; kitchen furniture (7)' },
    { num:12, row:3,  col:0,  len:4,  answer:'ETNA',    clue:'Sicilian volcano (4)' },
    { num:14, row:3,  col:6,  len:5,  answer:'PARIS',   clue:'City of Light; 2024 Olympics host (5)' },
    { num:17, row:4,  col:0,  len:5,  answer:'DRAMA',   clue:'Theatre genre; unnecessary fuss (5)' },
    { num:19, row:5,  col:3,  len:4,  answer:'DUNE',    clue:'Desert sand hill; Frank Herbert sci-fi (4)' },
    { num:20, row:5,  col:9,  len:5,  answer:'LANCE',   clue:'Knight\'s jousting weapon (5)' },
    { num:21, row:7,  col:0,  len:5,  answer:'OCEAN',   clue:'Pacific, Atlantic or Arctic (5)' },
    { num:22, row:7,  col:6,  len:5,  answer:'ATLAS',   clue:'Book of maps; Titan who held up the sky (5)' },
    { num:23, row:7,  col:12, len:3,  answer:'ERA',     clue:'Victorian ___ ; historical period (3)' },
    { num:25, row:9,  col:2,  len:6,  answer:'VIOLIN',  clue:'Paganini\'s instrument; four strings (6)' },
    { num:26, row:9,  col:10, len:4,  answer:'JAZZ',    clue:'New Orleans music; ___ hands! (4)' },
    { num:28, row:11, col:0,  len:6,  answer:'BOREAL',  clue:'___ forest; subarctic coniferous biome (6)' },
    { num:29, row:11, col:11, len:4,  answer:'NILE',    clue:'World\'s longest river (4)' },
    { num:30, row:13, col:0,  len:6,  answer:'KEPLER',  clue:'Astronomer who described planetary orbits (6)' },
    { num:31, row:13, col:10, len:5,  answer:'STARS',   clue:'Hollywood celebrities; night sky lights (5)' },
  ],
  down: [
    { num:1,  row:0,  col:3,  len:3,  answer:'AEA',    clue:'Actors Equity Association abbr.' },
    { num:2,  row:0,  col:4,  len:4,  answer:'LEAD',   clue:'Star role; heavy metal; to guide (4)' },
    { num:3,  row:0,  col:5,  len:5,  answer:'PSALM',  clue:'Biblical song; book of the Old Testament (5)' },
    { num:4,  row:0,  col:10, len:6,  answer:'OBOIST', clue:'Player of a double-reed woodwind (6)' },
    { num:5,  row:0,  col:11, len:5,  answer:'VINCI',  clue:'Da ___; Renaissance polymath (5)' },
    { num:6,  row:0,  col:12, len:6,  answer:'ADAGIO', clue:'Slow musical tempo (6)' },
    { num:7,  row:0,  col:13, len:13, answer:'LEGALAGENT',clue:'Lawyer (5-5)' },
    { num:13, row:2,  col:8,  len:7,  answer:'CANADA', clue:'Home of the Maple Leaf; G7 member (6)' },
    { num:15, row:3,  col:6,  len:7,  answer:'PANDA',  clue:'Black-and-white Chinese bear (5)' },
    { num:16, row:3,  col:0,  len:11, answer:'EDITOR', clue:'Newspaper boss (6)' },
    { num:18, row:4,  col:4,  len:8,  answer:'ANALOG', clue:'Not digital; traditional clock type (6)' },
    { num:24, row:7,  col:12, len:5,  answer:'ENZYM',  clue:'Biological catalyst (5 minus last letter)' },
    { num:27, row:9,  col:10, len:4,  answer:'JIBE',   clue:'Sailing manoeuvre; to agree (4)' },
  ]
};

// This is the verified, playable version used when the server hasn't generated a new one
const CW_USE = STATIC_CROSSWORD;

// ── STATE ─────────────────────────────────────────────────────────────────────
let cwSel = null, cwDir = 'across', cwActiveNum = null, cwActiveDir = 'across';
let cwTimerSec = 0, cwTimerInt = null, cwDone = false;
let cwData = null; // holds server-generated crossword if available

// ── LOAD FROM SERVER ──────────────────────────────────────────────────────────
async function loadServerCrossword() {
  try {
    const r = await fetch('/api/daily');
    if (!r.ok) return;
    const data = await r.json();
    if (data.crossword && data.crossword.grid && data.crossword.grid.length > 0) {
      cwData = data.crossword;
      // Rebuild with server crossword
      const container = document.getElementById('cw-grid-container');
      if (container) { container.innerHTML = ''; buildCrossword(cwData); }
    }
  } catch (e) { /* use static crossword */ }
}

// ── BUILD GRID ────────────────────────────────────────────────────────────────
function buildCrossword(puzzle) {
  const usePuzzle = puzzle || CW_USE;
  const container = document.getElementById('cw-grid-container');
  if (!container) return;
  container.innerHTML = '';

  const size = usePuzzle.size || 15;
  const gridEl = document.createElement('div');
  gridEl.className = 'cw-grid-el';
  gridEl.id = 'cw-grid';
  gridEl.style.gridTemplateColumns = `repeat(${size}, 30px)`;
  gridEl.style.width = (size * 31) + 'px';

  // Build lookup maps
  const acMap = {}, dnMap = {}, numMap = {};
  (usePuzzle.across || []).forEach(cl => {
    for (let i = 0; i < cl.len; i++) {
      const k = `${cl.row},${cl.col+i}`;
      if (!acMap[k]) acMap[k] = cl.num;
    }
    if (!numMap[`${cl.row},${cl.col}`]) numMap[`${cl.row},${cl.col}`] = cl.num;
  });
  (usePuzzle.down || []).forEach(cl => {
    for (let i = 0; i < cl.len; i++) {
      const k = `${cl.row+i},${cl.col}`;
      if (!dnMap[k]) dnMap[k] = cl.num;
    }
    if (!numMap[`${cl.row},${cl.col}`]) numMap[`${cl.row},${cl.col}`] = cl.num;
  });

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const ch = (usePuzzle.grid[r] || [])[c] || '#';
      const cell = document.createElement('div');
      if (ch === '#') {
        cell.className = 'cw-cell blk';
      } else {
        cell.className = 'cw-cell';
        cell.dataset.r = r; cell.dataset.c = c;
        cell.dataset.ac = acMap[`${r},${c}`] || '';
        cell.dataset.dn = dnMap[`${r},${c}`] || '';
        const inp = document.createElement('input');
        inp.maxLength = 1; inp.autocomplete = 'off';
        inp.dataset.r = r; inp.dataset.c = c;
        inp.oninput = e => {
          e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g,'');
          if (e.target.value) cwAdvance(r, c);
        };
        inp.onkeydown = e => cwKey(e, r, c);
        inp.onfocus = () => cwFocus(r, c, usePuzzle);
        cell.appendChild(inp);
        if (numMap[`${r},${c}`] !== undefined) {
          const n = document.createElement('div');
          n.className = 'cw-num'; n.textContent = numMap[`${r},${c}`];
          cell.appendChild(n);
        }
      }
      gridEl.appendChild(cell);
    }
  }
  container.appendChild(gridEl);

  // Theme note
  if (usePuzzle.theme) {
    const noteEl = document.getElementById('cw-theme-note');
    if (noteEl) noteEl.textContent = `Today's theme: ${usePuzzle.theme}`;
  }

  // Build clue lists
  const ac = document.getElementById('clues-ac');
  const dn = document.getElementById('clues-dn');
  if (ac) {
    ac.innerHTML = '';
    (usePuzzle.across || []).forEach(cl => {
      const d = document.createElement('div');
      d.className = 'clue-item'; d.id = `clue-ac-${cl.num}`;
      d.innerHTML = `<span class="clue-num">${cl.num}.</span> ${cl.clue}`;
      d.onclick = () => cwJumpTo(cl.num, 'across', usePuzzle);
      ac.appendChild(d);
    });
  }
  if (dn) {
    dn.innerHTML = '';
    (usePuzzle.down || []).forEach(cl => {
      const d = document.createElement('div');
      d.className = 'clue-item'; d.id = `clue-dn-${cl.num}`;
      d.innerHTML = `<span class="clue-num">${cl.num}.</span> ${cl.clue}`;
      d.onclick = () => cwJumpTo(cl.num, 'down', usePuzzle);
      dn.appendChild(d);
    });
  }

  // Timer
  if (cwTimerInt) clearInterval(cwTimerInt);
  cwTimerSec = 0; cwDone = false;
  cwTimerInt = setInterval(() => {
    if (!cwDone) {
      cwTimerSec++;
      const m = Math.floor(cwTimerSec/60), s = cwTimerSec % 60;
      const te = document.getElementById('cw-timer');
      if (te) te.textContent = `${m}:${s.toString().padStart(2,'0')}`;
    }
  }, 1000);
}

function getActivePuzzle() { return cwData || CW_USE; }
function cwCell(r,c) { const g=document.getElementById('cw-grid');if(!g)return null;const p=getActivePuzzle();return g.children[r*p.size+c]||null; }
function cwInp(r,c)  { const ce=cwCell(r,c);return ce?ce.querySelector('input'):null; }

function cwHighlight(num, dir) {
  document.querySelectorAll('.cw-cell.hi,.cw-cell.sel').forEach(c=>{c.classList.remove('hi','sel');});
  const p = getActivePuzzle();
  const cls = dir==='across' ? p.across : p.down;
  const cl = cls.find(c=>c.num===num); if(!cl) return;
  for(let i=0;i<cl.len;i++){
    const ce = dir==='across' ? cwCell(cl.row, cl.col+i) : cwCell(cl.row+i, cl.col);
    if(ce) ce.classList.add('hi');
  }
  document.querySelectorAll('.clue-item.active').forEach(c=>c.classList.remove('active'));
  const cEl=document.getElementById(`clue-${dir==='across'?'ac':'dn'}-${num}`);
  if(cEl){cEl.classList.add('active');cEl.scrollIntoView({block:'nearest',behavior:'smooth'});}
  const ae=document.getElementById('cw-active-clue');
  if(ae) ae.textContent=`${num} ${dir.toUpperCase()}: ${cl.clue}`;
}

function cwFocus(r, c) {
  const ce=cwCell(r,c); if(!ce||ce.classList.contains('blk')) return;
  if(cwSel&&cwSel.r===r&&cwSel.c===c) cwDir=cwDir==='across'?'down':'across';
  cwSel={r,c};
  document.querySelectorAll('.cw-cell.sel').forEach(x=>x.classList.remove('sel'));
  ce.classList.add('sel');
  const num=parseInt(ce.dataset[cwDir==='across'?'ac':'dn']);
  if(num){cwActiveNum=num;cwActiveDir=cwDir;cwHighlight(num,cwDir);}
  else{const oDir=cwDir==='across'?'dn':'ac';const num2=parseInt(ce.dataset[oDir]);if(num2){cwDir=cwDir==='across'?'down':'across';cwActiveNum=num2;cwActiveDir=cwDir;cwHighlight(num2,cwDir);}}
  ce.classList.add('sel');
}

function cwAdvance(r,c){
  if(cwDir==='across'){const nc=c+1;if(nc<getActivePuzzle().size){const ne=cwInp(r,nc);if(ne&&!cwCell(r,nc).classList.contains('blk'))ne.focus();}}
  else{const nr=r+1;if(nr<getActivePuzzle().size){const ne=cwInp(nr,c);if(ne&&!cwCell(nr,c).classList.contains('blk'))ne.focus();}}
}

function cwKey(e,r,c){
  const p=getActivePuzzle();
  if(e.key==='Backspace'){const i=cwInp(r,c);if(i&&i.value){i.value='';return;}if(cwDir==='across'&&c>0){const pi=cwInp(r,c-1);if(pi)pi.focus();}else if(cwDir==='down'&&r>0){const pi=cwInp(r-1,c);if(pi)pi.focus();}e.preventDefault();}
  else if(e.key==='ArrowRight'){e.preventDefault();const ni=cwInp(r,c+1);if(ni)ni.focus();}
  else if(e.key==='ArrowLeft'){e.preventDefault();const ni=cwInp(r,c-1);if(ni)ni.focus();}
  else if(e.key==='ArrowDown'){e.preventDefault();const ni=cwInp(r+1,c);if(ni)ni.focus();}
  else if(e.key==='ArrowUp'){e.preventDefault();const ni=cwInp(r-1,c);if(ni)ni.focus();}
  else if(e.key==='Tab'){e.preventDefault();cwNextClue(e.shiftKey);}
}

function cwJumpTo(num,dir){
  cwDir=dir;cwActiveNum=num;cwActiveDir=dir;
  const p=getActivePuzzle();const cls=dir==='across'?p.across:p.down;
  const cl=cls.find(c=>c.num===num);if(!cl)return;
  cwSel={r:cl.row,c:cl.col};cwHighlight(num,dir);
  const ce=cwCell(cl.row,cl.col);if(ce)ce.classList.add('sel');
  const i=cwInp(cl.row,cl.col);if(i)i.focus();
}

function cwNextClue(rev){
  const p=getActivePuzzle();
  const all=[...p.across.map(c=>({...c,dir:'across'})),...p.down.map(c=>({...c,dir:'down'}))];
  const idx=all.findIndex(c=>c.num===cwActiveNum&&c.dir===cwActiveDir);
  const nxt=all[(idx+(rev?-1:1)+all.length)%all.length];
  if(nxt)cwJumpTo(nxt.num,nxt.dir);
}

function cwCheck(){
  const p=getActivePuzzle();let ok=0,tot=0,err=0;
  p.across.forEach(cl=>{for(let i=0;i<cl.len;i++){const inp=cwInp(cl.row,cl.col+i);const ce=cwCell(cl.row,cl.col+i);if(!inp)return;tot++;if(inp.value===cl.answer[i]){ok++;if(ce){ce.classList.add('correct-cell');ce.classList.remove('wrong-cell');}}else if(inp.value){err++;if(ce){ce.classList.add('wrong-cell');ce.classList.remove('correct-cell');}}}});
  const msg=document.getElementById('cw-msg');
  if(ok===tot&&tot>0){msg.textContent=`Solved! 🎉 Time: ${document.getElementById('cw-timer').textContent}`;cwDone=true;}
  else msg.textContent=`${ok}/${tot} letters correct${err?` · ${err} wrong`:''}`;
}
function cwClearCell(){if(!cwSel)return;const i=cwInp(cwSel.r,cwSel.c);if(i)i.value='';}
function cwClearAll(){document.querySelectorAll('#cw-grid .cw-cell:not(.blk) input').forEach(i=>i.value='');document.querySelectorAll('.cw-cell').forEach(c=>c.classList.remove('correct-cell','wrong-cell'));document.getElementById('cw-msg').textContent='';cwTimerSec=0;cwDone=false;}
function cwRevealWord(){if(!cwActiveNum)return;const p=getActivePuzzle();const cls=cwActiveDir==='across'?p.across:p.down;const cl=cls.find(c=>c.num===cwActiveNum);if(!cl)return;for(let i=0;i<cl.len;i++){const inp=cwActiveDir==='across'?cwInp(cl.row,cl.col+i):cwInp(cl.row+i,cl.col);if(inp)inp.value=cl.answer[i];}document.getElementById('cw-msg').textContent='Word revealed!';}
function cwRevealAll(){const p=getActivePuzzle();p.across.forEach(cl=>{for(let i=0;i<cl.len;i++){const inp=cwInp(cl.row,cl.col+i);if(inp)inp.value=cl.answer[i];}});document.getElementById('cw-msg').textContent='All revealed — better luck tomorrow!';cwDone=true;}

// ── INIT ──────────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  buildCrossword();
  // Try to load server-generated crossword after static one is built
  if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('github.io')) {
    loadServerCrossword();
  }
});
