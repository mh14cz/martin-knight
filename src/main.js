import { bounceBug, bugTouches, createBug, createFlyer, explodeAt, hitFlyer, respawnEnemy, updateBug, updateExplosions, updateFlyer, drawBug, drawExplosions, drawFlyer, drawEnemyHealth } from "./enemy.js?v=15";
import { createLevel, drawLevel, findHighPlatform } from "./level.js?v=15";
import { bouncePlayer, createPlayer, getAttackBox, getPlayerBox, getWaveBox, hurtPlayer, placePlayer, updatePlayer, drawPlayer, drawSlash, drawWave } from "./player.js?v=15";
import { respawnJustPressed } from "./input.js?v=15";
import { drawFps, drawHealth } from "./ui.js?v=15";

const canvas = document.getElementById("game");
// alpha: false keeps the canvas opaque, which is faster on this laptop.
const ctx = canvas.getContext("2d", { alpha: false });

let lastTime = 0;
const level = createLevel();
const player = createPlayer(level.spawnX, level.spawnFeetY);
const bugs = [];
const flyers = [];
for (const spot of level.enemies) {
  if (spot.kind === "flyer") {
    flyers.push(createFlyer(spot.x, spot.y));
  } else {
    bugs.push(createBug(spot.x, spot.feetY));
  }
}
const foes = bugs.concat(flyers);

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

  if (respawnJustPressed()) {
    for (const foe of foes) {
      respawnEnemy(foe);
    }
  }

  updatePlayer(player, level, canvas.width, deltaTime);
  for (const bug of bugs) {
    if (bug.health > 0) {
      updateBug(bug, level, canvas.width, deltaTime);
    }
  }
  for (const flyer of flyers) {
    if (flyer.health > 0) {
      updateFlyer(flyer, deltaTime);
    }
  }
  updateExplosions(deltaTime);

  const playerBox = getPlayerBox(player);
  const slashBox = getAttackBox(player);
  const waveBox = getWaveBox(player);
  for (const bug of foes) {
    if (bug.health <= 0) {
      continue;
    }

    const slashHit = slashBox && !player.slashHasHit && bugTouches(bug, slashBox);
    const waveHit = waveBox && !player.waveHasHit && bugTouches(bug, waveBox);
    const downSlashHit = player.slashDown && slashHit;
    const downWaveHit = player.waveDown && waveHit;

    if (downSlashHit || downWaveHit) {
      bouncePlayer(player);
    }
    if (slashHit || waveHit) {
      bug.health -= 1;
      if (bug.health <= 0) {
        explodeAt(bug.x + 11, bug.y + 8);
      }
    }
    if (slashHit) {
      player.slashHasHit = true;
    }
    if (waveHit) {
      player.waveHasHit = true;
      // A side attack still pushes the walking bug. A downward hit only bounces the knight.
      if (!player.waveDown && bug.kind !== "flyer" && bug.health > 0) {
        bounceBug(bug, player.facing);
      }
    }
    if (bug.kind === "flyer" && (slashHit || waveHit) && bug.health > 0) {
      hitFlyer(bug);
    }
    if (bug.health > 0 && bugTouches(bug, playerBox) && !downSlashHit && !downWaveHit) {
      hurtPlayer(player);
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
    if (bug.health <= 0) {
      continue;
    }
    drawBug(ctx, bug);
    drawEnemyHealth(ctx, bug);
  }
  for (const flyer of flyers) {
    if (flyer.health <= 0) {
      continue;
    }
    drawFlyer(ctx, flyer);
    drawEnemyHealth(ctx, flyer);
  }
  // Blink for a moment after a hit so the touch is easy to see.
  const blinking = player.hurtTimer > 0 && Math.floor(player.hurtTimer * 10) % 2 === 0;
  if (!blinking) {
    drawPlayer(ctx, player);
    drawSlash(ctx, player);
  }
  drawExplosions(ctx);
  drawWave(ctx, player);
  drawHealth(ctx, canvas.width, player.health);
  drawFps(ctx, deltaTime);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
