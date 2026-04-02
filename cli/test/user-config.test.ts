import { describe, it, expect } from "vitest"
import os from "os"
import path from "path"
import * as fs from "fs-extra"
import { readUserConfig, saveUserConfig, hasUserConfig } from "../src/core/user-config.ts"

async function mkTmp(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix))
}

async function withTmpConfig<T>(fn: (cfgPath: string) => Promise<T>): Promise<T> {
  const tmpDir = await mkTmp("skills-user-config-")
  const cfgPath = path.join(tmpDir, "config.json")
  const prev = process.env["SKILLS_CONFIG_PATH"]
  process.env["SKILLS_CONFIG_PATH"] = cfgPath

  try {
    return await fn(cfgPath)
  } finally {
    if (prev === undefined) delete process.env["SKILLS_CONFIG_PATH"]
    else process.env["SKILLS_CONFIG_PATH"] = prev
    await fs.remove(tmpDir)
  }
}

describe("user-config", () => {
  it("returns null when config does not exist", async () => {
    await withTmpConfig(async () => {
      expect(hasUserConfig()).toBe(false)
      expect(readUserConfig()).toBeNull()
    })
  })

  it("saves and reads config", async () => {
    await withTmpConfig(async () => {
      saveUserConfig({
        skillsDir: "/tmp/my-skills",
        excludedSkills: ["tools/example-skill"],
      })

      expect(hasUserConfig()).toBe(true)
      expect(readUserConfig()).toEqual({
        skillsDir: "/tmp/my-skills",
        excludedSkills: ["tools/example-skill"],
      })
    })
  })

  it("falls back to empty excludedSkills on invalid json", async () => {
    await withTmpConfig(async (cfgPath) => {
      await fs.ensureDir(path.dirname(cfgPath))
      await fs.writeFile(cfgPath, "{invalid-json", "utf8")

      expect(readUserConfig()).toEqual({ excludedSkills: [] })
    })
  })
})
