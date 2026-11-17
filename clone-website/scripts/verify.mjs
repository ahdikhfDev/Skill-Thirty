#!/usr/bin/env node
/**
 * verify.mjs — screenshots + sanity report for a static site or a live URL.
 *
 * Usage:
 *   node verify.mjs --url https://example.com --out shots
 *   node verify.mjs --root .. --out shots
 *   node verify.mjs --root . --out shots --mobile-only
 *
 * Requires: npm i playwright-core   (uses the installed Chrome channel)
 *
 * Outputs, inside --out:
 *   desktop.png / desktop-full.png
 *   mobile.png  / mobile-full.png
 *   report.json (console errors, overflow, height, basic tokens)
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf("--" + name);
  return i > -1 && argv[i + 1] ? argv[i + 1] : fallback;
};
const flag = (name) => argv.includes("--" + name);

const root = path.resolve(arg("root", "."));
const liveUrl = arg("url", null);
const outDir = path.resolve(arg("out", "shots"));
const port = Number(arg("port", "4199"));

fs.mkdirSync(outDir, { recursive: true });

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".mp4": "video/mp4",
  ".webm": "video/webm"
};

let server = null;
let origin = liveUrl;

if (!liveUrl) {
  if (!fs.existsSync(root)) {
    console.error("Root not found: " + root);
    process.exit(1);
  }

  server = http.createServer((req, res) => {
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
  origin = "http://127.0.0.1:" + port + "/";
}

const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
const errors = [];
const report = { origin, views: {} };

async function capture(name, width, height, mobile) {
  const page = await browser.newPage({
    viewport: { width, height },
    isMobile: mobile,
    hasTouch: mobile,
    deviceScaleFactor: 1
  });

  page.on("pageerror", (e) => errors.push(name + " pageerror: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(name + " console: " + m.text());
  });

  await page.goto(origin, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1800);

  // Scroll through the whole page so IntersectionObserver reveals fire.
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  const step = Math.max(300, Math.round(height * 0.8));
  for (let y = 0; y < pageHeight; y += step) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(90);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);

  await page.screenshot({ path: path.join(outDir, name + ".png") });
  await page.screenshot({
    path: path.join(outDir, name + "-full.png"),
    fullPage: true,
    animations: "disabled"
  });

  const info = await page.evaluate(() => {
    const cs = (selector, prop) => {
      const el = document.querySelector(selector);
      return el ? getComputedStyle(el)[prop] : null;
    };
    return {
      title: document.title,
      height: document.body.scrollHeight,
      overflowX: document.documentElement.scrollWidth > window.innerWidth,
      bodyBg: cs("body", "backgroundColor"),
      bodyFont: cs("body", "fontFamily"),
      h1Size: cs("h1", "fontSize"),
      h1Weight: cs("h1", "fontWeight"),
      containerWidth: cs(".container", "maxWidth")
    };
  });

  report.views[name] = info;
  await page.close();
}

try {
  await capture("desktop", 1440, 950, false);
  if (!flag("mobile-only")) {
    await capture("mobile", 390, 844, true);
  }
} finally {
  report.consoleErrors = errors;
  fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
  if (server) server.close();
}

if (errors.length) {
  process.exitCode = 2;
}
