export type ValidationResult = { valid: true } | { valid: false; reason: string }

function parseFrontmatterValue(frontmatterLines: string[], key: string): string | null {
  const regex = new RegExp(`^${key}\\s*:\\s*(.+)$`, "i")
  for (const raw of frontmatterLines) {
    const line = raw.trim()
    const match = regex.exec(line)
    if (!match) continue
    return match[1]?.trim().replace(/^['"]|['"]$/g, "") ?? null
  }
  return null
}

export function validateSkillContent(content: string): ValidationResult {
  const lines = content.split("\n")

  if (lines[0]?.trim() !== "---") {
    return { valid: false, reason: "No YAML frontmatter found" }
  }

  const frontmatter: string[] = []
  let i = 1
  while (i < lines.length && lines[i]?.trim() !== "---") {
    frontmatter.push(lines[i] ?? "")
    i++
  }

  if (i >= lines.length || lines[i]?.trim() !== "---") {
    return { valid: false, reason: "No YAML frontmatter found" }
  }

  const name = parseFrontmatterValue(frontmatter, "name")
  if (!name) {
    return { valid: false, reason: "Missing 'name'" }
  }
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(name) || name.startsWith("-") || name.endsWith("-") || name.includes("--")) {
    return { valid: false, reason: "Invalid name format" }
  }

  const description = parseFrontmatterValue(frontmatter, "description")
  if (!description) {
    return { valid: false, reason: "Missing 'description'" }
  }
  if (description.length > 1024 || /[<>]/.test(description)) {
    return { valid: false, reason: "Invalid description" }
  }

  return { valid: true }
}
