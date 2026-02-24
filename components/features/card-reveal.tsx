import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Card as CardType } from "@/types/card";
import { Icon } from "@iconify/react";

type CardRevealProps = {
  card: CardType;
  index: number; // for stagger animation or numbering
  size?: "normal" | "small" | "large";
  className?: string;
};

export function CardReveal({
  card,
  index,
  size = "normal",
  className,
}: CardRevealProps) {
  const isSmall = size === "small";
  const isLarge = size === "large";

  const textSize = isSmall ? "text-xs" : isLarge ? "text-lg" : "text-base";

  const rarityStyles = {
    n: "bg-gray-200 text-gray-800 border-gray-300",
    r: "bg-green-200 text-green-800 border-green-300",
    sr: "bg-blue-200 text-blue-800 border-blue-400 font-semibold",
    ur: "bg-purple-200 text-purple-800 border-purple-400 font-bold animate-pulse",
  };

  // const rarityLabel = {
  //   n: "Normal",
  //   r: "Rare",
  //   sr: "Super Rare",
  //   ur: "Ultra Rare",
  // };

  const cardTypeStyle = {
    normal:
      "bg-radial from-stone-100 from-40% to-stone-400 text-gray-800 border-gray-300",
    spell:
      "bg-radial from-emerald-200 from-40% to-emerald-500 text-emerald-800 border-emerald-300",
    trap: "bg-radial from-pink-100 from-40% to-pink-400 text-pink-800 border-pink-300",
  };

  return (
    <Card
      className={cn(
        "py-2 w-full max-w-[320px] overflow-hidden border-2 transition-all duration-300 hover:scale-105",
        cardTypeStyle[card.cardType] || "bg-white",
        className,
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <CardHeader className="px-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className={(cn("leading-tight"), textSize)}>
            {card.name}
          </CardTitle>
          <Badge
            className={cn(
              "text-xs px-2 py-0.5 uppercase",
              rarityStyles[card.rarity],
            )}
          >
            {/* TODO: Do this smarter */}
            {card.archetype === "Completos" ? (
              <Icon icon="hugeicons:hotdog" />
            ) : (
              <Icon icon="hugeicons:universal-access" />
            )}
          </Badge>
        </div>

        {/* art */}
        <div
          className={cn(
            "h-44 bg-gradient-to-b from-slate-700 to-slate-900 flex items-center justify-center text-white text-2xl font-bold",
            textSize,
          )}
        >
          {card.name}
        </div>

        <div className="flex flex-row gap-2">
          {/* lvl, spell or trap tag */}
          {card.cardType === "normal" && (
            <p className="text-xs text-stone-900 uppercase italic">
              LVL: {card.level}
            </p>
          )}
          {card.cardType !== "normal" && (
            <p className="text-xs text-stone-900 uppercase italic">
              {card.cardType}
            </p>
          )}
          {/* archetype tag */}
          {card.archetype && (
            <p className="text-xs text-stone-900 underline">{card.archetype}</p>
          )}

          {card.monsterType && (
            <p className="text-xs text-stone-900 capitalize">
              {card.monsterType} Type
            </p>
          )}

          {/* rarity */}
          {/* {card.rarity && ( */}
          {/*   <p className={cn("text-xs font-bold", rarityStyles[card.rarity])}> */}
          {/*     {rarityLabel[card.rarity] || card.rarity.toUpperCase()} */}
          {/*   </p> */}
          {/* )} */}
        </div>
      </CardHeader>

      <CardContent className="px-2">
        {card.effect ? (
          <CardDescription
            className={cn(
              "justify-evenly text-slate-800 leading-relaxed bg-stone-100/70 border border-double border-stone-400 p-1 overflow-hidden text-justify min-h-[140px]",
              textSize,
            )}
          >
            {card.effect}
          </CardDescription>
        ) : (
          <p className="text-muted-foreground italic">No effect text</p>
        )}
      </CardContent>

      <CardFooter className="justify-end">
        {card.cardType === "normal" ? (
          <p className="text-xs text-stone-900 italic font-bold">
            ATK: {card.attack} / DEF: {card.defense}
          </p>
        ) : card.cardType === "spell" ? (
          <p className="text-xs text-stone-900 italic font-bold capitalize">
            {card.spellType} spell card
          </p>
        ) : (
          <p className="text-xs text-stone-900 italic font-bold capitalize">
            {card.trapType} trap card
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
