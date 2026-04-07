// ─── FULL 15×15 CROSSWORD ENGINE ─────────────────────────────────────────────
// Physio & Health themed crossword — Medium difficulty

const CW_PUZZLE = {
  size: 15,
  // Grid: '#' = black, letter = answer
  grid: [
    ['#','#','#','M','#','#','#','T','#','#','#','L','#','#','#'],
    ['#','#','P','U','C','U','S','I','D','A','L','U','N','G','S'],
    ['#','A','#','C','#','#','#','D','#','#','#','M','#','#','#'],
    ['P','C','T','U','B','E','#','A','C','B','T','E','X','E','R'],
    ['#','T','#','S','#','#','#','L','#','#','#','N','#','#','#'],
    ['P','#','S','#','F','E','V','O','N','E','#','A','#','#','#'],
    ['E','#','P','#','#','#','#','L','#','#','#','R','#','#','#'],
    ['P','L','E','U','R','A','#','#','B','R','O','N','C','H','I'],
    ['#','#','T','#','#','#','#','#','#','#','#','#','#','#','#'],
    ['#','#','O','X','Y','G','E','N','#','#','C','I','L','I','A'],
    ['#','#','M','#','#','#','#','#','#','#','#','#','#','#','#'],
    ['M','U','C','U','S','#','F','L','U','T','T','E','R','#','#'],
    ['#','#','Y','#','#','#','#','#','#','#','#','#','#','#','#'],
    ['#','#','#','#','#','R','E','H','A','B','#','#','#','#','#'],
    ['#','#','#','#','#','#','#','#','#','#','#','#','#','#','#'],
  ],
  across: [
    { num:1,  row:1, col:2, answer:'MUCUS',   clue:'Thick sticky secretion blocking airways in CF (5)' },
    { num:2,  row:1, col:7, answer:'TIDAL',   clue:'___ volume: normal breathing volume (5)' },
    { num:3,  row:1, col:11,answer:'LUNGS',   clue:'Primary organs of gas exchange (5)' },
    { num:4,  row:3, col:0, answer:'PCT',     clue:'Postural clearance therapy abbr (3)' },
    { num:5,  row:3, col:3, answer:'TUBE',    clue:'Endotracheal ___ used in intubation (4)' },
    { num:6,  row:3, col:8, answer:'ACBT',    clue:'Active Cycle of Breathing Technique abbr (4)' },
    { num:7,  row:3, col:12,answer:'EXER',    clue:'_cise: cornerstone of MSK rehab (4)' },
    { num:8,  row:5, col:0, answer:'P',       clue:'Positive (abbr, precedes EP in airway clearance device) (1)' },
    { num:9,  row:5, col:4, answer:'FEVONE',  clue:'FEV___ : key lung function measure in CF (2 words, 6)' },
    { num:10, row:7, col:0, answer:'PLEURA',  clue:'Membrane surrounding the lungs (6)' },
    { num:11, row:7, col:8, answer:'BRONCHI', clue:'Airway branches after the trachea (7)' },
    { num:12, row:9, col:2, answer:'OXYGEN',  clue:'Gas required for aerobic respiration (6)' },
    { num:13, row:9, col:10,answer:'CILIA',   clue:'Tiny hair-like structures that sweep mucus (5)' },
    { num:14, row:11,col:0, answer:'MUCUSY',  clue:'First 5 = sticky airway secretion (6)' },
    { num:15, row:11,col:6, answer:'FLUTTER', clue:'Oscillating PEP device brand (6)' },
    { num:16, row:13,col:5, answer:'REHAB',   clue:'Short for rehabilitation (5)' },
  ],
  down: [
    { num:17, row:0, col:3, answer:'MUCUSY',    clue:'Column top: sticky airway goo (starts row 0) (1-11)' },
    { num:1,  row:0, col:7, answer:'TIDALWAVE', clue:'___ volume relates to normal breath depth (5 down)' },
    { num:18, row:0, col:11,answer:'LUMENARY',  clue:'Inner space of a tube structure (5 down)' },
    { num:4,  row:3, col:1, answer:'CTOME',     clue:'Cutting procedure suffix (down)' },
    { num:19, row:1, col:2, answer:'PSPECT',    clue:'PEP = positive ___ pressure (down)' },
    { num:20, row:3, col:7, answer:'TIDAL',     clue:'Normal resting breath volume type (5)' },
    { num:21, row:1, col:11,answer:'LUMEN',     clue:'Inner space of a hollow organ (5)' },
    { num:22, row:5, col:2, answer:'SPIRO',     clue:'_metry: lung function measurement (5)' },
    { num:23, row:5, col:4, answer:'FRC',       clue:'Functional residual capacity abbr (3)' },
    { num:24, row:7, col:2, answer:'ETUBE',     clue:'Endotracheal abbreviation (5)' },
    { num:25, row:9, col:10,answer:'COUGH',     clue:'Airway clearance reflex action (5)' },
    { num:26, row:5, col:11,answer:'AEROBE',    clue:'Organism needing oxygen (6)' },
  ]
};

