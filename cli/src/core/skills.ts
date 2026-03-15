import path from "path"
import fg from "fast-glob"
import * as fs from "fs-extra"
import { SKILL_SOURCE_DIR } from "./config.ts"
import type { Skill } from "./types.ts"

// ============================================================================
// DISCOVER CATEGORIES
// Dynamic: reads actual subdirectories of SKILL_SOURCE_DIR.
// No hardcoded list — adding a folder = new category.
// ============================================================================

export async function discoverCategories(): Promise<string[]> {
  try {
    const entries = await fs.readdir(SKILL_SOURCE_DIR, { withFileTypes: true })
    return entries
      .filter((e) => e.isDirectory() && !e.name.startsWith("."))
      .map((e) => e.name)
      .sort()
  } catch (err: any) {
    if (err.code === "ENOENT") {
      throw new Error(
        `The expected skills directory was not found.\n` +
        `Looking at: ${SKILL_SOURCE_DIR}\n` +
        `Make sure you are running the CLI from within the valid project structure, and that the 'skills/' folder exists.`
      )
    }
    throw err
  }
}

// ============================================================================
// PARSE DESCRIPTION
// Extracts the first meaningful line from a SKILL.md as a short description.
// Skips the frontmatter block (--- ... ---) and the H1 title line.
// ============================================================================

async function parseSkillDescription(skillMdPath: string): Promise<string | undefined> {
  try {
    const content = await fs.readFile(skillMdPath, "utf8")
    const lines = content.split("\n")

    let i = 0

    // Skip frontmatter if present
    if (lines[0]?.trim() === "---") {
      i = 1
      while (i < lines.length && lines[i]?.trim() !== "---") i++
      i++ // skip closing ---
    }

    // Skip blank lines and H1
    while (i < lines.length) {
      const line = lines[i]?.trim() ?? ""
      if (line === "" || line.startsWith("#")) {
        i++
        continue
      }
      return line.length > 80 ? line.slice(0, 77) + "..." : line
    }
  } catch (err: any) {
    // Non-fatal — description is optional
    if (err.code !== "ENOENT") {
      // Non-fatal, just skip description
    }
  }
  return undefined
}

// ============================================================================
// DISCOVER SKILLS
// ============================================================================

export async function discoverSkills(categories?: string[]): Promise<Skill[]> {
  const cats = categories ?? (await discoverCategories())

  const patterns = cats.map((cat) =>
    // path.join + forward-slash for fast-glob (glob always uses /)
    `${SKILL_SOURCE_DIR.replace(/\\/g, "/")}/${cat}/*/SKILL.md`
  )

  const skillMdPaths = await fg(patterns, { onlyFiles: true, dot: false })
  skillMdPaths.sort()

  const skills: Skill[] = []
  for (const mdPath of skillMdPaths) {
    const skillDir = path.dirname(mdPath)
    const name = path.basename(skillDir)
    const categoryDir = path.dirname(skillDir)
    const category = path.basename(categoryDir)
    const ref = path.join(category, name)
    const description = await parseSkillDescription(mdPath)

    skills.push({ ref, name, category, path: skillDir, description })
  }

  return skills
}

// ============================================================================
// IS EXCLUDED
// ============================================================================

export function isExcluded(skillRef: string, excludedRefs: string[]): boolean {
  return excludedRefs.includes(skillRef)
}
