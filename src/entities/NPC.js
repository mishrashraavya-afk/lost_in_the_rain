import Phaser from 'phaser';

// A town resident who stands somewhere and breathes. Perspective scale follows depth.
export default class NPC {
  constructor(scene, x, y, key, { top = 392, bottom = 522 } = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    const s = 0.9 + ((y - top) / (bottom - top)) * 0.3;
    this.scale = s;
    this.shadow = scene.add.image(x, y, 'shadow').setScale(s * 1.5).setAlpha(0.6).setDepth(y - 1);
    this.sprite = scene.add.image(x, y - 2, key).setOrigin(0.5, 1).setScale(s).setDepth(y);
    scene.tweens.add({
      targets: this.sprite, scaleY: s * 1.025, duration: 1900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }
}
