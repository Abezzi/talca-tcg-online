"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CardReveal } from "./card-reveal";
import { Card } from "@/types/card";

type PackOpeningModalProps = {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  cards: Card[];
  packTitle?: string;
};

export function PackOpeningModal({
  open,
  onOpenChangeAction,
  cards,
  packTitle,
}: PackOpeningModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="min-w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">
              {packTitle ? `${packTitle} Results` : "Pack Opening"}
            </DialogTitle>
          </div>
          <p className="text-muted-foreground">
            You received {cards.length} card{cards.length !== 1 ? "s" : ""}!
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-6">
          {cards.map((card, idx) => (
            <CardReveal key={idx} card={card} index={idx} />
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChangeAction(false)}>
            Close
          </Button>
          {/* You can add "Add to Deck" or "Continue Opening" later */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
