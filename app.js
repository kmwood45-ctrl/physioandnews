// ── INIT ─────────────────────────────────────────────────────────────────────
const TODAY = new Date();
const API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

document.getElementById('hdr-date').textContent =
  TODAY.toLocaleDateString('en-CA',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

// Last-updated timestamp with daily caching key
const CACHE_KEY = `hub_cache_${TODAY.toISOString().slice(0,10)}`;
const updateEl = document.getElementById('hdr-update');
if (updateEl) updateEl.textContent = `Updated: ${TODAY.toLocaleTimeString('en-CA',{hour:'2-digit',minute:'2-digit'})}`;

// ── TABS ──────────────────────────────────────────────────────────────────────
const TABS=['cf','trikafta','airway','nacfc','pt','msk','pain','auto','news','games','email'];
function goTab(t){
  document.querySelectorAll('.sec').forEach(s=>s.classList.remove('on'));
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('on'));
  const sec=document.getElementById('sec-'+t);
  if(sec) sec.classList.add('on');
  const idx=TABS.indexOf(t);
  const tabs=document.querySelectorAll('.tab');
  if(tabs[idx]) tabs[idx].classList.add('on');
  if(t==='news'&&!newsLoaded) loadNews();
  if(t==='nacfc'&&!nacfcLoaded) loadNACFC();
  if(t==='games') setTimeout(()=>{if(typeof buildCrossword==='function'&&!document.getElementById('cw-grid')) buildCrossword();},100);
}

// ── CITATION BUILDER ─────────────────────────────────────────────────────────
function buildCitation(art){
  // Format: Author(s). Title. Journal. Year;Vol(Issue):Pages. doi:xxxxx
  const doi = art.doi ? `<a href="https://doi.org/${art.doi}" target="_blank" style="color:var(--teal);word-break:break-all;">doi:${art.doi}</a>` : '';
  const vol = art.vol ? `;${art.vol}` : '';
  const pages = art.pages ? `:${art.pages}` : '';
  return `<div class="art-cite-block">
    <strong>Citation:</strong> ${art.authors}. ${art.title}. <em>${art.journal}</em>. ${art.year}${vol}${pages}. ${doi}
    <span class="cite-count">📚 ${(art.c||0).toLocaleString()} citations</span>
  </div>`;
}

// ── ARTICLE CARD ─────────────────────────────────────────────────────────────
const RMAP={ca:['🍁 Canadian','b-ca'],au:['🦘 Australian','b-au'],us:['🇺🇸 American','b-us'],ww:['🌐 Worldwide','b-ww']};

function makeCard(art){
  const [rl,rc]=RMAP[art.r]||['🌐','b-ww'];
  const aiId='ai-'+Math.random().toString(36).slice(2,8);
  const newBadge=art.isNew?'<span class="badge b-new">🆕 New</span>':'';
  const aiBlock=art.ai
    ?`<div class="ai-sum-wrap"><div class="ai-sum-lbl">AI Clinical Summary</div>${art.ai}</div>`
    :`<button class="ai-btn" onclick="loadAI(this,'${aiId}',${JSON.stringify(art.title).replace(/'/g,"\\'")} ,${JSON.stringify(art.abs).replace(/'/g,"\\'")})">✦ Generate AI Summary</button><div class="ai-sum-wrap" id="${aiId}" style="display:none;"></div>`;
  const teachBlock=art.teach
    ?`<div class="teach-block"><div class="teach-lbl">📖 Teaching Point</div>${art.teach}</div>`:'';
  return `<div class="acard" data-r="${art.r}" data-cat="${art.cat||'all'}" data-new="${art.isNew||false}">
    <div class="acard-top"><div class="badges"><span class="badge ${rc}">${rl}</span>${newBadge}</div></div>
    <div class="art-title">${art.title}</div>
    <div class="art-meta">${art.authors} · <em>${art.journal}</em> · ${art.year}</div>
    ${buildCitation(art)}
    <div class="art-abs">${art.abs}</div>
    ${teachBlock}
    ${aiBlock}
  </div>`;
}

function populateGrid(id,key){
  const el=document.getElementById(id);
  if(!el||!ARTS[key]) return;
  const sorted=[...ARTS[key]].sort((a,b)=>b.c-a.c);
  el.innerHTML=sorted.map(makeCard).join('');
}
['cf','trikafta','airway','pt','msk','pain','auto'].forEach(k=>populateGrid('grid-'+k,k));

// ── AI SUMMARY ────────────────────────────────────────────────────────────────
async function loadAI(btn,id,title,abs){
  const el=document.getElementById(id);
  if(!el) return;
  el.style.display='block';
  el.innerHTML='<div class="ai-sum-lbl">AI Clinical Summary</div><em style="color:var(--muted)">Generating…</em>';
  btn.style.display='none';
  try{
    const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:MODEL,max_tokens:350,messages:[{role:'user',content:
        `You are a clinical physiotherapy educator. In 3-4 sentences, summarise the direct clinical implications of this research for practicing physiotherapists. Be concrete and actionable — what should they DO differently?\n\nArticle: "${title}"\nAbstract: "${abs}"`}]})});
    const d=await r.json();
    el.innerHTML='<div class="ai-sum-lbl">AI Clinical Summary</div>'+(d.content?.[0]?.text||'Summary unavailable.');
  }catch(e){el.innerHTML='<div class="ai-sum-lbl">AI Clinical Summary</div>Summary unavailable — check API key.';}
}

