// Quick diagnostic - save horizontal strips to find exact piece positions
const Jimp = require('jimp');
const path = require('path');

const SRC = path.resolve(__dirname, '../src/play_Image.png');

async function main() {
  const src = await Jimp.read(SRC);
  console.log(`Image: ${src.getWidth()} x ${src.getHeight()}`);

  // Save a tall strip covering white pieces area (full width, y=480-680)
  const strip = src.clone().crop(0, 460, src.getWidth(), 260);
  await strip.writeAsync(path.join(__dirname, 'white_strip.png'));
  console.log('Saved white_strip.png (y=460-720, full width)');

  // Save individual column checks at various x positions
  const xs = [190, 214, 250, 304, 340, 352, 380, 420, 480, 490, 550, 628, 644, 700, 766, 814];
  for (const x of xs) {
    const col = src.clone().crop(Math.max(0,x-30), 460, 60, 260);
    await col.writeAsync(path.join(__dirname, `cx_${x}.png`));
  }
  console.log('Saved cx_*.png strips');
}

main().catch(e => { console.error(e); process.exit(1); });
