import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Card } from "../../types/card";

const cards: Array<Card> = [
  // Normal monsters
  {
    name: "Completos Sausage",
    level: 1,
    cardType: "normal",
    attack: 200,
    defense: 0,
    rarity: "sr",
    monsterType: "food",
    archetype: "Completos",
    effect:
      "If you control a 'Completos' monster: You can Special Summon this card from your hand.",
    deck: "Deck",
  },
  {
    name: "Completos Bread",
    level: 2,
    cardType: "normal",
    attack: 0,
    defense: 1000,
    rarity: "ur",
    monsterType: "food",
    archetype: "Completos",
    effect:
      "If this card is Normal or Special summoned. You can add 1 'Completos' monster from your deck to your hand. except 'Completos Sausage'",
    deck: "Deck",
  },
  {
    name: "Completos Tomato",
    level: 4,
    cardType: "normal",
    attack: 1000,
    defense: 0,
    rarity: "sr",
    monsterType: "food",
    archetype: "Completos",
    effect:
      "If you control a 'Completos' monster: You can Special Summon this card from your hand.",
    deck: "Deck",
  },
  {
    name: "Completos Palta",
    level: 4,
    cardType: "normal",
    attack: 1200,
    defense: 0,
    rarity: "ur",
    monsterType: "food",
    archetype: "Completos",
    effect:
      "If you control a 'Completos' monster: You can Special Summon this card from your hand.",
    deck: "Deck",
  },
  {
    name: "Completos Mayonnaise",
    level: 1,
    cardType: "normal",
    attack: 500,
    defense: 0,
    rarity: "r",
    monsterType: "food",
    archetype: "Completos",
    effect:
      "If you control a 'Completos' monster: You can Special Summon this card from your hand.",
    deck: "Deck",
  },
  {
    name: "Completos Ketchup",
    level: 1,
    cardType: "normal",
    attack: 600,
    defense: 0,
    rarity: "sr",
    monsterType: "food",
    archetype: "Completos",
    effect:
      "If you control a 'Completos' monster: You can Special Summon this card from your hand.",
    deck: "Deck",
  },
  {
    name: "Completos Mustard",
    level: 1,
    cardType: "normal",
    attack: 500,
    defense: 0,
    rarity: "sr",
    monsterType: "food",
    archetype: "Completos",
    effect:
      "If you control a 'Completos' monster: You can Special Summon this card from your hand.",
    deck: "Deck",
  },
  // Trap cards (no attack/defense)
  {
    name: "Completos Pot",
    level: 0,
    cardType: "trap",
    rarity: "sr",
    archetype: "Completos",
    effect:
      "Target 1 'Completos' Monster you control; Special Summon from your Deck, 1 'Completos' Monster with a different Rank than that monster you control; Immediately after this effect resolves, Synchro Summon using this card you control.",
    deck: "Deck",
  },
  {
    name: "Food Quality Assurance",
    level: 0,
    cardType: "trap",
    rarity: "r",
    effect:
      "When your opponent activates a card or effect: Tribute 1 Level 5 or higher Food monster; negate that effect, and if you do, destroy that card.",
    deck: "Deck",
  },

  // Spell cards
  {
    name: "Golden Fork",
    level: 0,
    cardType: "spell",
    rarity: "n",
    effect:
      "A Food-Type monster equipped with this card increases its ATK and DEF by 300 points",
    deck: "Deck",
  },
  {
    name: "Completos Leftovers",
    level: 0,
    cardType: "spell",
    rarity: "r",
    archetype: "Completos",
    effect:
      "Target 1 'Completos' Monster in your GY; Special Summon it, but negate its effects",
    deck: "Deck",
  },
  {
    name: "Counterspell",
    level: 0,
    cardType: "spell",
    rarity: "sr",
    effect:
      "Target 1 face-up Spell on the field; negate its effects (until the end of this turn)",
    deck: "Deck",
  },
  {
    name: "Daniel the Honest",
    level: 0,
    cardType: "spell",
    rarity: "sr",
    effect:
      "Target 1 face-up Trap on the field; negate its effects (until the end of this turn)",
    deck: "Deck",
  },
  {
    name: "Crowd Control",
    level: 0,
    cardType: "spell",
    rarity: "sr",
    effect:
      "Target 1 face-up monster your opponent controls; negate its effects (until the end of this turn)",
    deck: "Deck",
  },
  {
    name: "Joe Momma",
    level: 4,
    cardType: "normal",
    rarity: "r",
    attack: 200,
    defense: 1100,
    effect:
      "If this card battles a monster, neither can be destroyed by that battle.",
    deck: "Deck",
  },
  {
    name: "Rat Chef",
    level: 5,
    cardType: "normal",
    attack: 800,
    defense: 900,
    rarity: "sr",
    monsterType: "beast",
    effect:
      "You can discard this card, then activate 1 of these effect \n - Add 1 'Food Type' monster from your graveyard to your hand, except 'Rat Chef'",
    deck: "Deck",
  },
];
export const seed = internalMutation({
  args: { force: v.optional(v.boolean()) },
  handler: async (ctx, { force = false }) => {
    if (!force) {
      const count = await ctx.db.query("cards").first();
      if (count) {
        console.log("Cards already exist → skipping seed");
        return { seeded: false };
      }
    }

    // wipe everything if npx convex run seed/cards:seed '{"force": true}'
    if (force) {
      await ctx.db
        .query("cards")
        .collect()
        .then((r) => r.forEach((c) => ctx.db.delete(c._id)));
    }

    for (const card of cards) {
      await ctx.db.insert("cards", card);
    }

    console.log(`Seeded ${cards.length} cards`);
    return { seeded: true, count: cards.length };
  },
});
