import path from "path"
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { SkillsConfigSchema } from "./types.ts"
import { readUserConfig, saveUserConfig, hasUserConfig } from "./user-config.ts"
import { log } from "../ui/logger.ts"

// ============================================================================
// PROJECT-LEVEL CONFIG PATH
// Used only for migration fallback. Resolved relative to this source file.
// ============================================================================

function getProjectConfigPath(configPath?: string): string {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  return configPath ?? path.join(__dirname, "..", "..", "skills.config.json")
}

// ============================================================================
// MIGRATION: cli/skills.config.json → ~/.skillctrl/config.json
// Runs once on first launch when global config does not yet exist but the
// project-level file does. The project file is not deleted automatically.
// ============================================================================

function migrateProjectConfig(projectConfigPath: string): string[] {
  try {
    const raw = readFileSync(projectConfigPath, "utf8")
    const parsedJson = JSON.parse(raw) as unknown
    const parsed = SkillsConfigSchema.safeParse(parsedJson)
    const excludedSkills = parsed.success ? parsed.data.excludedSkills : []

    saveUserConfig({ excludedSkills })

    log.info("Migrated skills.config.json → ~/.skillctrl/config.json")
    log.raw("  You can now delete cli/skills.config.json from your repo.")

    return excludedSkills
  } catch {
    // Migration failed silently — start with an empty config
    saveUserConfig({ excludedSkills: [] })
    return []
  }
}

// ============================================================================
// LOAD EXCLUDED REFS
// Priority:
//   1. ~/.skillctrl/config.json  (global user config, via readUserConfig())
//   2. cli/skills.config.json (project fallback → triggers one-time migration)
//   3. Empty array            (no config anywhere)
// ============================================================================

export function loadExcludedRefs(): string[] {
  return loadExcludedRefsFromPath()
}

export function loadExcludedRefsFromPath(configPath?: string): string[] {
  // Priority 1: global user config already exists
  if (hasUserConfig()) {
    const cfg = readUserConfig()
    return cfg?.excludedSkills ?? []
  }

  // Priority 2: project-level file exists → migrate it first
  const projectPath = getProjectConfigPath(configPath)
  try {
    readFileSync(projectPath, "utf8") // existence check
    return migrateProjectConfig(projectPath)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      // No project file either — create minimal global config silently
      saveUserConfig({ excludedSkills: [] })
      return []
    }
    // Unreadable for other reasons — create minimal global config
    saveUserConfig({ excludedSkills: [] })
    return []
  }
}
