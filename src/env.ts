import { EXIT_CODES } from "./core/exit-codes.ts"
import { log } from "./ui/logger.ts"
import os from "os"

function resolveHomeDir(): string {
  const home = process.env["HOME"]
  if (home && home.trim()) return home

  const userProfile = process.env["USERPROFILE"]
  if (userProfile && userProfile.trim()) return userProfile

  const homeDrive = process.env["HOMEDRIVE"]
  const homePath = process.env["HOMEPATH"]
  if (homeDrive && homePath) return `${homeDrive}${homePath}`

  const fromOs = os.homedir()
  return fromOs ?? ""
}

const resolvedHome = resolveHomeDir()

if (!resolvedHome) {
  log.error("Environment validation failed:\n  • Could not resolve a home directory from environment")
  process.exit(EXIT_CODES.ERROR)
}

export const env = {
  HOME: resolvedHome
}
