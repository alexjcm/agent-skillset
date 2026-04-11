# 🛠️ skillctrl · Manage and deploy AI skills

Helps you import, update, and deploy AI agent skills.

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
- **Node.js + npm**: required for development, distribution, and global usage.

Required Node.js version: **22+**.

### 1. Install & Link
```bash
npm install
npm link
```

> Use `npm link` to run `skillctrl` from any directory.

### 2. After publishing to npm (public registry)
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
npm start
```

This TUI handles IDE targeting, project/workspace path resolution, and automatic Git exclusion handling. It also includes a **Doctor (diagnostics)** option to validate your environment.

Key deploy/delete entries in the current menu:
- **Deploy skills to project/workspace**: deploy one or more skills into a specific project directory.
- **Deploy skills globally**: choose IDE target(s), then deploy **all** skills or **selected** skill(s).
- **Delete skill(s)**: opens a submenu for imported/global deletion flows.

### ❓ Command Help

```bash
skillctrl --help
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
- **Delete skill(s)** opens the deletion submenu:
  - **Delete imported skill(s)**: remove one, many, or all imported skills. This deletes both:
    - imported local files under `~/.skillctrl/imported/`,
    - matching entries in `~/.skillctrl/skill-imports.json`.
  - **Delete globally installed skill(s)**: remove one, many, or all known skills from selected IDE global paths.
    - selection is based on deployed folder names (collision-aware),
    - only known catalog skills are included.

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
