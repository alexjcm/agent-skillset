import type { Skill } from "../types.ts"

export interface KnownInstalledSkillGroup {
  deployName: string
  refs: string[]
  skills: Skill[]
  hasCollision: boolean
}

/**
 * For global uninstall UX we group by deployed folder name (skill.name),
 * not by ref, because global install paths only keep the final folder name.
 */
export function groupSkillsForGlobalRemoval(skills: readonly Skill[]): KnownInstalledSkillGroup[] {
  const byDeployName = new Map<string, Skill[]>()

  for (const skill of skills) {
    const existing = byDeployName.get(skill.name)
    if (existing) {
      existing.push(skill)
    } else {
      byDeployName.set(skill.name, [skill])
    }
  }

  return [...byDeployName.entries()]
    .map(([deployName, groupedSkills]) => {
      const refs = [...new Set(groupedSkills.map((skill) => skill.ref))]
        .sort((a, b) => a.localeCompare(b))
      const sortedSkills = [...groupedSkills].sort((a, b) => a.ref.localeCompare(b.ref))

      return {
        deployName,
        refs,
        skills: sortedSkills,
        hasCollision: refs.length > 1,
      }
    })
    .sort((a, b) => a.deployName.localeCompare(b.deployName))
}
