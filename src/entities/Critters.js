import Phaser from 'phaser';

const clamp = Phaser.Math.Clamp;

// "Oh my god, there's a tiny frog."
export class Frog {
  constructor(scene, audio, puddle, ripples, fx) {
    this.scene = scene;
    this.audio = audio;
    this.puddle = puddle;
    this.ripples = ripples;
    this.fx = fx;
    this.spots = [
      { x: puddle.x - puddle.rx * 0.7, y: puddle.y + 2 },
      { x: puddle.x + puddle.rx * 0.7, y: puddle.y - 2 },
    ];
    this.at = 0;
    this.hopping = false;
    this.sprite = scene.add.image(this.spots[0].x, this.spots[0].y, 'frog').setOrigin(0.5, 1).setDepth(this.spots[0].y);
    this.x = this.sprite.x;
    this.y = this.sprite.y;
    scene.tweens.add({ targets: this.sprite, scaleY: 1.07, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.ribbitIn = Phaser.Math.Between(6, 14);
  }

  hopTo(i) {
    if (this.hopping) return;
    this.hopping = true;
    this.at = i;
    const from = { x: this.sprite.x, y: this.sprite.y };
    const to = this.spots[i];
    const state = { t: 0 };
    this.sprite.setFlipX(to.x < from.x);
    this.scene.tweens.add({
      targets: state, t: 1, duration: 520, ease: 'Sine.easeInOut',
      onUpdate: () => {
        this.sprite.x = from.x + (to.x - from.x) * state.t;
        const base = from.y + (to.y - from.y) * state.t;
        this.sprite.y = base - Math.sin(state.t * Math.PI) * 34;
        this.sprite.setDepth(base + 1);
        this.sprite.scaleY = 1 - Math.sin(state.t * Math.PI) * -0.15;
      },
      onComplete: () => {
        this.hopping = false;
        this.sprite.y = to.y;
        this.sprite.setDepth(to.y);
        this.x = to.x;
        this.y = to.y;
        this.audio.splash(true);
        this.ripples.add(to.x, to.y, 16, 1.1, 0.7);
        this.ripples.add(to.x, to.y, 10, 0.8, 0.6);
        this.fx.splash(to.x, to.y - 4, 6);
      },
    });
  }

  update(dt, morrow) {
    const near = Phaser.Math.Distance.Between(morrow.x, morrow.y * 1.6, this.x, this.y * 1.6) < 90;
    if (near && !this.hopping) {
      this.hopTo(1 - this.at);
      this.ribbitIn = 1;
    }
    this.ribbitIn -= dt;
    if (this.ribbitIn <= 0) {
      this.ribbitIn = Phaser.Math.Between(9, 20);
      if (Math.abs(morrow.x - this.x) < 700) this.audio.ribbit();
    }
  }
}

export class Snail {
  constructor(scene, x, y, minX, maxX) {
    this.minX = minX;
    this.maxX = maxX;
    this.dir = 1;
    this.x = x;
    this.y = y;
    this.sprite = scene.add.image(x, y, 'snail').setOrigin(0.5, 1).setDepth(y).setFlipX(true);
    this.shy = 0;
  }

  update(dt, morrow) {
    const near = Math.abs(morrow.x - this.x) < 60 && Math.abs(morrow.y - this.y) < 40;
    this.shy += ((near ? 1 : 0) - this.shy) * Math.min(1, dt * 4);
    this.sprite.setScale(1 - this.shy * 0.08, 1 - this.shy * 0.1);
    if (!near) {
      this.x += this.dir * 2.5 * dt;
      if (this.x > this.maxX || this.x < this.minX) this.dir *= -1;
      this.sprite.x = this.x;
      this.sprite.setFlipX(this.dir > 0);
    }
  }
}

// A cat that darts across the street, now and then.
export class Cat {
  constructor(scene, audio) {
    this.scene = scene;
    this.audio = audio;
    this.sprite = scene.add.image(0, 405, 'cat').setOrigin(0.5, 1).setVisible(false).setDepth(399);
    this.running = false;
  }

  run() {
    if (this.running) return;
    const cam = this.scene.cameras.main;
    const dir = Math.random() > 0.5 ? 1 : -1;
    const x0 = dir > 0 ? cam.scrollX - 40 : cam.scrollX + 1000;
    const x1 = dir > 0 ? cam.scrollX + 1000 : cam.scrollX - 40;
    this.running = true;
    this.sprite.setVisible(true);
    const s = { t: 0 };
    this.audio.mew();
    this.scene.tweens.add({
      targets: s, t: 1, duration: 3200, ease: 'Linear',
      onUpdate: () => {
        this.sprite.x = x0 + (x1 - x0) * s.t;
        this.sprite.y = 405 - Math.abs(Math.sin(s.t * 38)) * 5;
        this.sprite.scaleX = (dir > 0 ? 1 : -1) * (1 + Math.sin(s.t * 76) * 0.04);
      },
      onComplete: () => {
        this.running = false;
        this.sprite.setVisible(false);
      },
    });
  }
}
