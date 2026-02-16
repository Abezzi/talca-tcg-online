/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as cards from "../cards.js";
import type * as crons from "../crons.js";
import type * as deck from "../deck.js";
import type * as game from "../game.js";
import type * as http from "../http.js";
import type * as myFunctions from "../myFunctions.js";
import type * as pack from "../pack.js";
import type * as seed_cards from "../seed/cards.js";
import type * as seed_cardsInPacks from "../seed/cardsInPacks.js";
import type * as seed_packs from "../seed/packs.js";
import type * as user from "../user.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  cards: typeof cards;
  crons: typeof crons;
  deck: typeof deck;
  game: typeof game;
  http: typeof http;
  myFunctions: typeof myFunctions;
  pack: typeof pack;
  "seed/cards": typeof seed_cards;
  "seed/cardsInPacks": typeof seed_cardsInPacks;
  "seed/packs": typeof seed_packs;
  user: typeof user;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
