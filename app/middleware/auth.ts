import { useAuthStore } from '../../stores/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  console.log('inside the middelware')
  const authStore = useAuthStore()
  const userSession = useUserSession()

  if (!authStore.isAuthenticated && authStore.isLoading) {
    console.log('[Auth Middleware] Starting initial auth check...')
    await authStore.initAuth()
    console.log('[Auth Middleware] Auth check finished -> user:', !!authStore.user)
  }

  const isProtectedRoute = to.meta.auth === true || to.path === '/'

  // skip to login page
  if (to.path === '/login' || to.path === '/register') return

  // redirect the user to the login screen if they're not authenticated
  if (isProtectedRoute && to.meta.auth && !userSession.loggedIn.value && !authStore.isAuthenticated) {
    return navigateTo('/login', { redirectCode: 302 })
  }
})
