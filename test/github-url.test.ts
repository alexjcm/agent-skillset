import { describe, it, expect } from "vitest"
import { parseGitHubUrl } from "../src/core/imports/github/url.ts"

describe("parseGitHubUrl", () => {
  it("parses owner/repo shorthand as repo-level", () => {
    const ref = parseGitHubUrl("openai/skills")
    expect(ref).toEqual({
      owner: "openai",
      repo: "skills",
      branch: null,
      path: null,
      canonical: "https://github.com/openai/skills",
      isRepoLevel: true,
    })
  })

  it("normalizes blob SKILL.md urls to tree skill path", () => {
    const ref = parseGitHubUrl("https://github.com/openai/skills/blob/main/skills/.curated/security-threat-model/SKILL.md")
    expect(ref.owner).toBe("openai")
    expect(ref.repo).toBe("skills")
    expect(ref.branch).toBe("main")
    expect(ref.path).toBe("skills/.curated/security-threat-model")
    expect(ref.canonical).toBe("https://github.com/openai/skills/tree/main/skills/.curated/security-threat-model")
    expect(ref.isRepoLevel).toBe(false)
  })

  it("rejects non-github domains", () => {
    expect(() => parseGitHubUrl("https://gitlab.com/openai/skills")).toThrow("Invalid GitHub URL")
  })
})
