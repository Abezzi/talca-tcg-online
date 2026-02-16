import { query } from "./_generated/server";
import { v } from "convex/values";

export const getCardsByIds = query({
  args: {
    ids: v.array(v.id("cards")),
  },
  handler: async (ctx, { ids }) => {
    if (ids.length === 0) return {};

    const cards = await Promise.all(ids.map((id) => ctx.db.get(id)));

    // Convert to map for easy lookup
    return cards.reduce(
      (acc, card) => {
        if (card) acc[card._id] = card;
        return acc;
      },
      {} as Record<string, any>,
    );
  },
});
