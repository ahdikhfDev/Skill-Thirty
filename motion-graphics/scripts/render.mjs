#!/usr/bin/env node
/**
 * render.mjs — render a deterministic HTML animation to MP4 / WebM / GIF.
 *
 * The page must expose (see assets/stage.js):
 *   window.__ready      becomes true when fonts are loaded
 *   window.__seek(t)    render the frame at t seconds
 *   window.__duration   optional total duration in seconds
 *
 * Usage:
 *   node render.mjs --page examples/kinetic-type.html --out out/kinetic.mp4 \
 *     --duration 6 --fps 30 --size 1080x1920
 *
 * Common flags:
 *   --root <dir>      directory to serve (default: the page's directory)
 *   --size WxH        viewport size (default 1080x1920)
 *   --fps N           frames per second (default 30)
 *   --scale N         device scale factor (default 1)
 *   --format          mp4 | webm | gif (default: from --out extension)
 *   --keep            keep the rendered PNG frames
 *   --port N          local server port (default 4321)
 *
 * Requires: playwright-core and ffmpeg on PATH.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

// Resolve Playwright from the folder the script is run in, not from this file,
// so the script can live inside a skill folder and run in any project.
const requireFromCwd = createRequire(path.join(process.cwd(), "package.json"));
let playwright;
try {
  playwright = requireFromCwd("playwright-core");
} catch {
  try {
    playwright = requireFromCwd("playwright");
  } catch {
    console.error("playwright-core not found in " + process.cwd());
    console.error("Run: npm i playwright-core");
    process.exit(1);
  }
}
const { chromium } = playwright;

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf("--" + name);
  return i > -1 && argv[i + 1] ? argv[i + 1] : fallback;
};
const flag = (name) => argv.includes("--" + name);

const pageArg = arg("page", null);
if (!pageArg) {
  console.error("Missing --page <file.html>");
  process.exit(1);
}

const cwdPage = path.resolve(pageArg);
const rootArg = arg("root", null);
const root = rootArg ? path.resolve(rootArg) : path.dirname(cwdPage);
const pagePath = rootArg && !fs.existsSync(cwdPage)
  ? path.resolve(root, pageArg)
  : cwdPage;

if (!fs.existsSync(pagePath)) {
  console.error("Page not found: " + pagePath);
  process.exit(1);
}

const pageRel = path.relative(root, pagePath).split(path.sep).join("/");
if (pageRel.startsWith("..")) {
  console.error("The page must live inside --root.");
  console.error("Page: " + pagePath);
  console.error("Root: " + root);
  process.exit(1);
}

const outPath = path.resolve(arg("out", "out/motion.mp4"));
const outExt = path.extname(outPath).slice(1).toLowerCase();
const format = (arg("format", outExt === "gif" || outExt === "webm" ? outExt : "mp4")).toLowerCase();
const fps = Math.max(1, Number(arg("fps", "30")));
const size = arg("size", "1080x1920").toLowerCase().split("x").map(Number);
if (size.length !== 2 || !size[0] || !size[1]) {
  console.error("Invalid --size, expected WxH (example: 1080x1920)");
  process.exit(1);
}
const [width, height] = size;
const scale = Math.max(1, Number(arg("scale", "1")));
const port = Number(arg("port", "4321"));
const keepFrames = flag("keep");

const framesDir = path.resolve(".frames");
const posterPath = outPath.replace(/\.(mp4|webm|gif)$/i, "-poster.png");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".mp4": "video/mp4",
  ".webm": "video/webm"
};

function assertFfmpeg() {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
  } catch {
    console.error("ffmpeg not found on PATH. Install it first (winget install Gyan.FFmpeg).");
    process.exit(1);
  }
}

const server = http.createServer((req, res) => {
  const clean = decodeURIComponent((req.url || "/").split("?")[0]);
  let file = path.join(root, clean);
  if (file !== root && !file.startsWith(root + path.sep)) {
    res.writeHead(403).end("forbidden");
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, "index.html");
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(200, {
      "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream"
    });
    res.end(data);
  });
});

await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(port, "127.0.0.1", resolve);
});

assertFfmpeg();

const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());

try {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: scale
  });

  page.on("pageerror", (error) => console.error("pageerror:", error.message));
  page.on("console", (message) => {
    if (message.type() === "error") console.error("console:", message.text());
  });

  const url = `http://127.0.0.1:${port}/${pageRel}?render=1`;
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  await page.waitForFunction(() => typeof window.__seek === "function", null, { timeout: 10000 });

  // The renderer drives every frame itself; CSS animation would break determinism.
  await page.addStyleTag({
    content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;}"
  });

  const duration = Number(arg("duration", "0")) || Number(await page.evaluate(() => window.__duration || 5));
  const totalFrames = Math.max(1, Math.round(duration * fps));

  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  for (let i = 0; i < totalFrames; i++) {
    const t = i / fps;
    await page.evaluate((time) => window.__seek(time), t);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve())));
    const file = path.join(framesDir, "frame-" + String(i + 1).padStart(4, "0") + ".png");
    await page.screenshot({ path: file, type: "png" });
    if ((i + 1) % 15 === 0 || i + 1 === totalFrames) {
      process.stdout.write(`\rrendering ${i + 1}/${totalFrames}`);
    }
  }
  process.stdout.write("\n");

  // Poster: a frame from ~80% of the timeline, useful as a thumbnail.
  const posterFrame = Math.min(totalFrames, Math.max(1, Math.round(totalFrames * 0.8)));
  fs.copyFileSync(
    path.join(framesDir, "frame-" + String(posterFrame).padStart(4, "0") + ".png"),
    posterPath
  );

  const pattern = path.join(framesDir, "frame-%04d.png").replace(/\\/g, "/");
  const baseArgs = ["-y", "-framerate", String(fps), "-i", pattern];

  if (format === "gif") {
    const gifFps = Math.min(fps, 15);
    const gifScale = Math.min(width, 720);
    const palette = path.join(framesDir, "palette.png");
    execFileSync("ffmpeg", [
      ...baseArgs,
      "-vf", `fps=${gifFps},scale=${gifScale}:-1:flags=lanczos,palettegen=stats_mode=diff`,
      palette
    ], { stdio: "inherit" });
    execFileSync("ffmpeg", [
      ...baseArgs,
      "-i", palette,
      "-lavfi", `fps=${gifFps},scale=${gifScale}:-1:flags=lanczos,paletteuse=dither=bayer:bayer_scale=3`,
      "-loop", "0",
      outPath
    ], { stdio: "inherit" });
  } else if (format === "webm") {
    execFileSync("ffmpeg", [
      ...baseArgs,
      "-c:v", "libvpx-vp9",
      "-b:v", "0",
      "-crf", "32",
      "-row-mt", "1",
      "-pix_fmt", "yuv420p",
      outPath
    ], { stdio: "inherit" });
  } else {
    execFileSync("ffmpeg", [
      ...baseArgs,
      "-c:v", "libx264",
      "-preset", "medium",
      "-crf", "18",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      outPath
    ], { stdio: "inherit" });
  }

  const bytes = fs.statSync(outPath).size;
  console.log(JSON.stringify({
    output: outPath,
    poster: posterPath,
    format,
    duration,
    fps,
    frames: totalFrames,
    size: width + "x" + height,
    scale,
    bytes
  }, null, 2));

  if (!keepFrames) fs.rmSync(framesDir, { recursive: true, force: true });
} finally {
  await browser.close();
  server.close();
}
