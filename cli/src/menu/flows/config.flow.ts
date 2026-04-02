import * as clack from "@clack/prompts"
import * as fs from "fs-extra"
import * as pc from "../../ui/ansi.ts"
import { readUserConfig, saveUserConfig, SKILLS_HOME } from "../../core/user-config.ts"
import { log } from "../../ui/logger.ts"
import type { FlowResult } from "../flow-result.ts"

// ============================================================================
// CONFIG FLOW
// Accessible from the main menu as "Settings".
// Allows the user to view or change skillsDir (or clear it entirely).
// ============================================================================

export async function configFlow(): Promise<FlowResult> {
  log.step("Settings")

  const cfg = readUserConfig() ?? { excludedSkills: [] }
  const current = cfg.skillsDir

  log.raw(`  ${pc.bold("Skills home:")} ${SKILLS_HOME}`)
  log.raw(`  ${pc.bold("Own skills folder:")} ${current ? pc.green(current) : pc.dim("not configured")}`)
  log.raw("")

  const action = await clack.select({
    message: "What would you like to do?",
    options: [
      { value: "set", label: "Set / change own skills folder", hint: current ? `currently: ${current}` : "not set" },
      { value: "clear", label: "Clear own skills folder", hint: "revert to imported-only mode" },
      { value: "back", label: pc.dim("Back") },
    ],
  })

  if (clack.isCancel(action) || action === "back") return "completed"

  if (action === "clear") {
    saveUserConfig({ ...cfg, skillsDir: undefined })
    log.success("Own skills folder cleared. CLI will use only ~/.skills/imported/.")
    return "completed"
  }

  // ----------- set / change -----------
  const input = await clack.text({
    message: "Absolute path to your skills folder:",
    placeholder: current ?? "e.g. /Users/you/my-skills",
    initialValue: current ?? "",
    validate(value) {
      const trimmed = (value ?? "").trim()
      if (!trimmed) return "Path cannot be empty."
      if (!trimmed.startsWith("/") && !/^[A-Z]:\\/i.test(trimmed)) {
        return "Please enter an absolute path (starts with / on Unix, C:\\ on Windows)."
      }
    },
  })

  if (clack.isCancel(input)) return "cancelled"

  const newPath = (typeof input === "string" ? input : "").trim()

  // Check if it exists; if not, offer to create it
  if (!(await fs.pathExists(newPath))) {
    const create = await clack.confirm({
      message: `"${newPath}" does not exist. Create it?`,
      initialValue: true,
    })
    if (clack.isCancel(create) || !create) {
      log.warn("Folder not created. Setting was not saved.")
      return "cancelled"
    }
    await fs.ensureDir(newPath)
    log.success(`Created ${newPath}`)
  }

  saveUserConfig({ ...cfg, skillsDir: newPath })
  log.success(`Own skills folder set to: ${pc.green(newPath)}`)
  return "completed"
}
