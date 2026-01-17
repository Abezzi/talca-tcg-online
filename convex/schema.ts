import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  // users
  users: defineTable({
    discordId: v.string(),
    username: v.string(),
    email: v.string(),
    discriminator: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
    coins: v.number()
  }).index('by_username', ['username']).index('by_discordId', ['discordId']),

  // cards
  cards: defineTable({
    name: v.string(),
    level: v.number(),
    type: v.union(v.literal('normal'), v.literal('trap'), v.literal('spell')),
    atack: v.optional(v.number()),
    defense: v.optional(v.number()),
    rarity: v.union(
      v.literal('n'),
      v.literal('r'),
      v.literal('sr'),
      v.literal('ur')
    )
  }).index('by_name', ['name']),

  // N:M users:cards
  user_unlocked_cards: defineTable({
    userId: v.id('users'),
    cardId: v.id('cards')
  })
    .index('by_user', ['userId'])
    .index('by_user_card', ['userId', 'cardId'])
    .index('by_card', ['cardId']),

  // decks :: 1:N user:decks
  decks: defineTable({
    name: v.string(),
    userId: v.id('users')
  }),

  // N:M deck:cards
  deck_card_entries: defineTable({
    deckId: v.id('decks'),
    cardId: v.id('cards'),
    quantity: v.number(),
    position: v.optional(v.number())
  })
    .index('by_deck', ['deckId'])
    .index('by_deck_card', ['deckId', 'cardId'])
    .index('by_card', ['cardId'])
})
