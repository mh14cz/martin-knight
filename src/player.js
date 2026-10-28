import { isLeftHeld, isRightHeld, isJumpHeld, jumpJustPressed, swordJustPressed, waveJustPressed } from "./input.js";
import { tilesTouching } from "./level.js";

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

export function createPlayer(startX, groundY) {
  return {
    x: startX,
    y: groundY - PLAYER_HEIGHT,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: true,
    slashTimer: 0,
    waveTimer: 0,
    waveHasHit: false,
    attackCooldown: 0,
    slashHasHit: false,
    knockTimer: 0,
    knockDir: 0,
    health: 8,
    hurtTimer: 0,
  };
}

export function placePlayer(player, centerX, feetY) {
  player.x = centerX - PLAYER_WIDTH / 2;
  player.y = feetY - PLAYER_HEIGHT;
  player.vx = 0;
  player.vy = 0;
  player.onGround = true;
}

export function getPlayerBox(player) {
  return {
    x: player.x,
    y: player.y,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
  };
}

// One touch takes one circle. The timer stops the next hit for a moment.
export function hurtPlayer(player) {
  if (player.hurtTimer > 0 || player.health <= 0) {
    return;
  }
  player.health -= 1;
  player.hurtTimer = 1;
}

export function updatePlayer(player, level, canvasWidth, deltaTime) {
  const left = isLeftHeld();
  const right = isRightHeld();

  if (player.knockTimer > 0) {
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

  if (jumpJustPressed() && player.onGround) {
    player.vy = JUMP_SPEED;
    player.onGround = false;
  }

  if (swordJustPressed() && player.attackCooldown <= 0) {
    player.slashTimer = SLASH_TIME;
    player.attackCooldown = SLASH_COOLDOWN;
    player.slashHasHit = false;
  }

  if (waveJustPressed()) {
    player.waveTimer = WAVE_TIME;
    player.waveHasHit = false;
  }

  // Letting go early cuts the climb, so a tap is a short hop.
  if (player.vy < SHORT_HOP_SPEED && !isJumpHeld()) {
    player.vy = SHORT_HOP_SPEED;
  }

  moveX(player, level, deltaTime);
  moveY(player, level, deltaTime);
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

  const width = 26;
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

export function getWaveBox(player) {
  if (player.waveTimer <= 0 || player.waveHasHit) {
    return null;
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

  ctx.save();
  ctx.translate(player.x + PLAYER_WIDTH / 2, player.y + 18);
  ctx.scale(player.facing, 1);
  ctx.strokeStyle = "#e6edf3";
  ctx.lineWidth = 3;
  ctx.beginPath();
  // A half circle. The flat side faces the knight, and the curve points forward.
  ctx.arc(12, 0, 16, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.restore();
}

export function drawSlash(ctx, player) {
  if (player.slashTimer <= 0) {
    return;
  }

  ctx.save();
  ctx.translate(player.x + PLAYER_WIDTH / 2, player.y + 18);
  ctx.scale(player.facing, 1);
  ctx.strokeStyle = "#e6edf3";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(16, 0, 14, -1.1, 1.1);
  ctx.stroke();
  ctx.restore();
}
