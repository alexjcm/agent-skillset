import { tmpdir } from "node:os"
import path from "path"
import { mkdtemp, mkdir, writeFile, symlink, realpath } from "node:fs/promises"
import { exists } from "../src/core/system/fs.ts"
import { describe, it, expect } from "vitest"
import { safeRm, safeRmProject } from "../src/core/system/safe-rm.ts"

async function mkTmp(prefix: string): Promise<string> {
  return mkdtemp(path.join(tmpdir(), prefix))
}

describe("safeRm", () => {
  it("removes a directory when path is under allowed prefix", async () => {
    const root = await mkTmp("skills-safe-rm-")
    const allowed = path.join(root, "allowed")
    const target = path.join(allowed, "skills", "example")
    await mkdir(target, { recursive: true })
    await writeFile(path.join(target, "SKILL.md"), "# test")

    await safeRm(target, [await realpath(allowed)])

    expect(await exists(target)).toBe(false)
  })

  it("rejects deletion of symlinks", async () => {
    const root = await mkTmp("skills-safe-rm-symlink-")
    const realDir = path.join(root, "real")
    const symlinkPath = path.join(root, "link")
    await mkdir(realDir, { recursive: true })
    await symlink(realDir, symlinkPath)

    await expect(safeRm(symlinkPath, [root])).rejects.toThrow("refusing to remove symlink")
  })

  it("rejects paths outside allowed prefixes", async () => {
    const root = await mkTmp("skills-safe-rm-outside-")
    const allowed = path.join(root, "allowed")
    const outside = path.join(root, "outside", "skills", "x")
    await mkdir(allowed, { recursive: true })
    await mkdir(outside, { recursive: true })

    await expect(safeRm(outside, [allowed])).rejects.toThrow("outside safe prefix")
  })
})

describe("safeRmProject", () => {
  it("removes directory inside project and under a /skills/ segment", async () => {
    const project = await mkTmp("skills-safe-rm-project-")
    const target = path.join(project, ".cursor", "skills", "sample")
    await mkdir(target, { recursive: true })
    await writeFile(path.join(target, "SKILL.md"), "# test")

    await safeRmProject(target, project)

    expect(await exists(target)).toBe(false)
  })

  it("rejects path outside project root", async () => {
    const project = await mkTmp("skills-safe-rm-project-outside-")
    const outsideRoot = await mkTmp("skills-safe-rm-project-other-")
    const outside = path.join(outsideRoot, ".cursor", "skills", "sample")
    await mkdir(outside, { recursive: true })

    await expect(safeRmProject(outside, project)).rejects.toThrow("outside project root")
  })

  it("rejects path without /skills/ segment", async () => {
    const project = await mkTmp("skills-safe-rm-project-nosegment-")
    const target = path.join(project, ".cursor", "cache", "sample")
    await mkdir(target, { recursive: true })

    await expect(safeRmProject(target, project)).rejects.toThrow("doesn't contain /skills/")
  })
})
