declare module '#auth-utils' {
  interface User {
    id: string
    username: string
    global_name?: string | null
    avatar?: string | null
    email?: string | null
    provider: 'discord'
  }

  interface UserSession {
    loggedInAt?: Date
  }

  // interface SecureSessionData {
  // e.g. discordRefreshToken?: string
  // }
}

export { }
