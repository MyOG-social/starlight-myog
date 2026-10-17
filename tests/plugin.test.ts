import assert from "node:assert/strict"
import { test } from "bun:test"

import { addMyOGImage, buildImageURL, type HeadEntry } from "../src/head"
import starlightMyOG from "../src/index"
import { DEFAULT_TEMPLATE, normalizeOptions } from "../src/options"

const config = { account: "Ab12", template: DEFAULT_TEMPLATE }
const site = new URL("https://docs.example.com")

function canonicalHead(href: string): HeadEntry[] {
  return [
    { tag: "link", attrs: { rel: "canonical", href } },
    { tag: "meta", attrs: { name: "twitter:card", content: "summary_large_image" } },
  ]
}

function metaContent(head: HeadEntry[], key: string) {
  return head
    .filter(({ tag, attrs }) => tag === "meta" && (attrs?.property === key || attrs?.name === key))
    .map(({ attrs }) => attrs?.content)
}

test("options require a plain account ID and a known template", () => {
  assert.deepEqual(normalizeOptions({ account: " Ab12 " }), config)
  assert.deepEqual(normalizeOptions({ account: "Ab12", template: "brand" }), {
    account: "Ab12",
    template: "brand",
  })
  for (const account of [undefined, "", "YOUR_ACCOUNT_HINT", "a b", "x".repeat(33)]) {
    assert.throws(() => normalizeOptions({ account }), /`account` must be/)
  }
  assert.throws(() => normalizeOptions({ account: "Ab12", template: "fancy" }), /`template`/)
  assert.throws(() => normalizeOptions({ account: "Ab12", url: "x" }), /unknown option\(s\): url/)
  assert.throws(() => starlightMyOG({ account: "" }), /\[starlight-myog\]/)
})

test("image URL encodes the whole page URL once and ends with src=docs", () => {
  const pageURL = "https://docs.example.com/custom%2Fpath?q=a%26b&other=x%2By#part"
  const imageURL = new URL(buildImageURL({ ...config, pageURL }))
  assert.equal(imageURL.origin + imageURL.pathname, "https://api.myog.social/og")
  assert.deepEqual([...imageURL.searchParams.keys()], ["a", "url", "template", "src"])
  assert.equal(imageURL.searchParams.get("url"), pageURL)
  assert.equal(imageURL.searchParams.get("src"), "docs")
})

test("adds one og:image and twitter:image from the canonical URL", () => {
  const head = canonicalHead("https://docs.example.com/manual/guides/café")
  addMyOGImage({ head, routeID: "guides/café", site, config })
  const [ogImage] = metaContent(head, "og:image")
  assert.equal(
    new URL(String(ogImage)).searchParams.get("url"),
    "https://docs.example.com/manual/guides/caf%C3%A9"
  )
  assert.deepEqual(metaContent(head, "twitter:image"), [ogImage])
  assert.deepEqual(metaContent(head, "twitter:card"), ["summary_large_image"])
})

test("existing images win and boundaries add nothing", () => {
  const withImage = [
    ...canonicalHead("https://docs.example.com/a/"),
    { tag: "meta", attrs: { property: "og:image", content: "https://assets.example.com/a.png" } },
  ]
  addMyOGImage({ head: withImage, routeID: "a", site, config })
  assert.deepEqual(metaContent(withImage, "og:image"), ["https://assets.example.com/a.png"])
  assert.deepEqual(metaContent(withImage, "twitter:image"), [])

  const twitterOnly = [
    ...canonicalHead("https://docs.example.com/b/"),
    { tag: "meta", attrs: { name: "twitter:image", content: "https://assets.example.com/b.png" } },
  ]
  addMyOGImage({ head: twitterOnly, routeID: "b", site, config })
  assert.equal(metaContent(twitterOnly, "og:image").length, 1)
  assert.deepEqual(metaContent(twitterOnly, "twitter:image"), ["https://assets.example.com/b.png"])

  for (const [routeID, routeSite, head] of [
    ["404", site, canonicalHead("https://docs.example.com/404/")],
    ["c", undefined, canonicalHead("https://docs.example.com/c/")],
    ["d", site, []],
  ] as const) {
    const copy = [...head]
    addMyOGImage({ head: copy, routeID, site: routeSite, config })
    assert.deepEqual(copy, head)
  }
})

test("plugin registers pre-order route middleware and warns without site", () => {
  const added: unknown[] = []
  const warnings: string[] = []
  const integrations: { name: string }[] = []
  starlightMyOG({ account: "Ab12" }).hooks["config:setup"]({
    astroConfig: {},
    addIntegration: (integration) => integrations.push(integration),
    addRouteMiddleware: (middleware) => added.push(middleware),
    logger: { warn: (message) => warnings.push(message) },
  })
  assert.deepEqual(added, [{ entrypoint: "starlight-myog/route-middleware", order: "pre" }])
  assert.deepEqual(
    integrations.map(({ name }) => name),
    ["starlight-myog"]
  )
  assert.equal(warnings.length, 1)
})
