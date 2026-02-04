import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Coins } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { PackOpeningModal } from "./pack-opening-modal";

type PackProps = {
  id: Id<"packs">;
  title: string;
  description?: string;
  newTag?: boolean;
  imageSrc: string;
};

export default function Pack({
  id,
  title,
  description,
  newTag,
  imageSrc,
}: PackProps) {
  const userBuysPack = useMutation(api.pack.userBuysPack);
  const [openedCards, setOpenedCards] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  async function buyPack() {
    try {
      const obtainedCards = await userBuysPack({ packId: id });
      console.log(obtainedCards);
      if (obtainedCards?.success) {
        setOpenedCards(obtainedCards.obtainedCards);
        setModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to buy pack, ", err);
    }
  }

  return (
    <>
      <Card className="relative mx-auto w-full max-w-sm pt-0">
        <div className="absolute inset-0 aspect-video bg-black/35" />
        <Image
          src={imageSrc}
          width={500}
          height={500}
          alt="Pack art cover"
          className="relative z-20 aspect-video w-full object-cover brightness-60 grayscale dark:brightness-40"
        />
        <CardHeader>
          <CardAction>
            {newTag ? <Badge variant="secondary">NEW</Badge> : <></>}
          </CardAction>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="line-clamp-2">
            {description ?? "No descripton provided"}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={buyPack} className="w-full">
            1 Pack
            <Coins />
            <b>100</b>
          </Button>
        </CardFooter>
      </Card>

      <PackOpeningModal
        open={modalOpen}
        onOpenChangeAction={setModalOpen}
        cards={openedCards}
        packTitle={title}
      />
    </>
  );
}
