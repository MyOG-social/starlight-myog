import config from "virtual:starlight-myog/config"

import { addMyOGImage, type HeadEntry } from "./head.js"

type RouteContext = {
  site: URL | undefined
  locals: { starlightRoute: { id: string; head: HeadEntry[] } }
}

// Registered with order "pre" and awaits the rest of the chain, so it reads the final head after
// user and other plugin middleware.
export async function onRequest(context: RouteContext, next: () => Promise<void>) {
  await next()
  const { head, id } = context.locals.starlightRoute
  addMyOGImage({ head, routeID: id, site: context.site, config })
}
