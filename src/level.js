// Each character is one block you can edit.
// . = empty air
// # = solid stone
// P = where the knight starts (put P in the air, just above the floor)
// E = where a bug starts (put E in the air, just above the floor)
// F = a flying enemy (it hovers in that spot, it does not drop to the floor)
// H = a hopper (put H in the air, on the floor between two platforms)
// ^ = spikes (they hurt, but the knight can jump over them)

export const TILE_SIZE = 25;

const MAP = [
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "...............F................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "............#######.............",
  "............#######.............",
  "..P.........#######.......E.....",
  "################################",
  "################################",
];

// A second screen. Empty air, with a floor so the knight can stand.
const BLANK = [
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  ".............F..............F...",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "............###............###..",
  "............###............###..",
  "............###.....H......###..",
  "################################",
  "################################",
];

export function createLevel() {
  return buildLevel(MAP);
}

export function createBlankRoom() {
  return buildLevel(BLANK);
}

// A third screen, to the left of the cave. Stairs go up to the left.
const CLIMB = [
  "................................",
  "................................",
  "................................",
  "................................",
  ".######.........................",
  ".######.........................",
  "................................",
  "..........####..................",
  "..........####..................",
  "................................",
  ".................####...........",
  ".................####...........",
  "................................",
  "........................####....",
  "................................",
  "................................",
  "################################",
  "################################",
];

export function createClimbRoom() {
  return buildLevel(CLIMB);
}

// Above the stairs. The hole on the left drops back onto the highest step.
// One floor wall stands before the spikes. Another stands after them.
const UPPER = [
  "...................##...........",
  "...................##...........",
  "...................##...........",
  "...................##...........",
  "...................##...........",
  "...................##...........",
  "...................##...........",
  "...................##...........",
  "...................##...........",
  "...................##...........",
  "...................##...........",
  "...........##......##.........##",
  "...........##......^^.........##",
  "...........##.................##",
  "...........##.................##",
  "...........##......^^.........##",
  "#......#########################",
  "#......#########################",
];

export function createUpperRoom() {
  return buildLevel(UPPER);
}

// The second upper room, to the right of the first one.
// Only the wall that meets the stone on the other screen.
const RIGHT = [
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "##..............................",
  "##..............................",
  "##..............................",
  "##..............................",
  "##..............................",
  "################################",
  "################################",
];

export function createRightRoom() {
  return buildLevel(RIGHT);
}

function buildLevel(source) {
  const rows = source.map((row) => row.split(""));
  let spawnX = 50;
  let spawnFeetY = 400;
  const enemies = [];

  for (let row = 0; row < rows.length; row += 1) {
    for (let col = 0; col < rows[row].length; col += 1) {
      const cell = rows[row][col];
      if (cell === "F") {
        enemies.push({
          kind: "flyer",
          x: col * TILE_SIZE,
          y: row * TILE_SIZE,
        });
        rows[row][col] = ".";
        continue;
      }
      if (cell !== "P" && cell !== "E" && cell !== "H") {
        continue;
      }

      // Stand on the first stone block below this marker.
      let feetRow = row + 1;
      while (feetRow < rows.length && rows[feetRow][col] !== "#") {
        feetRow += 1;
      }

      const spot = { x: col * TILE_SIZE, feetY: feetRow * TILE_SIZE };
      if (cell === "P") {
        spawnX = spot.x;
        spawnFeetY = spot.feetY;
      } else if (cell === "H") {
        enemies.push({ kind: "hopper", x: spot.x, feetY: spot.feetY });
      } else {
        enemies.push(spot);
      }
      rows[row][col] = ".";
    }
  }

  return { rows, spawnX, spawnFeetY, enemies };
}

