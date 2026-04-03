import path from "path"
import fs from "fs-extra"
import { SKILLS_HOME } from "./user-config.ts"

export interface ImportEntry {
  source: string
  importedAt: string
  updatedAt: string
  remoteBasePath?: string
}

export interface ImportRegistry {
  importedSkills: Record<string, ImportEntry>
}

const REGISTRY_PATH = path.join(SKILLS_HOME, "skill-imports.json")

function normalizeRef(ref: string): string {
  return ref.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "")
}

function normalizeOptionalPath(value: string | undefined): string | undefined {
  if (!value) return undefined
  const normalized = value.trim().replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "")
  return normalized || undefined
}

function emptyRegistry(): ImportRegistry {
  return { importedSkills: {} }
}

function sanitizeRegistry(data: unknown): ImportRegistry {
  if (!data || typeof data !== "object") return emptyRegistry()

  const importedSkillsRaw = (data as { importedSkills?: unknown }).importedSkills
  if (!importedSkillsRaw || typeof importedSkillsRaw !== "object") {
    return emptyRegistry()
  }

  const importedSkills: Record<string, ImportEntry> = {}
  for (const [rawRef, rawEntry] of Object.entries(importedSkillsRaw as Record<string, unknown>)) {
    if (!rawEntry || typeof rawEntry !== "object") continue

    const source = (rawEntry as { source?: unknown }).source
    const importedAt = (rawEntry as { importedAt?: unknown }).importedAt
    const updatedAt = (rawEntry as { updatedAt?: unknown }).updatedAt
    const remoteBasePath = (rawEntry as { remoteBasePath?: unknown }).remoteBasePath

    if (typeof source !== "string" || typeof importedAt !== "string" || typeof updatedAt !== "string") {
      continue
    }

    const normalizedRemoteBasePath =
      typeof remoteBasePath === "string" ? normalizeOptionalPath(remoteBasePath) : undefined

    importedSkills[normalizeRef(rawRef)] = {
      source,
      importedAt,
      updatedAt,
      ...(normalizedRemoteBasePath
        ? { remoteBasePath: normalizedRemoteBasePath }
        : {}),
    }
  }

  return { importedSkills }
}

function writeRegistry(registry: ImportRegistry): void {
  fs.ensureDirSync(SKILLS_HOME)
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + "\n", "utf8")
}

export function readRegistry(): ImportRegistry {
  try {
    const raw = fs.readFileSync(REGISTRY_PATH, "utf8")
    const parsed = JSON.parse(raw) as unknown
    return sanitizeRegistry(parsed)
  } catch {
    return emptyRegistry()
  }
}

export function getEntry(ref: string): ImportEntry | null {
  const registry = readRegistry()
  return registry.importedSkills[normalizeRef(ref)] ?? null
}

export function saveEntry(ref: string, sourceUrl: string, options?: { remoteBasePath?: string }): void {
  const key = normalizeRef(ref)
  if (!key) {
    throw new Error("Invalid import ref")
  }

  const registry = readRegistry()
  const now = new Date().toISOString()
  const existing = registry.importedSkills[key]
  const remoteBasePath = normalizeOptionalPath(options?.remoteBasePath ?? existing?.remoteBasePath)

  registry.importedSkills[key] = {
    source: sourceUrl,
    importedAt: existing?.importedAt ?? now,
    updatedAt: now,
    ...(remoteBasePath
      ? {
          remoteBasePath,
        }
      : {}),
  }

  writeRegistry(registry)
}

export function getAllEntries(): [string, ImportEntry][] {
  const registry = readRegistry()
  return Object.entries(registry.importedSkills)
}
