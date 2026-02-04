import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,
  numbers: defineTable({
    value: v.number(),
  }),

  currencies: defineTable({
    coins: v.number(),
    userId: v.id("users"),
  }).index("by_user_id", ["userId"]),

  cards: defineTable({
    name: v.string(),
    level: v.number(),
    cardType: v.union(
      v.literal("normal"),
      v.literal("trap"),
      v.literal("spell"),
    ),
    attack: v.optional(v.number()),
    defense: v.optional(v.number()),
    rarity: v.union(
      v.literal("n"),
      v.literal("r"),
      v.literal("sr"),
      v.literal("ur"),
    ),
    monsterType: v.optional(
      v.union(
        v.literal("beast"),
        v.literal("human"),
        v.literal("fairy"),
        v.literal("food"),
      ),
    ),
    archetype: v.optional(v.union(v.literal("Completos"))),
    effect: v.optional(v.string()),
    deck: v.union(v.literal("Deck"), v.literal("Extra Deck")),
  }).index("by_name", ["name"]),

  // N:M users:cards
  user_unlocked_cards: defineTable({
    userId: v.id("users"),
    cardId: v.id("cards"),
    quantity: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_card", ["userId", "cardId"])
    .index("by_card", ["cardId"])
    .index("by_user_quantity", ["quantity"]),

  // decks :: 1:N user:decks
  decks: defineTable({
    name: v.string(),
    userId: v.id("users"),
  }),

  // N:M deck:cards
  deck_card_entries: defineTable({
    deckId: v.id("decks"),
    cardId: v.id("cards"),
    quantity: v.number(),
    position: v.optional(v.number()),
  })
    .index("by_deck", ["deckId"])
    .index("by_deck_card", ["deckId", "cardId"])
    .index("by_card", ["cardId"]),

  packs: defineTable({
    title: v.string(),
    description: v.string(),
    imageSrc: v.string(),
    newTag: v.optional(v.boolean()),
  }).index("by_title", ["title"]),

  // N:M pack:cards
  cards_in_packs: defineTable({
    packId: v.id("packs"),
    cardId: v.id("cards"),
  }).index("by_pack", ["packId"]),
});
