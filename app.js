const STORAGE_KEY = 'kratomLog.entries.v1';
const SETTINGS_KEY = 'kratomLog.settings.v1';

const defaultSettings = {
  dailyTarget: 1000,
  warningLimit: 1200,
  quickAmounts: [50, 100, 150, 200, 250, 300]
};

let entries = loadEntries();
let settings = loadSettings();

const $ = (id) => document.getElementById(id);

function pad(n) { return String(n).padStart(2, '0'); }
function ymd(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function humanDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}
function nowTime() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function dateFromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function addDays(date, delta) {
  const next = new Date(date);
  next.setDate(next.getDate() + delta);
  return next;
}
function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : { ...defaultSettings };
  } catch {
    return { ...defaultSettings };
  }
}
function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function entriesForDay(dayKey) {
  return entries.filter(e => ymd(new Date(e.ts)) === dayKey).sort((a,b) => a.ts - b.ts);
}
function totalForDay(dayKey) {
  return entriesForDay(dayKey).reduce((sum, e) => sum + Number(e.amount || 0), 0);
}
function totalsForRange(days) {
  const today = dateFromKey(ymd());
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = ymd(addDays(today, -i));
    result.push({ key, total: totalForDay(key) });
  }
  return result;
}
function average(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v.total, 0) / arr.length;
}

function addEntry(amount, time = nowTime(), note = '') {
  const ml = Number(amount);
  if (!Number.isFinite(ml) || ml <= 0) return;
  const today = ymd();
  const ts = new Date(`${today}T${time || nowTime()}:00`).getTime();
  entries.push({ id: uid(), amount: Math.round(ml), ts, note: note.trim() });
  saveEntries();
  render();
}
function deleteEntry(id) {
  entries = entries.filter(e => e.id !== id);
  saveEntries();
  render();
}

function renderQuickButtons() {
  const grid = $('quickGrid');
  grid.innerHTML = '';
  settings.quickAmounts.forEach(amount => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = `+${amount}`;
    btn.dataset.amount = amount;
    btn.addEventListener('click', () => addEntry(amount));
    grid.appendChild(btn);
  });
}

function renderToday() {
  const today = ymd();
  const total = totalForDay(today);
  const target = Number(settings.dailyTarget || 0);
  const warning = Number(settings.warningLimit || 0);
  const percent = target > 0 ? Math.round((total / target) * 100) : 0;
  const capped = Math.min(percent, 140);

  $('todayLabel').textContent = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long', day: '2-digit', month: 'long'
  });
  $('todayTotal').textContent = total;
  $('targetView').textContent = target;
  $('progressFill').style.width = `${Math.min(capped, 100)}%`;
  $('progressPercent').textContent = `${percent}%`;

  const remaining = target - total;
  const text = $('remainingText');
  text.className = '';
  if (target <= 0) {
    text.textContent = 'Цель не задана';
  } else if (remaining > 0) {
    text.textContent = `Осталось ${remaining} мл до цели`;
  } else {
    text.textContent = `Выше цели на ${Math.abs(remaining)} мл`;
    text.classList.add('over');
  }
  if (warning > 0 && total >= warning) text.classList.add('warning');
}

function renderStats() {
  const last7 = totalsForRange(7);
  const prev7 = [];
  const today = dateFromKey(ymd());
  for (let i = 14; i >= 8; i--) {
    const key = ymd(addDays(today, -i));
    prev7.push({ key, total: totalForDay(key) });
  }
  const avgLast = Math.round(average(last7));
  const avgPrev = Math.round(average(prev7));
  const diff = avgLast - avgPrev;
  const under = last7.filter(d => d.total > 0 && d.total <= settings.dailyTarget).length;

  $('avg7').textContent = `${avgLast} мл`;
  $('trend7').textContent = `${diff > 0 ? '+' : ''}${diff} мл`;
  $('trend7').className = diff > 0 ? 'over' : diff < 0 ? '' : '';
  $('underTargetDays').textContent = `${under}/7`;
}

