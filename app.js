const APP_VERSION = '4.0.0-production-cloud';
const STORE_KEY = 'teataper.app.v4';
const OLD_KEYS = ['stopkratom.v3','stopkratom.ultra.v2','stopkratom.production.v1','kratomLog.entries.v1'];
const DAY_MS = 86400000;
const $ = (q, root=document) => root.querySelector(q);
const $$ = (q, root=document) => Array.from(root.querySelectorAll(q));

const I18N = {
  ru:{tagline:'Личный трекер снижения кратомного чая',ageTitle:'18+ и не медицинское приложение',ageText:'Приложение помогает вести дневник объёма и самочувствия. Оно не диагностирует, не лечит и не заменяет врача.',ageConfirm:'Мне 18+ и я понимаю, что это личный трекер, а не медицинская помощь.',continue:'Продолжить',readDisclaimer:'Открыть дисклеймер',back:'Назад',next:'Далее',pinEnter:'Введите PIN',unlock:'Открыть',resetPin:'Сбросить PIN и локальные данные',tabToday:'Сегодня',tabProgress:'Прогресс',tabWellbeing:'Состояние',tabPlan:'План',tabProfile:'Профиль',updateAvailable:'Доступна новая версия',updateNow:'Обновить'},
  en:{tagline:'Private kratom tea taper tracker',ageTitle:'18+ and not a medical app',ageText:'This app helps you journal intake and wellbeing. It does not diagnose, treat, or replace medical care.',ageConfirm:'I am 18+ and understand this is a personal tracker, not medical care.',continue:'Continue',readDisclaimer:'Read disclaimer',back:'Back',next:'Next',pinEnter:'Enter PIN',unlock:'Unlock',resetPin:'Reset PIN and local data',tabToday:'Today',tabProgress:'Progress',tabWellbeing:'Wellbeing',tabPlan:'Plan',tabProfile:'Profile',updateAvailable:'New version available',updateNow:'Update'},
  th:{tagline:'ตัวติดตามการลดน้ำกระท่อมส่วนตัว',ageTitle:'18+ และไม่ใช่แอปทางการแพทย์',ageText:'แอปนี้ช่วยบันทึกปริมาณและความรู้สึก ไม่ใช่การวินิจฉัย รักษา หรือแทนแพทย์',ageConfirm:'ฉันอายุ 18+ และเข้าใจว่านี่เป็นตัวติดตามส่วนตัว ไม่ใช่การรักษา',continue:'ต่อไป',readDisclaimer:'อ่านข้อจำกัดความรับผิด',back:'กลับ',next:'ถัดไป',pinEnter:'ใส่ PIN',unlock:'เปิด',resetPin:'รีเซ็ต PIN และข้อมูลในเครื่อง',tabToday:'วันนี้',tabProgress:'ความคืบหน้า',tabWellbeing:'สุขภาพ',tabPlan:'แผน',tabProfile:'โปรไฟล์',updateAvailable:'มีเวอร์ชันใหม่',updateNow:'อัปเดต'}
};

const METRICS = [
  ['craving','Тяга','0 — нет тяги','10 — очень сильная тяга','bad'],
  ['withdrawal','Ломка / дискомфорт','0 — нет','10 — очень тяжело','bad'],
  ['anxiety','Тревога','0 — спокойно','10 — очень тревожно','bad'],
  ['mood','Настроение','0 — плохое','10 — отличное','good'],
  ['energy','Энергия','0 — нет сил','10 — много энергии','good'],
  ['sleepQuality','Качество сна','0 — ужасно','10 — отлично','good'],
  ['sleepHours','Длительность сна','0 — не спал','10 — 8+ часов','good'],
  ['focus','Фокус','0 — не могу собраться','10 — полный фокус','good'],
  ['stress','Стресс','0 — нет','10 — перегруз','bad'],
  ['bodyPain','Боль в теле','0 — нет','10 — сильная','bad'],
  ['sweating','Потливость','0 — нет','10 — сильная','bad'],
  ['stomach','ЖКТ / живот','0 — плохо','10 — комфортно','good'],
  ['appetite','Аппетит','0 — нет','10 — нормальный','good'],
  ['hydration','Вода / гидратация','0 — мало воды','10 — достаточно','good'],
  ['productivity','Продуктивность','0 — ничего','10 — отлично','good']
];
const TRIGGERS = ['стресс','недосып','работа','боль','скука','вечер','тревога','соц. ситуация','после еды','конфликт','усталость','ломка'];
const HELPERS = ['прогулка','спорт','вода','еда','душ','дыхание','сон','разговор','работа','медитация','кофеин без кратома','10 минут паузы'];

let state = loadState();
let currentTab = 'today';
let selectedDate = todayKey();
let sheetPayload = null;
let onboardingStep = 0;
let cloud = {enabled:false, ready:false, user:null, db:null, auth:null, api:null, syncing:false, queue:[]};

function defaultState(){
  return {
    schemaVersion:4,
    appVersion:APP_VERSION,
    acceptedAge:false,
    onboardingComplete:false,
    selectedTab:'today',
    profile:{
      lang:'ru', theme:'auto', name:'', timezone:Intl.DateTimeFormat().resolvedOptions().timeZone || 'local',
      baselineMl:1000, weeklyReductionPct:10, minTargetMl:0, planStartDate:todayKey(), goalMode:'reduce',
      quickAmounts:[50,100,150,200,250,300], pin:{enabled:false, hash:'', salt:''}, cloudAutoSync:true, backupReminderDays:7,
      lastBackupAt:null, lastCloudSyncAt:null, createdAt:new Date().toISOString()
    },
    days:{},
    cloud:{lastPulledAt:null,lastPushedAt:null},
    consent:{privacyAcceptedAt:null, healthDisclaimerAcceptedAt:null, analytics:false},
    meta:{lastOpenedAt:new Date().toISOString(), localDeviceId:uid(), migrationLog:[]}
  };
}

