import { defineStore } from 'pinia'
import { useConvex } from '~/composables/useConvex'
import { api } from '../convex/_generated/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as {
      discordId: string
      username: string
      globalName?: string | null
      avatarUrl?: string | null
      email?: string | null
      provider: 'discord'
    } | null,
    isAuthenticated: false,
    isLoading: true
  }),

  getters: {
    displayName: state => state.user?.globalName || state.user?.username || 'Guest',
    avatar: state => state.user?.avatarUrl
  },

  actions: {
    async initAuth() {
      this.isLoading = true
      try {
        const userSession = useUserSession()
        await userSession.fetch()

        console.log('[Auth] Session after fetch:', userSession.session.value)
        console.log('[Auth] User object:', userSession.user.value)

        if (userSession.user.value) {
          console.log('[Auth] Mapping user to Pinia')
          const discordUser = userSession.user.value

          this.user = {
            discordId: discordUser.id,
            username: discordUser.username,
            globalName: discordUser.global_name,
            avatarUrl: discordUser.avatar,
            email: discordUser.email,
            provider: discordUser.provider
          }
          this.isAuthenticated = true
        }
      } catch (err) {
        console.error('[Auth] init failed:', err)
      } finally {
        this.isLoading = false
      }
    },

    async syncUserToConvex() {
      if (!this.user) {
        console.log('[Convex Sync] No user in Pinia → skipping')
        return
      }

      console.log('[Convex Sync] Sending user to Convex:', this.user.discordId)

      const { convex } = useConvex()

      try {
        await convex.mutation(api.users.upsertUser, {
          discordId: this.user.discordId,
          username: this.user.globalName || this.user.username,
          avatarUrl: this.user.avatarUrl ?? undefined,
          email: this.user.email ?? undefined
        })
        console.log('[Convex Sync] Success — user upserted')
      } catch (err) {
        console.error('[Convex Sync] Mutation failed:', err)
      }
    },

    async logout() {
      const userSession = useUserSession()
      try {
        // clear cookies and update reactive state
        await userSession.clear()
      } catch (err) {
        console.error('Logout failed:', err)
      }

      this.user = null
      this.isAuthenticated = false
      navigateTo('/login')
    },

    loginWithDiscord() {
      navigateTo('/auth/discord')
    }
  }
})
