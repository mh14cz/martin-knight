import { dashJustPressed, isLeftHeld, isRightHeld, isJumpHeld, isDownHeld, isUpHeld, jumpJustPressed, swordJustPressed, waveJustPressed } from "./input.js?v=124";
import { tilesTouching } from "./level.js?v=124";

const PLAYER_WIDTH = 22;
const PLAYER_HEIGHT = 36;

// Pixels per second. Movement uses deltaTime, so speed stays the same on every computer.
const MOVE_SPEED = 260;
const JUMP_SPEED = -460;
const SHORT_HOP_SPEED = -240;
const GRAVITY_RISE = 980;
const GRAVITY_FALL = 1300;

// The white slash stays visible for 150 milliseconds.
const SLASH_TIME = 0.15;
// He must wait this long before the next slash, so he cannot spam it.
const SLASH_COOLDOWN = 0.4;
// The E attack stays on screen for half a second.
const WAVE_TIME = 0.5;
const KNOCKBACK_SPEED = 220;
const KNOCKBACK_TIME = 0.09;
// A dash is a short, fast slide in the direction he is facing.
const DASH_SPEED = 720;
const DASH_TIME = 0.12;
const DASH_COOLDOWN = 0.4;

export function createPlayer(startX, groundY) {
  return {
    x: startX,
    y: groundY - PLAYER_HEIGHT,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: true,
    slashTimer: 0,
    slashDown: false,
    waveTimer: 0,
    waveDown: false,
    waveUp: false,
    waveHasHit: false,
    attackCooldown: 0,
    slashHasHit: false,
    knockTimer: 0,
    knockDir: 0,
    health: 8,
    // Fills when a sword or wave hits an enemy. 10 means the meter is full.
    special: 0,
    hurtTimer: 0,
    pogo: false,
    pogoSafe: 0,
    dashTimer: 0,
    dashCooldown: 0,
    dashDir: 1,
    hopTimer: 0,
    // One extra jump. It refills when his feet touch the ground.
    airJump: true,
    // How long the left mouse has been held toward the next heart.
    healHold: 0,
    // How long the white burst stays after a heart comes back.
    healFlash: 0,
    // True after he picks up the sword from the chest.
    goldSword: false,
  };
}

export function placePlayer(player, centerX, feetY) {
  player.x = centerX - PLAYER_WIDTH / 2;
  player.y = feetY - PLAYER_HEIGHT;
  player.vx = 0;
  player.vy = 0;
  player.onGround = true;
  player.dashTimer = 0;
  player.airJump = true;
  player.healHold = 0;
  player.healFlash = 0;
}

export function getPlayerBox(player) {
  return {
    x: player.x,
    y: player.y,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
  };
}

// Hold the left mouse for this long to gain one heart. Each heart spends 1 special.
const HEAL_TIME = 0.5;
// The burst after a heart comes back.
const HEAL_FLASH = 0.25;
// Little squares that spin inward. Drawn fresh each frame, so nothing is stored.
const HEAL_BITS = 6;

// Healing only runs while the plus is white, he is hurt, and the button stays down.
export function updateHeal(player, holding, deltaTime) {
  if (player.healFlash > 0) {
    player.healFlash -= deltaTime;
  }
  const canHeal = holding && player.special >= 1 && player.health > 0 && player.health < 8;
  if (!canHeal) {
    player.healHold = 0;
    return;
  }
  player.healHold += deltaTime;
  if (player.healHold >= HEAL_TIME) {
    player.healHold = 0;
    player.health += 1;
    player.special -= 1;
    player.healFlash = HEAL_FLASH;
  }
}

// One touch takes one circle. The timer stops the next hit for a moment.
export function hurtPlayer(player) {
  if (player.hurtTimer > 0 || player.health <= 0 || player.pogoSafe > 0) {
    return;
  }
  player.health -= 1;
  player.hurtTimer = 1;
}

