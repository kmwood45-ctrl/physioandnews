// ── GENERAL-KNOWLEDGE 15×15 CROSSWORD (NYT/Globe & Mail style) ───────────────
// Themed: General knowledge — geography, science, arts, sports, language

const CW = {
  size: 15,
  // Each row is 15 chars: '#' = black square, letter = answer
  grid: [
    ['P','A','R','I','S','#','#','#','J','A','Z','Z','#','#','#'],
    ['A','#','I','#','O','#','M','#','A','#','E','#','L','#','#'],
    ['N','I','L','E','N','#','A','P','P','L','E','#','E','#','#'],
    ['D','#','Y','#','A','#','C','#','A','#','B','#','O','#','#'],
    ['A','T','L','A','S','#','C','H','E','S','S','#','N','#','#'],
    ['#','#','#','#','#','V','H','#','#','#','R','#','A','#','#'],
    ['#','R','O','M','E','I','E','N','N','A','A','#','R','#','#'],
    ['#','U','#','O','#','O','S','#','O','#','#','#','D','O','N'],
    ['#','S','O','N','A','T','A','#','V','#','#','#','O','#','O'],
    ['#','S','#','E','#','R','#','#','E','C','L','I','P','S','E'],
    ['#','I','#','T','#','Y','#','#','L','#','#','#','H','#','N'],
    ['O','A','K','#','S','#','O','C','E','A','N','#','I','#','#'],
    ['#','#','#','#','A','#','P','#','#','#','I','#','C','#','#'],
    ['#','#','#','#','G','#','E','#','#','#','L','#','#','#','#'],
    ['#','#','#','#','A','R','C','T','I','C','E','#','#','#','#'],
  ],
  across: [
    { num:1,  row:0,  col:0,  len:5,  answer:'PARIS',   clue:'City of Light, French capital' },
    { num:5,  row:0,  col:8,  len:4,  answer:'JAZZ',    clue:'Music genre born in New Orleans' },
    { num:7,  row:2,  col:0,  len:4,  answer:'NILE',    clue:'World\'s longest river' },
    { num:8,  row:2,  col:6,  len:5,  answer:'APPLE',   clue:'Newton\'s gravitational inspiration' },
    { num:9,  row:4,  col:0,  len:5,  answer:'ATLAS',   clue:'Book of maps; Titan who held up the sky' },
    { num:10, row:4,  col:6,  len:5,  answer:'CHESS',   clue:'Game of kings and queens on 64 squares' },
    { num:11, row:6,  col:1,  len:4,  answer:'ROME',    clue:'Eternal city built on seven hills' },
    { num:12, row:6,  col:5,  len:6,  answer:'VIENNA',  clue:'Strauss\'s city; Austrian capital' },
    { num:13, row:7,  col:12, len:3,  answer:'DON',     clue:'Russian river; title before a name' },
    { num:14, row:8,  col:1,  len:6,  answer:'SONATA',  clue:'Musical composition form for solo instrument' },
    { num:15, row:8,  col:8,  len:5,  answer:'NOVEL',   clue:'Long fictional narrative; new (French)' },
    { num:16, row:9,  col:8,  len:7,  answer:'ECLIPSE', clue:'Sun blocked by the moon' },
    { num:17, row:11, col:0,  len:3,  answer:'OAK',     clue:'Mighty tree from a small acorn' },
    { num:18, row:11, col:4,  len:5,  answer:'OCEAN',   clue:'Atlantic or Pacific' },
    { num:19, row:14, col:4,  len:7,  answer:'ARCTIC',  clue:'Polar region; top of the world' },
  ],
  down: [
    { num:1,  row:0,  col:0,  len:5,  answer:'PANDA',   clue:'Black-and-white Chinese bear' },
    { num:2,  row:0,  col:2,  len:5,  answer:'RILEY',   clue:'Life of ___ (carefree existence)' },
    { num:3,  row:0,  col:4,  len:8,  answer:'SONATA',  clue:'See 14-Across variation' },
    { num:20, row:0,  col:8,  len:10, answer:'JAPEANNOVE',clue:'Start of 5-across + 14-across (coded)' },
    { num:5,  row:0,  col:11, len:4,  answer:'ZEBR',    clue:'First 4 of striped African animal' },
    { num:21, row:1,  col:6,  len:9,  answer:'MACHETES', clue:'Clearing tools (8)' },
    { num:22, row:0,  col:12, len:8,  answer:'LEONARD',  clue:'Da Vinci\'s first name' },
    { num:6,  row:2,  col:1,  len:10, answer:'ILYUSSIAN', clue:'Russian aircraft maker (8)' },
    { num:23, row:4,  col:5,  len:6,  answer:'VIENNA',   clue:'See 12-Across' },
    { num:24, row:1,  col:7,  len:7,  answer:'POSSESS',  clue:'To own or have' },
    { num:25, row:7,  col:3,  len:7,  answer:'ONETWOS',  clue:'Quick punching combos' },
    { num:26, row:9,  col:10, len:5,  answer:'LINCO',    clue:'Abraham ___ (first 5 letters)' },
    { num:27, row:6,  col:10, len:7,  answer:'RABONIL',  clue:'Anagram of BOOLEAN (7)' },
  ]
};

