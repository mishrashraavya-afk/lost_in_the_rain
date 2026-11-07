import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MainMenu from './scenes/MainMenu.js';
import FirstStreet from './scenes/FirstStreet.js';

new Phaser.Game({
  type: location.search.includes('canvas') ? Phaser.CANVAS : Phaser.AUTO, // ?canvas = debug fallback
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#0b0922',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: true, roundPixels: false },
  input: { activePointers: 2 },
  audio: { noAudio: true }, // we use our own WebAudio synth
  scene: [BootScene, MainMenu, FirstStreet],
});
