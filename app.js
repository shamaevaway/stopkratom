'use strict';

const APP_VERSION = '3.0.0-production';
const SCHEMA_VERSION = 3;
const STORE_KEY = 'stopkratom.v3.production';
const LEGACY_KEYS = ['stopkratom.ultra.v2','stopkratom.production.v1','kratomLog.entries.v1'];

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));
const now = () => new Date();
const pad = n => String(n).padStart(2,'0');
const toKey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const todayKey = () => toKey(new Date());
const parseKey = k => { const [y,m,d] = String(k).split('-').map(Number); return new Date(y, (m||1)-1, d||1); };
const addDays = (key,n) => { const d = parseKey(key); d.setDate(d.getDate()+n); return toKey(d); };
const diffDays = (a,b) => Math.round((parseKey(a)-parseKey(b))/86400000);
const timeNow = () => `${pad(now().getHours())}:${pad(now().getMinutes())}`;
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
const clamp = (v,min,max) => Math.max(min, Math.min(max, v));
const hasCrypto = () => !!(window.crypto && crypto.subtle);

const TEXT = {
  ru:{
    saved:'Сохранено', deleted:'Удалено', copied:'Скопировано', imported:'Импортировано', badFile:'Неверный файл', noData:'Нет данных', noEntries:'Записей пока нет',
    goalLine:(total,target)=>`Цель: ${target} мл · ${total<=target ? `осталось ${target-total} мл` : `выше цели на ${total-target} мл`}`,
    noGoal:total=>`Цель не задана · записано ${total} мл`, appShareText:'Личный трекер снижения кратом-чая. Данные хранятся локально на устройстве.',
    riskLow:'низкий риск', riskMid:'средний риск', riskHigh:'высокий риск', inGoal:'в цели', aboveGoal:'выше цели', noRecord:'нет записи',
    morningDone:'утро заполнено', eveningDone:'вечер заполнен', notDone:'не заполнено',
    updateReady:'Доступна новая версия приложения', resetConfirm:'Удалить все локальные данные приложения? Сделайте экспорт JSON перед сбросом.',
    pinReset:'Для сброса PIN нужно удалить все локальные данные. Введите RESET для подтверждения.', wrongPin:'Неверный PIN', pinSaved:'PIN сохранен',
    entryNew:'Новая запись', entryEdit:'Редактировать запись', mlRequired:'Введите объем в мл', dayCleared:'День очищен',
    backupDue:'Рекомендуется сделать бэкап JSON.', backupOk:'Бэкап экспортирован.',
    crisis:`Пауза 10 минут. 1) Не принимай решение на пике тяги. 2) Выпей воды. 3) 10 медленных выдохов. 4) Запиши тягу 0–10. 5) Реши после таймера.`,
    legal:{
      privacy:'<b>Privacy Policy.</b><br>Все записи, объемы, самочувствие, заметки и настройки хранятся локально в браузере пользователя через localStorage. Серверной базы данных нет. Разработчик не получает историю пользователя. Если пользователь экспортирует файл и отправляет его кому-то, он сам контролирует передачу данных.',
      terms:'<b>Terms.</b><br>Приложение предоставляется как личный дневник. Пользователь сам отвечает за корректность вводимых данных и резервные копии. Сброс браузера, очистка Safari или удаление данных сайта может удалить историю.',
      disclaimer:'<b>Disclaimer.</b><br>Приложение не является медицинским изделием, не диагностирует, не лечит и не предотвращает заболевания. Оно не назначает схему отмены и не заменяет консультацию врача или специалиста.',
      install:'<b>Install guide.</b><br>iPhone: открыть ссылку в Safari → Поделиться → На экран Домой. Android: открыть в Chrome → Install app / Добавить на главный экран.'
    }
  },
  en:{
    saved:'Saved', deleted:'Deleted', copied:'Copied', imported:'Imported', badFile:'Invalid file', noData:'No data', noEntries:'No entries yet',
    goalLine:(total,target)=>`Goal: ${target} ml · ${total<=target ? `${target-total} ml left` : `${total-target} ml over goal`}`,
    noGoal:total=>`No goal set · ${total} ml recorded`, appShareText:'Private kratom tea reduction tracker. Data stays locally on device.',
    riskLow:'low risk', riskMid:'medium risk', riskHigh:'high risk', inGoal:'in goal', aboveGoal:'over goal', noRecord:'no record',
    morningDone:'morning done', eveningDone:'evening done', notDone:'not done',
    updateReady:'New version available', resetConfirm:'Delete all local app data? Export JSON first.', pinReset:'To reset PIN you must delete local data. Type RESET to confirm.', wrongPin:'Wrong PIN', pinSaved:'PIN saved',
    entryNew:'New entry', entryEdit:'Edit entry', mlRequired:'Enter volume in ml', dayCleared:'Day cleared', backupDue:'JSON backup recommended.', backupOk:'Backup exported.',
    crisis:`Pause for 10 minutes. 1) Do not decide at craving peak. 2) Drink water. 3) Ten slow exhales. 4) Log craving 0–10. 5) Decide after the timer.`,
    legal:{privacy:'<b>Privacy Policy.</b><br>All intake, wellbeing, notes and settings stay locally in the user browser via localStorage. No server database is used.',terms:'<b>Terms.</b><br>The app is a personal journal. The user is responsible for data accuracy and backups.',disclaimer:'<b>Disclaimer.</b><br>The app is not a medical device and does not diagnose, treat or prevent disease. It does not replace medical advice.',install:'<b>Install guide.</b><br>iPhone: open in Safari → Share → Add to Home Screen. Android: open in Chrome → Install app / Add to Home Screen.'}
  },
  th:{
    saved:'บันทึกแล้ว', deleted:'ลบแล้ว', copied:'คัดลอกแล้ว', imported:'นำเข้าแล้ว', badFile:'ไฟล์ไม่ถูกต้อง', noData:'ไม่มีข้อมูล', noEntries:'ยังไม่มีรายการ',
    goalLine:(total,target)=>`เป้าหมาย: ${target} ml · ${total<=target ? `เหลือ ${target-total} ml` : `เกิน ${total-target} ml`}`,
    noGoal:total=>`ยังไม่มีเป้าหมาย · บันทึก ${total} ml`, appShareText:'แอปติดตามการลดน้ำกระท่อมแบบส่วนตัว ข้อมูลอยู่ในเครื่อง',
    riskLow:'เสี่ยงต่ำ', riskMid:'เสี่ยงกลาง', riskHigh:'เสี่ยงสูง', inGoal:'ตามเป้า', aboveGoal:'เกินเป้า', noRecord:'ไม่มีข้อมูล',
    morningDone:'เช้าเสร็จแล้ว', eveningDone:'เย็นเสร็จแล้ว', notDone:'ยังไม่ทำ', updateReady:'มีเวอร์ชันใหม่', resetConfirm:'ลบข้อมูลทั้งหมดในเครื่อง? ควร export JSON ก่อน', pinReset:'ถ้าลืม PIN ต้องลบข้อมูลทั้งหมด พิมพ์ RESET เพื่อยืนยัน', wrongPin:'PIN ไม่ถูกต้อง', pinSaved:'บันทึก PIN แล้ว',
    entryNew:'รายการใหม่', entryEdit:'แก้ไขรายการ', mlRequired:'ใส่ปริมาณ ml', dayCleared:'ล้างวันนี้แล้ว', backupDue:'ควรสำรองข้อมูล JSON', backupOk:'ส่งออกข้อมูลแล้ว',
    crisis:`หยุด 10 นาที 1) อย่าตัดสินใจตอนอยากมาก 2) ดื่มน้ำ 3) หายใจออกช้า 10 ครั้ง 4) บันทึกความอยาก 0–10 5) ค่อยตัดสินใจหลังจับเวลา`,
    legal:{privacy:'<b>Privacy Policy.</b><br>ข้อมูลทั้งหมดเก็บใน browser ของผู้ใช้ ไม่มีฐานข้อมูลเซิร์ฟเวอร์',terms:'<b>Terms.</b><br>แอปเป็นบันทึกส่วนตัว ผู้ใช้รับผิดชอบการสำรองข้อมูลเอง',disclaimer:'<b>Disclaimer.</b><br>แอปไม่ใช่อุปกรณ์แพทย์ ไม่วินิจฉัยหรือรักษา และไม่แทนคำปรึกษาแพทย์',install:'<b>Install guide.</b><br>iPhone: เปิดใน Safari → Share → Add to Home Screen. Android: Chrome → Install app'}
  }
};

