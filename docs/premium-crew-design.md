# Row Crew: the expedition journal

Revised 25 October 2026 after the user rejected the first pass as insufficiently premium. World distance must lead Home and real sessions must lead Crew. The weekly-first photo layout was too tall, and flat colored badge icons did not provide the requested artwork quality.

## Visual system

- Deep water `#101f30`: canvas.
- Maritime navy `#192d40`: grouped surfaces.
- Sea enamel `#235660`: secondary accents.
- Champagne brass `#d6bc7d`: progress and actions.
- Warm ivory `#f5f1e8`: primary text.
- Mist `#a8b8c8`: secondary text.

Preserve theme variables for alternate themes. DM Sans handles controls and body copy, Bebas Neue handles the wordmark and significant distances, and Georgia adds an editorial voice to major titles. Body copy is 15–16px; compact supporting labels remain readable. The artwork provides richness without another font dependency.

## Layout

```text
HOME                                  CREW
Row Crew / shell mark       account    Row Crew / shell mark    account
Hey, Alex.                            Crew log               Log row
AROUND THE WORLD, TOGETHER             Search sessions / rowers
Actual crew km        brass globe     All / Rows / Milestones
World progress + next port            Today
Explore the journey                   Name             distance
--------------------------------      Time / pace / source
Your week / compact real metrics      Reactions / comments
Log a row / logbook                    More sessions…
--------------------------------      Optional weekly pulse / groups
Next badges / recent rows
Monthly missions / challenge
```

Desktop uses side-by-side art and data and an optional Crew sidebar. At 390×844 and 320×740, the first session must appear above the fixed bottom navigation without scrolling. Decorative art must not displace essential information on phones.

## Artwork and interaction

The globe is a decorative maritime object, not a crew location indicator. Journey numbers, percentage and next stop use the same real helper as the map. Nine enamel medallions create category families for the existing achievements. Names, criteria, levels, dates and exact progress remain HTML. These are nine category illustrations, not nine new achievements or 111 unique illustrations.

Self-review: more colored icons and rounded boxes did not satisfy the brief. Replace badges with coherent tactile artwork at useful sizes, flatten the session ledger, and give the shared journey priority. Avoid invented trends, excess nautical props, oversized decoration and continuous motion. Hover movement is small, interruptible and disabled for reduced motion. Main actions remain accessible by keyboard.

## Verification

Use the isolated synthetic preview without Firebase writes. Inspect viewport screenshots as well as full pages; measure the first Crew session and world hero against bottom navigation. Check 320/390/1440px, light theme, empty/guest/loading states, 200% zoom, artwork loading and complete sprite cells, keyboard/focus, map callbacks and unchanged selectors. Run appropriate tests and a CI production build before local commits. CLAUDE.md requires explicit instruction before pushing.
