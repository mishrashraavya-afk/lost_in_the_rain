// Screen-space finish shared by every scene: film grain + vignette.
export default function addAtmosphere(scene) {
  const grain = scene.add
    .tileSprite(0, 0, 960 + 256, 540 + 256, 'grain')
    .setOrigin(0)
    .setScrollFactor(0)
    .setDepth(1000);
  scene.time.addEvent({
    delay: 70,
    loop: true,
    callback: () => {
      grain.tilePositionX = Math.random() * 256;
      grain.tilePositionY = Math.random() * 256;
    },
  });
  scene.add.image(480, 270, 'vignette').setScrollFactor(0).setDepth(1001);
}
