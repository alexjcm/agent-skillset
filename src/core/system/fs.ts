import { access } from "node:fs/promises"
import { accessSync } from "node:fs"

// ============================================================================
// FS UTILS — centralized existence checks
//
// Using access() wrapped in try/catch instead of a check-then-act pattern.
// Only valid for guards where existence is checked WITHOUT an immediate
// follow-up operation on the same path (avoiding TOCTOU race conditions).
// ============================================================================

/**
 * Returns true if the given path exists and is accessible.
 * Non-throwing — returns false on any error (ENOENT, EACCES, etc.)
 */
export async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

/**
 * Synchronous variant of exists().
 * Use only in startup/config contexts where async is not available.
 */
export function existsSync(path: string): boolean {
  try {
    accessSync(path)
    return true
  } catch {
    return false
  }
}
