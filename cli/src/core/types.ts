import { z } from "zod"
import { ALL_IDE_KEYS } from "./config.ts"

// ============================================================================
// IDE TARGET — only real IDE names, never "all" (CLI plan design decision)
// ============================================================================

export const IdeTargetSchema = z.enum(ALL_IDE_KEYS)
export type IdeTarget = z.infer<typeof IdeTargetSchema>

// ============================================================================
// SKILL
// ============================================================================

export const SkillSchema = z.object({
  /** Relative path from SKILL_SOURCE_DIR, e.g. "development/writing-junit-tests" */
  ref: z.string(),
  /** Folder name, e.g. "writing-junit-tests" */
  name: z.string(),
  /** Category folder name, e.g. "development" */
  category: z.string(),
  /** Absolute path to the skill folder */
  path: z.string(),
  /** First non-empty line of SKILL.md after the frontmatter/title, used as description in menus */
  description: z.string().optional(),
})
export type Skill = z.infer<typeof SkillSchema>

// ============================================================================
// DEPLOY OPTIONS
// ============================================================================

export const DeployOptionsSchema = z.object({
  /** Skill refs to skip (loaded from skills.config.json) */
  excludedRefs: z.array(z.string()).default([]),
})
export type DeployOptions = z.infer<typeof DeployOptionsSchema>

// ============================================================================
// DEPLOY RESULT (returned by core functions, UI decides how to display)
// ============================================================================

export type DeployStatus = "copied" | "skipped" | "error"

export interface DeployResult {
  skill: Skill
  ide: IdeTarget
  targetPath: string
  status: DeployStatus
  /** Present when status === "error" */
  error?: string
  /** Present when status === "skipped" to explain why */
  reason?: string
}

// ============================================================================
// SKILLS CONFIG (skills.config.json shape)
// ============================================================================

export const SkillsConfigSchema = z.object({
  excludedSkills: z.array(z.string()).default([]),
})
export type SkillsConfig = z.infer<typeof SkillsConfigSchema>
