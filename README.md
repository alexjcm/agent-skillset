# 🛠️ skillctrl · Manage and deploy AI skills

Helps you import, update, and deploy AI agent skills.

![Bun](https://img.shields.io/badge/bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

### 🚀 Highlights
- **Multiple IDE Support**: Deploy skills to IntelliJ (Codeium), Windsurf, Antigravity, Claude Code, Cursor, and Codex.
- **TUI-Driven Interface**: Interactive terminal wizard for seamless management.
- **GitHub Import & Update**: Import skills from GitHub URLs or `owner/repo`, then check/update later from registry.
- **User Config**: Register your custom skills repository by setting `ownSkillsDir` in `~/.skillctrl/config.json`.

---

## 🎨 How to Add Your Own Skills

To expand your local toolkit:
1.  In your own skills repository/folder, pick a category (or create one).
2.  Create a folder (e.g., `.../skills/development/my-new-skill/`).
3.  Add a `SKILL.md` with standard YAML frontmatter (name and description).
4.  Set that folder in `skillctrl` via **Own Skills Dir** (saved in `~/.skillctrl/config.json`).
5.  Run `skillctrl` to verify and deploy.

---

## ⚙️ CLI Setup & Installation

The CLI manages and deploys skills to your local environment.

### Runtime model
- **Bun**: development only — use for local runs, tests, and lint inside this repo.
- **Node.js + npm**: use for distribution and running `skillctrl` globally. If you just want to use the CLI, skip Bun entirely.

Recommended Node.js version for distribution/runtime: **20+**.

### 1. Go to project root
```bash
cd skillctrl
```

### 2. Install & Link
**Using Bun:**
```bash
bun install
bun link
```

**Using Node/NPM:**
```bash
npm install
npm link
```

> For distribution/runtime, prefer Node/NPM linking (`npm link`), then run `skillctrl` from any directory.

### 3. After publishing to npm (public registry)
```bash
npm install -g skillctrl
skillctrl
```

Or run without global install:
```bash
npx skillctrl@latest
```

---

## 🎮 Usage

### 🖥️ Interactive Menu (TUI)
The easiest way to manage your skills is via the guided wizard:

```bash
# Global command (if linked)
skillctrl

# Or local development run
bun start
```

This TUI handles IDE targeting, project/workspace path resolution, and automatic Git exclusion handling. It also includes a **Doctor (diagnostics)** option to validate your environment.

### ❓ Command Help

```bash
skillctrl --help
skillctrl --version
```

### 🔁 If you moved your local skills folder

If your own skills were moved to another path/repository, update `ownSkillsDir`:

```bash
skillctrl
# then go to: Own Skills Dir
```

---

## 📥 Import & Update from GitHub

From the interactive menu:
- **Import skill from GitHub**: accepts full GitHub URLs (`https://github.com/owner/repo`), short format (`github.com/owner/repo`), or owner/repo shorthand (`owner/repo`).
- **Check & update imported skills**: checks imported skills from `~/.skillctrl/skill-imports.json` and lets you:
  - select specific skills to update (recommended),
  - update all available,
  - cancel.

Imported skills are stored outside this repo:
- `~/.skillctrl/imported/{category}/{skill}/`

Optional token for higher GitHub API limits:
```bash
export GITHUB_TOKEN="your_token"
```

---

## 🧩 IDE Compatibility Paths

| IDE | Global Path | Project/Workspace Path |
|-----|-------------|-------------------------|
| **Antigravity** | `~/.gemini/antigravity/skills/` | `.agents/skills/` |
| **Windsurf** | `~/.codeium/windsurf/skills/` | `.windsurf/skills/` |
| **IntelliJ (Codeium)** | `~/.codeium/skills/` | `.windsurf/skills/` |
| **Junie (JetBrains)** | `~/.junie/skills/` | `.junie/skills/` |
| **Claude Code** | `~/.claude/skills/` | `.claude/skills/` |
| **Cursor** | `~/.cursor/skills/` | `.cursor/skills/` + `.agents/skills/` |
| **Codex** | `~/.agents/skills/` | `.agents/skills/` |
| **OpenCode** | `~/.config/opencode/skills/` + `~/.claude/skills/` + `~/.agents/skills/` | `.opencode/skills/` + `.claude/skills/` + `.agents/skills/` |

---

## 🔗 References

- Format specification for Agent Skills: https://agentskills.io/specification.md
- Skill authoring best practices: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices.md
- Validate skills tool: https://github.com/agentskills/agentskills/tree/main/skills-ref
- Skill creator: https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md
- Agent skills tool: https://github.com/vercel-labs/skills
