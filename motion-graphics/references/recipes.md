# Scene recipes

Small, deterministic building blocks. All snippets assume:

```html
<script src="stage.js"></script>
<script>
  const { Stage, ease, range, lerp, clamp, seeded } = window.Stage;
  const stage = new Stage({ duration: 6 });
  const $ = (s) => document.querySelector(s);
</script>
```

Every visual is a function of `t`. Never use CSS animation, timers or
`Math.random()`.

---

## 1. Masked text reveal

```html
<div class="mask"><span class="ch">M</span></div>
<style>
  .mask { display: block; overflow: hidden; padding-block: .04em; }
  .ch { display: block; will-change: transform; }
</style>
<script>
  const chars = [...document.querySelectorAll(".ch")];
  stage.add((t) => {
    chars.forEach((el, i) => {
      const p = ease.outExpo(range(t, .5 + i * .085, 1.25 + i * .085));
      el.style.transform = `translateY(${(1 - p) * 112}%) rotate(${(1 - p) * 4}deg)`;
    });
  });
</script>
```

## 2. Stagger helper

```js
const stagger = (t, i, start, step, dur) => range(t, start + i * step, start + i * step + dur);
```

Use it for lists, bars, tiles and nodes. Keep `step` between 40 and 100ms.

## 3. Counter

```js
const counter = $("#counter");
stage.add((t) => {
  const p = ease.outCubic(range(t, 1.2, 3.2));
  counter.textContent = Math.round(p * 12400).toLocaleString("en-US");
});
```

## 4. Progress bar

```js
stage.add((t) => {
  const p = ease.inOutCubic(range(t, 0, 6));
  bar.style.transform = `scaleX(${p})`;  // bar has transform-origin: left
});
```

## 5. SVG path draw

```js
const path = document.querySelector("#line");
const dot = document.querySelector("#dot");
const len = path.getTotalLength();
path.style.strokeDasharray = String(len);

stage.add((t) => {
  const p = ease.outCubic(range(t, .8, 2.6));
  path.style.strokeDashoffset = String(len * (1 - p));
  const point = path.getPointAtLength(len * p);
  dot.setAttribute("transform", `translate(${point.x} ${point.y})`);
});
```

## 6. Bar chart

```js
const bars = [...document.querySelectorAll(".bar")];
stage.add((t) => {
  bars.forEach((bar, i) => {
    const p = ease.outCubic(range(t, .6 + i * .07, 1.6 + i * .07));
    bar.style.transform = `scaleY(${p})`;  // transform-origin: bottom
  });
});
```

## 7. Donut ring

```js
const ring = document.querySelector("#ring");
const label = document.querySelector("#label");
const r = Number(ring.getAttribute("r"));
const circ = 2 * Math.PI * r;
ring.style.strokeDasharray = String(circ);

stage.add((t) => {
  const p = ease.outCubic(range(t, .6, 3.0));
  ring.style.strokeDashoffset = String(circ * (1 - p * .72));
  label.textContent = Math.round(p * 72) + "%";
});
```

## 8. Canvas particles, deterministic

```js
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;
const cx = W / 2, cy = H * .55;

stage.add((t) => {
  ctx.clearRect(0, 0, W, H);
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 220; i++) {
    const arm = (i % 3) * (Math.PI * 2 / 3);
    const reach = Math.pow(seeded(i + 1), .58);
    const r = 40 + reach * W * .34;
    const a = arm + reach * 3.2 + (seeded(i + 2) - .5) * .4 + t * .12;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r * .32;
    const alpha = .18 + seeded(i + 3) * .55;
    ctx.fillStyle = `rgba(255, 230, 175, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, .6 + seeded(i + 4) * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
});
```

## 9. Beam sweep with inversion

```html
<div class="word-wrap">
  <h1>MOTION</h1>
  <div class="sweep"></div>
</div>
<style>
  .word-wrap { position: relative; isolation: isolate; }
  .sweep {
    position: absolute; inset: -6% 0; width: 120%;
    background: linear-gradient(90deg, transparent, #fff 10%, #fff 90%, transparent);
    mix-blend-mode: exclusion;
  }
</style>
<script>
  stage.add((t) => {
    const p = range(t, 2.1, 3.3);
    sweep.style.opacity = p > 0 && p < 1 ? "1" : "0";
    sweep.style.transform = `translateX(${lerp(-130, 130, ease.inOutCubic(p))}%) skewX(-10deg)`;
  });
</script>
```

Exclusion against white inverts the type underneath. Keep the band narrow.

## 10. Camera push

```js
stage.add((t) => {
  const p = ease.inOutSine(range(t, 0, 6));
  camera.style.transform = `scale(${lerp(1, 1.06, p)}) translateY(${lerp(0, -1.5, p)}%)`;
});
```

Apply to a wrapper that contains the whole scene. Never move individual
elements to fake a push.

## 11. Grain and vignette

```css
.grain {
  position: absolute; inset: 0; pointer-events: none;
  opacity: .09; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 160px 160px;
}

.vignette {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,.45) 100%);
}
```

## 12. End card

```js
stage.add((t) => {
  const p = ease.outCubic(range(t, 4.8, 5.4));
  end.style.opacity = String(p);
  end.style.transform = `translateY(${(1 - p) * 24}px) scale(${lerp(.96, 1, p)})`;
});
```

Hold for at least 0.8s. The last frame should look like a poster.

## 13. Loop seam

```js
stage.add((t, duration) => {
  const phase = (t / duration) * Math.PI * 2;
  glow.style.transform = `scale(${1 + Math.sin(phase) * .04})`;
});
```

Make reveals finish before 80% of the duration, and keep the first and last
frame visually identical.

---

## Composition checklist

- [ ] One focal point per beat
- [ ] Type at least 4vmin cap height at 1080 wide
- [ ] Safe margins 6–8vmin
- [ ] Entrances finish before the next beat starts
- [ ] Last frame holds and reads as a poster
- [ ] Grain and vignette applied once, not per layer
- [ ] No element animates with a layout property
- [ ] Render command documented for re-renders
