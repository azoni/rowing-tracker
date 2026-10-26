# Row Crew: night water (Claude redesign proposal)

A design proposal on branch `design/claude-premium`, built to compare with the live "expedition journal". Nothing here
changes data, rules, Cloud Functions or how rows are counted.

## The idea

Row Crew is one boat. Each member brings a blade colour, every row moves the same boat, and the interface stays
quiet so the crew and their numbers carry the colour. Rowing supplies the visual language: water before dawn, the lane
rope with its buoys, oar blades in club colours, and the race board where results are read at a glance.

## Tokens

| Token | Value | Role |
| --- | --- | --- |
| Night water | `#0A1C22` | canvas |
| Hull | `#0F272E` | raised surfaces: sheets, inputs, navigation |
| Lane rope | `#1E3940` | dividers, tracks, quiet borders |
| Chalk | `#EEF3F0` | primary text and the primary action |
| Fog | `#9CB2B4` | secondary text |
| Crew blades | cerise, Cambridge blue, saffron, mint, coral, lilac, lime, rose | one per member, from their id |

Type is one family, Archivo, used at two widths: condensed and heavy for distances and results, normal width for
everything else. Labels are sentence case. Numbers are tabular.

## Layout

```text
PHONE                                   DESKTOP (≥1024px)
Row Crew mark            bell  avatar   ┌──────┬─────────────────────────────────┐
Good morning, Alex.            Mon 26   │ mark │ Good morning, Alex.             │
                                        │ Home │ The crew has rowed   28.25 km   │
The crew has rowed                      │ Crew │ Seattle ●───────○─── Portland   │
28.25 km                                │ Log  │ crew blades strip               │
Seattle ●────────○───── Portland        │ Board├────────────────┬────────────────┤
322 km to Portland                      │ Prog │ Your week      │ Next wins      │
crew blades: who moved the boat         │      │ Logbook        │ Missions       │
[Explore map]                           └──────┴────────────────┴────────────────┘
Your week · rhythm dots · Log a row
Next wins · Logbook · Missions
```

Phones keep the bottom bar; at 1024px and wider it becomes a left rail so content gets the full width.

## Principles

- The crew is the colour. Chalk on night water for the interface; blades, avatars and the journey strip carry each
  member's colour.
- Lanes, not boxes. Structure comes from lane ropes and spacing, not a card around every block.
- Numbers first, set like a race board: big condensed figures, quiet units.
- One moment per screen: the lane to the next port on Home, the day's log on Crew, the lanes on the Board, the chart on
  Progress.
- Same rules as before: real values only, units stay explicit, keyboard focus visible, reduced motion respected.
