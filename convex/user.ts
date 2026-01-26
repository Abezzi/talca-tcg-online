import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

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

export const getUserCurrencies = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const currency = await ctx.db
      .query("currencies")
      .filter((q) => q.eq(q.field("userId"), userId))
      .take(1);
    return currency[0].coins;
  },
});