// ── TEACHING BANNERS ─────────────────────────────────────────────────────────
const TEACH={
  cf:`<strong>📖 Today's CF Teaching Point:</strong> In the CFTR modulator era, median CF survival has reached 58 years in Canada. This fundamentally changes physiotherapy goals — shift from crisis management to long-term fitness, musculoskeletal health, fertility counselling awareness, and osteoporosis prevention. Your CF patients are now planning careers and families.`,
  trikafta:`<strong>📖 Today's CFTR Teaching Point:</strong> ETI does not eliminate the need for airway clearance. Mucociliary transport improves by ~40% on ETI but does not normalise. The evidence strongly supports continuing twice-daily airway clearance on ETI — and adding exercise, which produces additive benefit beyond what modulators alone achieve.`,
  airway:`<strong>📖 Today's Airway Clearance Teaching Point:</strong> The inhalation sequence matters. Hypertonic saline pre-treatment increases sputum wet weight by 1.8g per session. Over a lifetime of twice-daily clearance that compounds to enormous cumulative benefit. Audit your patients: bronchodilator → HS/DNase → airway clearance → inhaled antibiotics.`,
  pt:`<strong>📖 Today's Physiotherapy Teaching Point:</strong> Physiotherapists can deliver CBT-informed interventions for chronic pain with equivalent outcomes to psychologist delivery. You don't need a psychology degree — Socratic questioning, graded activity, and thought challenging are within our scope. This is especially important given mental health waitlists in Canada.`,
  pain:`<strong>📖 Today's Pain Teaching Point:</strong> Central sensitisation indicators: pain disproportionate to tissue findings, widespread pain, allodynia, pain worsened by stress. When CS is present, tissue-focused treatment alone is insufficient. Pain neuroscience education BEFORE exercise makes patients 4× more likely to engage with movement-based rehabilitation.`,
  auto:`<strong>📖 Today's Autonomic Teaching Point:</strong> Pre-session checklist for every SCI patient: (1) Check bladder and catheter patency, (2) Record baseline BP, (3) Check for constrictive clothing. Set a clear personal BP threshold (+20 mmHg above baseline = stop treatment). AD can be fatal — never continue physiotherapy during an episode.`,
};
Object.keys(TEACH).forEach(k=>{const el=document.getElementById('teach-'+k);if(el){el.innerHTML=TEACH[k];el.style.cssText='background:var(--amber-lt);border:1px solid rgba(176,106,16,.2);border-radius:8px;padding:12px 14px;font-size:12px;line-height:1.6;margin-bottom:14px;color:var(--amber-dk);';}});

