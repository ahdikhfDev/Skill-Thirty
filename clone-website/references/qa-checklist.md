# Clone QA checklist

Use this alongside `scripts/verify.mjs`. Run it after every meaningful change,
not only at the end.

## Visual parity

- [ ] Screenshots at 1440×950 and 390×844 match the reference
- [ ] Section order and vertical rhythm match
- [ ] Container width, gutters and section padding match
- [ ] Type scale, weight, tracking and line-height match
- [ ] Colours match the reference tokens (not eyeballed)
- [ ] Borders, radii, shadows and gradients match
- [ ] Images, icons and logos are the real assets, not screenshots
- [ ] Hover, focus and active states exist and look right

## Behaviour

- [ ] Dropdowns and mega menu open, close, and close on outside click
- [ ] Mobile menu opens and traps/closes correctly
- [ ] Accordion expands, collapses, and updates `aria-expanded`
- [ ] Tabs / toggles switch content and state
- [ ] Sticky elements release at the right scroll point
- [ ] Scroll reveal fires once per element, not on every scroll
- [ ] Links that are placeholders do not jump to the top

## Motion

- [ ] Entrance animations complete and do not leave content invisible
- [ ] Infinite animations do not block screenshots or interaction
- [ ] Animations use transform/opacity, not layout properties
- [ ] `prefers-reduced-motion: reduce` stops motion and keeps content visible
- [ ] Page still reads without JavaScript

## Technical

- [ ] No console errors or `pageerror`
- [ ] No horizontal overflow at 1440, 1280, 1024, 768, 390
- [ ] No 404s for fonts, images, CSS or JS
- [ ] Fonts embedded or served locally (no network dependency)
- [ ] `node --check` passes for every JS file
- [ ] HTML tags balanced, CSS braces balanced
- [ ] Works from `file://` if the user needs that

## Housekeeping

- [ ] Scratch folders deleted (`_verify/`, `_ref/`, temp scripts, test shots)
- [ ] `README.md` explains how to run and what was changed
- [ ] Rebrand notes state that the design is a reference, not an affiliation

---

## Snippets

### Horizontal overflow

```js
const overflow = await page.evaluate(() => ({
  doc: document.documentElement.scrollWidth,
  win: window.innerWidth,
  overflowX: document.documentElement.scrollWidth > window.innerWidth
}));
```

### Stale colour scan (find cool hues left after a rebrand)

```js
const cold = await page.evaluate(() => {
  const parse = (s) => {
    const m = s && s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
    return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
  };
  const isCold = (c) => {
    const max = Math.max(c.r, c.g, c.b);
    const min = Math.min(c.r, c.g, c.b);
    if (max === min) return false;
    const d = max - min;
    let h;
    if (max === c.r) h = 60 * (((c.g - c.b) / d) % 6);
    else if (max === c.g) h = 60 * ((c.b - c.r) / d + 2);
    else h = 60 * ((c.r - c.g) / d + 4);
    if (h < 0) h += 360;
    const l = (max + min) / 2 / 255;
    const sat = d / (255 - Math.abs(max + min - 255));
    return h > 195 && h < 295 && sat > 0.3 && l > 0.12 && l < 0.92;
  };
  const hits = [];
  for (const el of document.querySelectorAll("*")) {
    const cs = getComputedStyle(el);
    for (const prop of ["color", "backgroundColor", "borderTopColor", "fill", "stroke"]) {
      const c = parse(cs[prop]);
      if (c && c.a > 0.12 && isCold(c)) {
        hits.push(el.tagName + " " + prop + " " + cs[prop]);
        break;
      }
    }
  }
  return hits.slice(0, 20);
});
```

### Rough frame-rate probe

```js
const fps = await page.evaluate(() => new Promise((resolve) => {
  let n = 0;
  const t0 = performance.now();
  const tick = () => {
    n++;
    if (performance.now() - t0 < 1500) requestAnimationFrame(tick);
    else resolve(Math.round(n / ((performance.now() - t0) / 1000)));
  };
  requestAnimationFrame(tick);
}));
```

A sudden drop usually means: large animated `filter: blur()`, animated
`background-position` on many elements, or a full-screen canvas with hundreds
of drawn items.

### Breakpoint sweep

```js
for (const width of [1440, 1280, 1024, 768, 390]) {
  await page.setViewportSize({ width, height: 900 });
  await page.waitForTimeout(400);
  const bad = await page.evaluate(() =>
    document.documentElement.scrollWidth > window.innerWidth);
  console.log(width, bad ? "OVERFLOW" : "ok");
}
```

### Element positions (for debugging alignment)

```js
const box = await page.evaluate(() => {
  const r = document.querySelector(".hero-title").getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
```

---

## Common failures and fixes

| Symptom | Likely cause | Fix |
|---|---|---|
| Sections blank in full-page shot | Scroll reveal never triggered | Scroll through before capturing |
| "element is not stable" | Infinite animation on the element | Clip screenshot or disable animations |
| Text uses fallback font | Webfont blocked over `file://` | Embed base64 `@font-face` |
| Layout shifts on load | Missing width/height on images | Reserve aspect ratio |
| Horizontal scrollbar | Absolute element wider than viewport | Clip with `overflow-x: clip` on a wrapper |
| Animation stutters | Animating `filter`, `box-shadow`, layout | Move to transform/opacity or reduce area |
| Dropdown stuck open | Outside-click handler stops propagation | Close on `document` click, skip the trigger |
| Content invisible with JS off | `opacity: 0` used as the base state | Keep visible default, animate from it |
| Broken markup after rebrand | Global regex replace | Validate with a parser; edit by hand |