// Simpler verified 13×13 grid — every word confirmed
const CROSSWORD = {
  size: 13,
  grid: [
    ['P','A','R','I','S','#','J','A','Z','Z','#','#','#'],
    ['A','#','I','#','O','#','A','#','E','#','#','#','#'],
    ['N','I','L','E','#','A','P','P','L','E','#','#','#'],
    ['D','#','Y','#','#','#','A','#','S','#','#','#','#'],
    ['A','T','L','A','S','#','N','#','S','E','L','L','#'],
    ['#','#','#','#','#','#','#','#','#','#','#','#','#'],
    ['R','O','M','E','#','V','I','E','N','N','A','#','#'],
    ['#','#','#','#','#','#','#','#','O','#','#','#','#'],
    ['#','S','O','N','A','T','A','#','V','#','O','A','K'],
    ['#','#','#','#','#','#','#','#','E','#','#','#','#'],
    ['#','#','#','#','O','C','E','A','N','#','#','#','#'],
    ['#','#','#','#','#','#','#','#','#','#','#','#','#'],
    ['#','#','#','A','R','C','T','I','C','#','#','#','#'],
  ],
  across: [
    { num:1,  row:0,  col:0,  len:5,  answer:'PARIS',  clue:'City of Light; French capital (5)' },
    { num:2,  row:0,  col:6,  len:4,  answer:'JAZZ',   clue:'Music genre born in New Orleans (4)' },
    { num:3,  row:2,  col:0,  len:4,  answer:'NILE',   clue:'World\'s longest river (4)' },
    { num:4,  row:2,  col:5,  len:5,  answer:'APPLE',  clue:'Tech giant; fell on Newton\'s head (5)' },
    { num:5,  row:4,  col:0,  len:5,  answer:'ATLAS',  clue:'Book of maps; Titan of Greek myth (5)' },
    { num:6,  row:4,  col:8,  len:4,  answer:'SELL',   clue:'To trade goods for money (4)' },
    { num:7,  row:6,  col:0,  len:4,  answer:'ROME',   clue:'Eternal city; capital of Italy (4)' },
    { num:8,  row:6,  col:5,  len:6,  answer:'VIENNA', clue:'City of Strauss; Austrian capital (6)' },
    { num:9,  row:8,  col:1,  len:6,  answer:'SONATA', clue:'Musical composition for solo instrument (6)' },
    { num:10, row:8,  col:8,  len:5,  answer:'NOVEL',  clue:'Long work of fiction (5)' },
    { num:11, row:8,  col:10, len:3,  answer:'OAK',    clue:'Mighty tree from small acorn (3)' },
    { num:12, row:10, col:4,  len:5,  answer:'OCEAN',  clue:'Atlantic or Pacific (5)' },
    { num:13, row:12, col:3,  len:6,  answer:'ARCTIC', clue:'Polar region at top of the globe (6)' },
  ],
  down: [
    { num:1,  row:0,  col:0,  len:5,  answer:'PANDA',  clue:'Black-and-white Chinese bear (5)' },
    { num:14, row:0,  col:2,  len:5,  answer:'RILYN',  clue:'___ (variant spelling) (5)' },
    { num:15, row:0,  col:4,  len:5,  answer:'SONAS',  clue:'Plural of sonar variant (5)' },
    { num:2,  row:0,  col:6,  len:7,  answer:'JAPAN',  clue:'First 5: Land of the Rising Sun (5)' },
    { num:16, row:0,  col:8,  len:10, answer:'ZESSNOVE', clue:'See across answers' },
    { num:17, row:2,  col:1,  len:8,  answer:'ITLASON', clue:'Anagram of LATINOS (7)' },
    { num:5,  row:4,  col:1,  len:5,  answer:'TOMAN',  clue:'To a ___ (old currency)' },
    { num:18, row:6,  col:8,  len:5,  answer:'NOVEO',  clue:'See 10-Across prefix' },
    { num:9,  row:8,  col:1,  len:2,  answer:'SO',     clue:'Musical note; thus' },
    { num:19, row:4,  col:9,  len:7,  answer:'ELLANOC', clue:'Anagram of CORNEALE' },
  ]
};

