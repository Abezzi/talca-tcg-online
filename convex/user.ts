import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getManyVia } from "convex-helpers/server/relationships";
import { v } from "convex/values";

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
    };
  },
});

export const createCurrency = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.insert("currencies", { userId: args.userId, coins: 0 });
  },
});

export const getUserCurrencies = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("currencies")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (existing) {
      return existing.coins;
    }
  },
});

export const getUserCards = query({
  args: {},

  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const cards = await getManyVia(
      ctx.db,
      "user_unlocked_cards",
      "cardId",
      "by_user_card",
      userId,
      "userId",
    );

    return cards;
  },
});
