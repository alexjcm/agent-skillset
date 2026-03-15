import pc from "picocolors"

export const isTTY = process.stdout.isTTY

// Symbols that adapt nicely across distinct terminal features
export const symbols = {
  info: pc.blue("ℹ"),
  success: pc.green("✔"),
  warning: pc.yellow("⚠"),
  error: pc.red("✖"),
  bullet: pc.green("•"),
}

/**
 * Centralized logger.
 * Separates presentation logic from business logic.
 */
export const log = {
  info: (msg: string) => {
    console.log(`${symbols.info}  ${msg}`)
  },

  success: (msg: string) => {
    console.log(`${symbols.success} ${pc.green(msg)}`)
  },

  warn: (msg: string) => {
    console.warn(`${symbols.warning} ${pc.yellow(msg)}`)
  },

  error: (msg: string, err?: unknown) => {
    console.error(`${symbols.error} ${pc.red(msg)}`)
    if (err instanceof Error) {
      console.error(pc.dim(err.message))
    } else if (err !== undefined) {
      console.error(pc.dim(String(err)))
    }
  },

  step: (msg: string) => {
    console.log(`\n${pc.bold(msg)}`)
  },

  bullet: (msg: string, detail?: string) => {
    const text = detail ? `${msg} ${pc.dim(detail)}` : msg
    console.log(`  ${symbols.bullet} ${text}`)
  },

  // Raw prints for custom formatted tables, without prefixes, but applying TTY checks later
  raw: (msg: string) => {
    console.log(msg)
  },
}
