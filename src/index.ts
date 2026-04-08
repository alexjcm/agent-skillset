#!/usr/bin/env node

import { Command } from "commander"
import fs from "fs"
import { EXIT_CODES } from "./core/exit-codes.ts"
import { log } from "./ui/logger.ts"
import "./env.ts"

const program = new Command()

function resolveCliVersion(): string {
  try {
    const packageJsonPath = new URL("../package.json", import.meta.url)
    const raw = fs.readFileSync(packageJsonPath, "utf8")
    const parsed = JSON.parse(raw) as { version?: unknown }
    return typeof parsed.version === "string" && parsed.version.trim()
      ? parsed.version
      : "0.0.0"
  } catch {
    return "0.0.0"
  }
}

// Ensure cursor is always restored when the process exits
process.on("exit", () => {
  if (process.stdout.isTTY) {
    // Restore cursor visibility in case it was hidden by a prompt/spinner.
    process.stdout.write("\x1B[?25h")
  }
})

program
  .name("skillctrl")
  .description("Manage and deploy AI agent skills")
  .version(resolveCliVersion())
  .showHelpAfterError("(run with --help for usage)")
  .addHelpText(
    "after",
    `
Behavior:
  no arguments   open the interactive TUI menu

Examples:
  $ skillctrl
  $ skillctrl --help
  $ skillctrl --version
`
  )

// === 1. TUI MODE ===
// No arguments → launch interactive TUI menu directly
if (process.argv.length <= 2) {
  try {
    const { runMenu } = await import("./menu/index.ts")
    const exitCode = await runMenu()
    process.exit(exitCode)
  } catch (err) {
    log.error(err instanceof Error ? err.message : String(err))
    process.exit(EXIT_CODES.ERROR)
  }
}

// Fallback to CLI parsing (help/version only)
program.parse(process.argv)