function loadState(){
  const fresh = defaultState();
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(raw){ return normalizeState({...fresh,...JSON.parse(raw)}); }
  }catch(e){ console.warn('state parse error', e); }
  const migrated = migrateOldData(fresh);
  saveState(migrated, false);
  return migrated;
}
function normalizeState(s){
  s.schemaVersion = 4;
  s.profile = {...defaultState().profile, ...(s.profile||{})};
  s.days = s.days || {};
  for(const [k,d] of Object.entries(s.days)) s.days[k] = normalizeDay(d,k);
  s.meta = {...defaultState().meta, ...(s.meta||{})};
  s.cloud = {...defaultState().cloud, ...(s.cloud||{})};
  s.consent = {...defaultState().consent, ...(s.consent||{})};
  return s;
}
function normalizeDay(d,date){
  const metrics = {};
  for(const [key] of METRICS) metrics[key] = d?.metrics?.[key] ?? null;
  return {
    date,
    entries:Array.isArray(d?.entries) ? d.entries.map(e=>({id:e.id||uid(), ts:e.ts||new Date(`${date}T12:00:00`).toISOString(), ml:Number(e.ml)||0, note:e.note||'', createdAt:e.createdAt||e.ts||new Date().toISOString(), updatedAt:e.updatedAt||new Date().toISOString()})).filter(e=>e.ml>=0) : [],
    metrics,
    morning:d?.morning||{}, evening:d?.evening||{}, triggers:Array.isArray(d?.triggers)?d.triggers:[], helpers:Array.isArray(d?.helpers)?d.helpers:[],
    relapse:d?.relapse||null, note:d?.note||'', closed:Boolean(d?.closed), updatedAt:d?.updatedAt||new Date().toISOString(), createdAt:d?.createdAt||new Date().toISOString()
  };
}
function migrateOldData(base){
  for(const key of OLD_KEYS){
    try{
      const raw = localStorage.getItem(key);
      if(!raw) continue;
      const old = JSON.parse(raw);
      base.meta.migrationLog.push({from:key, at:new Date().toISOString()});
      if(key==='kratomLog.entries.v1' && Array.isArray(old)){
        old.forEach(e=>{
          const dt = e.date || (e.ts ? dateKey(new Date(e.ts)) : todayKey());
          const d = ensureDay(base, dt);
          d.entries.push({id:e.id||uid(), ts:e.ts||new Date(`${dt}T12:00:00`).toISOString(), ml:Number(e.ml)||0, note:e.note||'', createdAt:e.ts||new Date().toISOString(), updatedAt:new Date().toISOString()});
        });
      } else if(old.days){
        for(const [date, day] of Object.entries(old.days)) base.days[date] = normalizeDay(day,date);
        if(old.profile) base.profile = {...base.profile, ...old.profile};
        base.acceptedAge = old.acceptedAge ?? true;
        base.onboardingComplete = old.onboardingComplete ?? true;
      } else if(old.entries && Array.isArray(old.entries)){
        old.entries.forEach(e=>{
          const dt = e.date || (e.ts ? dateKey(new Date(e.ts)) : todayKey());
          const d = ensureDay(base, dt);
          d.entries.push({id:e.id||uid(), ts:e.ts||new Date(`${dt}T12:00:00`).toISOString(), ml:Number(e.ml)||0, note:e.note||'', createdAt:e.ts||new Date().toISOString(), updatedAt:new Date().toISOString()});
        });
      }
    }catch(e){ console.warn('migration failed', key, e); }
  }
  return normalizeState(base);
}
function saveState(s=state, enqueue=true){
  s.appVersion = APP_VERSION;
  s.meta.lastOpenedAt = new Date().toISOString();
  localStorage.setItem(STORE_KEY, JSON.stringify(s));
  if(enqueue) scheduleCloudSync();
}
function uid(){return crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}
function dateKey(d){
  const x = new Date(d);
  const y=x.getFullYear(); const m=String(x.getMonth()+1).padStart(2,'0'); const day=String(x.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function todayKey(){return dateKey(new Date())}
function parseDate(k){const [y,m,d]=k.split('-').map(Number); return new Date(y,m-1,d)}
function addDays(k,n){const d=parseDate(k); d.setDate(d.getDate()+n); return dateKey(d)}
function formatDate(k, opts={weekday:'short', day:'2-digit', month:'short'}){return parseDate(k).toLocaleDateString(lang()==='th'?'th-TH':lang()==='en'?'en-US':'ru-RU', opts)}
function lang(){return state.profile.lang || 'ru'}
function t(key){return I18N[lang()]?.[key] || I18N.ru[key] || key}
function esc(s=''){return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function n(v){return Number(v)||0}
function getDay(k){return state.days[k] ? normalizeDay(state.days[k], k) : null}
function ensureDay(targetState, k){
  if(!targetState.days[k]) targetState.days[k] = normalizeDay({date:k}, k);
  return targetState.days[k];
}
function ensureCurrentDay(k=selectedDate){
  if(!state.days[k]) state.days[k] = normalizeDay({date:k}, k);
  return state.days[k];
}
function dayTotal(k){const d=getDay(k); return d ? d.entries.reduce((sum,e)=>sum+n(e.ml),0) : null}
function dayHasData(k){const d=getDay(k); return Boolean(d && (d.entries.length || hasMetrics(d) || d.note || d.triggers.length || d.helpers.length || d.relapse))}
function hasMetrics(d){return d && Object.values(d.metrics||{}).some(v=>v!==null && v!==undefined)}
function targetFor(k){
  const baseline=Math.max(0,n(state.profile.baselineMl)); const min=Math.max(0,n(state.profile.minTargetMl)); const pct=Math.max(0,Math.min(100,n(state.profile.weeklyReductionPct)))/100;
  const start=state.profile.planStartDate || todayKey(); const weeks=Math.max(0, Math.floor((parseDate(k)-parseDate(start))/(DAY_MS*7)));
  return Math.max(min, Math.round(baseline * Math.pow(1-pct,weeks)));
}
function dayStatus(k){
  const d=getDay(k); if(!d || !dayHasData(k)) return 'empty';
  const total=dayTotal(k)||0; const target=targetFor(k); if(d.relapse?.active) return 'bad';
  if(total<=target) return 'good';
  if(total<=target*1.15) return 'warn';
  return 'bad';
}
function wellbeingIndex(d){
  if(!d || !hasMetrics(d)) return null;
  let total=0, count=0;
  for(const [key,,, ,dir] of METRICS){
    const v=d.metrics?.[key]; if(v===null || v===undefined || v==='') continue;
    const score = dir==='good' ? n(v) : 10-n(v);
    total += Math.max(0,Math.min(10,score)); count++;
  }
  return count ? Math.round((total/(count*10))*100) : null;
}
function weekKeys(end=todayKey(), days=7){return Array.from({length:days}, (_,i)=>addDays(end, i-days+1))}
function avgFor(keys, onlyData=true){
  const vals=keys.map(k=>dayTotal(k)).filter(v=>onlyData ? v!==null : true).map(v=>v||0);
  return vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : 0;
}
function streak(){
  let s=0;
  for(let k=todayKey();;k=addDays(k,-1)){
    if(!dayHasData(k)) break;
    if(dayStatus(k)==='good') s++; else break;
    if(s>365) break;
  }
  return s;
}

function applyI18n(){ $$('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n)); document.documentElement.lang=lang(); }
function applyTheme(){
  const theme=state.profile.theme;
  const dark = theme==='dark' || (theme==='auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}
function toast(msg){ const el=$('#toast'); el.textContent=msg; el.classList.remove('hidden'); clearTimeout(toast._t); toast._t=setTimeout(()=>el.classList.add('hidden'),2400); }

async function init(){
  applyTheme(); applyI18n(); bindGlobal(); await initServiceWorker(); initCloud();
  if(!state.acceptedAge) return showAgeGate();
  if(!state.onboardingComplete) return showOnboarding();
  if(state.profile.pin.enabled) return showLock();
  showApp();
}
function bindGlobal(){
  $('#ageConfirm').addEventListener('change', e=>$('#acceptAgeBtn').disabled=!e.target.checked);
  $('#acceptAgeBtn').addEventListener('click', ()=>{state.acceptedAge=true; state.consent.healthDisclaimerAcceptedAt=new Date().toISOString(); saveState(); hideAllGates(); if(!state.onboardingComplete) showOnboarding(); else showApp();});
  $('#onboardBack').addEventListener('click', ()=>{onboardingStep=Math.max(0,onboardingStep-1); renderOnboarding();});
  $('#onboardNext').addEventListener('click', handleOnboardNext);
  $('#unlockBtn').addEventListener('click', unlock);
  $('#pinInput').addEventListener('keydown', e=>{if(e.key==='Enter') unlock();});
  $('#resetPinBtn').addEventListener('click', resetPinDanger);
  $('#themeBtn').addEventListener('click', ()=>{const opts=['auto','light','dark']; state.profile.theme=opts[(opts.indexOf(state.profile.theme)+1)%opts.length]; applyTheme(); saveState(); render();});
  $('#shareAppBtn').addEventListener('click', shareApp);
  $$('.nav-item').forEach(b=>b.addEventListener('click',()=>{currentTab=b.dataset.tab; state.selectedTab=currentTab; saveState(state,false); render();}));
  $('#sheet').addEventListener('click', e=>{ if(e.target.dataset.action==='closeSheet') closeSheet(); });
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('input', handleDocumentInput);
  $('#updateNowBtn').addEventListener('click', ()=>location.reload());
}
function hideAllGates(){ $$('.gate').forEach(x=>x.classList.add('hidden')); }
function showAgeGate(){hideAllGates(); $('#ageGate').classList.remove('hidden');}
function showLock(){hideAllGates(); $('#lockScreen').classList.remove('hidden'); $('#pinInput').focus();}
function showApp(){hideAllGates(); $('#appShell').classList.remove('hidden'); currentTab=state.selectedTab||'today'; render();}
async function unlock(){
  const val=$('#pinInput').value.trim(); if(!val) return;
  const ok= await verifyPin(val); if(ok){$('#lockScreen').classList.add('hidden'); showApp();} else toast('Неверный PIN');
}
function resetPinDanger(){
  if(confirm('Сброс PIN удалит локальные данные с этого устройства. Продолжить?')){localStorage.removeItem(STORE_KEY); location.reload();}
}

function showOnboarding(){hideAllGates(); $('#onboarding').classList.remove('hidden'); renderOnboarding();}
function renderOnboarding(){
  const steps=[
    `<h1>Настройка</h1><p class="muted">Приложение будет считать план снижения по твоим данным.</p><div class="field mt"><label>Язык</label><select id="obLang" class="select"><option value="ru">Русский</option><option value="en">English</option><option value="th">ไทย</option></select></div>`,
    `<h1>Текущий объем</h1><p class="muted">Сколько мл кратомного чая в среднем выходит за день сейчас?</p><div class="field mt"><label>Средний объем, мл/день</label><input id="obBaseline" class="input" inputmode="numeric" type="number" min="0" value="${state.profile.baselineMl}"></div>`,
    `<h1>Цель</h1><p class="muted">Выбери темп. Это не медицинская схема, а личный ориентир для графика.</p><div class="grid mt"><button class="btn secondary" data-ob-pct="5">Мягко 5%/нед</button><button class="btn secondary" data-ob-pct="10">Средне 10%/нед</button></div><div class="field mt"><label>Свой темп, %/нед</label><input id="obPct" class="input" inputmode="decimal" type="number" min="0" max="30" value="${state.profile.weeklyReductionPct}"></div>`,
    `<h1>Самочувствие</h1><p class="muted">Каждый день можно отмечать 15 шкал от 0 до 10, триггеры и что помогло.</p><div class="notice"><strong>0–10 без ползунков</strong><p>У каждой шкалы есть понятные границы: например, тяга 0 — нет, 10 — очень сильная.</p></div>`,
    `<h1>Приватность</h1><p class="muted">Можно пользоваться локально или подключить облако через аккаунт. Для публичной версии облако работает через Firebase.</p><label class="check-row"><input id="obPin" type="checkbox"> <span>Включить PIN на устройстве</span></label><div id="obPinWrap" class="field hidden"><label>PIN</label><input id="obPinValue" class="input pin" maxlength="8" inputmode="numeric" type="password"></div>`
  ];
  $('#onboardContent').innerHTML=steps[onboardingStep];
  $('#onboardStepLabel').style.width=`${((onboardingStep+1)/steps.length)*100}%`;
  $('#onboardBack').disabled=onboardingStep===0;
  $('#onboardNext').textContent=onboardingStep===steps.length-1?'Готово':'Далее';
  $('#obLang') && ($('#obLang').value=lang());
  $('#obLang')?.addEventListener('change', e=>{state.profile.lang=e.target.value; applyI18n(); renderOnboarding();});
  $$('[data-ob-pct]').forEach(b=>b.addEventListener('click',()=>{$('#obPct').value=b.dataset.obPct;}));
  $('#obPin')?.addEventListener('change', e=>$('#obPinWrap').classList.toggle('hidden',!e.target.checked));
}
async function handleOnboardNext(){
  const baseline=$('#obBaseline'); if(baseline) state.profile.baselineMl=Math.max(0,n(baseline.value));
  const pct=$('#obPct'); if(pct) state.profile.weeklyReductionPct=Math.max(0,Math.min(30,n(pct.value)));
  const pinOn=$('#obPin'); if(pinOn?.checked){const v=$('#obPinValue').value.trim(); if(v.length<4) return toast('PIN минимум 4 цифры'); await setPin(v);}
  if(onboardingStep<4){onboardingStep++; renderOnboarding(); return;}
  state.onboardingComplete=true; state.profile.planStartDate=todayKey(); state.consent.privacyAcceptedAt=new Date().toISOString(); saveState(); $('#onboarding').classList.add('hidden'); showApp();
}
async function setPin(pin){const salt=uid(); state.profile.pin={enabled:true, salt, hash:await digest(`${salt}:${pin}`)};}
async function verifyPin(pin){return state.profile.pin.hash===await digest(`${state.profile.pin.salt}:${pin}`)}
async function digest(s){const buf=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');}

function render(){
  applyTheme(); applyI18n(); updateCloudBadge();
  $$('.nav-item').forEach(b=>b.classList.toggle('active', b.dataset.tab===currentTab));
  const view=$('#view');
  if(currentTab==='today') view.innerHTML=renderToday();
  if(currentTab==='progress') view.innerHTML=renderProgress();
  if(currentTab==='wellbeing') view.innerHTML=renderWellbeing();
  if(currentTab==='plan') view.innerHTML=renderPlan();
  if(currentTab==='profile') view.innerHTML=renderProfile();
  requestAnimationFrame(drawCharts);
}
function renderDateNav(){return `<div class="date-nav card"><button class="btn tiny ghost" data-action="prevDay">←</button><strong>${formatDate(selectedDate,{weekday:'long', day:'2-digit', month:'long'})}</strong><button class="btn tiny ghost" data-action="nextDay" ${selectedDate>=todayKey()?'disabled':''}>→</button></div>`}
function renderToday(){
  const total=dayTotal(selectedDate)||0; const target=targetFor(selectedDate); const left=Math.max(0,target-total); const p=target?Math.min(100,Math.round(total/target*100)):0; const status=dayStatus(selectedDate);
  const d=getDay(selectedDate);
  return `${renderDateNav()}
  <section class="card hero">
    <div class="hero-grid">
      <div><div class="eyebrow">${selectedDate===todayKey()?'Сегодня':'Выбранный день'}</div><div class="big-number">${total}<span> мл</span></div>
      <div class="metric-row"><span class="pill ${status}">Цель ${target} мл</span><span class="pill">Осталось ${left} мл</span><span class="pill good">Серия ${streak()} дн.</span></div></div>
      <div class="progress-ring" style="--p:${p}"><div class="ring-inner"><strong>${p}%</strong><span>от цели</span></div></div>
    </div>
  </section>
  <section class="card"><div class="section-title"><div><h2>Добавить объем</h2><p>Быстрые кнопки можно поменять в профиле</p></div><button class="btn tiny secondary" data-action="openEntrySheet">Вручную</button></div>
  <div class="quick-grid">${state.profile.quickAmounts.map(a=>`<button class="quick-btn" data-action="quickAdd" data-ml="${a}">+${a}<br><span>мл</span></button>`).join('')}</div></section>
  <section class="card"><div class="section-title"><div><h2>Записи дня</h2><p>${d?.entries?.length||0} записей</p></div><button class="btn tiny danger-ghost" data-action="clearDay">Очистить</button></div>${renderEntries(d)}</section>
  <section class="card"><div class="section-title"><div><h2>Заметка</h2><p>Любой контекст дня</p></div></div><textarea class="textarea" data-bind="dayNote" placeholder="Например: плохо спал, было много работы...">${esc(d?.note||'')}</textarea></section>`;
}
function renderEntries(d){
  if(!d || !d.entries.length) return `<div class="empty">Записей пока нет. Нажми +100 мл или добавь вручную.</div>`;
  return `<div class="stack">${d.entries.slice().sort((a,b)=>new Date(b.ts)-new Date(a.ts)).map(e=>`<div class="entry"><div class="entry-time">${new Date(e.ts).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div><div><div class="entry-ml">${e.ml} мл</div>${e.note?`<div class="entry-note">${esc(e.note)}</div>`:''}</div><button class="btn tiny ghost" data-action="editEntry" data-id="${e.id}">Изм.</button></div>`).join('')}</div>`;
}
function renderProgress(){
  const keys30=weekKeys(todayKey(),30); const dataDays=keys30.filter(dayHasData).length;
  return `<section class="card"><div class="section-title"><div><h2>График снижения</h2><p>Факт / цель / 7-дневная средняя</p></div><select class="select" style="max-width:112px" data-action="rangeSelect"><option value="30">30 дн.</option><option value="90">90 дн.</option><option value="14">14 дн.</option></select></div><div class="chart-wrap"><canvas id="intakeChart" class="chart" data-days="30"></canvas></div><div class="legend"><span><i class="dot"></i> Факт</span><span><i class="dot target"></i> Цель</span><span><i class="dot avg"></i> Средняя</span></div></section>
  <section class="grid two-wide"><div class="card"><h2>Сводка</h2><div class="grid3 mt"><div class="pill">7д ср. ${avgFor(weekKeys(todayKey(),7))} мл</div><div class="pill">30д ср. ${avgFor(keys30)} мл</div><div class="pill">Дней с данными ${dataDays}/30</div></div></div><div class="card"><h2>Календарь</h2><div class="calendar mt">${renderCalendar(35)}</div></div></section>
  <section class="card"><div class="section-title"><div><h2>История</h2><p>Нажми на день, чтобы редактировать</p></div></div>${renderHistoryTable(30)}</section>
  <section class="card"><div class="section-title"><div><h2>Инсайты</h2><p>Что чаще связано с превышением</p></div></div><div class="insight-list">${renderInsights()}</div></section>`;
}
function renderCalendar(days){return weekKeys(todayKey(),days).map(k=>{const st=dayStatus(k); const total=dayTotal(k); return `<button class="day-cell ${st==='empty'?'':st} ${k===selectedDate?'selected':''}" data-action="selectDate" data-date="${k}">${parseDate(k).getDate()}${total!==null?`<small>${total}</small>`:''}</button>`}).join('')}
function renderHistoryTable(days){
  const rows=weekKeys(todayKey(),days).reverse().filter(k=>dayHasData(k));
  if(!rows.length) return `<div class="empty">Истории пока нет.</div>`;
  return `<table class="table"><thead><tr><th>День</th><th>Факт</th><th>Цель</th><th>Статус</th></tr></thead><tbody>${rows.map(k=>`<tr data-action="selectDate" data-date="${k}"><td>${formatDate(k,{day:'2-digit',month:'short'})}</td><td>${dayTotal(k)} мл</td><td>${targetFor(k)} мл</td><td><span class="status ${dayStatus(k)}">${statusLabel(dayStatus(k))}</span></td></tr>`).join('')}</tbody></table>`;
}
function statusLabel(s){return {empty:'нет данных',good:'в цели',warn:'выше',bad:'срыв'}[s]||s}
function renderInsights(){
  const days=Object.values(state.days).filter(d=>dayHasData(d.date));
  if(days.length<3) return `<div class="empty">Инсайты появятся после 3+ дней записей.</div>`;
  const high=days.filter(d=>dayStatus(d.date)==='warn'||dayStatus(d.date)==='bad');
  const top=topCounts(high.flatMap(d=>d.triggers||[])).slice(0,3);
  const helpers=topCounts(days.filter(d=>dayStatus(d.date)==='good').flatMap(d=>d.helpers||[])).slice(0,3);
  return `${top.length?`<div class="insight"><strong>Частые триггеры превышения</strong><span>${top.map(([k,c])=>`${k} (${c})`).join(', ')}</span></div>`:''}${helpers.length?`<div class="insight"><strong>Что чаще связано с хорошими днями</strong><span>${helpers.map(([k,c])=>`${k} (${c})`).join(', ')}</span></div>`:''}<div class="insight"><strong>Дней с данными</strong><span>${days.length}. Чем стабильнее дневник, тем точнее выводы.</span></div>`;
}
function topCounts(arr){const m={}; arr.forEach(x=>m[x]=(m[x]||0)+1); return Object.entries(m).sort((a,b)=>b[1]-a[1]);}
function renderWellbeing(){
  const d=getDay(selectedDate); const idx=wellbeingIndex(d);
  return `${renderDateNav()}<section class="card hero"><div class="hero-grid"><div><div class="eyebrow">Индекс самочувствия</div><div class="big-number">${idx??'—'}<span> /100</span></div><div class="metric-row"><span class="pill">15 шкал 0–10</span><span class="pill">утро + вечер</span></div></div><button class="btn primary" data-action="openCheckinSheet">Чек-ин</button></div></section>
  <section class="card"><div class="section-title"><div><h2>Шкалы 0–10</h2><p>Чёткие границы без ползунков</p></div></div>${METRICS.map(m=>renderMetric(m,d?.metrics?.[m[0]])).join('')}</section>
  <section class="card"><div class="section-title"><div><h2>Триггеры</h2><p>Что могло усилить тягу</p></div></div><div class="chips">${TRIGGERS.map(x=>`<button class="chip ${d?.triggers?.includes(x)?'active':''}" data-action="toggleTrigger" data-value="${x}">${x}</button>`).join('')}</div></section>
  <section class="card"><div class="section-title"><div><h2>Что помогло</h2><p>Факторы, снижающие риск</p></div></div><div class="chips">${HELPERS.map(x=>`<button class="chip ${d?.helpers?.includes(x)?'active':''}" data-action="toggleHelper" data-value="${x}">${x}</button>`).join('')}</div></section>
  <section class="card"><div class="section-title"><div><h2>График самочувствия</h2><p>Индекс /100</p></div></div><div class="chart-wrap"><canvas id="wellbeingChart" class="chart" data-days="30"></canvas></div></section>`;
}
function renderMetric([key,label,min,max],val){
  return `<div class="metric-card"><header><div><h3>${label}</h3><p>${min} · ${max}</p></div><strong>${val??'—'}</strong></header><div class="scale">${Array.from({length:11},(_,i)=>`<button class="${val===i?'active':''}" data-action="setMetric" data-key="${key}" data-val="${i}">${i}</button>`).join('')}</div></div>`;
}
function renderPlan(){
  const weeks=Array.from({length:8},(_,i)=>{const k=addDays(state.profile.planStartDate,i*7); return [i+1,k,targetFor(k)]});
  return `<section class="card"><div class="section-title"><div><h2>План снижения</h2><p>Ориентир для дневной цели, не медицинская схема</p></div></div><div class="grid mt"><div class="field"><label>Стартовый объем, мл</label><input class="input" data-bind-profile="baselineMl" type="number" min="0" value="${state.profile.baselineMl}"></div><div class="field"><label>Снижение, %/нед</label><input class="input" data-bind-profile="weeklyReductionPct" type="number" min="0" max="30" value="${state.profile.weeklyReductionPct}"></div><div class="field"><label>Минимальная цель, мл</label><input class="input" data-bind-profile="minTargetMl" type="number" min="0" value="${state.profile.minTargetMl}"></div><div class="field"><label>Дата старта</label><input class="input" data-bind-profile="planStartDate" type="date" value="${state.profile.planStartDate}"></div></div><div class="notice"><strong>Мягкий режим после превышения</strong><p>Если день вышел за цель, данные не обнуляются. Лучше зафиксировать триггер и вернуться к плану на следующий день.</p></div></section>
  <section class="card"><h2>Прогноз на 8 недель</h2><table class="table"><tbody>${weeks.map(([w,k,tg])=>`<tr><td>Неделя ${w}</td><td>${formatDate(k,{day:'2-digit',month:'short'})}</td><td>${tg} мл/день</td></tr>`).join('')}</tbody></table></section>
  <section class="card"><h2>Антисрыв</h2><p class="muted">Когда есть сильная тяга, запусти паузу и дыхание 4–4–6.</p><div class="grid mt"><button class="btn primary" data-action="openUrgeTool">10 минут паузы</button><button class="btn secondary" data-action="openRelapseSheet">Зафиксировать срыв</button></div></section>`;
}
function renderProfile(){
  return `<section class="card"><div class="section-title"><div><h2>Аккаунт и облако</h2><p>Данные сохраняются локально и могут синхронизироваться с Firebase</p></div></div>${renderCloudBox()}</section>
  <section class="card"><h2>Настройки</h2><div class="grid mt"><div class="field"><label>Язык</label><select class="select" data-bind-profile="lang"><option value="ru">Русский</option><option value="en">English</option><option value="th">ไทย</option></select></div><div class="field"><label>Тема</label><select class="select" data-bind-profile="theme"><option value="auto">Auto</option><option value="light">Light</option><option value="dark">Dark</option></select></div><div class="field"><label>Быстрые кнопки, мл</label><input class="input" data-bind-quick value="${state.profile.quickAmounts.join(', ')}"></div></div><div class="grid mt"><button class="btn secondary" data-action="openPinSheet">PIN</button><button class="btn secondary" data-action="shareProgress">Копировать отчет</button></div></section>
  <section class="card"><h2>Данные</h2><div class="grid mt"><button class="btn secondary" data-action="exportJson">Экспорт JSON</button><button class="btn secondary" data-action="exportCsv">Экспорт CSV</button><button class="btn ghost" data-action="importJson">Импорт JSON</button><button class="btn danger-ghost" data-action="deleteLocal">Удалить локально</button></div><input id="importFile" type="file" accept="application/json" class="hidden"></section>
  <section class="card"><h2>Документы</h2><div class="grid mt"><button class="btn ghost" data-action="openDoc" data-doc="privacy">Privacy</button><button class="btn ghost" data-action="openDoc" data-doc="terms">Terms</button><button class="btn ghost" data-action="openDoc" data-doc="disclaimer">Disclaimer</button><button class="btn ghost" data-action="openDoc" data-doc="install">Install guide</button></div></section>`;
}
function renderCloudBox(){
  if(!window.TEA_TAPER_FIREBASE_CONFIG || !window.TEA_TAPER_FIREBASE_CONFIG.apiKey) return `<div class="notice warn"><strong>Облако не настроено</strong><p>Добавь Firebase config в firebase-config.js и правила из firebase/firestore.rules. До этого приложение работает локально.</p></div>`;
  if(cloud.user) return `<div class="notice"><strong>Cloud connected</strong><p>${esc(cloud.user.email || 'Anonymous user')} · ${state.profile.lastCloudSyncAt?`последняя синхронизация ${new Date(state.profile.lastCloudSyncAt).toLocaleString()}`:'ожидает синхронизацию'}</p></div><div class="grid mt"><button class="btn primary" data-action="syncNow">Синхронизировать</button><button class="btn ghost" data-action="cloudSignOut">Выйти</button><button class="btn danger-ghost" data-action="deleteCloudData">Удалить cloud-данные</button></div>`;
  return `<div class="grid"><div class="field"><label>Email</label><input id="cloudEmail" class="input" type="email" autocomplete="email"></div><div class="field"><label>Пароль</label><input id="cloudPass" class="input" type="password" autocomplete="current-password"></div></div><div class="grid mt"><button class="btn primary" data-action="cloudSignIn">Войти</button><button class="btn secondary" data-action="cloudSignUp">Создать аккаунт</button><button class="btn ghost" data-action="cloudAnon">Анонимно</button></div>`;
}

function handleDocumentClick(e){
  const el=e.target.closest('[data-action]'); if(!el) return;
  const a=el.dataset.action;
  if(a==='quickAdd') addEntry({ml:n(el.dataset.ml)});
  if(a==='openEntrySheet') openEntrySheet();
  if(a==='editEntry') openEntrySheet(el.dataset.id);
  if(a==='clearDay') clearDay();
  if(a==='prevDay'){selectedDate=addDays(selectedDate,-1); render();}
  if(a==='nextDay'){selectedDate=addDays(selectedDate,1); render();}
  if(a==='selectDate'){selectedDate=el.dataset.date; currentTab='today'; render();}
  if(a==='setMetric') setMetric(el.dataset.key,n(el.dataset.val));
  if(a==='toggleTrigger') toggleArray('triggers',el.dataset.value);
  if(a==='toggleHelper') toggleArray('helpers',el.dataset.value);
  if(a==='openCheckinSheet') openCheckinSheet();
  if(a==='openRelapseSheet') openRelapseSheet();
  if(a==='openUrgeTool') openUrgeTool();
  if(a==='openPinSheet') openPinSheet();
  if(a==='exportJson') exportJson();
  if(a==='exportCsv') exportCsv();
  if(a==='importJson') importJsonFile();
  if(a==='deleteLocal') deleteLocal();
  if(a==='openDoc') openDoc(el.dataset.doc);
  if(a==='shareProgress') shareProgress();
  if(a==='cloudSignIn') cloudSignIn(false);
  if(a==='cloudSignUp') cloudSignIn(true);
  if(a==='cloudAnon') cloudAnonymous();
  if(a==='cloudSignOut') cloudSignOut();
  if(a==='syncNow') syncNow();
  if(a==='deleteCloudData') deleteCloudData();
  if(a==='rangeSelect') setTimeout(drawCharts,50);
  if(a==='closeSheet') closeSheet();
}
function handleDocumentInput(e){
  const el=e.target;
  if(el.dataset.bind==='dayNote'){const d=ensureCurrentDay(); d.note=el.value; d.updatedAt=new Date().toISOString(); saveState();}
  if(el.dataset.bindProfile){
    const key=el.dataset.bindProfile; let val=el.value; if(['baselineMl','weeklyReductionPct','minTargetMl'].includes(key)) val=n(val); state.profile[key]=val; saveState(); if(['lang','theme'].includes(key)){applyTheme(); applyI18n(); render();}
  }
  if(el.dataset.bindQuick){state.profile.quickAmounts=el.value.split(',').map(x=>n(x.trim())).filter(x=>x>0).slice(0,12); saveState();}
}
function addEntry({ml, ts, note=''}){const d=ensureCurrentDay(); d.entries.push({id:uid(), ts:ts||new Date().toISOString(), ml:n(ml), note, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString()}); d.updatedAt=new Date().toISOString(); saveState(); render(); toast(`+${ml} мл`);}
function clearDay(){if(!confirm('Очистить выбранный день?')) return; delete state.days[selectedDate]; saveState(); render();}
function setMetric(key,val){const d=ensureCurrentDay(); d.metrics[key]=val; d.updatedAt=new Date().toISOString(); saveState(); render();}
function toggleArray(type,value){const d=ensureCurrentDay(); const arr=d[type]||[]; d[type]=arr.includes(value)?arr.filter(x=>x!==value):[...arr,value]; d.updatedAt=new Date().toISOString(); saveState(); render();}
function openSheet(html){$('#sheetContent').innerHTML=html; $('#sheet').classList.remove('hidden'); $('#sheet').setAttribute('aria-hidden','false');}
function closeSheet(){sheetPayload=null; $('#sheet').classList.add('hidden'); $('#sheet').setAttribute('aria-hidden','true');}
function openEntrySheet(id=null){
  const d=getDay(selectedDate); const entry=id?d?.entries.find(e=>e.id===id):null; sheetPayload={id};
  const ts=entry?.ts ? new Date(entry.ts) : new Date(`${selectedDate}T${new Date().toTimeString().slice(0,5)}`);
  openSheet(`<h2>${entry?'Редактировать запись':'Новая запись'}</h2><div class="grid mt"><div class="field"><label>Дата</label><input id="entryDate" class="input" type="date" value="${selectedDate}"></div><div class="field"><label>Время</label><input id="entryTime" class="input" type="time" value="${ts.toTimeString().slice(0,5)}"></div><div class="field"><label>Объем, мл</label><input id="entryMl" class="input" type="number" inputmode="numeric" min="0" value="${entry?.ml||100}"></div></div><div class="field mt"><label>Комментарий</label><textarea id="entryNote" class="textarea">${esc(entry?.note||'')}</textarea></div><div class="grid mt"><button class="btn primary" id="saveEntryBtn">Сохранить</button>${entry?'<button class="btn danger-ghost" id="deleteEntryBtn">Удалить</button>':''}</div>`);
  $('#saveEntryBtn').onclick=saveEntrySheet; $('#deleteEntryBtn') && ($('#deleteEntryBtn').onclick=deleteEntrySheet);
}
function saveEntrySheet(){
  const date=$('#entryDate').value || selectedDate; const time=$('#entryTime').value || '12:00'; const ml=n($('#entryMl').value); const note=$('#entryNote').value.trim();
  const ts=new Date(`${date}T${time}:00`).toISOString();
  if(sheetPayload?.id){
    for(const [k,d] of Object.entries(state.days)){ const idx=d.entries.findIndex(e=>e.id===sheetPayload.id); if(idx>=0){ d.entries.splice(idx,1); d.updatedAt=new Date().toISOString(); if(!dayHasData(k)) delete state.days[k]; break; }}
  }
  const d=ensureDay(state,date); d.entries.push({id:sheetPayload?.id||uid(), ts, ml, note, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString()}); d.updatedAt=new Date().toISOString(); selectedDate=date; saveState(); closeSheet(); render();
}
function deleteEntrySheet(){
  for(const [k,d] of Object.entries(state.days)){ const idx=d.entries.findIndex(e=>e.id===sheetPayload.id); if(idx>=0){ d.entries.splice(idx,1); d.updatedAt=new Date().toISOString(); if(!dayHasData(k)) delete state.days[k]; break; }}
  saveState(); closeSheet(); render();
}
function openCheckinSheet(){
  const d=getDay(selectedDate)||normalizeDay({date:selectedDate},selectedDate);
  openSheet(`<h2>Быстрый чек-ин</h2><p class="muted">Заполни ключевые шкалы. Полный список доступен на экране состояния.</p>${['craving','anxiety','energy','sleepQuality','mood'].map(k=>renderMetric(METRICS.find(m=>m[0]===k),d.metrics[k])).join('')}<button class="btn primary full mt" data-action="closeSheet">Готово</button>`);
}
function openRelapseSheet(){
  openSheet(`<h2>Зафиксировать срыв / превышение</h2><p class="muted">Один день не обнуляет прогресс. Важно понять причину.</p><div class="field mt"><label>Что произошло?</label><textarea id="relapseNote" class="textarea" placeholder="Например: недосып, стресс, сильная тяга вечером..."></textarea></div><div class="field mt"><label>План на завтра</label><select id="relapsePlan" class="select"><option value="return">Вернуться к цели</option><option value="hold">Удержать текущий уровень 2–3 дня</option><option value="soft">Сделать мягкий день без давления</option></select></div><button id="saveRelapseBtn" class="btn primary full mt">Сохранить</button>`);
  $('#saveRelapseBtn').onclick=()=>{const d=ensureCurrentDay(); d.relapse={active:true,note:$('#relapseNote').value.trim(),plan:$('#relapsePlan').value,createdAt:new Date().toISOString()}; d.updatedAt=new Date().toISOString(); saveState(); closeSheet(); render();};
}
function openUrgeTool(){
  openSheet(`<h2>10 минут паузы</h2><p class="muted">Не решай сейчас. Запусти таймер, выпей воды, сделай дыхание 4–4–6.</p><div class="card hero" style="margin-top:12px"><div class="big-number" id="urgeTimer">10:00</div></div><div class="grid"><button class="btn primary" id="startUrge">Старт</button><button class="btn secondary" id="breathBtn">Дыхание 4–4–6</button></div><p id="breathText" class="muted mt"></p>`);
  let left=600,timer=null; $('#startUrge').onclick=()=>{clearInterval(timer); timer=setInterval(()=>{left--; $('#urgeTimer').textContent=`${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`; if(left<=0){clearInterval(timer); toast('Пауза завершена');}},1000)}; let phases=['Вдох 4 сек','Пауза 4 сек','Выдох 6 сек']; let i=0; $('#breathBtn').onclick=()=>{$('#breathText').textContent=phases[i++%3];};
}
function openPinSheet(){
  openSheet(`<h2>PIN</h2><p class="muted">В PWA это локальная защита устройства, не банковское шифрование.</p><div class="field mt"><label>Новый PIN</label><input id="newPin" class="input pin" maxlength="8" inputmode="numeric" type="password"></div><div class="grid mt"><button id="savePin" class="btn primary">Сохранить PIN</button><button id="disablePin" class="btn danger-ghost">Выключить PIN</button></div>`);
  $('#savePin').onclick=async()=>{const v=$('#newPin').value.trim(); if(v.length<4) return toast('PIN минимум 4 цифры'); await setPin(v); saveState(); closeSheet(); toast('PIN сохранен');};
  $('#disablePin').onclick=()=>{state.profile.pin={enabled:false,hash:'',salt:''}; saveState(); closeSheet(); toast('PIN выключен');};
}
function openDoc(doc){
  const docs={
    privacy:['Privacy Policy','Данные объема, самочувствия, заметки и аккаунта являются чувствительными. По умолчанию они хранятся на устройстве. При подключении облака данные сохраняются в Firebase Firestore в личной папке пользователя. Данные не продаются рекламодателям. Пользователь может экспортировать или удалить данные.'],
    terms:['Terms of Use','Приложение предназначено для личного дневника и отслеживания привычки. Запрещено использовать его для продажи, рекламы или продвижения кратома или любых веществ. Пользователь отвечает за корректность вводимых данных и резервные копии.'],
    disclaimer:['Medical Disclaimer','Tea Taper не является медицинским устройством, не диагностирует, не лечит, не предотвращает заболевания и не назначает схему отмены. При тяжелых симптомах, беременности, хронических заболеваниях, приеме препаратов или риске самоповреждения нужно обратиться за профессиональной медицинской помощью.'],
    install:['Install Guide','iPhone: открой ссылку в Safari → Поделиться → На экран Домой. Android: открой в Chrome → Add to Home Screen. Для публикации в Google Play/App Store используйте Capacitor wrapper из package.json.']
  };
  const [title,body]=docs[doc]||docs.disclaimer; openSheet(`<div class="doc"><h1>${title}</h1><p>${body}</p><button class="btn primary full" data-action="closeSheet">Понятно</button></div>`);
}

function drawCharts(){ drawIntakeChart($('#intakeChart')); drawWellbeingChart($('#wellbeingChart')); }
function drawIntakeChart(canvas){ if(!canvas) return; const days=n(canvas.dataset.days)||30; const keys=weekKeys(todayKey(),days); const values=keys.map(k=>dayTotal(k)); const targets=keys.map(targetFor); const avg=keys.map((_,i)=>avgFor(keys.slice(Math.max(0,i-6),i+1))); drawLineChart(canvas, keys, [{values, color:getCss('--primary')},{values:targets, color:getCss('--blue')},{values:avg, color:getCss('--warn')}], true); }
function drawWellbeingChart(canvas){ if(!canvas) return; const keys=weekKeys(todayKey(),30); const values=keys.map(k=>wellbeingIndex(getDay(k))); drawLineChart(canvas, keys, [{values, color:getCss('--primary')}], false, 100); }
function getCss(v){return getComputedStyle(document.documentElement).getPropertyValue(v).trim()}
function drawLineChart(canvas, keys, series, hasTarget=false, fixedMax=null){
  const dpr=devicePixelRatio||1; const rect=canvas.getBoundingClientRect(); canvas.width=rect.width*dpr; canvas.height=rect.height*dpr; const ctx=canvas.getContext('2d'); ctx.scale(dpr,dpr); const w=rect.width,h=rect.height,pad=28; ctx.clearRect(0,0,w,h); ctx.strokeStyle=getCss('--line'); ctx.lineWidth=1; ctx.font='11px -apple-system, BlinkMacSystemFont, Segoe UI'; ctx.fillStyle=getCss('--muted');
  for(let i=0;i<4;i++){const y=pad+(h-pad*2)*i/3; ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(w-pad,y); ctx.stroke();}
  const all=series.flatMap(s=>s.values.filter(v=>v!==null && v!==undefined)); const max=fixedMax||Math.max(100,...all)*1.12; const x=(i)=>pad+(w-pad*2)*(keys.length<=1?0:i/(keys.length-1)); const y=(v)=>h-pad-(h-pad*2)*(v/max);
  series.forEach(s=>{ctx.strokeStyle=s.color; ctx.lineWidth=2.5; ctx.beginPath(); let started=false; s.values.forEach((v,i)=>{if(v===null||v===undefined){started=false; return;} if(!started){ctx.moveTo(x(i),y(v)); started=true;} else ctx.lineTo(x(i),y(v));}); ctx.stroke(); s.values.forEach((v,i)=>{if(v===null||v===undefined)return; ctx.fillStyle=s.color; ctx.beginPath(); ctx.arc(x(i),y(v),3,0,Math.PI*2); ctx.fill();});});
  ctx.fillStyle=getCss('--muted'); ctx.fillText(keys[0]?.slice(5)||'', pad, h-8); ctx.fillText(keys[keys.length-1]?.slice(5)||'', w-pad-36, h-8);
}

function exportJson(){download(`teataper-backup-${todayKey()}.json`, JSON.stringify(state,null,2), 'application/json'); state.profile.lastBackupAt=new Date().toISOString(); saveState();}
function exportCsv(){
  const header=['date','total_ml','target_ml','difference_ml','status','entries_count',...METRICS.map(m=>m[0]),'triggers','helpers','relapse','note'];
  const rows=Object.keys(state.days).sort().map(k=>{const d=state.days[k]; const total=dayTotal(k)||0; return [k,total,targetFor(k),total-targetFor(k),dayStatus(k),d.entries.length,...METRICS.map(m=>d.metrics[m[0]]??''),(d.triggers||[]).join('|'),(d.helpers||[]).join('|'),d.relapse?.active?'yes':'',d.note||''];});
  const csv='\ufeff'+[header,...rows].map(r=>r.map(cell=>`"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n'); download(`teataper-export-${todayKey()}.csv`,csv,'text/csv;charset=utf-8');
}
function download(name, content, type){const blob=new Blob([content],{type}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),500);}
async function importJsonFile(){
  const input=document.createElement('input'); input.type='file'; input.accept='application/json';
  input.onchange=async()=>{const file=input.files[0]; if(!file)return; try{const imported=normalizeState(JSON.parse(await file.text())); state=imported; saveState(); render(); toast('Импортировано');}catch(err){toast('Ошибка импорта')}};
  input.click();
}
function deleteLocal(){if(confirm('Удалить локальную историю на этом устройстве?')){localStorage.removeItem(STORE_KEY); location.reload();}}
function shareProgress(){navigator.clipboard?.writeText(buildReport()); toast('Отчет скопирован');}
function shareApp(){const data={title:'Tea Taper', text:'Private kratom tea taper tracker', url:location.href}; if(navigator.share) navigator.share(data); else {navigator.clipboard?.writeText(location.href); toast('Ссылка скопирована');}}
function buildReport(){const keys=weekKeys(todayKey(),7); return `Tea Taper — неделя\nСреднее: ${avgFor(keys)} мл/день\nДней с данными: ${keys.filter(dayHasData).length}/7\nСерия в цели: ${streak()} дн.\nСегодня: ${dayTotal(todayKey())??0}/${targetFor(todayKey())} мл`;}

async function initCloud(){
  const cfg=window.TEA_TAPER_FIREBASE_CONFIG;
  if(!cfg || !cfg.apiKey || cfg.apiKey.includes('PASTE_')){updateCloudBadge(); return;}
  try{
    const [appMod, authMod, fsMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js')
    ]);
    const app=appMod.initializeApp(cfg); cloud.api={...appMod,...authMod,...fsMod}; cloud.auth=authMod.getAuth(app); cloud.db=fsMod.getFirestore(app); cloud.enabled=true; cloud.ready=true;
    authMod.onAuthStateChanged(cloud.auth, async user=>{cloud.user=user; updateCloudBadge(); if(user){await syncNow();} render();});
  }catch(e){console.warn('cloud init failed',e); cloud.enabled=false; updateCloudBadge();}
}
function updateCloudBadge(){const b=$('#cloudBadge'); if(!b) return; if(cloud.user){b.textContent='Cloud synced'; b.classList.add('ok');} else if(cloud.enabled){b.textContent='Cloud ready'; b.classList.remove('ok');} else {b.textContent='Local only'; b.classList.remove('ok');}}
async function cloudSignIn(signUp=false){
  if(!cloud.ready) return toast('Firebase не настроен');
  const email=$('#cloudEmail')?.value.trim(); const pass=$('#cloudPass')?.value; if(!email||!pass) return toast('Email и пароль');
  try{signUp?await cloud.api.createUserWithEmailAndPassword(cloud.auth,email,pass):await cloud.api.signInWithEmailAndPassword(cloud.auth,email,pass); toast('Cloud connected');}catch(e){toast(e.message||'Ошибка входа');}
}
async function cloudAnonymous(){if(!cloud.ready)return toast('Firebase не настроен'); try{await cloud.api.signInAnonymously(cloud.auth); toast('Анонимный аккаунт создан');}catch(e){toast(e.message||'Ошибка');}}
async function cloudSignOut(){await cloud.api.signOut(cloud.auth); toast('Выход выполнен');}
function scheduleCloudSync(){ if(!state.profile.cloudAutoSync || !cloud.user || cloud.syncing) return; clearTimeout(scheduleCloudSync._t); scheduleCloudSync._t=setTimeout(syncNow,800); }
async function syncNow(){
  if(!cloud.user || !cloud.db || cloud.syncing) return; cloud.syncing=true; updateCloudBadge();
  try{
    const {doc,setDoc,getDoc,collection,getDocs,serverTimestamp,deleteDoc,writeBatch} = cloud.api; const uidc=cloud.user.uid;
    const profileRef=doc(cloud.db,'users',uidc,'private','profile');
    const cloudProfile=await getDoc(profileRef);
    if(cloudProfile.exists()){
      const cp=cloudProfile.data(); if(cp.profileUpdatedAt && (!state.profile.cloudProfileUpdatedAt || cp.profileUpdatedAt>state.profile.cloudProfileUpdatedAt)) state.profile={...state.profile,...cp.profile, pin:state.profile.pin};
    }
    const daysRef=collection(cloud.db,'users',uidc,'days'); const snap=await getDocs(daysRef);
    snap.forEach(ds=>{const remote=normalizeDay(ds.data(), ds.id); const local=state.days[ds.id]; if(!local || new Date(remote.updatedAt)>new Date(local.updatedAt||0)) state.days[ds.id]=remote;});
    const batch=writeBatch(cloud.db);
    batch.set(profileRef,{profile:{...state.profile,pin:{enabled:state.profile.pin.enabled}}, profileUpdatedAt:new Date().toISOString(), updatedAt:serverTimestamp(), appVersion:APP_VERSION},{merge:true});
    Object.entries(state.days).forEach(([k,d])=>batch.set(doc(cloud.db,'users',uidc,'days',k), d, {merge:true}));
    await batch.commit(); state.profile.lastCloudSyncAt=new Date().toISOString(); saveState(state,false); toast('Синхронизировано');
  }catch(e){console.warn('sync failed',e); toast('Ошибка синхронизации');}
  finally{cloud.syncing=false; updateCloudBadge(); render();}
}
async function deleteCloudData(){
  if(!cloud.user || !confirm('Удалить cloud-данные этого аккаунта? Локальные данные останутся.')) return;
  try{const {doc,collection,getDocs,deleteDoc,writeBatch}=cloud.api; const uidc=cloud.user.uid; const snap=await getDocs(collection(cloud.db,'users',uidc,'days')); const batch=writeBatch(cloud.db); snap.forEach(ds=>batch.delete(ds.ref)); batch.delete(doc(cloud.db,'users',uidc,'private','profile')); await batch.commit(); toast('Cloud-данные удалены');}catch(e){toast('Ошибка удаления cloud');}
}

async function initServiceWorker(){
  if(!('serviceWorker' in navigator)) return;
  try{
    const reg=await navigator.serviceWorker.register('./sw.js');
    reg.addEventListener('updatefound',()=>{const nw=reg.installing; nw?.addEventListener('statechange',()=>{if(nw.state==='installed' && navigator.serviceWorker.controller) $('#updateBar').classList.remove('hidden');});});
  }catch(e){console.warn('sw failed',e)}
}

init();
