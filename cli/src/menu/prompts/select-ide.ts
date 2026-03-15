import * as clack from "@clack/prompts"
import pc from "picocolors"
import { ALL_IDE_KEYS } from "../../core/config.ts"
import type { IdeTarget } from "../../core/types.ts"
import { EXIT_CODES } from "../../core/exit-codes.ts"

/**
 * Prompts the user to select a single IDE (or all).
 * Returns the selected IdeTarget, "all", or undefined on cancel.
 * isCancel checked after every prompt.
 */
export async function selectIde(includeAll = true): Promise<IdeTarget | "all" | undefined> {
  const options: { value: IdeTarget | "all"; label: string }[] = includeAll
    ? [{ value: "all", label: pc.bold("all IDEs") }, ...ALL_IDE_KEYS.map((k) => ({ value: k as IdeTarget, label: k }))]
    : ALL_IDE_KEYS.map((k) => ({ value: k as IdeTarget, label: k }))

  const result = await clack.select({
    message: "Select target IDE:",
    options,
  })

  if (clack.isCancel(result)) {
    clack.cancel("Cancelled")
    process.exit(EXIT_CODES.CANCEL)
  }

  return result
}
