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

// 고정 배경색으로 투명 처리 (보드 배경색 직접 지정)
// 어두운 칸 ~(40,43,86), 밝은 칸 ~(84,88,156) 중간값 기준
function removeBg(img, tol, bgR=62, bgG=65, bgB=121) {
  const w = img.getWidth(), h = img.getHeight();
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
  await crop(src,  214, 600, 128, 215, 'rook_w.png',   55);
  await crop(src,  352, 600, 128, 215, 'knight_w.png', 55);
  await crop(src,  490, 600, 124, 215, 'bishop_w.png', 55);
  await crop(src,  628, 600, 132, 225, 'queen_w.png',  55);
  await crop(src,  766, 615, 136, 260, 'king_w.png',   55);
  // 흰 폰: 실측 y≈533, x≈270
  await crop(src,  270, 533,  80,  62, 'pawn_w.png',   55);

  // 검은 말: y≈88 (확인됨), x: a8=337 b8=438 c8=539 d8=640 e8=741
  // 어두운 말 몸체가 배경과 유사하므로 tol=12로 최소 제거
  console.log('\n[DARK pieces]');
  await crop(src,  337,  88,  90, 112, 'rook_d.png',   12);
  await crop(src,  438,  88,  90, 112, 'knight_d.png', 12);
  await crop(src,  539,  88,  86, 110, 'bishop_d.png', 12);
  await crop(src,  640,  88,  94, 114, 'queen_d.png',  12);
  await crop(src,  741,  88,  96, 118, 'king_d.png',   12);
  // 검은 폰: y≈195 (확인됨)
  await crop(src,  301, 195,  74,  96, 'pawn_d.png',   12);

  console.log(`\nDone → ${OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
