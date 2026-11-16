// Each character is one block you can edit.
// . = empty air
// # = solid stone
// P = where the knight starts (put P in the air, just above the floor)
// E = where a bug starts (put E in the air, just above the floor)
// F = a flying enemy (it hovers in that spot, it does not drop to the floor)
// H = a hopper (put H in the air, on the floor between two platforms)
// ^ = spikes (they hurt, but the knight can jump over them)
// s = a switch (not solid). S means that same switch is on.
// T = a closed trap door. t means that door is open.
// c = a closed chest. C means that chest is open.

export const TILE_SIZE = 25;

const MAP = [
  "................................",
  "................................",
  ".............#...#..............",
  ".............#...#..............",
  ".............#.c.#..............",
  ".............#####..............",
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
// Stepping stones lead to the switch. The safe patch is a trap door.
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
  "..........##....................",
  "##........##....................",
  "##...##.........................",
  "##...##........##...............",
  "##.............##....##.........",
  "##^^^^^^^^^^^^^^^....^^^^^....s.",
  "#################TTTT###########",
  "#################TTTT###########",
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
  return line[col] === "#" || line[col] === "T";
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
      // Floor tips start a little above the ground. Ceiling tips stop a little below the stone.
      const pointingDown = isSolid(level, col, row - 1);
      const tooth = {
        x: col * TILE_SIZE + 3,
        y: row * TILE_SIZE + (pointingDown ? 0 : 8),
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

// The lever the knight is touching, so walking through it flips only once.
let heldSwitch = null;

// A switch tile under the knight, or null if he is not on one.
export function switchAt(level, box) {
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
      if (col < 0 || col >= line.length) {
        continue;
      }
      if (line[col] === "s" || line[col] === "S") {
        return { col, row };
      }
    }
  }
  return null;
}

// Flip one switch. Off is "s". On is "S". The trap door follows the switch.
export function flipSwitch(level, col, row) {
  const line = level.rows[row];
  if (line[col] === "s") {
    line[col] = "S";
  } else if (line[col] === "S") {
    line[col] = "s";
  } else {
    return;
  }
  const open = line[col] === "S";
  for (const mapRow of level.rows) {
    for (let i = 0; i < mapRow.length; i += 1) {
      if (mapRow[i] === "T" || mapRow[i] === "t") {
        mapRow[i] = open ? "t" : "T";
      }
    }
  }
}

export function useSwitch(level, box) {
  const spot = switchAt(level, box);
  const key = spot ? spot.col + ":" + spot.row : null;
  if (spot && key !== heldSwitch) {
    flipSwitch(level, spot.col, spot.row);
  }
  heldSwitch = key;
}

