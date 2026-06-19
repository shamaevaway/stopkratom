# QA checklist

## Data logic

- Empty days do not appear as successful days.
- Streak counts only days with real data.
- A missed day breaks the streak.
- Editing yesterday preserves date and time correctly.
- Moving an entry to another date updates both days.
- CSV export opens in Excel with correct columns.
- JSON export imports into a fresh browser.

## Cloud

- User A cannot read User B data.
- Sign up uploads local data.
- Sign in downloads existing cloud data.
- Offline entries sync after reconnect.
- Cloud delete removes Firestore user day docs.

## UX

- iPhone SE width: no clipped buttons.
- iPhone Pro Max width: no oversized cards.
- Android Chrome: bottom nav safe area OK.
- Dark mode: all text readable.
- Thai text does not overflow buttons.

## Safety

- 18+ gate appears on fresh install.
- Disclaimer accessible before and after onboarding.
- No wording says the app treats addiction.
- No kratom purchase/sourcing advice exists in UI.

## Release blockers

- Firebase config placeholders must be replaced.
- Privacy policy URL must be live.
- Support email must be real.
- Legal review must be completed before commercial launch.
