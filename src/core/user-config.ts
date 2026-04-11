import path from "path"
import os from "os"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { existsSync } from "./fs-utils.ts"

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

export interface UserConfig {
  ownSkillsDir?: string
  excludedSkills: string[]
}

function parseUserConfig(raw: unknown): UserConfig {
  const defaultConfig: UserConfig = { excludedSkills: [] }

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return defaultConfig
  }

  const obj = raw as Record<string, unknown>
  const result: UserConfig = { excludedSkills: [] }

  if (typeof obj.ownSkillsDir === "string") {
    result.ownSkillsDir = obj.ownSkillsDir
  }

  if (Array.isArray(obj.excludedSkills)) {
    result.excludedSkills = obj.excludedSkills.filter(
      (item): item is string => typeof item === "string"
    )
  }

  return result
}

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
    const raw = readFileSync(getConfigPath(), "utf8")
    const parsed = JSON.parse(raw)
    return parseUserConfig(parsed)
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
  return existsSync(getConfigPath())
}

// ============================================================================
// SAVE
// ============================================================================

/** Persists the config to the config file (creates dir if needed). */
export function saveUserConfig(config: UserConfig): void {
  const cfgPath = getConfigPath()
  mkdirSync(path.dirname(cfgPath), { recursive: true })
  writeFileSync(cfgPath, JSON.stringify(config, null, 2) + "\n", "utf8")
}
