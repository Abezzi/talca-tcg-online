"use client";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import { CardReveal } from "@/components/features/card-reveal";
import { Id } from "@/convex/_generated/dataModel";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

  const allCardIds = useMemo(() => {
    const ids = new Set<Id<"cards">>();

    // Your side
    myState?.hand?.forEach((cardId: Id<"cards">) => ids.add(cardId));
    myState?.field?.forEach((cardId: Id<"cards">) => ids.add(cardId));
    myState?.field?.forEach((cardId: Id<"cards">) => ids.add(cardId));

    // Opponent side
    opponentState?.field?.forEach((cardId: Id<"cards">) => ids.add(cardId));
    opponentState?.field?.forEach((cardId: Id<"cards">) => ids.add(cardId));

    return Array.from(ids);
  }, [myState, opponentState]);

  // Fetch full card data reactively
  const cardsMap = useQuery(api.cards.getCardsByIds, { ids: allCardIds }) ?? {}; // fallback to empty object while loading

  if (!activeGame || !user) {
    return <GameLoading />;
  }

  // helper to get full card or fallback
  const getCard = (cardId: Id<"cards"> | undefined) => {
    return cardId ? cardsMap[cardId] : null;
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

        {/* opponent field (monsters + spells/traps) */}
        <div className="flex flex-wrap justify-center gap-4 max-w-6xl px-4">
          {opponentState?.field?.map((inst, idx) => {
            const card = getCard(inst);
            return card ? (
              <div
                key={inst.cardId || idx}
                className="scale-x-[-1] origin-center"
              >
                <CardReveal card={card} index={idx} size="normal" />
              </div>
            ) : (
              <div
                key={idx}
                className="w-[240px] h-[336px] bg-slate-800 rounded-xl animate-pulse"
              />
            );
          })}

          {/* backrow */}
          {/* {opponentState?.field?.map((inst, idx) => { */}
          {/*   const card = getCard(inst); */}
          {/*   return card ? ( */}
          {/*     <div key={inst.cardId || idx} className="scale-x-[-1]"> */}
          {/*       <CardReveal key={idx} card={card} index={idx} size="small" /> */}
          {/*     </div> */}
          {/*   ) : null; */}
          {/* })} */}
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

        {/* You can add graveyards, banished zones, deck zones here later */}
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

      {/* your side (bottom) */}
      <div className="flex flex-col items-center pb-10 pt-6 bg-blue-800/20 from-slate-950 to-transparent border-t border-blue-700">
        {/* your field */}
        <div className="flex flex-wrap justify-center gap-4 max-w-6xl px-4 mb-8">
          {myState?.field?.map((inst, idx) => {
            const card = getCard(inst);
            return card ? (
              <CardReveal key={idx} card={card} index={idx} size="small" />
            ) : (
              <div
                key={idx}
                className="w-[240px] h-[336px] bg-slate-800 rounded-xl animate-pulse"
              />
            );
          })}

          {/* backrow */}
          {/* {myState?.field?.map((inst, idx) => { */}
          {/*   const card = getCard(inst); */}
          {/*   return card ? ( */}
          {/*     <CardReveal */}
          {/*       key={inst.cardId || idx} */}
          {/*       card={card} */}
          {/*       index={idx} */}
          {/*       size="small" */}
          {/*     /> */}
          {/*   ) : null; */}
          {/* })} */}
        </div>

        {/* your hand */}
        <div className="flex flex-wrap justify-center gap-4 px-6">
          {myState?.hand?.map((cardId: Id<"cards">, idx) => {
            const card = getCard(cardId);
            return card ? (
              <CardReveal key={idx} card={card} index={idx} size="normal" />
            ) : (
              <div
                key={idx}
                className="w-[240px] h-[336px] bg-slate-800 rounded-xl animate-pulse"
              />
            );
          })}
        </div>

        {/* Your LP + name */}
        <div className="mt-8 flex items-center gap-8">
          <div className="flex items-center gap-3 text-red-400 text-4xl font-bold">
            <Heart className="h-10 w-10 fill-red-500 stroke-red-600" />
            {myState?.lifePoints ?? 8000}
          </div>
          <Badge variant="outline" className="text-xl px-6 py-3">
            {isPlayer1 ? "Player 1" : "Player 2"} (You)
          </Badge>
        </div>
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
