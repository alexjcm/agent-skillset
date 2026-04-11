import { readUserConfig, saveUserConfig, hasUserConfig } from "./user-config.ts"

// ============================================================================
// LOAD EXCLUDED REFS
// Priority:
//   1. ~/.skillctrl/config.json  (global user config, via readUserConfig())
//   2. Empty array               (initial state, creates config silently)
// ============================================================================

export function loadExcludedRefs(): string[] {
  if (hasUserConfig()) {
    const cfg = readUserConfig()
    return cfg?.excludedSkills ?? []
  }

  // First run: create minimal global config silently
  saveUserConfig({ excludedSkills: [] })
  return []
}
