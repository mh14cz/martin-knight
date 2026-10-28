import { tilesTouching } from "./level.js";

const BUG_WIDTH = 22;
const BUG_HEIGHT = 16;
const BUG_SPEED = 90;
const BOUNCE_SPEED = 280;
const BOUNCE_TIME = 0.2;

export function createBug(startX, feetY) {
  return {
    x: startX,
    y: feetY - BUG_HEIGHT,
    vx: BUG_SPEED,
    facing: 1,
    bounceTimer: 0,
  };
}

export function bounceBug(bug, direction) {
  bug.facing = direction;
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
    turn(bug, -1);
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
      turn(bug, -1);
    } else if (bug.vx < 0) {
      bug.x = tile.x + tile.width;
      turn(bug, 1);
    }
    body.x = bug.x;
  }
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
