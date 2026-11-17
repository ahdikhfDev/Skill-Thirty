---
name: clone-website
description: Clone a live website from a URL into a near-perfect static HTML/CSS/JS page or a React + Vite project, or rebrand an existing clone. Use when the user provides a URL and asks to clone, replicate, copy, rebuild, restyle, or rebrand a landing page or site.
---

# Clone a website from a URL

Turn one URL into a near-perfect static HTML/CSS/JS page or a React + Vite
project that matches the original's layout, typography, colour, assets,
interactions and motion. This skill covers the workflow, the verification loop,
and the traps that break clones.

## Ground rules

- Cloning for study or reference is fine. If the result will be published,
  strip the original brand first: name, logo, copy, and third-party assets.
- Never copy analytics, ads, chat widgets, auth flows, or credentials.
- No build step for the static target. Target: works from both `file://` and
  `http://`. The React target uses Vite.
- Work section by section and verify visually. Never claim "done" without
  screenshots.
- Match the user's language in your replies.

## Phase 0 — Pick the output target

Ask the user which target they want, unless they already said it. Two options,
fully documented in `references/targets.md`:

| Target | Choose when | Structure |
|---|---|---|
| **static** (default for clones) | drop-in page, no toolchain, opens from `file://`, fast handoff | `index.html` + `css/` + `js/` + `assets/` |
| **react-vite** | page will grow (routing, app logic, i18n, design system), or the user asks for React | `src/components/` per section, `src/styles/`, `public/` |

```bash
# react-vite scaffold
npm create vite@latest my-clone -- --template react
cd my-clone && npm install && npm run dev
```

Rules for both: keep the same markup semantics, tokens and section order as
the original. Do not introduce Tailwind or a UI kit unless the source used one
or the user asked.

## Phase 1 — Recon

1. Fetch the URL. If the fetch tool returns markdown, that is usable for copy
   and section order only; CSS must come from the raw HTML and stylesheets.
2. Map sections top to bottom (nav, hero, proof, features, pricing, teams,
   FAQ, compare, download, CTA, footer). Name them before writing code.
3. Inventory assets: `<img>`, inline `<svg>`, `<video>`, `background-image`,
   `@font-face`, `<canvas>`, JSON files.
4. List interactions: dropdowns, mega menu, accordion, tabs, sticky panels,
   scroll reveal, marquee, parallax, custom cursor.
5. Note breakpoints and container width from the CSS, or by resizing the page.

## Phase 2 — Assets

- Download raw HTML plus every referenced stylesheet and script.
- Keep the inline `<svg>` sprite: the static target keeps `<symbol>` + `<use>`
  in the HTML; the React target renders the sprite once as
  `src/components/Sprite.jsx` and still uses `<use href="#id">`.
- Static target: embed webfonts as base64 inside `@font-face` so `file://` has
  no FOUT. React target: self-host the same files under `public/fonts/`.
- Save images at original resolution; never upscale screenshots.
- Drop third-party trackers and widgets.

## Phase 3 — Design tokens

Read computed styles in a browser instead of guessing from screenshots
(`scripts/verify.mjs` prints a starter set). Put the result in `css/base.css`
for the static target, or `src/styles/tokens.css` for React. Same variable
names in both.

```css
:root {
  --bg: #1a1a1a;
  --surface: #212121;
  --text: #fff;
  --accent: #ffd166;
  --radius-lg: 24px;
  --container: 1200px;
  --gutter: clamp(20px, 4vw, 40px);
  --ease-soft: cubic-bezier(.22, 1, .36, 1);
  --font: "Inter", system-ui, sans-serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, monospace;
}
```

Tokens make a later rebrand a five-line change instead of hunting hundreds of
hex values.

## Phase 4 — Rebuild

Order: reset + tokens → header → hero → content sections → footer →
interactions → motion.

- Get layout and spacing right first; add motion later.
- Check every section in the browser before moving to the next.
- Static target: one HTML file, one CSS file per area, one JS entry.
- React target: one component per section (`Header`, `Hero`, `Features`,
  `Pricing`, `Faq`, `Compare`, `Download`, `Cta`, `Footer`), shared
  `components/ui/` for buttons, menus and accordions, `components/art/` for
  beams, the terminal preview and generated artwork. Keep section CSS as plain
  `.css` files imported by the component.
