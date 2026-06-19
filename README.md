# Tea Taper — Production Cloud PWA / Capacitor-ready

Private kratom tea reduction tracker focused on intake journaling, wellbeing check-ins, taper goals, local-first storage, optional cloud sync, and store-readiness documentation.

## Current build

- Version: `4.0.0-production-cloud`
- Runtime: static PWA, no build step required
- Cloud: Firebase Auth + Cloud Firestore, optional until configured
- Store path: PWA first, then Capacitor wrapper for Google Play / App Store
- Medical positioning: personal tracking / journaling only, not a medical device

## Key product functions

1. 18+ gate and medical disclaimer gate.
2. Onboarding: language, baseline ml/day, weekly reduction %, PIN.
3. Daily intake entries with date, time, ml, note.
4. Edit any day, including yesterday.
5. Delete entries and clear day.
6. Honest calendar: no-data days are neutral, not counted as success.
7. Correct streak: only real data days count.
8. Progress graph: fact / target / 7-day average.
9. 15 wellbeing metrics with 0–10 buttons, no sliders.
10. Trigger tracking and helper tracking.
11. Relapse / over-target scenario without shame framing.
12. 10-minute urge timer and 4–4–6 breathing prompt.
13. Weekly report copy/share.
14. JSON and CSV export/import.
15. Local PIN stored as hash + salt.
16. Optional Firebase account and cloud sync.
17. User-scoped Firestore Security Rules.
18. Privacy, Terms, Disclaimer, Install guide in app and docs.
19. Offline-first service worker.
20. App update banner when service worker detects a new version.

## Firebase setup

1. Create Firebase project.
2. Enable Authentication:
   - Email/password
   - Anonymous sign-in, optional
3. Enable Cloud Firestore.
4. Copy Web App config into `firebase-config.js`.
5. Deploy rules from `firebase/firestore.rules`.
6. Open the app and create an account from Profile → Account and cloud.

See `docs/FIREBASE_SETUP.md`.

## Local test

```bash
npm install
npm run qa
npm run serve
```

Then open:

```text
http://127.0.0.1:5173
```

## Deploy as PWA

Upload these files to GitHub Pages, Firebase Hosting, Cloudflare Pages, Netlify, or Vercel:

```text
index.html
styles.css
app.js
sw.js
manifest.webmanifest
firebase-config.js
icons/
```

For a public launch, use a real domain and HTTPS.

## Build for Google Play / App Store with Capacitor

```bash
npm install
npx cap init TeaTaper app.teataper.tracker --web-dir .
npx cap add android
npx cap sync
npx cap open android
```

For iOS:

```bash
npx cap add ios
npx cap sync
npx cap open ios
```

You still need Android Studio / Xcode, store developer accounts, screenshots, privacy forms, and review compliance.

## Compliance notes

This app is intentionally positioned as a private reduction journal and wellbeing tracker. It must not sell, advertise, recommend sources for, or promote kratom use. It must not claim to diagnose, treat, cure, or prevent any condition.

Official policy references to review before submission:

- Google Play Health Content and Services policy: https://support.google.com/googleplay/android-developer/answer/16679511
- Google Play Health apps declaration: https://support.google.com/googleplay/android-developer/answer/13996367
- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple App Privacy Details: https://developer.apple.com/app-store/app-privacy-details/
- Firebase Firestore Security Rules: https://firebase.google.com/docs/firestore/security/get-started

Legal review by a qualified professional is still required before public commercialization.
