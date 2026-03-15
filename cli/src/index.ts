import { Command } from "commander"
import { EXIT_CODES } from "./core/exit-codes.ts"
import { log } from "./ui/logger.ts"
import "./env.ts"

const program = new Command()

// Ensure cursor is always restored when the process exits
process.on("exit", () => {
  if (process.stdout.isTTY) {
    // TODO: anayze this code
    process.stdout.write("\x1B[?25h")
  }
})

program
  .name("skills")
  .description("Manage and deploy AI agent skills")
  .version("1.0.0")

// === 1. CLI MODE ===
// Lazy-load commands to keep startup fast when using arguments
const { registerListCommand } = await import("./commands/list.cmd")
const { registerDeployCommand } = await import("./commands/deploy.cmd")

registerListCommand(program)
registerDeployCommand(program)

// === 2. TUI MODE ===
// No arguments → launch interactive TUI menu directly
if (process.argv.length <= 2) {
  try {
    const { runMenu } = await import("./menu/index")
    await runMenu()
    process.exit(EXIT_CODES.SUCCESS)
  } catch (err) {
    log.error(err instanceof Error ? err.message : String(err))
    process.exit(EXIT_CODES.ERROR)
  }
}

// Fallback to CLI parsing
program.parse(process.argv)
