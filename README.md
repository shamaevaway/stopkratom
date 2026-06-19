# Tea Taper — StopKratom Production PWA v3

Offline-first PWA for tracking kratom tea reduction. Data stays locally on the user's device.

## Production changes in v3

- Fixed read-only analytics: charts, calendar, streaks and averages do not create empty days.
- Empty days are neutral/gray and are not counted as success.
- Correct streak logic: only consecutive recorded days within target count.
- Bottom-sheet entry editor instead of browser prompt.
- Date/time/ml/note editing for every intake entry.
- Onboarding with 18+ gate, disclaimer and initial taper plan.
- Bottom mobile navigation: Day, Check-in, Progress, Plan, More.
- 15 wellbeing scales with explicit 0–10 buttons and anchor descriptions.
- Morning and evening check-ins.
- Relapse/over-goal review flow without shaming language.
- Triggers and helpers tracking.
- Insights: top triggers/helpers and sleep-related observations.
- Weekly report copy/share.
- Enhanced CSV with UTF-8 BOM and health columns.
- JSON backup/import.
- PIN stored as hash + salt, not as plain text.
- Privacy / Terms / Disclaimer / Install guide inside app.
- PWA update banner and improved service worker cache versioning.
- RU / EN / TH localization for core UI.

## Deploy to GitHub Pages

Upload the contents of this folder to the root of your repository. `index.html` must be in the repository root.

Then: Settings → Pages → Deploy from branch → main → /root → Save.

## Data compatibility

The app migrates data from previous keys where possible:

- `stopkratom.ultra.v2`
- `stopkratom.production.v1`
- `kratomLog.entries.v1`

Before updating a live install, export JSON as a backup.

## Disclaimer

This is not a medical device. It does not diagnose, treat, prescribe, or replace medical advice.
