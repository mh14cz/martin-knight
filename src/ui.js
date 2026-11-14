const MAX_HEALTH = 8;
const HEART_RADIUS = 8;
const HEART_GAP = 6;

// How many hits it takes to fill the special meter.
export const SPECIAL_MAX = 10;

// Eight white circles in one row across the top middle of the screen.
export function drawHealth(ctx, canvasWidth, health) {
  const step = HEART_RADIUS * 2 + HEART_GAP;
  const rowWidth = MAX_HEALTH * step - HEART_GAP;
  let x = (canvasWidth - rowWidth) / 2 + HEART_RADIUS;
  const y = 20;

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;

  for (let i = 0; i < MAX_HEALTH; i += 1) {
    if (i < health) {
      ctx.beginPath();
      ctx.arc(x, y, HEART_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    x += step;
  }
}

// A white bar on the far right, level with the hearts. Each hit fills one block.
export function drawSpecial(ctx, canvasWidth, special) {
  const y = 12;
  const block = 14;
  const gap = 4;
  const width = SPECIAL_MAX * block + (SPECIAL_MAX - 1) * gap;
  const x = canvasWidth - 16 - width;
  const height = 16;

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);

  for (let i = 0; i < SPECIAL_MAX; i += 1) {
    ctx.fillStyle = i < special ? "#ffffff" : "#2d333b";
    ctx.fillRect(x + i * (block + gap), y, block, height);
  }

  // Gray until the bar is full. Then the circle and the dive mark turn white.
  const circleX = x + width / 2;
  const circleY = y + height + 18;
  const mark = special >= SPECIAL_MAX ? "#ffffff" : "#9aa0a6";
  ctx.strokeStyle = mark;
  ctx.fillStyle = mark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(circleX, circleY, 10, 0, Math.PI * 2);
  ctx.stroke();

  // A gray dive mark: a shock ring and a point dropping down.
  ctx.beginPath();
  ctx.arc(circleX, circleY - 1, 5, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(circleX - 4, circleY - 1);
  ctx.lineTo(circleX, circleY + 6);
  ctx.lineTo(circleX + 4, circleY - 1);
  ctx.closePath();
  ctx.fill();

  // The ball circle sits to the left of the dive icon.
  // The whole circle turns white once the bar reaches 5.
  const nextX = circleX - 56;
  const second = special >= 5 ? "#ffffff" : "#9aa0a6";
  ctx.strokeStyle = second;
  ctx.beginPath();
  ctx.arc(nextX, circleY, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = second;
  ctx.beginPath();
  ctx.arc(nextX, circleY, 4, 0, Math.PI * 2);
  ctx.fill();

  // The final ability circle, to the right of the dive icon.
  // With 1 point or more, the circle and the plus turn white.
  const plusX = circleX + 56;
  const plusColor = special >= 1 ? "#ffffff" : "#9aa0a6";
  ctx.strokeStyle = plusColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(plusX, circleY, 10, 0, Math.PI * 2);
  ctx.stroke();
  // A little plus in the middle of the circle.
  ctx.beginPath();
  ctx.moveTo(plusX - 4, circleY);
  ctx.lineTo(plusX + 4, circleY);
  ctx.moveTo(plusX, circleY - 4);
  ctx.lineTo(plusX, circleY + 4);
  ctx.stroke();
}

// One hit adds one block. A full meter stays full.
export function chargeSpecial(player) {
  if (player.special < SPECIAL_MAX) {
    player.special += 1;
  }
}

// Counts frames for a quarter of a second, then shows that speed as FPS.

let frameCount = 0;
let timeBank = 0;
let fps = 0;

export function drawFps(ctx, deltaTime) {
  frameCount += 1;
  timeBank += deltaTime;

  if (timeBank >= 0.25) {
    fps = Math.round(frameCount / timeBank);
    frameCount = 0;
    timeBank = 0;
  }

  ctx.fillStyle = "#e6edf3";
  ctx.font = "16px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("FPS: " + fps, 12, 10);
}
