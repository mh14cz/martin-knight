# AGENTS_GRAPHICS.md - Atmosphere & Performance

1. **Hollow Knight Atmosphere with Simple Code:**
   - Use a dark, moody color palette: deep cave blues (`#0d1117`, `#161b22`), glowing cyan/white for the knight and soul effects (`#e6edf3`, `#58a6ff`), and crimson/orange for hazards (`#ff4444`).

2. **Strict Intel HD Graphics Optimization:**
   - Never use CSS filters or canvas `shadowBlur`. To create a "glow" effect, simply draw a slightly larger semi-transparent circle (`globalAlpha = 0.2`) behind the object.
   - Keep canvas resolution around `800x450` (16:9 ratio) and scale it up with CSS (`image-rendering: pixelated`). This guarantees a locked 60 FPS on integrated graphics.

3. Low-Spec Hardware Safeguards (Dell Latitude 5480 / Intel HD)
- **Opaque Canvas Context:** Always initialize the canvas with `const ctx = canvas.getContext('2d', { alpha: false });` to bypass browser alpha-compositing overhead on Linux Mint and Windows.
- **Delta-Time Clamping:** Always calculate `deltaTime` between frames and clamp it to a maximum of `0.05` seconds (20 FPS minimum threshold) so that if a frame ever drops, the player does not teleport through floors or walls.
- **Object Pooling / Culling:** Only draw tiles and enemies that are currently inside the `800x450` camera view, and cap active hit/dust particles at a maximum of 25 on screen at once.   