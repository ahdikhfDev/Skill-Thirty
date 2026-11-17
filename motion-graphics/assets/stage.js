/* Motion graphics stage
 * Deterministic timeline helpers for frame-accurate rendering.
 *
 * Usage in a page:
 *   <script src="stage.js"></script>
 *   <script>
 *     const stage = new Stage({ duration: 6 });
 *     stage.add((t, duration) => { ...set styles from t... });
 *   </script>
 *
 * The page exposes, for scripts/render.mjs:
 *   window.__ready      true after fonts are loaded
 *   window.__seek(t)    render the frame at t seconds
 *   window.__duration   total duration in seconds
 *
 * Determinism rules: no Date.now(), no Math.random(), no CSS animations.
 * Use `seeded(i)` for pseudo-random values and compute everything from t.
 */
(() => {
  "use strict";

  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const map = (v, a, b, c, d) => c + ((v - a) / (b - a)) * (d - c);
  const range = (t, start, end) => clamp((t - start) / (end - start));

  const ease = {
    linear: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    inOutQuad: (t) => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    inCubic: (t) => t * t * t,
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOutCubic: (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outQuart: (t) => 1 - Math.pow(1 - t, 4),
    outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inOutExpo: (t) => (t === 0 ? 0 : t === 1 ? 1 : t < .5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2),
    outBack: (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2
  };

  // Deterministic pseudo-random in [0, 1) from an integer seed.
  const seeded = (i) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  class Stage {
    constructor(options = {}) {
      this.duration = options.duration ?? 5;
      this.layers = [];
      this.root = options.root ?? document.documentElement;

      window.__stage = this;
      window.__duration = this.duration;
      window.__seek = (t) => this.seek(t);
      window.__ready = false;

      const ready = () => { window.__ready = true; };
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(ready);
      } else {
        ready();
      }

      const params = new URLSearchParams(location.search);
      if (params.has("render") || params.has("paused")) {
        this.seek(0);
      } else {
        this.play();
      }
    }

    add(fn) {
      this.layers.push(fn);
      return this;
    }

    seek(t) {
      const time = clamp(t, 0, this.duration);
      this.root.style.setProperty("--t", time.toFixed(4));
      for (const fn of this.layers) fn(time, this.duration);
      return time;
    }

    play() {
      const start = performance.now();
      const loop = (now) => {
        this.seek(((now - start) / 1000) % this.duration);
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    }

    stop() {
      cancelAnimationFrame(this.raf);
    }
  }

  window.Stage = { Stage, clamp, lerp, map, range, ease, seeded };
})();