// A downward hit pops him back up, about as high as a full jump.
export function bouncePlayer(player) {
  player.vy = JUMP_SPEED;
  player.onGround = false;
  player.pogo = true;
  player.pogoSafe = 0.2;
}

export function updatePlayer(player, level, canvasWidth, deltaTime) {
  if (player.onGround) {
    player.pogo = false;
    player.airJump = true;
  }
  if (player.pogoSafe > 0) {
    player.pogoSafe -= deltaTime;
  }

  const left = isLeftHeld();
  const right = isRightHeld();

  // The entrance hop plays itself. Walking would cancel the little jump.
  if (player.hopTimer > 0) {
    player.hopTimer -= deltaTime;
    if (player.onGround) {
      player.hopTimer = 0;
    }
  }
  const hopping = player.hopTimer > 0;

  if (!hopping && dashJustPressed() && player.dashCooldown <= 0) {
    player.dashTimer = DASH_TIME;
    player.dashCooldown = DASH_COOLDOWN;
    player.dashDir = player.facing;
  }

  let dashing = false;
  if (hopping) {
    player.vx = 160;
    player.facing = 1;
    player.dashTimer = 0;
  } else if (player.dashTimer > 0) {
    // Slide flat. He does not rise or fall until the dash is over.
    player.vx = player.dashDir * DASH_SPEED;
    player.vy = 0;
    player.facing = player.dashDir;
    player.dashTimer -= deltaTime;
    dashing = true;
  } else if (player.knockTimer > 0) {
    // A hit pushes him back for a short moment.
    player.vx = player.knockDir * KNOCKBACK_SPEED;
    player.knockTimer -= deltaTime;
  } else if (left && !right) {
    player.vx = -MOVE_SPEED;
    player.facing = -1;
  } else if (right && !left) {
    player.vx = MOVE_SPEED;
    player.facing = 1;
  } else {
    player.vx = 0;
  }

  // On the ground this is the first jump. In the air he has one more.
  if (jumpJustPressed() && (player.onGround || player.airJump)) {
    if (!player.onGround) {
      player.airJump = false;
    }
    player.vy = JUMP_SPEED;
    player.onGround = false;
    // A jump cuts a dash short, so the extra jump still goes up.
    player.dashTimer = 0;
    dashing = false;
  }

  const attackDown = !player.onGround && isDownHeld();

  if (swordJustPressed() && player.attackCooldown <= 0) {
    player.slashTimer = SLASH_TIME;
    player.attackCooldown = SLASH_COOLDOWN;
    player.slashHasHit = false;
    player.slashDown = attackDown;
  }

  if (waveJustPressed()) {
    const attackUp = isUpHeld();
    player.waveTimer = WAVE_TIME;
    player.waveHasHit = false;
    // W + E points up on the ground or in the air. S still points the wave down.
    player.waveUp = attackUp;
    player.waveDown = !attackUp && attackDown;
  }

  // Letting go early cuts the climb, so a tap is a short hop.
  // A pogo bounce stays a full hop. A normal jump still gets shorter if he lets go.
  if (!hopping && player.vy < SHORT_HOP_SPEED && !isJumpHeld() && !player.pogo) {
    player.vy = SHORT_HOP_SPEED;
  }

  moveX(player, level, deltaTime);
  if (dashing) {
    player.vy = 0;
  } else {
    moveY(player, level, deltaTime);
  }
  keepInsideScreen(player, canvasWidth);
  hitStoneWithSlash(player, level);

  if (player.slashTimer > 0) {
    player.slashTimer -= deltaTime;
  }
  if (player.waveTimer > 0) {
    player.waveTimer -= deltaTime;
  }
  if (player.attackCooldown > 0) {
    player.attackCooldown -= deltaTime;
  }
  if (player.hurtTimer > 0) {
    player.hurtTimer -= deltaTime;
  }
  if (player.dashCooldown > 0) {
    player.dashCooldown -= deltaTime;
  }
}

