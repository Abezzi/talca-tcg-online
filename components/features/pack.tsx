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

type PackProps = {
  title: string;
  description?: string;
  newTag?: boolean;
  imageSrc: string;
};

export default function Pack({
  title,
  description,
  newTag,
  imageSrc,
}: PackProps) {
  return (
    <Card className="relative mx-auto w-full max-w-sm pt-0">
      <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
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
        <CardDescription>
          {description ?? "No descripton provided"}
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button className="w-full">
          1 Pack
          <Coins />
          <b>100</b>
        </Button>
      </CardFooter>
    </Card>
  );
}
