const FONT = 'Georgia, "Times New Roman", serif';

// Short, charming lines in a warm box at the bottom of the screen.
// A line is { who, text, slow }. who = null is quiet narration / Morrow's thoughts.
export default class DialogueSystem {
  constructor(scene, audio) {
    this.scene = scene;
    this.audio = audio;
    this.active = false;
    this.lines = [];
    this.onDone = null;
    this.full = '';
    this.acc = 0;
    this.cps = 38;
    this.typing = false;

    const box = (this.box = scene.add.container(480, 0).setScrollFactor(0).setDepth(2000).setVisible(false));
    const bg = scene.add.graphics();
    bg.fillStyle(0x0f0c2e, 0.88);
    bg.fillRoundedRect(-420, 18, 840, 112, 20);
    bg.lineStyle(2, 0xffc266, 0.75);
    bg.strokeRoundedRect(-420, 18, 840, 112, 20);
    bg.fillStyle(0xffc266, 0.12);
    bg.fillRoundedRect(-414, 24, 828, 10, 6);
    this.name = scene.add.text(-392, 28, '', { fontFamily: FONT, fontSize: '19px', fontStyle: 'bold', color: '#ffc266', resolution: 2 });
    this.body = scene.add.text(-392, 56, '', {
      fontFamily: FONT, fontSize: '21px', color: '#fff3d6', wordWrap: { width: 780 }, lineSpacing: 5, resolution: 2,
    });
    this.arrow = scene.add.text(396, 112, '▾', { fontFamily: FONT, fontSize: '22px', color: '#ffc266', resolution: 2 }).setOrigin(0.5);
    scene.tweens.add({ targets: this.arrow, y: 118, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const hit = scene.add.zone(0, 74, 840, 112).setInteractive();
    hit.on('pointerdown', () => this.advance());
    box.add([bg, this.name, this.body, this.arrow, hit]);
  }

  show(lines, onDone) {
    this.lines = lines.slice();
    this.onDone = onDone || null;
    this.active = true;
    this.box.setVisible(true).setAlpha(0).y = -16;
    this.scene.tweens.add({ targets: this.box, alpha: 1, y: 0, duration: 220, ease: 'Sine.easeOut' });
    this._next();
  }

  _next() {
    const line = this.lines.shift();
    if (!line) return this._close();
    this.line = line;
    this.full = line.text;
    this.acc = 0;
    this.cps = line.slow ? 9 : 38;
    this.typing = true;
    this.arrow.setVisible(false);
    this.name.setText(line.who || '');
    this.body.setText('').setStyle({ fontStyle: line.who ? 'normal' : 'italic', color: line.who ? '#fff3d6' : '#c9c6ee' });
    this.lastBlip = 0;
    line.fx && line.fx();
  }

  advance() {
    if (!this.active) return;
    if (this.typing) {
      this.typing = false;
      this.body.setText(this.full);
      this.arrow.setVisible(true);
    } else {
      this.audio.blip(1.3);
      this._next();
    }
  }

  _close() {
    this.scene.tweens.add({
      targets: this.box, alpha: 0, y: -16, duration: 180,
      onComplete: () => this.box.setVisible(false),
    });
    this.active = false;
    const cb = this.onDone;
    this.onDone = null;
    cb && cb();
  }

  update(dt) {
    if (!this.active || !this.typing) return;
    this.acc += dt * this.cps;
    const n = Math.min(this.full.length, Math.floor(this.acc));
    this.body.setText(this.full.slice(0, n));
    if (n - this.lastBlip >= 3) {
      this.lastBlip = n;
      const c = this.full[n - 1];
      if (c && c !== ' ' && c !== '.') this.audio.blip(this.line.who === 'Morrow' ? 1.35 : 0.85);
    }
    if (n >= this.full.length) {
      this.typing = false;
      this.arrow.setVisible(true);
    }
  }
}
