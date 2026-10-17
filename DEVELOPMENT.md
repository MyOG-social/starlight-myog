# starlight-myog development

`README.md`, `LICENSE` and `lib/` ship in the package. This file, source and
tests stay in the repository.

## Build and verify

From this directory, with Bun and pnpm installed:

```sh
pnpm install --ignore-scripts
bun run type-check
bun run lint
bun run test
pnpm exec prettier --check src tests package.json tsconfig.json tsconfig.build.json README.md DEVELOPMENT.md
pnpm pack --pack-destination /absolute/task/release
```

The package is ESM with no runtime dependencies and no dependency on Starlight
types; `src/index.ts` declares the structural subset of the plugin API it uses.
The MyOG service defines the accepted template names. `TEMPLATES` in
`src/options.ts` mirrors them; update it when MyOG adds or removes a template.

## Design

The `config:setup` hook validates options, adds an Astro integration that serves
them as `virtual:starlight-myog/config` (with the package in `ssr.noExternal` so
Vite bundles the middleware), and registers `starlight-myog/route-middleware`
with `order: "pre"`. The middleware awaits `next()` before reading the head, so
user, default and `post` middleware have already run. It reads the canonical
link Starlight renders, which carries `base`, locale and `trailingSlash`, and
encodes it once as the `url` value with `src=docs`, matching the manual recipe
on `/docs/starlight`. An existing `og:image` or `twitter:image` is never
replaced; there is no output without `site` or on the 404 route.

`addRouteMiddleware` and the editable route `head` arrived in Starlight 0.33.
Qualify the floor and the latest minor before changing the peer range.

## Installed-package acceptance

Pack the plugin and install the tarball into separate Starlight fixtures for
0.33.0/Astro 5.18.0 and the latest qualified minor, with scripts disabled and
network-disabled builds. Do not point imports at repository source. Cover:

- default, `base` with `trailingSlash: "never"`, no `site`, a global `og:image`,
  and the manual guide middleware left in place
- an invalid account (the build must fail with the plugin's message)
- page, OG-only and Twitter-only frontmatter overrides, a user middleware image,
  another plugin's middleware, a custom reserved-character canonical, encoded and
  Unicode slugs, a locale and its fallback pages, and the 404 page
- one `astro dev` page

Parse the generated heads and assert semantic markers, the decoded `url` against
the canonical link, and single image tags. Never fetch the generated MyOG URLs.
A consumer `astro.config` type-check against the installed Starlight types
catches drift in the structural plugin types.
