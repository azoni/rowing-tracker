# Separate follow-ups found during the UI review

These source observations are outside this visual pass. They are not claims about currently deployed security rules, and this pass did not contact the related services or change cloud configuration.

## Data and badge persistence

The read-only UI now derives rankings and achievement progress from eligible rows while preserving saved unlocks. Existing achievement persistence in `App.js` still has raw-entry inputs and a delayed callback that can use pre-save state. Historical counters and previously saved badge provenance have not been repaired. A separate task should reproduce this with isolated fixtures/emulators and update the write path deliberately, with a migration plan if historical data needs repair.

## Review existing authorization boundaries

- `firestore.rules` and corresponding Cloud Functions should be reviewed together for profile creation/update permissions and the trust placed in client-writable admin/counter fields. Confirm the actually deployed rules before drawing conclusions about live access; add emulator tests before changing them.
- `App.js` includes browser-side shared-secret values in cross-application workout-forwarding requests. A browser bundle cannot keep such values confidential. Review server-side authorization and secret rotation with the affected service owner; preserve the intended user consent and integration behavior. Do not copy values into issues, logs, screenshots, or documentation.

No secret values are included here. These concerns should receive their own reviewed implementation and deployment rather than being mixed into UI changes.