- Common patterns and how to handle them:
  - Bento grid: `grid-template-columns` plus `grid-area` per card.
  - Sticky stack: `position: sticky` plus a scroll-driven CSS variable.
  - Marquee: duplicate the track, animate `translateX(-50%)` linearly.
  - Scroll reveal: `IntersectionObserver` toggling a class.
  - Honeycomb: generate hexes from a data array.
  - Canvas particles: one `<canvas>` and one `requestAnimationFrame` loop.
- Animate `transform`, `translate`, `scale`, `rotate`, `opacity` — not layout
  properties.

## Phase 5 — Interactions and motion

- Wire every control: dropdowns (`aria-expanded` + `hidden`), mega menu,
  mobile menu, accordion, tabs.
- CSS keyframes for simple loops; `requestAnimationFrame` for computed motion
  (particles, path-following pulses, pointer parallax).
- Always add a `prefers-reduced-motion` branch that stops motion but keeps
  content visible.
- Never hide core content behind an entrance animation only. Keep a visible
  default state so the page still reads without JS or motion.
- React target: effects must clean up (cancel `requestAnimationFrame`, remove
  listeners, disconnect observers) and must not re-run on every render.

## Phase 6 — Verify (non-negotiable)

Copy `scripts/verify.mjs` into a scratch folder in the project, install
`playwright-core`, and run it against the local root (or against the live URL
to capture reference shots):

```bash
mkdir -p _verify && cd _verify
npm init -y >/dev/null && npm i playwright-core --silent

# static target
node verify.mjs --root .. --out shots

# react-vite target (dev server running)
node verify.mjs --url http://127.0.0.1:5173/ --out shots
```

For the React target also run `npm run build`, then verify the preview build
(`npm run preview`) so production CSS and asset paths are checked too.

It writes desktop/mobile viewport screenshots, full-page screenshots, and a
`report.json` with console errors, horizontal overflow, page height, and basic
tokens. Then open the screenshots and compare them with the reference yourself.
Fix, re-shoot, repeat until it matches.

Rules learned the hard way:

- Scroll through the page before full-page shots, or scroll-revealed sections
  render blank.
- Use `animations: "disabled"` or a clip screenshot. `locator.screenshot()`
  times out on elements with infinite animations ("element is not stable").
- Serve over `http://` with a tiny Node server; `file://` behaves differently
  for fonts and modules.
- Write screenshots inside the project. On Windows, system temp paths can be
  unreachable from the shell and cause permission errors.

## Phase 7 — Rebrand (when asked)

1. Replace identity: name, logo (sprite symbol + favicon), title, meta.
2. Replace copy with the new product's wording.
3. Change tokens, not every hex.
4. Remove leftover brand assets.
5. Scan for stale colours programmatically; see
   `references/qa-checklist.md`.
6. Re-run verification at desktop and mobile.

> Never bulk regex-edit HTML. Overlapping patterns silently destroy markup.
> After any scripted transform, validate the file with a parser or open it in a
> browser before continuing.

## Phase 8 — Handoff

- Delete scratch folders (`_verify/`, `_ref/`, helper scripts, test shots).
- Run `node --check` on every JS file; confirm HTML/CSS structure is balanced.
- React target: confirm `npm run build` passes and preview the build once.
- Update `README.md`: how to run, file map, rebrand notes.
- Report what was verified and what was not.

## Portability

This skill is a directory (`SKILL.md` + `scripts/` + `references/`). To use it
with another agent, follow `references/other-agents.md`: copy/convert steps for
Claude Code, Cursor, Codex CLI, Gemini CLI, Windsurf, Cline and Copilot, plus a
compact version for agents that do not support skill folders.

## Output style

When finished, give the user: what changed (with file paths), what you verified
(command plus result), and one or two concrete next steps. Show a screenshot
when layout is the point of the task.
