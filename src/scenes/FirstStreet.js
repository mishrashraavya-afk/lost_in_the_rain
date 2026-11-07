import Phaser from 'phaser';
import Morrow from '../entities/Morrow.js';
import NPC from '../entities/NPC.js';
import { Frog, Snail, Cat } from '../entities/Critters.js';
import Rain, { Ripples } from '../systems/Rain.js';
import InputSystem from '../systems/InputSystem.js';
import DialogueSystem from '../systems/DialogueSystem.js';
import addAtmosphere from '../systems/Atmosphere.js';
import { buildHouse, buildAlley, buildLamp, buildPlant, buildSign } from '../art/props.js';
import { gradRect, mix } from '../palette.js';

const ADD = Phaser.BlendModes.ADD;
const W = 2800;
const H = 540;
const TOP = 392; // furthest back Morrow can walk
const BOT = 522; // nearest the camera
const SPEED = 150;
const FONT = 'Georgia, "Times New Roman", serif';
const rnd = Phaser.Math.FloatBetween;

const PUDDLES = [
  { x: 330, y: 470, rx: 60, ry: 14 },
  { x: 700, y: 500, rx: 80, ry: 17 },
  { x: 1010, y: 455, rx: 50, ry: 11 },
  { x: 1180, y: 488, rx: 90, ry: 18 },
  { x: 1700, y: 480, rx: 70, ry: 15 },
  { x: 2000, y: 455, rx: 55, ry: 12 },
  { x: 2380, y: 500, rx: 85, ry: 17 },
  { x: 2650, y: 470, rx: 60, ry: 13 },
];

const LAMPS = [270, 975, 1500, 2150, 2650];

export default class FirstStreet extends Phaser.Scene {
  constructor() {
    super('FirstStreet');
  }

  create() {
    this.audio = this.registry.get('audio');
    this.audio.init();
    this.flags = {};
    this.vel = { x: 0, y: 0 };
    this.locked = true;
    this.near = null;
    this.endTalked = false;
    this.touch = this.sys.game.device.input.touch;

    this.cameras.main.setBounds(0, 0, W, H);

    this.buildSky();
    this.buildGround();
    this.buildTown();
    this.buildPuddles();
    this.buildFx();
    this.buildCreatures();

    this.morrow = new Morrow(this, 150, 450);
    this.morrow.onStep = () => this.onStep();
    this.morrow.onShake = () => this.fx.splash(this.morrow.x, this.morrow.y - 36, 10, 30);
    this.cameras.main.startFollow(this.morrow, true, 0.08, 0.08);
    this.cameras.main.setFollowOffset(0, 0);

    this.rain = new Rain(this);
    this.buildMist();
    addAtmosphere(this);

    this.inputSys = new InputSystem(this);
    this.dialogue = new DialogueSystem(this, this.audio);
    this.buildUI();
    this.buildInteractables();

    // lightning
    this.flash = this.add.rectangle(480, 270, 960, 540, 0xb9c8ff, 0).setScrollFactor(0).setDepth(950);
    this.audio.on('flash', () => {
      this.tweens.add({ targets: this.flash, alpha: { from: 0.28, to: 0 }, duration: 260, ease: 'Quad.easeOut' });
    });

    // a cat, now and then
    this.time.delayedCall(14000, () => this.cat.run());
    this.time.addEvent({ delay: 38000, loop: true, callback: () => Math.random() < 0.8 && this.cat.run() });

    this.beginIntro();
  }