const I18N = {
  ru:{gateTitle:'Tea Taper',gateLead:'Личный трекер снижения объема кратом-чая. Данные хранятся локально на устройстве.',medicalDisclaimerTitle:'Не медицинское приложение',medicalDisclaimerText:'Приложение не ставит диагнозы, не назначает лечение и не заменяет консультацию врача.',gateAge:'Мне есть 18 лет',gateTerms:'Я понимаю, что это только дневник и трекер привычки',continue:'Продолжить',onboardingTitle:'Настроим план',onboardingLead:'Укажи текущий средний объем и мягкий темп снижения. Всё можно изменить позже.',language:'Язык',avgVolume:'Сколько сейчас в среднем, мл/день',taperSpeed:'Темп снижения в неделю',firstGoal:'Минимальная цель, мл',startTracking:'Начать трекинг',pinPrompt:'Введите PIN-код',unlock:'Открыть',forgotPin:'Забыли PIN? Сбросить приложение',updateReady:'Доступна новая версия приложения',update:'Обновить',eyebrow:'PRIVATE REDUCTION TRACKER',dailyTotal:'Всего за день',ofGoal:'цели',quickAdd:'Быстро добавить',quickAddNote:'Выбери объем или открой расширенную форму',manual:'Вручную',entries:'Записи дня',entriesNote:'Нажми на запись, чтобы изменить объем, время или заметку',clearDay:'Очистить',dailyNote:'Заметка дня',notePlaceholder:'Что повлияло сегодня: сон, стресс, работа, спорт, боль, окружение...',wellbeingIndex:'Индекс самочувствия',morningEvening:'Утро / вечер',morningEveningNote:'Быстрая фиксация риска дня и итогов дня',morningCheckin:'Утренний чек-ин',eveningCheckin:'Вечерний чек-ин',relapseFlow:'Срыв / превышение',relapseDesc:'Разобрать причину без обнуления прогресса',wellbeingScales:'Самочувствие 0–10',scaleNote:'У каждой шкалы есть понятные края: 0 и 10',triggers:'Что повышало тягу',helpers:'Что помогало снизить',antiCraving:'Антисрыв-инструменты',urgeTimer:'10 минут пауза',urgeTimerDesc:'Отложить решение на пик тяги',breathing:'Дыхание 4–4–6',breathingDesc:'2 минуты стабилизации',copyCrisis:'План на момент тяги',copyCrisisDesc:'Скопировать короткий протокол',avgRecorded:'Среднее по записям',coverage:'Заполнено',streak:'Серия в цели',volumeChart:'Объем, цель, средняя',volumeChartNote:'Пустые дни серые и не считаются как успех',wellbeingChart:'Индекс самочувствия',calendar:'Календарь прогресса',insights:'Инсайты',insightsNote:'Что чаще связано с превышением и снижением',weeklyReport:'Недельный отчет',weeklyReportNote:'Можно отправить себе или специалисту',copy:'Копировать',history:'История',planTitle:'План снижения',startDate:'Дата старта',startVolume:'Стартовый объем, мл/день',weeklyReduce:'Снижение в неделю, %',floorGoal:'Минимальная цель, мл',adaptivePlan:'Адаптивный режим',plateauDays:'Плато после срыва, дней',savePlan:'Сохранить план',planPreview:'Прогноз на 8 недель',safetyTitle:'Безопасность',safetyText:'Если состояние резко ухудшается, появляются сильная слабость, спутанность, боль в груди, проблемы с дыханием или тяжелые симптомы отмены — лучше обратиться за медицинской помощью.',settings:'Настройки',theme:'Тема',quickAmounts:'Быстрые кнопки, мл',backupEvery:'Напоминать о бэкапе, дней',pinCode:'PIN-код',reminders:'Напоминания',pwaReminderNote:'В PWA на iPhone напоминания могут быть нестабильны. Для надежных пушей нужна нативная версия.',saveSettings:'Сохранить настройки',shareTitle:'Поделиться приложением',shareText:'Каждый пользователь будет вести свои локальные данные. Твоя история не передается по ссылке.',shareApp:'Поделиться ссылкой',copyLink:'Скопировать ссылку',dataBackup:'Данные и бэкап',exportJson:'Экспорт JSON',exportCsv:'Экспорт CSV',importJson:'Импорт JSON',legal:'Privacy / Terms / Disclaimer',dangerZone:'Опасная зона',dangerText:'Сброс удалит локальную историю на этом устройстве. Сделай экспорт JSON перед сбросом.',resetAll:'Удалить все данные',navHome:'День',navCheckin:'Чек-ин',navProgress:'Прогресс',navPlan:'План',navMore:'Еще',entrySheetTitle:'Запись приема',entrySheetNote:'Можно менять дату, время, объем и комментарий',date:'Дата',time:'Время',volumeMl:'Объем, мл',entryNote:'Комментарий',save:'Сохранить',delete:'Удалить',saveCheckin:'Сохранить чек-ин',relapseTitle:'Разбор превышения',relapseSub:'Один день не обнуляет прогресс. Важно понять причину.',relapseReason:'Что было главным триггером?',relapseMl:'Сколько примерно дополнительно, мл?',tomorrowPlan:'План на завтра',saveRelapse:'Сохранить без самокритики'},
  en:{gateTitle:'Tea Taper',gateLead:'Private kratom tea reduction tracker. Data stays locally on device.',medicalDisclaimerTitle:'Not a medical app',medicalDisclaimerText:'The app does not diagnose, prescribe treatment or replace medical advice.',gateAge:'I am 18 or older',gateTerms:'I understand this is only a journal and habit tracker',continue:'Continue',onboardingTitle:'Set up your plan',onboardingLead:'Enter current average volume and a gentle taper speed. You can change it later.',language:'Language',avgVolume:'Current average, ml/day',taperSpeed:'Weekly taper speed',firstGoal:'Minimum target, ml',startTracking:'Start tracking',pinPrompt:'Enter PIN',unlock:'Unlock',forgotPin:'Forgot PIN? Reset app',updateReady:'New app version available',update:'Update',eyebrow:'PRIVATE REDUCTION TRACKER',dailyTotal:'Daily total',ofGoal:'of goal',quickAdd:'Quick add',quickAddNote:'Pick an amount or open the detailed form',manual:'Manual',entries:'Day entries',entriesNote:'Tap an entry to edit volume, time or note',clearDay:'Clear',dailyNote:'Daily note',notePlaceholder:'What affected today: sleep, stress, work, exercise, pain...',wellbeingIndex:'Wellbeing index',morningEvening:'Morning / evening',morningEveningNote:'Quickly log day risk and day summary',morningCheckin:'Morning check-in',eveningCheckin:'Evening check-in',relapseFlow:'Over-goal / relapse',relapseDesc:'Review cause without resetting progress',wellbeingScales:'Wellbeing 0–10',scaleNote:'Every scale has clear 0 and 10 anchors',triggers:'What increased craving',helpers:'What helped reduce',antiCraving:'Craving tools',urgeTimer:'10-minute pause',urgeTimerDesc:'Delay the decision at craving peak',breathing:'Breathing 4–4–6',breathingDesc:'2-minute reset',copyCrisis:'Craving plan',copyCrisisDesc:'Copy short protocol',avgRecorded:'Average recorded',coverage:'Coverage',streak:'In-goal streak',volumeChart:'Volume, goal, average',volumeChartNote:'Empty days are gray and not counted as success',wellbeingChart:'Wellbeing index',calendar:'Progress calendar',insights:'Insights',insightsNote:'What is linked with over-goal and reduction',weeklyReport:'Weekly report',weeklyReportNote:'Can be sent to yourself or specialist',copy:'Copy',history:'History',planTitle:'Taper plan',startDate:'Start date',startVolume:'Start volume, ml/day',weeklyReduce:'Weekly reduction, %',floorGoal:'Minimum target, ml',adaptivePlan:'Adaptive mode',plateauDays:'Plateau after relapse, days',savePlan:'Save plan',planPreview:'8-week forecast',safetyTitle:'Safety',safetyText:'If your condition worsens sharply or severe symptoms appear, contact medical support.',settings:'Settings',theme:'Theme',quickAmounts:'Quick amounts, ml',backupEvery:'Backup reminder, days',pinCode:'PIN code',reminders:'Reminders',pwaReminderNote:'iPhone PWA reminders may be unstable. Native app is needed for reliable push notifications.',saveSettings:'Save settings',shareTitle:'Share the app',shareText:'Each user has local data. Your history is not shared with the link.',shareApp:'Share link',copyLink:'Copy link',dataBackup:'Data and backup',exportJson:'Export JSON',exportCsv:'Export CSV',importJson:'Import JSON',legal:'Privacy / Terms / Disclaimer',dangerZone:'Danger zone',dangerText:'Reset removes local history on this device. Export JSON first.',resetAll:'Delete all data',navHome:'Day',navCheckin:'Check-in',navProgress:'Progress',navPlan:'Plan',navMore:'More',entrySheetTitle:'Intake entry',entrySheetNote:'Edit date, time, volume and comment',date:'Date',time:'Time',volumeMl:'Volume, ml',entryNote:'Comment',save:'Save',delete:'Delete',saveCheckin:'Save check-in',relapseTitle:'Over-goal review',relapseSub:'One day does not reset progress. Understand the cause.',relapseReason:'Main trigger?',relapseMl:'Approx. extra ml?',tomorrowPlan:'Tomorrow plan',saveRelapse:'Save without self-blame'},
  th:{gateTitle:'Tea Taper',gateLead:'แอปติดตามการลดน้ำกระท่อมแบบส่วนตัว ข้อมูลอยู่ในเครื่อง',medicalDisclaimerTitle:'ไม่ใช่แอปแพทย์',medicalDisclaimerText:'แอปไม่วินิจฉัย ไม่รักษา และไม่แทนคำปรึกษาแพทย์',gateAge:'ฉันอายุ 18 ปีขึ้นไป',gateTerms:'ฉันเข้าใจว่าแอปนี้เป็นบันทึกส่วนตัว',continue:'ต่อไป',onboardingTitle:'ตั้งค่าแผน',onboardingLead:'ใส่ปริมาณเฉลี่ยและความเร็วในการลด เปลี่ยนภายหลังได้',language:'ภาษา',avgVolume:'ปริมาณเฉลี่ย ml/วัน',taperSpeed:'ลดต่อสัปดาห์',firstGoal:'เป้าหมายขั้นต่ำ ml',startTracking:'เริ่ม',pinPrompt:'ใส่ PIN',unlock:'เปิด',forgotPin:'ลืม PIN? รีเซ็ตแอป',updateReady:'มีเวอร์ชันใหม่',update:'อัปเดต',eyebrow:'PRIVATE REDUCTION TRACKER',dailyTotal:'รวมต่อวัน',ofGoal:'ของเป้า',quickAdd:'เพิ่มเร็ว',quickAddNote:'เลือกปริมาณหรือเปิดฟอร์ม',manual:'กำหนดเอง',entries:'รายการวันนี้',entriesNote:'แตะเพื่อแก้ไข',clearDay:'ล้าง',dailyNote:'บันทึกวันนี้',notePlaceholder:'วันนี้อะไรมีผล: นอน เครียด งาน กีฬา...',wellbeingIndex:'ดัชนีสุขภาพ',morningEvening:'เช้า / เย็น',morningEveningNote:'บันทึกความเสี่ยงและสรุปวัน',morningCheckin:'เช็คอินเช้า',eveningCheckin:'เช็คอินเย็น',relapseFlow:'เกินเป้า',relapseDesc:'ดูสาเหตุโดยไม่โทษตัวเอง',wellbeingScales:'ความรู้สึก 0–10',scaleNote:'ทุกสเกลมีคำอธิบาย 0 และ 10',triggers:'สิ่งที่เพิ่มความอยาก',helpers:'สิ่งที่ช่วยลด',antiCraving:'เครื่องมือช่วยหยุดใจ',urgeTimer:'พัก 10 นาที',urgeTimerDesc:'ชะลอการตัดสินใจ',breathing:'หายใจ 4–4–6',breathingDesc:'รีเซ็ต 2 นาที',copyCrisis:'แผนตอนอยาก',copyCrisisDesc:'คัดลอกขั้นตอนสั้น',avgRecorded:'เฉลี่ยวันที่บันทึก',coverage:'บันทึกแล้ว',streak:'ต่อเนื่องตามเป้า',volumeChart:'ปริมาณ เป้า ค่าเฉลี่ย',volumeChartNote:'วันที่ไม่มีข้อมูลไม่ถือว่าสำเร็จ',wellbeingChart:'ดัชนีสุขภาพ',calendar:'ปฏิทิน',insights:'ข้อมูลเชิงลึก',insightsNote:'อะไรสัมพันธ์กับการเกินเป้า',weeklyReport:'รายงานสัปดาห์',weeklyReportNote:'ส่งให้ตัวเองหรือผู้เชี่ยวชาญได้',copy:'คัดลอก',history:'ประวัติ',planTitle:'แผนลด',startDate:'วันที่เริ่ม',startVolume:'ปริมาณเริ่ม ml/วัน',weeklyReduce:'ลดต่อสัปดาห์ %',floorGoal:'เป้าหมายขั้นต่ำ ml',adaptivePlan:'โหมดปรับตามจริง',plateauDays:'พักหลังเกินเป้า วัน',savePlan:'บันทึกแผน',planPreview:'คาดการณ์ 8 สัปดาห์',safetyTitle:'ความปลอดภัย',safetyText:'ถ้าอาการแย่ลงมาก ควรติดต่อแพทย์',settings:'ตั้งค่า',theme:'ธีม',quickAmounts:'ปุ่มเร็ว ml',backupEvery:'เตือนสำรองข้อมูล วัน',pinCode:'PIN',reminders:'แจ้งเตือน',pwaReminderNote:'PWA บน iPhone อาจแจ้งเตือนไม่เสถียร ต้องใช้ native app สำหรับ push ที่แน่นอน',saveSettings:'บันทึก',shareTitle:'แชร์แอป',shareText:'แต่ละคนมีข้อมูลในเครื่องตัวเอง ประวัติของคุณไม่ถูกแชร์',shareApp:'แชร์ลิงก์',copyLink:'คัดลอกลิงก์',dataBackup:'ข้อมูลและสำรอง',exportJson:'ส่งออก JSON',exportCsv:'ส่งออก CSV',importJson:'นำเข้า JSON',legal:'Privacy / Terms / Disclaimer',dangerZone:'โซนอันตราย',dangerText:'รีเซ็ตจะลบข้อมูลในเครื่อง ควร export JSON ก่อน',resetAll:'ลบข้อมูลทั้งหมด',navHome:'วัน',navCheckin:'เช็คอิน',navProgress:'ความคืบหน้า',navPlan:'แผน',navMore:'เพิ่มเติม',entrySheetTitle:'รายการ',entrySheetNote:'แก้ไขวันที่ เวลา ปริมาณ และ note',date:'วันที่',time:'เวลา',volumeMl:'ปริมาณ ml',entryNote:'คอมเมนต์',save:'บันทึก',delete:'ลบ',saveCheckin:'บันทึกเช็คอิน',relapseTitle:'ทบทวนการเกินเป้า',relapseSub:'วันเดียวไม่ลบความคืบหน้า',relapseReason:'ตัวกระตุ้นหลัก?',relapseMl:'เกินประมาณ ml?',tomorrowPlan:'แผนพรุ่งนี้',saveRelapse:'บันทึกโดยไม่โทษตัวเอง'}
};

