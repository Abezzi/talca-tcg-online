export default defineOAuthDiscordEventHandler({
  config: {
    scope: ['identify', 'email']
  },

  async onSuccess(event, { user }) {
    await setUserSession(event, {
      user: {
        id: user.id,
        username: user.username,
        globalName: user.global_name, // display name
        avatar: user.avatar
          ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
          : null,
        email: user.email,
        provider: 'discord'
        // Optional: tokens.access_token if you need to call Discord API later (e.g. get guilds)
      }
    })

    return sendRedirect(event, '/')
  },

  // Optional: custom error handling
  onError(event, error: Error) {
    console.error('Discord OAuth error:', error)
    return sendRedirect(event, '/login?error=discord_auth_failed')
  }
})