  // ---------------------------------------------------------------- world
  buildSky() {
    this.add.image(0, 0, 'sky').setOrigin(0).setDisplaySize(960, 540).setScrollFactor(0).setDepth(-10);

    // far haze skyline, with a clock tower that keeps time somewhere out there
    const far = this.add.graphics().setScrollFactor(0.12).setDepth(-9);
    const r = new Phaser.Math.RandomDataGenerator(['far']);
    for (let x = -20; x < 1250; ) {
      const w = r.between(40, 100);
      const h = r.between(70, 200);
      far.fillStyle(mix(0x585c9c, 0x6b6aa6, r.frac() * 0.5), 1);
      far.fillRect(x, 372 - h, w, h);
      if (r.frac() > 0.6) far.fillTriangle(x - 4, 372 - h, x + w + 4, 372 - h, x + w / 2, 372 - h - r.between(18, 40));
      x += w + r.between(0, 14);
    }
    far.fillStyle(0x4d5090, 1);
    far.fillRect(690, 130, 44, 242);
    far.fillTriangle(684, 130, 740, 130, 712, 70);
    far.fillStyle(0xffe09a, 0.9);
    far.fillCircle(712, 165, 11);
    this.add.image(712, 165, 'glow').setScrollFactor(0.12).setBlendMode(ADD).setTint(0xffd27a).setScale(0.6).setAlpha(0.35).setDepth(-8.9);

    // mid-distance rooftops
    const mid = this.add.graphics().setScrollFactor(0.4).setDepth(-8);
    for (let x = -20; x < 1720; ) {
      const w = r.between(60, 140);
      const h = r.between(120, 250);
      mid.fillStyle(mix(0x353277, 0x242060, r.frac()), 1);
      mid.fillRect(x, 388 - h, w, h);
      if (r.frac() > 0.4) mid.fillTriangle(x - 6, 388 - h, x + w + 6, 388 - h, x + w / 2, 388 - h - r.between(28, 54));
      for (let i = 0; i < 5; i++) {
        if (r.frac() < 0.3) {
          mid.fillStyle(0xffc266, 0.55);
          mid.fillRect(x + r.between(8, w - 16), 388 - h + r.between(12, h - 24), 7, 10);
        }
      }
      x += w + r.between(0, 20);
    }
  }

  buildGround() {
    const g = this.add.graphics().setDepth(1);
    // sidewalk
    gradRect(g, 0, 385, W, 50, 0x504c98, 0x3a3772, 6);
    // curb
    g.fillStyle(0x7c78bc, 0.55);
    g.fillRect(0, 433, W, 3);
    g.fillStyle(0x15123a, 0.7);
    g.fillRect(0, 436, W, 4);
    // road
    gradRect(g, 0, 440, W, 100, 0x26225c, 0x14113a, 8);
    // shadow where wall meets pavement
    gradRect(g, 0, 385, W, 14, 0x000000, 0x000000, 5, 0.3, 0);

    // slab seams
    g.lineStyle(1, 0x15123a, 0.28);
    for (let x = 0; x < W; x += 74) g.lineBetween(x, 385, x - 4, 433);
    g.lineBetween(0, 410, W, 410);
    // cobbles
    const r = new Phaser.Math.RandomDataGenerator(['cobbles']);
    for (let i = 0; i < 1100; i++) {
      const lighter = r.frac() > 0.5;
      g.fillStyle(lighter ? 0x8f93d6 : 0x05031a, r.realInRange(0.04, 0.11));
      g.fillEllipse(r.between(0, W), r.between(444, 538), r.between(12, 26), r.between(5, 10));
    }
    // wet sheen where the sky reflects
    for (let i = 0; i < 26; i++) {
      this.add
        .image(r.between(0, W), r.between(450, 530), 'glow')
        .setBlendMode(ADD)
        .setTint(0x6a74d0)
        .setScale(r.realInRange(1.2, 2.4), 0.12)
        .setAlpha(0.06)
        .setDepth(2);
    }
  }

