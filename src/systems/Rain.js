import Phaser from 'phaser';

const W = 960;
const H = 540;

// Three depth layers of falling rain drawn in screen space.
// Each layer scrolls at a different rate against the camera, which is what makes
// you feel like you're standing *inside* it rather than looking at it.
export default class Rain {
  constructor(scene, { depth = 900, slant = -0.2 } = {}) {
    this.scene = scene;
    this.slant = slant;
    this.g = scene.add.graphics().setScrollFactor(0).setDepth(depth);
    this.layers = [
      { n: 110, len: [8, 14], spd: [420, 520], a: 0.2, w: 1, par: 0.1, col: 0x9fb4ff },
      { n: 80, len: [14, 24], spd: [620, 760], a: 0.3, w: 1.2, par: 0.35, col: 0xb9c8ff },
      { n: 34, len: [26, 44], spd: [950, 1200], a: 0.4, w: 2, par: 0.9, col: 0xd8e0ff },
    ];
    for (const L of this.layers) {
      L.drops = Array.from({ length: L.n }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        len: Phaser.Math.Between(L.len[0], L.len[1]),
        spd: Phaser.Math.Between(L.spd[0], L.spd[1]),
      }));
    }
  }

  update(dt) {
    const cam = this.scene.cameras.main;
    const g = this.g;
    g.clear();
    for (const L of this.layers) {
      g.lineStyle(L.w, L.col, L.a);
      g.beginPath();
      const off = cam.scrollX * L.par;
      for (const d of L.drops) {
        d.y += d.spd * dt;
        if (d.y > H + d.len) {
          d.y = -d.len;
          d.x = Math.random() * W;
        }
        const x = (((d.x - off) % W) + W) % W;
        g.moveTo(x, d.y);
        g.lineTo(x + this.slant * d.len, d.y + d.len);
      }
      g.strokePath();
    }
  }
}

// Rain ripples on wet ground, in world space.
export class Ripples {
  constructor(scene, { depth = 3, band = [388, 530], puddles = [] } = {}) {
    this.scene = scene;
    this.band = band;
    this.puddles = puddles;
    this.list = [];
    this.g = scene.add.graphics().setDepth(depth);
  }

  add(x, y, maxR = 10, life = 0.9, alpha = 0.5) {
    if (this.list.length > 140) return;
    this.list.push({ x, y, t: 0, maxR, life, alpha });
  }

  update(dt) {
    const cam = this.scene.cameras.main;
    const [y0, y1] = this.band;

    // raindrops landing on the street
    const n = 24 * dt;
    for (let i = 0; i < n + (Math.random() < n % 1 ? 1 : 0); i++) {
      this.add(cam.scrollX + Math.random() * W, Phaser.Math.Between(y0, y1), Phaser.Math.Between(4, 8), 0.7, 0.22);
    }
    // busier on puddles
    for (const p of this.puddles) {
      if (p.x < cam.scrollX - 150 || p.x > cam.scrollX + W + 150) continue;
      if (Math.random() < 4 * dt) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random());
        this.add(p.x + Math.cos(a) * p.rx * r * 0.9, p.y + Math.sin(a) * p.ry * r * 0.9, Phaser.Math.Between(7, 13), 1, 0.5);
      }
    }

    const g = this.g;
    g.clear();
    for (let i = this.list.length - 1; i >= 0; i--) {
      const r = this.list[i];
      r.t += dt;
      if (r.t >= r.life) {
        this.list.splice(i, 1);
        continue;
      }
      const k = r.t / r.life;
      const rad = r.maxR * Math.sqrt(k);
      g.lineStyle(1.2, 0xcfd8ff, r.alpha * (1 - k));
      g.strokeEllipse(r.x, r.y, rad * 2, rad * 0.7);
    }
  }
}
