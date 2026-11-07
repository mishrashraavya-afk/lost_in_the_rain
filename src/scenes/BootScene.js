import Phaser from 'phaser';
import { generateTextures } from '../art/textures.js';
import AmbientAudio from '../systems/AmbientAudio.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    generateTextures(this);
    this.registry.set('audio', new AmbientAudio());
    this.scene.start('MainMenu');
  }
}