  buildTown() {
    const houses = [
      { x: 0, w: 300, h: 230, wall: 0x27235e, roof: 0x3d3278, doorCol: 1, smoke: true, seed: 1 },
      { x: 320, w: 240, h: 280, wall: 0x4a3868, roof: 0x27235e, doorCol: 1, seed: 2 },
      { x: 640, w: 330, h: 250, wall: 0x2f4668, roof: 0x4a3868, doorCol: 2, awning: true, seed: 3 },
      { x: 990, w: 260, h: 210, wall: 0x2b3c7a, roof: 0x27235e, doorCol: 0, seed: 4 },
      { x: 1270, w: 300, h: 270, wall: 0x3d3278, roof: 0x2f4668, doorCol: 2, smoke: true, seed: 5 },
      { x: 1650, w: 280, h: 240, wall: 0x27235e, roof: 0x4a3868, doorCol: 1, seed: 6 },
      { x: 1950, w: 330, h: 290, wall: 0x4a3868, roof: 0x2b3c7a, doorCol: 1, smoke: true, seed: 7 },
      { x: 2300, w: 260, h: 230, wall: 0x2f4668, roof: 0x3d3278, doorCol: 1, seed: 8 },
      { x: 2580, w: 220, h: 260, wall: 0x2b3c7a, roof: 0x4a3868, doorCol: 1, seed: 9 },
    ];
    this.doors = houses.map((h) => buildHouse(this, h).doorCx);
    buildAlley(this, 560, 80);
    buildAlley(this, 1570, 80);

    for (const x of LAMPS) buildLamp(this, x, 425, { broken: x === 1500 });
    buildSign(this, 2700, 440, 'Café  →');

    this.doors.forEach((dx, i) => {
      buildPlant(this, dx - 38, 402, 0.9 + (i % 3) * 0.15, i);
      if (i % 2 === 0) buildPlant(this, dx + 40, 404, 0.8, i + 20);
    });
    // leafy corners by the alleys
    buildPlant(this, 548, 400, 1.5, 51);
    buildPlant(this, 650, 398, 1.3, 52);
    buildPlant(this, 1560, 400, 1.4, 53);
    buildPlant(this, 1660, 398, 1.2, 54);
    buildPlant(this, 2540, 402, 1.2, 55);
  }