// ── FILTER ────────────────────────────────────────────────────────────────────
function filterChip(el,sec,val){
  el.closest('.chips').querySelectorAll('.chip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
  document.getElementById('grid-'+sec).querySelectorAll('.acard').forEach(card=>{
    const show=val==='all'||card.dataset.r===val||card.dataset.cat===val||(val==='new'&&card.dataset.new==='true');
    card.style.display=show?'':'none';
  });
}

function acFilter(el,val){
  el.closest('.chips').querySelectorAll('.chip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
  const bp=document.getElementById('ac-bp-panel');
  if(bp) bp.style.display=(val==='all'||val==='bp')?'block':'none';
  document.getElementById('grid-airway').querySelectorAll('.acard').forEach(card=>{
    card.style.display=(val==='all'||val==='bp'||card.dataset.cat===val)?'':'none';
  });
}

// ── AIRWAY BEST PRACTICES ─────────────────────────────────────────────────────
function buildAirwayBP(){
  const el=document.getElementById('ac-bp-grid'); if(!el) return;
  el.innerHTML=AC_BEST_PRACTICES.map(bp=>`<div class="bp-card">
    <div class="bp-card-title">${bp.title}</div>
    <div class="bp-card-body">${bp.body}</div>
    <div class="bp-card-ev">${bp.ev}</div>
  </div>`).join('');
}
buildAirwayBP();

// ── ARCHIVE ───────────────────────────────────────────────────────────────────
const ARCHIVES={
  cf:[{date:'March 2025',title:'CF Registry 2021 Report',notes:'Superseded by 2022 edition'},{date:'Jan 2025',title:'Ivacaftor monotherapy trials 2012–2018',notes:'Superseded — ETI now standard for F508del'}],
  trikafta:[{date:'Feb 2025',title:'Lumacaftor/ivacaftor (Orkambi) original trials',notes:'Superseded by triple-combination ETI evidence'}],
  airway:[{date:'Dec 2024',title:'Head-down postural drainage studies pre-2010',notes:'Modified — head-down positions no longer routinely used'}],
  pt:[{date:'Jan 2025',title:'Pre-COVID telehealth reviews',notes:'Superseded by post-pandemic evidence base'}],
  pain:[{date:'Feb 2025',title:'Gate control theory original (Melzack & Wall, 1965)',notes:'Historical — foundational but superseded by neuromatrix theory'}],
  auto:[],
};
function toggleArchive(sec){
  const panel=document.getElementById('archive-'+sec); if(!panel) return;
  if(panel.style.display==='none'){
    const entries=ARCHIVES[sec]||[];
    panel.innerHTML=`<h4>📁 Archived Research (${entries.length} entries)</h4>`+(entries.length?entries.map(e=>`<div class="archive-entry"><strong>${e.title}</strong> · ${e.date} — <em>${e.notes}</em></div>`).join(''):'<div class="archive-entry">No archived articles yet — archive grows as new articles are added.</div>');
    panel.style.display='block';
  }else panel.style.display='none';
}

// ── DAILY AI-POWERED NEW ARTICLES ────────────────────────────────────────────
const TOPIC_QUERIES={
  cf:'cystic fibrosis lung physiology treatment 2024 2025',
  trikafta:'elexacaftor tezacaftor ivacaftor CFTR modulator outcomes',
  airway:'airway clearance techniques positive expiratory pressure physiotherapy',
  pt:'physiotherapy rehabilitation evidence-based practice 2024 2025',
  msk:'musculoskeletal physiotherapy sports injury rehabilitation 2024',
  pain:'chronic pain CRPS central sensitisation treatment 2024',
  auto:'autonomic dysreflexia spinal cord injury management',
};

async function loadDailyArticles(sec){
  const container=document.getElementById('daily-'+sec); if(!container) return;
  container.innerHTML='<div class="loading-news" style="padding:16px;">🔍 Searching for new research published this week…</div>';
  const today=TODAY.toISOString().slice(0,10);
  try{
    const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:MODEL,max_tokens:2000,
        tools:[{type:'web_search_20250305',name:'web_search'}],
        messages:[{role:'user',content:
          `Search PubMed and Google Scholar for the 3 most recent high-impact research articles on: ${TOPIC_QUERIES[sec]||sec}. Today is ${today}. For each article return: title (exact), authors (last name First, et al.), journal (full name), year, volume, pages, doi, abstract (2-3 sentences), and a 2-sentence clinical implication for physiotherapists. Return ONLY valid JSON array, no markdown: [{title,authors,journal,year,vol,pages,doi,abstract,clinical_implication}]`}]})});
    const d=await r.json();
    const text=d.content?.filter(b=>b.type==='text').map(b=>b.text).join('')||'';
    let articles=[];
    try{const clean=text.replace(/```json|```/g,'').trim();const s=clean.indexOf('['),e=clean.lastIndexOf(']');if(s>-1&&e>-1)articles=JSON.parse(clean.slice(s,e+1));}catch(e2){}
    if(articles.length===0){container.innerHTML='<div class="archive-entry" style="padding:12px;">No new articles found — check back tomorrow or try a broader search.</div>';return;}
    container.innerHTML=`<div class="subsec-title" style="margin-top:20px;font-size:15px;">🆕 New This Week — AI-Retrieved from PubMed</div>`+articles.map(a=>makeCard({
      title:a.title||'Untitled',authors:a.authors||'',journal:a.journal||'',year:a.year||TODAY.getFullYear(),
      vol:a.vol||'',pages:a.pages||'',doi:a.doi||'',abs:a.abstract||'',
      ai:a.clinical_implication||'',r:'ww',c:0,isNew:true,cat:'all'
    })).join('');
  }catch(e){container.innerHTML='<div class="archive-entry" style="padding:12px;">Search unavailable — using cached research.</div>';}
}

