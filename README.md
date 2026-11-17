# Skill-Thirty

A small collection of agent skills for building and animating web pages:

- **clone-website** — turn one URL into a near-perfect static clone
  (HTML/CSS/JS or React + Vite) and rebrand it.
- **motion-graphics** — turn a written brief into a deterministic HTML
  animation and render it to MP4, WebM or GIF.

Each skill packages its workflow, scripts and references, and works with Zed,
Claude Code, Cursor, Codex, Gemini CLI, Windsurf, Cline and Copilot.

## What's inside

```
clone-website/
├── SKILL.md                  # 8-phase workflow, 2 output targets
├── scripts/verify.mjs        # screenshots + console/overflow report
└── references/
    ├── targets.md            # static vs React + Vite structures
    ├── qa-checklist.md       # checklist + code snippets
    └── other-agents.md       # install/convert for other agents

motion-graphics/
├── SKILL.md                  # prompt → stage → render workflow
├── assets/stage.js           # deterministic timeline helpers
├── scripts/render.mjs        # Playwright frames → ffmpeg video
├── references/
│   ├── prompts.md            # brief template + 20 prompts
│   └── recipes.md            # scene code recipes
└── examples/
    ├── kinetic-type.html     # 6s sample source
    ├── kinetic-type.mp4      # rendered sample
    └── kinetic-type-poster.png

docs/clone-guide.md           # long-form clone explanation (Indonesian)
```

## Install

The folder name must stay `clone-website`: it has to match the `name` field in
the frontmatter.

### Zed (global)

```bash
cp -r clone-website motion-graphics ~/.agents/skills/
```

### Claude Code

```bash
mkdir -p ~/.claude/skills
cp -r clone-website motion-graphics ~/.claude/skills/
```

Project-local variants: `.agents/skills/` (Zed) or `.claude/skills/`
(Claude Code) inside the repository.

### Other agents

| Agent | Where it goes |
|---|---|
| Cursor | `.cursor/rules/clone-website.mdc` (frontmatter + SKILL body) |
| Codex CLI / OpenCode | append the SKILL body to `AGENTS.md` |
| Gemini CLI | append to `GEMINI.md` |
| Windsurf | `.windsurf/rules/clone-website.md` |
| Cline | `.clinerules/clone-website.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Chat-only agents | paste the compact prompt from `references/other-agents.md` |

Exact copy/convert commands, including how to strip the YAML frontmatter, live
in [`clone-website/references/other-agents.md`](clone-website/references/other-agents.md).

## Usage

Once installed, just describe the job in the repo you are working in:

```text
Clone https://example.com into this folder. Static HTML/CSS/JS, no build step.
```

```text
Clone https://example.com as a React + Vite project, one component per section.
```

```text
Create a 6-second vertical motion graphic: MOTION reveals letter by letter,
a light band inverts it at 2.5s, then an end card holds for a second.
Render it to MP4 at 1080x1920, 30 fps.
```

```text
Make a 5s 16:9 chart animation: line draws, area fills, tooltip at 3.2s.
Use the motion-graphics skill and give me the prompt, the source and the video.
```

```text
Rebrand this clone into "NamaBaru" with a warm gold palette.
```

The skill will:

1. map sections, assets and interactions from the URL;
2. extract design tokens from computed styles;
3. rebuild section by section in the chosen target;
4. port interactions and motion, with `prefers-reduced-motion` support;
5. verify with headless Chrome screenshots at desktop and mobile;
6. rebrand, clean up, and document the result.

## Two output targets

| Target | Choose when | Structure |
|---|---|---|
| **static** (default) | drop-in page, no toolchain, opens from `file://` | `index.html` + `css/` + `js/` + `assets/` |
| **react-vite** | page will grow (routing, app logic, design system) | `src/components/` per section, `src/styles/`, `public/` |

Details, folder trees and a section-to-component mapping:
[`clone-website/references/targets.md`](clone-website/references/targets.md).

## Motion graphics

The `motion-graphics` skill writes the prompt, builds a deterministic HTML
stage (`assets/stage.js`), and renders it frame by frame.

```bash
npm i playwright-core

# render the bundled sample
node ~/.agents/skills/motion-graphics/scripts/render.mjs \
  --root ~/.agents/skills/motion-graphics \
  --page examples/kinetic-type.html \
  --out out/kinetic.mp4 --duration 6 --fps 30 --size 1080x1920
```

Formats: `mp4` (H.264), `webm` (VP9), `gif`. The renderer also writes a poster
frame. Sample output: [`motion-graphics/examples/kinetic-type.mp4`](motion-graphics/examples/kinetic-type.mp4).

Requirements: Node 18+, `playwright-core`, Chrome, and `ffmpeg` on `PATH`.

## Verification (clone-website)

`scripts/verify.mjs` serves the folder (or uses a live URL), scrolls through the
page to trigger reveals, then writes desktop and mobile screenshots plus a
report with console errors, horizontal overflow and basic tokens.

```bash
mkdir -p _verify && cd _verify
npm init -y >/dev/null
npm i playwright-core --silent

# static build
node verify.mjs --root .. --out shots

# react-vite dev server
node verify.mjs --url http://127.0.0.1:5173/ --out shots
```

Requirements: Node 18+, `playwright-core`, and Chrome installed (the script
uses the `chrome` channel and falls back to bundled Chromium).

## Bahasa Indonesia

Repo ini berisi kumpulan **agent skill**:

- **clone-website** — clone website dari satu URL jadi HTML/CSS/JS statis atau
  project React + Vite, lalu siap di-rebrand.
- **motion-graphics** — bikin video motion graphics dari prompt: stage HTML
  deterministik, render frame-accurate ke MP4/WebM/GIF pakai Playwright + ffmpeg.

Pasang keduanya di Zed:

```bash
cp -r clone-website motion-graphics ~/.agents/skills/
```

Lalu minta di chat: *"Clone https://contoh.com, pakai React + Vite"* atau
*"Bikin motion graphic 6 detik 9:16, kinetic type, render MP4"*. Penjelasan
clone ada di [`docs/clone-guide.md`](docs/clone-guide.md).

## Notes

- Clone for study or reference. If you publish the result, replace the original
  brand, copy and third-party assets.
- The skills never copy analytics, trackers, auth flows or credentials.
- `verify.mjs` and `render.mjs` are agent-agnostic; any tool with Node can run
  them. Rendering also needs `ffmpeg`.

## License

MIT — see [LICENSE](LICENSE).
