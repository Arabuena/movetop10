const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function createLogo(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fundo vermelho
  ctx.fillStyle = '#E30613';
  ctx.fillRect(0, 0, size, size);

  // Círculos brancos
  ctx.fillStyle = 'white';
  const radius = size * 0.15;
  const center1x = size * 0.375;
  const center2x = size * 0.625;
  const centery = size * 0.5;

  ctx.beginPath();
  ctx.arc(center1x, centery, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(center2x, centery, radius, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

// Gerar os logos
[192, 512].forEach(size => {
  const canvas = createLogo(size);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(
    path.join(__dirname, '..', 'public', `logo${size}.png`),
    buffer
  );
  console.log(`Generated logo${size}.png`);
}); 