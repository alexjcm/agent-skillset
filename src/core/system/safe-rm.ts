import path from "path"
import os from "os"
import { lstat, realpath, rm } from "node:fs/promises"
import { exists } from "./fs.ts"
import { IMPORTED_DIR } from "../config/user-config.ts"

// ============================================================================
// SAFE RM — global IDE paths
// Deletes a directory only if it starts with one of the allowed prefixes.
// all path operations use path.join/path.resolve
// ============================================================================

export async function safeRm(
  targetPath: string,
  allowedPrefixes: readonly string[]
): Promise<void> {
  if (!targetPath) throw new Error("safeRm: empty path")
  if (!(await exists(targetPath))) return // nothing to do
  if ((await lstat(targetPath)).isSymbolicLink()) {
    throw new Error(`safeRm: refusing to remove symlink: ${targetPath}`)
  }

  const real = await realpath(targetPath)

  const homeDir = os.homedir()
  if (real === "/" || real === homeDir) {
    throw new Error(`safeRm: dangerous path: ${real}`)
  }

  const isAllowed = allowedPrefixes.some((prefix) =>
    real.startsWith(prefix.endsWith(path.sep) ? prefix : prefix + path.sep)
  )
  if (!isAllowed) {
    throw new Error(`safeRm: path outside safe prefix: ${real}`)
  }

  await rm(real, { recursive: true, force: true })
}

// ============================================================================
// SAFE RM PROJECT — project-level paths
// Double validation (design decision from plan):
//   1. path must start with resolvedProjectDir
//   2. path must contain /skills/ as a path segment
// ============================================================================

export async function safeRmProject(
  targetPath: string,
  projectDir: string
): Promise<void> {
  if (!targetPath) throw new Error("safeRmProject: empty path")
  if (!(await exists(targetPath))) return // nothing to do
  if ((await lstat(targetPath)).isSymbolicLink()) {
    throw new Error(`safeRmProject: refusing to remove symlink: ${targetPath}`)
  }

  const realTarget = await realpath(targetPath)
  const realProject = await realpath(projectDir)

  const homeDir = os.homedir()
  if (realTarget === "/" || realTarget === homeDir) {
    throw new Error(`safeRmProject: dangerous path: ${realTarget}`)
  }

  // 1. Must be inside the project root
  if (!realTarget.startsWith(realProject + path.sep)) {
    throw new Error(`safeRmProject: path outside project root: ${realTarget}`)
  }

  // 2. Must contain /skills/ as a segment (not just anywhere in a name)
  const skillsSegment = path.sep + "skills" + path.sep
  if (!realTarget.includes(skillsSegment)) {
    throw new Error(`safeRmProject: path doesn't contain /skills/: ${realTarget}`)
  }

  await rm(realTarget, { recursive: true, force: true })
}

// ============================================================================
// SAFE RM IMPORTED — imported skills cache (~/.skillctrl/imported)
// Must be inside IMPORTED_DIR and must not be a symlink.
// ============================================================================

export async function safeRmImported(targetPath: string): Promise<void> {
  if (!targetPath) throw new Error("safeRmImported: empty path")
  if (!(await exists(targetPath))) return
  if ((await lstat(targetPath)).isSymbolicLink()) {
    throw new Error(`safeRmImported: refusing to remove symlink: ${targetPath}`)
  }

  const realTarget = await realpath(targetPath)
  const importedRootReal = await realpath(IMPORTED_DIR).catch(() => path.resolve(IMPORTED_DIR))
  const homeDir = os.homedir()

  if (realTarget === "/" || realTarget === homeDir || realTarget === importedRootReal) {
    throw new Error(`safeRmImported: dangerous path: ${realTarget}`)
  }

  if (!realTarget.startsWith(importedRootReal + path.sep)) {
    throw new Error(`safeRmImported: path outside imported root: ${realTarget}`)
  }

  await rm(realTarget, { recursive: true, force: true })
}
