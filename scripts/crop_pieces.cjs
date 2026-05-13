// scripts/crop_pieces.cjs
// 체스 이미지에서 말 스프라이트를 잘라 public/assets/pieces/ 에 저장
const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

const SRC  = path.resolve(__dirname, '../src/play_Image.png');
const OUT  = path.resolve(__dirname, '../public/assets/pieces');
const SIZE = 72;

function intToRGBA(n) {
  return { r: (n >> 24) & 0xFF, g: (n >> 16) & 0xFF, b: (n >> 8) & 0xFF, a: n & 0xFF };
}

// 모서리 4점 평균을 배경색으로 보고 유사 픽셀을 투명 처리
function removeBg(img, tol) {
  const w = img.getWidth(), h = img.getHeight();
  const pts = [[2,2],[w-3,2],[2,h-3],[w-3,h-3]];
  let rT=0, gT=0, bT=0;
  for (const [x,y] of pts) {
    const c = intToRGBA(img.getPixelColor(x,y));
    rT+=c.r; gT+=c.g; bT+=c.b;
  }
  const bgR=rT/4, bgG=gT/4, bgB=bT/4;
  img.scan(0, 0, w, h, function(x, y, idx) {
    const r = this.bitmap.data[idx];
    const g = this.bitmap.data[idx+1];
    const b = this.bitmap.data[idx+2];
    const d = Math.sqrt((r-bgR)**2 + (g-bgG)**2 + (b-bgB)**2);
    if (d < tol) this.bitmap.data[idx+3] = 0;
  });
  return img;
}

async function crop(src, cx, cy, cw, ch, name, tol=48) {
  const left = Math.max(0, Math.round(cx - cw/2));
  const top  = Math.max(0, Math.round(cy - ch/2));
  const w    = Math.min(cw, src.getWidth()  - left);
  const h    = Math.min(ch, src.getHeight() - top);
  let piece = src.clone();
  piece.crop(left, top, w, h);
  removeBg(piece, tol);
  piece.resize(SIZE, SIZE, Jimp.RESIZE_LANCZOS3);
  await piece.writeAsync(path.join(OUT, name));
  console.log(`  ✓ ${name}  (crop: ${left},${top} ${w}×${h})`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const src = await Jimp.read(SRC);
  console.log(`Source: ${src.getWidth()} × ${src.getHeight()}`);

  // 열 간격 138px: a=214 b=352 c=490 d=628 e=766 / y_center≈600
  // 확인된 좌표 (col_a~col_d 및 wide_king_w 크롭 검증 완료)
  console.log('\n[WHITE pieces]');
  await crop(src,  214, 600, 128, 215, 'rook_w.png');
  await crop(src,  352, 600, 128, 215, 'knight_w.png');
  await crop(src,  490, 600, 124, 215, 'bishop_w.png');
  await crop(src,  628, 600, 132, 225, 'queen_w.png');
  await crop(src,  766, 615, 136, 260, 'king_w.png');
  // 흰 폰: col_a 위쪽(y≈490), 높이를 줄여 뒤 룩과 분리
  await crop(src,  250, 486, 110,  92, 'pawn_w.png', 52);

  // 검은 말: y≈88 (확인됨), x: a8=337 b8=438 c8=539 d8=640 e8=741
  console.log('\n[DARK pieces]');
  await crop(src,  337,  88,  90, 112, 'rook_d.png',   35);
  await crop(src,  438,  88,  90, 112, 'knight_d.png', 35);
  await crop(src,  539,  88,  86, 110, 'bishop_d.png', 35);
  await crop(src,  640,  88,  94, 114, 'queen_d.png',  35);
  await crop(src,  741,  88,  96, 118, 'king_d.png',   35);
  // 검은 폰: y≈195 (확인됨)
  await crop(src,  301, 195,  74,  96, 'pawn_d.png',   35);

  console.log(`\nDone → ${OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
