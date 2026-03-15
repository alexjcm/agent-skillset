import path from "path"
import type { Command } from "commander"
import pc from "picocolors"

import { readFileSync, existsSync } from "fs"
import { fileURLToPath } from "url"
import {
  deployAllGlobal,
  deployAllToProject,
  deploySkillGlobal,
  deploySkillToProject,
  loadSkillByRef,
} from "../core/deploy.ts"
import { ALL_IDE_KEYS, SKILL_SOURCE_DIR } from "../core/config.ts"
import { IdeTargetSchema } from "../core/types.ts"
import { EXIT_CODES } from "../core/exit-codes.ts"
import { log } from "../ui/logger.ts"
import type { IdeTarget, DeployResult } from "../core/types.ts"
import type { DeployOptions } from "../core/types.ts"

// ============================================================================
// CONFIG LOADER (exclusions)
// ============================================================================

function loadExcludedRefs(): string[] {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const cfgPath = path.join(__dirname, "..", "..", "skills.config.json")

  if (!existsSync(cfgPath)) {
    return []
  }

  try {
    const raw = readFileSync(cfgPath, "utf8")
    const cfg = JSON.parse(raw) as { excludedSkills?: string[] }
    return cfg.excludedSkills ?? []
  } catch (err) {
    log.error(`Failed to parse skills.config.json. Invalid JSON format?`)
    log.raw(pc.dim(err instanceof Error ? err.message : String(err)))
    process.exit(EXIT_CODES.ERROR)
  }
}

// ============================================================================
// RESULT RENDERER — called after all operations complete
// pure UI rendering, no domain logic
// ============================================================================

function renderResults(results: DeployResult[]): void {
  const copied = results.filter((r) => r.status === "copied")
  const skipped = results.filter((r) => r.status === "skipped" && r.reason !== "IDE not installed")
  const uninstalledIdes = new Set(
    results.filter((r) => r.status === "skipped" && r.reason === "IDE not installed").map((r) => r.ide)
  )
  const errors = results.filter((r) => r.status === "error")

  if (errors.length > 0) {
    log.step(pc.red("Errors:"))
    for (const r of errors) {
      log.error(`${r.skill.ref} → ${r.targetPath}`)
      if (r.error) log.raw(`    ${pc.dim(r.error)}`)
    }
  }

  const summary = [
    copied.length > 0 ? `${pc.green("✔")} ${pc.green(`${copied.length} skill${copied.length === 1 ? "" : "s"} copied`)}` : null,
    skipped.length > 0 ? `${pc.yellow("⚠")} ${pc.yellow(`${skipped.length} skipped`)}` : null,
    uninstalledIdes.size > 0 ? `${pc.yellow("⚠")} ${pc.yellow(`IDEs not installed: ${Array.from(uninstalledIdes).join(", ")}`)}` : null,
    errors.length > 0 ? `${pc.red("✖")} ${pc.red(`${errors.length} errors`)}` : null,
  ]
    .filter(Boolean)
    .join("  ")

  log.raw(`\n${summary}\n`)
}

// ============================================================================
// IDE RESOLVER
// Expands "all" → IdeTarget[]. Design decision: "all" never enters core/.
// ============================================================================

function resolveIdes(ideInput: string): IdeTarget[] {
  if (ideInput === "all") return [...ALL_IDE_KEYS]
  const parsed = IdeTargetSchema.safeParse(ideInput)
  if (!parsed.success) {
    log.error(`Invalid IDE: ${pc.yellow(ideInput)}. Valid: ${ALL_IDE_KEYS.join(", ")}, all`)
    process.exit(EXIT_CODES.ERROR)
  }
  return [parsed.data]
}

// ============================================================================
// PROJECT DIR RESOLVER
// Handles Commander --project [path] gotcha: value is true | string | undefined
// ============================================================================

function resolveProjectDir(raw: string | boolean | undefined): string | undefined {
  if (raw === true) return process.cwd()       // --project (no value) → CWD
  if (typeof raw === "string") return path.resolve(raw)  // --project /some/path
  return undefined                              // --project not used
}

// ============================================================================
// COMMAND: skills deploy <skill|all> [--ide <ide>] [--project [path]]
// SIGINT/SIGTERM handlers registered before filesystem ops.
// orchestration only here, logic in core/
// ============================================================================

export function registerDeployCommand(program: Command): void {
  program
    .command("deploy <skill>")
    .description(
      [
        "Deploy a skill or all skills to IDE directories.",
        `  skill   Relative skill ref (e.g. development/writing-junit-tests) or "all"`,
        `  Source directory: ${SKILL_SOURCE_DIR}`,
      ].join("\n")
    )
    .option(
      "-i, --ide <ide>",
      `Target IDE: ${ALL_IDE_KEYS.join(", ")}, all`,
      "all"
    )
    .option(
      "-p, --project [path]",
      "Deploy to project/workspace-level paths (default: current directory)"
    )
    .action(async (skillArg: string, opts: { ide: string; project?: string | boolean }) => {
      const ides = resolveIdes(opts.ide)
      const projectDir = resolveProjectDir(opts.project)  // handles boolean gotcha

      const options: DeployOptions = {
        excludedRefs: loadExcludedRefs(),
      }

      const label = projectDir
        ? `${pc.dim("project/workspace:")} ${projectDir}`
        : `${pc.dim("global")}`

      log.step(`Deploying ${skillArg} → ${label}...`)

      // SIGINT/SIGTERM handlers registered before filesystem ops.
      let results: DeployResult[] = []
      const cleanup = () => {
        log.error("Interrupted")
        process.exit(EXIT_CODES.CANCEL)
      }
      process.once("SIGINT", cleanup)
      process.once("SIGTERM", cleanup)

      try {
        if (skillArg === "all") {
          results = projectDir
            ? await deployAllToProject(ides, projectDir, options)
            : await deployAllGlobal(ides, options)
        } else {
          const skill = await loadSkillByRef(skillArg)
          results = projectDir
            ? await deploySkillToProject(skill, ides, projectDir)
            : await deploySkillGlobal(skill, ides)
        }
      } catch (err) {
        log.error(`Error: ${err instanceof Error ? err.message : String(err)}`)
        process.exit(EXIT_CODES.ERROR)
      } finally {
        process.off("SIGINT", cleanup)
        process.off("SIGTERM", cleanup)
      }

      renderResults(results)

      const hasErrors = results.some((r) => r.status === "error")
      if (hasErrors) process.exit(EXIT_CODES.ERROR)
    })
}