function renderEntries() {
  const wrap = $('todayEntries');
  const list = entriesForDay(ymd()).reverse();
  wrap.innerHTML = '';
  if (!list.length) {
    wrap.innerHTML = '<div class="empty">Сегодня записей пока нет.</div>';
    return;
  }
  list.forEach(e => {
    const row = document.createElement('div');
    row.className = 'entry-row';
    const time = new Date(e.ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    row.innerHTML = `
      <strong>${time}</strong>
      <div><strong>${e.amount} мл</strong><p>${escapeHtml(e.note || 'без заметки')}</p></div>
      <button class="delete-btn" type="button" aria-label="Удалить">×</button>
    `;
    row.querySelector('button').addEventListener('click', () => deleteEntry(e.id));
    wrap.appendChild(row);
  });
}

function renderDays() {
  const wrap = $('daysList');
  const data = totalsForRange(30).reverse();
  wrap.innerHTML = '';
  data.forEach(d => {
    const row = document.createElement('div');
    row.className = 'day-row';
    const status = d.total === 0 ? 'нет записей' : d.total <= settings.dailyTarget ? 'ниже/в цели' : `выше цели на ${d.total - settings.dailyTarget} мл`;
    row.innerHTML = `
      <strong>${humanDate(d.key)}</strong>
      <div><strong>${d.total} мл</strong><p>${status}</p></div>
      <span>${d.total > settings.dailyTarget ? '▲' : d.total > 0 ? '✓' : '—'}</span>
    `;
    wrap.appendChild(row);
  });
}

function drawChart() {
  const canvas = $('mainChart');
  const ctx = canvas.getContext('2d');
  const days = Number($('rangeSelect').value || 30);
  const data = totalsForRange(days);
  const target = Number(settings.dailyTarget || 0);
  const maxVal = Math.max(100, target, ...data.map(d => d.total)) * 1.18;
  const w = canvas.width;
  const h = canvas.height;
  const padL = 48;
  const padR = 18;
  const padT = 24;
  const padB = 48;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255,255,255,0.09)';
  ctx.lineWidth = 1;
  ctx.fillStyle = 'rgba(245,247,251,0.65)';
  ctx.font = '20px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  for (let i = 0; i <= 4; i++) {
    const y = padT + (chartH / 4) * i;
    const val = Math.round(maxVal - (maxVal / 4) * i);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(w - padR, y);
    ctx.stroke();
    ctx.fillText(String(val), padL - 8, y);
  }

  if (target > 0) {
    const yTarget = padT + chartH - (target / maxVal) * chartH;
    ctx.strokeStyle = 'rgba(155,231,193,0.8)';
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(padL, yTarget);
    ctx.lineTo(w - padR, yTarget);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const gap = Math.max(3, Math.min(8, chartW / data.length * 0.16));
  const barW = Math.max(4, chartW / data.length - gap);
  data.forEach((d, i) => {
    const x = padL + i * (chartW / data.length) + gap / 2;
    const barH = d.total > 0 ? Math.max(3, (d.total / maxVal) * chartH) : 0;
    const y = padT + chartH - barH;
    const grad = ctx.createLinearGradient(0, y, 0, padT + chartH);
    if (d.total > target && target > 0) {
      grad.addColorStop(0, '#ff9f80');
      grad.addColorStop(1, '#ff6b6b');
    } else {
      grad.addColorStop(0, '#9be7c1');
      grad.addColorStop(1, '#56c596');
    }
    ctx.fillStyle = grad;
    roundRect(ctx, x, y, barW, barH, 7);
    ctx.fill();
  });

  ctx.fillStyle = 'rgba(245,247,251,0.68)';
  ctx.font = '18px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const labelEvery = days <= 14 ? 2 : days <= 30 ? 5 : 15;
  data.forEach((d, i) => {
    if (i === 0 || i === data.length - 1 || i % labelEvery === 0) {
      const x = padL + i * (chartW / data.length) + (chartW / data.length) / 2;
      ctx.fillText(humanDate(d.key), x, padT + chartH + 14);
    }
  });
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function escapeHtml(str) {
  return String(str).replace(/[&<>'"]/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[c]);
}

function renderSettings() {
  $('targetInput').value = settings.dailyTarget;
  $('warningInput').value = settings.warningLimit;
  $('quickInput').value = settings.quickAmounts.join(',');
}

function exportJson() {
  const payload = {
    app: 'Kratom Log',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    entries
  };
  downloadFile(`kratom-log-backup-${ymd()}.json`, JSON.stringify(payload, null, 2), 'application/json');
}
function exportCsv() {
  const data = totalsForRange(365).filter(d => d.total > 0);
  const lines = ['date,total_ml'];
  data.forEach(d => lines.push(`${d.key},${d.total}`));
  downloadFile(`kratom-log-days-${ymd()}.csv`, lines.join('\n'), 'text/csv;charset=utf-8');
}
function downloadFile(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
async function importJson(file) {
  const text = await file.text();
  const payload = JSON.parse(text);
  if (!Array.isArray(payload.entries)) throw new Error('Некорректный файл: нет entries');
  entries = payload.entries;
  settings = { ...defaultSettings, ...(payload.settings || {}) };
  saveEntries();
  saveSettings();
  render();
}

function bindEvents() {
  $('timeInput').value = nowTime();
  $('entryForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    addEntry($('amountInput').value, $('timeInput').value, $('noteInput').value);
    $('amountInput').value = '';
    $('noteInput').value = '';
    $('timeInput').value = nowTime();
    $('amountInput').focus();
  });
  $('rangeSelect').addEventListener('change', drawChart);
  $('saveSettingsBtn').addEventListener('click', () => {
    const quick = $('quickInput').value.split(',').map(x => Number(x.trim())).filter(x => Number.isFinite(x) && x > 0);
    settings.dailyTarget = Math.max(0, Number($('targetInput').value || 0));
    settings.warningLimit = Math.max(0, Number($('warningInput').value || 0));
    settings.quickAmounts = quick.length ? quick.slice(0, 8) : defaultSettings.quickAmounts;
    saveSettings();
    render();
  });
  $('clearTodayBtn').addEventListener('click', () => {
    if (!confirm('Удалить все записи за сегодня?')) return;
    const today = ymd();
    entries = entries.filter(e => ymd(new Date(e.ts)) !== today);
    saveEntries();
    render();
  });
  $('exportJsonBtn').addEventListener('click', exportJson);
  $('exportCsvBtn').addEventListener('click', exportCsv);
  $('importJsonInput').addEventListener('change', async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      await importJson(file);
      alert('Импорт выполнен');
    } catch (err) {
      alert(err.message || 'Ошибка импорта');
    } finally {
      ev.target.value = '';
    }
  });
  $('installHintBtn').addEventListener('click', () => $('installDialog').showModal());
  $('closeInstallDialog').addEventListener('click', () => $('installDialog').close());
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

function render() {
  renderQuickButtons();
  renderToday();
  renderStats();
  renderEntries();
  renderDays();
  renderSettings();
  drawChart();
}

bindEvents();
registerServiceWorker();
render();
