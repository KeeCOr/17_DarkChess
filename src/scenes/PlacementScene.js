// src/scenes/PlacementScene.js
import { LAYOUT, COLORS, PieceType, Owner, Difficulty } from '../config.js';

const KING_ROW = 4, KING_COL = 2;
const PAWN_COUNT = 4;

export class PlacementScene extends Phaser.Scene {
  constructor() { super('Placement'); }

  init(data) {
    this.difficulty = data.difficulty;
    this.placed = {};
    this.pawnCount = 0;
  }

  create() {
    // EASY / MEDIUM: 자동 배치 후 즉시 게임 시작
    if (this.difficulty !== Difficulty.HARD) {
      this._autoStart();
      return;
    }

    const cx = LAYOUT.GAME_WIDTH / 2;
    this.add.rectangle(cx, LAYOUT.GAME_HEIGHT / 2, LAYOUT.GAME_WIDTH, LAYOUT.GAME_HEIGHT, COLORS.PANEL_BG);

    this.add.text(cx, 30, '폰 배치 (4개)', {
      fontSize: '22px', color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(cx, 60, '아래 2행에 폰을 배치하세요', {
      fontSize: '16px', color: '#aaaaaa',
    }).setOrigin(0.5);

    this._drawBoard();

    const cx2 = LAYOUT.GAME_WIDTH / 2;
    this.readyBtn = this.add.rectangle(cx2, 540, 180, 46, 0x555555).setInteractive();
    this.readyText = this.add.text(cx2, 540, '준비 완료', {
      fontSize: '20px', color: '#888888',
    }).setOrigin(0.5);

    this._randomizePawns();

    this.readyBtn.on('pointerdown', () => {
      if (this.pawnCount < PAWN_COUNT) return;
      this._startGame();
    });
  }

  _drawBoard() {
    this.cellGraphics = {};
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const x = LAYOUT.BOARD_OFFSET_X + c * LAYOUT.CELL_SIZE + LAYOUT.CELL_SIZE / 2;
        const y = LAYOUT.BOARD_OFFSET_Y + r * LAYOUT.CELL_SIZE + LAYOUT.CELL_SIZE / 2;
        const isLight = (r + c) % 2 === 0;
        const cell = this.add.rectangle(x, y, LAYOUT.CELL_SIZE - 2, LAYOUT.CELL_SIZE - 2,
          isLight ? COLORS.BOARD_LIGHT : COLORS.BOARD_DARK);

        if (r === KING_ROW && c === KING_COL) {
          this.add.text(x, y, 'K', { fontSize: '28px', color: '#2ecc71', fontStyle: 'bold' }).setOrigin(0.5);
          continue;
        }

        if (r >= 3) {
          cell.setInteractive();
          cell.on('pointerover', () => { if (!this.placed[`${r},${c}`]) cell.setFillStyle(0xaaffaa); });
          cell.on('pointerout', () => { if (!this.placed[`${r},${c}`]) cell.setFillStyle(isLight ? COLORS.BOARD_LIGHT : COLORS.BOARD_DARK); });
          cell.on('pointerdown', () => this._togglePawn(r, c, x, y, cell, isLight));
          this.cellGraphics[`${r},${c}`] = { cell, x, y, isLight, text: null };
        }
      }
    }
  }

  _togglePawn(r, c, x, y, cell, isLight) {
    const key = `${r},${c}`;
    if (this.placed[key]) {
      delete this.placed[key];
      this.pawnCount--;
      this.cellGraphics[key].text?.destroy();
      this.cellGraphics[key].text = null;
      cell.setFillStyle(isLight ? COLORS.BOARD_LIGHT : COLORS.BOARD_DARK);
    } else {
      if (this.pawnCount >= PAWN_COUNT) return;
      this.placed[key] = true;
      this.pawnCount++;
      this.cellGraphics[key].text = this.add.text(x, y, 'P', {
        fontSize: '26px', color: '#4a90d9', fontStyle: 'bold',
      }).setOrigin(0.5);
      cell.setFillStyle(0x4a90d9);
    }
    this._updateReadyButton();
  }

  _autoStart() {
    const cells = [];
    for (let r = 3; r <= 4; r++)
      for (let c = 0; c < 5; c++)
        if (!(r === KING_ROW && c === KING_COL)) cells.push({ row: r, col: c });
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    const placements = cells.slice(0, PAWN_COUNT);
    this.time.delayedCall(50, () => {
      this.scene.start('Game', { difficulty: this.difficulty, playerPlacements: placements });
    });
  }

  _startGame() {
    const placements = Object.keys(this.placed).map(key => {
      const [r, c] = key.split(',').map(Number);
      return { row: r, col: c };
    });
    this.time.delayedCall(50, () => {
      this.scene.start('Game', { difficulty: this.difficulty, playerPlacements: placements });
    });
  }

  _randomizePawns() {
    const cells = [];
    for (let r = 3; r <= 4; r++)
      for (let c = 0; c < 5; c++)
        if (!(r === KING_ROW && c === KING_COL)) cells.push([r, c]);
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    for (let i = 0; i < PAWN_COUNT; i++) {
      const [r, c] = cells[i];
      const { cell, x, y, isLight } = this.cellGraphics[`${r},${c}`];
      this._togglePawn(r, c, x, y, cell, isLight);
    }
  }

  _updateReadyButton() {
    const ready = this.pawnCount >= PAWN_COUNT;
    this.readyBtn.setFillStyle(ready ? 0x2a8a4a : 0x555555);
    this.readyText.setColor(ready ? '#ffffff' : '#888888');
  }
}
