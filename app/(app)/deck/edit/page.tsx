"use client";

import { Card, CardHeader } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Edit, Eye, Trash } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export default function EditDeck() {
  const decks = useQuery(api.deck.getUserDecks, {});

  return (
    <>
      <main className="p-8 grid grid-cols-4 gap-8">
        {decks ? (
          decks.map((deck, index) => (
            <Card key={index}>
              <CardHeader className="align-middle justify-between flex flex-row">
                <p>{deck.name}</p>
                <div className="flex gap-2 px-2 flex-row align-middle">
                  <HoverCard>
                    <HoverCardTrigger
                      className="hover:scale-120"
                      href={`/deck/edit/${deck._id}`}
                    >
                      <Edit size="16" />
                    </HoverCardTrigger>
                    <HoverCardContent className="flex w-64 flex-col gap-0.5">
                      <div className="font-semibold">Edit</div>
                    </HoverCardContent>
                  </HoverCard>

                  <HoverCard>
                    <HoverCardTrigger className="hover:scale-120">
                      <Eye size="16" />
                    </HoverCardTrigger>
                    <HoverCardContent>
                      <div className="font-semibold">View</div>
                    </HoverCardContent>
                  </HoverCard>

                  <HoverCard>
                    <HoverCardTrigger className="hover:scale-120">
                      <Trash size="16" />
                    </HoverCardTrigger>
                    <HoverCardContent>
                      <div className="font-semibold">Delete</div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
              </CardHeader>
            </Card>
          ))
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No Decks Loaded</EmptyTitle>
              <EmptyDescription>
                Create a new deck if right now!
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </main>
    </>
  );
}
