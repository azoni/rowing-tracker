# Premium crew pass: local verification

Verified on 25 October 2026 on `feat/premium-crew-experience`, based on main `7635e0a`.

## Automated checks

- `CI=true npm test -- --watchAll=false --runInBand`: 16 suites, 142 tests passed.
- `CI=true npm run build`: production build compiled successfully with CI warning handling enabled. Existing toolchain notices about browser datasets and deprecated Node APIs remain; there were no application compile or lint warnings.
- Focused ESLint on changed application JS: zero warnings.
- `node scripts/preview/build.cjs`: synthetic component bundle builds.
- `node scripts/preview/check.cjs`: keyboard skip link, notification Escape/focus, image loading, reduced motion, map focus return, search/reset, profile action, reactions, pending comment protection, retained draft on rejected fixture callback, board views, machine-separated records, 12-week chart and table, badge search/details/focus, in-memory manual save, empty/guest/loading, finite motion, and 200% zoom passed.
- Browser suite: no page errors and no unexpected remote requests. Only loopback content and public font files were allowed.

## Visual review

Reviewed 23 synthetic screenshots across Home, Crew, Board, and Progress: 320px, 390px and 1440px widths; navy and Morning Lake; populated, empty, and signed-out states. No horizontal page overflow. The 12-week chart keeps its own horizontal scroll at narrow widths. Full-page captures show the fixed navigation at the capture viewport's position; normal scrolling and keyboard focus were checked separately.

The review led to a desktop crew-goal sidebar, consistent interface headings, theme-aware navigation icons, stronger input boundaries, clearer placeholders, and improved light-theme copy. Generated photo assets are 69KB/205KB WebP, selected responsively. The entrance ends after 1.8 seconds; reduced motion is static.

## Contrast decisions

The default gold now uses the existing `#d4af37`, giving 4.99:1 for small gold copy on the hover surface. Morning Lake supporting text uses `#486976` (at least 5.02:1 on checked backgrounds), and the primary accent uses `#246e88` (5.23:1 for primary-button text). Meaningful chart fills exceed 3:1 in these two themes. Input boundaries and placeholders were strengthened separately; decorative dividers retain the quieter existing border color. Other seasonal themes were not exhaustively audited.

These decisions follow the [W3C text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [non-text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), and the [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md). This is a scoped review, not a claim of complete WCAG conformance.

## Scope and limits

The preview uses fictional people and workouts. History/settings/profile callbacks are checked for correct binding; their production account dialogs and Firebase writes are not exercised by this fixture. Tests of callback rejection do not prove production error delivery because existing provider callbacks can catch errors and display global toasts.

No production data, authentication configuration, Cloud Functions, rules, or deployments were changed. Existing persisted badge unlocks remain preserved. The legacy crew-world-tour total still comes from stored member counters; rankings, personal progress, and the rank dialog now derive from eligible workout rows. Historical-counter repair, badge persistence consistency, and source-observed authorization concerns are recorded in [follow-ups](follow-ups.md).
