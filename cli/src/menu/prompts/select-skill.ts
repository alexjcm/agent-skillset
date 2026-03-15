import * as clack from "@clack/prompts"
import pc from "picocolors"
import { discoverSkills } from "../../core/skills.ts"
import type { Skill } from "../../core/types.ts"
import { EXIT_CODES } from "../../core/exit-codes.ts"

/**
 * Prompts the user to select a single skill.
 * If category is omitted, lists all skills across all categories.
 * Shows name + description for richer context.
 * isCancel checked after every prompt.
 */
export async function selectSkill(category?: string): Promise<Skill | undefined> {
  const skills = await discoverSkills(category ? [category] : undefined)

  if (skills.length === 0) {
    clack.log.warning(`No skills found${category ? ` in category "${category}"` : ""}`)
    return undefined
  }

  const result = await clack.select({
    message: category ? `Select skill (${category}):` : "Select skill:",
    options: skills.map((s) => ({
      value: s,
      label: category ? s.name : `${pc.dim(s.category + "/")}${s.name}`,
      ...(s.description ? { hint: pc.dim(s.description) } : {}),
    })),
  })

  if (clack.isCancel(result)) {
    clack.cancel("Cancelled")
    process.exit(EXIT_CODES.CANCEL)
  }

  return result
}

/**
 * Prompts the user to select multiple skills across all categories.
 * Used in the "Deploy to project" flow.
 * isCancel checked after every prompt.
 */
export async function multiSelectSkills(category?: string): Promise<Skill[]> {
  const skills = await discoverSkills(category ? [category] : undefined)

  if (skills.length === 0) {
    clack.log.warning("No skills found")
    return []
  }

  const result = await clack.multiselect({
    message: "Select skills to deploy (space to toggle, enter to confirm):",
    options: skills.map((s) => ({
      value: s,
      label: `${pc.dim(s.category + "/")}${s.name}`,
      ...(s.description ? { hint: pc.dim(s.description) } : {}),
    })),
    required: true,
  })

  if (clack.isCancel(result)) {
    clack.cancel("Cancelled")
    process.exit(EXIT_CODES.CANCEL)
  }

  return result
}
