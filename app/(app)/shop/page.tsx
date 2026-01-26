"use client";

import Pack from "@/components/features/pack";

export default function Shop() {
  return (
    <>
      <main className="p-8 grid grid-cols-4 gap-8">
        <Pack title="" imageSrc="https://placehold.co/500x500/png" />
        <Pack title="" imageSrc="https://placehold.co/500x500/png" />
        <Pack title="" imageSrc="https://placehold.co/500x500/png" />
        <Pack
          title=""
          imageSrc="https://placehold.co/500x500/png"
          newTag={true}
        />
        <Pack
          title=""
          imageSrc="https://placehold.co/500x500/png"
          newTag={true}
        />
        <Pack
          title=""
          imageSrc="https://placehold.co/500x500/png"
          newTag={true}
        />
      </main>
    </>
  );
}
