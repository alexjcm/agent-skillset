import * as clack from "@clack/prompts"
import { discoverCategories } from "../../core/skills.ts"
import { EXIT_CODES } from "../../core/exit-codes.ts"

/**
 * Prompts the user to select a skill category.
 * Returns the category name or undefined on cancel.
 * isCancel checked after every prompt.
 */
export async function selectCategory(): Promise<string | undefined> {
  const categories = await discoverCategories()

  const result = await clack.select({
    message: "Select category:",
    options: categories.map((c) => ({ value: c, label: c })),
  })

  if (clack.isCancel(result)) {
    clack.cancel("Cancelled")
    process.exit(EXIT_CODES.CANCEL)
  }

  return result
}
