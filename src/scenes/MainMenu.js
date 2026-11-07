import Phaser from 'phaser';
import Morrow from '../entities/Morrow.js';
import Rain from '../systems/Rain.js';
import addAtmosphere from '../systems/Atmosphere.js';
import { gradRect, mix } from '../palette.js';

const FONT = 'Georgia, "Times New Roman", serif';

export default class MainMenu extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create() {
    this.audio = this.registry.get('audio');
    this.starting = false;

    this.add.image(0, 0, 'sky').setOrigin(0).setDisplaySize(960, 540).setDepth(-10);

    // a hazy skyline with a few warm windows
    const sky = this.add.graphics().setDepth(-9);
    const rnd = new Phaser.Math.RandomDataGenerator(['menu']);
    for (let x = -20; x < 980; ) {
      const w = rnd.between(50, 110);
      const h = rnd.between(90, 230);
      sky.fillStyle(mix(0x585c9c, 0x2a2762, rnd.frac() * 0.6), 1);
      sky.fillRect(x, 400 - h, w, h);
      for (let i = 0; i < 4; i++) {
        if (rnd.frac() < 0.4) {
          sky.fillStyle(0xffc266, 0.7);
          sky.fillRect(x + rnd.between(6, w - 14), 400 - h + rnd.between(10, h - 20), 6, 9);
        }
      }
      x += w + rnd.between(0, 12);
    }

    const ground = this.add.graphics().setDepth(-5);
    gradRect(ground, 0, 400, 960, 140, 0x3a3678, 0x15123a, 10);

    // one streetlamp, one tiny creature
    const glow = this.add.image(700, 250, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(0xffc266).setScale(3.2).setAlpha(0.5).setDepth(-4);
    this.tweens.add({ targets: glow, alpha: 0.42, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const pole = this.add.graphics().setDepth(-3);
    pole.fillStyle(0x15122e, 1);
    pole.fillRect(697, 262, 6, 190);
    pole.fillRect(688, 252, 24, 12);
    pole.fillStyle(0xffe09a, 1);
    pole.fillRect(692, 234, 16, 22);
    this.add.image(700, 470, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(0xffc266).setScale(3.2, 0.7).setAlpha(0.28).setDepth(-2);

    this.morrow = new Morrow(this, 610, 462).setScale(1.7).setDepth(5);

    this.rain = new Rain(this);
    addAtmosphere(this);

    this.add
      .text(480, 120, 'Lost in the Rain', {
        fontFamily: FONT, fontSize: '70px', fontStyle: 'italic', color: '#fff3d6', resolution: 2,
        shadow: { offsetX: 0, offsetY: 0, color: '#ffb050', blur: 22, fill: true },
      })
      .setOrigin(0.5)
      .setDepth(2000);
    this.add
      .text(480, 182, 'a small, rainy, cozy game', { fontFamily: FONT, fontSize: '20px', color: '#c9c6ee', resolution: 2 })
      .setOrigin(0.5)
      .setDepth(2000);
    const prompt = this.add
      .text(480, 490, 'tap or press any key to begin', { fontFamily: FONT, fontSize: '20px', color: '#ffc266', resolution: 2 })
      .setOrigin(0.5)
      .setDepth(2000);
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.add
      .text(480, 516, 'headphones recommended', { fontFamily: FONT, fontSize: '13px', fontStyle: 'italic', color: '#8a8fc4', resolution: 2 })
      .setOrigin(0.5)
      .setDepth(2000);

    this.cameras.main.fadeIn(1200, 11, 9, 34);
    this.input.once('pointerdown', () => this.begin());
    this.input.keyboard.once('keydown', () => this.begin());
  }

  begin() {
    if (this.starting) return;
    this.starting = true;
    this.audio.init();
    this.morrow.excited();
    this.cameras.main.fadeOut(1400, 11, 9, 34);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('FirstStreet'));
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.morrow.update(time, dt, 0, 0);
    this.rain.update(dt);
  }
}
