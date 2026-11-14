// Remembers which keys are held down right now.

const held = new Set();
let jumpWasHeld = false;
let swordWasHeld = false;
let waveWasHeld = false;
let respawnWasHeld = false;
let dashWasHeld = false;
let mouseDown = false;
let mouseWasDown = false;
let rightMouseDown = false;
let rightMouseWasDown = false;

window.addEventListener("keydown", (event) => {
  held.add(event.code);

  // Space would scroll the page. Keep it for jumping instead.
  if (event.code === "Space" || event.code === "ArrowLeft" || event.code === "ArrowRight" || event.code === "ArrowDown") {
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  held.delete(event.code);
});

window.addEventListener("mousedown", (event) => {
  if (event.button === 0) {
    mouseDown = true;
  }
  if (event.button === 2) {
    rightMouseDown = true;
  }
});

window.addEventListener("mouseup", (event) => {
  if (event.button === 0) {
    mouseDown = false;
  }
  if (event.button === 2) {
    rightMouseDown = false;
  }
});

// A right click would open a menu on top of the game. Keep it for lightning.
window.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

export function isLeftHeld() {
  return held.has("ArrowLeft") || held.has("KeyA");
}

export function isRightHeld() {
  return held.has("ArrowRight") || held.has("KeyD");
}

export function isJumpHeld() {
  return held.has("Space") || held.has("KeyW");
}

export function isDownHeld() {
  return held.has("KeyS") || held.has("ArrowDown");
}

export function isUpHeld() {
  return held.has("KeyW");
}

// True only on the frame the jump key goes down, so holding it does not bounce.
export function jumpJustPressed() {
  const heldNow = isJumpHeld();
  const pressed = heldNow && !jumpWasHeld;
  jumpWasHeld = heldNow;
  return pressed;
}

export function swordJustPressed() {
  const heldNow = held.has("KeyX") || held.has("KeyZ");
  const pressed = heldNow && !swordWasHeld;
  swordWasHeld = heldNow;
  return pressed;
}

export function waveJustPressed() {
  const heldNow = held.has("KeyE");
  const pressed = heldNow && !waveWasHeld;
  waveWasHeld = heldNow;
  return pressed;
}

export function dashJustPressed() {
  const heldNow = held.has("KeyF");
  const pressed = heldNow && !dashWasHeld;
  dashWasHeld = heldNow;
  return pressed;
}

export function respawnJustPressed() {
  const heldNow = held.has("KeyQ");
  const pressed = heldNow && !respawnWasHeld;
  respawnWasHeld = heldNow;
  return pressed;
}

// True only on the frame the right mouse button goes down.
export function lightningJustPressed() {
  const pressed = rightMouseDown && !rightMouseWasDown;
  rightMouseWasDown = rightMouseDown;
  return pressed;
}

// True the whole time the left mouse button is held down.
export function isLeftMouseHeld() {
  return mouseDown;
}

// True only on the frame the left mouse button goes down.
export function leftClickJustPressed() {
  const pressed = mouseDown && !mouseWasDown;
  mouseWasDown = mouseDown;
  return pressed;
}

// A click is a short press. A longer hold is for healing, not the ball.
export const BALL_CLICK = 0.3;

export function isQuickClick(heldSeconds) {
  return heldSeconds > 0 && heldSeconds < BALL_CLICK;
}
