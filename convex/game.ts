import { mutation, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

type DrawCardReturn =
  | { result: "success"; newHandSize: number; newDeckSize: number }
  | { result: "deckOut"; winnerId: Id<"users"> };

function emptyPlayerState() {
  return {
    lifePoints: 8000,
    hand: [] as Id<"cards">[],
    field: [] as Id<"cards">[],
    deck: [] as Id<"cards">[],
    deckSize: 40, // TODO: query actual deck size later
    graveyard: [] as Id<"cards">[],
    banished: [] as Id<"cards">[],
    extraDeck: [] as Id<"cards">[],
  };
}

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function drawCards(
  deckCardIds: Id<"cards">[],
  count: number,
): {
  drawn: Id<"cards">[];
  remaining: Id<"cards">[];
} {
  if (deckCardIds.length < count) {
    throw new Error(`Not enough cards in deck to draw ${count}`);
  }
  const shuffled = shuffle(deckCardIds);
  return {
    drawn: shuffled.slice(0, count),
    remaining: shuffled.slice(count),
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

    // fetch full decks
    const player1DeckEntries = await ctx.db
      .query("deck_card_entries")
      .withIndex("by_deck", (q) => q.eq("deckId", player1Queue.deckId))
      .collect();

    const player2DeckEntries = await ctx.db
      .query("deck_card_entries")
      .withIndex("by_deck", (q) => q.eq("deckId", player2Queue.deckId))
      .collect();

    // Expand to flat list of card IDs (respecting quantity)
    const player1DeckCards: Id<"cards">[] = [];
    for (const entry of player1DeckEntries) {
      for (let i = 0; i < entry.quantity; i++) {
        player1DeckCards.push(entry.cardId);
      }
    }

    const player2DeckCards: Id<"cards">[] = [];
    for (const entry of player2DeckEntries) {
      for (let i = 0; i < entry.quantity; i++) {
        player2DeckCards.push(entry.cardId);
      }
    }

    // shuffle and draw 5 cards eachs
    const p1Draw = drawCards(player1DeckCards, 5);
    const p2Draw = drawCards(player2DeckCards, 5);

    // create initial player states
    const player1InitialState = {
      ...emptyPlayerState(),
      hand: p1Draw.drawn,
      deck: p1Draw.remaining,
      deckSize: p1Draw.remaining.length,
    };

    const player2InitialState = {
      ...emptyPlayerState(),
      hand: p2Draw.drawn,
      deck: p2Draw.remaining,
      deckSize: p2Draw.remaining.length,
    };

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

      player1State: player1InitialState,
      player2State: player2InitialState,

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

async function performDraw(
  game: Doc<"game_rooms">,
  isPlayer1: boolean,
): Promise<{
  success: boolean;
  drawnCardId?: Id<"cards">;
  newDeckSize: number;
  deckOut?: boolean;
  winnerId?: Id<"users">;
  newHand?: Id<"cards">[];
  newDeck?: Id<"cards">[];
}> {
  const playerStateKey = isPlayer1 ? "player1State" : "player2State";
  const playerState = game[playerStateKey];

  if (playerState.deckSize <= 0) {
    const winnerId = isPlayer1 ? game.player2Id : game.player1Id;
    return { success: false, deckOut: true, winnerId, newDeckSize: 0 };
  }

  const drawnCardId = playerState.deck[0];
  const newHand = [...playerState.hand, drawnCardId];
  const newDeck = playerState.deck.slice(1);
  const newDeckSize = newDeck.length;

  return {
    success: true,
    drawnCardId,
    newDeckSize,
    newHand,
    newDeck,
  };
}

/**
 * draws 1 card from the current player's deck to their hand.
 * - validates: active game, player's turn, draw phase, deck not empty
 * - updates hand, deck, deckSize atomically
 * - logs the draw (without revealing card ID to opponent)
 * - if deck empty -> deck out, game ends
 */
export const drawCard = mutation({
  args: { gameId: v.id("game_rooms") },
  handler: async (ctx, { gameId }): Promise<DrawCardReturn> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    // get game
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.status !== "active") throw new Error("Game not active");

    // determine which player is caller
    const isPlayer1 = game.player1Id === userId;
    const isPlayer2 = game.player2Id === userId;
    if (!isPlayer1 && !isPlayer2) throw new Error("Not a player in this game");

    const currentPlayer = isPlayer1 ? "player1" : "player2";
    if (game.currentTurn !== currentPlayer) throw new Error("Not your turn");
    if (game.phase !== "draw") throw new Error("Not draw phase");

    const drawResult = await performDraw(game, isPlayer1);

    // in case the player run out of cards loses, (deck out for harambe)
    if (drawResult.deckOut) {
      await ctx.db.patch(gameId, {
        status: "finished",
        winnerId: drawResult.winnerId,
        finishedAt: Date.now(),
        [`player${isPlayer1 ? 2 : 1}State`]: {
          ...(isPlayer1 ? game.player2State : game.player1State),
          lifePoints: 0,
        },
      });
      if (drawResult.winnerId)
        return { result: "deckOut", winnerId: drawResult.winnerId };
    }

    const playerStateKey = isPlayer1 ? "player1State" : "player2State";

    await ctx.db.patch(gameId, {
      [playerStateKey]: {
        ...(isPlayer1 ? game.player1State : game.player2State),
        hand: drawResult.newHand!,
        deck: drawResult.newDeck!,
        deckSize: drawResult.newDeckSize,
      },
      actionsLog: [
        ...(game.actionsLog ?? []),
        {
          timestamp: Date.now(),
          turnNumber: game.turnNumber,
          player: currentPlayer,
          actionType: "draw",
          description: "Drew 1 card",
        },
      ],
    });

    return {
      result: "success",
      newHandSize: drawResult.newHand!.length,
      newDeckSize: drawResult.newDeckSize,
    };
  },
});

/**
 * ends the current player's turn and switches to the opponent.
 * - validates: active game, player's turn, end phase
 * - advances turnNumber, switches currentTurn, resets phase to "draw"
 * - resets per-turn flags (attackedThisTurn, summonedThisTurn, etc.)
 * - logs the end turn action
 */
export const endTurn = mutation({
  args: { gameId: v.id("game_rooms") },
  handler: async (ctx, { gameId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    // Get game
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");

    if (game.status !== "active") throw new Error("Game not active");

    // determine which player is caller
    const isPlayer1 = game.player1Id === userId;
    const isPlayer2 = game.player2Id === userId;
    if (!isPlayer1 && !isPlayer2) throw new Error("Not a player in this game");

    const currentPlayer = isPlayer1 ? "player1" : "player2";
    if (game.currentTurn !== currentPlayer) throw new Error("Not your turn");

    if (game.phase !== "end")
      throw new Error("Must end phase first or be in end phase");

    // switch turn
    const nextPlayer = currentPlayer === "player1" ? "player2" : "player1";
    const nextPlayerKey =
      nextPlayer === "player1" ? "player1State" : "player2State";
    // update opponent state: reset per-turn flags
    const nextPlayerState =
      nextPlayer === "player1" ? game.player1State : game.player2State;

    // patch game
    await ctx.db.patch(gameId, {
      currentTurn: nextPlayer,
      turnNumber: game.turnNumber ? game.turnNumber + 1 : 0,
      phase: "draw", // new turn starts in draw phase
      [`player${isPlayer1 ? 2 : 1}State`]: nextPlayerState, // reset next player's flags
      actionsLog: [
        ...(game.actionsLog ?? []),
        {
          timestamp: Date.now(),
          turnNumber: game.turnNumber,
          player: currentPlayer,
          actionType: "endTurn",
          description: "Ended turn",
        },
      ],
    });

    return {
      result: "success",
      nextTurn: nextPlayer,
      newTurnNumber: game.turnNumber ? game.turnNumber + 1 : 1,
    };
  },
});

/**
 * advances to the next phase, in this order
 * draw, standby, main1, battle, main2, end
 * - logs the action
 */
export const advancePhase = mutation({
  args: {
    gameId: v.id("game_rooms"),
  },
  handler: async (ctx, { gameId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthenticated");
    }

    // fetch current game state
    const game = await ctx.db.get(gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status !== "active") {
      throw new Error("Game is not active");
    }

    // check if caller is one of the players
    const isPlayer1 = game.player1Id === userId;
    const isPlayer2 = game.player2Id === userId;
    if (!isPlayer1 && !isPlayer2) {
      throw new Error("You are not a player in this game");
    }

    const currentPlayer = isPlayer1 ? "player1" : "player2";

    // must be the current player's turn
    if (game.currentTurn !== currentPlayer) {
      throw new Error("It is not your turn");
    }

    // phase order
    const phaseOrder = [
      "draw",
      "standby",
      "main1",
      "battle",
      "main2",
      "end",
    ] as const;
    const currentPhaseIndex = phaseOrder.indexOf(game.phase);
    if (currentPhaseIndex === -1) {
      throw new Error(`Invalid current phase: ${game.phase}`);
    }
    if (currentPhaseIndex >= phaseOrder.length - 1) {
      throw new Error("Already in the final phase (end). Use endTurn instead.");
    }
    const nextPhase = phaseOrder[currentPhaseIndex + 1];

    // TODO: phase specific effects should be here

    // in draw phase, player draws a card
    let drewCard = false;
    if (nextPhase === "standby") {
      // skip draw only on very first turn of player 1
      const isFirstTurnOfGame =
        game.turnNumber === 1 && game.currentTurn === "player1";

      if (!isFirstTurnOfGame) {
        console.log("should draw here");
        const drawResult = (await ctx.runMutation(api.game.drawCard, {
          gameId,
        })) as DrawCardReturn;
        // if deckout the game ended, for that reason return the result
        if (drawResult.result === "deckOut") {
          return drawResult;
        }
        if (drawResult.result === "success") {
          drewCard = true;
        }
      }
    }

    // update the game (advance phase)
    await ctx.db.patch(gameId, {
      phase: nextPhase,
      actionsLog: [
        ...(game.actionsLog ?? []),
        {
          timestamp: Date.now(),
          turnNumber: game.turnNumber,
          player: currentPlayer,
          actionType: "advancePhase",
          description: drewCard
            ? `Advanced to ${nextPhase} phase and drew a card`
            : `Advanced to ${nextPhase} phase`,
        },
      ],
    });

    return {
      success: true,
      previousPhase: game.phase,
      newPhase: nextPhase,
      drewCard,
      turnNumber: game.turnNumber,
    };
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

const MAX_WAITING_AGE_MS = 30 * 60 * 1000;
const MAX_MATCHED_AGE_MS = 10 * 60 * 1000;

export const cleanupOldQueueEntries = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("[cron] starting queue cleanup...");

    const now = Date.now();
    let cleanedCount = 0;

    // clean old waiting entries
    const oldWaiting = await ctx.db
      .query("matchmaking_queue")
      .withIndex("by_status_joined", (q) => q.eq("status", "waiting"))
      .order("asc")
      .collect();

    for (const entry of oldWaiting) {
      const ageMs = now - entry.joinedAt;
      if (ageMs > MAX_WAITING_AGE_MS) {
        await ctx.db.delete(entry._id);
        cleanedCount++;
        console.log(
          `[cleanup] Deleted old WAITING entry for user ${entry.userId} ` +
          `(age: ${Math.round(ageMs / 60000)} min)`,
        );
      }
    }

    // clean old matched entries
    const potentiallyOldMatched = await ctx.db
      .query("matchmaking_queue")
      .filter((q) => q.eq(q.field("status"), "matched"))
      .collect();

    for (const entry of potentiallyOldMatched) {
      const ageMs = now - entry.joinedAt;

      if (ageMs > MAX_MATCHED_AGE_MS) {
        // double check the game still doesn't exist (prevents deleting matched entry if game creation lagged)
        const relatedGame = await ctx.db
          .query("game_rooms")
          .filter((q) =>
            q.or(
              q.eq(q.field("player1Id"), entry.userId),
              q.eq(q.field("player2Id"), entry.userId),
            ),
          )
          .filter((q) => q.eq(q.field("status"), "active"))
          .first();

        if (!relatedGame) {
          await ctx.db.delete(entry._id);
          cleanedCount++;
          console.log(
            `[cron] deleted stale matched entry for user ${entry.userId} ` +
            `(age: ${Math.round(ageMs / 60000)} min, no active game found)`,
          );
        } else {
          console.log(
            `[cron] skipped matched entry for user ${entry.userId} ` +
            `(game still exists: ${relatedGame._id})`,
          );
        }
      }
    }

    console.log(
      `[cron] cleanup finished, removed ${cleanedCount} entries total.`,
    );
    return { cleanedCount };
  },
});
