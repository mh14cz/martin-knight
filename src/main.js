import { bounceBug, bugTouches, createBug, createFlyer, createHopper, explodeAt, hitFlyer, respawnEnemy, updateBug, updateExplosions, updateFlyer, updateHopper, drawBug, drawExplosions, drawFlyer, drawHopper, drawEnemyHealth, drawLightningMark, LIGHTNING_MARK } from "./enemy.js?v=104";
import { createBlankRoom, createClimbRoom, createLevel, createRightRoom, createUpperRoom, drawLevel, findHighPlatform, hitChest, touchesSpike, useSwitch } from "./level.js?v=104";
import { BALL_CHARGE, bouncePlayer, createPlayer, getAttackBox, getPlayerBox, getWaveBox, hurtPlayer, placePlayer, updateHeal, updatePlayer, drawBallCharge, drawHeal, drawPlayer, drawSlash, drawSwordItem, drawWave } from "./player.js?v=104";
import { isLeftMouseHeld, isQuickClick, lightningJustPressed, respawnJustPressed } from "./input.js?v=104";
import { chargeSpecial, drawFps, drawHealth, drawSpecial, SPECIAL_MAX } from "./ui.js?v=104";

const canvas = document.getElementById("game");
// alpha: false keeps the canvas opaque, which is faster on this laptop.
const ctx = canvas.getContext("2d", { alpha: false });

let lastTime = 0;
const cave = createLevel();
const blankRoom = createBlankRoom();
const climbRoom = createClimbRoom();
const upperRoom = createUpperRoom();
const rightRoom = createRightRoom();
let room = cave;
let enteredRoom = cave;
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
let lightningBolts = [];
let lightningTimer = 0;
let lightningMark = null;
let soulBall = null;
let ballCharge = null;
let swordItem = null;
let mouseHold = 0;
let sawMouseHold = false;
const BALL_SPEED = 480;

function foesHere() {
  return foes.filter((bug) => {
    const inThisRoom = bug.area === "blank" ? room === blankRoom : room === cave;
    return inThisRoom && bug.health > 0;
  });
}

function nearestFoe(fromX, fromY) {
  let nearest = null;
  let best = Infinity;
  for (const bug of foesHere()) {
    const dx = bug.x + 11 - fromX;
    const dy = bug.y + 8 - fromY;
    const dist = dx * dx + dy * dy;
    if (dist < best) {
      best = dist;
      nearest = bug;
    }
  }
  return nearest;
}

// A short white zigzag from the top of the screen down to one enemy.
function makeLightning(targetX, targetY) {
  const points = [{ x: targetX, y: 0 }];
  const steps = 5;
  for (let step = 1; step <= steps; step += 1) {
    const y = (targetY * step) / steps;
    const zigzag = step === steps ? 0 : (step % 2 === 0 ? 14 : -14);
    points.push({ x: targetX + zigzag, y });
  }
  return points;
}

function drawLightning() {
  if (lightningMark) {
    for (const bug of lightningMark.targets) {
      if (bug.health <= 0) {
        continue;
      }
      drawLightningMark(ctx, bug.x + 11, bug.y + 8, lightningMark.time);
    }
  }
  if (lightningTimer <= 0) {
    return;
  }
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  for (const bolt of lightningBolts) {
    ctx.beginPath();
    ctx.moveTo(bolt[0].x, bolt[0].y);
    for (let i = 1; i < bolt.length; i += 1) {
      ctx.lineTo(bolt[i].x, bolt[i].y);
    }
    ctx.stroke();
  }
}

