# Firebase setup

## 1. Create project

Create a Firebase project and add a Web App.

## 2. Authentication

Enable:

- Email/password
- Anonymous sign-in, optional

## 3. Firestore

Create Cloud Firestore in production mode.

## 4. Config

Replace placeholders in `firebase-config.js`:

```js
window.TEA_TAPER_FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
```

## 5. Security rules

Deploy `firebase/firestore.rules`.

The rules are user-scoped:

- `users/{uid}/days/{date}`
- `users/{uid}/private/profile`

Only the authenticated owner can read or write their own documents.

## 6. Production checklist

- Enable App Check before public launch.
- Set Firestore budget alerts.
- Add abuse monitoring.
- Disable anonymous auth if you only want verified accounts.
- Add Cloud Functions for account deletion audit if needed.
- Do not store raw PIN in Firestore.
