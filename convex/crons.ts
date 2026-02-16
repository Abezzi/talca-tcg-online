import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "matchmaking:tryMatch",
  { seconds: 60 },
  internal.game.createGameFromQueue,
);

// TODO: cleanup
crons.interval(
  "matchmaking:cleanup",
  { hours: 1 },
  internal.game.cleanupOldQueueEntries,
);

export default crons;
