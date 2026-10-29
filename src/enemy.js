import { tilesTouching } from "./level.js?v=31";

const BUG_WIDTH = 22;
const BUG_HEIGHT = 16;
const BUG_SPEED = 90;
const BOUNCE_SPEED = 280;
const BOUNCE_TIME = 0.2;

export function createBug(startX, feetY) {
  return {
    x: startX,
    y: feetY - BUG_HEIGHT,
    homeX: startX,
    homeY: feetY - BUG_HEIGHT,
    vx: BUG_SPEED,
    facing: 1,
    bounceTimer: 0,
    health: 2,
    maxHealth: 2,
  };
}

export function respawnEnemy(enemy) {
  enemy.x = enemy.homeX;
  enemy.y = enemy.homeY;
  enemy.health = enemy.maxHealth;
  enemy.vx = enemy.kind === "flyer" || enemy.kind === "hopper" ? 0 : BUG_SPEED;
  enemy.facing = 1;
  enemy.bounceTimer = 0;
  enemy.hitTimer = 0;
  enemy.returning = false;
  if (enemy.kind === "hopper") {
    enemy.vy = 0;
    enemy.onGround = true;
    enemy.wait = 0.35;
  }
}

export function bounceBug(bug, direction) {
  // Push him away, but keep the direction he was already walking.
  bug.vx = direction * BOUNCE_SPEED;
  bug.bounceTimer = BOUNCE_TIME;
}

export function updateBug(bug, level, canvasWidth, deltaTime) {
  if (bug.bounceTimer > 0) {
    bug.bounceTimer -= deltaTime;
    if (bug.bounceTimer <= 0) {
      bug.vx = bug.facing * BUG_SPEED;
    }
  }

  bug.x += bug.vx * deltaTime;

  // The right edge of the screen sends the bug back toward the stone.
  if (bug.x + BUG_WIDTH >= canvasWidth) {
    bug.x = canvasWidth - BUG_WIDTH;
    if (bug.bounceTimer > 0) {
      bug.vx = 0;
    } else {
      turn(bug, -1);
    }
  }

  // The body box stays above the floor, so only a wall can turn the bug.
  const body = {
    x: bug.x,
    y: bug.y + 2,
    width: BUG_WIDTH,
    height: BUG_HEIGHT - 6,
  };

  for (const tile of tilesTouching(level, body)) {
    if (!overlaps(body, tile)) {
      continue;
    }
    if (bug.vx > 0) {
      bug.x = tile.x - BUG_WIDTH;
      stopOrTurn(bug, -1);
    } else if (bug.vx < 0) {
      bug.x = tile.x + tile.width;
      stopOrTurn(bug, 1);
    }
    body.x = bug.x;
  }
}

function stopOrTurn(bug, direction) {
  // A bounce only stops him at the stone. He turns when he walks into it.
  if (bug.bounceTimer > 0) {
    bug.vx = 0;
    return;
  }
  turn(bug, direction);
}

function turn(bug, direction) {
  bug.facing = direction;
  bug.vx = direction * BUG_SPEED;
}

export function bugTouches(bug, playerBox) {
  return overlaps(
    { x: bug.x, y: bug.y, width: BUG_WIDTH, height: BUG_HEIGHT },
    playerBox
  );
}