// The top of the tallest stone the knight can stand on.
export function findHighPlatform(level) {
  let top = null;
  let left = 0;
  let right = 0;

  for (let row = 0; row < level.rows.length; row += 1) {
    for (let col = 0; col < level.rows[row].length; col += 1) {
      if (!isSolid(level, col, row) || isSolid(level, col, row - 1)) {
        continue;
      }

      const y = row * TILE_SIZE;
      // A ceiling block is too high to stand on. Keep the floor as the respawn spot.
      if (y < 40) {
        continue;
      }
      const x = col * TILE_SIZE;
      if (top === null || y < top) {
        top = y;
        left = x;
        right = x + TILE_SIZE;
      } else if (y === top) {
        if (x < left) {
          left = x;
        }
        if (x + TILE_SIZE > right) {
          right = x + TILE_SIZE;
        }
      }
    }
  }

  return { top, centerX: (left + right) / 2 };
}

function isSolid(level, col, row) {
  if (row < 0 || col < 0 || row >= level.rows.length) {
    return false;
  }
  const line = level.rows[row];
  if (col >= line.length) {
    return false;
  }
  return line[col] === "#";
}

// Blocks that touch this rectangle. Used so the knight bumps into stone.
export function tilesTouching(level, box) {
  const tiles = [];
  const colStart = Math.floor(box.x / TILE_SIZE);
  const colEnd = Math.floor((box.x + box.width - 0.01) / TILE_SIZE);
  const rowStart = Math.floor(box.y / TILE_SIZE);
  const rowEnd = Math.floor((box.y + box.height - 0.01) / TILE_SIZE);

  for (let row = rowStart; row <= rowEnd; row += 1) {
    for (let col = colStart; col <= colEnd; col += 1) {
      if (!isSolid(level, col, row)) {
        continue;
      }
      tiles.push({
        x: col * TILE_SIZE,
        y: row * TILE_SIZE,
        width: TILE_SIZE,
        height: TILE_SIZE,
      });
    }
  }

  return tiles;
}

export function touchesSpike(level, box) {
  const colStart = Math.floor(box.x / TILE_SIZE);
  const colEnd = Math.floor((box.x + box.width - 0.01) / TILE_SIZE);
  const rowStart = Math.floor(box.y / TILE_SIZE);
  const rowEnd = Math.floor((box.y + box.height - 0.01) / TILE_SIZE);

  for (let row = rowStart; row <= rowEnd; row += 1) {
    if (row < 0 || row >= level.rows.length) {
      continue;
    }
    const line = level.rows[row];
    for (let col = colStart; col <= colEnd; col += 1) {
      if (col < 0 || col >= line.length || line[col] !== "^") {
        continue;
      }
      // The tips start a little above the floor, so a jump can clear them.
      const tooth = {
        x: col * TILE_SIZE + 3,
        y: row * TILE_SIZE + 8,
        width: TILE_SIZE - 6,
        height: TILE_SIZE - 8,
      };
      const hit = box.x < tooth.x + tooth.width
        && box.x + box.width > tooth.x
        && box.y < tooth.y + tooth.height
        && box.y + box.height > tooth.y;
      if (hit) {
        return true;
      }
    }
  }
  return false;
}

function drawSpike(ctx, x, y, pointingDown) {
  const base = pointingDown ? y : y + TILE_SIZE;
  const tip = pointingDown ? y + TILE_SIZE - 8 : y + 8;
  ctx.fillStyle = "#e6edf3";
  ctx.beginPath();
  ctx.moveTo(x + 4, base);
  ctx.lineTo(x + 8, tip);
  ctx.lineTo(x + 12, base);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 13, base);
  ctx.lineTo(x + 17, tip);
  ctx.lineTo(x + 21, base);
  ctx.fill();
}

export function drawLevel(ctx, level) {
  for (let row = 0; row < level.rows.length; row += 1) {
    for (let col = 0; col < level.rows[row].length; col += 1) {
      if (level.rows[row][col] === "^") {
        const pointingDown = isSolid(level, col, row - 1);
        drawSpike(ctx, col * TILE_SIZE, row * TILE_SIZE, pointingDown);
        continue;
      }
      if (level.rows[row][col] !== "#") {
        continue;
      }

      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;
      ctx.fillStyle = "#2d333b";
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

      // A lighter top edge where the block meets open air.
      if (!isSolid(level, col, row - 1)) {
        ctx.fillStyle = "#484f58";
        ctx.fillRect(x, y, TILE_SIZE, 4);
      }
    }
  }
}
