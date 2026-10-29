import { bounceBug, bugTouches, createBug, createFlyer, createHopper, explodeAt, hitFlyer, respawnEnemy, updateBug, updateExplosions, updateFlyer, updateHopper, drawBug, drawExplosions, drawFlyer, drawHopper, drawEnemyHealth } from "./enemy.js?v=31";
import { createBlankRoom, createClimbRoom, createLevel, drawLevel, findHighPlatform } from "./level.js?v=31";
import { bouncePlayer, createPlayer, getAttackBox, getPlayerBox, getWaveBox, hurtPlayer, placePlayer, updatePlayer, drawPlayer, drawSlash, drawWave } from "./player.js?v=31";
import { respawnJustPressed } from "./input.js?v=31";
import { drawFps, drawHealth } from "./ui.js?v=31";

const canvas = document.getElementById("game");
// alpha: false keeps the canvas opaque, which is faster on this laptop.
const ctx = canvas.getContext("2d", { alpha: false });

let lastTime = 0;
const cave = createLevel();
const blankRoom = createBlankRoom();
const climbRoom = createClimbRoom();
let room = cave;
const player = createPlayer(cave.spawnX, cave.spawnFeetY);
const bugs = [];
const flyers = [];
const hoppers = [];
const blankFlyers = [];
for (const spot of cave.enemies) {
  if (spot.kind === "flyer") {
    flyers.push(createFlyer(spot.x, spot.y));
  } else {
    bugs.push(createBug(spot.x, spot.feetY));
  }
}
for (const spot of blankRoom.enemies) {
  if (spot.kind === "hopper") {
    const hopper = createHopper(spot.x, spot.feetY);
    hopper.area = "blank";
    hoppers.push(hopper);
  } else if (spot.kind === "flyer") {
    const flyer = createFlyer(spot.x, spot.y);
    flyer.area = "blank";
    blankFlyers.push(flyer);
  }
}
const foes = bugs.concat(flyers, hoppers, blankFlyers);

function drawCave() {
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // The first room has a lighter wall. The blank room stays empty.
  if (room !== cave) {
    return;
  }
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

  updatePlayer(player, room, canvas.width, deltaTime);

  const atRight = player.x + 22 >= canvas.width && player.vx > 0;
  const atLeft = player.x <= 0 && player.vx < 0;
  if (room === cave && atRight) {
    room = blankRoom;
    player.x = 0;
  } else if (room === cave && atLeft) {
    room = climbRoom;
    player.x = canvas.width - 22;
  } else if (room === blankRoom && atLeft) {
    room = cave;
    player.x = canvas.width - 22;
  } else if (room === climbRoom && atRight) {
    room = cave;
    player.x = 0;
  }

  if (room === cave) {
    for (const bug of bugs) {
      if (bug.health > 0) {
        updateBug(bug, cave, canvas.width, deltaTime);
      }
    }
    for (const flyer of flyers) {
      if (flyer.health > 0) {
        updateFlyer(flyer, deltaTime);
      }
    }
  }
  if (room === blankRoom) {
    for (const hopper of hoppers) {
      if (hopper.health > 0) {
        updateHopper(hopper, blankRoom, canvas.width, deltaTime);
      }
    }
    for (const flyer of blankFlyers) {
      if (flyer.health > 0) {
        updateFlyer(flyer, deltaTime);
      }
    }
  }
  updateExplosions(deltaTime);

  const playerBox = getPlayerBox(player);
  const slashBox = getAttackBox(player);
  const waveBox = getWaveBox(player);
  for (const bug of foes) {
    const inThisRoom = bug.area === "blank" ? room === blankRoom : room === cave;
    if (!inThisRoom || bug.health <= 0) {
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
      if (!player.waveDown && bug.kind !== "flyer" && bug.kind !== "hopper" && bug.health > 0) {
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
    const spot = findHighPlatform(room);
    placePlayer(player, spot.centerX, spot.top);
    player.health = 8;
    player.hurtTimer = 0;
  }

  drawCave();
  drawLevel(ctx, room);
  if (room === cave) {
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
  }
  if (room === blankRoom) {
    for (const hopper of hoppers) {
      if (hopper.health <= 0) {
        continue;
      }
      drawHopper(ctx, hopper);
      drawEnemyHealth(ctx, hopper);
    }
    for (const flyer of blankFlyers) {
      if (flyer.health <= 0) {
        continue;
      }
      drawFlyer(ctx, flyer);
      drawEnemyHealth(ctx, flyer);
    }
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
