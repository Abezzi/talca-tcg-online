# Description

this is the code of the game Talca-TCG a card trading game were you fighting your opponent in a skill based duel with monsters and spells.

# Run

```bash
npm run dev:frontend
npm run dev:backend
```

# Seed the DB

```bash
npx convex run seed/cards:seed '{"force": true}'
npx convex run seed/packs:seed '{"force": true}'
npx convex run seed/cardsInPacks:seed '{"force": true}'
```