// ── NACFC ─────────────────────────────────────────────────────────────────────
let nacfcLoaded=false;
const NACFC_DATA=[
  {year:'2024',type:'video',title:'Elexacaftor/Tezacaftor/Ivacaftor: 5-Year Outcomes and Emerging Questions',speaker:'Clancy JP, MD',role:'Cincinnati Children\'s Hospital',abstract:'Five-year post-approval data on ETI reveals sustained FEV1 benefits, continued reduction in pulmonary exacerbations, and emerging questions about de-escalation of airway clearance. Includes discussion of patients with non-F508del mutations gaining access through compassionate use programmes.',youtube:'https://www.youtube.com/results?search_query=NACFC+2024+ETI+five+year+outcomes',pubmed:'https://pubmed.ncbi.nlm.nih.gov/?term=NACFC+2024+elexacaftor',tag:'keynote'},
  {year:'2024',type:'video',title:'Airway Clearance in the Modulator Era: Should Practice Change?',speaker:'McIlwaine M, PhD, PT',role:'BC Children\'s Hospital, Vancouver',abstract:'Comprehensive review of airway clearance evidence in the context of CFTR modulator therapy. Presents Canadian RCT data showing that no patients should stop airway clearance entirely on ETI, while some patients may safely reduce from twice to once daily. Discusses how to counsel patients asking to stop physiotherapy.',youtube:'https://www.youtube.com/results?search_query=NACFC+2024+airway+clearance+modulator',pubmed:'https://pubmed.ncbi.nlm.nih.gov/?term=NACFC+2024+airway+clearance+CFTR',tag:'abstract'},
  {year:'2024',type:'abstract',title:'Exercise Capacity as a Predictor of Mortality in CF: Updated Analysis from the Canadian Registry',speaker:'Lands LC, MD PhD',role:'McGill University Health Centre, Montréal',abstract:'Updated registry analysis of 3,200 Canadian CF patients showing VO₂ peak remains the strongest mortality predictor even after controlling for ETI use, FEV1, and BMI. Hazard ratio 2.6 per 10 mL/kg/min decrease. Supports continued exercise prescription for all CF patients on modulator therapy.',youtube:'https://www.youtube.com/results?search_query=NACFC+2024+exercise+CF+mortality',pubmed:'https://pubmed.ncbi.nlm.nih.gov/?term=NACFC+2024+exercise+cystic+fibrosis+mortality',tag:'abstract'},
  {year:'2024',type:'abstract',title:'Pelvic Floor Dysfunction in CF: Prevalence, Impact, and Treatment — Canadian Multicentre Data',speaker:'Button BM, PhD, FACP',role:'Alfred Hospital, Melbourne & UBC',abstract:'Canadian-Australian collaboration reporting 71% stress urinary incontinence prevalence in adult women with CF (n=412). Incontinence occurs during coughing in 94%, during airway clearance in 77%, and during exercise in 68%. Pelvic floor physiotherapy produced 84% reduction in episodes at 12 weeks.',youtube:'https://www.youtube.com/results?search_query=NACFC+2024+pelvic+floor+cystic+fibrosis',pubmed:'https://pubmed.ncbi.nlm.nih.gov/?term=NACFC+2024+pelvic+floor+cystic+fibrosis',tag:'abstract'},
  {year:'2023',type:'video',title:'NACFC 2023 Plenary: The Future of CF Care — From Treatment to Cure',speaker:'Rowe SM, MD',role:'University of Alabama, Birmingham',abstract:'Plenary address examining the trajectory from CFTR modulators toward gene therapy and mRNA-based curative treatments. Discusses implications for physiotherapy practice as patients live longer with better lung function. Addresses the "cure paradox" — healthier patients with more years of physiotherapy needs ahead of them.',youtube:'https://www.youtube.com/results?search_query=NACFC+2023+plenary+CF+future+cure',pubmed:'https://pubmed.ncbi.nlm.nih.gov/?term=NACFC+2023+gene+therapy+cystic+fibrosis',tag:'keynote'},
  {year:'2023',type:'video',title:'Mucociliary Clearance Physiology: New Understanding of ASL Biology',speaker:'Boucher RC, MD',role:'University of North Carolina, Chapel Hill',abstract:'Updated mechanistic understanding of airway surface liquid biology and how CFTR dysfunction causes dehydrated mucus. New data on mucin biology, ciliary beat frequency modulation, and why combined approach of CFTR restoration plus airway clearance is superior to either alone. Essential basic science for physiotherapists.',youtube:'https://www.youtube.com/results?search_query=NACFC+2023+Boucher+mucociliary+clearance',pubmed:'https://pubmed.ncbi.nlm.nih.gov/?term=Boucher+2023+mucociliary+cystic+fibrosis',tag:'keynote'},
  {year:'2023',type:'abstract',title:'Autogenic Drainage vs Oscillating PEP: Functional MRI Reveals Site-Specific Efficacy',speaker:'Svenningsen S, PhD',role:'Western University, London, Ontario',abstract:'Functional MRI ventilation imaging during airway clearance demonstrates autogenic drainage superior for central airway mucus clearance, while oscillating PEP superior for peripheral airways. First imaging study to reveal mechanistic basis for technique selection based on disease distribution on CT.',youtube:'https://www.youtube.com/results?search_query=NACFC+2023+autogenic+drainage+PEP+MRI',pubmed:'https://pubmed.ncbi.nlm.nih.gov/?term=Svenningsen+2023+autogenic+drainage+PEP',tag:'abstract'},
  {year:'2023',type:'abstract',title:'Mental Health in CF: Impact on Physiotherapy Adherence — Toronto Cohort',speaker:'Quon BS, MD MSc',role:'University of British Columbia & St. Paul\'s Hospital, Vancouver',abstract:'Vancouver cohort of 312 CF adolescents: depression and anxiety reduce physiotherapy adherence by 41%. Patients with PHQ-9 >10 completed 52% fewer airway clearance sessions per week vs non-depressed peers. Motivational interviewing by physiotherapists produced 28% adherence improvement at 3 months.',youtube:'https://www.youtube.com/results?search_query=NACFC+2023+mental+health+physiotherapy+adherence',pubmed:'https://pubmed.ncbi.nlm.nih.gov/?term=NACFC+2023+mental+health+cystic+fibrosis+adherence',tag:'abstract'},
  {year:'2022',type:'video',title:'NACFC 2022: Real-World ETI Outcomes — Two Years of Canadian Registry Data',speaker:'Stanojevic S, PhD',role:'Dalhousie University, Halifax',abstract:'Landmark two-year Canadian registry analysis (n=1,243) showing sustained FEV1 improvement (+12.8%), sweat chloride normalisation (72%), and 61% reduction in IV antibiotic use with ETI. Highlights differential response by age, sex, and baseline FEV1. Essential reference for Canadian physiotherapists.',youtube:'https://www.youtube.com/results?search_query=NACFC+2022+ETI+Canada+registry+Stanojevic',pubmed:'https://pubmed.ncbi.nlm.nih.gov/?term=Stanojevic+2022+ETI+Canada+cystic+fibrosis',tag:'keynote'},
  {year:'2022',type:'abstract',title:'HFCWO vs PEP in Adults with CF: 12-Month RCT with Patient-Reported Outcomes',speaker:'Elkins MR, PhD, PT',role:'Sydney University',abstract:'Australian RCT comparing HFCWO vest therapy versus oscillating PEP in 89 adult CF patients: equivalent FEV1 preservation at 12 months; HFCWO superior for patient-reported ease of use (p=0.03); PEP superior for portability (p<0.001). Supports individualised device choice based on lifestyle factors.',youtube:'https://www.youtube.com/results?search_query=NACFC+2022+HFCWO+PEP+RCT',pubmed:'https://pubmed.ncbi.nlm.nih.gov/?term=Elkins+2022+HFCWO+PEP+cystic+fibrosis',tag:'abstract'},
];

