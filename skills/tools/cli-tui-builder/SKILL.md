---
name: cli-tui-builder
description: >
  Provides best practices and library guidance for building CLI and TUI applications. Use when
  the user is building, designing, or iterating on a terminal tool, interactive CLI, TUI interface,
  or any app that runs in the terminal. Also use when the user asks about prompts, signals, exit codes,
  TTY detection, output formatting, terminal UX, project structure, or which libraries to use for a terminal app.
compatibility: Designed for TypeScript projects targeting Node.js
metadata:
  version: "1.0"
---

# Terminal App Builder

Two reference documents are bundled with this skill. Read them before writing code or making library recommendations.

## Reference documents

**Best practices** → [`references/cli-tui-best-practices.md`](references/cli-tui-best-practices.md)

Design principles, Unix conventions, TTY detection, signal handling, exit codes, flags, config file locations,
and recommended project architecture. Check the "Agent summary" table at the end before delivering code.

**Library stack** → [`references/cli-tui-stack.md`](references/cli-tui-stack.md)

Available libraries organized by use case, comparisons between alternatives, and when to prefer a
native Node 24 API over a library. The user chooses the stack — apply it correctly.
