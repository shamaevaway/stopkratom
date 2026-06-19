'use strict';

const STORE_KEY = 'stopkratom_pro_v2';
const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (iso, delta) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
};
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const fmt = new Intl.NumberFormat('ru-RU');

const I18N = {
  ru: {
    lockTitle:'Защищенный вход', lockHint:'Введите PIN, чтобы открыть трекер.', unlock:'Открыть', resetPin:'Сбросить PIN',
    appEyebrow:'личный трекер снижения', disclaimerTitle:'Важно', disclaimerText:'Это дневник учета, не медицинская схема лечения. При сильной отмене, боли, спутанности, судорогах или резком ухудшении — обратись к врачу.', ok:'Ок',
    tabToday:'День', tabAnalytics:'Графики', tabPlan:'План', tabJournal:'Журнал', tabData:'Данные', selectedDate:'Выбранный день', todayTotal:'Всего за день', planStatus:'Статус плана', quickAdd:'Быстро добавить', editButtons:'Кнопки', add:'Добавить', notePlaceholder:'Заметка: причина / место', entries:'Записи дня', clearDay:'Очистить день', symptoms:'Самочувствие', save:'Сохранить', sleep:'Сон', craving:'Тяга', energy:'Энергия', mood:'Настроение', journalPlaceholder:'Короткая заметка по дню', avg7:'Среднее 7 дней', trend:'Тренд', streak:'Серия', volumeChart:'Объем и цель', calendar:'Календарь прогресса', symptomChart:'Самочувствие / тяга', taperPlan:'План снижения', dailyTarget:'Дневная цель, мл', baseline:'Стартовый уровень, мл/день', weeklyReduction:'Снижение в неделю, %', startDate:'Дата старта', savePlan:'Сохранить план', forecast:'Прогноз', achievements:'Достижения', history:'История', backup:'Бэкап и перенос', exportJson:'Экспорт JSON', exportCsv:'Экспорт CSV', copySummary:'Сводка', importJson:'Импорт JSON', dangerZone:'Опасная зона', wipeData:'Удалить все данные', settings:'Настройки', language:'Язык', pinCode:'PIN-код', reminderTime:'Напоминание', quickAmounts:'Быстрые кнопки, мл', saveSettings:'Сохранить настройки', noEntries:'Записей нет', edit:'Изм.', delete:'Удалить', onTrack:'В плане', overPlan:'Выше плана', underPlan:'Ниже цели', yesterday:'Вчера', today:'Сегодня', tomorrow:'Завтра', saved:'Сохранено', exported:'Файл экспортирован', imported:'Импортировано', copied:'Сводка скопирована', invalid:'Некорректное значение', confirmClear:'Очистить записи за выбранный день?', confirmWipe:'Удалить все данные без восстановления?', pinWrong:'Неверный PIN', pinReset:'PIN сброшен', reduced:'снижение', increased:'рост', stable:'стабильно', days:'дн.', noData:'Пока нет данных', planTarget:'цель', actual:'факт'
  },
  en: {
    lockTitle:'Protected access', lockHint:'Enter PIN to open tracker.', unlock:'Unlock', resetPin:'Reset PIN', appEyebrow:'personal reduction tracker', disclaimerTitle:'Important', disclaimerText:'This is a tracking diary, not a medical treatment plan. If withdrawal is severe or symptoms worsen, contact a clinician.', ok:'Ok', tabToday:'Day', tabAnalytics:'Charts', tabPlan:'Plan', tabJournal:'Journal', tabData:'Data', selectedDate:'Selected day', todayTotal:'Daily total', planStatus:'Plan status', quickAdd:'Quick add', editButtons:'Buttons', add:'Add', notePlaceholder:'Note: trigger / place', entries:'Day entries', clearDay:'Clear day', symptoms:'Wellbeing', save:'Save', sleep:'Sleep', craving:'Craving', energy:'Energy', mood:'Mood', journalPlaceholder:'Short day note', avg7:'7-day avg', trend:'Trend', streak:'Streak', volumeChart:'Volume and target', calendar:'Progress calendar', symptomChart:'Wellbeing / craving', taperPlan:'Taper plan', dailyTarget:'Daily target, ml', baseline:'Baseline, ml/day', weeklyReduction:'Weekly reduction, %', startDate:'Start date', savePlan:'Save plan', forecast:'Forecast', achievements:'Achievements', history:'History', backup:'Backup and transfer', exportJson:'Export JSON', exportCsv:'Export CSV', copySummary:'Summary', importJson:'Import JSON', dangerZone:'Danger zone', wipeData:'Delete all data', settings:'Settings', language:'Language', pinCode:'PIN code', reminderTime:'Reminder', quickAmounts:'Quick buttons, ml', saveSettings:'Save settings', noEntries:'No entries', edit:'Edit', delete:'Delete', onTrack:'On track', overPlan:'Over plan', underPlan:'Under target', yesterday:'Yesterday', today:'Today', tomorrow:'Tomorrow', saved:'Saved', exported:'File exported', imported:'Imported', copied:'Summary copied', invalid:'Invalid value', confirmClear:'Clear selected day entries?', confirmWipe:'Delete all data permanently?', pinWrong:'Wrong PIN', pinReset:'PIN reset', reduced:'reduced', increased:'increased', stable:'stable', days:'days', noData:'No data yet', planTarget:'target', actual:'actual'
  },
  th: {
    lockTitle:'เข้าด้วย PIN', lockHint:'ใส่ PIN เพื่อเปิดตัวติดตาม', unlock:'เปิด', resetPin:'รีเซ็ต PIN', appEyebrow:'ตัวติดตามการลดส่วนตัว', disclaimerTitle:'สำคัญ', disclaimerText:'แอปนี้เป็นไดอารี่บันทึก ไม่ใช่แผนการรักษาทางการแพทย์ หากมีอาการรุนแรงควรพบแพทย์', ok:'ตกลง', tabToday:'วัน', tabAnalytics:'กราฟ', tabPlan:'แผน', tabJournal:'บันทึก', tabData:'ข้อมูล', selectedDate:'วันที่เลือก', todayTotal:'รวมวันนี้', planStatus:'สถานะแผน', quickAdd:'เพิ่มเร็ว', editButtons:'ปุ่ม', add:'เพิ่ม', notePlaceholder:'บันทึก: เหตุผล / สถานที่', entries:'รายการวันนี้', clearDay:'ล้างวัน', symptoms:'อาการ', save:'บันทึก', sleep:'นอน', craving:'อยาก', energy:'พลังงาน', mood:'อารมณ์', journalPlaceholder:'บันทึกสั้นๆ', avg7:'เฉลี่ย 7 วัน', trend:'แนวโน้ม', streak:'ต่อเนื่อง', volumeChart:'ปริมาณและเป้าหมาย', calendar:'ปฏิทินความคืบหน้า', symptomChart:'อาการ / ความอยาก', taperPlan:'แผนลด', dailyTarget:'เป้าหมายต่อวัน, ml', baseline:'จุดเริ่มต้น, ml/วัน', weeklyReduction:'ลดต่อสัปดาห์, %', startDate:'วันที่เริ่ม', savePlan:'บันทึกแผน', forecast:'คาดการณ์', achievements:'ความสำเร็จ', history:'ประวัติ', backup:'สำรองข้อมูล', exportJson:'ส่งออก JSON', exportCsv:'ส่งออก CSV', copySummary:'สรุป', importJson:'นำเข้า JSON', dangerZone:'โซนอันตราย', wipeData:'ลบข้อมูลทั้งหมด', settings:'ตั้งค่า', language:'ภาษา', pinCode:'รหัส PIN', reminderTime:'เตือน', quickAmounts:'ปุ่มเร็ว, ml', saveSettings:'บันทึกตั้งค่า', noEntries:'ไม่มีรายการ', edit:'แก้', delete:'ลบ', onTrack:'ตามแผน', overPlan:'เกินแผน', underPlan:'ต่ำกว่าเป้า', yesterday:'เมื่อวาน', today:'วันนี้', tomorrow:'พรุ่งนี้', saved:'บันทึกแล้ว', exported:'ส่งออกแล้ว', imported:'นำเข้าแล้ว', copied:'คัดลอกแล้ว', invalid:'ค่าไม่ถูกต้อง', confirmClear:'ล้างรายการวันที่เลือก?', confirmWipe:'ลบข้อมูลทั้งหมดถาวร?', pinWrong:'PIN ไม่ถูกต้อง', pinReset:'รีเซ็ต PIN แล้ว', reduced:'ลดลง', increased:'เพิ่มขึ้น', stable:'คงที่', days:'วัน', noData:'ยังไม่มีข้อมูล', planTarget:'เป้า', actual:'จริง'
  }
};

