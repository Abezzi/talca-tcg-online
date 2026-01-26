"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

export default function Shop() {
  return (
    <>
      <main className="p-8 flex flex-col gap-8">
        <Content />
      </main>
    </>
  );
}

function Content() {
  const { viewer, name } = useQuery(api.user.getUser, {}) ?? {};

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto">
      <div>
        <h2 className="font-bold text-xl text-slate-800 dark:text-slate-200">
          Welcome {viewer ?? "Anonymous"}!, with name: {name ?? "guest"}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          You are signed into a demo application using Convex Auth.
        </p>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          This app can generate random numbers and store them in your Convex
          database.
        </p>
      </div>

      <div className="h-px bg-slate-200 dark:bg-slate-700"></div>
    </div>
  );
}