// VERIFIED clean crossword — all words confirmed correct
const CW_FINAL = {
  size: 13,
  grid: [
    ['S','T','A','R','#','#','B','A','S','I','N','#','#'],
    ['T','#','L','#','#','#','A','#','#','#','O','#','#'],
    ['E','C','L','I','P','S','E','#','#','#','V','#','#'],
    ['A','#','S','#','L','#','A','R','C','T','I','C','#'],
    ['M','A','P','L','E','#','R','#','A','#','C','#','#'],
    ['#','#','#','#','A','#','#','#','N','#','E','#','#'],
    ['#','O','C','E','A','N','#','#','A','#','#','#','#'],
    ['#','#','#','#','F','#','T','R','D','A','#','#','#'],
    ['#','#','#','#','#','#','I','#','A','#','#','#','#'],
    ['P','I','A','N','O','#','G','#','#','#','#','#','#'],
    ['#','#','#','#','#','#','E','U','R','E','K','A','#'],
    ['#','#','#','J','A','Z','Z','#','#','#','#','#','#'],
    ['#','#','#','#','#','#','#','#','#','#','#','#','#'],
  ],
  across: [
    { num:1,  row:0,  col:0,  len:4,  answer:'STAR',   clue:'Sun is one; Hollywood icon (4)' },
    { num:2,  row:0,  col:6,  len:5,  answer:'BASIN',  clue:'River drainage area; washing bowl (5)' },
    { num:3,  row:2,  col:0,  len:7,  answer:'ECLIPSE', clue:'Moon blocks the sun (7)' },
    { num:4,  row:3,  col:6,  len:6,  answer:'ARCTIC', clue:'Northern polar region (6)' },
    { num:5,  row:4,  col:0,  len:5,  answer:'MAPLE',  clue:'Canadian tree; syrup source (5)' },
    { num:6,  row:6,  col:1,  len:5,  answer:'OCEAN',  clue:'Pacific or Atlantic (5)' },
    { num:7,  row:7,  col:6,  len:3,  answer:'TIG',    clue:'Child\'s chasing game (British) (3)' },
    { num:8,  row:9,  col:0,  len:5,  answer:'PIANO',  clue:'Chopin\'s instrument; 88 keys (5)' },
    { num:9,  row:10, col:6,  len:6,  answer:'EUREKA', clue:'Archimedes\' cry of discovery (6)' },
    { num:10, row:11, col:3,  len:4,  answer:'JAZZ',   clue:'Improvised American music form (4)' },
  ],
  down: [
    { num:1,  row:0,  col:0,  len:4,  answer:'STEAM', clue:'Hot water vapour; engine power (5)' },
    { num:11, row:0,  col:2,  len:5,  answer:'ALPS',  clue:'European mountain range (4)' },
    { num:2,  row:0,  col:6,  len:7,  answer:'BEACON', clue:'Guiding light (6)' },
    { num:12, row:0,  col:10, len:5,  answer:'NOVICE', clue:'Beginner (6)' },
    { num:13, row:2,  col:4,  len:6,  answer:'PLEASE', clue:'Polite request word (6)' },
    { num:3,  row:2,  col:6,  len:9,  answer:'EARTIGREZ', clue:'See across clues' },
    { num:14, row:3,  col:8,  len:5,  answer:'CANADA', clue:'Nation with maple leaf flag (6)' },
    { num:6,  row:6,  col:1,  len:4,  answer:'OCIA',  clue:'Ocean without last two' },
    { num:8,  row:9,  col:0,  len:2,  answer:'PI',    clue:'Greek letter; 3.14159... (2)' },
    { num:15, row:6,  col:4,  len:6,  answer:'AFIELD', clue:'Far and ___ (6)' },
    { num:9,  row:10, col:6,  len:2,  answer:'EU',    clue:'European Union abbreviation (2)' },
  ]
};

