import {
  mutation,
  internalMutation,
  query,
  MutationCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

type DrawCardReturn =
  | { result: "success"; newHandSize: number; newDeckSize: number }
  | { result: "deckOut"; winnerId: Id<"users"> };

type SummonResult =
  | { success: true; message: string }
  | { success: false; reason: string };

const initialZones = {
  monsters: Array(5).fill(null),
  spellsAndTraps: Array(5).fill(null),
  fieldSpell: null,
};

function emptyPlayerState() {
  return {
    lifePoints: 8000,
    hand: [] as Id<"cards">[],
    zones: initialZones,
    hasNormalSummonedThisTurn: false,
    deck: [] as Id<"cards">[],
    deckSize: 40, // TODO: query actual deck size later
    graveyard: [] as Id<"cards">[],
    banished: [] as Id<"cards">[],
    extraDeck: [] as Id<"cards">[],
  };
}

async function processPhaseEntry(
  ctx: MutationCtx,
  game: Doc<"game_rooms">,
  currentPlayer: "player1" | "player2",
) {
  if (game.phase !== "draw") return;

  const isPlayer1 = currentPlayer === "player1";
  const isFirstTurnOfGame = game.turnNumber === 1 && isPlayer1;

  if (isFirstTurnOfGame) {
    return;
  }

  // draw 1 card for the player who just entered draw phase
  await ctx.runMutation(api.game.drawCard, {
    gameId: game._id,
    playerDrawing: currentPlayer,
  });
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
      hasNormalSummonedThisTurn: false,
      deck: p1Draw.remaining,
      deckSize: p1Draw.remaining.length,
    };

    const player2InitialState = {
      ...emptyPlayerState(),
      hand: p2Draw.drawn,
      hasNormalSummonedThisTurn: false,
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
  args: {
    gameId: v.id("game_rooms"),
    playerDrawing: v.union(v.literal("player1"), v.literal("player2")),
  },
  handler: async (ctx, { gameId, playerDrawing }): Promise<DrawCardReturn> => {
    console.log("drawCard called for:", playerDrawing);
    // get game
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.status !== "active") throw new Error("Game not active");

    const isPlayer1: boolean = playerDrawing === "player1";
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
      return { result: "deckOut", winnerId: drawResult.winnerId! };
    }

    const playerStateKey =
      playerDrawing === "player1" ? "player1State" : "player2State";

    await ctx.db.patch(gameId, {
      [playerStateKey]: {
        ...(playerDrawing === "player1"
          ? game.player1State
          : game.player2State),
        hand: drawResult.newHand!,
        deck: drawResult.newDeck!,
        deckSize: drawResult.newDeckSize,
      },
      actionsLog: [
        ...(game.actionsLog ?? []),
        {
          timestamp: Date.now(),
          turnNumber: game.turnNumber,
          player: playerDrawing,
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
 * advances to the next phase, in this order
 * draw, standby, main1, battle, main2, end
 * - logs the action
 */
export const advancePhase = mutation({
  args: {
    gameId: v.id("game_rooms"),
  },
  handler: async (ctx, { gameId }) => {
    // check if user is authenticated
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthenticated");
    }

    // fetch current game state
    let game = await ctx.db.get(gameId);
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

    // phase order and validations
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

    // in end phase
    if (currentPhaseIndex === phaseOrder.length - 1) {
      const nextPlayer = currentPlayer === "player1" ? "player2" : "player1";
      const nextPlayerStateKey =
        nextPlayer === "player1" ? "player1State" : "player2State";

      await ctx.db.patch(gameId, {
        currentTurn: nextPlayer,
        turnNumber: (game.turnNumber ?? 0) + 1,
        phase: "draw",
        [nextPlayerStateKey]: {
          ...(nextPlayer === "player1" ? game.player1State : game.player2State),
          // reset normal summon for next player
          hasNormalSummonedThisTurn: false,
        },
        actionsLog: [
          ...(game.actionsLog ?? []),
          {
            timestamp: Date.now(),
            turnNumber: game.turnNumber ?? 0,
            player: currentPlayer,
            actionType: "endTurn",
            description: "Ended turn",
          },
        ],
      });

      game = (await ctx.db.get(gameId))!;
      await processPhaseEntry(ctx, game, nextPlayer);

      return {
        success: true,
        action: "turnEnded",
        nextTurn: nextPlayer,
        newTurnNumber: (game.turnNumber ?? 0) + 1,
        newPhase: "draw",
      };
    }

    // phase advance
    const nextPhase = phaseOrder[currentPhaseIndex + 1];

    await ctx.db.patch(gameId, {
      phase: nextPhase,
      actionsLog: [
        ...(game.actionsLog ?? []),
        {
          timestamp: Date.now(),
          turnNumber: game.turnNumber,
          player: currentPlayer,
          actionType: "advancePhase",
          description: `Advanced to ${nextPhase} phase`,
        },
      ],
    });

    game = (await ctx.db.get(gameId))!;

    await processPhaseEntry(ctx, game, currentPlayer);

    return {
      success: true,
      action: "phaseAdvanced",
      previousPhase: game.phase,
      newPhase: nextPhase,
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

export const normalSummonOrSet = mutation({
  args: {
    gameId: v.id("game_rooms"),
    cardId: v.id("cards"),
    action: v.union(
      v.literal("normalSummon"), // face-up attack
      v.literal("set"), // face-down defense
    ),
    tributeCardIds: v.optional(v.array(v.id("cards"))),
    targetMonsterIndex: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<SummonResult> => {
    const {
      gameId,
      cardId,
      action,
      tributeCardIds = [],
      targetMonsterIndex,
    } = args;

    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.status !== "active")
      return { success: false, reason: "Game is not active" };

    const isPlayer1 = game.player1Id === userId;
    const isPlayer2 = game.player2Id === userId;
    if (!isPlayer1 && !isPlayer2)
      return { success: false, reason: "Not a player in this game" };

    const playerKey = isPlayer1 ? "player1" : "player2";
    const opponentKey = isPlayer1 ? "player2" : "player1";
    const stateKey = `${playerKey}State` as "player1State" | "player2State";
    const state = game[stateKey];

    // turn check
    if (game.currentTurn !== playerKey) {
      return { success: false, reason: "Not your turn" };
    }
    if (game.phase !== "main1" && game.phase !== "main2") {
      return { success: false, reason: "Can only summon in Main Phase 1 or 2" };
    }

    // card in hand
    if (!state.hand.includes(cardId)) {
      return { success: false, reason: "Card not in hand" };
    }

    // fetch card data
    const card = await ctx.db.get(cardId);
    if (!card) return { success: false, reason: "Card not found" };
    if (card.cardType !== "normal") {
      // assuming "normal" = monster
      return { success: false, reason: "Can only normal summon/set monsters" };
    }

    const level = card.level ?? 0;

    // tribute requirements
    let requiredTributes = 0;
    if (level >= 7) requiredTributes = 2;
    else if (level >= 5) requiredTributes = 1;

    if (requiredTributes > 0) {
      if (tributeCardIds.length !== requiredTributes) {
        return {
          success: false,
          reason: `Level ${level} requires exactly ${requiredTributes} tribute(s)`,
        };
      }
    } else if (tributeCardIds.length > 0) {
      return { success: false, reason: "No tributes needed for this monster" };
    }

    // check already used normal summon this turn
    if (state.hasNormalSummonedThisTurn) {
      return {
        success: false,
        reason: "Already Normal Summoned or Set this turn",
      };
    }

    // find available zone
    const monsters = state.zones.monsters;
    if (monsters.length !== 5) {
      // safety, should never happen
      return { success: false, reason: "Invalid monster zones state" };
    }

    const zoneIndex =
      targetMonsterIndex ?? monsters.findIndex((z) => z === null);
    if (zoneIndex === -1 || zoneIndex < 0 || zoneIndex > 4) {
      return { success: false, reason: "No available monster zone" };
    }

    // validates tributes
    const tributedCardIds: Id<"cards">[] = [];
    for (const tributeId of tributeCardIds) {
      const tributeZone = monsters.find((z) => z?.cardId === tributeId);
      if (!tributeZone) {
        return { success: false, reason: "Tribute monster not on field" };
      }
      tributedCardIds.push(tributeId);
    }

    // new monster entry
    const newMonster = {
      cardId,
      position:
        action === "normalSummon"
          ? ("attack" as const)
          : ("face-down-defense" as const),
    };

    // update hand/zone logic
    const newHand = state.hand.filter((id) => id !== cardId);
    const newMonsters = [...monsters];
    newMonsters[zoneIndex] = newMonster;

    const newGraveyard = [...state.graveyard];
    const newZones = { ...state.zones, monsters: newMonsters };

    // tributed monsters sent to gy
    let updatedState = {
      ...state,
      hand: newHand,
      zones: newZones,
      graveyard: newGraveyard,
    };

    if (tributedCardIds.length > 0) {
      const newMonstersAfterTribute = newMonsters.map((zone) =>
        zone && tributeCardIds.includes(zone?.cardId) ? null : zone,
      );
      updatedState = {
        ...updatedState,
        zones: { ...newZones, monsters: newMonstersAfterTribute },
        graveyard: [...newGraveyard, ...tributedCardIds],
      };
    }

    const updateStateWithNormalSummonFlag = {
      ...updatedState,
      hasNormalSummonedThisTurn: true,
    };

    // patch game with the log entry
    const logEntry = {
      timestamp: Date.now(),
      turnNumber: game.turnNumber,
      player: playerKey,
      actionType: action === "normalSummon" ? "normalSummon" : "set",
      cardId,
      fromZone: "hand",
      toZone: `monsterZone${zoneIndex + 1}`,
      description:
        action === "normalSummon"
          ? `Normal Summoned ${card.name || "monster"}`
          : `Set ${card.name || "monster"}`,
    } as const;

    await ctx.db.patch(gameId, {
      [stateKey]: updateStateWithNormalSummonFlag,
      actionsLog: [...(game.actionsLog ?? []), logEntry],
    });

    return {
      success: true,
      message:
        action === "normalSummon" ? "Monster Normal Summoned" : "Monster Set",
    };
  },
});