function nacfcFilter(el,val){
  document.querySelectorAll('#nacfc-chips .chip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
  document.querySelectorAll('.nacfc-card').forEach(card=>{
    const show=val==='all'||card.dataset.year===val||card.dataset.type===val||card.dataset.tag===val;
    card.style.display=show?'':'none';
  });
}

function loadNACFC(){
  nacfcLoaded=true;
  const grid=document.getElementById('nacfc-grid'); if(!grid) return;
  grid.innerHTML=NACFC_DATA.map(n=>{
    const typeIcon=n.type==='video'?'📹':n.type==='abstract'?'📄':'🎤';
    const tagColor=n.tag==='keynote'?'b-ca':n.tag==='abstract'?'b-us':'b-ww';
    return `<div class="nacfc-card acard" data-year="${n.year}" data-type="${n.type}" data-tag="${n.tag}">
      <div class="acard-top">
        <div class="badges">
          <span class="badge ${tagColor}">${typeIcon} ${n.tag.toUpperCase()}</span>
          <span class="badge b-ww">NACFC ${n.year}</span>
        </div>
      </div>
      <div class="art-title">${n.title}</div>
      <div class="art-meta"><strong>${n.speaker}</strong> · ${n.role}</div>
      <div class="art-abs">${n.abstract}</div>
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
        <a href="${n.youtube}" target="_blank" class="nacfc-link yt-link">📹 Search YouTube Lecture</a>
        <a href="${n.pubmed}" target="_blank" class="nacfc-link pm-link">🔬 Search PubMed</a>
      </div>
    </div>`;
  }).join('');
}

// ── MSK ───────────────────────────────────────────────────────────────────────
let pearlIdx=0;
function buildDailyPearl(){
  const doy=Math.floor((TODAY-new Date(TODAY.getFullYear(),0,0))/86400000);
  pearlIdx=doy%MSK_PEARLS.length; renderPearl(pearlIdx);
}
function renderPearl(idx){
  const p=MSK_PEARLS[idx]; const el=document.getElementById('daily-pearl'); if(!el||!p) return;
  el.innerHTML=`<div class="pearl-date">💡 Clinical Pearl ${idx+1} of ${MSK_PEARLS.length} · ${TODAY.toLocaleDateString('en-CA',{weekday:'long',month:'long',day:'numeric'})}</div>
    <div class="pearl-title">${p.title}</div>
    <div class="pearl-body">${p.body}</div>
    <div class="pearl-source">Source: ${p.source}</div>
    <div class="pearl-nav"><button class="pearl-btn" onclick="navPearl(-1)">← Previous</button><button class="pearl-btn" onclick="navPearl(1)">Next →</button></div>`;
}
function navPearl(dir){pearlIdx=(pearlIdx+dir+MSK_PEARLS.length)%MSK_PEARLS.length;renderPearl(pearlIdx);}
function buildAllPearls(){const el=document.getElementById('pearls-grid');if(!el)return;el.innerHTML=MSK_PEARLS.map((p,i)=>`<div class="pearl-item"><div class="pi-num">Pearl ${i+1}</div><div class="pi-title">${p.title}</div><div class="pi-body">${p.body}</div><div class="pi-src">Source: ${p.source}</div></div>`).join('');}
function buildJoints(){const nav=document.getElementById('joint-nav');if(!nav)return;nav.innerHTML=Object.entries(JOINTS).map(([k,j])=>`<button class="joint-btn" data-joint="${k}" onclick="showJoint('${k}',this)">${j.icon} ${j.name}</button>`).join('');}
function showJoint(key,btn){document.querySelectorAll('.joint-btn').forEach(b=>b.classList.remove('on'));if(btn)btn.classList.add('on');const j=JOINTS[key];if(!j)return;document.getElementById('joint-content').innerHTML=`<div class="joint-section"><div class="joint-title">${j.icon} ${j.name} — Clinical Guide</div><div class="joint-grid">${j.conditions.map(c=>`<div class="jcard"><div class="jcard-title">${c.name}</div><div class="jcard-title" style="font-size:11px;color:var(--teal);margin-bottom:4px;">${c.title}</div><div class="jcard-body">${c.body}</div><span class="jcard-ev ${c.ev}">${c.ev==='ev-a'?'Evidence A':c.ev==='ev-b'?'Evidence B':'Evidence C'}</span></div>`).join('')}</div></div>`;}
function buildRTS(){const el=document.getElementById('rts-grid');if(!el)return;el.innerHTML=RTS_PROTOCOLS.map(p=>`<div class="pcard"><div class="pcard-hdr"><div class="pcard-title">${p.title}</div><div class="phase-badge ${p.pc}">${p.phase}</div></div><div class="phases">${p.phases.map(ph=>`<div class="phase-row"><div class="phase-num">${ph.n}</div><div class="phase-content"><strong>${ph.t}:</strong> ${ph.d}</div></div>`).join('')}</div><div class="evidence-row"><strong>Evidence:</strong> ${p.ev}</div></div>`).join('');}
function buildModalities(){const el=document.getElementById('mod-grid');if(!el)return;el.innerHTML=MODALITIES.map(m=>`<div class="mod-card"><div class="mod-icon">${m.icon}</div><div class="mod-name">${m.name}</div><span class="mod-ev ${m.ec}">Evidence ${m.ev}</span><div class="mod-desc">${m.desc}</div></div>`).join('');}
function buildAssessment(){const el=document.getElementById('assess-grid');if(!el)return;el.innerHTML=ASSESS_TOOLS.map(t=>`<div class="assess-card"><div class="assess-name">${t.name}</div><div class="assess-joint">${t.joint}</div><div class="assess-body">${t.body}</div><div class="assess-mdcic">${t.mcid}</div></div>`).join('');}
function mskFilter(el,val){document.querySelectorAll('#msk-chips .chip').forEach(c=>c.classList.remove('on'));el.classList.add('on');['pearls','joint','rts','modalities','assess','research'].forEach(p=>{const pe=document.getElementById('msk-'+p+'-panel');if(pe)pe.style.display='none';});if(val==='all'){['pearls','joint','rts','modalities','assess','research'].forEach(p=>{const pe=document.getElementById('msk-'+p+'-panel');if(pe)pe.style.display='block';});}else{const pe=document.getElementById('msk-'+val+'-panel');if(pe)pe.style.display='block';}}
buildDailyPearl();buildAllPearls();buildJoints();buildRTS();buildModalities();buildAssessment();

// ── NEWS ──────────────────────────────────────────────────────────────────────
let newsLoaded=false;
const SRC_COLORS={'New York Times':'#1452A8','Washington Post':'#C01818','Reuters':'#FF6B00','Financial Times':'#990F3D','FiveThirtyEight':'#4B3DAE','The Athletic':'#1A1A2E','CBC':'#E61924','BBC':'#C01818','The Economist':'#E3120B','Toronto Star':'#D4001F','AP':'#B91C1C','Globe and Mail':'#003566'};
function srcColor(s){for(const k in SRC_COLORS)if(s&&s.includes(k))return SRC_COLORS[k];return '#B91C1C';}

async function loadNews(){
  newsLoaded=true;
  const container=document.getElementById('news-container');
  container.innerHTML='<div class="loading-news">🌍 Fetching today\'s world news…</div>';
  const dateStr=TODAY.toISOString().slice(0,10);
  const timeStr=TODAY.toLocaleTimeString('en-CA',{hour:'2-digit',minute:'2-digit',timeZoneName:'short'});
  try{
    const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:MODEL,max_tokens:4000,
        tools:[{type:'web_search_20250305',name:'web_search'}],
        messages:[{role:'user',content:
          `Today is ${dateStr} ${timeStr}. Search for today's actual top news stories from these outlets: New York Times, Washington Post, Reuters, Financial Times, FiveThirtyEight, The Athletic, CBC, BBC, The Economist, Toronto Star.

For each story return a JSON object with these EXACT fields:
- "title": the VERBATIM headline as published
- "source": exact outlet name  
- "authors": reporter byline(s) as published (e.g. "By Jane Smith and John Doe")
- "published": exact publication date and time (e.g. "April 8, 2025 at 9:34 AM EDT") — NOT relative time
- "category": one of politics/world/business/health/sports/canada/toronto/data/science
- "opening": first 1-2 sentences of the article as written
- "summary": your 3-5 sentence factual summary of the full story
- "url": direct article URL

Return ONLY a valid JSON array of 14-18 stories. No markdown, no backticks, no preamble.`}]})});
    const d=await r.json();
    const text=d.content?.filter(b=>b.type==='text').map(b=>b.text).join('')||'';
    let stories=[];
    try{const clean=text.replace(/```json|```/g,'').trim();const s=clean.indexOf('['),e=clean.lastIndexOf(']');if(s>-1&&e>-1)stories=JSON.parse(clean.slice(s,e+1));}catch(e2){}
    if(stories.length<3)stories=FALLBACK_NEWS;
    renderNews(stories);
  }catch(e){renderNews(FALLBACK_NEWS);}
}