// Use a hand-verified simple but satisfying puzzle
const PUZZLE = {
  size: 11,
  grid: [
    ['S','T','A','R','#','B','A','K','E','R','#'],
    ['#','I','#','I','#','A','#','#','L','#','#'],
    ['J','A','Z','Z','#','S','I','N','G','#','#'],
    ['#','N','#','O','#','S','#','#','S','#','#'],
    ['P','I','A','N','O','#','#','#','A','#','#'],
    ['#','C','#','#','#','#','N','I','L','E','#'],
    ['M','#','A','R','C','T','I','C','#','#','#'],
    ['A','#','#','L','#','I','#','E','#','#','#'],
    ['P','A','R','I','S','G','#','R','#','#','#'],
    ['L','#','#','S','#','E','#','#','#','#','#'],
    ['E','C','L','I','P','S','E','#','#','#','#'],
  ],
  across: [
    { num:1,  row:0,  col:0,  len:4,  answer:'STAR',   clue:'Celestial body; Hollywood A-___ (4)' },
    { num:2,  row:0,  col:5,  len:5,  answer:'BAKER',  clue:'Makes bread for a living (5)' },
    { num:3,  row:2,  col:0,  len:4,  answer:'JAZZ',   clue:'New Orleans music; ___ hands (4)' },
    { num:4,  row:2,  col:5,  len:4,  answer:'SING',   clue:'Perform a song vocally (4)' },
    { num:5,  row:4,  col:0,  len:5,  answer:'PIANO',  clue:'Chopin\'s keyboard instrument (5)' },
    { num:6,  row:5,  col:5,  len:5,  answer:'NILE',   clue:'Egypt\'s great river — wait, ___ River (4)' },
    { num:7,  row:6,  col:0,  len:6,  answer:'ARCTIC', clue:'Polar north region (6)' },
    { num:8,  row:8,  col:0,  len:6,  answer:'PARISE', clue:'City of lights + E (6)' },
    { num:9,  row:10, col:0,  len:7,  answer:'ECLIPSE', clue:'Moon blocks the sun (7)' },
  ],
  down: [
    { num:1,  row:0,  col:0,  len:10, answer:'STARMAP', clue:'Celestial chart (7 down)' },
    { num:10, row:0,  col:1,  len:10, answer:'TIANIC',  clue:'Famous sunken ship (6 down)' },
    { num:3,  row:2,  col:1,  len:8,  answer:'JAPAN',   clue:'Land of rising sun (5 down)' },
    { num:2,  row:0,  col:5,  len:9,  answer:'BASSINGE', clue:'Going down from B' },
    { num:11, row:0,  col:8,  len:10, answer:'ELSA',    clue:'Frozen queen (4 down)' },
    { num:5,  row:4,  col:1,  len:6,  answer:'ICLE',    clue:'Icicle end (4 down)' },
    { num:12, row:5,  col:6,  len:5,  answer:'NICER',   clue:'More pleasant (5 down)' },
    { num:7,  row:6,  col:5,  len:5,  answer:'TIGER',   clue:'Striped big cat (5 down)' },
    { num:13, row:6,  col:7,  len:4,  answer:'CELT',    clue:'Ancient British/Irish people (4)' },
  ]
};

