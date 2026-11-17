# Prompt library

Copy a prompt, replace the bracketed slots, keep one accent colour. Every
prompt assumes a deterministic HTML stage (see `assets/stage.js`) rendered at
30 fps.

## Brief template

```text
Logline: one sentence, one idea.
Format: [9:16 1080x1920] · 30 fps · [6]s · [loop | hold]

Beats
0.0–0.6  [setup: background, grid, glow]
0.6–2.0  [main reveal]
2.0–3.4  [accent moment: wipe, counter, highlight]
3.4–4.8  [secondary line / data]
4.8–6.0  [end card, hold 0.8s]

Palette: [#0a0a0b] background, [#f5f1e8] ink, [#ffd166] accent, [#8a857c] muted
Type: [Inter 700 display, mono uppercase labels at 0.22em tracking]
Motion: entrances [outExpo], wipes [inOutCubic], ambient [inOutSine]
Transitions: [mask reveal, sweep]
End card: [mark + wordmark + one line]
Sound: [optional cues at 0.8s, 3.2s, 5.6s]
```

## Style bible (defaults)

- Stage `#0a0a0b`, ink `#f5f1e8`, accent `#ffd166`, muted `#8a857c`.
- Display type: Inter 700, tracking `-0.04em`. Labels: mono, uppercase,
  `0.22em` tracking.
- Entrances: `outExpo` for type, `outCubic` for cards, `outBack` for badges.
- Wipes: `inOutCubic`. Ambient loops: `inOutSine`.
- Grain at 8–12%, one soft glow, one vignette. Nothing else.

---

## Product UI

**1. Dashboard card**
A 6-second vertical product clip: a dark analytics card rises from below with a
soft shadow and settles at 1.4s. Inside, three bars grow left to right with a
70ms stagger, the KPI counts 0 → 12.4k, and a sparkline draws across. At 3.6s
the card tilts 4° and exits, leaving the accent word "Live" on screen. Palette
deep charcoal, warm gold accent, off-white ink. Entrances `outExpo`, card exit
`inOutCubic`.

**2. Terminal session**
A 7-second 16:9 terminal clip: a window frame fades in, a prompt types
`npm run agents` with a blinking caret, three activity lines appear one by one
with a colored dot and timestamp, and a credit counter ticks up. At 5s a final
line locks in green and the whole window scales down into a corner. Mono type
throughout, accent gold for the prompt, green for success.

**3. Bento cascade**
A 5-second 1:1 grid clip: nine feature tiles cascade in with 40ms stagger and a
2° rotation each, settling into a bento layout. One tile stays highlighted and
pulses once at 3.2s while a short label crossfades. Palette near-black tiles,
one warm accent tile, muted labels. No camera movement.

**4. Command palette**
A 6-second vertical clip: a dark command palette drops from the top with
`outBack`, a search line types, five results stagger in with icons, the third
row highlights, and a checkmark draws at 4.4s before the palette fades to an
end card. Mono labels, accent highlight bar, soft backdrop blur.

---

## Kinetic type

**5. Masked word reveal**
A 5-second vertical type clip on a near-black stage: the word "MOTION" reveals
letter by letter from behind a mask, 85ms stagger, `outExpo`, each letter
lifting with a 4° rotation. At 2.2s a white band sweeps across the word with
`mix-blend-mode: exclusion`, inverting the type as it passes. Hold to 4.6s, then
an end card with the mark and a one-word subline.

**6. Split-flap swap**
A 6-second 1:1 clip: a split-flap board shows three words in sequence ("BUILD",
"SHIP", "REPEAT"), each character flipping on the vertical axis with 60ms
stagger. Accent colour underlines the active word. End on a monogram.

**7. Tracking collapse**
A 5-second 16:9 clip: the word "M O T I O N" starts with wide tracking, then the
letter spacing collapses to tight over 2.4s with `inOutCubic`, while the type
scales up 8%. A thin accent line draws underneath, then the composition fades to
a single dot.

**8. Vertical stack with parallax**
A 6-second 9:16 clip: three lines of type stack vertically, each entering from a
different side (left, right, bottom) with 120ms offsets. Behind them, giant
ghosted letters drift in the opposite direction for depth. One accent word
inverts on a solid block at 3.6s.

---

## Charts and data

**9. Line draw**
A 5-second 16:9 data clip: axes and grid fade in first, then a line draws left
to right over 1.6s with a dot riding the tip, the area beneath fills with a
vertical gradient, and a tooltip appears at 3.2s with the peak value. Muted axis
labels, accent line, `outCubic` for the draw.

**10. Bar race**
A 6-second horizontal bar race: five labelled bars start equal, then reorder
three times with smooth `inOutCubic` interpolation while values count up. The
winning bar turns accent-coloured and the rest dim at 5s.

**11. Donut progress**
A 4-second 1:1 clip: a thin ring draws from 0 to 72% with a rounded cap while the
number counts in the centre, a small label fades in below, and the ring pulses
once at the end. Accent ring on a dark card, mono numerals.

---

## Diagrams

**12. Node graph assembles**
A 6-second clip: a central hub pops in first, then six agent nodes appear around
it with 90ms stagger, each connected by a dashed line that draws outward.
Pulses travel along three of the lines, and the hub's orbit ring starts
rotating. Muted connectors, accent hub.

**13. Step flow**
A 5-second 16:9 clip: four steps appear left to right, connectors drawing
between them, each step checking off in sequence with a small scale pop. The
final step unlocks a result card that slides up.

---

## Particles

**14. Galaxy dust**
A 6-second vertical clip: a bright vertical beam lands at 55% height and blooms
into a wide flare. Around the impact, three spiral arms of warm dust rotate
slowly, with individual particles trailing along their orbit. Grain and a soft
vignette. No text until the last second.

**15. Starfield warp**
A 5-second 16:9 clip: dots accelerate outward from the centre in three depth
layers, streaks lengthening with speed, then decelerate into a ring that snaps
into a logo mark. Monochrome with one accent streak.

---

## Shapes

**16. Morphing blob**
A 5-second 1:1 clip: an organic blob morphs through four states (circle, blob,
squircle, circle) using border-radius interpolation, with a gradient that shifts
hue slightly. A wordmark fades in on top at 3.6s.

**17. Grid wave**
A 5-second clip: a 12×12 grid of squares ripples outward from the centre with a
45ms radial stagger, peaks, and settles. Accent squares light up along one
diagonal. Use `seeded()` for subtle per-cell variation.

---

## Code and developer

**18. Typing with syntax colours**
A 6-second vertical clip: a code panel types a short function with syntax
highlighting, the cursor blinks on a fixed cadence, then a test line appears and
pulses green. Mono type, muted panel, accent keywords.

**19. Diff reveal**
A 5-second 16:9 clip: a diff view fills line by line, red lines sliding out,
green lines sliding in, then a "merged" badge pops at 4s and the panel collapses
to a single commit line.

---

## Phone

**20. Device reveal**
A 6-second 9:16 clip: a phone frame rotates in from 12° with `outBack`, the
screen content fades up, a notification drops from the top at 3s, and the
device settles centred with a reflection. Accent notification, muted chrome.

---

## Loop variants

For looped clips, drive ambient motion with a full sine period over the
duration, e.g. `Math.sin((t / duration) * Math.PI * 2)`, and make the first and
last frame identical. Reveals should finish by 80% of the duration.
