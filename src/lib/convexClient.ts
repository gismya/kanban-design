import { ConvexReactClient } from 'convex/react'

const convexUrl = import.meta.env.VITE_CONVEX_URL

if (!convexUrl) {
  throw new Error('VITE_CONVEX_URL is missing. Run `npx convex dev` to configure your environment.')
}

export const convex = new ConvexReactClient(convexUrl)