const HEALTH = [
  {id:'craving', ru:'Тяга', en:'Craving', th:'ความอยาก', low:'0 — нет тяги', high:'10 — очень сильная тяга', negative:true},
  {id:'withdrawal', ru:'Ломка / дискомфорт', en:'Withdrawal discomfort', th:'อาการถอน', low:'0 — нет дискомфорта', high:'10 — очень тяжело', negative:true},
  {id:'anxiety', ru:'Тревога', en:'Anxiety', th:'วิตกกังวล', low:'0 — спокойно', high:'10 — сильная тревога', negative:true},
  {id:'mood', ru:'Настроение', en:'Mood', th:'อารมณ์', low:'0 — очень плохо', high:'10 — отлично', negative:false},
  {id:'energy', ru:'Энергия', en:'Energy', th:'พลังงาน', low:'0 — нет сил', high:'10 — много энергии', negative:false},
  {id:'sleepQuality', ru:'Качество сна', en:'Sleep quality', th:'คุณภาพการนอน', low:'0 — ужасно', high:'10 — отлично', negative:false},
  {id:'sleepDuration', ru:'Длительность сна', en:'Sleep duration', th:'ชั่วโมงนอน', low:'0 — почти не спал', high:'10 — выспался', negative:false},
  {id:'focus', ru:'Фокус', en:'Focus', th:'สมาธิ', low:'0 — не могу фокусироваться', high:'10 — ясная голова', negative:false},
  {id:'stress', ru:'Стресс', en:'Stress', th:'ความเครียด', low:'0 — нет стресса', high:'10 — максимум', negative:true},
  {id:'bodyPain', ru:'Боль в теле', en:'Body pain', th:'ปวดตัว', low:'0 — нет боли', high:'10 — сильная боль', negative:true},
  {id:'sweating', ru:'Потливость', en:'Sweating', th:'เหงื่อออก', low:'0 — нет', high:'10 — сильно', negative:true},
  {id:'stomach', ru:'ЖКТ / живот', en:'Stomach/GI', th:'ท้อง', low:'0 — всё нормально', high:'10 — плохо', negative:true},
  {id:'appetite', ru:'Аппетит', en:'Appetite', th:'ความอยากอาหาร', low:'0 — нет аппетита', high:'10 — нормальный аппетит', negative:false},
  {id:'hydration', ru:'Вода / гидратация', en:'Hydration', th:'น้ำ', low:'0 — обезвожен', high:'10 — воды достаточно', negative:false},
  {id:'productivity', ru:'Продуктивность', en:'Productivity', th:'ประสิทธิภาพ', low:'0 — ничего не сделал', high:'10 — продуктивный день', negative:false}
];
const TRIGGERS = ['stress','poor_sleep','pain','work','boredom','evening','social','after_food','anxiety','withdrawal','money','conflict','caffeine','habit_loop','other'];
const HELPERS = ['exercise','walk','food','water','shower','sleep','breathing','meditation','work_focus','friend','music','stretching','doctor','no_caffeine','early_bed'];
const LABELS = {
  ru:{stress:'стресс',poor_sleep:'недосып',pain:'боль',work:'работа',boredom:'скука',evening:'вечер',social:'социально',after_food:'после еды',anxiety:'тревога',withdrawal:'ломка',money:'деньги',conflict:'конфликт',caffeine:'кофеин',habit_loop:'автоматически',other:'другое',exercise:'спорт',walk:'прогулка',food:'еда',water:'вода',shower:'душ',sleep:'сон',breathing:'дыхание',meditation:'медитация',work_focus:'работа/фокус',friend:'общение',music:'музыка',stretching:'растяжка',doctor:'специалист',no_caffeine:'без кофеина',early_bed:'рано лечь'},
  en:{stress:'stress',poor_sleep:'poor sleep',pain:'pain',work:'work',boredom:'boredom',evening:'evening',social:'social',after_food:'after food',anxiety:'anxiety',withdrawal:'withdrawal',money:'money',conflict:'conflict',caffeine:'caffeine',habit_loop:'automatic',other:'other',exercise:'exercise',walk:'walk',food:'food',water:'water',shower:'shower',sleep:'sleep',breathing:'breathing',meditation:'meditation',work_focus:'work/focus',friend:'friend',music:'music',stretching:'stretching',doctor:'specialist',no_caffeine:'no caffeine',early_bed:'early bed'},
  th:{stress:'เครียด',poor_sleep:'นอนน้อย',pain:'ปวด',work:'งาน',boredom:'เบื่อ',evening:'ตอนเย็น',social:'สังคม',after_food:'หลังอาหาร',anxiety:'กังวล',withdrawal:'อาการถอน',money:'เงิน',conflict:'ขัดแย้ง',caffeine:'คาเฟอีน',habit_loop:'อัตโนมัติ',other:'อื่นๆ',exercise:'ออกกำลัง',walk:'เดิน',food:'อาหาร',water:'น้ำ',shower:'อาบน้ำ',sleep:'นอน',breathing:'หายใจ',meditation:'สมาธิ',work_focus:'โฟกัสงาน',friend:'เพื่อน',music:'เพลง',stretching:'ยืดเส้น',doctor:'ผู้เชี่ยวชาญ',no_caffeine:'ไม่คาเฟอีน',early_bed:'นอนเร็ว'}
};

