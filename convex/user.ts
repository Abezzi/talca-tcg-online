import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getManyVia } from "convex-helpers/server/relationships";

export const getUser = query({
  // Validators for arguments.
  args: {},

  // Query implementation.
  handler: async (ctx) => {
    //// Read the database as many times as you need here.
    //// See https://docs.convex.dev/database/reading-data.
    const userId = await getAuthUserId(ctx);
    const user = userId === null ? null : await ctx.db.get("users", userId);

    return {
      viewer: user?.email ?? null,
      name: user?.name ?? null,
      id: user?._id ?? null,
    };
  },
});

export const createCurrency = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) throw new Error("Not authenticated");

    await ctx.db.insert("currencies", { userId, coins: 0 });
  },
});

export const getUserCoins = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) throw new Error("Not authenticated");

    const currency = await ctx.db
      .query("currencies")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (currency) {
      return currency.coins;
    }

    return null;
  },
});

export const getOrCreateUserCoins = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) throw new Error("Not authenticated");

    const currency = await ctx.db
      .query("currencies")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (!currency) {
      await ctx.db.insert("currencies", { userId, coins: 0 });
      return 0;
    }

    return currency.coins;
  },
});

export const getUserCards = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const unlockedEntries = await ctx.db
      .query("user_unlocked_cards")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const cardsWithQuantity = await Promise.all(
      unlockedEntries.map(async (entry) => {
        const card = await ctx.db.get(entry.cardId);
        if (!card) return null; // rare case: card was deleted

        return {
          ...card,
          quantity: entry.quantity,
          // userId: entry.userId, just in case is needed in the future
        };
      }),
    );

    // filter out nulls if a card is deleted
    return cardsWithQuantity.filter(
      (item): item is NonNullable<typeof item> => item !== null,
    );
  },
});