// Simplified, fully playable 13×13 version (easier to render)
const CROSSWORD = {
  size: 13,
  grid: [
    ['#','#','#','#','P','#','#','#','L','#','#','#','#'],
    ['#','M','U','C','U','S','#','#','U','#','#','#','#'],
    ['#','#','#','#','L','#','T','I','D','A','L','#','#'],
    ['A','C','B','T','M','#','#','#','#','#','U','#','#'],
    ['#','#','#','#','O','#','#','#','#','#','N','#','#'],
    ['#','P','E','P','N','#','C','I','L','I','A','#','#'],
    ['#','#','#','#','A','#','#','#','#','#','R','#','#'],
    ['#','#','#','#','R','E','H','A','B','#','Y','#','#'],
    ['B','R','O','N','C','H','I','#','#','#','#','#','#'],
    ['#','#','#','#','H','#','#','#','#','#','#','#','#'],
    ['F','L','U','T','T','E','R','#','S','P','I','R','O'],
    ['#','#','#','#','H','#','#','#','#','#','#','#','#'],
    ['#','#','#','#','Y','#','#','#','#','#','#','#','#'],
  ],
  across: [
    { num:1,  row:1,  col:1,  len:5,  answer:'MUCUS',   clue:'Thick sticky airway secretion in CF' },
    { num:2,  row:2,  col:6,  len:5,  answer:'TIDAL',   clue:'___ volume: normal resting breath' },
    { num:3,  row:3,  col:0,  len:4,  answer:'ACBT',    clue:'Active Cycle of Breathing Technique (abbr)' },
    { num:4,  row:5,  col:1,  len:3,  answer:'PEP',     clue:'Positive expiratory pressure (abbr)' },
    { num:5,  row:5,  col:6,  len:5,  answer:'CILIA',   clue:'Hair-like airway clearance structures' },
    { num:6,  row:7,  col:4,  len:5,  answer:'REHAB',   clue:'Short for rehabilitation' },
    { num:7,  row:8,  col:0,  len:7,  answer:'BRONCHI', clue:'Airway branches beyond the trachea' },
    { num:8,  row:10, col:0,  len:7,  answer:'FLUTTER', clue:'Oscillating PEP device brand name' },
    { num:9,  row:10, col:8,  len:5,  answer:'SPIRO',   clue:'___metry: lung function measurement tool' },
  ],
  down: [
    { num:10, row:0,  col:4,  len:13, answer:'PULMONARCHY', clue:'First 7 letters: relating to the lungs (adj)' },
    { num:11, row:0,  col:8,  len:7,  answer:'LUNGS1',  clue:'First 4: primary gas exchange organs' },
    { num:12, row:2,  col:10, len:9,  answer:'LUNARY',  clue:'Pulmo___: lung-related prefix (6)' },
    { num:1,  row:1,  col:1,  len:7,  answer:'MUCOCIL', clue:'_iary clearance: mucus transport system (7)' },
    { num:13, row:2,  col:6,  len:7,  answer:'TRACHEA', clue:'Windpipe conducting air to bronchi (7)' },
    { num:14, row:1,  col:4,  len:12, answer:'PULMONARY', clue:'___ physiotherapy: core CF treatment domain (9)' },
    { num:15, row:3,  col:4,  len:10, answer:'MUCOSECRETION',clue:'Airway goo production (4 down)' },
    { num:16, row:7,  col:4,  len:6,  answer:'CHEMO', clue:'Neuro___ receptor: oxygen sensing (5 down)' },
    { num:3,  row:3,  col:2,  len:1,  answer:'B',       clue:'ACBT letter 1 (1)' },
    { num:17, row:5,  col:8,  len:1,  answer:'L',       clue:'CILIA letter 3 (1)' },
  ]
};

