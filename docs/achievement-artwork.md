# Expedition artwork

Created with the built-in image generation tool on 25 October 2026. These are original decorative illustrations, not maps used for navigation or claims about crew position.

## Delivered files

- `public/images/journey-globe.webp`: 768 × 768, transparent, 210,342 bytes. Brass-and-navy globe for Home.
- `public/images/crew-medals.webp`: 1260 × 1260, transparent, 480,936 bytes. Nine category medallions shared by Home, missions, the Crew feed, Progress, achievement details, and member profiles.

The category order is distance, sessions, streaks / time, calories, pace / habits, fun, milestones. The source sheet has optical spacing rather than exact equal registration. BadgeArtwork uses 394px viewports at x=38/431/824 and y=18/412/805, scaled by CSS, preserving each complete circle. One cached image serves all badges. HTML retains unique achievement names, criteria, progress, category and levels. Category art does not mean every achievement has a unique illustration.

Generated PNG originals remain at `C:/Users/charl/.codex/generated_images/01a16c84-baea-76a0-8c0e-3b73202b78da/`: `exec-6d002ea7-0e97-4b4a-be02-b576f2360d9e.png` (medals) and `exec-50f89abb-cfee-43ae-93fc-d6ecd665f76f.png` (globe). Delivered assets are self-contained in this repository; they do not depend on these local originals. Browser canvas was used only to encode and resize WebP while preserving colors, composition and alpha. No third-party photos were downloaded.

## Medal prompt

Use case: stylized-concept.
Create one production UI sprite sheet for Row Crew, a premium rowing-club app: a cohesive collection of NINE exquisitely crafted collectible achievement medallions arranged in an exact regular 3 by 3 grid on a SQUARE transparent canvas. Each of the nine equal square cells contains exactly one complete centered medallion, diameter 84% of the cell, identical scale and lighting, no overlaps or clipped edges. Actual alpha transparency around each object, no backdrop, no grid lines, no text, letters or numerals anywhere.
Art direction: premium physical enamel rowing-club badges, near-orthographic straight-on product photography, intricate sculpted bas-relief with tangible depth, brushed champagne brass bevels, rich midnight navy and muted sea teal vitreous enamel, warm ivory details, restrained glints and dimensional shadows internal to objects. Elegant heirloom regatta trophy cabinet, not cartoon mobile game or plastic coins. Crisp silhouettes legible at 72px but remarkable fine material detail at 200px. Uniform circular medallion outer silhouette with subtle variations in inner frames.
Nine motifs in exact row-major order:
top left DISTANCE: beautiful raised globe with recognizable continent silhouettes and fine longitude arcs, a tiny rowing shell beneath.
top center SESSIONS: crossed two authentic rowing sculling oars with broad flat blades over three fine water ripples.
top right STREAKS: a sculpted rising sun with seven precise rays above deep sea waves, warm amber enamel center.
middle left TIME: elegant mechanical stopwatch with ivory dial and a single gold hand, no numbers or writing.
middle center CALORIES: single organic sculpted flame in amber and ivory enamel.
middle right PACE: an elegant winged rowing blade angled upward, sea teal enamel and fine swept feather relief.
bottom left HABITS: a navy-and-ivory lighthouse on a small rocky coast, brass beams.
bottom center FUN: a graceful leaping dolphin over a breaking wave, polished ivory enamel.
bottom right MILESTONES: a classic polished rowing regatta trophy cup framed by a slender laurel wreath.
The medals should all belong to one sophisticated series. Clean centered 3x3 registration is critical for CSS sprite use. High quality finished artwork, completely transparent background.

## Globe prompt

Use case: stylized-concept. A single exquisite decorative globe object for the homepage of Row Crew, a premium rowing expedition app. Isolated floating globe on a genuinely transparent background, no stand, no table, no rectangular scene, no text or letters. Square composition, whole sphere visible, center sphere radius 38% of canvas, generous clean margins. Realistic recognizable Earth geography with Atlantic Ocean at center, Americas left, Europe and Africa right. Rich very dark midnight navy seas with fine sea-teal contour texture, raised satin champagne-brass continents, elegant precisely incised fine latitude and longitude rings. A delicate single dotted champagne-gold equatorial orbit surrounds the globe with a tiny anatomically plausible white rowing shell floating just in front of the lower-left edge of the sphere; two paired sculling oars. This orbit is ornamental and has NO location pin, progress marker or numerical claims. Physical crafted cartographic objet d'art, sophistication of a maritime museum and a luxury watch, high-end studio product render, directional warm rimlight upper left, subtle blue bounce, extraordinary crisp metal/enamel material detail with restrained contrast. No neon, no rainbow, no lens flare, no text, no people, no animation frames, no typography. Keep silhouette and detail beautifully legible at 250px. Transparent alpha background.
