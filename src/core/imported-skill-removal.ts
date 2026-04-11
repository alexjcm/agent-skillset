import { assertSafePathSegment, resolvePathInside } from "./path-safety.ts"
import { deleteEntries, getAllEntries } from "./skill-imports.ts"
import { discoverSkills } from "./skills.ts"
import { exists } from "./fs-utils.ts"
import { safeRmImported } from "./safe-rm.ts"
import { IMPORTED_DIR } from "./user-config.ts"
import type { RemovalResult } from "./removal-types.ts"

function normalizeRef(ref: string): string {
  return ref.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "").trim()
}

function importedPathFromRef(ref: string): string {
  const parts = normalizeRef(ref).split("/").filter(Boolean)
  if (parts.length === 0) {
    throw new Error(`Invalid imported skill ref: "${ref}"`)
  }

  const safeRelativePath = parts
    .map((segment) => assertSafePathSegment(segment, "Imported skill ref segment"))
    .join("/")

  return resolvePathInside(IMPORTED_DIR, safeRelativePath, `Imported skill ref "${ref}"`)
}

function toUniqueRefs(refs: readonly string[]): string[] {
  return [...new Set(refs.map(normalizeRef).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
}

export async function listKnownImportedRefs(): Promise<string[]> {
  const fromRegistry = getAllEntries().map(([ref]) => ref)
  const fromDisk = (await discoverSkills())
    .filter((skill) => skill.source === "imported")
    .map((skill) => skill.ref)

  return toUniqueRefs([...fromRegistry, ...fromDisk])
}

export async function removeImportedSkills(refs: readonly string[]): Promise<RemovalResult[]> {
  const uniqueRefs = toUniqueRefs(refs)
  const results: RemovalResult[] = []
  const registryRefSet = new Set(getAllEntries().map(([ref]) => normalizeRef(ref)))
  const refsPendingRegistryDelete: string[] = []
  const stagedRegistryResults: Array<{ ref: string; targetPath: string; hadDirectory: boolean }> = []

  for (const ref of uniqueRefs) {
    let targetPath: string
    try {
      targetPath = importedPathFromRef(ref)
    } catch (err) {
      results.push({
        scope: "imported",
        itemId: ref,
        targetPath: IMPORTED_DIR,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      })
      continue
    }

    try {
      const hadDirectory = await exists(targetPath)
      if (hadDirectory) {
        await safeRmImported(targetPath)
      }

      const hadRegistryEntry = registryRefSet.has(ref)
      if (hadRegistryEntry) {
        refsPendingRegistryDelete.push(ref)
        stagedRegistryResults.push({ ref, targetPath, hadDirectory })
        continue
      }

      if (hadDirectory) {
        results.push({
          scope: "imported",
          itemId: ref,
          targetPath,
          status: "deleted",
        })
      } else {
        results.push({
          scope: "imported",
          itemId: ref,
          targetPath,
          status: "skipped",
          reason: "Not found in imported storage or registry",
        })
      }
    } catch (err) {
      results.push({
        scope: "imported",
        itemId: ref,
        targetPath,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  if (refsPendingRegistryDelete.length > 0) {
    try {
      const registryDeleteResult = deleteEntries(refsPendingRegistryDelete)
      const removedRefSet = new Set(registryDeleteResult.removed.map((ref) => normalizeRef(ref)))

      for (const staged of stagedRegistryResults) {
        if (staged.hadDirectory || removedRefSet.has(staged.ref)) {
          results.push({
            scope: "imported",
            itemId: staged.ref,
            targetPath: staged.targetPath,
            status: "deleted",
          })
        } else {
          results.push({
            scope: "imported",
            itemId: staged.ref,
            targetPath: staged.targetPath,
            status: "skipped",
            reason: "Not found in imported storage or registry",
          })
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      for (const staged of stagedRegistryResults) {
        results.push({
          scope: "imported",
          itemId: staged.ref,
          targetPath: staged.targetPath,
          status: "error",
          error: `Failed to update import registry: ${message}`,
        })
      }
    }
  }

  return results
}
