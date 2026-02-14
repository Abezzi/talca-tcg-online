import { mutation, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

function emptyPlayerState() {
  return {
    lifePoints: 8000,
    hand: [],
    field: [],
    deckSize: 40, // TODO: query actual deck size later
    graveyard: [],
    banished: [],
    extraDeck: [],
  };
}

// player queues for a match, called from frontend when clicking "play game"
export const queueForMatch = mutation({
  args: {
    deckId: v.id("decks"),
    mode: v.union(v.literal("ranked"), v.literal("unranked")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }
    const userId = await getAuthUserId(ctx);

    if (!userId) throw new Error("Not authenticated");

    // prevent queuing multiple times or while in game
    const existingQueue = await ctx.db
      .query("matchmaking_queue")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "waiting"),
          q.eq(q.field("status"), "matched"),
        ),
      )
      .first();

    if (existingQueue) {
      throw new Error("Already in queue or matched");
    }

    const [gameAsP1, gameAsP2] = await Promise.all([
      ctx.db
        .query("game_rooms")
        .withIndex("by_player1_status", (q) =>
          q.eq("player1Id", userId).eq("status", "active"),
        )
        .first(),
      ctx.db
        .query("game_rooms")
        .withIndex("by_player2_status", (q) =>
          q.eq("player2Id", userId).eq("status", "active"),
        )
        .first(),
    ]);

    const activeGame = gameAsP1 ?? gameAsP2;

    if (activeGame) {
      if (gameAsP1 && gameAsP2) {
        // this should never happen
        console.error(
          `User ${userId} is in TWO active games: ${gameAsP1._id} and ${gameAsP2._id}`,
        );
        throw new Error("data inconsistency: user in multiple active games");
      }
      throw new Error("already in an active game");
    }

    // insert into queue
    const queueId = await ctx.db.insert("matchmaking_queue", {
      userId,
      deckId: args.deckId,
      status: "waiting",
      mode: args.mode,
      joinedAt: Date.now(),
    });

    return queueId;
  },
});

// matchmaking logic - creates game when 2 players are ready
export const createGameFromQueue = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("[cron] Running matchmaking tryMatch...");

    // find the two oldest waiting players
    const waiting = await ctx.db
      .query("matchmaking_queue")
      .withIndex("by_status_joined", (q) => q.eq("status", "waiting"))
      .order("asc")
      .take(2);

    console.log("[cron] Found waiting players:", waiting.length);

    // if not enough players yet
    if (waiting.length < 2) {
      return null;
    }

    const [player1Queue, player2Queue] = waiting;

    // create the game room
    const gameId = await ctx.db.insert("game_rooms", {
      player1Id: player1Queue.userId,
      player2Id: player2Queue.userId,
      player1Deck: player1Queue.deckId,
      player2Deck: player2Queue.deckId,

      status: "active",
      winnerId: undefined,
      startedAt: Date.now(),

      currentTurn: "player1",
      turnNumber: 1,
      phase: "draw",

      player1State: emptyPlayerState(),
      player2State: emptyPlayerState(),

      actionsLog: [
        {
          timestamp: Date.now(),
          turnNumber: 0,
          player: "player1",
          actionType: "gameStart",
          description: "Game created - Player 1 vs Player 2",
        },
      ],
    });

    // mark queue entries as matched
    await ctx.db.patch(player1Queue._id, { status: "matched" });
    await ctx.db.patch(player2Queue._id, { status: "matched" });

    // TODO:
    // - shuffle decks server-side & draw starting hands
    // - decide who goes first randomly or based on rules
    // - log "coin flip" or initial draw in actionLog

    return gameId;
  },
});

export const getMyQueueEntry = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("matchmaking_queue")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "waiting"),
          q.eq(q.field("status"), "matched"),
        ),
      )
      .first();
  },
});

export const getMyActiveGame = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const asP1 = await ctx.db
      .query("game_rooms")
      .withIndex("by_player1_status", (q) =>
        q.eq("player1Id", userId).eq("status", "active"),
      )
      .first();

    if (asP1) return asP1;

    return ctx.db
      .query("game_rooms")
      .withIndex("by_player2_status", (q) =>
        q.eq("player2Id", userId).eq("status", "active"),
      )
      .first();
  },
});

export const cancelQueue = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthenticated");
    }

    // Find the user's current queue entry (waiting or matched)
    const queueEntry = await ctx.db
      .query("matchmaking_queue")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "waiting"),
          q.eq(q.field("status"), "matched"),
        ),
      )
      .first();

    // if nothing to cancel
    if (!queueEntry) {
      return false;
    }

    // prevents canceling very old entries if cleanup cron runs late
    const ageMs = Date.now() - queueEntry.joinedAt;
    // > 30 minutes
    if (ageMs > 30 * 60 * 1000) {
      // TODO: mark as expired instead, cancel for now
    }

    // delete the queue
    await ctx.db.delete(queueEntry._id);

    // alternative
    // await ctx.db.patch(queueEntry._id, {
    //   status: "canceled",
    //   // canceledAt: Date.now(),
    // });

    return true;
  },
});
