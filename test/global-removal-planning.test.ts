import { describe, expect, it } from "vitest"
import { groupSkillsForGlobalRemoval } from "../src/core/removal/global-planning.ts"
import type { Skill } from "../src/core/types.ts"

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

describe("groupSkillsForGlobalRemoval", () => {
  it("groups by deployed folder name and marks collisions", () => {
    const skills: Skill[] = [
      mkSkill("development/debug-helper", "debug-helper", "own"),
      mkSkill("tools/debug-helper", "debug-helper", "imported"),
      mkSkill("security/threat-model", "threat-model", "own"),
    ]

    const groups = groupSkillsForGlobalRemoval(skills)
    expect(groups).toHaveLength(2)

    expect(groups[0]).toEqual({
      deployName: "debug-helper",
      refs: ["development/debug-helper", "tools/debug-helper"],
      skills: [
        mkSkill("development/debug-helper", "debug-helper", "own"),
        mkSkill("tools/debug-helper", "debug-helper", "imported"),
      ],
      hasCollision: true,
    })

    expect(groups[1]).toEqual({
      deployName: "threat-model",
      refs: ["security/threat-model"],
      skills: [mkSkill("security/threat-model", "threat-model", "own")],
      hasCollision: false,
    })
  })
})
