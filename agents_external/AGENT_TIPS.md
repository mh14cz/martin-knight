# AGENT_TIPS.md - Codebase map and traps for coding agents

Read this after the root `AGENTS.md` and the `docs/AGENTS_*.md` files. Those files set the rules (mentoring persona, English coaching, hardware limits) and they win if anything here disagrees. This file adds what they do not cover: how the code is actually put together today, and where it is easy to break.

- Checked against: commit `c3f6a30` on `main`, cache tag `v=104`, on 2026-11-16.
- How it was checked: every file in the repo was read, and all six `src/*.js` files pass a syntax check. The game was not run in a browser, so nothing here is play-tested.
- Line numbers go stale fast, so this file names functions instead.

## 1. The project in one minute

- A single-screen-per-room 2D action game. Plain HTML5 canvas, vanilla JavaScript ES modules, no build step, no `package.json`, no dependencies, no tests, no linter.
- About 2,400 lines in six files under `src/`. `index.html` loads `src/main.js` as a module. `style.css` only centers and scales the canvas.
- All art is drawn in code with canvas calls. `assets/sprites` and `assets/audio` are empty, and no image or sound is loaded anywhere.
- The canvas is 800x450. One tile is 25 px (`TILE_SIZE` in `level.js`), so every room is exactly 32 columns by 18 rows. There is no camera and no scrolling.
- There is no save system. Reloading the page resets everything.

### Running and checking

- The page must come from a local web server, because browsers refuse module imports from `file://`. From the repo root, `python -m http.server 8000` (or `python3` on Linux Mint) and then `http://localhost:8000/` works. How Martin normally starts it is not written down anywhere in the repo.
- The only automatic check available is a syntax check. With Node installed:
  - bash: `for f in src/*.js; do node --input-type=module --check < "$f"; done`
  - PowerShell: `Get-Content src\main.js | node --input-type=module --check` (one file at a time)
- Everything else is a manual browser test. The FPS counter is in the top-left corner. Check the browser console (F12) for red errors after every change.

## 2. How one frame runs

Everything happens inside `frame(now)` in `main.js`, in this order:

1. Compute `deltaTime` in seconds, clamped to 0.05.
2. `Q` respawns all enemies.
3. `updatePlayer` (input, dash, jump, attacks, movement, tile collision).
4. Room changes (one `if / else if` chain, see section 5).
5. If the room changed: respawn that room's enemies, cancel ball and lightning.
6. Update the enemies of the current room, then the explosion bits.
7. Lightning, soul ball, healing.
8. Switch, spikes, chest, sword pickup.
9. Attacks against enemies, enemy touch damage.
10. Health 0: move the knight to the room's highest platform and refill health.
11. Draw everything, then `requestAnimationFrame(frame)`.

Update and draw are not separated into two functions. `frame` is about 330 lines and is where new logic tends to pile up. Prefer putting new behavior in the matching module and calling it from `frame`.

### Module map

| File | Owns | Pattern |
| --- | --- | --- |
| `main.js` | Game loop, all game state, room changes, specials, all collision between things | Module-level variables, one `frame` function |
| `input.js` | Keyboard and mouse state | `isXHeld()` and `xJustPressed()` functions |
| `player.js` | Knight data, movement, attack boxes, all knight and attack drawing | `createPlayer`, `updatePlayer`, `drawX(ctx, player)` |
| `enemy.js` | Three enemy types, explosion bits, enemy health pips, lightning mark | `createX`, `updateX`, `drawX` per type |
| `level.js` | Five map grids, tile collision helpers, spikes, switch, trap door, chest, level drawing | `createXRoom()` returns `{ rows, spawnX, spawnFeetY, enemies }` |
| `ui.js` | Health circles, special meter, FPS counter | `drawX(ctx, ...)` |

There are no classes. Things are plain objects passed to plain functions.

## 3. Words the code uses

The code names and the names Martin sees in `docs/KEYS.md` differ. Use Martin's words when talking to him.

