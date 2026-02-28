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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";

type CardRevealProps = {
  card: CardType;
  index: number; // for stagger animation or numbering
  size?: "normal" | "small" | "large" | "extra-small";
  className?: string;
};

export function CardOnBoard({
  card,
  index,
  size = "normal",
  className,
}: CardRevealProps) {
  const isExtraSmall = size === "extra-small";
  const isSmall = size === "small";
  const isLarge = size === "large";

  const textSize = isSmall
    ? "text-xs"
    : isLarge
      ? "text-lg"
      : isExtraSmall
        ? "text-[10px]"
        : "text-base";

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
    <HoverCard>
      <HoverCardTrigger>
        <Card
          className={cn(
            "h-32 w-24 py-0 gap-1 max-w-[320px] overflow-hidden border-2 transition-all duration-300 hover:brightness-105",
            cardTypeStyle[card.cardType] || "bg-white",
            className,
          )}
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <CardHeader className="px-2">
            <div className="flex justify-center items-start">
              <CardTitle className={(cn("leading-tight"), textSize)}>
                {card.name}
              </CardTitle>
            </div>

            {/* art */}
            <div
              className={cn(
                "h-12 bg-gradient-to-b from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold",
                textSize,
              )}
            >
              {card.name}
            </div>

            {/* <div className="flex flex-row gap-2"> */}
            {/* lvl, spell or trap tag */}
            {/* {card.cardType === "normal" && ( */}
            {/*   <p className="text-xs text-stone-900 uppercase italic"> */}
            {/*     LVL: {card.level} */}
            {/*   </p> */}
            {/* )} */}
            {/* {card.cardType !== "normal" && ( */}
            {/*   <p className="text-xs text-stone-900 uppercase italic"> */}
            {/*     {card.cardType} */}
            {/*   </p> */}
            {/* )} */}
            {/* archetype tag */}
            {/* {card.archetype && ( */}
            {/*   <p className="text-xs text-stone-900 underline">{card.archetype}</p> */}
            {/* )} */}
            {/**/}
            {/* {card.monsterType && ( */}
            {/*   <p className="text-xs text-stone-900 capitalize"> */}
            {/*     {card.monsterType} Type */}
            {/*   </p> */}
            {/* )} */}

            {/* rarity */}
            {/* {card.rarity && ( */}
            {/*   <p className={cn("text-xs font-bold", rarityStyles[card.rarity])}> */}
            {/*     {rarityLabel[card.rarity] || card.rarity.toUpperCase()} */}
            {/*   </p> */}
            {/* )} */}
            {/* </div> */}
          </CardHeader>

          {/* <CardContent className="px-2"> */}
          {/* {card.effect ? ( */}
          {/*   <CardDescription */}
          {/*     className={cn( */}
          {/*       "justify-evenly text-slate-800 leading-relaxed bg-stone-100/70 border border-double border-stone-400 p-1 overflow-hidden text-justify min-h-[140px]", */}
          {/*       textSize, */}
          {/*     )} */}
          {/*   > */}
          {/*     {card.effect} */}
          {/*   </CardDescription> */}
          {/* ) : ( */}
          {/*   <p className="text-muted-foreground italic">No effect text</p> */}
          {/* )} */}
          {/* </CardContent> */}

          <CardFooter className="justify-center p-0 m-0 gap-0">
            {card.cardType === "normal" ? (
              <p className={(cn("text-stone-900 italic font-bold"), textSize)}>
                ATK:{card.attack} / DEF:{card.defense}
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
        <HoverCardContent>{card.effect}</HoverCardContent>
      </HoverCardTrigger>
    </HoverCard>
  );
}
