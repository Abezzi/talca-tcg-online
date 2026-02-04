"use client";

import Pack from "@/components/features/pack";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

export default function Shop() {
  const packs = useQuery(api.pack.getPacks, {});

  return (
    <>
      <main className="p-8 grid grid-cols-4 gap-8">
        {packs ? (
          packs.map((p, index) => (
            <Pack
              key={index}
              id={p._id}
              title={p.title}
              imageSrc={p.imageSrc}
              description={p.description}
            />
          ))
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No Packs Loaded</EmptyTitle>
              <EmptyDescription>
                This is probably a conection error, check discord if the game is
                broken or server is down
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </main>
    </>
  );
}
