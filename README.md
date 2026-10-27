# starlight-myog

A [Starlight](https://starlight.astro.build) plugin that adds an `og:image` and
`twitter:image` to each documentation page. [MyOG.social](https://myog.social)
generates each image from the page's URL, using its content and branding
automatically.

The plugin writes metadata at build time. It does not fetch images or call MyOG
during builds. Social platforms request the image URL when they preview a page.

Maintained by [MyOG.social](https://myog.social). The plugin is MIT licensed;
the image service requires a paid plan or card trial.

## Requirements and tested support

- Starlight **0.33 through 0.42**: peer range `@astrojs/starlight >=0.33.0 <0.43.0`.
  0.33 added the editable route `head` this plugin uses. Built and tested with
  Starlight 0.33.0 on Astro 5.18.0 and Starlight 0.42.6 on Astro 7.2.10, on
  Node.js 24, with `astro build` and an `astro dev` page check. A default build on
  Node.js 22 produced identical image tags. Releases between
  those were not each tested. Starlight is pre-1.0, so a new minor needs its own
  check before the range is widened.
- Astro's `site` set to your public HTTPS origin. Without it Starlight emits no
  canonical URL, so the plugin adds nothing and logs a warning.
- A MyOG account with the site's domain registered and an active subscription
  or trial. Image generation and refreshes use the plan's credits. The plugin
  does not register domains, start trials or bypass usage limits.
- Your account ID, copied from the `a=` value in the install code on
  [the Starlight guide](https://myog.social/docs/starlight). It appears in each
  image URL and is not a secret.

## Install

```sh
pnpm add starlight-myog
```

Add the plugin to your Starlight configuration in `astro.config.mjs`:

```js
import { defineConfig } from "astro/config"
import starlight from "@astrojs/starlight"
import starlightMyOG from "starlight-myog"

export default defineConfig({
  site: "https://docs.example.com",
  integrations: [
    starlight({
      title: "My documentation",
      plugins: [starlightMyOG({ account: "<account ID>" })],
    }),
  ],
})
```

If you used the manual route middleware from the MyOG guide, remove
`src/myogRouteData.ts` from `routeMiddleware`. Leaving both does not duplicate
tags, but the manual middleware's image URL is the one used.

Build the site, then inspect the generated HTML's `<head>`. Each image should
appear once, and the MyOG URL's `url` parameter should decode to the page's
canonical link.

## Check a deployed page

After deploying, paste a public page URL into MyOG's free
[Open Graph Checker](https://myog.social/tools/og-preview) and confirm the image
loads. The build output shows the tags, not whether MyOG serves the image.

If the image doesn't load, check your MyOG account:

- The exact hostname in your canonical links is registered. `www.example.com`
  and `example.com` are separate domains.
- The account has credits available.

## Options

| Option     | Required | Default            | Description                                                                                   |
| ---------- | -------- | ------------------ | --------------------------------------------------------------------------------------------- |
| `account`  | yes      |                    | Your MyOG account ID (letters and digits). The build fails with a clear error when invalid.   |
| `template` | no       | `screenshot-right` | `brand`, `screenshot`, `screenshot-right`, `screenshot-bottom` or `screenshot-bottom-framed`. |

## Overrides and other metadata

The plugin adds tags only where none exist:

- A page or global `og:image` wins: frontmatter `head`, Starlight's `head` config
  or your `routeMiddleware`. The plugin then adds neither image tag. The same
  applies when another plugin's route middleware adds an `og:image`. Tags other
  plugins add for other purposes are kept.
- A page that sets only `twitter:image` keeps it and gets the MyOG `og:image`.
- Title, description, canonical, `twitter:card` and other head entries are left
  as they are.
- The 404 page gets no MyOG tags.

To use MyOG on pages without their own image, remove a global `og:image` from
the Starlight `head` config, along with its old dimensions and alt text.

The plugin registers its route middleware with `order: "pre"` and reads the head
after the rest of the middleware chain has run. A middleware that also uses
`order: "pre"`, is listed earlier, and adds an `og:image` after calling `next()`
is not detected.

## Limits

- `site`, `base` and `trailingSlash` must match the deployed site. The image URL
  uses the canonical link Starlight renders, including the base path, locale
  prefix and trailing slash, encoded once as a query value.
- A custom canonical link must point to a public page on a domain registered in
  MyOG.
- Only pages rendered by Starlight are covered. Other Astro pages need their own
  head setup; see [the Astro guide](https://myog.social/docs/astro). A custom
  `Head` component override must still render `starlightRoute.head`.
- Each distinct page URL gets its own image and uses credits from the monthly
  allowance ([pricing](https://myog.social/pricing)). A large site can exhaust it.
- Private documentation cannot be fetched by MyOG or social crawlers.
- Social platforms cache images; use their debugger to refresh a card.

## Uninstall

Remove the plugin entry and run `pnpm remove starlight-myog`.

## License

MIT
