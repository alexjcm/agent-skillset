import { describe, it, expect, beforeEach } from "vitest"
import os from "os"
import path from "path"
import * as fs from "fs-extra"
import { loadExcludedRefsFromPath } from "../src/core/skills-config.ts"

async function mkTmp(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix))
}

// Each test isolates the global config by pointing SKILLS_CONFIG_PATH to a
// temp file that does not exist yet. This prevents the dev machine's real
// ~/.skillctrl/config.json from being read or mutated.
async function withTmpGlobalConfig<T>(fn: (globalCfgPath: string) => Promise<T>): Promise<T> {
  const tmpDir = await mkTmp("skills-global-cfg-")
  const fakeCfgPath = path.join(tmpDir, "config.json")
  const prev = process.env["SKILLS_CONFIG_PATH"]
  process.env["SKILLS_CONFIG_PATH"] = fakeCfgPath
  try {
    return await fn(fakeCfgPath)
  } finally {
    if (prev === undefined) delete process.env["SKILLS_CONFIG_PATH"]
    else process.env["SKILLS_CONFIG_PATH"] = prev
    await fs.remove(tmpDir)
  }
}

describe("loadExcludedRefsFromPath", () => {
  it("returns excluded skills from valid config", async () => {
    await withTmpGlobalConfig(async () => {
      const dir = await mkTmp("skills-config-valid-")
      const cfgPath = path.join(dir, "skills.config.json")
      await fs.writeJSON(cfgPath, {
        excludedSkills: ["development/example-skill", "tools/another-skill"],
      })

      const refs = loadExcludedRefsFromPath(cfgPath)
      expect(refs).toEqual(["development/example-skill", "tools/another-skill"])
      await fs.remove(dir)
    })
  })

  it("returns empty list when file is missing", async () => {
    await withTmpGlobalConfig(async () => {
      const dir = await mkTmp("skills-config-missing-")
      const refs = loadExcludedRefsFromPath(path.join(dir, "missing.json"))
      expect(refs).toEqual([])
      await fs.remove(dir)
    })
  })

  it("returns empty list when config is invalid json", async () => {
    await withTmpGlobalConfig(async () => {
      const dir = await mkTmp("skills-config-invalid-json-")
      const cfgPath = path.join(dir, "skills.config.json")
      await fs.writeFile(cfgPath, "{invalid-json")

      const refs = loadExcludedRefsFromPath(cfgPath)
      expect(refs).toEqual([])
      await fs.remove(dir)
    })
  })

  it("returns empty list when schema is invalid", async () => {
    await withTmpGlobalConfig(async () => {
      const dir = await mkTmp("skills-config-invalid-schema-")
      const cfgPath = path.join(dir, "skills.config.json")
      await fs.writeJSON(cfgPath, {
        excludedSkills: [123],
      })

      const refs = loadExcludedRefsFromPath(cfgPath)
      expect(refs).toEqual([])
      await fs.remove(dir)
    })
  })
})
