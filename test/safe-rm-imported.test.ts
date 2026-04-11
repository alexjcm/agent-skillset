import { tmpdir } from "node:os"
import path from "path"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mkdir, rm, symlink, writeFile } from "node:fs/promises"
import { exists } from "../src/core/fs-utils.ts"

const hoisted = vi.hoisted(() => ({
  importedRoot: "/tmp/skillctrl-imported-safe-rm-root",
}))
const IMPORTED_ROOT = hoisted.importedRoot

vi.mock("../src/core/user-config.ts", () => ({
  IMPORTED_DIR: hoisted.importedRoot,
}))

import { safeRmImported } from "../src/core/safe-rm.ts"

async function resetRoot(): Promise<void> {
  await rm(IMPORTED_ROOT, { recursive: true, force: true })
  await mkdir(IMPORTED_ROOT, { recursive: true })
}

describe("safeRmImported", () => {
  beforeEach(async () => {
    await resetRoot()
  })

  afterEach(async () => {
    await rm(IMPORTED_ROOT, { recursive: true, force: true })
  })

  it("removes a directory inside imported root", async () => {
    const target = path.join(IMPORTED_ROOT, "tools", "demo-skill")
    await mkdir(target, { recursive: true })
    await writeFile(path.join(target, "SKILL.md"), "# test")

    await safeRmImported(target)

    expect(await exists(target)).toBe(false)
  })

  it("rejects deleting imported root directly", async () => {
    await expect(safeRmImported(IMPORTED_ROOT)).rejects.toThrow("dangerous path")
  })

  it("rejects paths outside imported root", async () => {
    const outside = path.join(tmpdir(), "skillctrl-safe-rm-imported-outside", "demo")
    await mkdir(outside, { recursive: true })

    await expect(safeRmImported(outside)).rejects.toThrow("outside imported root")
    await rm(path.dirname(outside), { recursive: true, force: true })
  })

  it("rejects symlink deletion", async () => {
    const realDir = path.join(IMPORTED_ROOT, "real")
    const symlinkPath = path.join(IMPORTED_ROOT, "link")
    await mkdir(realDir, { recursive: true })
    await symlink(realDir, symlinkPath)

    await expect(safeRmImported(symlinkPath)).rejects.toThrow("refusing to remove symlink")
  })
})
