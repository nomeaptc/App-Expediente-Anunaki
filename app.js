// EA Runner — completo (sin contenido protegido)
let state = {
  pj: { nombre:'', edad:'', pais:'', profesion:'' },
  atr: { FUE:0, DES:0, PER:0 },
  prog: { px:0, pv:0, pd:0, euros:0, combate:[false,false,false,false] },
  skills: [], // {name, note}
  equipo: [], // {name, qty}
  currentSection: '',
  notes: '',
  rollHistory: [],
  decisions: [],
  checks: [
    // presets típicos (edítalos a tu gusto)
    {name:'Persecución', die:'d10', dif:7, atr:'DES'},
    {name:'Forcejear puerta', die:'d10', dif:6, atr:'FUE'},
    {name:'Observar indicios', die:'d10', dif:6, atr:'PER'}
  ]
};

const el = id => document.getElementById(id);

function init(){
  loadLocal();
  bindUI();
  tryLoadStarter().then(()=>{ render(); });
  autoSave();
  registerSW();
}

// --- AUTO-CARGA DE STARTER (si no hay partida local) ---
async function tryLoadStarter(){
  try{
    const hasLocal = !!localStorage.getItem('ea_runner_full');
    if(hasLocal) return;
    // Cargar estado y checks desde /starter si existen
    const st = await fetch('starter/expediente.partida.anu2').then(r=>r.ok?r.json():null).catch(()=>null);
    const ck = await fetch('starter/ea_checks.json').then(r=>r.ok?r.json():null).catch(()=>null);
    if(st){
      state = Object.assign(state, st);
    }
    if(ck && Array.isArray(ck)){
      state.checks = ck;
    }
    saveLocal();
  }catch(e){}
}
// Llamar antes de render()

