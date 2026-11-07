import Phaser from 'phaser';
import { gradRect, mix } from '../palette.js';

const ADD = Phaser.BlendModes.ADD;

export function buildPlant(scene, x, y, scale = 1, seed = 0) {
  const c = scene.add.container(x, y).setDepth(y).setScale(scale);
  const rnd = new Phaser.Math.RandomDataGenerator([String(seed + x)]);
  c.add(scene.add.image(0, 0, 'pot').setOrigin(0.5, 1));
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = -80 + (160 / (n - 1)) * i + rnd.between(-8, 8);
    const leaf = scene.add.image(0, -18, 'leaf').setOrigin(0.5, 1).setAngle(a).setScale(rnd.realInRange(0.8, 1.25));
    leaf.setTint(mix(0xffffff, 0xb8d8c8, rnd.frac()));
    c.add(leaf);
  }
  if (rnd.frac() > 0.4) {
    for (let i = 0; i < 3; i++) c.add(scene.add.image(rnd.between(-14, 14), rnd.between(-52, -34), 'flower'));
  }
  scene.tweens.add({
    targets: c, angle: { from: -2.5, to: 2.5 }, duration: rnd.between(2200, 3800), yoyo: true, repeat: -1,
    ease: 'Sine.easeInOut', delay: rnd.between(0, 2000),
  });
  return c;
}

