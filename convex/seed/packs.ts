import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Pack } from "../../types/pack";

const packs: Array<Pack> = [
  {
    title: "Standard Pack",
    description: "Can get any card from the Talca TCG universe",
    imageSrc: "https://placehold.co/600x400/0000FF/FFFFFF/png",
    newTag: false,
  },
  {
    title: "Culinary Excellence",
    description: "Your favorite fast food its ready to fight.",
    imageSrc: "https://placehold.co/600x400/FF0000/FFFFFF/png",
    newTag: true,
  },
];

export const seed = internalMutation({
  args: { force: v.optional(v.boolean()) },
  handler: async (ctx, { force = false }) => {
    if (!force) {
      const count = await ctx.db.query("packs").first();
      if (count) {
        console.log("Packs already exist -> skipping seed");
        return { seeded: false };
      }
    }

    // wipe everything if npx convex run seed/packs:seed '{"force": true}'
    if (force) {
      await ctx.db
        .query("packs")
        .collect()
        .then((r) => r.forEach((c) => ctx.db.delete(c._id)));
    }

    for (const pack of packs) {
      await ctx.db.insert("packs", pack);
    }

    console.log(`Seeded ${packs.length} packs`);
    return { seeded: true, count: packs.length };
  },
});
