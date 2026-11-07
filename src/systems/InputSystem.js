import Phaser from 'phaser';

// Keyboard (WASD / arrows) and touch / mouse "hold to walk toward the finger".
export default class InputSystem {
  constructor(scene) {
    this.scene = scene;
    const kb = scene.input.keyboard;
    this.keys = kb.addKeys({
      up: 'W', down: 'S', left: 'A', right: 'D',
      up2: 'UP', down2: 'DOWN', left2: 'LEFT', right2: 'RIGHT',
      act: 'E', act2: 'SPACE', act3: 'ENTER', mute: 'M',
    });
    this.uiDown = false;
    scene.input.on('pointerdown', (p, over) => {
      this.uiDown = over.length > 0;
    });
    scene.input.on('pointerup', () => {
      this.uiDown = false;
    });
  }

  get vector() {
    const k = this.keys;
    let x = (k.right.isDown || k.right2.isDown ? 1 : 0) - (k.left.isDown || k.left2.isDown ? 1 : 0);
    let y = (k.down.isDown || k.down2.isDown ? 1 : 0) - (k.up.isDown || k.up2.isDown ? 1 : 0);
    if (x || y) {
      const l = Math.hypot(x, y);
      return { x: x / l, y: y / l };
    }
    const p = this.scene.input.activePointer;
    if (p.isDown && !this.uiDown) {
      const cam = this.scene.cameras.main;
      const mx = this.scene.morrow.x - cam.scrollX;
      const my = this.scene.morrow.y - cam.scrollY - 24;
      const dx = p.x - mx;
      const dy = p.y - my;
      const d = Math.hypot(dx, dy);
      if (d > 14) {
        const s = Phaser.Math.Clamp(d / 70, 0.35, 1);
        return { x: (dx / d) * s, y: (dy / d) * s };
      }
    }
    return { x: 0, y: 0 };
  }

  get actionPressed() {
    const k = this.keys;
    return (
      Phaser.Input.Keyboard.JustDown(k.act) ||
      Phaser.Input.Keyboard.JustDown(k.act2) ||
      Phaser.Input.Keyboard.JustDown(k.act3)
    );
  }

  get mutePressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.mute);
  }
}