  buildPuddles() {
    const g = this.add.graphics().setDepth(2);
    for (const p of PUDDLES) {
      g.fillStyle(0x0d0b2a, 0.35);
      g.fillEllipse(p.x, p.y + 2, p.rx * 2 + 8, p.ry * 2 + 5);
      g.fillStyle(0x5a6cc0, 0.5);
      g.fillEllipse(p.x, p.y, p.rx * 2, p.ry * 2);
      g.fillStyle(0x9fb0ee, 0.2);
      g.fillEllipse(p.x - p.rx * 0.15, p.y - p.ry * 0.25, p.rx * 1.4, p.ry * 0.9);
      for (const lx of LAMPS) {
        if (Math.abs(lx - p.x) < 260) {
          const k = 1 - Math.abs(lx - p.x) / 300;
          const refl = this.add
            .image(p.x + (lx - p.x) * 0.1, p.y, 'glow')
            .setBlendMode(ADD)
            .setTint(0xffc266)
            .setScale(p.rx / 70, p.ry / 70)
            .setAlpha(0.5 * k)
            .setDepth(2.5);
          this.tweens.add({ targets: refl, alpha: 0.3 * k, duration: rnd(900, 1800), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
      }
    }
  }

  buildFx() {
    this.ripples = new Ripples(this, { puddles: PUDDLES });
    this.fx = {
      splash: (x, y, n = 5, spread = 14) => {
        for (let i = 0; i < n; i++) {
          const c = this.add.circle(x + rnd(-spread, spread), y, rnd(1.4, 2.6), 0xcfe0ff, 0.9).setDepth(800);
          this.tweens.add({
            targets: c, y: y - rnd(10, 28), x: c.x + rnd(-10, 10), alpha: 0,
            duration: rnd(300, 520), ease: 'Quad.easeOut', onComplete: () => c.destroy(),
          });
        }
      },
    };
  }

  buildCreatures() {
    this.frog = new Frog(this, this.audio, PUDDLES[3], this.ripples, this.fx);
    this.snail = new Snail(this, 780, 432, 740, 880);
    this.cat = new Cat(this, this.audio);
    this.fenn = new NPC(this, 1425, 448, 'fenn');
    this.lanternGlow = this.add
      .image(1425 + 25 * this.fenn.scale, 446 - 98 * this.fenn.scale, 'glow')
      .setBlendMode(ADD).setTint(0xffc266).setScale(0.7).setAlpha(0.5).setDepth(900);
    this.tweens.add({ targets: this.lanternGlow, alpha: 0.35, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  buildMist() {
    const spec = [
      { f: 0.5, y: 330, a: 0.16, s: 3, d: 8 },
      { f: 0.7, y: 380, a: 0.14, s: 2.6, d: 8 },
      { f: 0.9, y: 360, a: 0.14, s: 3.2, d: 8 },
      { f: 1.1, y: 470, a: 0.1, s: 3, d: 600 },
      { f: 1.25, y: 500, a: 0.08, s: 3.6, d: 600 },
      { f: 1.15, y: 420, a: 0.07, s: 3, d: 600 },
    ];
    spec.forEach((m, i) => {
      for (let k = 0; k < 4; k++) {
        const img = this.add
          .image(k * 900 + rnd(-200, 200), m.y + rnd(-20, 20), 'mist')
          .setScrollFactor(m.f)
          .setScale(m.s)
          .setAlpha(m.a)
          .setTint(0x9aa2e0)
          .setDepth(m.d);
        this.tweens.add({
          targets: img, x: img.x + (i % 2 ? -140 : 140), duration: rnd(22000, 40000), yoyo: true, repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    });
  }

  // ---------------------------------------------------------------- ui
  buildUI() {
    this.hint = this.add
      .text(480, 512, '', { fontFamily: FONT, fontSize: '16px', fontStyle: 'italic', color: '#c9c6ee', resolution: 2 })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2000)
      .setAlpha(0);

    this.muteBtn = this.add
      .text(932, 24, '♪', { fontFamily: FONT, fontSize: '28px', color: '#ffc266', resolution: 2 })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2000)
      .setAlpha(0.8)
      .setInteractive(new Phaser.Geom.Rectangle(-14, -14, 56, 56), Phaser.Geom.Rectangle.Contains);
    this.muteBtn.on('pointerdown', () => this.toggleMute());

    // "you can look closer" marker, hovering above Morrow
    const c = this.add.container(0, 0).setDepth(1500).setVisible(false);
    const ring = this.add.graphics();
    ring.fillStyle(0x0f0c2e, 0.85);
    ring.fillCircle(0, 0, 17);
    ring.lineStyle(2, 0xffc266, 0.9);
    ring.strokeCircle(0, 0, 17);
    const label = this.add
      .text(0, -1, this.touch ? '!' : 'E', { fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#ffc266', resolution: 2 })
      .setOrigin(0.5);
    c.add([ring, label]);
    c.setSize(60, 60).setInteractive();
    c.on('pointerdown', () => this.tryInteract());
    this.tweens.add({ targets: label, scale: 1.15, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.marker = c;
  }

  toggleMute() {
    const m = this.audio.toggleMute();
    this.muteBtn.setAlpha(m ? 0.3 : 0.8);
  }

  say(lines, onDone) {
    this.vel.x = this.vel.y = 0;
    this.dialogue.show(lines, onDone);
  }

  // ---------------------------------------------------------------- story beats
  beginIntro() {
    this.morrow.wake();
    this.cameras.main.fadeIn(2800, 11, 9, 34);
    this.time.delayedCall(3000, () => {
      this.audio.blip(1);
      this.say(
        [
          { who: null, text: '…', slow: true },
          { who: 'Morrow', text: 'Where… am I?' },
          { who: null, text: 'Rain. Lamplight. A very nice puddle.' },
          { who: 'Morrow', text: 'Well. This seems nice.', fx: () => this.morrow.excited() },
        ],
        () => {
          this.locked = false;
          this.hint.setText(this.touch ? 'touch and hold to walk' : 'WASD or arrows to walk  ·  E to look closer').setAlpha(0);
          this.tweens.add({ targets: this.hint, alpha: 0.9, duration: 800, hold: 7000, yoyo: true });
        },
      );
    });
  }

  buildInteractables() {
    const first = (key) => !this.flags[key] && (this.flags[key] = true);

    this.interactables = [
      {
        get: () => ({ x: 1500, y: 430 }), r: 85,
        run: () =>
          this.say(
            first('lamp')
              ? [
                  { who: null, text: 'The lamp flickers like it’s trying to remember how to shine.' },
                  { who: 'Morrow', text: 'It looks like it needs a friend.' },
                  { who: null, text: 'Someone nearby might know what’s wrong with it.' },
                ]
              : [{ who: null, text: 'The lamp hums. Hopefully.' }],
          ),
      },
      {
        get: () => ({ x: this.fenn.x, y: this.fenn.y }), r: 95,
        run: () => this.talkToFenn(),
      },
      {
        get: () => ({ x: this.snail.x, y: this.snail.sprite.y }), r: 60,
        run: () => {
          this.audio.chime();
          this.say(
            first('snail')
              ? [
                  { who: null, text: 'Morrow crouches. The snail does not look up.' },
                  { who: 'Morrow', text: 'Hello. You’re very… slow. In a good way.' },
                  { who: null, text: 'Three minutes pass. Morrow forgets what they were doing.' },
                ]
              : [{ who: null, text: 'The snail is on its way somewhere. Morrow respects that.' }],
            () => this.morrow.excited(),
          );
        },
      },
      {
        get: () => ({ x: this.frog.x, y: this.frog.y }), r: 70,
        run: () => {
          this.audio.ribbit();
          this.say([{ who: null, text: 'Ribbit.' }, { who: 'Morrow', text: 'Ribbit!' }], () => this.morrow.excited());
        },
      },
      {
        get: () => ({ x: 330, y: 470 }), r: 70,
        run: () =>
          this.say([{ who: null, text: 'Morrow looks in the puddle. Another Morrow looks back.' }, { who: 'Morrow', text: 'Hi!' }], () => {
            this.morrow.hop(16, 160);
            this.time.delayedCall(260, () => {
              this.audio.splash(true);
              this.fx.splash(this.morrow.x, this.morrow.y - 4, 10, 24);
              this.ripples.add(330, 470, 24, 1.2, 0.7);
            });
          }),
      },
      {
        get: () => ({ x: this.doors[0] - 38, y: 402 }), r: 60,
        run: () =>
          this.say([
            { who: null, text: 'A fern, doing its best.' },
            { who: null, text: 'Morrow pats a leaf. It drips onto their head. Worth it.' },
          ]),
      },
      {
        get: () => ({ x: 600, y: 410 }), r: 70,
        run: () =>
          this.say([
            { who: null, text: 'A narrow little alley. Far at the end, a lantern glows.' },
            { who: 'Morrow', text: 'I wonder what’s over there…' },
            { who: null, text: 'Not today. But Morrow will remember.' },
          ]),
      },
      {
        get: () => ({ x: 1610, y: 410 }), r: 70,
        run: () =>
          this.say([
            { who: null, text: 'Another alley. Something small rustles inside.' },
            { who: 'Morrow', text: '…Hello?' },
            { who: null, text: 'It rustles again. Politely.' },
          ]),
      },
      {
        get: () => ({ x: 2700, y: 440 }), r: 80,
        run: () =>
          this.say([
            { who: null, text: 'The sign says “Café”. It smells faintly of cinnamon from somewhere beyond the mist.' },
            { who: 'Morrow', text: '…Snacks?' },
            { who: null, text: 'The way ahead isn’t ready yet. Soon.' },
          ]),
      },
    ];
  }

  talkToFenn() {
    this.morrow.excited();
    if (!this.flags.fenn) {
      this.flags.fenn = true;
      this.say([
        { who: 'Fenn', text: 'Oh! A visitor. In this weather! Wonderful.' },
        { who: 'Fenn', text: 'I’m Fenn. I keep the lamps lit. Well. I keep most of the lamps lit.' },
        { who: 'Fenn', text: 'That one’s been flickering since the last thunderstorm. Or the one before.' },
        { who: 'Fenn', text: 'And you are…?' },
        { who: 'Morrow', text: 'Morrow! …I think.' },
        { who: 'Fenn', text: 'You think?' },
        { who: 'Morrow', text: '…', slow: true, fx: () => this.morrow.confused() },
        { who: 'Fenn', text: 'Where are you headed, little one?' },
        { who: 'Morrow', text: '…', slow: true },
        { who: 'Morrow', text: 'Snacks!' },
        { who: 'Fenn', text: 'Ha! Then you’ll want the café. Straight on, past the last lamp. Smells of cinnamon even from here.' },
        { who: 'Fenn', text: 'Come back if you find a spare lamp-glass. I’d be ever so grateful.' },
      ]);
    } else {
      this.say([
        { who: 'Fenn', text: 'The café’s straight on. Mind the puddles.' },
        { who: 'Fenn', text: 'Or don’t. I wouldn’t.' },
      ]);
    }
  }

  // ---------------------------------------------------------------- loop
  tryInteract() {
    if (this.near && !this.dialogue.active && !this.locked) this.near.run();
  }

  onStep() {
    if (this.inPuddle) {
      this.audio.splash(false);
      this.fx.splash(this.morrow.x, this.morrow.y - 2, 3, 12);
      this.ripples.add(this.morrow.x, this.morrow.y, 12, 0.8, 0.6);
    } else {
      this.audio.step();
    }
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    const m = this.morrow;

    if (this.inputSys.mutePressed) this.toggleMute();
    this.dialogue.update(dt);

    let vec = { x: 0, y: 0 };
    const act = this.inputSys.actionPressed;
    if (this.dialogue.active) {
      if (act) this.dialogue.advance();
    } else if (!this.locked) {
      vec = this.inputSys.vector;
      if (act) this.tryInteract();
    }

    // smooth acceleration
    const k = Math.min(1, dt * 9);
    this.vel.x += (vec.x * SPEED - this.vel.x) * k;
    this.vel.y += (vec.y * SPEED * 0.7 - this.vel.y) * k;
    m.x = Phaser.Math.Clamp(m.x + this.vel.x * dt, 50, W - 50);
    m.y = Phaser.Math.Clamp(m.y + this.vel.y * dt, TOP, BOT);
    m.setScale(0.88 + ((m.y - TOP) / (BOT - TOP)) * 0.32).setDepth(m.y);
    m.update(time, dt, this.vel.x, this.vel.y);

    // puddles
    const wasIn = this.inPuddle;
    this.inPuddle = PUDDLES.some((p) => ((m.x - p.x) / p.rx) ** 2 + ((m.y - p.y) / p.ry) ** 2 < 1);
    if (this.inPuddle && !wasIn) {
      m.hop(9, 110);
      this.audio.splash(true);
      this.fx.splash(m.x, m.y - 2, 7, 16);
      this.ripples.add(m.x, m.y, 18, 1, 0.7);
    }

    // what's nearby?
    let best = null;
    let bd = Infinity;
    for (const it of this.interactables) {
      const p = it.get();
      const d = Math.hypot(m.x - p.x, (m.y - p.y) * 1.6);
      if (d < it.r && d < bd) {
        bd = d;
        best = it;
      }
    }
    this.near = best;
    const show = !!best && !this.dialogue.active && !this.locked;
    this.marker.setVisible(show);
    if (show) this.marker.setPosition(m.x, m.y - 86 * m.scaleY + Math.sin(time * 0.005) * 3);

    // end of the (so far) street
    if (m.x > W - 90 && !this.endTalked && !this.dialogue.active) {
      this.endTalked = true;
      this.say(
        [
          { who: null, text: 'The street fades into mist. The rest of the town is still being dreamed up.' },
          { who: 'Morrow', text: 'I’ll come back. Promise.' },
        ],
        () => {
          this.tweens.add({ targets: m, x: W - 200, duration: 600, ease: 'Sine.easeOut' });
        },
      );
    }
    if (m.x < W - 220) this.endTalked = false;

    this.snail.update(dt, m);
    this.frog.update(dt, m);
    this.ripples.update(dt);
    this.rain.update(dt);
  }
}