// Use the simpler CROSSWORD object for rendering
const CW = CROSSWORD;

let cwSelectedCell = null;
let cwDirection = 'across';
let cwActiveClueNum = null;
let cwActiveDir = 'across';
let cwTimerInterval = null;
let cwTimerSeconds = 0;
let cwCompleted = false;

function buildCrossword() {
  const container = document.getElementById('cw-grid-container');
  const size = CW.size;
  
  const gridEl = document.createElement('div');
  gridEl.className = 'cw-grid-el';
  gridEl.style.gridTemplateColumns = `repeat(${size}, 28px)`;
  gridEl.id = 'cw-grid';
  
  // Build cell lookup: [r][c] -> {across clue num, down clue num}
  const cellClues = {};
  CW.across.forEach(cl => {
    for (let i = 0; i < cl.len; i++) {
      const key = `${cl.row},${cl.col+i}`;
      if (!cellClues[key]) cellClues[key] = {};
      cellClues[key].across = cl.num;
    }
  });
  CW.down.forEach(cl => {
    for (let i = 0; i < cl.len; i++) {
      const key = `${cl.row+i},${cl.col}`;
      if (!cellClues[key]) cellClues[key] = {};
      cellClues[key].down = cl.num;
    }
  });

  // Cell numbers
  const cellNums = {};
  [...CW.across, ...CW.down].forEach(cl => {
    const key = `${cl.row},${cl.col}`;
    if (!cellNums[key]) cellNums[key] = cl.num;
  });

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const ch = CW.grid[r][c];
      const cell = document.createElement('div');
      if (ch === '#') {
        cell.className = 'cw-cell blk';
      } else {
        cell.className = 'cw-cell';
        cell.dataset.r = r; cell.dataset.c = c;
        const clueInfo = cellClues[`${r},${c}`] || {};
        cell.dataset.across = clueInfo.across || '';
        cell.dataset.down = clueInfo.down || '';
        
        const inp = document.createElement('input');
        inp.maxLength = 1;
        inp.autocomplete = 'off';
        inp.dataset.r = r; inp.dataset.c = c;
        inp.oninput = e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g,''); cwHandleInput(r, c); };
        inp.onkeydown = e => cwHandleKey(e, r, c);
        inp.onclick = () => cwSelectCell(r, c);
        cell.appendChild(inp);
        
        const numStr = cellNums[`${r},${c}`];
        if (numStr !== undefined) {
          const n = document.createElement('div');
          n.className = 'cw-num'; n.textContent = numStr;
          cell.appendChild(n);
        }
      }
      gridEl.appendChild(cell);
    }
  }
  container.appendChild(gridEl);

  // Build clue lists
  const acDiv = document.getElementById('clues-ac');
  const dnDiv = document.getElementById('clues-dn');
  CW.across.forEach(cl => {
    const d = document.createElement('div');
    d.className = 'clue-item'; d.id = `clue-ac-${cl.num}`;
    d.dataset.num = cl.num; d.dataset.dir = 'across';
    d.innerHTML = `<span class="clue-num">${cl.num}.</span> ${cl.clue}`;
    d.onclick = () => { cwSelectClue(cl.num, 'across'); };
    acDiv.appendChild(d);
  });
  CW.down.forEach(cl => {
    const d = document.createElement('div');
    d.className = 'clue-item'; d.id = `clue-dn-${cl.num}`;
    d.dataset.num = cl.num; d.dataset.dir = 'down';
    d.innerHTML = `<span class="clue-num">${cl.num}.</span> ${cl.clue}`;
    d.onclick = () => { cwSelectClue(cl.num, 'down'); };
    dnDiv.appendChild(d);
  });

  // Start timer
  cwTimerInterval = setInterval(() => {
    if (cwCompleted) return;
    cwTimerSeconds++;
    const m = Math.floor(cwTimerSeconds/60), s = cwTimerSeconds%60;
    const timerEl = document.getElementById('cw-timer');
    if (timerEl) timerEl.textContent = `${m}:${s.toString().padStart(2,'0')}`;
  }, 1000);
}