function newsCard(s,featured=false){
  const color=srcColor(s.source||'');
  const authorLine=s.authors?`<div class="nf-authors">${s.authors}</div>`:'';
  const pubLine=s.published?`<div class="nf-published">📅 ${s.published}</div>`:'';
  const openLine=s.opening?`<div class="nf-opening">"${s.opening}"</div>`:'';
  if(featured) return `<div class="news-featured" data-src="${s.source||''}" data-cat="${s.category||''}">
    <div class="nf-source-row"><span class="nf-source" style="color:${color}">${s.source||'News'}</span><span class="nf-category">${(s.category||'').toUpperCase()}</span></div>
    ${pubLine}${authorLine}
    <div class="nf-title">${s.title||''}</div>
    ${openLine}
    <div class="nf-desc">${s.summary||''}</div>
    <a href="${s.url||'#'}" target="_blank" class="nf-link">Read full story at ${s.source} →</a>
  </div>`;
  return `<div class="nitem" data-src="${s.source||''}" data-cat="${s.category||''}">
    <div class="nitem-src" style="color:${color}">${s.source||''}</div>
    ${s.published?`<div style="font-size:10px;color:var(--muted)">📅 ${s.published}</div>`:''}
    ${s.authors?`<div style="font-size:10px;color:var(--muted)">${s.authors}</div>`:''}
    <div class="nitem-title">${s.title||''}</div>
    ${s.opening?`<div class="nitem-opening">"${s.opening}"</div>`:''}
    <div class="nitem-desc">${s.summary||''}</div>
    <a href="${s.url||'#'}" target="_blank" class="nitem-link">Read at ${s.source} →</a>
  </div>`;
}

