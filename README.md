# Skill-Thirty

An agent skill that turns **one URL** into a near-perfect front-end clone —
either plain **HTML/CSS/JS** with no build step, or a **React + Vite** project —
and can rebrand it afterwards.

It packages the full workflow, a Playwright verification script, a QA checklist,
and install instructions for several coding agents.

## What's inside

```
clone-website/
├── SKILL.md                  # 8-phase workflow, 2 output targets
├── scripts/verify.mjs        # screenshots + console/overflow report
└── references/
    ├── targets.md            # static vs React + Vite structures
    ├── qa-checklist.md       # checklist + code snippets
    └── other-agents.md       # install/convert for other agents
docs/clone-guide.md           # long-form explanation (Indonesian)
```

## Install

The folder name must stay `clone-website`: it has to match the `name` field in
the frontmatter.

### Zed (global)

```bash
cp -r clone-website ~/.agents/skills/
```

### Claude Code

```bash
mkdir -p ~/.claude/skills
cp -r clone-website ~/.claude/skills/
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

## Verification

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

Repo ini berisi satu **agent skill** untuk meng-clone website dari sebuah URL
menjadi halaman statis HTML/CSS/JS **atau** project React + Vite, lalu siap
di-rebrand. Isinya: alur kerja 8 fase, pilihan dua target output, skrip
verifikasi Playwright, checklist QA, dan cara pasang di berbagai agent
(Claude Code, Cursor, Codex, Gemini CLI, Windsurf, Cline, Copilot).

Pasang di Zed:

```bash
cp -r clone-website ~/.agents/skills/
```

Lalu minta di chat: *"Clone https://contoh.com, pakai React + Vite"* atau
*"Clone https://contoh.com jadi HTML/CSS/JS biasa"*. Penjelasan panjang ada di
[`docs/clone-guide.md`](docs/clone-guide.md).

## Notes

- Clone for study or reference. If you publish the result, replace the original
  brand, copy and third-party assets.
- The skill never copies analytics, trackers, auth flows or credentials.
- The verification script is agent-agnostic; any tool with Node can run it.

## License

MIT — see [LICENSE](LICENSE).