| In the code | What it is |
| --- | --- |
| `cave`, `MAP`, `createLevel` | The first room |
| `blankRoom`, `BLANK` | The room to the right of the cave. It is no longer blank: it has two platforms, two flyers and a hopper |
| `climbRoom`, `upperRoom`, `rightRoom` | Stairs room (left of the cave), the room above it, and the room right of that |
| slash | The `X` / `Z` sword attack |
| wave | The `E` half-circle attack |
| pogo | The upward bounce after a downward hit |
| special | The meter on the right (0 to 10) |
| bits | The explosion particles |
| bug | The crawling enemy. Also used as the loop variable name for any enemy |
| `foes` | All enemies of all rooms in one array |
| `hopTimer` (player) | The scripted hop when entering the upper room. Not related to the hopper enemy |
| "dive mark" (comments in `ui.js`) | The lightning icon. The name is left over from an older idea |

A bug has no `kind` property. Flyers have `kind: "flyer"` and hoppers have `kind: "hopper"`. Code that means "is this a bug" tests for not-flyer and not-hopper.

## 4. Traps, most important first

### 4.1 The `?v=104` tags must all change together

Every import path and the script tag carry the same cache tag: 1 in `index.html`, 5 in `main.js`, 2 in `player.js`, 1 in `enemy.js` (9 in total). The tag makes the browser fetch fresh files.

- When you change any file in `src/`, bump all nine to the same new number.
- Never leave them mixed. The browser treats `input.js?v=104` and `input.js?v=105` as two different modules. That can run old and new code side by side, and it splits module-level state into two copies.
- Search for `?v=` to find them all. A new import needs the tag too.

### 4.2 Map text and `main.js` coordinates depend on each other

Room changes place the knight at hard-coded pixel positions that only make sense for the current map text. If you edit these parts of a map, update the matching numbers in the room-change chain in `frame`:

| Change | Hard-coded in `main.js` | Depends on |
| --- | --- | --- |
| Climb room top edge to upper room | `x = 89, y = 354`, then a scripted hop to the right | The floor hole in `UPPER` (columns 1 to 6, bottom two rows) |
| Upper room hole to climb room | `y = 4`, x kept | The top-left platform in `CLIMB` being under the hole |
| Right room back to upper room | `placePlayer(player, 775, 275)` | The wall at the right edge of `UPPER` (columns 30 and 31, top at row 11) |
| Right room trap door to cave | `x = 376, y = 4` | The walled box with the chest in `MAP` (columns 14 to 16) |

`drawCave` also draws a lighter back wall for the first room at fixed pixels (`36, 70, 728, 250`).

### 4.3 Enemies only work in two rooms

`buildLevel` reads `E`, `F` and `H` in any map, but `main.js` only spawns, updates and draws enemies for `cave` and `blankRoom`.

- An `E`, `F` or `H` placed in `CLIMB`, `UPPER` or `RIGHT` silently does nothing.
- In `MAP` (the cave), an `H` becomes a crawling bug, because the cave spawn loop only tells flyers apart.
- In `BLANK`, an `E` is ignored, because that loop only handles hoppers and flyers.
- Which room an enemy belongs to is stored as `foe.area`: `"blank"` or undefined (meaning cave). The test `bug.area === "blank" ? room === blankRoom : room === cave` is repeated in about seven places in `main.js` (`foesHere`, room-entry respawn, lightning, ball charge, soul ball, the attack loop), plus separate update and draw blocks per room.

If Martin asks for enemies in a third room, the small safe first step is to store the room object on each enemy and use one helper for "is this enemy in the current room". Do that as its own step and explain it, then add the enemies.

### 4.4 `xJustPressed()` functions have memory

Each `JustPressed` function in `input.js` compares the key with its own "was held" flag and then updates the flag. So:

- Call each one once per frame. A second call in the same frame returns false.
- Do not call one inside a branch that only sometimes runs, unless that is intended. `dashJustPressed` is already skipped during the entrance hop.
- New keys follow the same pattern: a `xWasHeld` flag and an exported `xJustPressed()`.

Keys are read with `event.code`, which is the physical key position, not the printed letter. On a Czech QWERTZ keyboard the `Z` and `Y` keys are swapped, so the game's "Z" is the key printed `Y`. Keep this in mind if Martin reports that a key does not work. Which layout he uses is not recorded in the repo.

### 4.5 Enemy movement depends on the map shape