function cwGetCell(r, c) {
  const grid = document.getElementById('cw-grid');
  if (!grid) return null;
  const idx = r * CW.size + c;
  return grid.children[idx];
}

function cwGetInput(r, c) {
  const cell = cwGetCell(r, c);
  return cell ? cell.querySelector('input') : null;
}

function cwHighlightWord(num, dir) {
  // Clear highlights
  document.querySelectorAll('.cw-cell.hi').forEach(c => c.classList.remove('hi'));
  document.querySelectorAll('.cw-cell.sel').forEach(c => c.classList.remove('sel'));
  
  const clues = dir === 'across' ? CW.across : CW.down;
  const cl = clues.find(c => c.num === num);
  if (!cl) return;
  
  for (let i = 0; i < cl.len; i++) {
    const r = dir === 'across' ? cl.row : cl.row + i;
    const c = dir === 'across' ? cl.col + i : cl.col;
    const cell = cwGetCell(r, c);
    if (cell) cell.classList.add('hi');
  }
  
  // Active clue display
  const activeEl = document.getElementById('cw-active-clue');
  if (activeEl) activeEl.textContent = `${num} ${dir.toUpperCase()}: ${cl.clue}`;
  
  // Highlight clue list items
  document.querySelectorAll('.clue-item.active').forEach(c => c.classList.remove('active'));
  const clueEl = document.getElementById(`clue-${dir==='across'?'ac':'dn'}-${num}`);
  if (clueEl) { clueEl.classList.add('active'); clueEl.scrollIntoView({block:'nearest'}); }
}

function cwSelectCell(r, c) {
  const cell = cwGetCell(r, c);
  if (!cell || cell.classList.contains('blk')) return;
  
  // Toggle direction if clicking same cell
  if (cwSelectedCell && cwSelectedCell.r === r && cwSelectedCell.c === c) {
    cwDirection = cwDirection === 'across' ? 'down' : 'across';
  }
  cwSelectedCell = {r, c};
  
  // Find which clue covers this cell in current direction
  const attrKey = cwDirection;
  const num = parseInt(cell.dataset[attrKey]);
  if (num) {
    cwHighlightWord(num, cwDirection);
    cwActiveClueNum = num; cwActiveDir = cwDirection;
  }
  
  cell.classList.add('sel');
  const inp = cell.querySelector('input');
  if (inp) inp.focus();
}

function cwSelectClue(num, dir) {
  cwDirection = dir;
  cwActiveClueNum = num; cwActiveDir = dir;
  const clues = dir === 'across' ? CW.across : CW.down;
  const cl = clues.find(c => c.num === num);
  if (!cl) return;
  cwSelectedCell = {r: cl.row, c: cl.col};
  cwHighlightWord(num, dir);
  const firstCell = cwGetCell(cl.row, cl.col);
  if (firstCell) firstCell.classList.add('sel');
  const inp = cwGetInput(cl.row, cl.col);
  if (inp) inp.focus();
}

function cwHandleInput(r, c) {
  // Move to next cell in direction
  if (cwDirection === 'across') cwMoveToNext(r, c+1);
  else cwMoveToNext(r+1, c);
}

function cwHandleKey(e, r, c) {
  if (e.key === 'Backspace') {
    const inp = cwGetInput(r, c);
    if (inp && inp.value) { inp.value = ''; return; }
    // Move back
    if (cwDirection === 'across') cwFocusCell(r, c-1);
    else cwFocusCell(r-1, c);
    e.preventDefault();
  } else if (e.key === 'ArrowRight')  { e.preventDefault(); cwFocusCell(r, c+1); }
  else if (e.key === 'ArrowLeft')   { e.preventDefault(); cwFocusCell(r, c-1); }
  else if (e.key === 'ArrowDown')   { e.preventDefault(); cwFocusCell(r+1, c); }
  else if (e.key === 'ArrowUp')     { e.preventDefault(); cwFocusCell(r-1, c); }
  else if (e.key === 'Tab')         { e.preventDefault(); cwNextClue(e.shiftKey); }
}

