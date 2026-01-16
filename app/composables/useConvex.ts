import { provide, inject } from 'vue'
import { useNuxtApp } from '#app' // Optional, for runtime config

let cachedConvex: ReturnType<typeof useConvexClient> | null = null

export const useConvex = () => {
  const { $convexUrl } = useNuxtApp()
  const convex = useConvexClient()

  const convexUrl = $convexUrl || process.env.CONVEX_URL

  if (!convex) {
    console.error('Convex client not initialized – check nuxt.config.ts → convex.url and .env CONVEX_URL')
  }

  if (!cachedConvex) {
    cachedConvex = useConvexClient()
    console.log('Convex client initialized with URL:', convexUrl)
  }

  return { convex: cachedConvex }
}

const ConvexSymbol = Symbol('convex')

export const provideConvex = () => {
  const convex = useConvex().convex
  provide(ConvexSymbol, convex)
}

export const injectConvex = () => {
  const convex = inject<typeof useConvexClient>(ConvexSymbol)
  if (!convex) {
    throw new Error('useConvex() must be used within a provider or component')
  }
  return convex
}