- **Bug:** turns around at a stone wall and at the right edge of the screen only. It has no check for the left edge of the screen and no check for ledges. A bug with nothing solid to its left walks off the screen and never comes back. It also does not fall, so it will walk across a gap in the floor.
- **Hopper:** hops inside the gap between the leftmost and the rightmost short platform of the room (`shortPlatforms` in `enemy.js`: above the floor rows, narrower than 200 px). A room with fewer than two such platforms leaves the hopper standing still forever.
- **Flyer:** stays at its home x and bobs up and down. A hit pops it upward briefly.
- All three use the same 22x16 hit box (`bugTouches`).

### 4.6 The same number lives in several files

Changing one of these means changing all of its copies.

| Value | Named constant | Also typed as a plain number in |
| --- | --- | --- |
| Knight size 22x36 | `PLAYER_WIDTH`, `PLAYER_HEIGHT` in `player.js` (not exported) | Room changes in `main.js` (`22`, `36`) |
| Enemy size 22x16 | `BUG_*` and `HOP_*` in `enemy.js` | Enemy center `+ 11`, `+ 8` in `main.js` |
| Tile size 25 | `TILE_SIZE` in `level.js` (exported) | `shortPlatforms` in `enemy.js` |
| Max health 8 | `MAX_HEALTH` in `ui.js` (not exported) | `createPlayer` and `updateHeal` in `player.js`, the refill in `main.js` |
| Meter size 10 | `SPECIAL_MAX` in `ui.js` (exported) | A comment in `player.js` |
| Ball cost 5 | none | `main.js` and `drawSpecial` in `ui.js` |
| Heal cost 1 | none | `updateHeal` in `player.js` and `drawSpecial` in `ui.js` |
| Canvas 800x450 | `canvas.width` / `canvas.height` | `index.html`, map sizes, `drawCave` |

### 4.7 State that outlives a room visit

- Room objects are built once at load and edited in place. An opened chest (`c` to `C`) and a flipped switch (`s` to `S`, `T` to `t`) stay that way until the page reloads.
- Flipping any switch toggles every trap door in that same room.
- `heldSwitch` in `level.js`, `bits` in `enemy.js`, the FPS counters in `ui.js` and everything in `input.js` are module-level variables shared by the whole game.
- The chest sword item is only drawn and picked up in the cave, because the only chest is there.

### 4.8 Line endings are mixed

`level.js` and most Markdown files use Windows line endings (CRLF). The other five source files and `docs/KEYS.md` use LF. There is no `.gitattributes`. Keep each file's existing line endings so a small change does not show up as a whole-file diff.

## 5. Room layout

```
              upperRoom --right--> rightRoom
                ^   |                 |
        top edge|   | floor hole      | open trap door
                |   v                 v
climbRoom <--left-- cave --right--> blankRoom
```

- `rightRoom` going left returns to `upperRoom`. The trap door drops into the chest box at the top of the cave, which is the only way to reach the chest.
- Screen edges with no neighbor act as walls (`keepInsideScreen`).
- The chain is one `if / else if`, so only one room change happens per frame and the order of the branches matters.
- Entering a room respawns its enemies at full health.

## 6. Recipes

### Add or change a key

1. `input.js`: add the key to a held check or add a `xJustPressed()` with its own flag. Add the key to `preventDefault` in the `keydown` listener if the browser would scroll or act on it.
2. Call it from `updatePlayer` or `frame`, once per frame.
3. Update `docs/KEYS.md` in the same change. This is a rule from `docs/AGENTS_GAMEPLAY.md`.
4. Bump the `?v=` tags.

### Edit a map

1. Keep every row exactly 32 characters and every map exactly 18 rows.
2. The bottom two rows are the floor. `shortPlatforms` assumes this.
3. Put `P`, `E` and `H` in the air. `buildLevel` drops them onto the first `#` below.
4. The legend at the top of `level.js` is the complete one.
5. Check section 4.2 if you touched a hole, a wall or the chest box.

### Add a new tile letter

A tile needs up to four things in `level.js`: a line in the header legend, a draw branch in `drawLevel`, an entry in `isSolid` if it blocks movement, and its own "touching" function if it reacts to the knight (copy the shape of `touchesSpike`). Then add it to the legend in `docs/AGENTS_LEVELS.md`.

### Add a room

1. `level.js`: add the grid and an exported `createXRoom()`.
2. `main.js`: import it, create it next to the other rooms, and add both directions to the room-change chain, with entry positions that land on solid ground.
3. Remember section 4.3 if the room should have enemies.

