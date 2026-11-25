# Sizzle & Serve — a cooking game

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Fajargh/best-cooking-game-20261125-0137-001/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Fajargh/best-cooking-game-20261125-0137-001/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Sizzle & Serve** is an original cooking game: run a tiny kitchen through a 150-second dinner rush. Orders fly in on the order board, each with its own countdown. You grill patties, chop vegetables, boil pasta, stack the dish on your plate and serve it before the timer runs out. Serve fast for time bonuses, chain dishes for combos, and watch out — three strikes (wrong or late dishes) end the shift. Every five dishes served, the level rises and orders come faster.

## How it plays

- **Order board** — up to 3 live tickets, each showing the recipe icons, the coin value and a countdown bar. Click a ticket (or Tab) to pick which order you are filling.
- **Prep stations** — the grill (3s), the chopping board (3 chops) and the pot (4s). Some ingredients are ready at once; others must be prepped first, so you plan a route through the kitchen.
- **Your plate** — click ingredients on the counter (or press keys 1–0) to stack them. Serve with the green button or Enter. A plate that does not match the selected order is a strike.
- **Scoring** — dish price + time bonus + combo bonus. Level up every 5 served dishes.
- **Screens** — title screen, live play, game over with your grade (Apprentice → Head Chef) and restart.

6 original recipes (Sunny Burger, Garden Salad, Tomato Pasta, Berry Stack, Sunrise Plate, Double Decker), 10 ingredients, synthesized Web Audio sound effects (no audio files), and all food art drawn in code — no borrowed assets.

## Run it

No build step, no network. Serve the `game/` folder with any static server and open `game/index.html` in desktop Chrome:

```sh
cd game && python3 -m http.server 8123
# open http://localhost:8123/
```

Or open `game/index.html` directly from disk. Keyboard and mouse: click ingredients, stations and the SERVE button; keys 1–0 pick ingredients, Enter serves, C clears the plate, Tab switches order, R restarts, M mutes.

## Layout

- `game/index.html` + `game/styles.css` — page shell
- `game/src/main.js` — bootstrap, input, game loop
- `game/src/game.js` — rules: orders, prep stations, scoring, levels
- `game/src/recipes.js` — the 6 recipes and 10 ingredients
- `game/src/render.js` — all canvas drawing, including the vector food art
- `game/src/audio.js` — synthesized sound effects (Web Audio)
- `main.ts` — hand-in program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`
- `screenshots/` — real renders of the game: mid-play (cover), plate ready to serve, title, game over

<sub>Entered on [make.fun](https://make.fun/?ref=8cvj6bwy&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
