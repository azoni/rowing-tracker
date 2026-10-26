# Synthetic component preview

This preview mounts the actual Home, Crew Log, Board, Progress, navigation, map, and logging components against in-memory fixtures. It never imports `App.js` or Firebase. No credentials are required, and fixture callbacks never create real workouts, comments, or reactions.

From the repository root:

```sh
npm ci
node scripts/preview/build.cjs
node scripts/preview/server.cjs
```

Open `http://127.0.0.1:3117`. The server binds only to loopback and accepts GET/HEAD. Rebuild the fixture after source changes. Output goes to ignored `artifacts/preview/`.

Direct screen links accept `?tab=home`, `?tab=feed`, `?tab=leaderboard` and `?tab=more`. The checks assert that the around-the-world panel leads Home and the complete first crew session appears above navigation without scrolling at 390×844 and 320×740. Viewport screenshots and measured geometry are saved with the browser result.

With Playwright available, run `node scripts/preview/check.cjs` for keyboard, filter, chart, record, badge, local-save, empty/loading/guest, motion, and zoom checks. Set `PLAYWRIGHT_MODULE` to an existing package path if needed; `CHROME_PATH` optionally selects a local Chrome executable. Browser requests are restricted to the loopback preview and Google Fonts. Results go to `artifacts/preview-checks/`. Simulated failures validate callback rejection behavior; production callbacks may instead report provider failures through existing global toasts.

Query options: `?light=1`, `?empty=1`, `?guest=1`, `?loading=1`, `?mixed=1`. Combine options with `&`. The preview has synthetic members and relative dates, so it stays useful without live account data. History/settings/profile actions report a local action; they do not claim to exercise the real account modals or provider writes. Upload review uses a generated monitor fixture and does not call an AI service.

The real application's authentication, Firestore subscriptions, image extraction, and server-side persistence still require their separate integration checks. Do not substitute this fixture for those checks or open the production app just to create screenshot data.