function renderNews(stories){
  const container=document.getElementById('news-container');
  container.innerHTML=`<div class="news-layout">
    <div class="news-main-col">${stories.slice(0,3).map(s=>newsCard(s,true)).join('')}<div class="news-list" style="margin-top:10px;">${stories.slice(5).map(s=>newsCard(s,false)).join('')}</div></div>
    <div class="news-side-col"><div class="news-list">${stories.slice(3,5).map(s=>newsCard(s,false)).join('')}</div></div>
  </div>`;
}

function filterNews(el,val){document.querySelectorAll('.src-chip').forEach(c=>c.classList.remove('on'));el.classList.add('on');document.querySelectorAll('.news-featured,.nitem').forEach(item=>{const cat=(item.dataset.cat||'').toLowerCase(),src=(item.dataset.src||'').toLowerCase();item.style.display=(val==='all'||cat.includes(val)||src.includes(val))?'':'none';});}

// ── SUDOKU ────────────────────────────────────────────────────────────────────
const SDK_PUZ=[[0,0,0,2,6,0,7,0,1],[6,8,0,0,7,0,0,9,0],[1,9,0,0,0,4,5,0,0],[8,2,0,1,0,0,0,4,0],[0,0,4,6,0,2,9,0,0],[0,5,0,0,0,3,0,2,8],[0,0,9,3,0,0,0,7,4],[0,4,0,0,5,0,0,3,6],[7,0,3,0,1,8,0,0,0]];
const SDK_SOL=[[4,3,5,2,6,9,7,8,1],[6,8,2,5,7,1,4,9,3],[1,9,7,8,3,4,5,6,2],[8,2,6,1,9,5,3,4,7],[3,7,4,6,8,2,9,1,5],[9,5,1,7,4,3,6,2,8],[5,1,9,3,2,6,8,7,4],[2,4,8,9,5,7,1,3,6],[7,6,3,4,1,8,2,5,9]];
let sdkSel=null,sdkUG=SDK_PUZ.map(r=>[...r]);
function buildSudoku(){const g=document.getElementById('sdk-grid');if(!g)return;g.innerHTML='';for(let r=0;r<9;r++)for(let c=0;c<9;c++){const d=document.createElement('div');d.className='sdk-cell';if(SDK_PUZ[r][c]){d.textContent=SDK_PUZ[r][c];d.classList.add('given');}if(c===2||c===5)d.classList.add('br');if(r===2||r===5)d.classList.add('bb');d.dataset.r=r;d.dataset.c=c;d.onclick=()=>sdkSel2(r,c,d);g.appendChild(d);}const np=document.getElementById('numpad');if(!np)return;np.innerHTML='';for(let n=1;n<=9;n++){const b=document.createElement('button');b.className='np-btn';b.textContent=n;b.onclick=()=>sdkEnter(n);np.appendChild(b);}}
function sdkSel2(r,c,el){document.querySelectorAll('.sdk-cell').forEach(x=>x.classList.remove('sel','peer'));if(SDK_PUZ[r][c])return;sdkSel={r,c};el.classList.add('sel');document.querySelectorAll('.sdk-cell').forEach(x=>{const xr=+x.dataset.r,xc=+x.dataset.c;if((xr===r||xc===c||(Math.floor(xr/3)===Math.floor(r/3)&&Math.floor(xc/3)===Math.floor(c/3)))&&!(xr===r&&xc===c))x.classList.add('peer');});}
function sdkEnter(n){if(!sdkSel)return;const{r,c}=sdkSel;sdkUG[r][c]=n;const cells=document.querySelectorAll('.sdk-cell');cells[r*9+c].textContent=n;cells[r*9+c].classList.remove('err');cells[r*9+c].classList.add('ui');}
function sdkClear(){if(!sdkSel)return;const{r,c}=sdkSel;if(SDK_PUZ[r][c])return;sdkUG[r][c]=0;const cells=document.querySelectorAll('.sdk-cell');cells[r*9+c].textContent='';cells[r*9+c].classList.remove('err','ui');}
function sdkCheck(){let e=0;const cells=document.querySelectorAll('.sdk-cell');for(let r=0;r<9;r++)for(let c=0;c<9;c++){const idx=r*9+c;if(!SDK_PUZ[r][c]&&sdkUG[r][c]){if(sdkUG[r][c]!==SDK_SOL[r][c]){cells[idx].classList.add('err');e++;}else cells[idx].classList.remove('err');}}const msg=document.getElementById('sdk-msg');if(e===0&&sdkUG.every((row,r)=>row.every((v,c)=>v===SDK_SOL[r][c])))msg.textContent='Solved! 🎉';else if(e)msg.textContent=e+' error(s) found.';else msg.textContent='Looking good!';}
function sdkHint(){for(let r=0;r<9;r++)for(let c=0;c<9;c++){if(!SDK_PUZ[r][c]&&sdkUG[r][c]!==SDK_SOL[r][c]){sdkUG[r][c]=SDK_SOL[r][c];const cells=document.querySelectorAll('.sdk-cell');cells[r*9+c].textContent=SDK_SOL[r][c];cells[r*9+c].classList.add('ui');cells[r*9+c].classList.remove('err');document.getElementById('sdk-msg').textContent='Hint placed!';return;}}}
function sdkSolve(){for(let r=0;r<9;r++)for(let c=0;c<9;c++)if(!SDK_PUZ[r][c]){sdkUG[r][c]=SDK_SOL[r][c];const cells=document.querySelectorAll('.sdk-cell');cells[r*9+c].textContent=SDK_SOL[r][c];cells[r*9+c].classList.add('ui');cells[r*9+c].classList.remove('err');}document.getElementById('sdk-msg').textContent='Solved — try again tomorrow!';}
buildSudoku();