let state = null;
let selectedDate = todayKey();
let timerInt = null;
let deferredInstallPrompt = null;
let unlocked = false;

function defaultState(){
  return {schemaVersion:SCHEMA_VERSION,appVersion:APP_VERSION,createdAt:new Date().toISOString(),firstRunDone:false,acceptedTerms:false,language:'ru',theme:'system',settings:{quickAmounts:[50,100,150,200,250,300],backupEveryDays:7,lastBackupAt:'',pinHash:'',pinSalt:'',reminderTime:''},plan:{startDate:todayKey(),startMl:1000,reducePct:10,floorMl:0,adaptive:false,plateauDays:3},days:{},migrationLog:[]};
}
function normalize(input){
  const base = defaultState();
  const s = {...base, ...(input||{})};
  s.settings = {...base.settings, ...(s.settings||{})};
  if(s.settings.pin && !s.settings.pinHash){ delete s.settings.pin; }
  s.plan = {...base.plan, ...(s.plan||{})};
  s.days = s.days || {};
  Object.keys(s.days).forEach(k => { s.days[k] = normalizeDay(s.days[k], k); if(!hasMeaningfulDay(s.days[k])) delete s.days[k]; });
  s.schemaVersion = SCHEMA_VERSION; s.appVersion = APP_VERSION;
  return s;
}
function normalizeDay(d, key){
  const day = {date:key, entries:[], health:{}, note:'', triggers:[], helpers:[], flags:{}, checkins:{}, relapse:null, ...(d||{})};
  day.entries = Array.isArray(day.entries) ? day.entries.map(e=>({id:e.id||uid(), ml:Number(e.ml)||0, time:e.time || (e.at?String(e.at).slice(11,16):timeNow()), note:e.note||'', createdAt:e.createdAt||e.at||new Date().toISOString(), updatedAt:e.updatedAt||''})).filter(e=>e.ml>=0) : [];
  day.health = day.health || {};
  day.triggers = Array.isArray(day.triggers) ? [...new Set(day.triggers)] : [];
  day.helpers = Array.isArray(day.helpers) ? [...new Set(day.helpers)] : [];
  day.flags = day.flags || {};
  day.checkins = day.checkins || {};
  return day;
}
function hasMeaningfulDay(d){
  if(!d) return false;
  if((d.entries||[]).length) return true;
  if((d.note||'').trim()) return true;
  if(Object.values(d.health||{}).some(Number.isFinite)) return true;
  if((d.triggers||[]).length || (d.helpers||[]).length) return true;
  if(Object.values(d.flags||{}).some(Boolean)) return true;
  if(d.relapse) return true;
  if(d.checkins && (d.checkins.morning || d.checkins.evening)) return true;
  return false;
}
function loadState(){
  let raw = null;
  try{ raw = localStorage.getItem(STORE_KEY); }catch(e){}
  if(raw){ try{return normalize(JSON.parse(raw));}catch(e){} }
  return migrateLegacy();
}
function migrateLegacy(){
  const s = defaultState();
  try{
    const ultra = localStorage.getItem('stopkratom.ultra.v2');
    if(ultra){
      const old = JSON.parse(ultra);
      Object.assign(s, old);
      s.migrationLog = [...(old.migrationLog||[]), `Migrated from stopkratom.ultra.v2 at ${new Date().toISOString()}`];
      return normalize(s);
    }
  }catch(e){}
  try{
    const prod = localStorage.getItem('stopkratom.production.v1');
    if(prod){
      const old = JSON.parse(prod);
      Object.assign(s, old);
      s.migrationLog.push(`Migrated from stopkratom.production.v1 at ${new Date().toISOString()}`);
      return normalize(s);
    }
  }catch(e){}
  try{
    const entries = JSON.parse(localStorage.getItem('kratomLog.entries.v1') || '[]');
    if(Array.isArray(entries) && entries.length){
      entries.forEach(e=>{
        const key = String(e.date || e.day || e.createdAt || todayKey()).slice(0,10);
        const d = ensureDay(key, s);
        d.entries.push({id:e.id||uid(), ml:Number(e.ml||e.amount||0), time:String(e.time || e.createdAt || timeNow()).slice(11,16) || timeNow(), note:e.note||'', createdAt:e.createdAt||new Date().toISOString(), updatedAt:''});
      });
      s.migrationLog.push(`Migrated from kratomLog.entries.v1 at ${new Date().toISOString()}`);
    }
  }catch(e){}
  return normalize(s);
}
function save(){
  Object.keys(state.days).forEach(k=>{ if(!hasMeaningfulDay(state.days[k])) delete state.days[k]; });
  state.appVersion = APP_VERSION;
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}
function getDay(key=selectedDate, source=state){ return source.days[key] || null; }
function ensureDay(key=selectedDate, source=state){ if(!source.days[key]) source.days[key] = normalizeDay({date:key}, key); return source.days[key]; }
function lang(){ return state?.language || 'ru'; }
function t(key){ return (TEXT[lang()] && TEXT[lang()][key]) || TEXT.ru[key] || key; }
function tr(key){ return (I18N[lang()] && I18N[lang()][key]) || I18N.ru[key] || key; }
function label(id){ return (LABELS[lang()] && LABELS[lang()][id]) || LABELS.ru[id] || id; }
function metricName(m){ return m[lang()] || m.ru; }
function fmtDate(key, opts={weekday:'short',day:'2-digit',month:'short',year:'numeric'}){ return parseKey(key).toLocaleDateString(lang()==='th'?'th-TH':lang()==='en'?'en-US':'ru-RU', opts); }
function totalMl(key){ const d=getDay(key); return d ? d.entries.reduce((a,e)=>a+Number(e.ml||0),0) : 0; }
function targetFor(key){
  const p = state.plan;
  const start = p.startDate || todayKey();
  const weeks = Math.max(0, Math.floor(diffDays(key, start)/7));
  const raw = Number(p.startMl||0) * Math.pow(1-Number(p.reducePct||0)/100, weeks);
  return Math.max(Number(p.floorMl||0), Math.round(raw/10)*10);
}
function dayStatus(key){
  const d=getDay(key); if(!hasMeaningfulDay(d)) return 'empty';
  if(d.relapse || d.flags?.relapse) return 'relapse';
  const target = targetFor(key), total = totalMl(key);
  if(!target) return 'recorded';
  if(total <= target) return 'good';
  if(total <= target*1.15) return 'warn';
  return 'bad';
}
function wellbeingScore(key){
  const d=getDay(key); if(!d) return null;
  const vals=[];
  HEALTH.forEach(m=>{ const v=d.health?.[m.id]; if(Number.isFinite(v)){ vals.push(m.negative ? 10-v : v); } });
  if(!vals.length) return null;
  return Math.round((vals.reduce((a,b)=>a+b,0)/vals.length)*10);
}
function riskLevel(key){
  const d = getDay(key); const score = wellbeingScore(key); const craving = d?.health?.craving ?? null; const anxiety = d?.health?.anxiety ?? null; const stress = d?.health?.stress ?? null;
  let risk = 0;
  if(score!==null && score<45) risk += 2; else if(score!==null && score<65) risk += 1;
  [craving,anxiety,stress].forEach(v=>{ if(v>=8) risk +=2; else if(v>=6) risk +=1; });
  if((d?.triggers||[]).length>=3) risk += 1;
  if(totalMl(key) > targetFor(key)) risk += 1;
  return risk>=4 ? 'high' : risk>=2 ? 'mid' : 'low';
}

