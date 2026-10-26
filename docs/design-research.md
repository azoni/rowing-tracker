# Row Crew design research

Primary-source research checked **25 October 2026**. This supports the [premium crew design](premium-crew-design.md), with emphasis on readable rowing data, useful community context, and restrained motion. An undated source below had no displayed publication date; the check date is not its publication date.

## Sources and decisions

| Primary source | Published or updated | What it contributes to Row Crew |
| --- | --- | --- |
| [Concept2 pace calculator](https://www.concept2.co.uk/training/pace-calculator) | Undated | Defines the relationship between distance, time, and 500m split. Row Crew retains `500 × seconds / meters`, shows the unit, and explains that a lower time is faster. |
| [Concept2 Logbook help](https://log.concept2.com/help/) | Undated | Separates lifetime meters, seasonal totals, ranking eligibility, and verification. Official ranking pieces require exact distance or time and exclude intervals; direct uploads and monitor codes have specific verification meaning. Row Crew must describe its own comparison and photo-review rules clearly. |
| [Concept2 ErgData](https://www.concept2.com/ergdata) | Undated | A rowing-product reference for clear numbers, selectable data views, table views, community participation, and accessible display choices. It also illustrates why sensor-derived statistics require actual sensor data. |
| [Concept2 challenge calendar](https://log.concept2.com/challenges) | 2026 calendar | Demonstrates explicit dates and qualifying requirements for individual and team achievements. Row Crew keeps challenge rules and real progress visible instead of presenting decorative completion scores. |
| [Strava Clubs](https://support.strava.com/en-us/articles/15402172-clubs-on-strava) | 16 September 2026 | Describes activity eligibility, ranking units, current/previous weeks, reset timing, and a separate club feed. Row Crew exposes leaderboard scope and counting rules while keeping the crew log focused on actual activity and interaction. |
| [Garmin Connect home customization](https://support.garmin.com/en-AU/?faq=35qboQSvKC2WpKkTaDaRP7) | Undated | Its larger In Focus cards and smaller At a Glance cards demonstrate a useful hierarchy. Row Crew uses prominent primary information and quieter supporting metrics; this does not require copying Garmin's full customization system. |
| [W3C: Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) | Updated 16 September 2025 | Supports disabling nonessential interaction motion and honoring reduced-motion preferences. This criterion is Level AAA; it is not an AA requirement. Row Crew retains its reduced-motion handling and limits added motion to brief interaction feedback. |
| [W3C: Complex Images](https://www.w3.org/WAI/tutorials/images/complex/) | Updated 8 April 2026 | Explains textual equivalents for chart values, relationships, and trends. Row Crew retains accessible weekly and benchmark tables alongside the chart and selected-week summary. |
| [HUDSON: SHARK Anatomy](https://www.hudsonboatworks.com/anatomy) | Undated | An authentic reference for rowing-shell proportions, riggers, and equipment. It informs subject accuracy when creating original rowing illustrations; it is not a source of freely reusable artwork. |
| [Henley Royal Regatta](https://www.hrr.co.uk/) | Current site; undated | An authentic reference for crews, racing shells, and rowing's riverside setting. It supports an editorial rowing theme rather than generic nautical decoration. Asset provenance is documented separately. |

These are reference products and standards, not endorsements, integrations, or claims that Row Crew follows another service's ranking rules.

## Implemented presentation decisions

### Home and crew log

- Preserve the navy/gold identity and existing theme variables. Use inherited interface typography, readable metadata, and tabular figures rather than introducing a separate type system for every screen.
- Keep actual personal weekly activity and the existing logging action prominent. One rowing image supplies context without covering charts or controls.
- Present real activity as dated entries with distance, optional recorded time and pace, and explicit review status. The crew-log summary identifies the counted rows currently in view; it does not imply a total for unseen pages.
- Retain the cooperative crew-goal panel, member recognition, and existing social callbacks. A crew goal is an app engagement target, not a prescribed training load.

### Progress

- Show the distance chart immediately. Keep 4-week and 12-week rolling windows explicit and distinguish them from calendar-week leaderboard totals.
- Use real proportional bar heights, including zero-height bars for empty weeks. Selection exposes exact meters, row count, and active days; a table remains available for all weekly values.
- Explain time coverage as recorded rows out of total rows. Missing time is not estimated or displayed as zero exercise time.
- Preserve the existing analytics selectors: saved manual and verified rows count; pending reviews, test rows, invalid records, and future dates are excluded. Percentage comparisons remain unavailable when there is no previous baseline.
- Retain the existing repeat-benchmark grouping by recorded distance, machine, and workout type. Explain pace per 500m and retain the warning that effort and machine settings may differ. This is a session comparison, not an inferred change in fitness.
- Make achievements searchable by name and qualifying description, with status, category, and level filters. Retain actual progress, badge-detail actions, and earned dates. Older badges without dates do not receive invented dates or a claim that they were the latest unlock.
- Clarify that Marathon Rower is a cumulative 42,195m achievement and that calorie achievements describe recorded calories. Achievement IDs and qualifying criteria remain unchanged; food-equivalence copy is removed.

### Leaderboards and interaction

- Make group, period, ranking metric, and eligibility understandable before comparing people. Calendar-week boundaries should agree across the home summary, crew goal, and weekly board.
- Distinguish participation volume from performance records. Equipment and workout setup matter when comparing recorded times; Row Crew photo verification is not Concept2 verification or certification.
- Keep keyboard-operable actions, visible selection and focus states, and reduced-motion support. Visual emphasis does not replace labels or exact values.

## Data and interpretation limits

The app records distance, date, user, optional time and calories, machine, workout type, and verification state. The refinement does not invent stroke-rate traces, heart-rate zones, training readiness, recovery scores, predicted race times, or personal training prescriptions. More logged distance is not automatically better fitness; a changed pace is not proof of a physiological improvement.

Concept2's official rankings use their own equipment and rules. Row Crew supports several machine brands and its own review workflow. Familiar rowing units and benchmark distances do not make its records official or equivalent across equipment.

The weekly crew-goal formula uses prior completed weeks plus an app-defined increment. Its purpose is shared participation. It should not be described as a recommended, safe, or optimal training progression.

## Local preview and production boundary

The component preview in `scripts/preview/fixture.jsx` uses explicitly synthetic in-memory members and workouts. It renders the actual UI without importing `App.js` or Firebase. Preview totals, profiles, comments, and reactions are test fixtures, not real activity or evidence of production usage.

The UI refinement preserves production authentication and write callbacks. Local previews and component tests do not prove production deployment, provider configuration, or successful remote writes. Browser checks, build results, image provenance, and any release verification belong in their own records; this research document does not claim those checks passed.

No external-service write, database migration, credential change, or automatic deployment is required by this research. Follow the repository workflow in `CLAUDE.md` for build, commit, and separately authorized publishing steps.