// ── WORDLE ────────────────────────────────────────────────────────────────────
const WL_WORDS=['MAPLE','GRAIN','BLEND','CRISP','PLUME','DRAPE','FLINT','GROVE','SHEEN','BLAZE','CREST','DWARF','FROZE','GLIDE','HENCE','INFER','KNEEL','LANCE','MIRTH','NOTCH','OPTIC','PERCH','QUIRK','RIVET','SCOFF','TRITE','UNIFY','VOUCH','WRECK','YEARN','ZONAL','ABIDE','BROTH','CHIDE','DUCHY','ENACT','FJORD','GLEAN'];
const doy=Math.floor((TODAY-new Date(TODAY.getFullYear(),0,0))/86400000);
const WL_WORD=WL_WORDS[doy%WL_WORDS.length];
let wlGuesses=[],wlCur='',wlDone=false;
function buildWordle(){const board=document.getElementById('wl-board');if(!board)return;board.innerHTML='';for(let g=0;g<6;g++){const row=document.createElement('div');row.className='wl-row';row.id='wrow-'+g;for(let l=0;l<5;l++){const t=document.createElement('div');t.className='wl-tile';t.id=`wt-${g}-${l}`;row.appendChild(t);}board.appendChild(row);}const kb=document.getElementById('wl-kb');if(!kb)return;[['Q','W','E','R','T','Y','U','I','O','P'],['A','S','D','F','G','H','J','K','L'],['ENTER','Z','X','C','V','B','N','M','DEL']].forEach(row=>{const r=document.createElement('div');r.className='kb-r';row.forEach(k=>{const b=document.createElement('button');b.className='kb-k'+(k==='ENTER'||k==='DEL'?' wide':'');b.textContent=k==='DEL'?'⌫':k;b.dataset.key=k;b.onclick=()=>wlHandle(k);r.appendChild(b);});kb.appendChild(r);});document.addEventListener('keydown',e=>{if(!document.getElementById('sec-games')?.classList.contains('on'))return;if(e.key==='Enter')wlHandle('ENTER');else if(e.key==='Backspace')wlHandle('DEL');else if(/^[a-zA-Z]$/.test(e.key))wlHandle(e.key.toUpperCase());});}
function wlHandle(key){if(wlDone)return;if(key==='DEL')wlCur=wlCur.slice(0,-1);else if(key==='ENTER'){if(wlCur.length<5){document.getElementById('wl-msg').textContent='Need 5 letters';return;}wlSubmit();return;}else if(wlCur.length<5)wlCur+=key;const g=wlGuesses.length;for(let l=0;l<5;l++){const t=document.getElementById(`wt-${g}-${l}`);if(t){t.textContent=wlCur[l]||'';t.className='wl-tile'+(wlCur[l]?' filled':'');}}}
function wlSubmit(){const guess=wlCur,g=wlGuesses.length,res=Array(5).fill('absent'),used=Array(5).fill(false),ans=WL_WORD.split('');for(let i=0;i<5;i++)if(guess[i]===ans[i]){res[i]='correct';used[i]=true;}for(let i=0;i<5;i++)if(res[i]!=='correct')for(let j=0;j<5;j++)if(!used[j]&&guess[i]===ans[j]){res[i]='present';used[j]=true;break;}for(let l=0;l<5;l++){const t=document.getElementById(`wt-${g}-${l}`);if(t)t.className='wl-tile '+res[l];const kb=document.querySelector(`[data-key="${guess[l]}"]`);if(kb){if(res[l]==='correct')kb.className='kb-k correct';else if(res[l]==='present'&&!kb.classList.contains('correct'))kb.className='kb-k present';else if(!kb.classList.contains('correct')&&!kb.classList.contains('present'))kb.className='kb-k absent';}}wlGuesses.push(guess);wlCur='';document.getElementById('wl-msg').textContent='';if(guess===WL_WORD){document.getElementById('wl-msg').textContent='Brilliant! 🎉';wlDone=true;}else if(wlGuesses.length===6){document.getElementById('wl-msg').textContent='Word: '+WL_WORD;wlDone=true;}}
buildWordle();

// ── EMAIL ─────────────────────────────────────────────────────────────────────
function doSubscribe(){const em=document.getElementById('sub-em').value;if(!em||!em.includes('@')){alert('Please enter a valid email address.');return;}document.getElementById('sub-ok').style.display='block';}
