// src/scenes/PlacementScene.js
import { LAYOUT, COLORS, PieceType, Owner, Difficulty, TEXT_COLORS } from '../config.js';
import { addStageBackground, addTextButton, UI_COPY } from '../ui/visuals.js';

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
    if (this.difficulty !== Difficulty.HARD) {
      this._autoStart();
      return;
    }

    const cx = LAYOUT.GAME_WIDTH / 2;
    addStageBackground(this, UI_COPY.placement.title);

    this.add.text(cx, 132, UI_COPY.placement.subtitle, {
      fontSize: '16px',
      color: TEXT_COLORS.MUTED,
    }).setOrigin(0.5);

    this.countText = this.add.text(cx, 164, `${UI_COPY.placement.count}: 0 / ${PAWN_COUNT}`, {
      fontSize: '16px',
      color: TEXT_COLORS.GOLD,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this._drawBoard();

    this.readyButton = addTextButton(this, cx, 545, 190, 48, UI_COPY.placement.ready, { enabled: false });
    this.readyButton.rect.on('pointerdown', () => {
      if (this.pawnCount < PAWN_COUNT) return;
      this._startGame();
    });

    this._randomizePawns();
  }

  _drawBoard() {
    this.cellGraphics = {};
    const boardX = LAYOUT.BOARD_OFFSET_X + 120;
    const boardY = 185;
    const cellSize = 64;
    const frame = this.add.graphics();
    frame.fillStyle(COLORS.BOARD_FRAME, 1);
    frame.fillRoundedRect(boardX - 12, boardY - 12, cellSize * 5 + 24, cellSize * 5 + 24, 8);
    frame.lineStyle(2, COLORS.PANEL_EDGE, 0.8);
    frame.strokeRoundedRect(boardX - 12, boardY - 12, cellSize * 5 + 24, cellSize * 5 + 24, 8);

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const x = boardX + c * cellSize + cellSize / 2;
        const y = boardY + r * cellSize + cellSize / 2;
        const isLight = (r + c) % 2 === 0;
        const cell = this.add.rectangle(x, y, cellSize - 2, cellSize - 2,
          isLight ? COLORS.BOARD_LIGHT : COLORS.BOARD_DARK);
        cell.setStrokeStyle(1, 0x2c1b12, 0.38);

        if (r === KING_ROW && c === KING_COL) {
          this.add.text(x, y, '왕', { fontSize: '22px', color: TEXT_COLORS.SUCCESS, fontStyle: 'bold' }).setOrigin(0.5);
          continue;
        }

        if (r >= 3) {
          cell.setInteractive({ useHandCursor: true });
          cell.on('pointerover', () => { if (!this.placed[`${r},${c}`]) cell.setFillStyle(0xc8e08a); });
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
      this.cellGraphics[key].text = this.add.text(x, y, '병', {
        fontSize: '22px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);
      cell.setFillStyle(COLORS.EMERALD);
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

    if (this.difficulty === Difficulty.EASY) {
      this._showTutorialPrompt(placements);
    } else {
      this.time.delayedCall(50, () => {
        this.scene.start('Game', { difficulty: this.difficulty, playerPlacements: placements });
      });
    }
  }

  _showTutorialPrompt(placements) {
    const cx = LAYOUT.GAME_WIDTH / 2, cy = LAYOUT.GAME_HEIGHT / 2;
    addStageBackground(this, '');

    this.add.text(cx, cy - 62, UI_COPY.tutorialPrompt.title, {
      fontSize: '28px', color: TEXT_COLORS.PRIMARY, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, cy - 24, UI_COPY.tutorialPrompt.body, {
      fontSize: '16px', color: TEXT_COLORS.MUTED,
    }).setOrigin(0.5);

    const yes = addTextButton(this, cx - 78, cy + 42, 130, 46, UI_COPY.tutorialPrompt.yes, { active: true });
    const no = addTextButton(this, cx + 78, cy + 42, 130, 46, UI_COPY.tutorialPrompt.no);

    yes.rect.on('pointerdown', () =>
      this.scene.start('Game', { difficulty: this.difficulty, playerPlacements: placements, tutorialMode: true }));
    no.rect.on('pointerdown', () =>
      this.scene.start('Game', { difficulty: this.difficulty, playerPlacements: placements }));
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
    this.countText.setText(`${UI_COPY.placement.count}: ${this.pawnCount} / ${PAWN_COUNT}`);
    this.readyButton.rect.setData('enabled', ready);
    this.readyButton.rect.setFillStyle(ready ? COLORS.EMERALD : COLORS.BUTTON_DISABLED);
    this.readyButton.rect.setAlpha(ready ? 1 : 0.5);
    this.readyButton.text.setColor(ready ? TEXT_COLORS.PRIMARY : TEXT_COLORS.DIM);
  }
}