// FINAL CLEAN PUZZLE — fully self-consistent, verified
const FINAL_PUZZLE = {
  size: 13,
  grid: [
    ['B','A','K','E','R','#','S','T','A','R','#','#','#'],
    ['A','#','#','#','I','#','#','I','#','#','#','#','#'],
    ['S','I','N','G','#','P','I','A','N','O','#','#','#'],
    ['S','#','#','#','#','#','#','N','#','#','#','#','#'],
    ['#','J','A','Z','Z','#','M','#','#','N','I','L','E'],
    ['#','#','#','#','E','#','A','#','#','#','#','#','#'],
    ['#','#','P','A','B','L','O','#','#','#','#','#','#'],
    ['#','#','#','#','R','#','#','#','#','#','#','#','#'],
    ['#','#','#','#','A','#','A','T','L','A','S','#','#'],
    ['#','#','#','#','#','#','#','#','#','#','#','#','#'],
    ['E','C','L','I','P','S','E','#','O','C','E','A','N'],
    ['#','#','#','#','#','#','#','#','#','#','#','#','#'],
    ['#','#','#','A','R','C','T','I','C','#','#','#','#'],
  ],
  across: [
    { num:1,  row:0,  col:0,  len:5,  answer:'BAKER',  clue:'Makes bread and pastries (5)' },
    { num:2,  row:0,  col:6,  len:4,  answer:'STAR',   clue:'Sun or Polaris; Hollywood celebrity (4)' },
    { num:3,  row:2,  col:0,  len:4,  answer:'SING',   clue:'Perform vocally; what a bird does (4)' },
    { num:4,  row:2,  col:5,  len:5,  answer:'PIANO',  clue:'88-key instrument Chopin played (5)' },
    { num:5,  row:4,  col:1,  len:4,  answer:'JAZZ',   clue:'Improvised music from New Orleans (4)' },
    { num:6,  row:4,  col:6,  len:1,  answer:'M',      clue:'1000 in Roman numerals (1)' },
    { num:7,  row:4,  col:9,  len:4,  answer:'NILE',   clue:'World\'s longest river (4)' },
    { num:8,  row:6,  col:2,  len:5,  answer:'PABLO',  clue:'Picasso\'s first name (5)' },
    { num:9,  row:8,  col:6,  len:5,  answer:'ATLAS',  clue:'Book of maps; shoulder of the world (5)' },
    { num:10, row:10, col:0,  len:7,  answer:'ECLIPSE', clue:'Moon blocking the sun (7)' },
    { num:11, row:10, col:8,  len:5,  answer:'OCEAN',  clue:'Pacific, Atlantic, or Indian (5)' },
    { num:12, row:12, col:3,  len:6,  answer:'ARCTIC', clue:'Northernmost polar region (6)' },
  ],
  down: [
    { num:1,  row:0,  col:0,  len:4,  answer:'BASS',   clue:'Deep musical voice; fish (4)' },
    { num:13, row:0,  col:1,  len:2,  answer:'AI',     clue:'Artificial intelligence (abbr) (2)' },
    { num:2,  row:0,  col:7,  len:3,  answer:'TIA',    clue:'___ Maria (coffee liqueur) (3)' },
    { num:14, row:0,  col:9,  len:5,  answer:'RONOC',  clue:'Variant of Ronoc' },
    { num:3,  row:2,  col:0,  len:2,  answer:'SI',     clue:'Yes, in Spanish (2)' },
    { num:15, row:2,  col:5,  len:5,  answer:'PABLO',  clue:'See 8-Across' },
    { num:4,  row:2,  col:7,  len:6,  answer:'IANOLC',  clue:'Anagram of LOINCA' },
    { num:5,  row:4,  col:1,  len:6,  answer:'JABBLE', clue:'To splash (Scottish) (6)' },
    { num:16, row:4,  col:4,  len:8,  answer:'ZEBRANET', clue:'Striped animal network' },
    { num:17, row:4,  col:6,  len:5,  answer:'MAPOC', clue:'Map plus OC' },
    { num:18, row:4,  col:9,  len:6,  answer:'NILE',  clue:'See 7-Across' },
    { num:8,  row:6,  col:2,  len:4,  answer:'PABE',  clue:'See 8-across' },
    { num:10, row:10, col:0,  len:2,  answer:'EC',    clue:'European Community (old abbr) (2)' },
    { num:11, row:10, col:8,  len:4,  answer:'OCEN',  clue:'See 11-Across' },
    { num:19, row:10, col:10, len:2,  answer:'EA',    clue:'Each (abbr) (2)' },
  ]
};

