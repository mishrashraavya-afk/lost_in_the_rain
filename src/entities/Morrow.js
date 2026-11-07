import Phaser from 'phaser';

// Morrow: tiny, round, hooded, easily distracted.
// Personality lives in the motion: breathing, blinking, looking around, head-tilts,
// hops, and shaking the rain off their hood when they've been standing around.
export default class Morrow extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    this.shadow = scene.add.image(0, 0, 'shadow').setAlpha(0.6);
    this.footL = scene.add.image(-9, -3, 'foot');
    this.footR = scene.add.image(9, -3, 'foot');

    this.bodyImg = scene.add.image(0, 0, 'morrow_body').setOrigin(0.5, 1);
    this.eyeL = scene.add.image(-7.5, -29, 'eye');
    this.eyeR = scene.add.image(7.5, -29, 'eye');
    this.pupL = scene.add.image(-7.5, -29, 'pupil');
    this.pupR = scene.add.image(7.5, -29, 'pupil');
    this.bodyC = scene.add.container(0, -6, [this.bodyImg, this.eyeL, this.eyeR, this.pupL, this.pupR]);

    this.add([this.shadow, this.footL, this.footR, this.bodyC]);
    scene.add.existing(this);

    this.phase = 0;
    this.stepIndex = 0;
    this.moveAmt = 0;
    this.hopH = 0;
    this.squash = 0;
    this.tilt = 0;
    this.shakeAmt = 0;
    this.lookX = 0;
    this.lookY = 0;
    this.eyeOpen = 1;
    this.blinkIn = 2;
    this.idleTime = 0;
    this.nextIdle = 3;
    this.act = null;
    this.onStep = null;
    this.onShake = null;
  }

  hop(h = 14, dur = 150) {
    if (this._hopping) return;
    this._hopping = true;
    this.scene.tweens.add({
      targets: this, hopH: h, duration: dur, yoyo: true, ease: 'Quad.easeOut',
      onComplete: () => {
        this._hopping = false;
        this.squash = 0.18;
      },
    });
  }

  excited() {
    this.hop(16, 130);
    this.scene.time.delayedCall(330, () => {
      this._hopping = false;
      this.hop(12, 120);
    });
  }

  confused() {
    this.scene.tweens.add({ targets: this, tilt: 0.28, duration: 260, yoyo: true, hold: 700, ease: 'Sine.easeInOut' });
  }

  wake() {
    this.squash = -0.45;
    this.bodyC.setScale(1, 0.55);
  }

  update(time, dt, vx, vy) {
    const sp = Math.hypot(vx, vy);
    const walking = sp > 12;
    this.moveAmt += ((walking ? 1 : 0) - this.moveAmt) * Math.min(1, dt * 10);

    if (walking) {
      this.phase += dt * (6 + sp * 0.04);
      const idx = Math.floor(this.phase / Math.PI);
      if (idx !== this.stepIndex) {
        this.stepIndex = idx;
        this.onStep && this.onStep();
      }
      this.idleTime = 0;
      this.act = null;
    } else {
      this.idleTime += dt;
      this.phase += (Math.round(this.phase / Math.PI) * Math.PI - this.phase) * Math.min(1, dt * 8);
    }

    this._idleBehaviour(dt);

    this.squash += (0 - this.squash) * Math.min(1, dt * 9);
    const m = this.moveAmt;
    const breath = Math.sin(time * 0.0025) * (1 - m);
    const bob = Math.abs(Math.sin(this.phase)) * 5 * m;

    this.bodyC.y = -6 - bob - this.hopH + breath * 0.8;
    const sy = 1 + breath * 0.025 + this.squash;
    this.bodyC.setScale(1 / Math.sqrt(Math.max(0.3, sy)), sy);
    this.bodyC.rotation =
      Math.sin(this.phase) * 0.09 * m +
      (vx / 150) * 0.12 +
      this.tilt +
      Math.sin(time * 0.07) * 0.14 * this.shakeAmt;

    const lift = (s) => Math.max(0, s) * 5 * m;
    this.footL.y = -3 - lift(Math.sin(this.phase));
    this.footR.y = -3 - lift(-Math.sin(this.phase));
    this.shadow.setScale(1 - (bob + this.hopH) / 45);

    // eyes
    let tx = this.lookX;
    let ty = this.lookY;
    if (walking) {
      tx = (vx / sp) * 2.4;
      ty = (vy / sp) * 1.4;
    }
    this.blinkIn -= dt;
    if (this.blinkIn <= 0) {
      this.blinkIn = Phaser.Math.FloatBetween(1.6, 4.5);
      this.scene.tweens.add({ targets: this, eyeOpen: 0.08, duration: 70, yoyo: true });
    }
    const gx = tx * 0.6;
    const gy = ty * 0.6;
    for (const [e, p, bx] of [[this.eyeL, this.pupL, -7.5], [this.eyeR, this.pupR, 7.5]]) {
      e.x = bx + gx * 0.6;
      e.y = -29 + gy * 0.6;
      e.scaleY = this.eyeOpen;
      p.x = bx + gx * 1.6;
      p.y = -29 + gy * 1.6;
      p.scaleY = this.eyeOpen;
      p.setVisible(this.eyeOpen > 0.3);
    }
  }

  _idleBehaviour(dt) {
    if (this.act) {
      this.act.t += dt;
      const k = this.act.t / this.act.dur;
      if (k >= 1) {
        this.lookX = this.lookY = 0;
        this.shakeAmt = 0;
        this.act = null;
        return;
      }
      if (this.act.type === 'look') {
        this.lookX = Math.sin(k * Math.PI * 2) * 3.4;
        this.lookY = -Math.abs(Math.sin(k * Math.PI)) * 0.8;
      } else if (this.act.type === 'tilt') {
        this.tilt = Math.sin(k * Math.PI) * 0.2;
        this.lookX = 2;
      } else if (this.act.type === 'shake') {
        this.shakeAmt = Math.sin(k * Math.PI);
      }
      return;
    }
    this.tilt += (0 - this.tilt) * Math.min(1, dt * 6);
    if (this.idleTime > this.nextIdle) {
      this.nextIdle = this.idleTime + Phaser.Math.FloatBetween(2.5, 5);
      const pool = ['look', 'tilt', 'hop'];
      if (this.idleTime > 6) pool.push('shake', 'shake');
      const type = Phaser.Utils.Array.GetRandom(pool);
      if (type === 'hop') this.hop(10, 130);
      else {
        this.act = { type, t: 0, dur: type === 'shake' ? 0.7 : 2.2 };
        if (type === 'shake') this.onShake && this.onShake();
      }
    }
    if (this.idleTime === 0) this.nextIdle = 3;
  }
}
