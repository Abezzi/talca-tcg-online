import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const upsertUser = mutation({
  args: {
    discordId: v.string(),
    username: v.string(),
    discriminator: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    email: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    console.log('[Convex] Upsert called with:', args)
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_discordId', q => q.eq('discordId', args.discordId))
      .first()

    if (existingUser) {
      // update if needed
      return await ctx.db.patch(existingUser._id, {
        username: args.username,
        avatarUrl: args.avatarUrl,
        ...(args.email !== undefined && { email: args.email })
      })
    } else {
      // insert user
      return await ctx.db.insert('users', {
        discordId: args.discordId,
        username: args.username,
        email: args.email ?? '',
        discriminator: args.discriminator,
        avatarUrl: args.avatarUrl,
        createdAt: Date.now()
      })
    }
  }
})

export const getMyUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const discordId = identity.tokenIdentifier.split('|')[1] // or however you map

    return await ctx.db
      .query('users')
      .withIndex('by_discordId', q => q.eq('discordId', discordId))
      .first()
  }
})
