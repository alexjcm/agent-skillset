import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Skill, IdeTarget } from "../src/core/types.ts"

const mocks = vi.hoisted(() => ({
  discoverSkills: vi.fn<() => Promise<Skill[]>>(),
  exists: vi.fn<(path: string) => Promise<boolean>>(),
  safeRm: vi.fn<(targetPath: string, allowedPrefixes: readonly string[]) => Promise<void>>(),
}))

vi.mock("../src/core/skills/discovery.ts", () => ({
  discoverSkills: mocks.discoverSkills,
}))

vi.mock("../src/core/system/fs.ts", () => ({
  exists: mocks.exists,
}))

vi.mock("../src/core/system/safe-rm.ts", () => ({
  safeRm: mocks.safeRm,
}))

vi.mock("../src/core/config/ide-paths.ts", () => ({
  IDE_GLOBAL_PATHS: {
    claude: ["/targets/claude/skills"],
    cursor: ["/targets/cursor/skills", "/targets/agents/skills"],
  },
  IDE_BASE_DIRS: {
    claude: "/targets/claude",
    cursor: "/targets/cursor",
  },
}))

import {
  listKnownGlobalRemovalCandidates,
  removeKnownGlobalSkillsByDeployNames,
} from "../src/core/removal/global.ts"

function mkSkill(ref: string, name: string, source: "own" | "imported"): Skill {
  const parts = ref.split("/")
  const category = parts.length > 1 ? parts.slice(0, -1).join("/") : ""

  return {
    ref,
    name,
    category,
    path: `/tmp/${ref}`,
    source,
  }
}

describe("global skill removal core", () => {
  beforeEach(() => {
    mocks.discoverSkills.mockReset()
    mocks.exists.mockReset()
    mocks.safeRm.mockReset()
  })

  it("lists known candidates grouped by deployed name with collision metadata", async () => {
    mocks.discoverSkills.mockResolvedValue([
      mkSkill("development/shared-name", "shared-name", "own"),
      mkSkill("tools/shared-name", "shared-name", "imported"),
      mkSkill("security/unique", "unique", "own"),
    ])

    const groups = await listKnownGlobalRemovalCandidates()
    expect(groups).toHaveLength(2)
    expect(groups[0]?.deployName).toBe("shared-name")
    expect(groups[0]?.hasCollision).toBe(true)
    expect(groups[0]?.refs).toEqual(["development/shared-name", "tools/shared-name"])
  })

  it("deletes known skills across selected IDE global targets", async () => {
    mocks.discoverSkills.mockResolvedValue([
      mkSkill("security/threat-model", "threat-model", "own"),
    ])
    mocks.exists.mockImplementation(async (targetPath: string) => {
      return (
        targetPath === "/targets/claude" ||
        targetPath === "/targets/cursor" ||
        targetPath === "/targets/claude/skills/threat-model" ||
        targetPath === "/targets/cursor/skills/threat-model" ||
        targetPath === "/targets/agents/skills/threat-model"
      )
    })
    mocks.safeRm.mockResolvedValue()

    const results = await removeKnownGlobalSkillsByDeployNames(
      ["claude", "cursor"] as IdeTarget[],
      ["threat-model"]
    )

    expect(results).toHaveLength(3)
    expect(results.every((result) => result.status === "deleted")).toBe(true)
    expect(mocks.safeRm).toHaveBeenCalledTimes(3)
  })

  it("skips targets when selected IDE is not installed", async () => {
    mocks.discoverSkills.mockResolvedValue([
      mkSkill("security/threat-model", "threat-model", "own"),
    ])
    mocks.exists.mockImplementation(async (targetPath: string) => {
      return targetPath === "/targets/claude" || targetPath === "/targets/claude/skills/threat-model"
    })

    const results = await removeKnownGlobalSkillsByDeployNames(
      ["claude", "cursor"] as IdeTarget[],
      ["threat-model"]
    )

    const skippedNotInstalled = results.filter((result) => result.reason === "IDE not installed")
    expect(skippedNotInstalled).toHaveLength(2)
    expect(skippedNotInstalled.every((result) => result.status === "skipped")).toBe(true)
  })

  it("returns error results when safe deletion fails", async () => {
    mocks.discoverSkills.mockResolvedValue([
      mkSkill("security/threat-model", "threat-model", "own"),
    ])
    mocks.exists.mockImplementation(async (targetPath: string) => {
      return targetPath === "/targets/claude" || targetPath === "/targets/claude/skills/threat-model"
    })
    mocks.safeRm.mockRejectedValue(new Error("safeRm: path outside safe prefix"))

    const results = await removeKnownGlobalSkillsByDeployNames(
      ["claude"] as IdeTarget[],
      ["threat-model"]
    )

    expect(results).toHaveLength(1)
    expect(results[0]?.status).toBe("error")
    expect(results[0]?.error).toContain("outside safe prefix")
  })

  it("supports deleting all known global skills via list + remove", async () => {
    mocks.discoverSkills.mockResolvedValue([
      mkSkill("security/threat-model", "threat-model", "own"),
      mkSkill("tools/debug-helper", "debug-helper", "imported"),
    ])
    mocks.exists.mockImplementation(async (targetPath: string) => {
      return (
        targetPath === "/targets/claude" ||
        targetPath === "/targets/claude/skills/threat-model" ||
        targetPath === "/targets/claude/skills/debug-helper"
      )
    })
    mocks.safeRm.mockResolvedValue()

    const groups = await listKnownGlobalRemovalCandidates()
    const results = await removeKnownGlobalSkillsByDeployNames(
      ["claude"] as IdeTarget[],
      groups.map((group) => group.deployName)
    )

    expect(results).toHaveLength(2)
    expect(results.every((result) => result.status === "deleted")).toBe(true)
  })
})
