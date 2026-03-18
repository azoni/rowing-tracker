# Row Crew - Development Guide

## Workflow

- **Commit each feature separately** — don't batch multiple features into one commit
- **Don't push until told** — commit locally, only push when the user says to
- **Always run `CI=true npm run build`** before committing — Netlify treats warnings as errors (`no-unused-vars`, `exhaustive-deps`, etc.)
- **Deploy Cloud Functions separately** — `firebase deploy --only functions` after pushing. Netlify auto-deploys the frontend but functions need manual deploy.
- **Deploy Storage rules** — `firebase deploy --only storage` when rules change

## Tech Stack

- **Frontend**: React (CRA), single `App.css`, components in `src/components/`
- **State**: All state in `App.js` via `AppContext` provider — no Redux/Zustand
- **Backend**: Firebase (Firestore, Cloud Functions, Storage, Auth)
- **Hosting**: Netlify (auto-deploys from main)
- **AI**: Claude API called from Cloud Functions for photo verification
- **Site ID**: Netlify `7422eeed-310a-47d2-987f-9906a87f1c30`
- **Firebase Project**: `rowing-tracker-c1e5e`

## Key Patterns

- CSS variables defined in `:root` in `App.css`, overridden by themes (`src/constants/themes.js`) and holidays (`src/constants/holidays.js`)
- All constants barrel-exported from `src/constants/index.js`
- Firebase Storage uploads use `uploadBytes` with blob conversion (NOT `uploadString` — that silently fails)
- Admin-only features check `isAdmin` from context
- Test mode: `testMode` state — `'dry'` (no save), `'review'` (save to pending, no stats)
- Temp Cloud Functions for one-off admin tasks: deploy HTTP function with secret key, call via curl, delete after

## Common Gotchas

- **ESLint on CI**: `CI=true` makes all warnings fatal. Always check for unused vars/imports before pushing.
- **Firestore composite indexes**: `where()` + `orderBy()` on different fields needs an index in `firestore.indexes.json`. Deploy with `firebase deploy --only firestore:indexes`.
- **Storage rules**: Require `contentType` to match `image/*` and `auth.uid == userId` in path. Path is `row-images/{userId}/{entryId}.jpg`.
- **Holiday themes**: Auto-activate by date in `getActiveHoliday()`. Dynamic holidays (Easter, Thanksgiving) computed per year.
- **Monthly throwdowns** (participation goals) and **monthly challenges** (competitive top-3) are defined in `HomeTab.js`. Admin panel mirrors them in `AdminPanel.js`.
