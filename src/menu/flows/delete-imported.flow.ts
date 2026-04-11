import * as clack from "@clack/prompts"
import * as pc from "../../ui/ansi.ts"
import { getAllEntries } from "../../core/imports/registry.ts"
import { IMPORTED_DIR } from "../../core/config/user-config.ts"
import { listKnownImportedRefs, removeImportedSkills } from "../../core/imports/removal.ts"
import type { RemovalResult } from "../../core/removal/types.ts"
import type { FlowResult } from "../flow-result.ts"
import { log } from "../../ui/logger.ts"
import { promptMultiselectWithBack } from "../helpers/prompt-multiselect-with-back.ts"
import { runWithSpinner } from "../helpers/run-with-spinner.ts"
import { FLOW_ALL, FLOW_BACK, FLOW_CANCELLED, FLOW_COMPLETED } from "../constants/flow-tokens.ts"

function sourceHintFromRegistry(ref: string, registryByRef: Map<string, string>): string | undefined {
  return registryByRef.get(ref)
}

function renderImportedRemovalResults(results: RemovalResult[]): FlowResult {
  const deleted = results.filter((result) => result.status === "deleted")
  const skipped = results.filter((result) => result.status === "skipped")
  const errored = results.filter((result) => result.status === "error")

  log.success(`Deleted: ${deleted.length}`)
  if (skipped.length > 0) {
    log.warn(`Skipped: ${skipped.length}`)
    for (const result of skipped) {
      log.raw(`  • ${result.itemId} ${pc.dim(`(${result.reason ?? "skipped"})`)}`)
    }
  }

  if (errored.length > 0) {
    log.warn(`Errors: ${errored.length}`)
    for (const result of errored) {
      log.error(`${result.itemId} → ${result.targetPath}: ${result.error ?? "unknown error"}`)
    }
  }

  return errored.length > 0 ? FLOW_CANCELLED : FLOW_COMPLETED
}

async function selectImportedRefs(knownRefs: string[], registryByRef: Map<string, string>): Promise<string[] | typeof FLOW_BACK | undefined> {
  while (true) {
    const scope = await clack.select({
      message: "Delete imported skills:",
      options: [
        { value: "select", label: "Select imported skills" },
        { value: FLOW_ALL, label: "Delete all imported skills", hint: "destructive" },
        { value: FLOW_BACK, label: pc.dim("← Back") },
      ],
    })

    if (clack.isCancel(scope)) return undefined
    if (scope === FLOW_BACK) return FLOW_BACK
    if (scope === FLOW_ALL) return knownRefs

    const options = knownRefs.map((ref) => {
      const hint = sourceHintFromRegistry(ref, registryByRef)
      if (hint) {
        return {
          value: ref,
          label: ref,
          hint,
        }
      }
      return {
        value: ref,
        label: ref,
      }
    })

    const picked = await promptMultiselectWithBack({
      message: "Select imported skills to delete:",
      options,
      includeBack: true,
      backValue: FLOW_BACK,
      mixedBackWarning: "Select skills or Back, not both.",
    })

    if (picked === FLOW_BACK) continue
    return picked
  }
}

export async function deleteImportedFlow(): Promise<FlowResult> {
  const knownRefs = await listKnownImportedRefs()
  if (knownRefs.length === 0) {
    log.info("No imported skills found.")
    return FLOW_COMPLETED
  }

  const registryByRef = new Map(getAllEntries().map(([ref, entry]) => [ref, entry.source]))

  const selectedRefs = await selectImportedRefs(knownRefs, registryByRef)
  if (!selectedRefs) return FLOW_CANCELLED
  if (selectedRefs === FLOW_BACK) return FLOW_BACK

  log.step("Summary:")
  log.bullet("Action", selectedRefs.length === knownRefs.length ? "Delete all imported skills" : "Delete selected imported skills")
  log.bullet("Imported root", IMPORTED_DIR)
  log.bullet("Items", String(selectedRefs.length))

  log.step("Imported refs to delete:")
  for (const ref of selectedRefs) {
    log.bullet(ref, sourceHintFromRegistry(ref, registryByRef))
  }

  const confirmed = await clack.confirm({
    message:
      `${pc.bold(pc.red(`Delete ${String(selectedRefs.length)} imported skill${selectedRefs.length === 1 ? "" : "s"}?`))}\n` +
      `${pc.red("This will remove local imported files and registry entries.")}`,
    initialValue: false,
  })
  if (clack.isCancel(confirmed) || !confirmed) {
    return FLOW_CANCELLED
  }

  const results = await runWithSpinner(
    {
      startMessage: selectedRefs.length === 1
        ? "Deleting imported skill..."
        : `Deleting ${selectedRefs.length} imported skills...`,
      successMessage: (items: RemovalResult[]) => {
        const errors = items.filter((item) => item.status === "error").length
        return errors > 0 ? "Completed with warnings" : "Completed"
      },
    },
    () => removeImportedSkills(selectedRefs)
  )

  return renderImportedRemovalResults(results)
}