### Add an enemy type

1. `enemy.js`: `createX` (give it `kind`, `homeX`, `homeY`, `health`, `maxHealth`, and the fields `respawnEnemy` resets), `updateX`, `drawX`.
2. `level.js`: a marker letter in `buildLevel` and in the legend.
3. `main.js`: spawn it, update it, draw it with `drawEnemyHealth`, and decide how the attack loop treats its `kind` (push, pop, or nothing).

## 7. Numbers for level design

Worked out from the constants in `player.js`, not play-tested. One tile is 25 px.

| Move | Reach |
| --- | --- |
| Walk | 260 px per second (about 10 tiles) |
| Full jump (hold) | About 108 px up (a bit over 4 tiles) |
| Short hop (tap) | About 30 px up (a bit over 1 tile) |
| Second jump in the air | Up to about 108 px more |
| Full jump on flat ground | About 228 px across (about 9 tiles) |
| Dash | About 86 px (about 3.5 tiles), 0.4 s between dashes, no falling during it |

- The knight is 22 px wide and 36 px tall. He fits through a gap one tile wide, but needs two tiles of height.
- Spikes take one health, then he is safe for 1 second. The spike hit box is smaller than the tile, so a jump can clear it.
- Enemy health: bug 4, flyer 3, hopper 2. The first sword takes 1, the chest sword takes 2.

## 8. Where the docs and the code disagree

Know these. Do not "fix" them unless asked, except `docs/KEYS.md`, which must always match the code.

- `README.md` is empty, although the root `AGENTS.md` describes it as the project overview.
- The legend in `docs/AGENTS_LEVELS.md` has no `F` (flyer) or `H` (hopper).
- `docs/AGENTS_GRAPHICS.md` talks about drawing only what the camera sees. There is no camera. Every room is one screen and `drawLevel` draws all 576 cells each frame.
- `agents_martin/cheat-sheet-prompts.md` describes the first demo (5 masks top-left, spikes send the knight back to the start, a bug takes 3 hits). The game has moved on: 8 circles in the top middle, spikes cost one circle, a bug has 4 health. That folder is Martin's own space.

## 9. Conventions the code follows

- Two-space indent, double quotes, semicolons, `i += 1` (never `++`), early `continue` and `return`.
- Constants in `UPPER_SNAKE` above the code that uses them. Times in seconds, speeds in pixels per second, everything multiplied by `deltaTime`.
- Colors are hex values from the palette in `docs/AGENTS_GRAPHICS.md`, plus a few per-enemy colors.
- Comments are short, simple English sentences that say why, in words an 11-year-old can follow. Example from the code: "He must wait this long before the next slash, so he cannot spam it." Write new comments the same way.
- Commit messages are one sentence that says what was added and why it matters in the game. Example from the history: "Add a dash, a hopping foe, and rooms beside the cave so the knight can explore further."
- The remote is `origin` on GitHub and the only branch is `main`.

## 10. Performance, as it stands today

The hardware rules in the root `AGENTS.md` are currently met:

- The context is created with `{ alpha: false }`, and `deltaTime` is clamped to 0.05.
- No `shadowBlur`, no CSS filters, no images.
- Explosion bits are capped at 25 (`MAX_BITS` in `enemy.js`). A defeated enemy makes 6.
- Heal sparkles, the ball charge ring and the lightning mark are computed fresh each frame and store nothing.

Small per-frame allocations exist (`tilesTouching` returns a new array, the box helpers return new objects, `foesHere` uses `filter`). At this size they are not a problem. Do not rewrite them for speed unless the FPS counter shows a real drop.

## 11. Rough edges found while reading (not fixed)

These are observations, not requests. Each would make a good small task to do together with Martin.

- No handler for the window losing focus. A key or mouse button held while switching windows can stay "held" until pressed again.
- A spike under a ceiling is drawn pointing down from the top of its tile, but its hit box is still the lower part of the tile.
- Bugs can walk off the left side of the screen (section 4.5).
- `leftClickJustPressed` in `input.js` is exported but nothing uses it.
- The cave drawing block near the end of `frame` is indented one level too little.
- `hitChest` runs in every room, but the sword item only shows in the cave.
