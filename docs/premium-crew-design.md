# Row Crew: a shared boathouse

Design plan, 25 October 2026. Preserve the existing navy/gold identity and real rowing data; make the app easier to read and more rewarding to use.

## Visual system

- Deep water `#1a2744`: the existing background.
- Boathouse navy `#243352`: meaningful grouped surfaces.
- Crew gold `#d4af37`: primary actions and progress (existing gold, promoted to the primary accent after contrast review).
- Warm white `#f5f1e8`: primary text.
- Mist `#a8b5c9`: supporting text with readable sizes.
- Slate `#3d4f6f`: structural dividers.

Use the existing theme variables so alternate and seasonal themes keep working. Retain DM Sans for the interface and tabular metrics; retain Bebas Neue for the Row Crew wordmark. Titles 28–36px, section headings 18–20px, body 15–16px, supporting text at least 13px where space permits. Left-align reading content and align numeric columns consistently.

## Layout

A compact rowing photograph gives Home its character. The photograph has no text baked into it, no essential controls, and no competing chart overlays. Actual weekly activity leads directly below it. Wider screens gain useful columns; phones retain a single readable flow and the existing bottom navigation.

```text
Row Crew / shell mark                       account
--------------------------------------------------
Hey, Alex.                           today's date
| a crew on open water / one editorial photograph |
| Your week / distance       rows / active days   |
| Monday ------------------------------- Sunday  |
| Log a row                          View logbook |
| Crew journey / open the world map              |
--------------------------------------------------
Monthly missions             Next achievements
Crew challenge               Recent sessions
--------------------------------------------------
Home       Crew       Log row       Board   Progress
```

Crew Log prioritizes readable sessions, clear filters, verification state, and member interaction. Leaderboards expose scope, counting rules, and the current period. Progress shows the weekly chart without an extra disclosure step, explains incomplete time coverage, and makes achievements searchable.

## Principles and self-review

The memorable element belongs to rowing: a real-looking shell on water and a small original shell mark. Avoid generic dashboard decoration, multiple stock-photo cards, nautical novelty, decorative metric trends, and invented physiological insights. Keep existing data tables and useful interactions. Round and group related surfaces without giving every paragraph its own card.

An early dashboard concept would have added another four-card summary before the existing weekly totals. Remove it: the weekly card already answers the immediate question. Use that space for the rowing image and improve the existing numbers instead. Keep readable metadata rather than small uppercase labels. Motion should be brief and purposeful: a single settling image entrance, interaction feedback, and full reduced-motion support; no perpetual ambient movement.

## Verification

Use synthetic members and workouts in a local component preview that never imports App.js or Firebase. Check mobile widths down to 320px, wider layouts, light/dark themes, keyboard navigation, reduced motion, empty states, filtering, and chart/table agreement. Run focused selector/component tests and a warning-free CI production build before each feature commit. Follow CLAUDE.md: local commits; push only when requested.