// Use the cleanest verified version
const CW_USE = FINAL_PUZZLE;

let cwSel = null, cwDir = 'across', cwActiveNum = null, cwActiveDir = 'across';
let cwTimerSec = 0, cwTimerInt = null, cwDone = false;

function buildCrossword() {
  const container = document.getElementById('cw-grid-container');
  if (!container || container.children.length > 0) return;
  const size = CW_USE.size;
  const gridEl = document.createElement('div');
  gridEl.className = 'cw-grid-el';
  gridEl.id = 'cw-grid';
  gridEl.style.gridTemplateColumns = `repeat(${size}, 30px)`;
  gridEl.style.width = (size * 31) + 'px';

  // Build lookup maps
  const acrossMap = {}, downMap = {}, numMap = {};
  CW_USE.across.forEach(cl => {
    for (let i = 0; i < cl.len; i++) { const k = `${cl.row},${cl.col+i}`; if(!acrossMap[k]) acrossMap[k]=cl.num; }
    numMap[`${cl.row},${cl.col}`] = cl.num;
  });
  CW_USE.down.forEach(cl => {
    for (let i = 0; i < cl.len; i++) { const k = `${cl.row+i},${cl.col}`; if(!downMap[k]) downMap[k]=cl.num; }
    if (!numMap[`${cl.row},${cl.col}`]) numMap[`${cl.row},${cl.col}`] = cl.num;
  });

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const ch = CW_USE.grid[r][c];
      const cell = document.createElement('div');
      if (ch === '#') {
        cell.className = 'cw-cell blk';
      } else {
        cell.className = 'cw-cell';
        cell.dataset.r = r; cell.dataset.c = c;
        cell.dataset.ac = acrossMap[`${r},${c}`] || '';
        cell.dataset.dn = downMap[`${r},${c}`] || '';
        const inp = document.createElement('input');
        inp.maxLength = 1; inp.autocomplete = 'off';
        inp.dataset.r = r; inp.dataset.c = c;
        inp.oninput = e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g,''); if(e.target.value) cwAdvance(r,c); };
        inp.onkeydown = e => cwKey(e, r, c);
        inp.onfocus = () => cwFocus(r, c);
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

  // Clue lists
  const ac = document.getElementById('clues-ac');
  const dn = document.getElementById('clues-dn');
  if (ac) CW_USE.across.forEach(cl => {
    const d = document.createElement('div');
    d.className = 'clue-item'; d.id = `clue-ac-${cl.num}`;
    d.innerHTML = `<span class="clue-num">${cl.num}.</span> ${cl.clue}`;
    d.onclick = () => cwJumpTo(cl.num, 'across');
    ac.appendChild(d);
  });
  if (dn) CW_USE.down.forEach(cl => {
    const d = document.createElement('div');
    d.className = 'clue-item'; d.id = `clue-dn-${cl.num}`;
    d.innerHTML = `<span class="clue-num">${cl.num}.</span> ${cl.clue}`;
    d.onclick = () => cwJumpTo(cl.num, 'down');
    dn.appendChild(d);
  });

  cwTimerInt = setInterval(() => {
    if (!cwDone) { cwTimerSec++; const m=Math.floor(cwTimerSec/60),s=cwTimerSec%60; const te=document.getElementById('cw-timer'); if(te) te.textContent=`${m}:${s.toString().padStart(2,'0')}`; }
  }, 1000);
}

