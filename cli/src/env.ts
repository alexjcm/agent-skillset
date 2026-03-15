import { z } from "zod"
import { EXIT_CODES } from "./core/exit-codes.ts"
import { log } from "./ui/logger.ts"

// Validate process.env once at entry point, never inline.
const EnvSchema = z.object({
  HOME: z.string().min(1, "HOME environment variable is required"),
})

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  const messages = parsed.error.issues.map((i) => `  • ${i.message}`).join("\n")
  log.error(`Environment validation failed:\n${messages}`)
  process.exit(EXIT_CODES.ERROR)
}

export const env = parsed.data
