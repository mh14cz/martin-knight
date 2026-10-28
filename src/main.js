import { bounceBug, bugTouches, createBug, updateBug, drawBug } from "./enemy.js";
import { createLevel, drawLevel, findHighPlatform } from "./level.js";
import { createPlayer, getPlayerBox, getWaveBox, hurtPlayer, placePlayer, updatePlayer, drawPlayer, drawSlash, drawWave } from "./player.js";
import { drawFps, drawHealth } from "./ui.js";

const canvas = document.getElementById("game");
// alpha: false keeps the canvas opaque, which is faster on this laptop.
const ctx = canvas.getContext("2d", { alpha: false });

let lastTime = 0;
const level = createLevel();
const player = createPlayer(level.spawnX, level.spawnFeetY);
const bugs = level.enemies.map((spot) => createBug(spot.x, spot.feetY));

function drawCave() {
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // A slightly lighter wall behind the knight's path.
  ctx.fillStyle = "#161b22";
  ctx.fillRect(36, 70, 728, 250);
}

function frame(now) {
  if (lastTime === 0) {
    lastTime = now;
  }

  // Seconds since the last frame. Never bigger than 0.05, so a slow frame
  // cannot fling the hero through the floor later.
  const deltaTime = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  updatePlayer(player, level, canvas.width, deltaTime);
  for (const bug of bugs) {
    updateBug(bug, level, canvas.width, deltaTime);
  }

  const playerBox = getPlayerBox(player);
  const waveBox = getWaveBox(player);
  for (const bug of bugs) {
    if (bugTouches(bug, playerBox)) {
      hurtPlayer(player);
    }
    if (waveBox && bugTouches(bug, waveBox)) {
      player.waveHasHit = true;
      bounceBug(bug, player.facing);
    }
  }

  // No circles left: stand on the tall stone and fill all 8 circles again.
  if (player.health === 0) {
    const spot = findHighPlatform(level);
    placePlayer(player, spot.centerX, spot.top);
    player.health = 8;
    player.hurtTimer = 0;
  }

  drawCave();
  drawLevel(ctx, level);
  for (const bug of bugs) {
    drawBug(ctx, bug);
  }
  // Blink for a moment after a hit so the touch is easy to see.
  const blinking = player.hurtTimer > 0 && Math.floor(player.hurtTimer * 10) % 2 === 0;
  if (!blinking) {
    drawPlayer(ctx, player);
    drawSlash(ctx, player);
  }
  drawWave(ctx, player);
  drawHealth(ctx, canvas.width, player.health);
  drawFps(ctx, deltaTime);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
