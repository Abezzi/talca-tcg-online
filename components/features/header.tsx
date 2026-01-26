"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ModeToggle } from "@/components/features/mode-toggle";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../ui/navigation-menu";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { Coins } from "lucide-react";

export default function Header() {
  const currency = useQuery(api.user.getUserCurrencies, {});

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md p-4 border-b border-slate-200 dark:border-slate-700 flex flex-row justify-between items-center shadow-sm">
        {/* logo + app name */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="Next.js Logo"
              width={32}
              height={32}
              className="dark:hidden"
            />
            <Image
              src="/logo-darkbg.svg"
              alt="Next.js Logo"
              width={32}
              height={32}
              className="hidden dark:block"
            />
          </div>
          <h1 className="font-semibold text-slate-800 dark:text-slate-200">
            Talca TCG
          </h1>
        </div>
        {/* center buttons */}
        <div>
          <NavigationMenu>
            <NavigationMenuList>
              {/* play */}
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className="{navigationMenuTriggerStyle()}"
                >
                  <Link href="/play">Play</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              {/* deck menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>Deck</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="w-96">
                    <ListItem href="/deck/create" title="Create a New Deck">
                      Build the new best deck and define the meta
                    </ListItem>
                    <ListItem href="/deck/edit" title="Edit">
                      Get what you were missing
                    </ListItem>
                    <ListItem href="/deck/import" title="Import a Deck">
                      Load a deck and make it your own
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              {/* shop */}
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className="{navigationMenuTriggerStyle()}"
                >
                  <Link href="/shop">Shop</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              {/* docs */}
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className="{navigationMenuTriggerStyle()}"
                >
                  <Link href="/docs">Docs</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        {/* right side, toggle mode, signout button */}
        <div className="flex items-center gap-3">
          <Coins />
          <p>
            <b>{currency ?? 0}</b>
          </p>
          <ModeToggle />
          <SignOutButton />
        </div>
      </header>
    </>
  );
}

function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  return (
    <>
      {isAuthenticated && (
        <button
          className="bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
          onClick={() =>
            void signOut().then(() => {
              router.push("/signin");
            })
          }
        >
          Sign out
        </button>
      )}
    </>
  );
}

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link href={href}>
          <div className="flex flex-col gap-1 text-sm">
            <div className="leading-none font-medium">{title}</div>
            <div className="text-muted-foreground line-clamp-2">{children}</div>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
