import path from "path"
import * as clack from "@clack/prompts"
import pc from "picocolors"
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { SKILL_SOURCE_DIR } from "../core/config.ts"
import { deployAllGlobalFlow, deployAllChooseIdeFlow, deploySpecificGlobalFlow } from "./flows/deploy-global.flow.ts"
import { deployToProjectFlow } from "./flows/deploy-project.flow.ts"
import { listFlow } from "./flows/list.flow.ts"
import { EXIT_CODES } from "../core/exit-codes.ts"
import { log } from "../ui/logger.ts"

// ============================================================================
// CONFIG LOADER
// ============================================================================

function loadExcludedRefs(): string[] {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const cfgPath = path.join(__dirname, "..", "..", "skills.config.json")
    const raw = readFileSync(cfgPath, "utf8")
    const cfg = JSON.parse(raw) as { excludedSkills?: string[] }
    return cfg.excludedSkills ?? []
  } catch {
    return []
  }
}

// ============================================================================
// MAIN MENU
// isCancel after every prompt
// ============================================================================

export async function runMenu(): Promise<void> {
  clack.intro(pc.bold(pc.cyan("✦ Skills Manager")))

  const excludedRefs = loadExcludedRefs()

  while (true) {
    const action = await clack.select({
      message: "What would you like to do?",
      options: [
        { value: "deploy-all-global",    label: "Deploy ALL skills",          hint: "→ all IDEs (global)" },
        { value: "deploy-all-ide",       label: "Deploy ALL skills",          hint: "→ choose IDE (global)" },
        { value: "deploy-specific",      label: "Deploy specific skill",       hint: "→ global" },
        { value: "deploy-project",       label: "Deploy to project/workspace directory", hint: "→ multi-select" },
        { value: "list",                 label: "List available skills" },
        { value: "help",                 label: "Help" },
        { value: "exit",                 label: pc.dim("Exit") },
      ],
    })

    // handle cancel (Ctrl+C)
    if (clack.isCancel(action)) {
      clack.outro(pc.dim("Bye!"))
      process.exit(EXIT_CODES.CANCEL)
    }

    switch (action) {
      case "deploy-all-global":
        await deployAllGlobalFlow(excludedRefs)
        break
      case "deploy-all-ide":
        await deployAllChooseIdeFlow(excludedRefs)
        break
      case "deploy-specific":
        await deploySpecificGlobalFlow()
        break
      case "deploy-project":
        await deployToProjectFlow(excludedRefs)
        break
      case "list":
        await listFlow()
        break
      case "help":
        log.raw(`
${pc.bold("Interactive Commands:")}
  ${pc.cyan("Deploy ALL skills")}           Deploy all non-excluded skills to global IDE dirs.
  ${pc.cyan("Deploy specific skill")}       Deploy a single skill to global IDE dirs.
  ${pc.cyan("Deploy to project/workspace directory")} Deploy selected skills to a specific project/workspace.
  ${pc.cyan("List available skills")}       Show all skills in ${pc.dim(SKILL_SOURCE_DIR)}.

${pc.bold("CLI Equivalents (bypass the menu):")}
  ${pc.dim("$ skills list")}                  List all categories and skills
  ${pc.dim("$ skills deploy all")}            Deploy all skills to global IDEs
  ${pc.dim("$ skills deploy <skill-ref>")}    Deploy a specific skill globaly
  ${pc.dim("$ skills deploy all --project")}  Deploy all skills to the current directory
        `)
        break
      case "exit":
        clack.outro(pc.dim("Bye!"))
        process.exit(EXIT_CODES.SUCCESS)
    }

    // Small separator between actions (stay in menu loop)
    log.raw(pc.dim("─────────────────────────────"))
  }
}
