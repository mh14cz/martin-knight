const MAX_HEALTH = 8;

// Eight white circles in one row across the top middle of the screen.
export function drawHealth(ctx, canvasWidth, health) {
  const radius = 8;
  const gap = 6;
  const step = radius * 2 + gap;
  const rowWidth = MAX_HEALTH * step - gap;
  let x = (canvasWidth - rowWidth) / 2 + radius;
  const y = 20;

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;

  for (let i = 0; i < MAX_HEALTH; i += 1) {
    if (i < health) {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    x += step;
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
