# Output targets

The skill can produce two kinds of result. Pick one early; the rest of the
workflow is the same.

| Target | Pick it when | Build | Entry |
|---|---|---|---|
| **static** | drop-in page, no toolchain, must open from `file://`, fastest handoff | none | `index.html` |
| **react-vite** | the page will grow (app logic, routing, i18n, design system), or the user asks for React | Vite | `src/main.jsx` |

Default to **static** when the request is "clone this page". Default to
**react-vite** when the user asks for React or says the clone will be extended.

---

## Target A — static HTML/CSS/JS

```
project/
├── index.html          # all markup, SVG sprite at the top of <body>
├── css/
│   ├── base.css        # tokens, reset, type, header/footer, shared UI
│   ├── landing.css     # sections
│   └── preview.css     # isolated complex component (optional)
├── js/
│   └── main.js         # all interactions + animations, one entry
└── assets/
    ├── favicon.svg
    └── (images)
```

Rules:

- No bundler, no modules required. One `defer` script is enough.
- Fonts: base64 inside `@font-face` so the page works from `file://`.
- SVG sprite: keep `<symbol id>` blocks once, use `<use href="#id">` everywhere.
- CSS files are plain, loaded with `<link>`. Tokens live in `:root`.
- Interactions: small functions grouped by feature, one `IntersectionObserver`
  per concern, `requestAnimationFrame` for canvas.
- Guard all animation behind `prefers-reduced-motion` and keep visible default
  states so the page reads without JS.

Run and verify:

```bash
python -m http.server 8000          # or any static server
node verify.mjs --root . --out shots
```

---

## Target B — React + Vite

```bash
npm create vite@latest my-clone -- --template react
cd my-clone
npm install
```

```
my-clone/
├── index.html
├── vite.config.js
├── public/
│   ├── favicon.svg
│   ├── fonts/…
│   └── images/…
└── src/
    ├── main.jsx
    ├── App.jsx                 # section order only
    ├── styles/
    │   ├── tokens.css          # one-to-one with the static :root
    │   ├── base.css            # reset, typography, shared UI
    │   └── sections/…          # optional split per section
    ├── components/
    │   ├── Sprite.jsx          # all <symbol> definitions, rendered once
    │   ├── Header.jsx
    │   ├── Hero.jsx
    │   ├── Features.jsx
    │   ├── Pricing.jsx
    │   ├── Faq.jsx
    │   ├── Compare.jsx
    │   ├── Download.jsx
    │   ├── Cta.jsx
    │   ├── Footer.jsx
    │   ├── ui/                 # Button, Menu, Accordion, Marquee…
    │   └── art/                # Beam, TerminalPreview, Honeycomb, Galaxy…
    ├── hooks/
    │   ├── useReveal.js
    │   ├── useReducedMotion.js
    │   └── useScrollProgress.js
    └── data/
        ├── nav.js
        ├── features.js
        ├── faq.js
        └── compare.js
```

Mapping from the clone:

| Original section | Component |
|---|---|
| nav / mega menu / mobile menu | `Header` + `ui/Menu` |
| hero + terminal preview | `Hero` + `art/TerminalPreview` + `art/Beam` |
| agent network | `art/AgentNetwork` (nodes from `data/agents.js`) |
| bento features | `Features` + `data/features.js` |
| pricing | `Pricing` |
| teams / sticky cards | `Teams` + `useScrollProgress` |
| FAQ | `Faq` + `ui/Accordion` |
| comparison grid | `Compare` + `data/compare.js` |
| download | `Download` |
| CTA / footer | `Cta`, `Footer` |

Rules:

- Keep tokens identical to the static version (`tokens.css`). Do not convert
  them to Tailwind unless the source or the user asks.
- One component per section; keep the original markup hierarchy and class
  names so CSS ports unchanged.
- Sprite: render `<Sprite />` once inside `App`, keep `<use href="#id">`.
- Assets: `public/` for images and fonts referenced by URL; `src/assets` only
  when you want Vite hashing.
- Every effect that starts a loop must clean up:

  ```jsx
  useEffect(() => {
    if (prefersReducedMotion) return;
    let raf = 0;
    const tick = () => { /* draw */ raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  ```

- Observers and listeners live inside the same effect that removes them.
- Interactions use state (`open`, `activeIndex`, `expanded`) but keep ARIA
  semantics in the markup.
- CSS stays plain `.css`, imported by the component or once in `main.jsx`.
- Do not add a router, state library or UI kit for a single landing page.

Run, build and verify:

```bash
npm run dev            # http://127.0.0.1:5173
npm run build
npm run preview        # http://127.0.0.1:4173

node verify.mjs --url http://127.0.0.1:5173/ --out shots
node verify.mjs --url http://127.0.0.1:4173/ --out shots-prod
```

Check both dev and preview: dev catches React warnings, preview catches broken
asset paths and CSS order.

---

## Switching between targets

**static → react-vite**

1. Scaffold Vite, copy tokens into `src/styles/tokens.css`.
2. Move section markup into components, one at a time, keeping classes.
3. Move the SVG sprite into `Sprite.jsx`.
4. Port each interaction into a component or hook, one at a time.
5. Keep the old static folder until the React version matches, then delete it.

**react-vite → static**

Only worth it for small pages. Render the app, then rebuild the markup by hand
section by section. Never ship a bundled JS file as a "static" clone — it loses
the point of the target.

---

## Checklist per target

Static:

- [ ] Opens from `file://` with no console errors
- [ ] Fonts embedded, no network requests
- [ ] Sprite reused via `<use>`
- [ ] No horizontal overflow at 1440 and 390
- [ ] `node --check js/main.js` passes

React:

- [ ] `npm run build` passes with no warnings that indicate broken imports
- [ ] Preview build matches the dev build visually
- [ ] No `useEffect` warning, no missing keys in lists
- [ ] Loops/listeners/observers clean up on unmount
- [ ] Reduced-motion early return keeps content visible
- [ ] No unused dependencies added
