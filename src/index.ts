import {
  type MyOGConfig,
  normalizeOptions,
  PLUGIN_NAME,
  type StarlightMyOGOptions,
} from "./options.js"

export type { StarlightMyOGOptions, Template } from "./options.js"

const VIRTUAL_CONFIG_ID = "virtual:starlight-myog/config"
const RESOLVED_VIRTUAL_CONFIG_ID = `\0${VIRTUAL_CONFIG_ID}`

// Structural subset of Starlight's plugin types, so the package has no runtime or type dependency
// on a particular Starlight release.
type ConfigSetupContext = {
  astroConfig: { site?: string }
  addIntegration: (integration: AstroIntegration) => void
  addRouteMiddleware: (middleware: {
    entrypoint: string
    order?: "pre" | "default" | "post"
  }) => void
  logger: { warn: (message: string) => void }
}

type AstroIntegration = {
  name: string
  hooks: {
    "astro:config:setup": (context: {
      updateConfig: (config: { vite: Record<string, unknown> }) => unknown
    }) => void
  }
}

export type StarlightMyOGPlugin = {
  name: string
  hooks: { "config:setup": (context: ConfigSetupContext) => void }
}

function configIntegration(config: MyOGConfig): AstroIntegration {
  return {
    name: PLUGIN_NAME,
    hooks: {
      "astro:config:setup": ({ updateConfig }) => {
        updateConfig({
          vite: {
            plugins: [
              {
                name: `${PLUGIN_NAME}:config`,
                resolveId(id: string) {
                  return id === VIRTUAL_CONFIG_ID ? RESOLVED_VIRTUAL_CONFIG_ID : undefined
                },
                load(id: string) {
                  return id === RESOLVED_VIRTUAL_CONFIG_ID
                    ? `export default ${JSON.stringify(config)}`
                    : undefined
                },
              },
            ],
            // The route middleware imports the virtual module, so Vite must bundle it.
            ssr: { noExternal: [PLUGIN_NAME] },
          },
        })
      },
    },
  }
}

export default function starlightMyOG(options: StarlightMyOGOptions): StarlightMyOGPlugin {
  const config = normalizeOptions(options)
  return {
    name: PLUGIN_NAME,
    hooks: {
      "config:setup": ({ astroConfig, addIntegration, addRouteMiddleware, logger }) => {
        if (!astroConfig.site) {
          logger.warn(
            "Astro `site` is not set, so Starlight emits no canonical URL and no MyOG images are added. Set `site` to your public HTTPS origin."
          )
        }
        addIntegration(configIntegration(config))
        addRouteMiddleware({ entrypoint: `${PLUGIN_NAME}/route-middleware`, order: "pre" })
      },
    },
  }
}