export function buildHouse(scene, cfg) {
  const { x, w, h, wall, roof, baseY = 385, doorCol = 0, awning = false, smoke = false, seed = 1, lit = 0.55 } = cfg;
  const rnd = new Phaser.Math.RandomDataGenerator([String(seed)]);
  const g = scene.add.graphics().setDepth(10);
  const top = baseY - h;
  const rh = Math.min(72, w * 0.22 + 30);

  // chimney (behind roof)
  const chx = x + w * 0.72;
  const chTop = top - rh * (1 - Math.abs(chx - (x + w / 2)) / (w / 2 + 12)) - 16;
  g.fillStyle(mix(wall, 0x0a0820, 0.45), 1);
  g.fillRect(chx, chTop, 16, 40);
  g.fillStyle(mix(wall, 0x0a0820, 0.65), 1);
  g.fillRect(chx - 2, chTop - 3, 20, 5);

  // wall
  gradRect(g, x, top, w, h, mix(wall, 0x7a74c0, 0.12), mix(wall, 0x0a0820, 0.4), 14);
  g.lineStyle(1, 0x000000, 0.07);
  for (let yy = top + 14; yy < baseY; yy += 14) g.lineBetween(x, yy, x + w, yy);
  g.fillStyle(0x000000, 0.12);
  g.fillRect(x, top, 6, h);
  g.fillRect(x + w - 8, top, 8, h);
  // damp patches at the bottom
  g.fillStyle(0x000000, 0.14);
  g.fillRect(x, baseY - 16, w, 16);

  // roof
  g.fillStyle(roof, 1);
  g.fillPoints([{ x: x - 12, y: top + 4 }, { x: x + w / 2, y: top - rh }, { x: x + w + 12, y: top + 4 }], true);
  g.fillStyle(0x000000, 0.2);
  g.fillPoints([{ x: x + w / 2, y: top - rh }, { x: x + w + 12, y: top + 4 }, { x: x + w / 2 + 8, y: top + 4 }], true);
  g.fillStyle(0xffffff, 0.05);
  g.lineStyle(1, 0xffffff, 0.08);
  for (let i = 1; i < 5; i++) {
    const yy = top - rh + (rh * i) / 5 + 4;
    const half = ((w / 2 + 12) * (yy - (top - rh))) / (rh + 4);
    g.lineBetween(x + w / 2 - half, yy, x + w / 2 + half, yy);
  }
  g.fillStyle(mix(roof, 0x000000, 0.4), 1);
  g.fillRect(x - 12, top + 2, w + 24, 6);

  // windows + door
  const cols = Math.max(1, Math.floor((w - 30) / 62));
  const rows = Math.max(1, Math.floor((h - 50) / 80));
  const cw = w / cols;
  const doorCx = x + cw * doorCol + cw / 2;
  const glows = [];
  const windows = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === rows - 1 && c === doorCol) continue;
      const wx = x + cw * c + cw / 2;
      const wy = top + 30 + r * 78;
      const on = rnd.frac() < lit;
      g.fillStyle(0x14102f, 1);
      g.fillRect(wx - 19, wy - 3, 38, 44);
      if (on) gradRect(g, wx - 16, wy, 32, 38, 0xffd27a, 0xf08a3c, 6);
      else gradRect(g, wx - 16, wy, 32, 38, 0x3f55a0, 0x20285e, 6);
      g.lineStyle(2, 0x14102f, 1);
      g.lineBetween(wx, wy, wx, wy + 38);
      g.lineBetween(wx - 16, wy + 18, wx + 16, wy + 18);
      g.fillStyle(0x8f8ad0, 0.5);
      g.fillRect(wx - 21, wy + 40, 42, 4);
      if (on) {
        g.fillStyle(0xb85a6b, 0.5);
        g.fillTriangle(wx - 16, wy, wx - 5, wy, wx - 16, wy + 22);
        g.fillTriangle(wx + 16, wy, wx + 5, wy, wx + 16, wy + 22);
        const glow = scene.add.image(wx, wy + 19, 'glow').setBlendMode(ADD).setTint(0xffa040).setScale(0.8).setAlpha(0.32).setDepth(11);
        scene.tweens.add({
          targets: glow, alpha: { from: 0.32, to: 0.2 }, duration: rnd.between(700, 1600), yoyo: true, repeat: -1,
          ease: 'Sine.easeInOut', delay: rnd.between(0, 1200),
        });
        glows.push(glow);
        windows.push({ wx, wy });
      }
    }
  }

  // someone walks past a lit window now and then
  if (windows.length) {
    const win = windows[rnd.between(0, windows.length - 1)];
    const fig = scene.add.container(win.wx, win.wy + 38).setDepth(12).setAlpha(0);
    fig.add([scene.add.ellipse(0, -22, 8, 9, 0x2a1530), scene.add.ellipse(0, -9, 14, 18, 0x2a1530)]);
    scene.time.addEvent({
      delay: rnd.between(8000, 17000),
      loop: true,
      callback: () => {
        fig.x = win.wx - 9;
        fig.setAlpha(0);
        scene.tweens.add({ targets: fig, x: win.wx + 9, duration: 3200, ease: 'Sine.easeInOut' });
        scene.tweens.add({ targets: fig, alpha: 0.85, duration: 600, yoyo: true, hold: 1800 });
      },
    });
  }

  // door
  g.fillStyle(0x6e3a36, 1);
  g.fillRect(doorCx - 17, baseY - 52, 34, 52);
  g.fillCircle(doorCx, baseY - 52, 17);
  g.fillStyle(0xffd27a, 0.9);
  g.fillCircle(doorCx, baseY - 50, 6);
  g.fillStyle(0xffd27a, 1);
  g.fillCircle(doorCx + 9, baseY - 24, 2);
  g.fillStyle(0x4a4378, 1);
  g.fillRect(doorCx - 24, baseY - 4, 48, 6);
  // warm light spilling onto the wet pavement
  scene.add.image(doorCx, baseY + 26, 'glow').setBlendMode(ADD).setTint(0xffb866).setScale(1.7, 0.55).setAlpha(0.3).setDepth(3);
  scene.add.image(doorCx, baseY + 70, 'glow').setBlendMode(ADD).setTint(0xffb866).setScale(0.3, 1.2).setAlpha(0.13).setDepth(4);
  const dg = scene.add.image(doorCx, baseY - 40, 'glow').setBlendMode(ADD).setTint(0xffa040).setScale(0.9).setAlpha(0.22).setDepth(11);
  glows.push(dg);

  if (awning) {
    const aw = scene.add.graphics().setDepth(baseY + 2);
    const y0 = baseY - 78;
    const segs = 6;
    for (let i = 0; i < segs; i++) {
      const xa = doorCx - 46 + (92 / segs) * i;
      const xb = xa + 92 / segs;
      const xa2 = doorCx - 54 + (108 / segs) * i;
      const xb2 = xa2 + 108 / segs;
      aw.fillStyle(i % 2 ? 0xe8c39a : 0xc25b6b, 1);
      aw.fillPoints([{ x: xa, y: y0 }, { x: xb, y: y0 }, { x: xb2, y: y0 + 24 }, { x: xa2, y: y0 + 24 }], true);
    }
    aw.fillStyle(0x000000, 0.2);
    aw.fillRect(doorCx - 54, y0 + 24, 108, 4);
    // lantern under the awning
    const lx = doorCx + 38;
    aw.fillStyle(0x2a2540, 1);
    aw.fillRect(lx - 1, y0 + 24, 2, 8);
    aw.fillStyle(0xffd98a, 1);
    aw.fillRect(lx - 5, y0 + 32, 10, 13);
    const lg = scene.add.image(lx, y0 + 40, 'glow').setBlendMode(ADD).setTint(0xffc266).setScale(0.8).setAlpha(0.5).setDepth(baseY + 3);
    scene.tweens.add({ targets: lg, alpha: { from: 0.5, to: 0.36 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  if (smoke) {
    scene.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => {
        const p = scene.add.image(chx + 8, chTop - 6, 'puff').setScale(0.3).setAlpha(0.28).setDepth(9);
        scene.tweens.add({
          targets: p, x: p.x - 26, y: p.y - 70, scale: 1.4, alpha: 0, duration: 3800, ease: 'Sine.easeOut',
          onComplete: () => p.destroy(),
        });
      },
    });
  }

  return { doorCx, glows };
}

export function buildAlley(scene, x, w, baseY = 385, h = 170) {
  const g = scene.add.graphics().setDepth(9);
  gradRect(g, x, baseY - h, w, h, 0x0a0820, 0x14102f, 10, 0.95, 0.95);
  g.fillStyle(0x0a0820, 1);
  g.fillRect(x + w * 0.12, baseY - 38, 16, 38);
  g.fillRect(x + w * 0.62, baseY - 28, 22, 28);
  const lamp = scene.add.image(x + w / 2, baseY - 90, 'glow').setBlendMode(ADD).setTint(0xffb050).setScale(0.9).setAlpha(0.45).setDepth(9.5);
  scene.tweens.add({ targets: lamp, alpha: { from: 0.45, to: 0.28 }, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  g.fillStyle(0xffd98a, 1);
  g.fillCircle(x + w / 2, baseY - 90, 3);
}

export function buildLamp(scene, x, baseY, { broken = false } = {}) {
  const g = scene.add.graphics().setDepth(baseY);
  g.fillStyle(0x15122e, 1);
  g.fillRect(x - 3, baseY - 150, 6, 150);
  g.fillRect(x - 9, baseY - 8, 18, 8);
  g.fillRect(x - 6, baseY - 34, 12, 4);
  g.fillRect(x - 13, baseY - 170, 26, 6);
  g.fillTriangle(x - 15, baseY - 170, x + 15, baseY - 170, x, baseY - 184);
  g.fillStyle(0xffe09a, broken ? 0.55 : 1);
  g.fillRect(x - 9, baseY - 164, 18, 22);
  g.lineStyle(1.5, 0x15122e, 1);
  g.lineBetween(x, baseY - 164, x, baseY - 142);
  g.fillStyle(0x15122e, 1);
  g.fillRect(x - 11, baseY - 142, 22, 4);

  const head = scene.add.image(x, baseY - 153, 'glow').setBlendMode(ADD).setTint(0xffc266).setScale(2.4).setAlpha(0.55).setDepth(baseY + 1);
  const cone = scene.add.image(x, baseY - 70, 'glow').setBlendMode(ADD).setTint(0xffc266).setScale(1.3, 2.4).setAlpha(0.07).setDepth(baseY - 1);
  const pool = scene.add.image(x, baseY + 8, 'glow').setBlendMode(ADD).setTint(0xffc266).setScale(2.6, 0.62).setAlpha(0.3).setDepth(3);
  const streak = scene.add.image(x, baseY + 64, 'glow').setBlendMode(ADD).setTint(0xffc266).setScale(0.32, 1.5).setAlpha(0.16).setDepth(4);
  const parts = [[head, 0.55], [cone, 0.07], [pool, 0.3], [streak, 0.16]];

  if (broken) {
    const flick = () => {
      const k = Math.random() < 0.3 ? 0.08 : Phaser.Math.FloatBetween(0.3, 0.9);
      for (const [o, a] of parts) o.setAlpha(a * k);
      scene.time.delayedCall(Phaser.Math.Between(90, 900), flick);
    };
    flick();
  } else {
    scene.tweens.add({
      targets: head, alpha: { from: 0.55, to: 0.48 }, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    scene.tweens.add({
      targets: streak, scaleY: { from: 1.5, to: 1.7 }, alpha: { from: 0.16, to: 0.1 }, duration: 900, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
  return { x, baseY };
}

export function buildSign(scene, x, baseY, label) {
  const g = scene.add.graphics().setDepth(baseY);
  g.fillStyle(0x4a3326, 1);
  g.fillRect(x - 3, baseY - 70, 6, 70);
  g.fillStyle(0x6b4a35, 1);
  g.fillRoundedRect(x - 44, baseY - 92, 88, 36, 6);
  g.lineStyle(2, 0x2c1d17, 1);
  g.strokeRoundedRect(x - 44, baseY - 92, 88, 36, 6);
  scene.add
    .text(x, baseY - 74, label, { fontFamily: 'Georgia, serif', fontSize: '15px', color: '#ffe6b0', resolution: 2 })
    .setOrigin(0.5)
    .setDepth(baseY + 1);
  const glow = scene.add.image(x, baseY - 74, 'glow').setBlendMode(ADD).setTint(0xffb050).setScale(0.9).setAlpha(0.25).setDepth(baseY + 2);
  scene.tweens.add({ targets: glow, alpha: { from: 0.25, to: 0.15 }, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
}