function drawSwitch(ctx, x, y, on) {
  // A stone block on the floor, with a metal lever and a round handle.
  const floor = y + TILE_SIZE;
  const pivotX = x + 12;
  const pivotY = floor - 16;
  ctx.fillStyle = "#2d333b";
  ctx.fillRect(x - 2, pivotY, 29, 16);
  ctx.fillStyle = "#484f58";
  ctx.fillRect(x - 2, pivotY, 29, 3);

  const angle = on ? -0.85 : Math.PI + 0.85;
  const handleX = pivotX + Math.cos(angle) * 28;
  const handleY = pivotY + Math.sin(angle) * 28;
  const metal = on ? "#e6edf3" : "#9aa0a6";

  ctx.save();
  ctx.strokeStyle = metal;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(handleX, handleY);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = metal;
  ctx.beginPath();
  ctx.arc(handleX, handleY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#9aa0a6";
  ctx.beginPath();
  ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2d333b";
  ctx.beginPath();
  ctx.arc(pivotX, pivotY, 2, 0, Math.PI * 2);
  ctx.fill();
}

function overlapsBox(a, b) {
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

function chestBox(col, row) {
  return {
    x: col * TILE_SIZE - 8,
    y: row * TILE_SIZE + 2,
    width: 41,
    height: 23,
  };
}

// A sword or wave that touches a closed chest pops the lid open.
export function hitChest(level, attackBoxes) {
  for (let row = 0; row < level.rows.length; row += 1) {
    for (let col = 0; col < level.rows[row].length; col += 1) {
      if (level.rows[row][col] !== "c") {
        continue;
      }
      const chest = chestBox(col, row);
      for (const box of attackBoxes) {
        if (box && overlapsBox(chest, box)) {
          level.rows[row][col] = "C";
          return {
            x: col * TILE_SIZE + TILE_SIZE / 2,
            y: row * TILE_SIZE + 12,
            // Floats in the open top of the box, above the knight's head.
            restY: row * TILE_SIZE - 52,
          };
        }
      }
    }
  }
}

function drawChest(ctx, x, y, open) {
  const left = x - 8;
  const top = y + 2;
  const width = 41;
  const bodyTop = top + 10;
  ctx.fillStyle = "#6b4423";
  ctx.fillRect(left, bodyTop, width, 13);
  ctx.fillStyle = "#e6c35c";
  ctx.fillRect(left, bodyTop, 4, 4);
  ctx.fillRect(left + width - 4, bodyTop, 4, 4);
  ctx.fillRect(left, bodyTop + 9, 4, 4);
  ctx.fillRect(left + width - 4, bodyTop + 9, 4, 4);
  ctx.fillRect(left, bodyTop + 5, width, 3);
  ctx.fillStyle = "#fff1c2";
  ctx.fillRect(left + 10, bodyTop + 5, 3, 3);
  ctx.fillRect(left + width - 13, bodyTop + 5, 3, 3);
  if (open) {
    ctx.save();
    ctx.translate(left, bodyTop);
    ctx.rotate(-1.15);
    ctx.fillStyle = "#8a5a2b";
    ctx.fillRect(0, -10, width, 10);
    ctx.fillStyle = "#e6c35c";
    ctx.fillRect(0, -10, width, 3);
    ctx.fillRect(0, -4, width, 2);
    ctx.fillRect(6, -8, 3, 3);
    ctx.fillRect(width - 9, -8, 3, 3);
    ctx.restore();
    ctx.fillStyle = "#e6edf3";
    ctx.fillRect(left + 16, bodyTop + 4, 9, 5);
    return;
  }
  ctx.fillStyle = "#8a5a2b";
  ctx.fillRect(left, top, width, 10);
  ctx.fillStyle = "#e6c35c";
  ctx.fillRect(left, top, width, 3);
  ctx.fillRect(left, top + 7, width, 2);
  ctx.fillRect(left + 6, top + 3, 3, 3);
  ctx.fillRect(left + width - 9, top + 3, 3, 3);
  ctx.fillRect(left + 17, top + 8, 7, 6);
  ctx.fillStyle = "#1a100c";
  ctx.fillRect(left + 19, top + 10, 3, 3);
}

function drawTrapDoor(ctx, x, y, open) {
  if (open) {
    ctx.fillStyle = "#010409";
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    return;
  }
  ctx.fillStyle = "#2d333b";
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(x + 11, y, 3, TILE_SIZE);
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
      if (level.rows[row][col] === "s" || level.rows[row][col] === "S") {
        drawSwitch(ctx, col * TILE_SIZE, row * TILE_SIZE, level.rows[row][col] === "S");
        continue;
      }
      if (level.rows[row][col] === "c" || level.rows[row][col] === "C") {
        drawChest(ctx, col * TILE_SIZE, row * TILE_SIZE, level.rows[row][col] === "C");
        continue;
      }
      if (level.rows[row][col] === "T" || level.rows[row][col] === "t") {
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;
        drawTrapDoor(ctx, x, y, level.rows[row][col] === "t");
        if (level.rows[row][col] === "T" && !isSolid(level, col, row - 1)) {
          ctx.fillStyle = "#484f58";
          ctx.fillRect(x, y, TILE_SIZE, 4);
        }
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
