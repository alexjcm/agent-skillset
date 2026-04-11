import path from "path"
import { IDE_BASE_DIRS, IDE_GLOBAL_PATHS } from "../config/ide-paths.ts"
import { safeRm } from "../system/safe-rm.ts"
import { discoverSkills } from "../skills/discovery.ts"
import { exists } from "../system/fs.ts"
import { groupSkillsForGlobalRemoval, type KnownInstalledSkillGroup } from "./global-planning.ts"
import type { RemovalResult } from "./types.ts"
import type { IdeTarget } from "../types.ts"

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
}

function uniqueSortedIdes(values: readonly IdeTarget[]): IdeTarget[] {
  return [...new Set(values)]
    .sort((a, b) => a.localeCompare(b))
}

export async function listKnownGlobalRemovalCandidates(): Promise<KnownInstalledSkillGroup[]> {
  const skills = await discoverSkills()
  return groupSkillsForGlobalRemoval(skills)
}

export async function removeKnownGlobalSkillsByDeployNames(
  ides: readonly IdeTarget[],
  deployNames: readonly string[]
): Promise<RemovalResult[]> {
  const candidateGroups = await listKnownGlobalRemovalCandidates()
  const byName = new Map(candidateGroups.map((group) => [group.deployName, group]))
  const selectedIdes = uniqueSortedIdes(ides)
  const selectedNames = uniqueSorted(deployNames)
  const results: RemovalResult[] = []

  if (selectedIdes.length === 0 || selectedNames.length === 0) {
    return results
  }

  const allowedPrefixes = Object.values(IDE_GLOBAL_PATHS).flat()

  for (const deployName of selectedNames) {
    const group = byName.get(deployName)
    if (!group) {
      results.push({
        scope: "global",
        itemId: deployName,
        targetPath: "",
        status: "skipped",
        reason: "Unknown skill name (not in known catalog)",
      })
      continue
    }

    for (const ide of selectedIdes) {
      const baseDir = IDE_BASE_DIRS[ide]
      const targetDirs = IDE_GLOBAL_PATHS[ide]

      const ideInstalled = await exists(baseDir)
      if (!ideInstalled) {
        for (const targetDir of targetDirs) {
          results.push({
            scope: "global",
            itemId: deployName,
            ide,
            refs: group.refs,
            targetPath: path.join(targetDir, deployName),
            status: "skipped",
            reason: "IDE not installed",
          })
        }
        continue
      }

      for (const targetDir of targetDirs) {
        const skillPath = path.join(targetDir, deployName)
        try {
          const installedAtTarget = await exists(skillPath)
          if (!installedAtTarget) {
            results.push({
              scope: "global",
              itemId: deployName,
              ide,
              refs: group.refs,
              targetPath: skillPath,
              status: "skipped",
              reason: "Not installed at target path",
            })
            continue
          }

          await safeRm(skillPath, allowedPrefixes)
          results.push({
            scope: "global",
            itemId: deployName,
            ide,
            refs: group.refs,
            targetPath: skillPath,
            status: "deleted",
          })
        } catch (err) {
          results.push({
            scope: "global",
            itemId: deployName,
            ide,
            refs: group.refs,
            targetPath: skillPath,
            status: "error",
            error: err instanceof Error ? err.message : String(err),
          })
        }
      }
    }
  }

  return results
}
