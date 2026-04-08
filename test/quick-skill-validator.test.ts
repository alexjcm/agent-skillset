import { describe, it, expect } from "vitest"
import { validateSkillContent } from "../src/core/quick-skill-validator.ts"

describe("validateSkillContent", () => {
  it("accepts valid minimal frontmatter", () => {
    const content = `---\nname: security-threat-model\ndescription: Threat modeling skill.\n---\n# Title\nBody`
    expect(validateSkillContent(content)).toEqual({ valid: true })
  })

  it("rejects missing frontmatter", () => {
    const content = "# Skill without metadata"
    expect(validateSkillContent(content)).toEqual({
      valid: false,
      reason: "No YAML frontmatter found",
    })
  })

  it("rejects invalid name format", () => {
    const content = `---\nname: Invalid_Name\ndescription: ok\n---\nbody`
    expect(validateSkillContent(content)).toEqual({
      valid: false,
      reason: "Invalid name format",
    })
  })

  it("rejects missing description", () => {
    const content = `---\nname: valid-name\n---\nbody`
    expect(validateSkillContent(content)).toEqual({
      valid: false,
      reason: "Missing 'description'",
    })
  })
})
