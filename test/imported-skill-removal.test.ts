import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  return {
    exists: vi.fn<(path: string) => Promise<boolean>>(),
    safeRmImported: vi.fn<(path: string) => Promise<void>>(),
    getAllEntries: vi.fn<() => [string, { source: string; importedAt: string } ][]>(),
    deleteEntries: vi.fn<(refs: readonly string[]) => { removed: string[]; missing: string[] }>(),
    discoverSkills: vi.fn<() => Promise<Array<{ ref: string; source: "own" | "imported" }>>>(),
  }
})

vi.mock("../src/core/user-config.ts", () => ({
  IMPORTED_DIR: "/tmp/imported-root",
}))

vi.mock("../src/core/fs-utils.ts", () => ({
  exists: mocks.exists,
}))

vi.mock("../src/core/safe-rm.ts", () => ({
  safeRmImported: mocks.safeRmImported,
}))

vi.mock("../src/core/skill-imports.ts", () => ({
  getAllEntries: mocks.getAllEntries,
  deleteEntries: mocks.deleteEntries,
}))

vi.mock("../src/core/skills.ts", () => ({
  discoverSkills: mocks.discoverSkills,
}))

import {
  listKnownImportedRefs,
  removeImportedSkills,
} from "../src/core/imported-skill-removal.ts"

describe("imported skill removal core", () => {
  beforeEach(() => {
    mocks.exists.mockReset()
    mocks.safeRmImported.mockReset()
    mocks.getAllEntries.mockReset()
    mocks.deleteEntries.mockReset()
    mocks.discoverSkills.mockReset()
  })

  it("deletes imported folder and registry entry for a known ref", async () => {
    mocks.exists.mockResolvedValue(true)
    mocks.getAllEntries.mockReturnValue([
      ["tools/my-skill", { source: "https://github.com/a/b", importedAt: "2026-01-01T00:00:00.000Z" }],
    ])
    mocks.deleteEntries.mockReturnValue({ removed: ["tools/my-skill"], missing: [] })

    const results = await removeImportedSkills(["tools/my-skill"])

    expect(mocks.safeRmImported).toHaveBeenCalledWith("/tmp/imported-root/tools/my-skill")
    expect(mocks.deleteEntries).toHaveBeenCalledWith(["tools/my-skill"])
    expect(results).toEqual([
      {
        scope: "imported",
        itemId: "tools/my-skill",
        targetPath: "/tmp/imported-root/tools/my-skill",
        status: "deleted",
      },
    ])
  })

  it("returns skipped when ref is already absent from disk and registry", async () => {
    mocks.exists.mockResolvedValue(false)
    mocks.getAllEntries.mockReturnValue([])

    const results = await removeImportedSkills(["tools/missing-skill"])

    expect(mocks.safeRmImported).not.toHaveBeenCalled()
    expect(mocks.deleteEntries).not.toHaveBeenCalled()
    expect(results).toEqual([
      {
        scope: "imported",
        itemId: "tools/missing-skill",
        targetPath: "/tmp/imported-root/tools/missing-skill",
        status: "skipped",
        reason: "Not found in imported storage or registry",
      },
    ])
  })

  it("returns error for unsafe refs that attempt path escaping", async () => {
    mocks.getAllEntries.mockReturnValue([])
    const results = await removeImportedSkills(["../escape"])

    expect(mocks.safeRmImported).not.toHaveBeenCalled()
    expect(results).toHaveLength(1)
    expect(results[0]?.status).toBe("error")
    expect(results[0]?.itemId).toBe("../escape")
    expect(results[0]?.targetPath).toBe("/tmp/imported-root")
  })

  it("lists known refs from registry + disk and deduplicates values", async () => {
    mocks.getAllEntries.mockReturnValue([
      ["tools/shared", { source: "https://github.com/a/b", importedAt: "2026-01-01T00:00:00.000Z" }],
      ["tools/from-registry", { source: "https://github.com/c/d", importedAt: "2026-01-01T00:00:00.000Z" }],
    ])
    mocks.discoverSkills.mockResolvedValue([
      { ref: "tools/shared", source: "imported" },
      { ref: "tools/from-disk", source: "imported" },
      { ref: "development/own-skill", source: "own" },
    ])

    const refs = await listKnownImportedRefs()
    expect(refs).toEqual(["tools/from-disk", "tools/from-registry", "tools/shared"])
  })

  it("list + remove uses known refs and skips duplicates", async () => {
    mocks.getAllEntries.mockReturnValue([
      ["tools/shared", { source: "https://github.com/a/b", importedAt: "2026-01-01T00:00:00.000Z" }],
    ])
    mocks.discoverSkills.mockResolvedValue([
      { ref: "tools/shared", source: "imported" },
      { ref: "tools/second", source: "imported" },
    ])
    mocks.exists.mockResolvedValue(true)
    mocks.deleteEntries.mockReturnValue({ removed: ["tools/shared", "tools/second"], missing: [] })

    const refs = await listKnownImportedRefs()
    const results = await removeImportedSkills(refs)

    expect(results).toHaveLength(2)
    expect(mocks.safeRmImported).toHaveBeenCalledTimes(2)
    expect(mocks.deleteEntries).toHaveBeenCalledTimes(1)
    expect(mocks.deleteEntries).toHaveBeenCalledWith(["tools/shared"])
  })

  it("returns error when batch registry update fails", async () => {
    mocks.getAllEntries.mockReturnValue([
      ["tools/my-skill", { source: "https://github.com/a/b", importedAt: "2026-01-01T00:00:00.000Z" }],
    ])
    mocks.exists.mockResolvedValue(true)
    mocks.deleteEntries.mockImplementation(() => {
      throw new Error("disk full")
    })

    const results = await removeImportedSkills(["tools/my-skill"])
    expect(results).toHaveLength(1)
    expect(results[0]?.status).toBe("error")
    expect(results[0]?.error).toContain("Failed to update import registry")
  })
})
