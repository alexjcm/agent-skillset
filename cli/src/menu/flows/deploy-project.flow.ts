import path from "path"
import * as clack from "@clack/prompts"
import pc from "picocolors"

import * as fs from "fs-extra"
import { ALL_IDE_KEYS } from "../../core/config.ts"
import { deploySkillToProject } from "../../core/deploy.ts"
import type { IdeTarget, DeployResult } from "../../core/types.ts"
import { selectIde } from "../prompts/select-ide.ts"
import { multiSelectSkills } from "../prompts/select-skill.ts"
import { EXIT_CODES } from "../../core/exit-codes.ts"
import { log } from "../../ui/logger.ts"

// ============================================================================
// RENDER results
// ============================================================================

function renderMenuResults(results: DeployResult[]): void {
  const copied = results.filter((r) => r.status === "copied").length
  const skipped = results.filter((r) => r.status === "skipped" && r.reason !== "IDE not installed").length
  const uninstalledIdes = new Set(
    results.filter((r) => r.status === "skipped" && r.reason === "IDE not installed").map((r) => r.ide)
  )
  const errors = results.filter((r) => r.status === "error")

  if (errors.length > 0) {
    for (const r of errors) {
      log.error(`${r.skill.ref} → ${r.targetPath}: ${r.error ?? "unknown error"}`)
    }
  }

  const parts = [
    copied > 0 ? `${pc.green("✔")} ${pc.green(`${copied} skill${copied === 1 ? "" : "s"} copied`)}` : null,
    skipped > 0 ? `${pc.yellow("⚠")} ${pc.yellow(`${skipped} skipped`)}` : null,
    uninstalledIdes.size > 0 ? `${pc.yellow("⚠")} ${pc.yellow(`IDEs not installed: ${Array.from(uninstalledIdes).join(", ")}`)}` : null,
    errors.length > 0 ? `${pc.red("✖")} ${pc.red(`${errors.length} errors`)}` : null,
  ].filter(Boolean)

  log.raw(parts.join("  "))
}

// ============================================================================
// FLOW: Deploy to project directory
// Handles: path input, IDE, multi-select skills, confirm, spinner
// isCancel on every prompt
// ============================================================================

export async function deployToProjectFlow(excludedRefs: string[]): Promise<void> {
  // Step 1: get project path (auto-detect if CWD is a project)
  const isGitRepo = await fs.pathExists(path.join(process.cwd(), ".git"))
  const isNpmProject = await fs.pathExists(path.join(process.cwd(), "package.json"))

  const promptOptions: Parameters<typeof clack.text>[0] = {
    message: "Enter project/workspace directory path:",
    placeholder: process.cwd(),
    validate: (value) => {
      if (!value?.trim()) return "Path cannot be empty"
    },
  }

  if (isGitRepo || isNpmProject) {
    promptOptions.initialValue = process.cwd()
  }

  const rawPath = await clack.text(promptOptions)
  if (clack.isCancel(rawPath)) {
    clack.cancel("Cancelled")
    process.exit(EXIT_CODES.CANCEL)
  }

  // use path.resolve, not concatenation
  const projectDir = path.resolve(rawPath.trim() || process.cwd())

  if (!(await fs.pathExists(projectDir))) {
    log.error(`Directory does not exist: ${projectDir}`)
    return
  }

  // Step 2: select IDE
  const ide = await selectIde(true)
  if (!ide) return

  const ides: IdeTarget[] = ide === "all" ? [...ALL_IDE_KEYS] : [ide]

  // Step 3: multi-select skills (all or subset)
  const scopeResult = await clack.select({
    message: "Which skills to deploy?",
    options: [
      { value: "all", label: "All skills (excluding excluded)" },
      { value: "select", label: "Select specific skills" },
    ],
  })
  if (clack.isCancel(scopeResult)) {
    clack.cancel("Cancelled")
    process.exit(EXIT_CODES.CANCEL)
  }

  let skills
  if (scopeResult === "all") {
    const { discoverSkills, isExcluded } = await import("../../core/skills.ts")
    const all = await discoverSkills()
    skills = all.filter((s) => !isExcluded(s.ref, excludedRefs))
  } else {
    skills = await multiSelectSkills()
    if (skills.length === 0) return
  }

  // Step 4: confirm
  const confirmed = await clack.confirm({
    message: `Deploy ${pc.bold(String(skills.length))} skill${skills.length === 1 ? "" : "s"} to ${pc.bold(path.basename(projectDir))} [${ide}]?`,
  })
  if (clack.isCancel(confirmed) || !confirmed) {
    clack.cancel("Cancelled")
    process.exit(EXIT_CODES.CANCEL)
  }

  // Step 5: deploy
  const spin = clack.spinner()
  spin.start(`Deploying to ${projectDir}...`)

  try {
    const results: DeployResult[] = []
    for (const skill of skills) {
      const r = await deploySkillToProject(skill, ides, projectDir)
      results.push(...r)
    }

    spin.stop("Done")
    renderMenuResults(results)
  } catch (err) {
    spin.stop("Failed")
    log.error(err instanceof Error ? err.message : String(err))
  }

  // Step 6: Git Exclude prompt
  const gitExcludePath = path.join(projectDir, ".git", "info", "exclude")
  if (await fs.pathExists(gitExcludePath)) {
    const shouldExclude = await clack.confirm({
      message: `Do you want to exclude the generated skill directories from Git? (Updates ${pc.dim(".git/info/exclude")})`,
      initialValue: true,
    })

    if (!clack.isCancel(shouldExclude) && shouldExclude) {
      try {
        let excludeContent = await fs.readFile(gitExcludePath, "utf-8")
        let changesMade = false

        const dirsToExclude = [".agent/", ".cursor/", ".windsurf/", ".claude/"]

        for (const dir of dirsToExclude) {
          if (!excludeContent.includes(dir)) {
            excludeContent += `\n${dir}\n`
            changesMade = true
          }
        }

        if (changesMade) {
          await fs.outputFile(gitExcludePath, excludeContent.trim() + "\n")
          log.success("Git exclusion rules updated successfully.")
        } else {
          log.info("Git exclusion rules were already present. No changes made.")
        }
      } catch (err) {
        log.warn(`Could not update .git/info/exclude: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  }
}
