import type { Command } from "commander"
import pc from "picocolors"

import { discoverSkills, discoverCategories } from "../core/skills.ts"
import { EXIT_CODES } from "../core/exit-codes.ts"
import { log } from "../ui/logger.ts"

// ============================================================================
// COMMAND: skills list [--category <cat>]
// only UI orchestration here, domain logic in core/
// ============================================================================

export function registerListCommand(program: Command): void {
  program
    .command("list")
    .description("List all available skills")
    .option("-c, --category <category>", "Filter by category")
    .action(async (opts: { category?: string }) => {
      try {
        const requestedCategory = opts.category?.toLowerCase()

        const allCategories = await discoverCategories()
        const filtered = requestedCategory
          ? allCategories.filter((c) => c === requestedCategory)
          : allCategories

        if (filtered.length === 0) {
          log.error(`Category ${pc.yellow(requestedCategory ?? "")} not found.`)
          log.raw(`Available categories: ${allCategories.join(", ")}`)
          process.exit(EXIT_CODES.ERROR)
        }

        const skills = await discoverSkills(filtered)

        if (skills.length === 0) {
          log.info("No skills found.")
          return
        }

        // Group by category for display
        const byCategory = new Map<string, typeof skills>()
        for (const skill of skills) {
          const group = byCategory.get(skill.category) ?? []
          group.push(skill)
          byCategory.set(skill.category, group)
        }

        for (const [category, categorySkills] of byCategory) {
          log.step(`${category}/`)
          for (const skill of categorySkills) {
            log.bullet(skill.name, skill.description)
          }
        }
        log.raw(`\n${pc.dim(`Total: ${skills.length} skill${skills.length === 1 ? "" : "s"}`)}\n`)
      } catch (err) {
        log.error(err instanceof Error ? err.message : String(err))
        process.exit(EXIT_CODES.ERROR)
      }
    })
}
