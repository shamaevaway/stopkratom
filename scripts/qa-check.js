const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const required = ['index.html','styles.css','app.js','sw.js','manifest.webmanifest','firebase-config.js','firebase/firestore.rules','docs/PRIVACY_POLICY.md','docs/TERMS.md','docs/DISCLAIMER.md'];
let failed = false;
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) { console.error('MISSING', file); failed = true; }
}
const app = fs.readFileSync(path.join(root,'app.js'),'utf8');
const bad = ['eval(', 'innerHTML=location', 'document.write('];
for (const b of bad) if (app.includes(b)) { console.error('FORBIDDEN_PATTERN', b); failed = true; }
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
for (const id of ['ageGate','onboarding','lockScreen','appShell','sheet','toast']) {
  if (!html.includes(`id="${id}"`)) { console.error('MISSING_UI_ID', id); failed = true; }
}
try { JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8')); } catch(e) { console.error('BAD_MANIFEST_JSON', e.message); failed = true; }
console.log(failed ? 'QA FAILED' : 'QA OK');
process.exit(failed ? 1 : 0);