function drawSoulBall() {
  if (ballCharge) {
    drawBallCharge(ctx, ballCharge.x, ballCharge.y, ballCharge.time);
  }
  if (!soulBall) {
    return;
  }
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(soulBall.x, soulBall.y, 8, 0, Math.PI * 2);
  ctx.fill();
}

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
  } else if (room === climbRoom && player.y < 0 && player.vy < 0) {
    room = upperRoom;
    // Middle of the hole, already in the air, hopping toward the right edge.
    player.x = 89;
    player.y = 354;
    player.vx = 160;
    player.vy = -280;
    player.facing = 1;
    player.onGround = false;
    player.hopTimer = 0.8;
    player.dashTimer = 0;
  } else if (room === upperRoom && atRight) {
    room = rightRoom;
    player.x = 0;
  } else if (room === rightRoom && atLeft) {
    room = upperRoom;
    // The right edge is a wall. Come back standing on top of it.
    placePlayer(player, 775, 275);
  } else if (room === upperRoom && player.y + 36 > canvas.height) {
    room = climbRoom;
    player.y = 4;
    player.vy = 80;
    player.hopTimer = 0;
  } else if (room === rightRoom && player.y + 36 > canvas.height) {
    room = cave;
    // Drop into the box above the first flyer.
    player.x = 376;
    player.y = 4;
    player.vx = 0;
    player.vy = 80;
    player.hopTimer = 0;
  }

  // Coming back into a room puts its enemies back at full health.
  if (room !== enteredRoom) {
    for (const foe of foes) {
      const home = foe.area === "blank" ? blankRoom : cave;
      if (home === room) {
        respawnEnemy(foe);
      }
    }
    soulBall = null;
    ballCharge = null;
    lightningMark = null;
    lightningBolts = [];
    lightningTimer = 0;
    enteredRoom = room;
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

  if (lightningTimer > 0) {
    lightningTimer -= deltaTime;
  }
  // A full meter and the right mouse button marks every enemy here. The lightning hits after the mark.
  const strike = lightningJustPressed();
  if (strike && player.special >= SPECIAL_MAX && !lightningMark) {
    const targets = foesHere();
    if (targets.length > 0) {
      lightningMark = { targets, time: LIGHTNING_MARK };
    }
  }
  if (lightningMark) {
    lightningMark.time -= deltaTime;
    if (lightningMark.time <= 0) {
      player.special = 0;
      lightningBolts = [];
      lightningTimer = 0.16;
      for (const bug of lightningMark.targets) {
        const stillHere = bug.health > 0 && (bug.area === "blank" ? room === blankRoom : room === cave);
        if (!stillHere) {
          continue;
        }
        bug.health -= 1;
        lightningBolts.push(makeLightning(bug.x + 11, bug.y + 8));
        if (bug.health <= 0) {
          explodeAt(bug.x + 11, bug.y + 8);
        }
      }
      lightningMark = null;
    }
  }

  // A quick click starts the ball. Holding the button heals, so a long press does not shoot.
  const holdingMouse = isLeftMouseHeld();
  if (holdingMouse) {
    mouseHold += deltaTime;
    sawMouseHold = true;
  }
  const quickClick = !holdingMouse && isQuickClick(sawMouseHold ? mouseHold : 0);
  if (!holdingMouse) {
    mouseHold = 0;
    sawMouseHold = false;
  }
  if (quickClick && player.special >= 5 && !soulBall && !ballCharge) {
    const fromX = player.x + 11;
    const fromY = player.y - 14;
    const target = nearestFoe(fromX, fromY);
    if (target) {
      player.special -= 5;
      ballCharge = { x: fromX, y: fromY, target, time: BALL_CHARGE };
    }
  }
  if (ballCharge) {
    ballCharge.x = player.x + 11;
    ballCharge.y = player.y - 14;
    ballCharge.time -= deltaTime;
    if (ballCharge.time <= 0) {
      const target = ballCharge.target;
      const stillHere = target.health > 0 && (target.area === "blank" ? room === blankRoom : room === cave);
      if (stillHere) {
        soulBall = { x: ballCharge.x, y: ballCharge.y, target };
      }
      ballCharge = null;
    }
  }
  if (soulBall) {
    const target = soulBall.target;
    const stillHere = target.health > 0 && (target.area === "blank" ? room === blankRoom : room === cave);
    if (!stillHere) {
      soulBall = null;
    } else {
      const tx = target.x + 11;
      const ty = target.y + 8;
      const dx = tx - soulBall.x;
      const dy = ty - soulBall.y;
      const dist = Math.hypot(dx, dy);
      const step = BALL_SPEED * deltaTime;
      if (dist <= step || dist < 8) {
        target.health -= 1;
        if (target.health <= 0) {
          explodeAt(tx, ty);
        }
        soulBall = null;
      } else {
        soulBall.x += (dx / dist) * step;
        soulBall.y += (dy / dist) * step;
      }
    }
  }

  // Holding the left mouse heals one heart at a time. Each heart spends 1 point.
  updateHeal(player, isLeftMouseHeld(), deltaTime);

  const playerBox = getPlayerBox(player);
  useSwitch(room, playerBox);
  if (touchesSpike(room, playerBox)) {
    hurtPlayer(player);
  }
  const slashBox = getAttackBox(player);
  const waveBox = getWaveBox(player);
  const popped = hitChest(room, [slashBox, waveBox]);
  if (popped) {
    swordItem = { x: popped.x, y: popped.y, restY: popped.restY, vy: -360, age: 0 };
  }
  if (swordItem) {
    swordItem.age += deltaTime;
    if (swordItem.vy !== 0 || swordItem.y < swordItem.restY) {
      swordItem.vy += 900 * deltaTime;
      swordItem.y += swordItem.vy * deltaTime;
      if (swordItem.y >= swordItem.restY && swordItem.vy > 0) {
        swordItem.y = swordItem.restY;
        swordItem.vy = 0;
      }
    }
    // Wait until the pop finishes, so the sword stays visible above the chest.
    const swordBox = { x: swordItem.x - 10, y: swordItem.y - 26, width: 20, height: 44 };
    const touchingSword = playerBox.x < swordBox.x + swordBox.width
      && playerBox.x + playerBox.width > swordBox.x
      && playerBox.y < swordBox.y + swordBox.height
      && playerBox.y + playerBox.height > swordBox.y;
    if (room === cave && swordItem.vy === 0 && touchingSword) {
      player.goldSword = true;
      swordItem = null;
    }
  }
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
      // The chest sword hits harder. The old sword still takes one.
      bug.health -= player.goldSword ? 2 : 1;
      chargeSpecial(player);
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
  drawLightning();
  drawSoulBall();
  if (room === cave && swordItem) {
    drawSwordItem(ctx, swordItem);
  }
  drawHeal(ctx, player);
  drawHealth(ctx, canvas.width, player.health);
  drawSpecial(ctx, canvas.width, player.special);
  drawFps(ctx, deltaTime);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
