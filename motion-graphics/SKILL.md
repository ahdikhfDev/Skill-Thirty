---
name: motion-graphics
description: Create short motion-graphics videos from a written brief or prompt, by building a deterministic HTML animation stage and rendering frame-accurate MP4, WebM or GIF with Playwright and ffmpeg. Use for kinetic type, product-UI demos, chart or diagram animations, particles, logo stings, promo clips, or any prompt-to-video request.
---

# Motion graphics from a prompt

Produce a short motion-graphics video (3–10s) from a brief: write the prompt,
build a deterministic HTML/CSS/JS stage, render it frame by frame, review the
frames, iterate. The deliverable is a video file plus the prompt and the source
that made it.

This mirrors how prompt-motion style clips are made: a written brief becomes
code, the code renders to video.

Rendered sample: `examples/kinetic-type.mp4` (6s, 1080×1920) with its source
`examples/kinetic-type.html` and poster.

## Ground rules

- **Determinism**: every pixel is computed from `t`. No `Date.now()`, no
  `Math.random()` (use `seeded(i)`), no CSS animations or transitions. The same
  file must render the same video on any machine.
- Default to **30 fps**, 9:16 (1080×1920) unless the brief says otherwise.
  Other common formats: 1:1 1080×1080, 16:9 1920×1080.
- One idea per video. A 6-second clip with three concepts reads as noise.
- Render and look at actual frames before claiming it is done.
- No network requests while rendering: self-host fonts and images.

## Phase 0 — Brief and format

Ask, or infer from the request:

| Slot | Examples |
|---|---|
| Purpose | promo, feature reveal, chart explainer, logo sting |
| Format | 9:16 · 1:1 · 16:9, fps, duration |
| Copy | headline, subline, labels, numbers |
| Palette | 3–5 hex values, one accent |
| Type | family, weights, mono for labels |
| Motion | calm, punchy, mechanical, organic |
| End state | hold, loop, end card |

Write a one-line logline. If you cannot, the brief is not ready.

## Phase 1 — Write the prompt

Use the structure and examples in `references/prompts.md`. A good prompt has:

1. logline
2. scene beats with timestamps
3. palette and type
4. motion language (easings, amplitudes)
5. transitions and end card
6. optional sound cues

Keep the prompt in the deliverable: it is what the user will reuse.

## Phase 2 — Build the stage

Copy `assets/stage.js` next to your HTML, then follow
`examples/kinetic-type.html`.

```html
<script src="stage.js"></script>
<script>
  const { Stage, ease, range, lerp } = window.Stage;
  const stage = new Stage({ duration: 6 });
  stage.add((t) => {
    const p = ease.outExpo(range(t, 0.4, 1.2));
    el.style.transform = `translateY(${(1 - p) * 110}%)`;
  });
</script>
```

Rules:

- Root `.stage` fills the viewport; size type in `vmin` so any format works.
- Keep safe margins at 6–8vmin. Nothing important near the edges.
- Reveal text with masks (`overflow: hidden` + translate), not fades alone.
- Animate `transform`, `opacity`, `filter`; never `top/left/width/height`.
- Use `window.__seek(t)` for every visual; the renderer calls it per frame.
- Load the page with `?render=1` to disable autoplay while rendering.

Helpers available: `clamp`, `lerp`, `map`, `range`, `seeded`, and easings
(`outCubic`, `outExpo`, `inOutCubic`, `outBack`, `inOutSine`, …).

## Phase 3 — Render

Run it from a folder that has `playwright-core` installed. The script resolves
Playwright from the current working directory, so it can stay in the skill
folder.

```bash
npm i playwright-core

# your own page (keep stage.js next to it)
node ~/.agents/skills/motion-graphics/scripts/render.mjs \
  --page my-clip.html --out out/clip.mp4 --duration 6 --fps 30 --size 1080x1920

# the bundled example (its root is the skill folder)
node ~/.agents/skills/motion-graphics/scripts/render.mjs \
  --root ~/.agents/skills/motion-graphics \
  --page examples/kinetic-type.html \
  --out out/kinetic.mp4
```

On Windows `cmd.exe`, replace `~` with the full path to your home directory.

Formats: `mp4` (H.264, default), `webm` (VP9), `gif` (two-pass palette).
The script also writes `<name>-poster.png` (a frame at ~80%) and keeps frames
with `--keep`.

Review: build a contact sheet, check the first frame, the transitions and the
last frame.

```bash
ffmpeg -i out/clip.mp4 -vf "fps=2,scale=270:-1,tile=4x2" -frames:v 1 sheet.png
```

## Phase 4 — Polish

- Add grain, glow and a vignette before adding more elements.
- One easing family per clip; do not mix five curves.
- Text must stay legible at 270px wide: minimum ~4vmin cap height.
- Hold the end card for at least 0.8s; a clip that ends mid-motion feels cut.
- For loops, make frame 0 and the last frame match.
- Check contrast against the actual background, not in isolation.

## Phase 5 — Deliver

Return:

- the video (`mp4`), the poster (`png`), the prompt (`md`), the source (`html`)
- a one-line summary: duration, fps, size, file size
- the exact render command so the user can re-render

Delete `.frames/` unless the user asked to keep them.

## Recipes and prompts

- `references/prompts.md` — brief template and 20 ready-to-adapt prompts by
  category (product UI, kinetic type, charts, diagrams, particles, shapes,
  code, phone).
- `references/recipes.md` — code recipes for masked reveals, counters, SVG path
  draw, bars, donuts, particles, beam sweeps, camera pushes, end cards.

## Anti-patterns

- CSS `@keyframes` in the stage (non-deterministic between frames).
- `setTimeout` choreography; everything must be a function of `t`.
- Random values (`Math.random`) without a seed.
- External fonts or images that can fail during render.
- Two competing focal points on screen at the same time.
- Text smaller than the safe margin, or touching the edges.
- A final frame that is empty, mid-transition, or off-brand.
- Claiming a render works without opening the file.
