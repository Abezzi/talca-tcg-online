import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const seed = internalMutation({
  args: { force: v.optional(v.boolean()) },
  handler: async (ctx, { force = false }) => {
    if (!force) {
      const count = await ctx.db.query("cards_in_packs").first();
      if (count) {
        console.log("cards_in_ packs already exist -> skipping seed");
        return { seeded: false };
      }
    }

    // wipe everything if npx convex run seed/packs:seed '{"force": true}'
    if (force) {
      await ctx.db
        .query("cards_in_packs")
        .collect()
        .then((r) => r.forEach((c) => ctx.db.delete(c._id)));
    }

    // fetch pack ids by unique title
    // standard
    const standardPack = await ctx.db
      .query("packs")
      .withIndex("by_title", (q) => q.eq("title", "Standard Pack"))
      .first();

    if (!standardPack) {
      throw new Error("Standard Pack not found, run packs seed first");
    }

    // culinary
    const culinaryPack = await ctx.db
      .query("packs")
      .withIndex("by_title", (q) => q.eq("title", "Culinary Excellence"))
      .first();

    if (!culinaryPack) {
      throw new Error(
        "Culinary Excellence Pack not found, run packs seed first",
      );
    }

    const allCards = await ctx.db.query("cards").collect();
    if (allCards.length === 0) {
      throw new Error("No cards found—run cards seed first");
    }

    for (const card of allCards) {
      await ctx.db.insert("cards_in_packs", {
        packId: standardPack._id,
        cardId: card._id,
      });
    }
    console.log(`Associated ${allCards.length} cards with Standard Pack`);

    const culinaryCardNames = [
      "Completos Sausage",
      "Completos Bread",
      "Completos Tomato",
      "Completos Palta",
      "Completos Mayonnaise",
      "Completos Ketchup",
      "Completos Mustard",
      "Completos Pot",
      "Completos Leftovers",
      "Food Quality Assurance",
      "Golden Fork",
      "Rat Chef",
    ];

    let culinaryCount = 0;
    for (const name of culinaryCardNames) {
      const card = allCards.find((c) => c.name === name);
      if (!card) {
        console.warn(`Card "${name}" not found—skipping`);
        continue;
      }
      await ctx.db.insert("cards_in_packs", {
        packId: culinaryPack._id,
        cardId: card._id,
      });
      culinaryCount++;
    }
    console.log(`Associated ${culinaryCount} cards with Culinary Excellence`);

    return { seeded: true, totalRelations: allCards.length + culinaryCount };
  },
});