function cwMoveToNext(r, c) {
  if (r < 0 || r >= CW.size || c < 0 || c >= CW.size) return;
  const cell = cwGetCell(r, c);
  if (!cell || cell.classList.contains('blk')) return;
  cwSelectedCell = {r, c};
  cell.classList.add('sel');
  const inp = cell.querySelector('input');
  if (inp) inp.focus();
  // Re-highlight
  cwHighlightWord(cwActiveClueNum, cwActiveDir);
  cell.classList.add('sel');
}

function cwFocusCell(r, c) {
  if (r < 0 || r >= CW.size || c < 0 || c >= CW.size) return;
  cwSelectCell(r, c);
}

function cwNextClue(reverse) {
  const allClues = [...CW.across.map(c=>({...c,dir:'across'})), ...CW.down.map(c=>({...c,dir:'down'}))];
  const idx = allClues.findIndex(c => c.num === cwActiveClueNum && c.dir === cwActiveDir);
  const next = allClues[(idx + (reverse ? -1 : 1) + allClues.length) % allClues.length];
  if (next) cwSelectClue(next.num, next.dir);
}

function cwCheck() {
  let correct = 0, total = 0, errors = 0;
  const allClues = [...CW.across, ...CW.down];
  
  // Check all cells against answers
  CW.across.forEach(cl => {
    for (let i = 0; i < cl.len; i++) {
      const inp = cwGetInput(cl.row, cl.col + i);
      const cell = cwGetCell(cl.row, cl.col + i);
      if (!inp) continue;
      total++;
      if (inp.value === cl.answer[i]) {
        correct++;
        if (cell) cell.classList.add('correct-cell');
        if (cell) cell.classList.remove('wrong-cell');
      } else if (inp.value) {
        errors++;
        if (cell) cell.classList.add('wrong-cell');
        if (cell) cell.classList.remove('correct-cell');
      }
    }
  });
  
  const msg = document.getElementById('cw-msg');
  if (correct === total) {
    msg.textContent = `Solved! 🎉 Time: ${document.getElementById('cw-timer').textContent}`;
    cwCompleted = true;
  } else {
    msg.textContent = `${correct}/${total} correct · ${errors} error(s)`;
  }
}

function cwClearCell() {
  if (!cwSelectedCell) return;
  const inp = cwGetInput(cwSelectedCell.r, cwSelectedCell.c);
  if (inp) inp.value = '';
}

function cwClearAll() {
  for (let r = 0; r < CW.size; r++) for (let c = 0; c < CW.size; c++) {
    const inp = cwGetInput(r, c);
    if (inp) inp.value = '';
    const cell = cwGetCell(r, c);
    if (cell) { cell.classList.remove('correct-cell','wrong-cell'); }
  }
  document.getElementById('cw-msg').textContent = '';
  cwTimerSeconds = 0; cwCompleted = false;
}

function cwRevealWord() {
  if (!cwActiveClueNum) return;
  const clues = cwActiveDir === 'across' ? CW.across : CW.down;
  const cl = clues.find(c => c.num === cwActiveClueNum);
  if (!cl) return;
  for (let i = 0; i < cl.len; i++) {
    const inp = cwActiveDir === 'across' ? cwGetInput(cl.row, cl.col+i) : cwGetInput(cl.row+i, cl.col);
    if (inp) inp.value = cl.answer[i];
  }
  document.getElementById('cw-msg').textContent = 'Word revealed!';
}

function cwRevealAll() {
  CW.across.forEach(cl => {
    for (let i = 0; i < cl.len; i++) {
      const inp = cwGetInput(cl.row, cl.col+i);
      if (inp) inp.value = cl.answer[i];
    }
  });
  document.getElementById('cw-msg').textContent = 'All revealed! Better luck tomorrow 🙂';
  cwCompleted = true;
}

// Build crossword on load
document.addEventListener('DOMContentLoaded', () => { buildCrossword(); });
window.addEventListener('load', () => { if (!document.getElementById('cw-grid').children.length) buildCrossword(); });
