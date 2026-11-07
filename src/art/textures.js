// All art is drawn procedurally at boot, so the game ships with zero borrowed assets.
// Swap any of these for hand-painted PNGs later by loading an image under the same key.

const tex = (scene, key, w, h, draw) => {
  const t = scene.textures.createCanvas(key, w, h);
  draw(t.context, w, h);
  t.refresh();
};

const ellipse = (c, x, y, rx, ry, fill, rot = 0) => {
  c.fillStyle = fill;
  c.beginPath();
  c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  c.fill();
};

export function generateTextures(scene) {
  // ---------- light & atmosphere ----------
  tex(scene, 'glow', 256, 256, (c) => {
    const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.2, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.12)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 256, 256);
  });

  tex(scene, 'puff', 64, 64, (c) => {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(200,205,240,0.8)');
    g.addColorStop(1, 'rgba(200,205,240,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
  });

  tex(scene, 'mist', 512, 128, (c) => {
    c.translate(256, 64);
    c.scale(1, 0.25);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 256);
    g.addColorStop(0, 'rgba(170,178,230,0.9)');
    g.addColorStop(0.5, 'rgba(150,160,215,0.35)');
    g.addColorStop(1, 'rgba(140,150,210,0)');
    c.fillStyle = g;
    c.fillRect(-256, -256, 512, 512);
  });

  tex(scene, 'grain', 256, 256, (c) => {
    const img = c.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() > 0.5 ? 255 : 0;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = Math.random() * 42;
    }
    c.putImageData(img, 0, 0);
  });

  tex(scene, 'vignette', 960, 540, (c) => {
    const g = c.createRadialGradient(480, 270, 140, 480, 270, 620);
    g.addColorStop(0, 'rgba(5,3,26,0)');
    g.addColorStop(0.6, 'rgba(5,3,26,0.18)');
    g.addColorStop(1, 'rgba(5,3,26,0.78)');
    c.fillStyle = g;
    c.fillRect(0, 0, 960, 540);
  });

  tex(scene, 'sky', 16, 540, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 540);
    g.addColorStop(0, '#0d0b2b');
    g.addColorStop(0.4, '#26226a');
    g.addColorStop(0.7, '#4b4a94');
    g.addColorStop(1, '#6b6aa6');
    c.fillStyle = g;
    c.fillRect(0, 0, 16, 540);
  });

  // ---------- Morrow ----------
  tex(scene, 'shadow', 48, 16, (c) => {
    const g = c.createRadialGradient(24, 8, 0, 24, 8, 24);
    g.addColorStop(0, 'rgba(5,3,26,0.8)');
    g.addColorStop(1, 'rgba(5,3,26,0)');
    c.save();
    c.scale(1, 0.34);
    c.fillStyle = g;
    c.fillRect(0, 0, 48, 48);
    c.restore();
  });

  tex(scene, 'foot', 14, 8, (c) => {
    ellipse(c, 7, 4, 6.5, 3.6, '#d9667a');
    ellipse(c, 6, 3, 3.5, 1.6, 'rgba(255,200,210,0.5)');
  });

  tex(scene, 'morrow_body', 64, 64, (c) => {
    // rain-cloak body
    const body = c.createLinearGradient(0, 28, 0, 62);
    body.addColorStop(0, '#f4b94c');
    body.addColorStop(1, '#d68a2c');
    ellipse(c, 32, 46, 21, 16, body);
    // tiny hands
    ellipse(c, 11, 49, 4.2, 3.2, '#f6d9a8');
    ellipse(c, 53, 49, 4.2, 3.2, '#f6d9a8');
    // oversized hood
    const hood = c.createRadialGradient(24, 22, 3, 32, 32, 29);
    hood.addColorStop(0, '#ffe39a');
    hood.addColorStop(1, '#eba740');
    c.fillStyle = hood;
    c.beginPath();
    c.ellipse(32, 33, 23, 21.5, 0, 0, Math.PI * 2);
    c.fill();
    // droopy hood tip
    c.beginPath();
    c.moveTo(21, 16);
    c.quadraticCurveTo(22, 1, 40, 3);
    c.quadraticCurveTo(31, 7, 35, 14);
    c.closePath();
    c.fill();
    // face opening
    c.strokeStyle = 'rgba(160,85,20,0.55)';
    c.lineWidth = 2.5;
    c.fillStyle = '#2b2358';
    c.beginPath();
    c.ellipse(32, 35, 15.5, 12.5, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    // little hem button
    ellipse(c, 32, 55, 2.2, 2.2, 'rgba(120,60,10,0.45)');
  });

  tex(scene, 'eye', 16, 16, (c) => {
    const g = c.createRadialGradient(8, 8, 1, 8, 8, 8);
    g.addColorStop(0, '#fffbe8');
    g.addColorStop(1, '#ffe9b8');
    ellipse(c, 8, 8, 7.2, 7.2, g);
  });

  tex(scene, 'pupil', 10, 10, (c) => {
    ellipse(c, 5, 5, 4.4, 4.4, '#1d1840');
    ellipse(c, 3.6, 3.6, 1.5, 1.5, '#ffffff');
  });

  // ---------- plants & props ----------
  tex(scene, 'leaf', 16, 34, (c) => {
    const g = c.createLinearGradient(0, 34, 0, 0);
    g.addColorStop(0, '#2f8060');
    g.addColorStop(1, '#6fcf8a');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(8, 33);
    c.bezierCurveTo(-4, 24, -1, 8, 8, 1);
    c.bezierCurveTo(17, 8, 20, 24, 8, 33);
    c.fill();
    c.strokeStyle = 'rgba(20,70,50,0.45)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(8, 31);
    c.lineTo(8, 5);
    c.stroke();
  });

  tex(scene, 'pot', 30, 24, (c) => {
    c.fillStyle = '#a65a52';
    c.beginPath();
    c.moveTo(4, 5);
    c.lineTo(26, 5);
    c.lineTo(23, 23);
    c.lineTo(7, 23);
    c.closePath();
    c.fill();
    c.fillStyle = '#c27067';
    c.fillRect(2, 2, 26, 5);
    c.fillStyle = 'rgba(0,0,0,0.18)';
    c.fillRect(17, 7, 6, 16);
  });

  tex(scene, 'flower', 10, 10, (c) => {
    ellipse(c, 5, 5, 4.6, 4.6, '#f08aa6');
    ellipse(c, 5, 5, 1.8, 1.8, '#ffe39a');
  });

  // ---------- critters ----------
  tex(scene, 'frog', 28, 22, (c) => {
    ellipse(c, 14, 14, 11, 7.5, '#5fb86b');
    ellipse(c, 14, 17, 7, 4, '#a9e0a0');
    ellipse(c, 5, 19, 4, 2, '#4aa05a');
    ellipse(c, 23, 19, 4, 2, '#4aa05a');
    ellipse(c, 8, 7, 4, 4, '#5fb86b');
    ellipse(c, 20, 7, 4, 4, '#5fb86b');
    ellipse(c, 8, 6.6, 2.6, 2.6, '#fffbe8');
    ellipse(c, 20, 6.6, 2.6, 2.6, '#fffbe8');
    ellipse(c, 8.4, 6.8, 1.3, 1.3, '#1d1840');
    ellipse(c, 20.4, 6.8, 1.3, 1.3, '#1d1840');
    c.strokeStyle = '#2f7a44';
    c.lineWidth = 1;
    c.beginPath();
    c.arc(14, 13, 4, 0.15 * Math.PI, 0.85 * Math.PI);
    c.stroke();
  });

  tex(scene, 'snail', 30, 22, (c) => {
    ellipse(c, 14, 18, 13, 3.4, '#cdbfa0');
    ellipse(c, 4, 15, 4, 4, '#cdbfa0');
    c.strokeStyle = '#cdbfa0';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(3, 12);
    c.lineTo(1.5, 6);
    c.moveTo(6, 12);
    c.lineTo(7.5, 6);
    c.stroke();
    ellipse(c, 1.5, 5.5, 1.3, 1.3, '#1d1840');
    ellipse(c, 7.5, 5.5, 1.3, 1.3, '#1d1840');
    const shell = c.createRadialGradient(17, 8, 1, 17, 10, 10);
    shell.addColorStop(0, '#f7a8b8');
    shell.addColorStop(1, '#d8697f');
    ellipse(c, 18, 10, 9, 9, shell);
    c.strokeStyle = 'rgba(120,30,60,0.55)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.arc(18, 10, 5.5, 0.4, Math.PI * 1.7);
    c.arc(18.5, 10, 2.6, 0, Math.PI * 1.5);
    c.stroke();
  });

  tex(scene, 'cat', 48, 30, (c) => {
    c.fillStyle = '#15122f';
    c.beginPath();
    c.ellipse(21, 19, 14, 7, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(36, 12, 7, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(30, 8); c.lineTo(31, 0); c.lineTo(36, 6); c.fill();
    c.beginPath();
    c.moveTo(37, 6); c.lineTo(42, 0); c.lineTo(43, 9); c.fill();
    c.strokeStyle = '#15122f';
    c.lineWidth = 3;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(8, 17);
    c.quadraticCurveTo(0, 14, 2, 4);
    c.stroke();
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(14, 23); c.lineTo(12, 29);
    c.moveTo(28, 23); c.lineTo(30, 29);
    c.stroke();
    ellipse(c, 38.5, 11.5, 1.5, 1.8, '#ffc266');
    ellipse(c, 42, 11.5, 1.5, 1.8, '#ffc266');
  });

  // ---------- Fenn, keeper of the lamps ----------
  tex(scene, 'fenn', 76, 108, (c) => {
    // lamp pole
    c.strokeStyle = '#6b4a35';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(63, 106);
    c.lineTo(63, 14);
    c.stroke();
    c.fillStyle = '#ffd27a';
    c.fillRect(58, 5, 10, 11);
    c.strokeStyle = '#3a2a2a';
    c.lineWidth = 1.5;
    c.strokeRect(58, 5, 10, 11);
    // coat
    const coat = c.createLinearGradient(0, 40, 0, 106);
    coat.addColorStop(0, '#5b8299');
    coat.addColorStop(1, '#34546c');
    ellipse(c, 34, 74, 23, 32, coat);
    c.fillStyle = '#2b4559';
    c.beginPath();
    c.moveTo(34, 46); c.lineTo(24, 70); c.lineTo(34, 100); c.lineTo(44, 70); c.closePath();
    c.fill();
    ellipse(c, 34, 66, 2, 2, '#ffd27a');
    ellipse(c, 34, 78, 2, 2, '#ffd27a');
    ellipse(c, 34, 90, 2, 2, '#ffd27a');
    // paw on pole
    ellipse(c, 60, 68, 4.5, 4, '#e8e3ee');
    // feet
    ellipse(c, 24, 104, 8, 3.4, '#2a2540');
    ellipse(c, 44, 104, 8, 3.4, '#2a2540');
    // head
    ellipse(c, 34, 38, 16, 15, '#ebe6f0');
    ellipse(c, 25, 22, 4.2, 4.2, '#2a2540');
    ellipse(c, 43, 22, 4.2, 4.2, '#2a2540');
    ellipse(c, 25, 22.8, 2, 2, '#ebe6f0');
    ellipse(c, 43, 22.8, 2, 2, '#ebe6f0');
    ellipse(c, 27.5, 37, 3.6, 11, '#2a2540');
    ellipse(c, 40.5, 37, 3.6, 11, '#2a2540');
    ellipse(c, 27.5, 35, 1.7, 1.9, '#fff3d0');
    ellipse(c, 40.5, 35, 1.7, 1.9, '#fff3d0');
    ellipse(c, 34, 44, 3.4, 2.6, '#2a2540');
    ellipse(c, 34, 43.3, 1.2, 0.8, '#6e6890');
    // lamplighter's hat
    c.fillStyle = '#2a2540';
    c.fillRect(24, 0, 20, 15);
    ellipse(c, 34, 15, 19, 3.6, '#2a2540');
    c.fillStyle = '#ffd27a';
    c.fillRect(24, 10, 20, 3);
  });
}
