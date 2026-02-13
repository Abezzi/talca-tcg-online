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
    spellType: v.optional(
      v.union(
        v.literal("normal"),
        v.literal("quick-play"),
        v.literal("equip"),
        v.literal("continuous"),
      ),
    ),
    trapType: v.optional(
      v.union(
        v.literal("normal"),
        v.literal("counter"),
        v.literal("monster"),
        v.literal("continuous"),
      ),
    ),
    archetype: v.optional(v.union(v.literal("Completos"))),
    effect: v.optional(v.string()),
    deck: v.union(v.literal("Deck"), v.literal("Extra Deck")),
    status: v.optional(
      v.union(
        v.literal("unlimited"),
        v.literal("semi-limited"),
        v.literal("limited"),
        v.literal("forbidden"),
      ),
    ),
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

  matchmaking_queue: defineTable({
    userId: v.id("users"),
    deckId: v.id("decks"),
    status: v.union(
      v.literal("waiting"),
      v.literal("matched"),
      v.literal("canceled"),
      v.literal("expired"),
    ),
    mode: v.union(v.literal("ranked"), v.literal("unranked")),
    joinedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_user", ["userId"])
    .index("by_status_joined", ["status", "joinedAt"]),

  game_rooms: defineTable({
    // preparation
    player1Id: v.id("users"),
    player2Id: v.optional(v.id("users")), // null until matched
    player1Deck: v.id("decks"),
    player2Deck: v.optional(v.id("decks")),
    status: v.union(
      v.literal("waiting_for_player_2"),
      v.literal("active"),
      v.literal("finished"),
      v.literal("aborted"),
    ),
    winnerId: v.optional(v.id("users")),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
    // current game progress
    phase: v.optional(
      v.union(
        v.literal("draw"),
        v.literal("standby"),
        v.literal("main1"),
        v.literal("battle"),
        v.literal("main2"),
        v.literal("end"),
      ),
    ),
    turnNumber: v.optional(v.number()),
    // player states
    player1State: v.object({
      lifePoints: v.number(),
      hand: v.array(v.id("cards")),
      field: v.array(v.any()),
      deckSize: v.number(),
      graveyard: v.array(v.id("cards")),
      banished: v.array(v.id("cards")),
      extraDeck: v.array(v.id("cards")),
    }),
    player2State: v.object({
      lifePoints: v.number(),
      hand: v.array(v.id("cards")),
      field: v.array(v.any()),
      deckSize: v.number(),
      graveyard: v.array(v.id("cards")),
      banished: v.array(v.id("cards")),
      extraDeck: v.array(v.id("cards")),
    }),
    // shared state
    currentTurn: v.union(v.literal("player1"), v.literal("player2")),
    actionsLog: v.optional(
      v.array(
        v.object({
          timestamp: v.number(),
          turnNumber: v.number(),
          player: v.union(v.literal("player1"), v.literal("player2")),
          actionType: v.union(
            v.literal("draw"),
            v.literal("normalSummon"),
            v.literal("specialSummon"),
            v.literal("set"),
            v.literal("activated"),
            v.literal("attacked"),
          ),
          cardId: v.optional(v.id("cards")),
          fromZone: v.optional(v.string()),
          toZone: v.optional(v.string()),
          targets: v.optional(v.array(v.any())),
          description: v.optional(v.string()),
        }),
      ),
    ),
  })
    .index("by_player1", ["player1Id"])
    .index("by_player2", ["player2Id"])
    .index("by_both_players", ["player1Id", "player2Id"])
    .index("by_status", ["status"])
    .index("by_player1_status", ["player1Id", "status"])
    .index("by_player2_status", ["player2Id", "status"]),
});