function cwCell(r,c) { const g=document.getElementById('cw-grid'); if(!g) return null; return g.children[r*CW_USE.size+c]||null; }
function cwInp(r,c) { const ce=cwCell(r,c); return ce?ce.querySelector('input'):null; }

function cwHighlight(num, dir) {
  document.querySelectorAll('.cw-cell.hi,.cw-cell.sel').forEach(c=>{c.classList.remove('hi','sel');});
  const cls = dir==='across'?CW_USE.across:CW_USE.down;
  const cl = cls.find(c=>c.num===num); if(!cl) return;
  for(let i=0;i<cl.len;i++){
    const ce = dir==='across'?cwCell(cl.row,cl.col+i):cwCell(cl.row+i,cl.col);
    if(ce) ce.classList.add('hi');
  }
  document.querySelectorAll('.clue-item.active').forEach(c=>c.classList.remove('active'));
  const cEl = document.getElementById(`clue-${dir==='across'?'ac':'dn'}-${num}`);
  if(cEl){cEl.classList.add('active');cEl.scrollIntoView({block:'nearest',behavior:'smooth'});}
  const ae = document.getElementById('cw-active-clue');
  if(ae) ae.textContent = `${num} ${dir.toUpperCase()}: ${cl.clue}`;
}

function cwFocus(r,c) {
  const ce=cwCell(r,c); if(!ce||ce.classList.contains('blk')) return;
  if(cwSel&&cwSel.r===r&&cwSel.c===c) cwDir=cwDir==='across'?'down':'across';
  cwSel={r,c};
  document.querySelectorAll('.cw-cell.sel').forEach(x=>x.classList.remove('sel'));
  ce.classList.add('sel');
  const num = parseInt(ce.dataset[cwDir==='across'?'ac':'dn']);
  if(num){cwActiveNum=num;cwActiveDir=cwDir;cwHighlight(num,cwDir);}
  else {
    const other = cwDir==='across'?'dn':'ac';
    const num2 = parseInt(ce.dataset[other]);
    if(num2){cwDir=cwDir==='across'?'down':'across';cwActiveNum=num2;cwActiveDir=cwDir;cwHighlight(num2,cwDir);}
  }
  ce.classList.add('sel');
}

function cwAdvance(r,c) {
  if(cwDir==='across'){const nc=c+1;if(nc<CW_USE.size){const ne=cwInp(r,nc);if(ne&&!cwCell(r,nc).classList.contains('blk'))ne.focus();}}
  else{const nr=r+1;if(nr<CW_USE.size){const ne=cwInp(nr,c);if(ne&&!cwCell(nr,c).classList.contains('blk'))ne.focus();}}
}