async function sha256(text){
  if(hasCrypto()){
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  let h=0; for(let i=0;i<text.length;i++){ h=Math.imul(31,h)+text.charCodeAt(i)|0; } return String(h);
}
async function hashPin(pin, salt){ return sha256(`${salt}:${pin}`); }

async function init(){
  state = loadState();
  applyTheme();
  bindEvents();
  translateStatic();
  selectedDate = todayKey();
  registerServiceWorker();
  await checkLock();
  renderAll();
  maybeShowGate();
}
function maybeShowGate(){
  if(!state.acceptedTerms) $('#ageGate').classList.remove('hidden');
  else if(!state.firstRunDone) $('#onboarding').classList.remove('hidden');
}
async function checkLock(){
  if(state.settings.pinHash && !unlocked){ $('#lock').classList.remove('hidden'); $('#pinInput').focus(); }
}
function bindEvents(){
  $('#gateContinue').onclick = () => {
    if(!$('#gateAge').checked || !$('#gateTerms').checked){ toast('Нужно подтвердить 18+ и условия'); return; }
    state.acceptedTerms = true; save(); $('#ageGate').classList.add('hidden'); $('#onboarding').classList.remove('hidden');
  };
  $('#finishOnboarding').onclick = () => {
    state.language = $('#onLang').value;
    state.plan.startDate = todayKey(); state.plan.startMl = Number($('#onStartMl').value||1000); state.plan.reducePct = Number($('#onReduce').value||10); state.plan.floorMl = Number($('#onFloor').value||0);
    state.firstRunDone = true; save(); $('#onboarding').classList.add('hidden'); translateStatic(); renderAll(); toast(t('saved'));
  };
  $('#unlockBtn').onclick = unlock;
  $('#pinInput').addEventListener('keydown', e=>{ if(e.key==='Enter') unlock(); });
  $('#hardResetBtn').onclick = () => { const ok = prompt(t('pinReset')); if(ok==='RESET'){ clearStoredData(); location.reload(); } };
  $('#reloadAppBtn').onclick = () => location.reload();
  window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); deferredInstallPrompt=e; $('#installBtn').classList.remove('hidden'); });
  $('#installBtn').onclick = async()=>{ if(deferredInstallPrompt){ deferredInstallPrompt.prompt(); deferredInstallPrompt=null; $('#installBtn').classList.add('hidden'); } };
  $('#themeBtn').onclick = () => { state.theme = state.theme==='dark'?'light':state.theme==='light'?'system':'dark'; save(); applyTheme(); renderCharts(); };
  $('#shareAppBtn').onclick = shareApp; $('#shareAppBtn2').onclick = shareApp; $('#copyLinkBtn').onclick = copyLink;
  $$('.nav-btn').forEach(b=>b.onclick=()=>switchView(b.dataset.view));
  $('#prevDay').onclick = ()=>{ selectedDate=addDays(selectedDate,-1); renderAll(); };
  $('#nextDay').onclick = ()=>{ selectedDate=addDays(selectedDate,1); renderAll(); };
  $('#datePickerBtn').onclick = ()=>$('#dateInput').showPicker ? $('#dateInput').showPicker() : $('#dateInput').click();
  $('#dateInput').onchange = e=>{ if(e.target.value){ selectedDate=e.target.value; renderAll(); } };
  $('#openEntryBtn').onclick = () => openEntrySheet({date:selectedDate});
  $('#saveEntryBtn').onclick = saveEntryFromSheet;
  $('#deleteEntryBtn').onclick = deleteEntryFromSheet;
  $$('[data-close-sheet]').forEach(x=>x.onclick=closeSheets);
  $('#clearDayBtn').onclick = clearDay;
  $('#dayNote').oninput = debounce(()=>{ const d=ensureDay(selectedDate); d.note=$('#dayNote').value; save(); renderProgressOnly(); }, 250);
  $('#morningCheckinBtn').onclick = ()=>openCheckinSheet('morning');
  $('#eveningCheckinBtn').onclick = ()=>openCheckinSheet('evening');
  $('#saveCheckinBtn').onclick = saveCheckin;
  $('#relapseBtn').onclick = openRelapseSheet;
  $('#saveRelapseBtn').onclick = saveRelapse;
  $('#urgeTimerBtn').onclick = ()=>startUrgeTimer(10*60);
  $('#breathBtn').onclick = startBreathing;
  $('#copyCrisisBtn').onclick = async()=>{ await navigator.clipboard.writeText(t('crisis')); toast(t('copied')); };
  $('#rangeSelect').onchange = renderProgressOnly;
  $('#copyReportBtn').onclick = async()=>{ await navigator.clipboard.writeText(weeklyReportText()); toast(t('copied')); };
  $('#savePlanBtn').onclick = savePlan;
  $('#saveSettingsBtn').onclick = saveSettings;
  $('#exportJsonBtn').onclick = exportJson;
  $('#exportCsvBtn').onclick = exportCsv;
  $('#importInput').onchange = importJson;
  $('#resetAllBtn').onclick = resetAll;
  $$('.legal-tabs button').forEach(btn=>btn.onclick=()=>renderLegal(btn.dataset.legal));
}
async function unlock(){
  const pin = $('#pinInput').value.trim();
  const h = await hashPin(pin, state.settings.pinSalt||'');
  if(h === state.settings.pinHash){ unlocked = true; $('#lock').classList.add('hidden'); $('#pinInput').value=''; }
  else toast(t('wrongPin'));
}
function debounce(fn, ms){ let id; return (...args)=>{ clearTimeout(id); id=setTimeout(()=>fn(...args), ms); }; }
function applyTheme(){ document.documentElement.dataset.theme = state?.theme || 'system'; $('#themeSelect') && ($('#themeSelect').value=state.theme||'system'); }
function translateStatic(){
  document.documentElement.lang = lang();
  $$('[data-i18n]').forEach(el=>{ el.textContent = tr(el.dataset.i18n); });
  $$('[data-i18n-placeholder]').forEach(el=>{ el.placeholder = tr(el.dataset.i18nPlaceholder); });
}
function switchView(view){
  $$('.view').forEach(v=>v.classList.toggle('active', v.id === `view-${view}`));
  $$('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.view===view));
  if(view==='progress') renderProgressOnly();
  if(view==='plan') renderPlan();
  if(view==='more') renderMore();
  window.scrollTo({top:0,behavior:'smooth'});
}
function renderAll(){
  translateStatic(); renderHome(); renderCheckin(); renderProgressOnly(); renderPlan(); renderMore(); renderLegal($('.legal-tabs button.active')?.dataset.legal || 'privacy');
}
function renderHome(){
  $('#selectedDateLabel').textContent = fmtDate(selectedDate);
  $('#dateInput').value = selectedDate;
  const total = totalMl(selectedDate); const target = targetFor(selectedDate); const pct = target ? Math.round(total/target*100) : 0;
  $('#dayTotal').textContent = total; $('#ringPct').textContent = `${Math.min(pct,999)}%`;
  $('#goalText').textContent = target ? t('goalLine')(total,target) : t('noGoal')(total);
  drawRing(pct);
  renderRiskStrip(); renderQuickButtons(); renderEntries();
  $('#dayNote').value = getDay(selectedDate)?.note || '';
}
function renderRiskStrip(){
  const risk = riskLevel(selectedDate), score = wellbeingScore(selectedDate), status = dayStatus(selectedDate);
  const riskText = risk==='high'?t('riskHigh'):risk==='mid'?t('riskMid'):t('riskLow');
  const statusText = status==='empty'?t('noRecord'):status==='good'?t('inGoal'):status==='warn'?'около цели':status==='bad'||status==='relapse'?t('aboveGoal'):'записано';
  $('#riskStrip').innerHTML = `
    <div class="risk-pill"><b>${riskText}</b><span>риск дня</span></div>
    <div class="risk-pill"><b>${score===null?'—':score+'/100'}</b><span>самочувствие</span></div>
    <div class="risk-pill"><b>${statusText}</b><span>статус</span></div>`;
}
function renderQuickButtons(){
  const box=$('#quickButtons'); box.innerHTML='';
  state.settings.quickAmounts.forEach(ml=>{ const b=document.createElement('button'); b.className='quick-btn'; b.textContent=`+${ml} мл`; b.onclick=()=>addEntry({date:selectedDate, ml:Number(ml), time:timeNow(), note:''}); box.appendChild(b); });
}
function addEntry({date,ml,time,note}){ const d=ensureDay(date); d.entries.push({id:uid(), ml:Number(ml)||0, time:time||timeNow(), note:note||'', createdAt:new Date().toISOString(), updatedAt:''}); save(); selectedDate=date; renderAll(); toast(t('saved')); }
function renderEntries(){
  const box=$('#entriesList'); box.innerHTML=''; const d=getDay(selectedDate); const entries=(d?.entries||[]).slice().sort((a,b)=>String(a.time).localeCompare(String(b.time)));
  if(!entries.length){ box.innerHTML=`<div class="empty-state">${t('noEntries')}</div>`; return; }
  entries.forEach(e=>{ const row=document.createElement('button'); row.className='entry-row'; row.innerHTML=`<span><b>${e.time||'—'} · ${e.note?escapeHtml(e.note):'запись'}</b><small>${fmtDate(selectedDate,{day:'2-digit',month:'short'})}</small></span><strong>${e.ml} мл</strong><span>›</span>`; row.onclick=()=>openEntrySheet({date:selectedDate, entry:e}); box.appendChild(row); });
}
function openEntrySheet({date, entry=null, ml=''}){
  $('#entrySheetTitle').textContent = entry ? t('entryEdit') : t('entryNew');
  $('#entryId').value = entry?.id || ''; $('#entryDate').value = date || selectedDate; $('#entryTime').value = entry?.time || timeNow(); $('#entryMl').value = entry?.ml ?? ml; $('#entryNote').value = entry?.note || ''; $('#deleteEntryBtn').classList.toggle('hidden', !entry);
  $('#entrySheet').classList.remove('hidden'); setTimeout(()=>$('#entryMl').focus(), 60);
}
function closeSheets(){ $$('.sheet').forEach(s=>s.classList.add('hidden')); }
function saveEntryFromSheet(){
  const id=$('#entryId').value; const date=$('#entryDate').value || selectedDate; const ml=Number($('#entryMl').value);
  if(!Number.isFinite(ml) || ml<0){ toast(t('mlRequired')); return; }
  const time=$('#entryTime').value || timeNow(); const note=$('#entryNote').value.trim();
  if(id){
    const oldDate = Object.keys(state.days).find(k => (state.days[k].entries||[]).some(e=>e.id===id));
    if(oldDate){ const oldDay=ensureDay(oldDate); const idx=oldDay.entries.findIndex(e=>e.id===id); const entry={...oldDay.entries[idx], ml, time, note, updatedAt:new Date().toISOString()}; oldDay.entries.splice(idx,1); const newDay=ensureDay(date); newDay.entries.push(entry); }
  } else { ensureDay(date).entries.push({id:uid(), ml, time, note, createdAt:new Date().toISOString(), updatedAt:''}); }
  selectedDate=date; save(); closeSheets(); renderAll(); toast(t('saved'));
}
function deleteEntryFromSheet(){
  const id=$('#entryId').value; if(!id) return;
  Object.keys(state.days).forEach(k=>{ state.days[k].entries = (state.days[k].entries||[]).filter(e=>e.id!==id); });
  save(); closeSheets(); renderAll(); toast(t('deleted'));
}
function clearDay(){
  if(!confirm('Очистить записи и данные выбранного дня?')) return;
  delete state.days[selectedDate]; save(); renderAll(); toast(t('dayCleared'));
}
function drawRing(pct){
  const c=$('#progressRing'); if(!c) return; const ctx=c.getContext('2d'), w=c.width, h=c.height, r=58; ctx.clearRect(0,0,w,h); ctx.lineWidth=14; ctx.lineCap='round'; const css=getComputedStyle(document.documentElement);
  ctx.strokeStyle=css.getPropertyValue('--surface-2'); ctx.beginPath(); ctx.arc(w/2,h/2,r,0,Math.PI*2); ctx.stroke();
  ctx.strokeStyle=pct<=100?css.getPropertyValue('--primary'):'#dc2626'; ctx.beginPath(); ctx.arc(w/2,h/2,r,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(pct,140)/100); ctx.stroke();
}
function renderCheckin(){
  const score = wellbeingScore(selectedDate); $('#wellbeingScore').textContent = score===null?'—':score; $('#wellbeingHint').textContent = score===null ? 'Заполни шкалы 0–10, чтобы появился индекс.' : score<45?'Высокая нагрузка. Лучше снизить риск дня.':score<70?'Среднее состояние. Следи за триггерами.':'Хорошее состояние.';
  const d=getDay(selectedDate); $('#morningStatus').textContent = d?.checkins?.morning ? t('morningDone') : t('notDone'); $('#eveningStatus').textContent = d?.checkins?.evening ? t('eveningDone') : t('notDone');
  renderHealthGrid(); renderChips('triggerGrid', TRIGGERS, d?.triggers||[], val=>toggleArray('triggers', val)); renderChips('helperGrid', HELPERS, d?.helpers||[], val=>toggleArray('helpers', val));
}
function renderHealthGrid(){
  const grid=$('#healthGrid'); grid.innerHTML=''; const d=getDay(selectedDate);
  HEALTH.forEach(m=>{ const val = d?.health?.[m.id]; const item=document.createElement('div'); item.className='health-item'; item.innerHTML=`<div class="health-top"><div><b>${metricName(m)}</b><small>${m.low}<br>${m.high}</small></div><span class="health-val">${Number.isFinite(val)?val:'—'}</span></div><div class="scale"></div>`; const scale=$('.scale', item); for(let i=0;i<=10;i++){ const b=document.createElement('button'); b.textContent=i; b.classList.toggle('active', val===i); b.onclick=()=>{ const day=ensureDay(selectedDate); day.health[m.id]=i; save(); renderCheckin(); renderProgressOnly(); }; scale.appendChild(b); } grid.appendChild(item); });
}
function renderChips(boxId, items, active, cb){
  const box=$(`#${boxId}`); box.innerHTML=''; items.forEach(id=>{ const b=document.createElement('button'); b.className='chip'; b.textContent=label(id); b.classList.toggle('active', active.includes(id)); b.onclick=()=>cb(id); box.appendChild(b); });
}
function toggleArray(field, val){ const d=ensureDay(selectedDate); const arr=d[field]||[]; d[field]=arr.includes(val)?arr.filter(x=>x!==val):[...arr,val]; save(); renderCheckin(); renderProgressOnly(); }
function openCheckinSheet(type){
  $('#checkinType').value=type; $('#checkinTitle').textContent = type==='morning' ? tr('morningCheckin') : tr('eveningCheckin'); $('#checkinSub').textContent = type==='morning' ? 'Сон, энергия, тяга, тревога, риск дня.' : 'Итог дня: тяга, настроение, стресс, заметка.';
  const keys = type==='morning' ? ['sleepQuality','energy','craving','anxiety','focus'] : ['craving','mood','stress','bodyPain','productivity'];
  const d=getDay(selectedDate); const old=d?.checkins?.[type] || {}; $('#checkinNote').value = old.note || '';
  const box=$('#checkinScaleBox'); box.innerHTML=''; keys.forEach(id=>{ const m=HEALTH.find(x=>x.id===id); const val=Number.isFinite(old[id])?old[id]:(d?.health?.[id] ?? null); const wrap=document.createElement('div'); wrap.className='health-item'; wrap.dataset.metric=id; wrap.innerHTML=`<div class="health-top"><div><b>${metricName(m)}</b><small>${m.low} · ${m.high}</small></div><span class="health-val">${val===null?'—':val}</span></div><div class="scale"></div>`; const scale=$('.scale',wrap); for(let i=0;i<=10;i++){ const b=document.createElement('button'); b.textContent=i; b.classList.toggle('active', val===i); b.onclick=()=>{ wrap.dataset.value=String(i); $('.health-val',wrap).textContent=i; $$('.scale button',wrap).forEach(x=>x.classList.toggle('active',x===b)); }; scale.appendChild(b); } if(val!==null) wrap.dataset.value=String(val); box.appendChild(wrap); });
  $('#checkinSheet').classList.remove('hidden');
}
function saveCheckin(){
  const type=$('#checkinType').value; const d=ensureDay(selectedDate); const data={completedAt:new Date().toISOString(), note:$('#checkinNote').value.trim()};
  $$('#checkinScaleBox .health-item').forEach(item=>{ const id=item.dataset.metric; const value=Number(item.dataset.value); if(Number.isFinite(value)){ data[id]=value; d.health[id]=value; } });
  d.checkins[type]=data; save(); closeSheets(); renderAll(); toast(t('saved'));
}
function openRelapseSheet(){
  const sel=$('#relapseReason'); sel.innerHTML=''; TRIGGERS.forEach(id=>{ const o=document.createElement('option'); o.value=id; o.textContent=label(id); sel.appendChild(o); });
  $('#relapseMl').value=''; $('#relapseNote').value=''; $('#relapseSheet').classList.remove('hidden');
}
function saveRelapse(){
  const d=ensureDay(selectedDate); const reason=$('#relapseReason').value; d.relapse={reason, extraMl:Number($('#relapseMl').value||0), tomorrowPlan:$('#tomorrowPlan').value, note:$('#relapseNote').value.trim(), createdAt:new Date().toISOString()}; d.flags.relapse=true; if(reason && !d.triggers.includes(reason)) d.triggers.push(reason);
  save(); closeSheets(); renderAll(); toast(t('saved'));
}
function startUrgeTimer(sec){
  clearInterval(timerInt); const box=$('#timerBox'); box.classList.remove('hidden'); const end=Date.now()+sec*1000;
  timerInt=setInterval(()=>{ const left=Math.max(0,Math.round((end-Date.now())/1000)); const m=Math.floor(left/60), s=pad(left%60); box.textContent = left ? `Пауза ${m}:${s}. Не принимай решение на пике тяги.` : 'Таймер завершен. Запиши тягу 0–10 и реши спокойно.'; if(!left) clearInterval(timerInt); },250);
}
function startBreathing(){
  const box=$('#timerBox'); box.classList.remove('hidden'); clearInterval(timerInt); const phases=[['Вдох',4],['Пауза',4],['Выдох',6]]; let i=0, left=phases[0][1];
  box.textContent=`${phases[0][0]} ${left}`;
  timerInt=setInterval(()=>{ left--; if(left<=0){ i=(i+1)%phases.length; left=phases[i][1]; } box.textContent=`${phases[i][0]} ${left}`; },1000);
  setTimeout(()=>{ clearInterval(timerInt); box.textContent='Готово. Теперь оцени тягу и тревогу по шкале 0–10.'; },120000);
}
function renderProgressOnly(){ renderStats(); renderCharts(); renderCalendar(); renderInsights(); renderWeeklyReport(); renderHistory(); renderMore(); }
function getSeries(n){ const arr=[]; let k=addDays(todayKey(),-(n-1)); for(let i=0;i<n;i++,k=addDays(k,1)){ arr.push({key:k, exists:hasMeaningfulDay(getDay(k)), total:totalMl(k), target:targetFor(k), score:wellbeingScore(k), status:dayStatus(k)}); } return arr; }
function renderStats(){
  const s=getSeries(7); const recorded=s.filter(x=>x.exists); const avg=recorded.length?Math.round(recorded.reduce((a,b)=>a+b.total,0)/recorded.length):null;
  $('#avgRecorded').textContent = avg===null?'—':`${avg} мл`; $('#coverageText').textContent=`${recorded.length}/7`; $('#streakText').textContent=`${streakInGoal()} дн.`;
}
function streakInGoal(){ let streak=0; let k=todayKey(); for(let i=0;i<365;i++,k=addDays(k,-1)){ const d=getDay(k); if(!hasMeaningfulDay(d)) break; if(totalMl(k)<=targetFor(k)){ streak++; } else break; } return streak; }
function movingAverage(values, window=7){ return values.map((_,i)=>{ const xs=values.slice(Math.max(0,i-window+1),i+1).filter(v=>v!==null); return xs.length?Math.round(xs.reduce((a,b)=>a+b,0)/xs.length):null; }); }
function renderCharts(){
  const n=Number($('#rangeSelect')?.value||30); const data=getSeries(n); drawVolumeChart($('#volumeChart'), data); drawHealthChart($('#healthChart'), data);
}
function drawBase(ctx,w,h,p,max){ const css=getComputedStyle(document.documentElement); ctx.clearRect(0,0,w,h); ctx.strokeStyle=css.getPropertyValue('--line'); ctx.lineWidth=1; ctx.fillStyle=css.getPropertyValue('--muted'); ctx.font='13px -apple-system'; for(let i=0;i<=4;i++){ const y=p+(h-p*2)*i/4; ctx.beginPath(); ctx.moveTo(p,y); ctx.lineTo(w-p,y); ctx.stroke(); ctx.fillText(String(Math.round(max*(1-i/4))),8,y+4); } }
function plotLine(ctx, arr, max, color, dashed=false, width=4){ const w=ctx.canvas.width,h=ctx.canvas.height,p=42; ctx.strokeStyle=color; ctx.lineWidth=width; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.setLineDash(dashed?[8,7]:[]); let started=false; ctx.beginPath(); arr.forEach((v,i)=>{ if(v===null||v===undefined) {started=false; return;} const x=p+(w-p*2)*(arr.length===1?0:i/(arr.length-1)); const y=h-p-(h-p*2)*(v/max); if(!started){ ctx.moveTo(x,y); started=true; } else ctx.lineTo(x,y); }); ctx.stroke(); ctx.setLineDash([]); }
function drawVolumeChart(canvas,data){ if(!canvas) return; const ctx=canvas.getContext('2d'), w=canvas.width, h=canvas.height, p=42; const totals=data.map(x=>x.exists?x.total:null), targets=data.map(x=>x.target), avg=movingAverage(totals); const max=Math.max(100,...targets,...totals.filter(v=>v!==null)); drawBase(ctx,w,h,p,max); const css=getComputedStyle(document.documentElement); data.forEach((x,i)=>{ if(!x.exists){ const xx=p+(w-p*2)*(data.length===1?0:i/(data.length-1)); ctx.fillStyle=css.getPropertyValue('--line'); ctx.fillRect(xx-1,p,2,h-p*2); } }); plotLine(ctx,targets,max,'#94a3b8',true,3); plotLine(ctx,avg,max,'#f59e0b',false,3); plotLine(ctx,totals,max,css.getPropertyValue('--primary'),false,5); }
function drawHealthChart(canvas,data){ if(!canvas) return; const ctx=canvas.getContext('2d'), w=canvas.width, h=canvas.height, p=42; const scores=data.map(x=>x.score===null?null:x.score); drawBase(ctx,w,h,p,100); plotLine(ctx,scores,100,getComputedStyle(document.documentElement).getPropertyValue('--primary'),false,5); }
function renderCalendar(){
  const box=$('#calendarGrid'); if(!box) return; box.innerHTML=''; getSeries(35).forEach(x=>{ const b=document.createElement('button'); b.className=`day-cell ${x.status}`; if(x.status==='relapse') b.classList.add('bad','relapse'); b.textContent=parseKey(x.key).getDate(); b.title=`${x.key}: ${x.exists?x.total+' мл':'нет данных'}`; b.onclick=()=>{ selectedDate=x.key; switchView('home'); renderAll(); }; box.appendChild(b); });
}
function overGoalDays(n=30){ return getSeries(n).filter(x=>x.exists && x.total > x.target); }
function renderInsights(){
  const box=$('#insightsBox'); if(!box) return; const days=getSeries(30).filter(x=>x.exists); const over=days.filter(x=>x.total>x.target); const count=(field, list)=>{ const m={}; list.forEach(x=>{ (getDay(x.key)?.[field]||[]).forEach(v=>m[v]=(m[v]||0)+1); }); return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,3); };
  const topTriggers=count('triggers',over); const topHelpers=count('helpers',days.filter(x=>x.total<=x.target));
  const sleepBad=days.filter(x=>(getDay(x.key)?.health?.sleepQuality ?? 10)<=4); const sleepAvg=sleepBad.length?Math.round(sleepBad.reduce((a,x)=>a+x.total,0)/sleepBad.length):null;
  box.innerHTML='';
  const add=(title,text)=>{ const div=document.createElement('div'); div.className='insight'; div.innerHTML=`<b>${title}</b><span>${text}</span>`; box.appendChild(div); };
  add('Покрытие данных', `${days.length}/30 дней заполнено. Пустые дни не считаются успехом.`);
  add('Чаще выше цели', topTriggers.length ? topTriggers.map(([id,c])=>`${label(id)} ×${c}`).join(', ') : 'Недостаточно данных по триггерам.');
  add('Что помогает', topHelpers.length ? topHelpers.map(([id,c])=>`${label(id)} ×${c}`).join(', ') : 'Отмечай helpers, чтобы увидеть закономерности.');
  if(sleepAvg!==null) add('Сон и объем', `В дни с плохим сном средний объем: ${sleepAvg} мл.`);
}
function weeklyReportText(){
  const s=getSeries(7); const rec=s.filter(x=>x.exists); const avg=rec.length?Math.round(rec.reduce((a,b)=>a+b.total,0)/rec.length):0; const over=rec.filter(x=>x.total>x.target).length; const scoreVals=rec.map(x=>x.score).filter(v=>v!==null); const score=scoreVals.length?Math.round(scoreVals.reduce((a,b)=>a+b,0)/scoreVals.length):'—';
  return `Tea Taper weekly report\nPeriod: ${s[0].key} — ${s[s.length-1].key}\nRecorded days: ${rec.length}/7\nAverage intake: ${avg} ml\nDays over target: ${over}\nWellbeing avg: ${score}/100\nCurrent target: ${targetFor(todayKey())} ml/day`;
}
function renderWeeklyReport(){ const box=$('#weeklyReportBox'); if(box) box.textContent=weeklyReportText(); }
function renderHistory(){
  const box=$('#historyList'); if(!box) return; box.innerHTML=''; const keys=Object.keys(state.days).filter(k=>hasMeaningfulDay(state.days[k])).sort().reverse().slice(0,80);
  if(!keys.length){ box.innerHTML=`<div class="empty-state">${t('noData')}</div>`; return; }
  keys.forEach(k=>{ const d=getDay(k), score=wellbeingScore(k); const row=document.createElement('button'); row.className='history-row'; row.innerHTML=`<span><b>${fmtDate(k)}</b><small>${(d.entries||[]).length} записей · ${score===null?'—':score+'/100'} · ${dayStatus(k)}</small></span><strong>${totalMl(k)} мл</strong><span>›</span>`; row.onclick=()=>{selectedDate=k; switchView('home'); renderAll();}; box.appendChild(row); });
}
function renderPlan(){
  if(!$('#planStartDate')) return; const p=state.plan; $('#planStartDate').value=p.startDate; $('#planStartMl').value=p.startMl; $('#planReducePct').value=p.reducePct; $('#planFloorMl').value=p.floorMl; $('#adaptivePlan').value=String(!!p.adaptive); $('#plateauDays').value=p.plateauDays??3;
  const box=$('#planPreview'); if(!box) return; box.innerHTML=''; for(let w=0;w<8;w++){ const k=addDays(p.startDate,w*7); const row=document.createElement('div'); row.className='plan-row'; row.innerHTML=`<span>${fmtDate(k)}</span><b>${targetFor(k)} мл/день</b>`; box.appendChild(row); }
}
function savePlan(){
  state.plan={startDate:$('#planStartDate').value||todayKey(), startMl:Number($('#planStartMl').value||0), reducePct:clamp(Number($('#planReducePct').value||0),0,50), floorMl:Number($('#planFloorMl').value||0), adaptive:$('#adaptivePlan').value==='true', plateauDays:clamp(Number($('#plateauDays').value||0),0,14)}; save(); renderAll(); toast(t('saved'));
}
function renderMore(){
  if(!$('#languageSelect')) return; $('#languageSelect').value=state.language; $('#themeSelect').value=state.theme; $('#quickAmountsInput').value=state.settings.quickAmounts.join(','); $('#backupDays').value=state.settings.backupEveryDays; $('#pinSetInput').value=''; $('#reminderTime').value=state.settings.reminderTime||'';
  const last = state.settings.lastBackupAt ? new Date(state.settings.lastBackupAt).toLocaleString() : '—'; $('#backupStatus').textContent = `Последний экспорт: ${last}. ${backupDue()?t('backupDue'):''}`;
}
async function saveSettings(){
  state.language=$('#languageSelect').value; state.theme=$('#themeSelect').value; state.settings.quickAmounts=$('#quickAmountsInput').value.split(',').map(x=>Number(x.trim())).filter(x=>x>0).slice(0,10); if(!state.settings.quickAmounts.length) state.settings.quickAmounts=[50,100,150]; state.settings.backupEveryDays=clamp(Number($('#backupDays').value||7),1,60); state.settings.reminderTime=$('#reminderTime').value;
  const pin=$('#pinSetInput').value.trim(); if(pin){ const salt=uid(); state.settings.pinSalt=salt; state.settings.pinHash=await hashPin(pin,salt); toast(t('pinSaved')); }
  save(); applyTheme(); translateStatic(); renderAll();
}
function renderLegal(tab='privacy'){
  $$('.legal-tabs button').forEach(b=>b.classList.toggle('active', b.dataset.legal===tab));
  const text = TEXT[lang()]?.legal?.[tab] || TEXT.ru.legal[tab]; if($('#legalText')) $('#legalText').innerHTML = text;
}
function backupDue(){ if(!state.settings.lastBackupAt) return true; const days=(Date.now()-new Date(state.settings.lastBackupAt).getTime())/86400000; return days >= state.settings.backupEveryDays; }
function exportJson(){ state.settings.lastBackupAt=new Date().toISOString(); save(); download(`tea-taper-backup-${todayKey()}.json`, JSON.stringify(state,null,2), 'application/json'); renderMore(); toast(t('backupOk')); }
function csvEscape(v){ const s=String(v??''); return /[",\n;]/.test(s) ? `"${s.replaceAll('"','""')}"` : s; }
function exportCsv(){
  const headers=['date','total_ml','target_ml','difference_ml','status','entries_count','entries_detail','wellbeing_score',...HEALTH.map(m=>m.id),'triggers','helpers','relapse','note'];
  const rows=[headers];
  Object.keys(state.days).filter(k=>hasMeaningfulDay(state.days[k])).sort().forEach(k=>{ const d=getDay(k), total=totalMl(k), target=targetFor(k); const details=(d.entries||[]).map(e=>`${e.time} ${e.ml}ml ${e.note||''}`).join(' | '); rows.push([k,total,target,total-target,dayStatus(k),(d.entries||[]).length,details,wellbeingScore(k)??'',...HEALTH.map(m=>d.health?.[m.id]??''),(d.triggers||[]).join('|'),(d.helpers||[]).join('|'),d.relapse?JSON.stringify(d.relapse):'',d.note||'']); });
  const csv='\ufeff'+rows.map(r=>r.map(csvEscape).join(',')).join('\n'); download(`tea-taper-export-${todayKey()}.csv`, csv, 'text/csv;charset=utf-8'); toast(t('backupOk'));
}
function download(name,content,type){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
function importJson(e){ const file=e.target.files?.[0]; if(!file) return; const reader=new FileReader(); reader.onload=()=>{ try{ const data=JSON.parse(reader.result); if(!data || !data.days) throw new Error('bad'); state=normalize(data); save(); selectedDate=todayKey(); renderAll(); toast(t('imported')); }catch(err){ toast(t('badFile')); } e.target.value=''; }; reader.readAsText(file); }
function clearStoredData(){ [STORE_KEY, ...LEGACY_KEYS, 'kratomLog.settings.v1'].forEach(k=>localStorage.removeItem(k)); }
function resetAll(){ if(confirm(t('resetConfirm'))){ clearStoredData(); location.reload(); } }
async function shareApp(){ const data={title:'Tea Taper', text:t('appShareText'), url:location.href}; if(navigator.share){ try{ await navigator.share(data); }catch(e){} } else copyLink(); }
async function copyLink(){ await navigator.clipboard.writeText(location.href); toast(t('copied')); }
function escapeHtml(s){ return String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function registerServiceWorker(){
  if(!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js').then(reg=>{
    if(reg.waiting) showUpdateBanner();
    reg.addEventListener('updatefound',()=>{ const worker=reg.installing; if(!worker) return; worker.addEventListener('statechange',()=>{ if(worker.state==='installed' && navigator.serviceWorker.controller) showUpdateBanner(); }); });
  }).catch(()=>{});
  navigator.serviceWorker.addEventListener('controllerchange',()=>{});
}
function showUpdateBanner(){ $('#updateBanner').classList.remove('hidden'); }
function toast(msg){ const el=$('#toast'); el.textContent=msg; el.classList.remove('hidden'); clearTimeout(toast._t); toast._t=setTimeout(()=>el.classList.add('hidden'),2300); }

init();
