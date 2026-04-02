// ============================================================================
// GITHUB URL PARSER
// Pure utility: parse and normalize GitHub URL inputs.
// ============================================================================

export interface GitHubRef {
  owner: string
  repo: string
  branch: string | null
  path: string | null
  canonical: string
  isRepoLevel: boolean
}

const GITHUB_HOSTS = new Set(["github.com", "www.github.com"])
const OWNER_REPO_SEGMENT = /^[A-Za-z0-9_.-]+$/

function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "")
}

function looksLikeOwnerRepo(input: string): boolean {
  const clean = stripTrailingSlashes(input)
  const parts = clean.split("/")
  if (parts.length < 2) return false
  if (parts[0] !== "github.com" && parts[0] !== "www.github.com") {
    const [owner, repo] = parts
    if (!owner || !repo) return false
    return OWNER_REPO_SEGMENT.test(owner) && OWNER_REPO_SEGMENT.test(repo)
  }
  return false
}

function normalizeInput(input: string): string {
  const trimmed = stripTrailingSlashes(input.trim())
  if (!trimmed) {
    throw new Error("Invalid GitHub URL. Paste a github.com link or use 'owner/repo' shorthand.")
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  if (trimmed.startsWith("github.com/") || trimmed.startsWith("www.github.com/")) {
    return `https://${trimmed}`
  }

  if (looksLikeOwnerRepo(trimmed)) {
    return `https://github.com/${trimmed}`
  }

  throw new Error("Invalid GitHub URL. Paste a github.com link or use 'owner/repo' shorthand.")
}

function canonicalFromParts(owner: string, repo: string, branch: string | null, remotePath: string | null): string {
  if (!branch) {
    return `https://github.com/${owner}/${repo}`
  }
  if (!remotePath) {
    return `https://github.com/${owner}/${repo}/tree/${branch}`
  }
  return `https://github.com/${owner}/${repo}/tree/${branch}/${remotePath}`
}

/**
 * Supports inputs like:
 * - https://github.com/openai/skills/tree/main/skills/.curated/security-threat-model
 * - https://github.com/openai/skills/blob/main/skills/.curated/security-threat-model/SKILL.md
 * - github.com/openai/skills
 * - openai/skills
 * - openai/skills/tree/main/skills/.curated/security-threat-model
 */
export function parseGitHubUrl(input: string): GitHubRef {
  let parsed: URL
  try {
    parsed = new URL(normalizeInput(input))
  } catch {
    throw new Error("Invalid GitHub URL. Paste a github.com link or use 'owner/repo' shorthand.")
  }

  if (!GITHUB_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new Error("Invalid GitHub URL. Paste a github.com link or use 'owner/repo' shorthand.")
  }

  const segments = parsed.pathname.split("/").filter(Boolean)
  if (segments.length < 2) {
    throw new Error("Invalid GitHub URL. Paste a github.com link or use 'owner/repo' shorthand.")
  }

  const owner = segments[0]
  const repo = segments[1]
  if (!owner || !repo || !OWNER_REPO_SEGMENT.test(owner) || !OWNER_REPO_SEGMENT.test(repo)) {
    throw new Error("Invalid GitHub URL. Paste a github.com link or use 'owner/repo' shorthand.")
  }

  const tail = segments.slice(2)
  if (tail.length === 0) {
    const canonical = `https://github.com/${owner}/${repo}`
    return {
      owner,
      repo,
      branch: null,
      path: null,
      canonical,
      isRepoLevel: true,
    }
  }

  const mode = tail[0]
  if (mode !== "tree" && mode !== "blob") {
    throw new Error("Invalid GitHub URL. Paste a github.com link or use 'owner/repo' shorthand.")
  }

  const branch = tail[1]
  if (!branch) {
    throw new Error("Invalid GitHub URL. Paste a github.com link or use 'owner/repo' shorthand.")
  }

  let remotePath = tail.slice(2).join("/")
  if (mode === "blob") {
    if (remotePath.endsWith("/SKILL.md")) {
      remotePath = remotePath.slice(0, -"/SKILL.md".length)
    }
  }

  remotePath = stripTrailingSlashes(remotePath)

  const normalizedPath = remotePath || null
  const canonical = canonicalFromParts(owner, repo, branch, normalizedPath)

  return {
    owner,
    repo,
    branch,
    path: normalizedPath,
    canonical,
    isRepoLevel: false,
  }
}
