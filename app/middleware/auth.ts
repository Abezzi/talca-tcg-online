export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  // skip to login page
  if (to.path === '/login' || to.path === '/register') return

  // redirect the user to the login screen if they're not authenticated
  if (!loggedIn.value) {
    return navigateTo('/login')
  }
})