function moveX(player, level, deltaTime) {
  player.x += player.vx * deltaTime;

  // Leave out the feet so the floor is not treated as a wall.
  const box = {
    x: player.x,
    y: player.y,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT - 6,
  };

  for (const tile of tilesTouching(level, box)) {
    if (!overlaps(box, tile)) {
      continue;
    }

    const intoLeftSide = player.x + PLAYER_WIDTH - tile.x;
    const intoRightSide = tile.x + tile.width - player.x;
    const hitLeftSide = player.vx > 0 || (player.vx === 0 && intoLeftSide < intoRightSide);

    if (hitLeftSide) {
      player.x = tile.x - PLAYER_WIDTH;
    } else {
      player.x = tile.x + tile.width;
    }
    player.vx = 0;
    box.x = player.x;
  }
}

function moveY(player, level, deltaTime) {
  const gravity = player.vy < 0 ? GRAVITY_RISE : GRAVITY_FALL;
  player.vy += gravity * deltaTime;

  // Remember where he was, so a side bump is not treated as a landing.
  const yBefore = player.y;
  player.y += player.vy * deltaTime;
  player.onGround = false;

  const box = {
    x: player.x + 1,
    y: player.y,
    width: PLAYER_WIDTH - 2,
    height: PLAYER_HEIGHT,
  };

  for (const tile of tilesTouching(level, box)) {
    if (!overlaps(box, tile)) {
      continue;
    }

    const wasAbove = yBefore + PLAYER_HEIGHT <= tile.y;
    const wasBelow = yBefore >= tile.y + tile.height;

    if (player.vy >= 0 && wasAbove) {
      player.y = tile.y - PLAYER_HEIGHT;
      player.vy = 0;
      player.onGround = true;
      box.y = player.y;
    } else if (player.vy < 0 && wasBelow) {
      player.y = tile.y + tile.height;
      player.vy = 0;
      box.y = player.y;
    }
  }
}

function keepInsideScreen(player, canvasWidth) {
  if (player.x < 0) {
    player.x = 0;
  }
  if (player.x + PLAYER_WIDTH > canvasWidth) {
    player.x = canvasWidth - PLAYER_WIDTH;
  }
}

function hitStoneWithSlash(player, level) {
  if (player.slashDown) {
    return;
  }

  const attack = getAttackBox(player);
  if (!attack || player.slashHasHit) {
    return;
  }

  for (const tile of tilesTouching(level, attack)) {
    if (!overlaps(attack, tile)) {
      continue;
    }
    player.slashHasHit = true;
    player.knockTimer = KNOCKBACK_TIME;
    player.knockDir = -player.facing;
    return;
  }
}

export function getAttackBox(player) {
  if (player.slashTimer <= 0) {
    return null;
  }

  if (player.slashDown) {
    return {
      x: player.x + PLAYER_WIDTH / 2 - 14,
      y: player.y + PLAYER_HEIGHT - 10,
      width: 28,
      height: 30,
    };
  }

  const width = player.goldSword ? 36 : 26;
  const height = 18;
  return {
    x: player.facing > 0 ? player.x + PLAYER_WIDTH - 4 : player.x - width + 4,
    y: player.y + 10,
    width,
    height,
  };
}

