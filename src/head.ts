import type { MyOGConfig } from "./options.js"

export const MYOG_IMAGE_ENDPOINT = "https://api.myog.social/og"

export type HeadEntry = {
  tag: string
  attrs?: Record<string, string | boolean | undefined>
  content?: string
}

// Matches the route middleware on https://myog.social/docs/starlight: the whole page URL is
// encoded once as the `url` value.
export function buildImageURL({ account, template, pageURL }: MyOGConfig & { pageURL: string }) {
  return `${MYOG_IMAGE_ENDPOINT}?a=${encodeURIComponent(account)}&url=${encodeURIComponent(pageURL)}&template=${encodeURIComponent(template)}&src=docs`
}

function hasMeta(head: HeadEntry[], key: string) {
  return head.some(
    ({ tag, attrs }) => tag === "meta" && (attrs?.property === key || attrs?.name === key)
  )
}

// Existing og:image tags (page frontmatter, global config or other middleware) win, and an
// existing twitter:image is kept. Starlight emits the canonical link only when `site` is set.
export function addMyOGImage({
  head,
  routeID,
  site,
  config,
}: {
  head: HeadEntry[]
  routeID: string
  site: URL | undefined
  config: MyOGConfig
}) {
  if (!site || routeID === "404" || hasMeta(head, "og:image")) {
    return
  }
  const canonical = head.find(({ tag, attrs }) => tag === "link" && attrs?.rel === "canonical")
    ?.attrs?.href
  if (typeof canonical !== "string") {
    return
  }

  const imageURL = buildImageURL({ ...config, pageURL: new URL(canonical, site).href })
  head.push({ tag: "meta", attrs: { property: "og:image", content: imageURL } })
  if (!hasMeta(head, "twitter:image")) {
    head.push({ tag: "meta", attrs: { name: "twitter:image", content: imageURL } })
  }
}
