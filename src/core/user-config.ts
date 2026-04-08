import path from "path"
import os from "os"
import fs from "fs-extra"
import { z } from "zod"

// ============================================================================
// CONSTANTS — always fixed, never configurable
// ============================================================================

export const SKILLS_HOME = path.join(os.homedir(), ".skillctrl")
export const IMPORTED_DIR = path.join(SKILLS_HOME, "imported")

/** In tests, set SKILLS_CONFIG_PATH to a temp file to avoid touching the real config. */
function getConfigPath(): string {
  return process.env["SKILLS_CONFIG_PATH"] ?? path.join(SKILLS_HOME, "config.json")
}

// ============================================================================
// SCHEMA
// ============================================================================

const UserConfigSchema = z.object({
  ownSkillsDir: z.string().optional(),
  excludedSkills: z.array(z.string()).default([]),
})

export type UserConfig = z.infer<typeof UserConfigSchema>

// ============================================================================
// READ
// ============================================================================

/**
 * Reads ~/.skillctrl/config.json.
 * Returns null if the file does not exist yet (first run).
 * Returns the parsed config (with defaults applied) otherwise.
 */
export function readUserConfig(): UserConfig | null {
  try {
    const raw = fs.readFileSync(getConfigPath(), "utf8")
    const parsed = UserConfigSchema.safeParse(JSON.parse(raw) as unknown)
    if (!parsed.success) return { excludedSkills: [] }
    return parsed.data
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null
    return { excludedSkills: [] }
  }
}

// ============================================================================
// HAS CONFIG
// ============================================================================

/** Returns true when the config file already exists on disk. */
export function hasUserConfig(): boolean {
  return fs.pathExistsSync(getConfigPath())
}

// ============================================================================
// SAVE
// ============================================================================

/** Persists the config to the config file (creates dir if needed). */
export function saveUserConfig(config: UserConfig): void {
  const cfgPath = getConfigPath()
  fs.ensureDirSync(path.dirname(cfgPath))
  fs.writeFileSync(cfgPath, JSON.stringify(config, null, 2) + "\n", "utf8")
}
