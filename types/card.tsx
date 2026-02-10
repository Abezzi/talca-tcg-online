export type Card = {
  _id?: string;
  name: string;
  level: number;
  cardType: "normal" | "trap" | "spell";
  attack?: number;
  defense?: number;
  rarity: "n" | "r" | "sr" | "ur";
  monsterType?: "beast" | "human" | "fairy" | "food";
  spellType?: "normal" | "quick-play" | "equip" | "continuous";
  trapType?: "normal" | "counter" | "continuous" | "monster";
  archetype?: "Completos";
  effect?: string;
  deck: "Deck" | "Extra Deck";
  status?: "unlimited" | "semi-limited" | "limited" | "forbidden";
};

export type ObtainedCard = {
  _id: string;
  name: string;
  rarity: "n" | "r" | "sr" | "ur";
  effect?: string;
  archetype?: string;
};
