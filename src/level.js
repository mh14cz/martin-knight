// Each character is one block you can edit.
// . = empty air
// # = solid stone
// P = where the knight starts (put P in the air, just above the floor)
// E = where a bug starts (put E in the air, just above the floor)

export const TILE_SIZE = 25;

const MAP = [
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
  "................................",
  "................................",
  "............#######.............",
  "............#######.............",
  "..P.........#######.......E.....",
  "################################",
  "################################",
];

export function createLevel() {
  const rows = MAP.map((row) => row.split(""));
  let spawnX = 50;
  let spawnFeetY = 400;
  const enemies = [];

  for (let row = 0; row < rows.length; row += 1) {
    for (let col = 0; col < rows[row].length; col += 1) {
      const cell = rows[row][col];
      if (cell !== "P" && cell !== "E") {
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

export function drawLevel(ctx, level) {
  for (let row = 0; row < level.rows.length; row += 1) {
    for (let col = 0; col < level.rows[row].length; col += 1) {
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