function overlaps(a, b) {
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

const HOVER_BOB = 8;
const POP_HEIGHT = 40;
const POP_TIME = 0.2;
const RETURN_SPEED = 70;

export function createFlyer(x, y) {
  return {
    kind: "flyer",
    x,
    y,
    homeX: x,
    homeY: y,
    time: 0,
    facing: 1,
    vx: 0,
    bounceTimer: 0,
    hitTimer: 0,
    returning: false,
    health: 3,
    maxHealth: 3,
  };
}

export function hitFlyer(flyer) {
  if (flyer.hitTimer > 0) {
    return;
  }
  flyer.hitTimer = POP_TIME;
  flyer.returning = false;
}

export function updateFlyer(flyer, deltaTime) {
  flyer.time += deltaTime;
  flyer.x = flyer.homeX;
  const hoverY = flyer.homeY + Math.sin(flyer.time * 2) * HOVER_BOB;

  if (flyer.hitTimer > 0) {
    flyer.hitTimer -= deltaTime;
    // Pop upward and hang there for a moment.
    const gone = POP_TIME - Math.max(flyer.hitTimer, 0);
    const rise = Math.min(gone / 0.08, 1);
    flyer.y = flyer.homeY - POP_HEIGHT * rise;
    if (flyer.hitTimer <= 0) {
      flyer.returning = true;
    }
    return;
  }

  if (flyer.returning) {
    // Float back down to the hover spot instead of jumping there.
    const dy = hoverY - flyer.y;
    const step = RETURN_SPEED * deltaTime;
    if (Math.abs(dy) <= step) {
      flyer.y = hoverY;
      flyer.returning = false;
    } else {
      flyer.y += Math.sign(dy) * step;
    }
    return;
  }

  flyer.y = hoverY;
}

export function drawFlyer(ctx, flyer) {
  ctx.save();
  ctx.translate(flyer.x + BUG_WIDTH / 2, flyer.y + BUG_HEIGHT / 2);

  const flap = Math.sin(flyer.time * 10) * 4;
  ctx.fillStyle = "#9a8ad4";
  ctx.beginPath();
  ctx.ellipse(-9, flap, 8, 3, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(9, -flap, 8, 3, 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#d7ccf5";
  ctx.beginPath();
  ctx.ellipse(0, 0, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1a100c";
  ctx.fillRect(-3, -2, 2, 2);
  ctx.fillRect(2, -2, 2, 2);

  ctx.restore();
}

export function drawEnemyHealth(ctx, enemy) {
  if (enemy.health <= 0) {
    return;
  }

  const pip = 6;
  const gap = 2;
  const total = enemy.maxHealth * pip + (enemy.maxHealth - 1) * gap;
  let x = enemy.x + BUG_WIDTH / 2 - total / 2;
  const y = enemy.y - 8;

  for (let i = 0; i < enemy.maxHealth; i += 1) {
    ctx.fillStyle = i < enemy.health ? "#e6edf3" : "#484f58";
    ctx.fillRect(x, y, pip, 4);
    x += pip + gap;
  }
}

export function drawBug(ctx, bug) {
  ctx.save();
  ctx.translate(bug.x + BUG_WIDTH / 2, bug.y + BUG_HEIGHT / 2);
  ctx.scale(bug.facing, 1);

  ctx.fillStyle = "#d06a32";
  ctx.beginPath();
  ctx.ellipse(0, 1, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e6a06a";
  ctx.fillRect(-4, 1, 8, 3);

  // A little antenna on the front.
  ctx.strokeStyle = "#d06a32";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(5, -2);
  ctx.lineTo(10, -8);
  ctx.stroke();

  ctx.fillStyle = "#1a100c";
  ctx.fillRect(4, -2, 3, 3);

  ctx.restore();
}

const bits = [];
const MAX_BITS = 25;

export function explodeAt(x, y) {
  const count = 6;
  for (let i = 0; i < count; i += 1) {
    if (bits.length >= MAX_BITS) {
      return;
    }
    const angle = (Math.PI * 2 * i) / count;
    bits.push({
      x,
      y,
      vx: Math.cos(angle) * 90,
      vy: Math.sin(angle) * 90,
      life: 0.3,
    });
  }
}

export function updateExplosions(deltaTime) {
  for (let i = bits.length - 1; i >= 0; i -= 1) {
    const bit = bits[i];
    bit.life -= deltaTime;
    if (bit.life <= 0) {
      bits.splice(i, 1);
      continue;
    }
    bit.x += bit.vx * deltaTime;
    bit.y += bit.vy * deltaTime;
  }
}

export function drawExplosions(ctx) {
  for (const bit of bits) {
    const size = bit.life > 0.15 ? 4 : 2;
    ctx.fillStyle = "#e6edf3";
    ctx.fillRect(bit.x, bit.y, size, size);
  }
}

const HOP_WIDTH = 22;
const HOP_HEIGHT = 16;
const HOP_GRAVITY = 1200;
const HOP_WAIT = 0.22;
const HOP_TIME = 0.42;
const HOP_STEP = 90;

export function createHopper(startX, feetY) {
  return {
    kind: "hopper",
    x: startX,
    y: feetY - HOP_HEIGHT,
    homeX: startX,
    homeY: feetY - HOP_HEIGHT,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: true,
    wait: 0.4,
    health: 2,
    maxHealth: 2,
    bounceTimer: 0,
    hitTimer: 0,
    returning: false,
  };
}

function shortPlatforms(level) {
  const spots = [];
  const floorRow = level.rows.length - 2;
  for (let row = 0; row < floorRow; row += 1) {
    let col = 0;
    const line = level.rows[row];
    while (col < line.length) {
      const above = row > 0 ? level.rows[row - 1][col] : ".";
      if (line[col] !== "#" || above === "#") {
        col += 1;
        continue;
      }
      const start = col;
      while (col < line.length && line[col] === "#" && (row === 0 || level.rows[row - 1][col] !== "#")) {
        col += 1;
      }
      const width = (col - start) * 25;
      // Skip the long floor. Keep the short platforms he can hop between.
      if (width > 0 && width < 200) {
        spots.push({ x: start * 25, width, top: row * 25 });
      }
    }
  }
  return spots;
}

function gapBetweenPlatforms(level) {
  const spots = shortPlatforms(level);
  if (spots.length < 2) {
    return null;
  }
  spots.sort((a, b) => a.x - b.x);
  const left = spots[0];
  const right = spots[spots.length - 1];
  return { left: left.x + left.width, right: right.x };
}

function hopInGap(hopper, level) {
  const gap = gapBetweenPlatforms(level);
  if (!gap) {
    return;
  }

  const minX = gap.left;
  const maxX = gap.right - HOP_WIDTH;
  let landX = hopper.x + hopper.facing * HOP_STEP;
  const pastEdge = landX < minX || landX + HOP_WIDTH > gap.right;
  const atRight = hopper.x >= maxX - 4;
  const atLeft = hopper.x <= minX + 4;
  if (pastEdge && ((hopper.facing > 0 && atRight) || (hopper.facing < 0 && atLeft))) {
    hopper.facing *= -1;
    landX = hopper.x + hopper.facing * HOP_STEP;
  }
  landX = Math.min(maxX, Math.max(minX, landX));

  hopper.vx = (landX - hopper.x) / HOP_TIME;
  hopper.vy = -0.5 * HOP_GRAVITY * HOP_TIME;
  hopper.onGround = false;
}

export function updateHopper(hopper, level, canvasWidth, deltaTime) {
  if (hopper.onGround) {
    hopper.vx = 0;
    hopper.vy = 0;
    hopper.wait -= deltaTime;
    if (hopper.wait <= 0) {
      hopInGap(hopper, level);
    }
    return;
  }

  hopper.vy += HOP_GRAVITY * deltaTime;
  const yBefore = hopper.y;
  hopper.x += hopper.vx * deltaTime;
  hopper.y += hopper.vy * deltaTime;

  const gap = gapBetweenPlatforms(level);
  if (gap) {
    if (hopper.x < gap.left) {
      hopper.x = gap.left;
    }
    if (hopper.x + HOP_WIDTH > gap.right) {
      hopper.x = gap.right - HOP_WIDTH;
    }
  }

  const body = {
    x: hopper.x + 1,
    y: hopper.y,
    width: HOP_WIDTH - 2,
    height: HOP_HEIGHT,
  };
  for (const tile of tilesTouching(level, body)) {
    if (!overlaps(body, tile)) {
      continue;
    }
    const wasAbove = yBefore + HOP_HEIGHT <= tile.y + 2;
    if (hopper.vy > 0 && wasAbove) {
      hopper.y = tile.y - HOP_HEIGHT;
      hopper.vy = 0;
      hopper.vx = 0;
      hopper.onGround = true;
      hopper.wait = HOP_WAIT;
      return;
    }
  }
}

export function drawHopper(ctx, hopper) {
  ctx.save();
  ctx.translate(hopper.x + HOP_WIDTH / 2, hopper.y + HOP_HEIGHT / 2);
  ctx.scale(hopper.facing, 1);

  ctx.fillStyle = "#2f8f45";
  ctx.beginPath();
  ctx.ellipse(0, 1, 9, hopper.onGround ? 6 : 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#8fd18a";
  ctx.fillRect(-4, 2, 8, 3);

  ctx.fillStyle = "#10210f";
  ctx.fillRect(3, -3, 3, 3);

  ctx.restore();
}
