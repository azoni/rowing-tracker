# Separate follow-ups found during the UI review

These source observations are outside this visual pass. They are not claims about currently deployed security rules, and this pass did not contact the related services or change cloud configuration.

## Data and badge persistence

The current UI derives the world journey, profile totals, rankings and achievement progress from eligible rows while preserving saved unlocks. The functionality pass replaced the stale delayed award callback: new saves combine the exact persisted row with the latest subscription, deduplicate its ID, and merge only new awards; records now use the same exact setup rules as the board. Historical stored counters and previously saved badge provenance have not been repaired. Any historical cleanup still needs a separate migration plan and isolated validation.

## Review existing authorization boundaries

- `firestore.rules` and corresponding Cloud Functions should be reviewed together for profile creation/update permissions and the trust placed in client-writable admin/counter fields. Confirm the actually deployed rules before drawing conclusions about live access; add emulator tests before changing them.
- `App.js` includes browser-side shared-secret values in cross-application workout-forwarding requests. A browser bundle cannot keep such values confidential. Review server-side authorization and secret rotation with the affected service owner; preserve the intended user consent and integration behavior. Do not copy values into issues, logs, screenshots, or documentation.

No secret values are included here. These concerns should receive their own reviewed implementation and deployment rather than being mixed into UI changes.