const defaultState = () => ({
  version: 2,
  selectedDate: todayISO(),
  entries: {},
  symptoms: {},
  settings: {
    language: 'ru', theme: 'dark', quickAmounts: [50,100,150,200,250,300], pin: '', reminderTime: '', disclaimerHidden: false
  },
  plan: { dailyTarget: 1000, baseline: 1000, weeklyReduction: 10, startDate: todayISO() }
});

let state = loadState();
let unlocked = !state.settings.pin;

function loadState(){
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      return mergeDeep(defaultState(), parsed);
    }
    const migrated = migrateLegacyV1();
    if(migrated){
      localStorage.setItem(STORE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return defaultState();
  } catch { return defaultState(); }
}
function migrateLegacyV1(){
  try {
    const oldEntriesRaw = localStorage.getItem('kratomLog.entries.v1');
    const oldSettingsRaw = localStorage.getItem('kratomLog.settings.v1');
    if(!oldEntriesRaw && !oldSettingsRaw) return null;
    const next = defaultState();
    const oldEntries = oldEntriesRaw ? JSON.parse(oldEntriesRaw) : [];
    const oldSettings = oldSettingsRaw ? JSON.parse(oldSettingsRaw) : {};
    if(Array.isArray(oldEntries)){
      oldEntries.forEach(item => {
        const dt = item.ts ? new Date(item.ts) : new Date();
        if(Number.isNaN(dt.getTime())) return;
        const date = dt.toISOString().slice(0,10);
        const time = `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
        if(!next.entries[date]) next.entries[date] = [];
        next.entries[date].push({
          id: item.id || `${item.ts || Date.now()}${Math.random()}`,
          amount: Number(item.amount) || 0,
          time,
          note: item.note || '',
          createdAt: item.ts ? new Date(item.ts).toISOString() : new Date().toISOString(),
          migratedFrom: 'v1'
        });
      });
      Object.keys(next.entries).forEach(date => next.entries[date].sort((a,b)=>(a.time||'').localeCompare(b.time||'')));
    }
    if(oldSettings && typeof oldSettings === 'object'){
      if(Array.isArray(oldSettings.quickAmounts)) next.settings.quickAmounts = oldSettings.quickAmounts;
      if(Number(oldSettings.dailyTarget)) { next.plan.dailyTarget = Number(oldSettings.dailyTarget); next.plan.baseline = Number(oldSettings.dailyTarget); }
      if(Number(oldSettings.warningLimit)) next.plan.baseline = Number(oldSettings.warningLimit);
    }
    next.migratedAt = new Date().toISOString();
    return next;
  } catch { return null; }
}
function mergeDeep(target, source){
  for(const k of Object.keys(source || {})){
    if(source[k] && typeof source[k] === 'object' && !Array.isArray(source[k])) target[k] = mergeDeep(target[k] || {}, source[k]);
    else target[k] = source[k];
  }
  return target;
}
function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function t(key){ return (I18N[state.settings.language] || I18N.ru)[key] || I18N.ru[key] || key; }
function $(id){ return document.getElementById(id); }
function toast(msg){ const el=$('toast'); el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),1800); }
function dayEntries(date = state.selectedDate){ return state.entries[date] || []; }
function daySymptoms(date = state.selectedDate){ return state.symptoms[date] || { sleep:5, craving:5, energy:5, mood:5, note:'' }; }
function dayTotal(date = state.selectedDate){ return dayEntries(date).reduce((s,e)=>s + Number(e.amount || 0),0); }
function targetForDate(date){
  const p = state.plan; const start = new Date(`${p.startDate}T12:00:00`); const cur = new Date(`${date}T12:00:00`);
  const weeks = Math.max(0, Math.floor((cur - start) / (7*864e5)));
  const reduction = Math.pow(1 - clamp(Number(p.weeklyReduction || 0),0,90) / 100, weeks);
  return Math.max(0, Math.round(Number(p.baseline || p.dailyTarget || 0) * reduction));
}
function datesBack(days){ const out=[]; for(let i=days-1;i>=0;i--) out.push(addDays(todayISO(), -i)); return out; }

function init(){
  document.documentElement.dataset.theme = state.settings.theme;
  if(!unlocked) $('lockScreen').classList.remove('hidden');
  bindEvents();
  applyI18n();
  renderAll();
  registerSW();
}

function bindEvents(){
  document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  $('datePicker').addEventListener('change', e => { state.selectedDate = e.target.value || todayISO(); save(); renderAll(); });
  $('prevDay').addEventListener('click', () => { state.selectedDate = addDays(state.selectedDate, -1); save(); renderAll(); });
  $('nextDay').addEventListener('click', () => { state.selectedDate = addDays(state.selectedDate, 1); save(); renderAll(); });
  $('addForm').addEventListener('submit', addEntry);
  $('clearDay').addEventListener('click', clearDay);
  $('saveSymptoms').addEventListener('click', saveSymptoms);
  $('rangeSelect').addEventListener('change', renderAnalytics);
  $('savePlan').addEventListener('click', savePlan);
  $('openSettings').addEventListener('click', openSettings);
  $('saveSettings').addEventListener('click', saveSettings);
  $('themeToggle').addEventListener('click', toggleTheme);
  $('hideDisclaimer').addEventListener('click', () => { state.settings.disclaimerHidden = true; save(); renderDisclaimer(); });
  $('exportJson').addEventListener('click', exportJson);
  $('exportCsv').addEventListener('click', exportCsv);
  $('copySummary').addEventListener('click', copySummary);
  $('importFile').addEventListener('change', importJson);
  $('wipeData').addEventListener('click', wipeData);
  $('editButtons').addEventListener('click', openSettings);
  $('unlockBtn').addEventListener('click', unlock);
  $('pinInput').addEventListener('keydown', e => { if(e.key === 'Enter') unlock(); });
  $('resetPinBtn').addEventListener('click', () => { if(confirm('Reset PIN?')) { state.settings.pin=''; save(); unlocked=true; $('lockScreen').classList.add('hidden'); toast(t('pinReset')); } });
  window.addEventListener('resize', () => renderAnalytics());
}
function switchTab(tab){ document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab)); document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active', p.id===tab)); if(tab==='analytics') setTimeout(renderAnalytics, 40); if(tab==='journal') renderHistory(); if(tab==='plan') renderPlan(); }
function applyI18n(){
  document.documentElement.lang = state.settings.language;
  document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => el.placeholder = t(el.dataset.i18nPlaceholder));
}
function renderAll(){ renderDisclaimer(); renderToday(); renderAnalytics(); renderPlan(); renderHistory(); }
function renderDisclaimer(){ $('disclaimerBox').classList.toggle('hidden', !!state.settings.disclaimerHidden); }

function renderToday(){
  const date = state.selectedDate;
  $('datePicker').value = date;
  const rel = date === todayISO() ? t('today') : date === addDays(todayISO(), -1) ? t('yesterday') : date === addDays(todayISO(), 1) ? t('tomorrow') : '';
  $('dateLabel').textContent = rel ? `${rel} · ${date}` : date;
  const total = dayTotal(date), target = targetForDate(date) || Number(state.plan.dailyTarget || 0);
  $('dayTotal').textContent = fmt.format(total);
  $('targetText').textContent = `${fmt.format(total)} / ${fmt.format(target)} мл`;
  $('targetProgress').style.width = `${target ? clamp(total / target * 100,0,140) : 0}%`;
  const diff = target ? Math.round((total - target) / target * 100) : 0;
  $('planBadge').textContent = !target ? '—' : diff <= 0 ? t('onTrack') : t('overPlan');
  $('planHint').textContent = target ? `${diff > 0 ? '+' : ''}${diff}% · ${t('planTarget')} ${fmt.format(target)} мл` : '—';
  renderQuickButtons(); renderEntries(); renderSymptomsForm();
}
function renderQuickButtons(){
  $('quickButtons').innerHTML = '';
  state.settings.quickAmounts.forEach(v => {
    const btn = document.createElement('button'); btn.type='button'; btn.textContent = `+${v} мл`;
    btn.addEventListener('click', () => addAmount(v)); $('quickButtons').appendChild(btn);
  });
}
function addEntry(e){ e.preventDefault(); const amount = Number($('amountInput').value); if(!amount || amount<1 || amount>10000) return toast(t('invalid')); addAmount(amount, $('timeInput').value, $('noteInput').value.trim()); $('amountInput').value=''; $('noteInput').value=''; }
function addAmount(amount, time = '', note = ''){
  const date = state.selectedDate; const entry = { id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}${Math.random()}`, amount:Number(amount), time: time || new Date().toTimeString().slice(0,5), note, createdAt:new Date().toISOString() };
  state.entries[date] = [...dayEntries(date), entry].sort((a,b)=>(a.time||'').localeCompare(b.time||'')); save(); renderAll(); toast(t('saved'));
}
function renderEntries(){
  const list = $('entriesList'); list.innerHTML=''; const entries = dayEntries();
  if(!entries.length){ list.innerHTML = `<div class="empty">${t('noEntries')}</div>`; return; }
  entries.forEach(entry => {
    const row = document.createElement('div'); row.className='entry';
    row.innerHTML = `<div><strong>${fmt.format(entry.amount)} мл</strong><small>${entry.time || '—'}</small></div><div><small>${escapeHtml(entry.note || '')}</small></div><div class="entry-actions"><button data-edit>${t('edit')}</button><button data-del>${t('delete')}</button></div>`;
    row.querySelector('[data-edit]').addEventListener('click', () => editEntry(entry.id));
    row.querySelector('[data-del]').addEventListener('click', () => deleteEntry(entry.id));
    list.appendChild(row);
  });
}
function editEntry(id){
  const entries = dayEntries(); const entry = entries.find(e=>e.id===id); if(!entry) return;
  const value = prompt('ml', entry.amount); if(value === null) return;
  const amount = Number(value); if(!amount || amount<1 || amount>10000) return toast(t('invalid'));
  const note = prompt('note', entry.note || '');
  entry.amount = amount; entry.note = note || ''; save(); renderAll(); toast(t('saved'));
}
function deleteEntry(id){ state.entries[state.selectedDate] = dayEntries().filter(e=>e.id!==id); save(); renderAll(); }
function clearDay(){ if(!confirm(t('confirmClear'))) return; delete state.entries[state.selectedDate]; save(); renderAll(); }
function renderSymptomsForm(){ const s = daySymptoms(); $('sleepScore').value=s.sleep; $('cravingScore').value=s.craving; $('energyScore').value=s.energy; $('moodScore').value=s.mood; $('journalNote').value=s.note || ''; }
function saveSymptoms(){ state.symptoms[state.selectedDate] = { sleep:Number($('sleepScore').value), craving:Number($('cravingScore').value), energy:Number($('energyScore').value), mood:Number($('moodScore').value), note:$('journalNote').value.trim() }; save(); renderAll(); toast(t('saved')); }

function renderAnalytics(){
  const days = Number($('rangeSelect')?.value || 30); const dates = datesBack(days); const totals = dates.map(dayTotal); const targets = dates.map(targetForDate);
  const avg7 = average(datesBack(7).map(dayTotal)); $('avg7').textContent = `${fmt.format(Math.round(avg7))} мл`;
  const prev = average(datesBack(14).slice(0,7).map(dayTotal)); const now = average(datesBack(7).map(dayTotal)); const d = prev ? Math.round((now-prev)/prev*100) : 0;
  $('trendText').textContent = !prev ? '—' : `${d < -2 ? t('reduced') : d > 2 ? t('increased') : t('stable')} ${d>0?'+':''}${d}%`;
  $('streakText').textContent = `${calcStreak()} ${t('days')}`;
  drawVolumeChart($('volumeChart'), dates, totals, targets); drawSymptomChart($('symptomChart'), dates); renderHeatmap();
}
function average(arr){ return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }
function calcStreak(){ let n=0; for(let d=todayISO();;d=addDays(d,-1)){ const target=targetForDate(d); const total=dayTotal(d); if(total>0 && (!target || total<=target)) n++; else break; } return n; }
function drawVolumeChart(canvas, dates, totals, targets){
  if(!canvas) return; const ctx = prepCanvas(canvas); const w=canvas.width, h=canvas.height; ctx.clearRect(0,0,w,h);
  const pad=42; const max=Math.max(100,...totals,...targets)*1.14; drawGrid(ctx,w,h,pad,max);
  const bw=(w-pad*2)/totals.length*0.66; totals.forEach((v,i)=>{ const x=pad+i*((w-pad*2)/totals.length)+bw*.25; const y=h-pad-(v/max)*(h-pad*1.6); const color=v<=targets[i]?'rgba(34,197,94,.72)':'rgba(239,68,68,.72)'; ctx.fillStyle=color; roundRect(ctx,x,y,bw,h-pad-y,8); ctx.fill(); });
  ctx.strokeStyle='rgba(56,189,248,.95)'; ctx.lineWidth=3; ctx.beginPath(); targets.forEach((v,i)=>{ const x=pad+i*((w-pad*2)/totals.length)+((w-pad*2)/totals.length)/2; const y=h-pad-(v/max)*(h-pad*1.6); i?ctx.lineTo(x,y):ctx.moveTo(x,y); }); ctx.stroke();
  labelChart(ctx,w,h,pad,dates);
}
function drawSymptomChart(canvas, dates){
  if(!canvas) return; const ctx = prepCanvas(canvas); const w=canvas.width,h=canvas.height,pad=38; ctx.clearRect(0,0,w,h); drawGrid(ctx,w,h,pad,10);
  const series = [{key:'craving', name:t('craving'), color:'rgba(239,68,68,.9)'},{key:'sleep', name:t('sleep'), color:'rgba(56,189,248,.9)'},{key:'mood', name:t('mood'), color:'rgba(34,197,94,.9)'}];
  series.forEach(s=>{ ctx.strokeStyle=s.color; ctx.lineWidth=2.5; ctx.beginPath(); dates.forEach((d,i)=>{ const v=(state.symptoms[d]||{})[s.key] ?? 0; const x=pad+i*((w-pad*2)/Math.max(1,dates.length-1)); const y=h-pad-(v/10)*(h-pad*1.6); i?ctx.lineTo(x,y):ctx.moveTo(x,y); }); ctx.stroke(); });
}
function prepCanvas(canvas){ const rect=canvas.getBoundingClientRect(); canvas.width=Math.max(320,Math.floor(rect.width)); canvas.height=Number(canvas.getAttribute('height'))||240; return canvas.getContext('2d'); }
function drawGrid(ctx,w,h,pad,max){ ctx.strokeStyle='rgba(148,163,184,.18)'; ctx.lineWidth=1; ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--muted'); ctx.font='12px system-ui'; for(let i=0;i<=4;i++){ const y=pad/2+i*(h-pad*1.5)/4; ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(w-pad,y); ctx.stroke(); const v=Math.round(max-(max*i/4)); ctx.fillText(String(v),8,y+4); } }
function labelChart(ctx,w,h,pad,dates){ ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--muted'); ctx.font='12px system-ui'; const first=dates[0]?.slice(5), last=dates[dates.length-1]?.slice(5); ctx.fillText(first||'',pad,h-12); ctx.fillText(last||'',w-pad-36,h-12); }
function roundRect(ctx,x,y,w,h,r){ const rr=Math.min(r,w/2,h/2); ctx.beginPath(); ctx.moveTo(x+rr,y); ctx.arcTo(x+w,y,x+w,y+h,rr); ctx.arcTo(x+w,y+h,x,y+h,rr); ctx.arcTo(x,y+h,x,y,rr); ctx.arcTo(x,y,x+w,y,rr); ctx.closePath(); }
function renderHeatmap(){ const el=$('heatmap'); if(!el) return; el.innerHTML=''; datesBack(70).forEach(d=>{ const target=targetForDate(d), total=dayTotal(d); let level=0; if(total>0){ level = !target || total<=target*.9 ? 1 : total<=target ? 2 : 3; } const cell=document.createElement('div'); cell.className='heatday'; cell.dataset.level=level; cell.title=`${d}: ${total} ml / ${target} ml`; cell.addEventListener('click',()=>{state.selectedDate=d; save(); switchTab('today'); renderAll();}); el.appendChild(cell); }); }

function savePlan(){ const p=state.plan; p.dailyTarget=Number($('dailyTarget').value)||0; p.baseline=Number($('baseline').value)||p.dailyTarget; p.weeklyReduction=clamp(Number($('weeklyReduction').value)||0,0,50); p.startDate=$('startDate').value||todayISO(); save(); renderAll(); toast(t('saved')); }
function renderPlan(){ const p=state.plan; $('dailyTarget').value=p.dailyTarget; $('baseline').value=p.baseline; $('weeklyReduction').value=p.weeklyReduction; $('startDate').value=p.startDate; renderForecast(); renderAchievements(); }
function renderForecast(){ const el=$('forecastList'); el.innerHTML=''; for(let w=0;w<8;w++){ const d=addDays(state.plan.startDate,w*7); const row=document.createElement('div'); row.className='forecast-row'; row.innerHTML=`<div><strong>${fmt.format(targetForDate(d))} мл</strong><small>week ${w+1}</small></div><div><small>${d}</small></div><div></div>`; el.appendChild(row); } }
function renderAchievements(){ const totalEntries = Object.values(state.entries).flat().length; const trackedDays = Object.keys(state.entries).filter(d=>dayTotal(d)>0).length; const streak=calcStreak(); const defs=[['first','Первый день', trackedDays>=1],['week','7 дней учета', trackedDays>=7],['streak','3 дня в плане', streak>=3],['edit','Можно править вчера', true],['backup','Бэкап доступен', true],['plan','План снижения', !!state.plan.weeklyReduction],['entries','50 записей', totalEntries>=50],['calm','Тяга ≤ 4', Object.keys(state.symptoms).some(d=>(state.symptoms[d].craving||10)<=4)]]; $('achievements').innerHTML = defs.map(([id,title,ok])=>`<div class="badge ${ok?'':'locked'}"><strong>${ok?'✓':'○'} ${title}</strong><small>${ok?t('saved'):'locked'}</small></div>`).join(''); }

function renderHistory(){ const el=$('historyList'); el.innerHTML=''; const dates = [...new Set([...Object.keys(state.entries),...Object.keys(state.symptoms)])].sort().reverse().slice(0,120); if(!dates.length){ el.innerHTML=`<div class="empty">${t('noData')}</div>`; return; } dates.forEach(d=>{ const total=dayTotal(d), target=targetForDate(d), s=state.symptoms[d]; const row=document.createElement('div'); row.className='history-row'; row.innerHTML=`<div><strong>${fmt.format(total)} мл</strong><small>${d}</small></div><div><small>${t('planTarget')}: ${fmt.format(target)} мл${s?.note?' · '+escapeHtml(s.note):''}</small></div><button class="ghost">${t('edit')}</button>`; row.querySelector('button').addEventListener('click',()=>{state.selectedDate=d; save(); switchTab('today'); renderAll();}); el.appendChild(row); }); }

function openSettings(){ $('language').value=state.settings.language; $('newPin').value=''; $('reminderTime').value=state.settings.reminderTime || ''; $('quickAmounts').value=state.settings.quickAmounts.join(','); $('settingsDialog').showModal(); }
function saveSettings(e){ e.preventDefault(); state.settings.language=$('language').value; const pin=$('newPin').value.trim(); if(pin) state.settings.pin=pin; state.settings.reminderTime=$('reminderTime').value; const amounts=$('quickAmounts').value.split(',').map(x=>Number(x.trim())).filter(x=>x>0&&x<=10000).slice(0,12); if(amounts.length) state.settings.quickAmounts=amounts; save(); applyI18n(); renderAll(); $('settingsDialog').close(); toast(t('saved')); }
function toggleTheme(){ state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme=state.settings.theme; save(); renderAnalytics(); }
function unlock(){ if($('pinInput').value === state.settings.pin){ unlocked=true; $('lockScreen').classList.add('hidden'); $('pinInput').value=''; } else toast(t('pinWrong')); }

function exportJson(){ downloadFile(`stopkratom-backup-${todayISO()}.json`, JSON.stringify(state,null,2), 'application/json'); toast(t('exported')); }
function exportCsv(){ const rows=[['date','time','amount_ml','note','day_total','target_ml','sleep','craving','energy','mood','journal_note']]; Object.keys(state.entries).sort().forEach(date=>{ const s=state.symptoms[date]||{}; dayEntries(date).forEach(e=>rows.push([date,e.time,e.amount,e.note||'',dayTotal(date),targetForDate(date),s.sleep??'',s.craving??'',s.energy??'',s.mood??'',s.note||''])); }); const csv=rows.map(r=>r.map(cell=>`"${String(cell).replaceAll('"','""')}"`).join(',')).join('\n'); downloadFile(`stopkratom-data-${todayISO()}.csv`, csv, 'text/csv'); toast(t('exported')); }
function downloadFile(name, content, type){ const blob=new Blob([content],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
async function copySummary(){ const msg=`StopKratom summary\nToday: ${dayTotal(todayISO())} ml\n7-day avg: ${Math.round(average(datesBack(7).map(dayTotal)))} ml\nStreak: ${calcStreak()} days`; await navigator.clipboard.writeText(msg).catch(()=>{}); toast(t('copied')); }
function importJson(e){ const file=e.target.files[0]; if(!file) return; const reader=new FileReader(); reader.onload=()=>{ try{ const next=mergeDeep(defaultState(), JSON.parse(reader.result)); state=next; save(); applyI18n(); renderAll(); toast(t('imported')); }catch{ toast(t('invalid')); } }; reader.readAsText(file); e.target.value=''; }
function wipeData(){ if(!confirm(t('confirmWipe'))) return; state=defaultState(); save(); location.reload(); }
function escapeHtml(s){ return String(s).replace(/[&<>"]/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m])); }
async function registerSW(){ if('serviceWorker' in navigator){ try{ await navigator.serviceWorker.register('./sw.js'); }catch{} } }

init();
