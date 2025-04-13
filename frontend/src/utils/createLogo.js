function createLogo(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
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

  return canvas.toDataURL('image/png');
}

// Gerar logos
const logo192 = createLogo(192);
const logo512 = createLogo(512);

// Download
function downloadLogo(dataUrl, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

downloadLogo(logo192, 'logo192.png');
downloadLogo(logo512, 'logo512.png'); 