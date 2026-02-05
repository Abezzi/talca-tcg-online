"use client";

import { useState } from "react";
import type { Card } from "@/types/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function CreateDeck() {
  const [searchTerm, setSearchTerm] = useState("");
  const [deckName, setDeckName] = useState("My Awesome Deck");
  const [deckCards, setDeckCards] = useState<Card[]>([]);
  const [deckCardCounts, setDeckCardCounts] = useState<Record<string, number>>(
    {},
  );
  // load users' cards
  const cards = useQuery(api.user.getUserCards, {});

  const filteredCards = cards?.filter((card) =>
    card?.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const addToDeck = (card: Card & { quantity: number }) => {
    // prevent weird cases
    if (!card?._id) return;
    // max amount of cards in the deck
    if (deckCards.length >= 60) return;

    const ownedQuantity = card.quantity ?? 0;
    const currentInDeck = deckCardCounts[card._id] ?? 0;

    if (currentInDeck >= 3) {
      toast.info("Already has 3");
      return;
    }

    if (currentInDeck >= ownedQuantity) {
      toast.error("Not enough cards", {
        description: `You only own: ${ownedQuantity} of ${card.name}`,
      });
      return;
    }

    // max duplicates limited to 3
    setDeckCards([...deckCards, card]);
    setDeckCardCounts({ ...deckCardCounts, [card._id]: currentInDeck + 1 });
  };

  return (
    <div className="min-h-screen text-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-4">
        <aside className="border-r border-stone-200 dark:border-stone-700 bg-background/80 lg:col-span-1">
          <div className="sticky top-0 z-10 border-b border-stone-900 bg-inherit p-4">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-stone-700 bg-background/30 pl-10 focus:border-stone-500 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-88px)]">
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-2">
              {filteredCards?.map((card) => (
                <Button
                  key={card?._id}
                  variant="ghost"
                  className="h-auto p-2 transition-all hover:bg-stone-800/50"
                  onClick={() => {
                    if (card) addToDeck(card);
                  }}
                >
                  {/* card content of each card in the side menu */}
                  <div className="relative aspect-3/4 w-full">
                    <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-stone-600 bg-gray-800 text-xs">
                      <div className="text-center">
                        <div className="font-bold">{card?.name}</div>
                        <div className="text-stone-400">
                          Type: {card?.cardType}
                        </div>
                        <div className="text-stone-400">
                          quantity: {card?.quantity}
                        </div>
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </aside>
        {/* main deck area */}
        <main className="p-6 lg:col-span-3 lg:p-12">
          <div className="mx-auto max-w-5xl">
            {/* Deck Name */}
            <div className="mb-8 flex flex-row gap-2">
              <Input
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                className="border-stone-700 bg-background/30 pl-10 focus:border-stone-500 text-stone-900 dark:text-stone-100"
                placeholder="Enter deck name..."
              />
              <p
                className={`align-bottom text-lg text-nowrap ${deckCards.length < 40 ? "text-stone-400" : ""}`}
              >
                {deckCards.length} / 60 cards
              </p>
            </div>

            <Separator className="mb-8 bg-stone-200 dark:bg-stone-700" />
          </div>

          {/* cards on the deck */}
          {deckCards.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <p className="mb-4 text-2xl">Your deck is empty</p>
              <p>Click cards on the left to add them to your deck</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Object.entries(deckCardCounts).map(([cardIdStr, count]) => {
                const cardId = cardIdStr;
                // Find the card object from allCards (or from deckCards — both work)
                const card =
                  cards?.find((c) => c?._id === cardId) ??
                  deckCards.find((c) => c._id === cardId);

                if (!card) return null;

                return (
                  <div
                    key={card._id}
                    className="group relative"
                    // Click removes ONE copy
                    onClick={() => {
                      if (card._id) {
                        const currentCount = deckCardCounts[card._id] ?? 0;
                        const newCount = currentCount - 1;

                        if (currentCount <= 0) return; // safety guard

                        // Find and remove one instance from the deckCards array
                        const index = deckCards.findIndex(
                          (c) => c._id === card._id,
                        );

                        if (index === -1) return;

                        setDeckCards(deckCards.filter((_, i) => i !== index));

                        // Update counts
                        setDeckCardCounts((prev) => {
                          if (newCount <= 0) {
                            const newCounts = { ...prev };
                            if (card._id) delete newCounts[card._id];
                            return newCounts;
                          }
                          return {
                            ...prev,
                            [String(card._id)]: newCount,
                          };
                        });
                      }
                    }}
                  >
                    <div className="aspect-3/4 cursor-pointer rounded-lg border-2 border-stone-700 bg-gray-900 transition-all hover:border-red-600">
                      <div className="flex h-full flex-col items-center justify-center p-2">
                        <div className="line-clamp-2 text-center text-sm font-semibold">
                          {card.name}
                        </div>
                        <div className="mt-1 text-xs text-stone-400">
                          type: {card.cardType}
                        </div>
                      </div>

                      {/* Count Badge - only show if > 1 */}
                      {count > 1 && (
                        <div className="absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-stone-800/90 text-sm font-bold text-white shadow-lg">
                          x{count}
                        </div>
                      )}

                      {/* Remove Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-red-900/70 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="font-bold text-white">Remove</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* save button */}
          <div className="mt-12 text-center">
            <Button size="lg" className="bg-stone-700 px-12 hover:bg-stone-600">
              Save Deck
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
