"use client";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import { CardReveal } from "@/components/features/card-reveal";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CardOnBoard } from "@/components/features/card-on-board";

interface PhaseButtonProps {
  gameId: Id<"game_rooms">;
  phase: string;
  myTurn: boolean;
}

function PhaseButton({ gameId, phase, myTurn }: PhaseButtonProps) {
  const advancePhase = useMutation(api.game.advancePhase);

  return (
    <Button
      onClick={async () => {
        try {
          await advancePhase({ gameId });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          toast.error(error.message || "Cannot advance phase");
        }
      }}
      variant="outline"
      className="px-6 py-3 text-lg"
      disabled={!myTurn}
    >
      {phase === "end" ? "End Turn" : "Next Phase"}
    </Button>
  );
}

export default function GameRoom() {
  const activeGame = useQuery(api.game.getMyActiveGame);
  const user = useQuery(api.user.getUser, {});

  const isPlayer1 = activeGame?.player1Id === user?.id;
  const myState = isPlayer1
    ? activeGame?.player1State
    : activeGame?.player2State;
  const myTurn =
    activeGame?.currentTurn === (isPlayer1 ? "player1" : "player2");
  const opponentState = isPlayer1
    ? activeGame?.player2State
    : activeGame?.player1State;
  const [selectedHandCardId, setSelectedHandCardId] =
    useState<Id<"cards"> | null>(null);

  // de-select the card if the user press ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedHandCardId !== null) {
        setSelectedHandCardId(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [selectedHandCardId]);

  const normalSummonOrSet = useMutation(api.game.normalSummonOrSet);
  const allCardIds = useMemo(() => {
    const ids = new Set<Id<"cards">>();
    // my side
    myState?.hand?.forEach((cardId: Id<"cards">) => ids.add(cardId));
    myState?.zones?.monsters.forEach((zone) => zone && ids.add(zone.cardId));
    myState?.zones?.spellsAndTraps.forEach(
      (zone) => zone && ids.add(zone.cardId),
    );

    // opponent side
    opponentState?.zones.monsters?.forEach(
      (zone) => zone && ids.add(zone.cardId),
    );
    opponentState?.zones.spellsAndTraps?.forEach(
      (zone) => zone && ids.add(zone.cardId),
    );

    return Array.from(ids).sort();
  }, [myState, opponentState]);

  // Fetch full card data reactively
  const cardsMap = useQuery(api.cards.getCardsByIds, { ids: allCardIds }) ?? {}; // fallback to empty object while loading
  console.log("cardsmap", cardsMap);

  if (activeGame === undefined || user === undefined) {
    return <GameLoading />;
  }

  if (cardsMap === undefined) {
    return <GameLoading />;
  }

  if (allCardIds.length <= 0) {
    return <GameLoading />;
  }

  if (!activeGame || !user) {
    return <GameLoading />;
  }

  // helper to get full card or fallback
  const getCard = (cardId: Id<"cards">) => {
    if (!cardId) return null;
    return cardsMap[cardId] ?? null;
  };

  const handleSummonClick = async (zoneIndex: number) => {
    if (!myTurn) {
      toast.info("It's not your turn");
      return;
    }
    if (activeGame.phase !== "main1" && activeGame.phase !== "main2") {
      toast.info("You can only summon in Main Phase 1 or 2");
      return;
    }
    if (!selectedHandCardId) {
      toast.info("Select a card from your hand first");
      return;
    }

    try {
      const result = await normalSummonOrSet({
        gameId: activeGame._id,
        cardId: selectedHandCardId,
        action: "normalSummon", // TODO: add UI toggle for summon vs set
        // action: "set",
        targetMonsterIndex: zoneIndex,
        // tributeCardIds: []   // TODO: implement tribute selection UI
      });

      if (result.success) {
        toast.success(result.message);
        setSelectedHandCardId(null); // deselect after success
      } else {
        toast.error(result.reason);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || "Failed to summon");
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col bg-gradient-to-b from-stone-900 to-stone-800 text-white overflow-hidden">
      {/* opponent side (top) */}
      <div className="flex flex-col items-center pt-4 pb-8 bg-red-800/20 border-b border-red-600">
        <div className="flex items-center gap-4 mb-3">
          <Badge variant="outline" className="text-lg px-4 py-2">
            {isPlayer1 ? "Player 2" : "Player 1"}
          </Badge>
          <div className="flex items-center gap-2 text-red-400 text-2xl font-bold">
            <Heart className="h-6 w-6 fill-red-500" />
            {opponentState?.lifePoints ?? 8000}
          </div>
        </div>

        {/* opponent hand - card backs only */}
        <div className="mb-4 flex gap-3 opacity-70">
          {Array(opponentState?.hand?.length || 5)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="w-[90px] h-36 bg-gradient-to-br from-red-700 to-red-950 rounded-xl border border-slate-600 shadow-xl transform rotate-3 scale-x-[-1]"
              />
            ))}
        </div>

        {/* opponent spells and traps */}
        <div className="flex justify-center gap-4">
          {opponentState?.zones?.spellsAndTraps?.map((zone, idx) => {
            const card = zone?.cardId ? getCard(zone?.cardId) : null;
            return (
              <div
                key={idx}
                className={cn(
                  "w-32 h-44 rounded-xl border-2 border-red-700/40",
                  !zone && "bg-slate-900/40 border-dashed",
                )}
              >
                {card ? (
                  <CardReveal
                    card={card}
                    size="small"
                    index={card.id}
                    // flipped
                    // faceDown={zone?.faceDown}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-red-400/30 text-xs">
                    S/T {idx + 1}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* opponent field (monsters + spells/traps) */}
        <div className="flex justify-center gap-4 mb-3">
          {opponentState?.zones?.monsters?.map((zone, idx) => {
            const card = zone?.cardId ? getCard(zone?.cardId) : null;
            return (
              <div
                key={idx}
                className={cn(
                  "w-32 h-44 rounded-xl border-2 border-red-700/50",
                  !zone && "bg-slate-800/50 border-dashed",
                )}
              >
                {card ? (
                  <CardOnBoard card={card} size="small" index={card._id} />
                ) : (
                  <div className="h-full flex items-center justify-center text-red-400/40 text-sm">
                    Monster {idx + 1}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* center board - shared area */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <Badge
            variant={myTurn ? "default" : "secondary"}
            className="text-lg px-6 py-2"
          >
            {myTurn ? "Your Turn" : "Opponent's Turn"}
          </Badge>
        </div>

        {/* TODO: graveyards, banished zones, deck zones here later */}
        <div className="text-slate-400 text-sm">
          Turn {activeGame.turnNumber} - Phase: {activeGame.phase}
        </div>

        <div>
          <PhaseButton
            gameId={activeGame._id}
            phase={activeGame.phase}
            myTurn={myTurn}
          />
        </div>
      </div>

      {/* my side (bottom) */}
      <div className="flex flex-col items-center pb-10 pt-6 bg-blue-800/20 from-slate-950 to-transparent border-t border-blue-700">
        {/* my monsters field */}
        <div className="flex justify-center gap-5 mb-4">
          {myState?.zones?.monsters?.map((zone, idx) => {
            const card = zone?.cardId ? getCard(zone?.cardId) : null;
            const isClickable =
              myTurn &&
              (activeGame.phase === "main1" || activeGame.phase === "main2") &&
              selectedHandCardId !== null &&
              !zone;

            return (
              <div
                key={idx}
                onClick={() => isClickable && handleSummonClick(idx)}
                className={cn(
                  "w-32 h-44 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                  zone
                    ? "border-blue-500 shadow-lg shadow-blue-900/40"
                    : "border-dashed border-blue-600/50 hover:border-blue-400 hover:bg-blue-950/30",
                  isClickable &&
                    "ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-900",
                )}
              >
                {card ? (
                  <CardOnBoard card={card} size="small" index={idx} />
                ) : (
                  <div className="h-full flex items-center justify-center text-blue-300/50 text-sm font-medium">
                    Monster {idx + 1}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/*my spell-traps zone*/}
        <div className="flex justify-center gap-4 mb-8">
          {myState?.zones?.spellsAndTraps?.map((zone, idx) => {
            const card = zone?.cardId ? getCard(zone?.cardId) : null;
            return (
              <div
                key={idx}
                className={cn(
                  "w-32 h-44 rounded-xl border-2",
                  zone
                    ? "border-purple-600/70 shadow-purple-900/30"
                    : "border-dashed border-purple-700/40 bg-slate-950/40",
                )}
              >
                {card ? (
                  <CardReveal
                    card={card}
                    size="small"
                    index={idx}
                    // faceDown={zone?.faceDown}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-purple-300/40 text-xs">
                    S/T {idx + 1}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* my hand */}
      <div className="flex flex-wrap justify-center gap-4 px-6 bg-blue-800/20">
        {myState?.hand?.map((cardId: Id<"cards">, idx) => {
          const card = getCard(cardId);
          const isSelected = selectedHandCardId === cardId;

          if (cardsMap === undefined) {
            return <div key={idx}>no card map</div>;
          }

          if (!card) {
            return <div key={idx}>?</div>;
          }

          return (
            <div
              key={idx}
              onClick={() => card && setSelectedHandCardId(cardId)}
              className=""
            >
              <CardReveal
                key={idx}
                card={card}
                index={idx}
                size="normal"
                className={
                  isSelected
                    ? "brightness-110 scale-105 ring-2 ring-yellow-400 transition-all duration-200"
                    : ""
                }
              />
            </div>
          );
        })}
      </div>

      {/* my LP + name */}
      <div className="flex items-center gap-8 bg-blue-800/20">
        <div className="flex items-center gap-3 text-red-400 text-4xl font-bold">
          <Heart className="h-10 w-10 fill-red-500 stroke-red-600" />
          {myState?.lifePoints ?? 8000}
        </div>
        <Badge variant="outline" className="text-xl px-6 py-3">
          {isPlayer1 ? "Player 1" : "Player 2"} (You)
        </Badge>
        DEBUG: {selectedHandCardId}
      </div>
    </div>
  );
}

function GameLoading() {
  return (
    <div className="flex h-screen items-center justify-center text-white bg-slate-950">
      Loading game...
    </div>
  );
}
