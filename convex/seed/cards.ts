import { internalMutation } from '../_generated/server'
import { v } from 'convex/values'

type SeedCard = {
  name: string
  level: number
  type: 'normal' | 'trap' | 'spell'
  atack?: number
  defense?: number
  rarity: 'n' | 'r' | 'sr' | 'ur'
}

const cards: Array<SeedCard> = [
  // Normal monsters
  {
    name: 'Shadow Warrior',
    level: 4,
    type: 'normal',
    atack: 1800,
    defense: 1200,
    rarity: 'n'
  },
  {
    name: 'Flame Guardian',
    level: 5,
    type: 'normal',
    atack: 2000,
    defense: 1500,
    rarity: 'r'
  },
  {
    name: 'Aqua Scout',
    level: 3,
    type: 'normal',
    atack: 1400,
    defense: 1000,
    rarity: 'n'
  },
  {
    name: 'Dragon Sovereign',
    level: 8,
    type: 'normal',
    atack: 3000,
    defense: 2500,
    rarity: 'ur'
  },
  {
    name: 'Phantom Assassin',
    level: 6,
    type: 'normal',
    atack: 2200,
    defense: 1800,
    rarity: 'sr'
  },
  {
    name: 'Earth Golem',
    level: 7,
    type: 'normal',
    atack: 2500,
    defense: 3000,
    rarity: 'r'
  },
  // Trap cards (no attack/defense)
  {
    name: 'Void Trap',
    level: 0,
    type: 'trap',
    rarity: 'sr'
  },
  {
    name: 'Mirror Shield',
    level: 0,
    type: 'trap',
    rarity: 'r'
  },

  // Spell cards
  {
    name: 'Energy Burst',
    level: 0,
    type: 'spell',
    rarity: 'ur'
  },
  {
    name: 'Healing Wave',
    level: 0,
    type: 'spell',
    rarity: 'sr'
  }
]
export const seed = internalMutation({
  args: { force: v.optional(v.boolean()) },
  handler: async (ctx, { force = false }) => {
    if (!force) {
      const count = await ctx.db.query('cards').first()
      if (count) {
        console.log('Cards already exist → skipping seed')
        return { seeded: false }
      }
    }

    // wipe everything if npx convex run seed/cards:seed '{"force": true}'
    if (force) {
      await ctx.db.query('cards').collect().then(r => r.forEach(c => ctx.db.delete(c._id)))
    }

    for (const card of cards) {
      await ctx.db.insert('cards', card)
    }

    console.log(`Seeded ${cards.length} cards`)
    return { seeded: true, count: cards.length }
  }
})
