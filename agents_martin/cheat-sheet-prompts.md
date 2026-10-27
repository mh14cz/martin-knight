# Cheat Sheet: How to Write Great AI Prompts

It frames prompting like casting spells or giving orders to a co-pilot.

## The 3-Part Formula (WHO + WHAT + HOW):

Weak prompt: "Add dash." (The AI has to guess everything!)  

Awesome prompt: "When I press the Shift key (Trigger), make the knight dash fast in the direction he is looking (Action), and make him leave a cool blue shadow behind him with a 1-second cooldown (Details)."  

## One Feature at a Time:

Never ask for a boss fight, a shop, a main menu, and sound effects in one message. Build one small thing, test it in the browser, and only when it works, ask for the next thing.  

## Be the Game Tester (Describe Bugs Clearly):

When something breaks, don't just say "It doesn't work."  

Tell the AI what you expected vs. what actually happened, plus any red text in the browser console (F12).  

Example: "When I jump against the left wall, the knight gets stuck inside the wall and cannot fall down. How can we fix the horizontal collision?"  

## Ask the AI for Ideas When Stuck:

You don't have to invent everything alone! Try asking: "My enemy bug is too boring. Give me 3 fun ideas for how a cave monster could attack the player, and I will pick my favorite."  


---

# The very first examples:


## Sequence of Example Prompts for the First Functional Demo

Copy-paste or adapt these 4 prompts one by one into the AI chat. Test the game in the browser after each step before moving to the next one!

---

### Step 1: Create the Game Window & Dark Cave Arena
*Generates `index.html`, `style.css`, and a working 60 FPS loop.*

**Prompt to copy:**
> Please read `AGENTS.md` and `docs/AGENTS_ENGINE.md`. I want to start building my game. Create a simple `index.html`, `style.css`, and `src/main.js`. Make an 800x450 canvas in the center of the screen with a dark underground cave background and a solid stone floor at the bottom. Use an opaque canvas context (`alpha: false`) and show an FPS counter in the top-left corner so I can check the speed.

---

### Step 2: Spawn the Little Knight & Snappy Jumping
*Adds keyboard controls, gravity, and variable jump height.*

**Prompt to copy:**
> Now read `agents/AGENTS_HERO.md` (or help me create it). Let's add our hero! Create `src/player.js` and `src/input.js`. Draw the player as a small white knight with a dark cloak and two little horns. I want to move left and right with Arrow keys (or A and D) and jump with Spacebar (or W). Make the jump go higher if I hold the Spacebar down, and make falling slightly faster than rising.

---

### Step 3: Build a Tilemap Room with Platforms and Spikes
*Introduces level design you can edit by typing symbols.*

**Prompt to copy:**
> Let's build our first cave room! Create `src/level.js` using a simple 2D text grid where `#` is a solid stone block and `^` is red spikes. Add 4 platforms I can jump onto and a pit with spikes in the middle of the floor. If the knight touches the spikes, teleport him back to the start of the room and flash the screen red for a moment.

---

### Step 4: Add the Nail Sword Attack & a Crawling Bug Enemy
*Completes the playable action-adventure loop.*

**Prompt to copy:**
> Let's add combat! When I press the X key (or J key), make the knight do a fast sword slash in the direction he is facing, showing a bright white crescent hitbox for 150 milliseconds. Also create `src/enemy.js` and put two red crawling bugs on the platforms that walk back and forth. If my sword hits a bug 3 times, the bug disappears (add a small knockback on each hit). If the bug touches me, I lose 1 health mask. Draw 5 white health masks in the top-left corner below the FPS counter.