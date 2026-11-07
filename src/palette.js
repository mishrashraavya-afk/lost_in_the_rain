// The rain is cool. Home is warm.
export const COOL = {
  indigo: 0x27235e,
  rainBlue: 0x2b3c7a,
  violet: 0x3d3278,
  dusty: 0x4a3868,
  teal: 0x2f4668,
  mist: 0x8a8fc4,
};

export const WARM = {
  gold: 0xffd27a,
  amber: 0xffa94d,
  orange: 0xf08a3c,
  pink: 0xd9667a,
};

export function mix(a, b, t) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (Math.round(ar + (br - ar) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ab + (bb - ab) * t);
}

// Vertical gradient built from strips (works in both WebGL and Canvas renderers).
export function gradRect(g, x, y, w, h, c1, c2, steps = 10, a1 = 1, a2 = 1) {
  const sh = h / steps;
  for (let i = 0; i < steps; i++) {
    const t = steps === 1 ? 0 : i / (steps - 1);
    g.fillStyle(mix(c1, c2, t), a1 + (a2 - a1) * t);
    g.fillRect(x, y + i * sh, w, sh + 1);
  }
}
