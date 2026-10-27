# AGENTS_LEVELS.md - Level Design & Tilemaps

When building levels, platforms, or hazards:
1. **Simple 2D Grid System:**
   - Represent levels using simple 2D arrays or strings in `src/level.js` so the developer can visually edit the map himself!
   - Legend example:
     - `.` = Empty air
     - `#` = Solid stone wall/floor
     - `^` = Spikes (hazard)
     - `E` = Enemy spawn point
     - `P` = Player start
2. **Collision Detection:**
   - Use simple Axis-Aligned Bounding Box (AABB) collision (`x, y, width, height`).
   - Keep collision math easy to read and separate horizontal collisions from vertical collisions so the player never gets stuck inside walls.