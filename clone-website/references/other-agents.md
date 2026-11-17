# Using this skill with other agents

The skill is just a folder:

```
clone-website/
├── SKILL.md                    # workflow, two output targets
├── scripts/verify.mjs          # screenshots + sanity report
└── references/
    ├── targets.md              # static vs React + Vite structures
    ├── qa-checklist.md         # checklist + snippets
    └── other-agents.md         # this file
```

Skill-aware agents load `SKILL.md` on demand; everything else needs the body
pasted into a rules/instructions file. Both cases are covered below.

---

## 1. Zed (this installation)

Already installed globally:

```
~/.agents/skills/clone-website/
```

It is discovered automatically in new conversations. For a project-local copy,
place it in `<project>/.agents/skills/clone-website/`.

---

## 2. Claude Code

Claude Code reads the same `SKILL.md` format (name + description frontmatter).

```bash
# global
mkdir -p ~/.claude/skills
cp -r ~/.agents/skills/clone-website ~/.claude/skills/

# or project-local
mkdir -p .claude/skills
cp -r ~/.agents/skills/clone-website .claude/skills/
```

---

## 3. Cursor

Cursor uses rules, not skill folders. Create a rule file and paste the body.

`.cursor/rules/clone-website.mdc`:

```markdown
---
description: Clone a website from a URL into static HTML/CSS/JS or React + Vite
globs:
alwaysApply: false
---

# Clone a website from a URL

(paste everything from SKILL.md after the frontmatter here)
```

Extract the body with one command:

```bash
node -e "const fs=require('fs');const t=fs.readFileSync(process.argv[1],'utf8');process.stdout.write(t.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/,''))" ~/.agents/skills/clone-website/SKILL.md > /tmp/clone-body.md
```

Reference the script path from the rule so the agent can run it, or copy
`scripts/verify.mjs` into the repo (e.g. `scripts/verify.mjs`).

---

## 4. Codex CLI, OpenCode and other `AGENTS.md` tools

Append the body to `AGENTS.md` in the project root (or the global
`~/.codex/AGENTS.md`):

```bash
# strip frontmatter, append to project instructions
node -e "const fs=require('fs');const t=fs.readFileSync(process.argv[1],'utf8');process.stdout.write(t.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/,''))" ~/.agents/skills/clone-website/SKILL.md >> AGENTS.md
```

Keep the section separated with a heading, e.g.:

```markdown
# Website cloning
...
```

---

## 5. Gemini CLI

Same idea, different filename: `GEMINI.md` in the project root (or
`~/.gemini/GEMINI.md`).

```bash
node -e "const fs=require('fs');const t=fs.readFileSync(process.argv[1],'utf8');process.stdout.write(t.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/,''))" ~/.agents/skills/clone-website/SKILL.md >> GEMINI.md
```

---

## 6. Windsurf

Recent versions: `.windsurf/rules/clone-website.md` (add frontmatter with
`trigger: model_decision` or `trigger: manual`). Legacy single file:
`.windsurfrules`. Content is the SKILL body.

---

## 7. Cline

Create `.clinerules/clone-website.md` (a directory of rule files is supported)
and paste the SKILL body.

---

## 8. GitHub Copilot

Append the body to `.github/copilot-instructions.md` in the repository.

---

## 9. Any chat-only agent

If the agent has no file access, paste the compact prompt below. It keeps the
essential workflow without the long explanations.

```text
You are cloning a website from a URL into a working front-end project.

1. Recon: map sections top to bottom, list assets, list interactions, note
   breakpoints and container width.
2. Choose target (ask if unclear):
   - static: index.html + css/ + js/ + assets, no build, works from file://
   - react-vite: npm create vite@latest . -- --template react, one component
     per section, src/styles/tokens.css, sprite rendered once as Sprite.jsx
3. Capture design tokens from computed styles (colors, type scale, spacing,
   radii, shadows, easing). Put them in :root.
4. Rebuild section by section. Layout first, then detail, then motion.
   Keep original class names and markup hierarchy.
5. Interactions: dropdowns (aria-expanded + hidden), mega menu, mobile menu,
   accordion, tabs, sticky, reveals. Add prefers-reduced-motion support and
   keep core content visible without JS.
6. Motion: CSS keyframes for loops; requestAnimationFrame for canvas and
   path-based motion; animate transform/opacity only.
7. Verify with headless Chrome: screenshots at 1440x950 and 390x844, full page
   after scrolling through, animations disabled. Check console errors,
   horizontal overflow, and compare with the reference. Fix and repeat.
8. Rebrand only after the clone matches: name, logo, copy, tokens, remove old
   brand assets, re-verify.
9. Clean up scratch files; document how to run in README.

Rules: no analytics/trackers copied; no build step for the static target;
never bulk regex-edit HTML; prove results with screenshots.
```

---

## Verification script requirements

`scripts/verify.mjs` is agent-agnostic. Any of the agents above can run it.

```bash
mkdir -p _verify && cd _verify
npm init -y >/dev/null
npm i playwright-core --silent
node verify.mjs --root .. --out shots        # static
node verify.mjs --url http://127.0.0.1:5173/ --out shots   # react-vite dev
```

Requirements: Node 18+, `playwright-core`, and a local Chrome install (the
script launches `channel: "chrome"` and falls back to bundled Chromium).

If an agent cannot run Node, ask it to output the commands and run them in your
own terminal.
