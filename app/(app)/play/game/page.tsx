"use client";

import { Spinner } from "@/components/ui/spinner";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function RankedQueue() {
  const router = useRouter();
  const queueEntry = useQuery(api.game.getMyQueueEntry);
  const activeGame = useQuery(api.game.getMyActiveGame);
  const cancelQueue = useMutation(api.game.cancelQueue);

  const [elapsed, setElapsed] = useState(0);

  const handleCancel = async () => {
    try {
      await cancelQueue({});
      toast.info("Successfully canceled the match");
      router.push("/play");
    } catch (err) {
      console.error("Cancel failed:", err);
      toast.error("match cancel");
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeGame?._id) {
      router.replace(`/play/game/${activeGame._id}`);
    } else if (queueEntry?.status === "matched") {
      toast.info("Game Starting...");
    }
  }, [queueEntry, activeGame, router]);

  useEffect(() => {
    if (queueEntry === null && activeGame === null) {
      router.replace("/play"); // or show error
    }
  }, [queueEntry, activeGame, router]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  if (queueEntry === undefined || activeGame === undefined) {
    return <div>Loading...</div>;
  }

  if (!queueEntry && !activeGame) {
    return (
      <div>
        Not in queue. <button onClick={() => router.push("/play")}>Back</button>
      </div>
    );
  }

  return (
    <>
      <div className="h-min flex-1 flex flex-col justify-center text-center text-balance p-6 align-middle items-center gap-2">
        <Spinner className="size-12" />
        <h1 className="text-3xl font-bold">Searching for opponent...</h1>
        {queueEntry?.status === "waiting" && (
          <>
            <p className="text-xl">Time in queue</p>
            <p className="text-5xl font-mono">
              {mm}:{ss}
            </p>
          </>
        )}

        {queueEntry?.status === "matched" && (
          <p className="text-2xl animate-pulse">
            Match found! Preparing game...
          </p>
        )}

        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </>
  );
}
