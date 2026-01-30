"use client";

import Pack from "@/components/features/pack";

export default function Shop() {
  return (
    <>
      <main className="p-8 grid grid-cols-4 gap-8">
        <Pack
          title="Standar Pack"
          imageSrc="https://placehold.co/600x400/0000FF/FFFFFF/png"
          description="Can get any card from the Talca TCG universe."
        />
        <Pack
          title="Culinary Excellence"
          imageSrc="https://placehold.co/600x400/FF0000/FFFFFF/png"
          description="Your favorite fast food its ready to fight."
        />
      </main>
    </>
  );
}
