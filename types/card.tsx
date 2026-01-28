export type Card = {
  _id?: string;
  name: string;
  level: number;
  cardType: "normal" | "trap" | "spell";
  atack?: number;
  defense?: number;
  rarity: "n" | "r" | "sr" | "ur";
  monsterType?: "beast" | "human" | "fairy" | "food";
  archetype?: "Completos";
  effect?: string;
  deck: "Deck" | "Extra Deck";
};
