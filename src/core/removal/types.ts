import type { IdeTarget } from "../types.ts"

export type RemovalScope = "imported" | "global"
export type RemovalStatus = "deleted" | "skipped" | "error"

export interface RemovalResult {
  scope: RemovalScope
  itemId: string
  targetPath: string
  status: RemovalStatus
  ide?: IdeTarget
  refs?: string[]
  reason?: string
  error?: string
}
