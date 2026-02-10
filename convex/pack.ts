import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getManyVia } from "convex-helpers/server/relationships";
import { v } from "convex/values";

const RARITY_PROBS = {
  n: 0.5,
  r: 0.3,
  sr: 0.15,
  ur: 0.05,
} as const;

type Rarity = keyof typeof RARITY_PROBS;

export const getPacks = query({
  args: {},
  handler: async (ctx) => {
    const packs = ctx.db.query("packs").collect();

    return packs;
  },
});

export const userBuysPack = mutation({
  args: { packId: v.id("packs") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("Not authorized");
    }

    // check user has enough coins
    const currency = await ctx.db
      .query("currencies")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    const PACK_PRICE = 100;

    if (!currency || currency.coins < PACK_PRICE) {
      throw new Error("Not enough coins");
    }

    // deduct coins
    await ctx.db.patch(currency._id, {
      coins: currency.coins - PACK_PRICE,
    });

    // get all possible cards in this pack
    const packEntries = await ctx.db
      .query("cards_in_packs")
      .withIndex("by_pack", (q) => q.eq("packId", args.packId))
      .collect();

    if (packEntries.length === 0) {
      throw new Error("This pack has no cards defined");
    }

    // const cardIds = packEntries.map((e) => e.cardId);

    const cardsInPack = await getManyVia(
      ctx.db,
      "cards_in_packs",
      "cardId",
      "by_pack",
      args.packId,
      "packId",
    );

    const obtainedCards = [];

    for (let i = 0; i < 8; i++) {
      const random = Math.random();
      let chosenRarity: Rarity = "n";

      if (random < RARITY_PROBS.ur) {
        chosenRarity = "ur";
      } else if (random < RARITY_PROBS.ur + RARITY_PROBS.sr) {
        chosenRarity = "sr";
      } else if (random < RARITY_PROBS.ur + RARITY_PROBS.sr + RARITY_PROBS.r) {
        chosenRarity = "r";
      }

      // filter available cards of the chosen rarity
      const candidates = cardsInPack.filter((c) => c?.rarity === chosenRarity);

      if (candidates.length === 0) {
        // fallback: just take any card (should rarely happen)
        const anyCard =
          cardsInPack[Math.floor(Math.random() * cardsInPack.length)];
        if (anyCard) obtainedCards.push(anyCard);
        continue;
      }

      // pick random card from candidates
      const randomIndex = Math.floor(Math.random() * candidates.length);
      const wonCard = candidates[randomIndex];

      obtainedCards.push(wonCard);

      // unlock the card for the user (N:M relationship)
      const alreadyOwned = await ctx.db
        .query("user_unlocked_cards")
        .withIndex("by_user_card", (q) =>
          q.eq("userId", userId).eq("cardId", wonCard!._id),
        )
        .first();

      // add 1 if already owned, else, initialize it at 1
      if (alreadyOwned) {
        await ctx.db.patch(alreadyOwned._id, {
          quantity: alreadyOwned.quantity + 1,
        });
      } else {
        await ctx.db.insert("user_unlocked_cards", {
          userId,
          cardId: wonCard!._id,
          quantity: 1,
        });
      }
    }

    return {
      success: true,
      obtainedCards: obtainedCards.map((c) => ({
        _id: c!._id,
        name: c!.name,
        level: c!.level,
        cardType: c!.cardType,
        attack: c!.attack,
        defense: c!.defense,
        rarity: c!.rarity,
        monsterType: c!.monsterType,
        spellType: c!.spellType,
        trapType: c!.trapType,
        archetype: c!.archetype,
        effect: c!.effect,
        decK: c!.deck,
        status: c!.status,
      })),
    };
  },
});
