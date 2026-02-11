import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createDeck = mutation({
  args: {
    name: v.string(),
    entries: v.array(
      v.object({
        cardId: v.id("cards"),
        quantity: v.number(),
        position: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const userId = await getAuthUserId(ctx);

    if (!userId) throw new Error("Not authenticated");

    const deckId = await ctx.db.insert("decks", {
      name: args.name,
      userId: userId,
    });

    for (const entry of args.entries) {
      await ctx.db.insert("deck_card_entries", {
        deckId,
        cardId: entry.cardId,
        quantity: entry.quantity,
        position: entry.position,
      });
    }

    return deckId;
  },
});
