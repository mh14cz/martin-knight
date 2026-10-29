# AGENTS_GAMEPLAY.md - Hollow Knight Feel & Mechanics

When the developer asks for player movement, combat, or enemies, follow these design rules:
1. **Snappy Controls (No Floaty Physics):**
   - Horizontal movement should start and stop almost instantly.
   - **Variable Jump Height:** If the player taps the Jump key, make a short hop. If they hold the Jump key, jump higher.
   - **Gravity:** Falling should be slightly faster than rising to feel impactful.
2. **Combat (Sword Nail Slash):**
   - **Sword key:** X or Z. Both keys do the same slash.
   - Attacks should show a quick visual hitbox (like a white crescent or rectangle) in front of the player for 150 milliseconds.
   - Include a brief cooldown so the player cannot spam attacks infinitely.
   - Add **knockback** (pushing the enemy or player slightly back on hit) to make hits feel powerful.
3. **Prompt Coaching:**
   - If the developer just says *"Add an enemy"*, ask him a quick design question before writing complex code, or build a basic one and ask: *"Should this bug patrol back and forth, or chase the player when they get close?"*
4. **Key List:**
   - The keys the game uses are listed in `docs/KEYS.md`.
   - After every new key, and whenever a key's action changes, update `docs/KEYS.md` in the same change.