function bindUI(){
  // Personaje
  ['pj_nombre','pj_edad','pj_pais','pj_profesion'].forEach(id=>{
    el(id).addEventListener('input', e => {
      const key = id.split('_')[1];
      state.pj[key] = e.target.value; saveLocal();
    });
  });

  // Atributos
  ['atr_fue','atr_des','atr_per'].forEach(id=>{
    el(id).addEventListener('input', e => {
      const map = { 'atr_fue':'FUE','atr_des':'DES','atr_per':'PER' };
      state.atr[ map[id] ] = parseInt(e.target.value||'0',10); saveLocal();
    });
  });

  // Progresión
  el('prog_px').addEventListener('input', e => { state.prog.px = parseInt(e.target.value||'0',10); saveLocal(); });
  el('prog_pv').addEventListener('input', e => { state.prog.pv = parseInt(e.target.value||'0',10); saveLocal(); });
  el('prog_pd').addEventListener('input', e => { state.prog.pd = parseInt(e.target.value||'0',10); saveLocal(); });
  el('prog_euros').addEventListener('input', e => { state.prog.euros = parseInt(e.target.value||'0',10); saveLocal(); });
  document.querySelectorAll('.comb').forEach(chk=>{
    chk.addEventListener('change', e=>{
      const i = parseInt(e.target.dataset.i,10)-1;
      state.prog.combate[i] = e.target.checked; saveLocal();
    });
  });
  el('recalcular').addEventListener('click', ()=>{
    const px = state.prog.px||0;
    state.prog.pv = Math.floor(px/10);
    state.prog.pd = Math.floor(px/4);
    render(); saveLocal();
  });
  el('currentSection').addEventListener('input', e => { state.currentSection = e.target.value; saveLocal(); });

  // Skills
  el('addSkill').addEventListener('click', ()=>{
    const n = document.getElementById('newSkillName').value.trim();
    const note = document.getElementById('newSkillNote').value.trim();
    if(!n) return;
    state.skills.push({name:n, note}); document.getElementById('newSkillName').value=''; document.getElementById('newSkillNote').value='';
    render(); saveLocal();
  });

  // Equipo
  el('addItem').addEventListener('click', ()=>{
    const name = document.getElementById('newItemName').value.trim();
    const qty = parseInt(document.getElementById('newItemQty').value||'1',10);
    if(!name) return;
    state.equipo.push({name, qty}); document.getElementById('newItemName').value=''; document.getElementById('newItemQty').value='1';
    render(); saveLocal();
  });

  // Tiradas
  el('rollBtn').addEventListener('click', doRoll);
  el('notes').addEventListener('input', e => { state.notes = e.target.value; saveLocal(); });
  el('logDecision').addEventListener('click', logDecision);

  // Checks
  el('addCheck').addEventListener('click', addCheckFromInputs);
  el('exportChecks').addEventListener('click', exportChecks);
  el('importChecks').addEventListener('change', importChecks);

  // Tema + Ayuda
  el('darkToggle').addEventListener('click', ()=>document.body.classList.toggle('light'));
  el('helpBtn').addEventListener('click', ()=>el('helpModal').classList.remove('hidden'));
  el('closeHelp').addEventListener('click', ()=>el('helpModal').classList.add('hidden'));

  // PWA install
  let deferredPrompt=null;
  window.addEventListener('beforeinstallprompt',(e)=>{
    e.preventDefault();
    deferredPrompt = e;
    el('installBtn').style.display='inline-block';
    el('installBtn').onclick = async ()=>{
      if(!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt=null;
      el('installBtn').style.display='none';
    };
  });
}

function render(){
  // Personaje
  el('pj_nombre').value = state.pj.nombre||'';
  el('pj_edad').value = state.pj.edad||'';
  el('pj_pais').value = state.pj.pais||'';
  el('pj_profesion').value = state.pj.profesion||'';
  // Atributos
  el('atr_fue').value = state.atr.FUE??0;
  el('atr_des').value = state.atr.DES??0;
  el('atr_per').value = state.atr.PER??0;
  // Progresión
  el('prog_px').value = state.prog.px??0;
  el('prog_pv').value = state.prog.pv??0;
  el('prog_pd').value = state.prog.pd??0;
  el('prog_euros').value = state.prog.euros??0;
  document.querySelectorAll('.comb').forEach(chk=>{
    const i = parseInt(chk.dataset.i,10)-1; chk.checked = !!state.prog.combate[i];
  });
  el('currentSection').value = state.currentSection||'';
  // Skills
  const s = document.getElementById('skills'); s.innerHTML='';
  state.skills.forEach((sk, idx)=>{
    const row = document.createElement('div'); row.className='row';
    row.innerHTML = `<input value="${sk.name||''}" data-k="name" data-i="${idx}">
                     <input value="${sk.note||''}" data-k="note" data-i="${idx}">
                     <button class="remove" data-i="${idx}">✕</button>`;
    row.querySelectorAll('input').forEach(inp=>{
      inp.addEventListener('input', (e)=>{
        const i = +e.target.dataset.i; const k = e.target.dataset.k;
        state.skills[i][k] = e.target.value; saveLocal();
      });
    });
    row.querySelector('button').addEventListener('click', ()=>{ state.skills.splice(idx,1); render(); saveLocal(); });
    s.appendChild(row);
  });
  // Equipo
  const eq = document.getElementById('equipo'); eq.innerHTML='';
  state.equipo.forEach((it, idx)=>{
    const row = document.createElement('div'); row.className='row';
    row.innerHTML = `<input value="${it.name||''}" data-k="name" data-i="${idx}">
                     <input type="number" value="${it.qty??1}" data-k="qty" data-i="${idx}">
                     <button class="remove" data-i="${idx}">✕</button>`;
    row.querySelectorAll('input').forEach(inp=>{
      inp.addEventListener('input', (e)=>{
        const i = +e.target.dataset.i; const k = e.target.dataset.k;
        state.equipo[i][k] = e.target.type==='number' ? parseInt(e.target.value||'0',10) : e.target.value; saveLocal();
      });
    });
    row.querySelector('button').addEventListener('click', ()=>{ state.equipo.splice(idx,1); render(); saveLocal(); });
    eq.appendChild(row);
  });
  // Tiradas
  const rlog = document.getElementById('rollLog');
  rlog.innerHTML = state.rollHistory.slice().reverse().map(r=>`<div class="log-entry">[${new Date(r.t).toLocaleString()}] d${r.die}${r.mod>=0?'+':''}${r.mod}${r.attr?('+'+r.attr):''} ⇒ <b>${r.total}</b> (tirada: ${r.roll}${r.attrRoll!==undefined?(' + '+r.attrRoll):''})</div>`).join('');
  // Decisiones
  const dlog = document.getElementById('decisionLog');
  dlog.innerHTML = state.decisions.slice().reverse().map(d=>`<div class="log-entry">[${new Date(d.t).toLocaleString()}] <b>§${d.section||'?'}:</b> ${d.text}</div>`).join('');
  // Notas
  el('notes').value = state.notes||'';
  // Checks
  renderChecks();
}

function doRoll(){
  const die = parseInt(document.getElementById('die').value,10);
  const mod = parseInt(document.getElementById('modifier').value||'0',10);
  const attrSel = document.getElementById('attrSelect').value;
  const roll = Math.floor(Math.random()*die)+1;
  const attrRoll = attrSel==='0' ? 0 : (state.atr[attrSel]||0);
  const total = roll + mod + attrRoll;
  state.rollHistory.push({die, mod, roll, total, t: Date.now(), attr: attrSel==='0'?null:attrSel, attrRoll});
  render(); saveLocal();
}

function logDecision(){
  const text = document.getElementById('decisionText').value.trim();
  const sec = document.getElementById('decisionSection').value.trim();
  if(!text) return;
  state.decisions.push({text, section: sec||state.currentSection||null, t: Date.now()});
  document.getElementById('decisionText').value=''; document.getElementById('decisionSection').value='';
  render(); saveLocal();
}

// Checks
function renderChecks(){
  const c = document.getElementById('checks'); c.innerHTML='';
  if(!state.checks || !state.checks.length){ c.innerHTML='<div class="muted">No hay chequeos predefinidos.</div>'; return; }
  state.checks.forEach((ck, idx)=>{
    const btn = document.createElement('button');
    btn.textContent = `${ck.name} (${ck.die} ≥ ${ck.dif}${ck.atr?(' +' + ck.atr):''})`;
    btn.style.margin='4px'; btn.onclick = ()=> rollCheck(idx);
    c.appendChild(btn);
    const edit = document.createElement('button');
    edit.textContent = '✎'; edit.className='secondary'; edit.style.margin='4px'; edit.onclick=()=> editCheck(idx);
    const del = document.createElement('button');
    del.textContent = '✕'; del.className='secondary'; del.style.margin='4px'; del.onclick=()=>{ state.checks.splice(idx,1); renderChecks(); saveLocal(); };
    c.appendChild(edit); c.appendChild(del);
    c.appendChild(document.createElement('br'));
  });
}

function parseSpec(spec){
  // format: d10|7|DES  or d6|5
  const parts = spec.toUpperCase().split('|').map(s=>s.trim());
  if(!/^D(6|8|10|12|20|100)$/.test(parts[0])) return null;
  const die = parseInt(parts[0].slice(1),10);
  const dif = parseInt(parts[1]||'0',10);
  const atr = (parts[2] && ['FUE','DES','PER'].includes(parts[2])) ? parts[2] : null;
  return {die, dif, atr};
}

function addCheckFromInputs(){
  const name = document.getElementById('newCheckName').value.trim();
  const spec = document.getElementById('newCheckSpec').value.trim();
  if(!name || !spec) return alert('Rellena nombre y spec.');
  const parsed = parseSpec(spec); if(!parsed) return alert('Spec inválida. Usa p.ej. d10|7|DES');
  state.checks.push({name, die:'d'+parsed.die, dif:parsed.dif, atr:parsed.atr});
  document.getElementById('newCheckName').value=''; document.getElementById('newCheckSpec').value='';
  renderChecks(); saveLocal();
}

function editCheck(idx){
  const ck = state.checks[idx];
  const name = prompt('Nombre del chequeo:', ck.name);
  if(name===null) return;
  const spec = prompt('Spec (dX|dificultad|ATR opcional):', `${ck.die}|${ck.dif}|${ck.atr||''}`);
  if(spec===null) return;
  const parsed = parseSpec(spec);
  if(!parsed) return alert('Spec inválida.');
  state.checks[idx] = {name, die:'d'+parsed.die, dif:parsed.dif, atr:parsed.atr};
  renderChecks(); saveLocal();
}

function rollCheck(idx){
  const ck = state.checks[idx];
  const die = parseInt(ck.die.slice(1),10);
  const roll = Math.floor(Math.random()*die)+1;
  const atrRoll = ck.atr ? (state.atr[ck.atr]||0) : 0;
  const total = roll + atrRoll;
  const ok = total >= ck.dif;
  state.rollHistory.push({die, mod:0, roll, total, t: Date.now(), attr: ck.atr, attrRoll: atrRoll, check: ck.name, target: ck.dif, success: ok});
  // quick feedback
  alert(`${ck.name}: tirada ${ck.die}=${roll}${ck.atr?(' + '+ck.atr+'('+atrRoll+')'):''} ⇒ total ${total} — ${ok?'ÉXITO ✅':'FALLO ❌'} (objetivo ≥ ${ck.dif})`);
  render(); saveLocal();
}

function exportChecks(){
  const blob = new Blob([JSON.stringify(state.checks||[], null, 2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='ea_checks.json'; a.click();
}
function importChecks(ev){
  const f = ev.target.files[0]; if(!f) return;
  const r = new FileReader(); r.onload = ()=>{
    try{
      const arr = JSON.parse(r.result);
      if(!Array.isArray(arr)) throw new Error('Formato inválido');
      state.checks = arr; renderChecks(); saveLocal(); alert('Chequeos importados.');
    }catch(e){ alert('JSON inválido.'); }
  }; r.readAsText(f);
}

// Save/Load
function saveLocal(){ localStorage.setItem('ea_runner_full', JSON.stringify(state)); }
function loadLocal(){ try{ const raw = localStorage.getItem('ea_runner_full'); if(raw) state = JSON.parse(raw);}catch(e){} }
function exportSave(){
  const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='expediente.partida.anu2'; a.click();
}
function importSave(ev){
  const f = ev.target.files[0]; if(!f) return;
  const r = new FileReader(); r.onload = ()=>{ try{ state = Object.assign(state, JSON.parse(r.result)); render(); saveLocal(); alert('Partida importada.'); }catch(e){ alert('Archivo no válido.'); } }; r.readAsText(f);
}
function autoSave(){ setInterval(saveLocal, 30000); }

// PWA
async function registerSW(){
  if('serviceWorker' in navigator){ try{ await navigator.serviceWorker.register('sw.js'); }catch(e){} }
}

// Bind remaining
document.addEventListener('DOMContentLoaded', ()=>{
  init();
  document.getElementById('saveBtn').addEventListener('click', saveLocal);
  document.getElementById('exportBtn').addEventListener('click', exportSave);
  document.getElementById('importInput').addEventListener('change', importSave);
});
