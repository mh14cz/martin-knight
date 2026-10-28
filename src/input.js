// Remembers which keys are held down right now.

const held = new Set();
let jumpWasHeld = false;
let swordWasHeld = false;
let waveWasHeld = false;

window.addEventListener("keydown", (event) => {
  held.add(event.code);

  // Space would scroll the page. Keep it for jumping instead.
  if (event.code === "Space" || event.code === "ArrowLeft" || event.code === "ArrowRight") {
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  held.delete(event.code);
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