function overlaps(a, b) {
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

export function drawPlayer(ctx, player) {
  ctx.save();
  ctx.translate(player.x + PLAYER_WIDTH / 2, player.y);
  ctx.scale(player.facing, 1);

  // Dark cloak with a pointed bottom.
  ctx.fillStyle = "#1c2633";
  ctx.beginPath();
  ctx.moveTo(-9, 14);
  ctx.lineTo(-11, 30);
  ctx.lineTo(0, 36);
  ctx.lineTo(11, 30);
  ctx.lineTo(9, 14);
  ctx.closePath();
  ctx.fill();

  // A lighter fold on the front, so you can see which way he faces.
  ctx.fillStyle = "#314056";
  ctx.fillRect(5, 16, 4, 14);

  // White mask.
  ctx.fillStyle = "#e6edf3";
  ctx.fillRect(-7, 8, 14, 12);

  // Two little horns.
  ctx.beginPath();
  ctx.moveTo(-6, 9);
  ctx.lineTo(-9, 0);
  ctx.lineTo(-2, 8);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(6, 9);
  ctx.lineTo(9, 0);
  ctx.lineTo(2, 8);
  ctx.closePath();
  ctx.fill();

  // Eye holes so the mask has a face.
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(-5, 12, 3, 4);
  ctx.fillRect(2, 12, 3, 4);

  ctx.restore();
}

export function getWaveBox(player, keepAfterHit) {
  if (player.waveTimer <= 0 || (player.waveHasHit && !keepAfterHit)) {
    return null;
  }

  if (player.waveDown) {
    return {
      x: player.x + PLAYER_WIDTH / 2 - 16,
      y: player.y + PLAYER_HEIGHT - 10,
      width: 32,
      height: 28,
    };
  }

  if (player.waveUp) {
    return {
      x: player.x + PLAYER_WIDTH / 2 - 16,
      y: player.y - 18,
      width: 32,
      height: 28,
    };
  }

  const width = 18;
  const height = 32;
  return {
    x: player.facing > 0
      ? player.x + PLAYER_WIDTH / 2 + 12
      : player.x + PLAYER_WIDTH / 2 - 12 - width,
    y: player.y + 2,
    width,
    height,
  };
}

export function drawWave(ctx, player) {
  if (player.waveTimer <= 0) {
    return;
  }

  if (player.goldSword) {
    const swung = WAVE_TIME - player.waveTimer;
    const swing = Math.min(1, Math.max(0, swung / SLASH_TIME));
    const aim = player.waveDown ? "down" : player.waveUp ? "up" : "side";
    drawGoldSwing(ctx, player, swing, aim);
    return;
  }

  ctx.save();
  ctx.strokeStyle = "#e6edf3";
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (player.waveDown) {
    ctx.translate(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT - 10);
    // Same half circle as the normal attack, turned to point down.
    ctx.rotate(Math.PI / 2);
    ctx.arc(12, 0, 16, -Math.PI / 2, Math.PI / 2);
  } else if (player.waveUp) {
    ctx.translate(player.x + PLAYER_WIDTH / 2, player.y + 10);
    // Same half circle, turned to point up, close to his horns.
    ctx.rotate(-Math.PI / 2);
    ctx.arc(12, 0, 16, -Math.PI / 2, Math.PI / 2);
  } else {
    ctx.translate(player.x + PLAYER_WIDTH / 2, player.y + 18);
    ctx.scale(player.facing, 1);
    // A half circle. The flat side faces the knight, and the curve points forward.
    ctx.arc(12, 0, 16, -Math.PI / 2, Math.PI / 2);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawSlash(ctx, player) {
  if (player.slashTimer <= 0) {
    return;
  }

  if (player.goldSword) {
    const swing = Math.min(1, Math.max(0, 1 - player.slashTimer / SLASH_TIME));
    drawGoldSwing(ctx, player, swing, player.slashDown ? "down" : "side");
    return;
  }

  ctx.save();
  ctx.strokeStyle = "#e6edf3";
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (player.slashDown) {
    ctx.translate(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT - 10);
    // Same sword curve as the normal attack, turned to point down.
    ctx.rotate(Math.PI / 2);
    ctx.arc(16, 0, 14, -1.1, 1.1);
  } else {
    ctx.translate(player.x + PLAYER_WIDTH / 2, player.y + 18);
    ctx.scale(player.facing, 1);
    ctx.arc(16, 0, 14, -1.1, 1.1);
  }
  ctx.stroke();
  ctx.restore();
}

// Blade points up. The hand holds the sword near the guard.
function drawHeldSword(ctx) {
  ctx.fillStyle = "#e6edf3";
  ctx.fillRect(-3, -26, 6, 28);
  ctx.fillStyle = "#e6c35c";
  ctx.fillRect(-10, 0, 20, 4);
  ctx.fillStyle = "#6b4423";
  ctx.fillRect(-2, 4, 4, 8);
  ctx.fillStyle = "#e6c35c";
  ctx.fillRect(-4, 12, 8, 3);
}

// The chest sword sweeps through the attack: thick gray, thin yellow edge.
function drawGoldSwing(ctx, player, swing, aim) {
  const angle = -0.6 + 2.6 * swing;

  ctx.save();
  if (aim === "down") {
    ctx.translate(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT - 6);
    ctx.rotate(Math.PI / 2);
  } else if (aim === "up") {
    ctx.translate(player.x + PLAYER_WIDTH / 2, player.y + 10);
    ctx.rotate(-Math.PI / 2);
  } else {
    ctx.translate(player.x + PLAYER_WIDTH / 2, player.y + 18);
    ctx.scale(player.facing, 1);
  }

  // Thick gray swoosh, with a thin yellow edge on the outside.
  const arcStart = -0.6 - Math.PI / 2;
  const arcEnd = angle - Math.PI / 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.strokeStyle = "#9aa0a6";
  ctx.lineWidth = 8;
  ctx.arc(0, 0, 28, arcStart, arcEnd);
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = "#ffe14a";
  ctx.lineWidth = 2;
  ctx.arc(0, 0, 33, arcStart, arcEnd);
  ctx.stroke();

  ctx.save();
  ctx.rotate(angle);
  ctx.translate(0, -8);
  drawHeldSword(ctx);
  ctx.restore();
  ctx.restore();
}

// The sword that pops out of the chest. The blade points up.
export function drawSwordItem(ctx, item) {
  const bob = item.vy === 0 ? Math.sin(item.age * 5) * 3 : 0;
  ctx.save();
  ctx.translate(item.x, item.y + bob);
  drawHeldSword(ctx);
  ctx.restore();
}

// Soul gathers around the knight, then bursts out when a heart comes back.
export function drawHeal(ctx, player) {
  const gathering = player.healHold > 0;
  const bursting = player.healFlash > 0;
  if (!gathering && !bursting) {
    return;
  }

  const cx = player.x + PLAYER_WIDTH / 2;
  const cy = player.y + 16;
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = 2;

  if (gathering) {
    const t = player.healHold / HEAL_TIME;
    const spin = player.healHold * 16;
    ctx.globalAlpha = 0.45 + t * 0.45;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 16, 22 - t * 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    for (let i = 0; i < HEAL_BITS; i += 1) {
      const angle = spin + (i / HEAL_BITS) * Math.PI * 2;
      const reach = 26 - t * 14;
      const px = cx + Math.cos(angle) * reach;
      const py = cy + Math.sin(angle) * reach * 0.75;
      ctx.fillRect(px - 2, py - 2, 4, 4);
    }
  }

  if (bursting) {
    const k = player.healFlash / HEAL_FLASH;
    ctx.globalAlpha = Math.max(k, 0);
    ctx.beginPath();
    ctx.ellipse(cx, cy, 12 + (1 - k) * 22, 14 + (1 - k) * 26, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

// How long the ball grows above the knight before it flies.
export const BALL_CHARGE = 0.5;

// A white ball grows in place, with a ring spinning around it.
export function drawBallCharge(ctx, x, y, timeLeft) {
  if (timeLeft <= 0) {
    return;
  }
  const t = 1 - timeLeft / BALL_CHARGE;
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(x, y, 12 - t * 4, t * 10, t * 10 + Math.PI * 1.5);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(x, y, 2 + t * 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