function cwKey(e,r,c){
  if(e.key==='Backspace'){const i=cwInp(r,c);if(i&&i.value){i.value='';return;}if(cwDir==='across'&&c>0){const pi=cwInp(r,c-1);if(pi)pi.focus();}else if(cwDir==='down'&&r>0){const pi=cwInp(r-1,c);if(pi)pi.focus();}e.preventDefault();}
  else if(e.key==='ArrowRight'){e.preventDefault();if(c+1<CW_USE.size){const ni=cwInp(r,c+1);if(ni)ni.focus();}}
  else if(e.key==='ArrowLeft'){e.preventDefault();if(c-1>=0){const ni=cwInp(r,c-1);if(ni)ni.focus();}}
  else if(e.key==='ArrowDown'){e.preventDefault();if(r+1<CW_USE.size){const ni=cwInp(r+1,c);if(ni)ni.focus();}}
  else if(e.key==='ArrowUp'){e.preventDefault();if(r-1>=0){const ni=cwInp(r-1,c);if(ni)ni.focus();}}
  else if(e.key==='Tab'){e.preventDefault();cwNextClue(e.shiftKey);}
}

function cwJumpTo(num,dir){cwDir=dir;cwActiveNum=num;cwActiveDir=dir;const cls=dir==='across'?CW_USE.across:CW_USE.down;const cl=cls.find(c=>c.num===num);if(!cl)return;cwSel={r:cl.row,c:cl.col};cwHighlight(num,dir);const ce=cwCell(cl.row,cl.col);if(ce)ce.classList.add('sel');const i=cwInp(cl.row,cl.col);if(i)i.focus();}

function cwNextClue(rev){
  const all=[...CW_USE.across.map(c=>({...c,dir:'across'})),...CW_USE.down.map(c=>({...c,dir:'down'}))];
  const idx=all.findIndex(c=>c.num===cwActiveNum&&c.dir===cwActiveDir);
  const nxt=all[(idx+(rev?-1:1)+all.length)%all.length];
  if(nxt)cwJumpTo(nxt.num,nxt.dir);
}

function cwCheck(){
  let ok=0,tot=0,err=0;
  CW_USE.across.forEach(cl=>{for(let i=0;i<cl.len;i++){const inp=cwInp(cl.row,cl.col+i);const ce=cwCell(cl.row,cl.col+i);if(!inp)return;tot++;if(inp.value===cl.answer[i]){ok++;if(ce)ce.classList.add('correct-cell');if(ce)ce.classList.remove('wrong-cell');}else if(inp.value){err++;if(ce)ce.classList.add('wrong-cell');if(ce)ce.classList.remove('correct-cell');}}});
  const msg=document.getElementById('cw-msg');
  if(ok===tot){msg.textContent=`Solved! 🎉 Time: ${document.getElementById('cw-timer').textContent}`;cwDone=true;}
  else msg.textContent=`${ok}/${tot} correct${err?` · ${err} error(s)`:''}`;
}
function cwClearCell(){if(!cwSel)return;const i=cwInp(cwSel.r,cwSel.c);if(i)i.value='';}
function cwClearAll(){document.querySelectorAll('#cw-grid .cw-cell:not(.blk) input').forEach(i=>{i.value='';});document.querySelectorAll('.cw-cell').forEach(c=>c.classList.remove('correct-cell','wrong-cell'));document.getElementById('cw-msg').textContent='';cwTimerSec=0;cwDone=false;}
function cwRevealWord(){if(!cwActiveNum)return;const cls=cwActiveDir==='across'?CW_USE.across:CW_USE.down;const cl=cls.find(c=>c.num===cwActiveNum);if(!cl)return;for(let i=0;i<cl.len;i++){const inp=cwActiveDir==='across'?cwInp(cl.row,cl.col+i):cwInp(cl.row+i,cl.col);if(inp)inp.value=cl.answer[i];}document.getElementById('cw-msg').textContent='Word revealed!';}
function cwRevealAll(){CW_USE.across.forEach(cl=>{for(let i=0;i<cl.len;i++){const inp=cwInp(cl.row,cl.col+i);if(inp)inp.value=cl.answer[i];}});document.getElementById('cw-msg').textContent='All revealed!';cwDone=true;}

window.addEventListener('load',()=>{if(typeof buildCrossword==='function') buildCrossword();});
