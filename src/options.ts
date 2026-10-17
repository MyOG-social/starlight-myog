export const PLUGIN_NAME = "starlight-myog"

export const TEMPLATES = [
  "brand",
  "screenshot",
  "screenshot-right",
  "screenshot-bottom",
  "screenshot-bottom-framed",
] as const

export type Template = (typeof TEMPLATES)[number]

export const DEFAULT_TEMPLATE: Template = "screenshot-right"

export type StarlightMyOGOptions = {
  /** Your MyOG account ID, the `a=` value in the install code on https://myog.social/docs/starlight. */
  account: string
  /** Image layout. Defaults to `screenshot-right`. */
  template?: Template
}

export type MyOGConfig = {
  account: string
  template: Template
}

function fail(message: string): never {
  throw new Error(`[${PLUGIN_NAME}] ${message}`)
}

export function normalizeOptions(raw: unknown): MyOGConfig {
  const options = (raw ?? {}) as Record<string, unknown>
  const { account, template, ...unknown } = options
  const unknownKeys = Object.keys(unknown)
  if (unknownKeys.length > 0) {
    fail(`unknown option(s): ${unknownKeys.join(", ")}. Supported: account, template.`)
  }
  const trimmedAccount = typeof account === "string" ? account.trim() : ""
  if (!/^[A-Za-z0-9]{1,32}$/.test(trimmedAccount)) {
    fail(
      "`account` must be your MyOG account ID (letters and digits), copied from the install code at https://myog.social/docs/starlight."
    )
  }
  const chosenTemplate = template ?? DEFAULT_TEMPLATE
  if (!(TEMPLATES as readonly unknown[]).includes(chosenTemplate)) {
    fail(`\`template\` must be one of: ${TEMPLATES.join(", ")}.`)
  }
  return { account: trimmedAccount, template: chosenTemplate as Template }
}
