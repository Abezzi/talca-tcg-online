import { useAuthStore } from '../../stores/auth'

export default defineNuxtPlugin((nuxtApp) => {
  const authStore = useAuthStore()

  // run once when auth becomes ready
  watchEffect(() => {
    if (authStore.isAuthenticated && authStore.user) {
      console.log('[Auth Sync Plugin] Detected authenticated user → syncing to Convex')
      authStore.syncUserToConvex()
    }
  })

  // force a check once after mount (handles if state was already set)
  nuxtApp.hook('app:mounted', () => {
    console.log('[Auth Sync Plugin] App mounted – forcing sync check')
    if (authStore.isAuthenticated && authStore.user) {
      authStore.syncUserToConvex()
    }
  })
})
