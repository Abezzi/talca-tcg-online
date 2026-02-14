"use client";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";

type Deck = {
  _id: Id<"decks">;
  name: string;
  userId: string;
  _creationTime: number;
};

export default function Play() {
  const router = useRouter();
  const decks = useQuery(api.deck.getUserDecks, {}) ?? [];
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);

  function MatchmakingButton() {
    const queueForMatch = useMutation(api.game.queueForMatch);

    const handleFindMatch = async () => {
      if (!selectedDeck) {
        console.error("select a deck!");
        return;
      }

      try {
        await queueForMatch({ deckId: selectedDeck._id, mode: "ranked" });
        router.push("/play/game");
      } catch (error) {
        console.error("failed to queue, error msg: ", error);
      }
    };

    return <Button onClick={handleFindMatch}>RANKED</Button>;
  }

  return (
    <main className="p-6 mx-auto max-w-5xl">
      <div>
        <p>DEBUG: Selected deck: {selectedDeck?.name ?? "None"}</p>
        <Combobox
          items={decks}
          value={selectedDeck}
          onValueChange={(value: Deck | null | undefined) =>
            setSelectedDeck(value ?? null)
          }
          itemToStringLabel={(deck: Deck) => deck.name}
        >
          <ComboboxTrigger
            render={
              <Button
                variant="outline"
                className="w-64 justify-between font-normal"
              >
                <ComboboxValue />
              </Button>
            }
          />
          <ComboboxContent>
            <ComboboxInput showTrigger={false} placeholder="Select a Deck" />
            <ComboboxEmpty>Decks not found.</ComboboxEmpty>
            <ComboboxList>
              {decks.map((deck) => (
                <ComboboxItem key={deck._id} value={deck}>
                  {deck.name}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
      <div>
        <p>my elo: 0</p>
      </div>
      <div className="flex flex-col items-center gap-2 m-2">
        {/* <Button onClick={() => router.push("/play/ranked")}>RANKED</Button> */}
        <MatchmakingButton />
        <Button>UNRANKED</Button>
        <Button>LOBBIES</Button>
        <Button>QUEUE RANKED</Button>
      </div>
    </main>
  );
}
