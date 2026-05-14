// src/scenes/GameScene.js
import { Board } from '../game/Board.js';
import { Piece } from '../game/Piece.js';
import { MoveCalculator } from '../game/MoveCalculator.js';
import { CheckDetector } from '../game/CheckDetector.js';
import { SummonSystem } from '../game/SummonSystem.js';
import { AIController } from '../game/AIController.js';
import {
  PieceType, Owner, COLORS, LAYOUT, MANA_PER_TURN, TURN_TIME_LIMIT,
  AI_THINK_DELAY, BOARD_SIZE,
} from '../config.js';
import { getTurnHint, UI_COPY } from '../ui/visuals.js';

const State = {
  WAITING: 'WAITING',
  SELECTED: 'SELECTED',
  SUMMON_MODE: 'SUMMON_MODE',
  AI_TURN: 'AI_TURN',
  GAME_OVER: 'GAME_OVER',
};

const PIECE_TYPES = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

export class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  preload() {
    for (const t of PIECE_TYPES) {
      this.load.image(`${t}_w`, `assets/pieces/${t}_w.png`);
      this.load.image(`${t}_d`, `assets/pieces/${t}_d.png`);
    }
  }

  init(data) {
    this.difficulty = data.difficulty;
    this.playerPlacements = data.playerPlacements;
    this.tutorialMode = data.tutorialMode || false;
  }

  create() {
    this.board = new Board();
    this.calc = new MoveCalculator();
    this.detector = new CheckDetector();
    this.summonSys = new SummonSystem();
    this.ai = new AIController(this.difficulty);
    this.state = State.WAITING;
    this.selectedCell = null;
    this.highlightGraphics = [];
    this.pieceObjects = {};
    this.timeLeft = TURN_TIME_LIMIT;
    this.pendingSummonType = null;
    this.turnTimer = null;
    this.hasMoved = false;
    this.hasSummoned = false;
    this.fogGraphics = [];
    this.animating = false;
    this.checkRing = null;
    this.hintText = null;
    this.currentHintMode = 'default';
    this.summonedCells = new Set();

    this._drawStage();
    this._setupBoard();
    this._drawBoard();
    const boardCX = LAYOUT.BOARD_OFFSET_X + (BOARD_SIZE * LAYOUT.CELL_SIZE) / 2;
    const boardCY = LAYOUT.BOARD_OFFSET_Y + (BOARD_SIZE * LAYOUT.CELL_SIZE) / 2;
    this.aiOverlay = this.add.rectangle(
      boardCX, boardCY,
      BOARD_SIZE * LAYOUT.CELL_SIZE, BOARD_SIZE * LAYOUT.CELL_SIZE,
      0x000000,
    ).setDepth(1).setAlpha(0);
    this.tutorialLocked = false;
    this._refreshBoard();
    this.scene.launch('UI');
    this.input.on('pointerdown', this._onPointerDown, this);
    this._startTurn(Owner.PLAYER);
    if (this.tutorialMode) this.scene.launch('Tutorial');
  }

  _drawStage() {
    this.add.rectangle(LAYOUT.GAME_WIDTH / 2, LAYOUT.GAME_HEIGHT / 2, LAYOUT.GAME_WIDTH, LAYOUT.GAME_HEIGHT, COLORS.BACKDROP);
    const g = this.add.graphics();
    g.fillStyle(COLORS.PANEL_BG, 0.86);
    g.fillRect(0, 0, LAYOUT.GAME_WIDTH, LAYOUT.GAME_HEIGHT);
    g.fillStyle(COLORS.PANEL_DEEP, 0.78);
    g.fillRoundedRect(LAYOUT.BOARD_OFFSET_X - 22, LAYOUT.BOARD_OFFSET_Y - 22,
      BOARD_SIZE * LAYOUT.CELL_SIZE + 44, BOARD_SIZE * LAYOUT.CELL_SIZE + 44, 10);
    g.lineStyle(3, COLORS.PANEL_EDGE, 0.74);
    g.strokeRoundedRect(LAYOUT.BOARD_OFFSET_X - 22, LAYOUT.BOARD_OFFSET_Y - 22,
      BOARD_SIZE * LAYOUT.CELL_SIZE + 44, BOARD_SIZE * LAYOUT.CELL_SIZE + 44, 10);
    g.lineStyle(1, COLORS.GOLD, 0.25);
    g.strokeRoundedRect(LAYOUT.BOARD_OFFSET_X - 11, LAYOUT.BOARD_OFFSET_Y - 11,
      BOARD_SIZE * LAYOUT.CELL_SIZE + 22, BOARD_SIZE * LAYOUT.CELL_SIZE + 22, 4);

    const hintY = LAYOUT.BOARD_OFFSET_Y + BOARD_SIZE * LAYOUT.CELL_SIZE + 50;
    addHintFrame(this, LAYOUT.BOARD_OFFSET_X - 6, hintY - 18, BOARD_SIZE * LAYOUT.CELL_SIZE + 12, 38);
    this.hintText = this.add.text(
      LAYOUT.BOARD_OFFSET_X + (BOARD_SIZE * LAYOUT.CELL_SIZE) / 2,
      hintY,
      '',
      { fontSize: '15px', color: '#ffffff', fontStyle: 'bold', align: 'center' },
    ).setOrigin(0.5).setDepth(6);
  }

  _setupBoard() {
    this.board.setPiece(0, 2, new Piece(PieceType.KING, Owner.AI));
    this.board.setPiece(1, 0, new Piece(PieceType.PAWN, Owner.AI));
    this.board.setPiece(1, 1, new Piece(PieceType.PAWN, Owner.AI));
    this.board.setPiece(1, 3, new Piece(PieceType.PAWN, Owner.AI));
    this.board.setPiece(1, 4, new Piece(PieceType.PAWN, Owner.AI));
    this.board.setPiece(4, 2, new Piece(PieceType.KING, Owner.PLAYER));
    for (const { row, col } of this.playerPlacements)
      this.board.setPiece(row, col, new Piece(PieceType.PAWN, Owner.PLAYER));
  }

  _drawBoard() {
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++) {
        const x = LAYOUT.BOARD_OFFSET_X + c * LAYOUT.CELL_SIZE + LAYOUT.CELL_SIZE / 2;
        const y = LAYOUT.BOARD_OFFSET_Y + r * LAYOUT.CELL_SIZE + LAYOUT.CELL_SIZE / 2;
        const isLight = (r + c) % 2 === 0;
        const cell = this.add.rectangle(x, y, LAYOUT.CELL_SIZE - 2, LAYOUT.CELL_SIZE - 2,
          isLight ? COLORS.BOARD_LIGHT : COLORS.BOARD_DARK);
        cell.setStrokeStyle(1, 0x2e2118, 0.45);
        cell.setInteractive({ useHandCursor: true });
        cell.on('pointerdown', () => this._onCellClick(r, c));
      }
  }

  _refreshBoard() {
    this._renderAllPieces();
    this._renderFog();
  }

  _renderAllPieces() {
    Object.values(this.pieceObjects).forEach(o => o.destroy());
    this.pieceObjects = {};
    const visible = this._getVisibleCells();
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = this.board.getPiece(r, c);
        if (piece && (piece.owner === Owner.PLAYER || visible.has(`${r},${c}`)))
          this._renderPiece(r, c, piece);
      }
  }

  _getVisibleCells() {
    const visible = new Set();
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = this.board.getPiece(r, c);
        if (!piece || piece.owner !== Owner.PLAYER) continue;
        visible.add(`${r},${c}`);
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE)
              visible.add(`${nr},${nc}`);
          }
        const moves = this.calc.getMoves(this.board, r, c);
        for (const m of moves) visible.add(`${m.row},${m.col}`);
      }
    const threats = this.detector.getThreats(this.board, Owner.PLAYER);
    for (const t of threats) visible.add(`${t.row},${t.col}`);
    return visible;
  }

  _renderFog() {
    this.fogGraphics.forEach(g => g.destroy());
    this.fogGraphics = [];
    const visible = this._getVisibleCells();
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (!visible.has(`${r},${c}`)) {
          const x = LAYOUT.BOARD_OFFSET_X + c * LAYOUT.CELL_SIZE;
          const y = LAYOUT.BOARD_OFFSET_Y + r * LAYOUT.CELL_SIZE;
          const g = this.add.graphics();
          g.fillStyle(0x030711, 0.86);
          g.fillRect(x, y, LAYOUT.CELL_SIZE, LAYOUT.CELL_SIZE);
          g.fillStyle(0x1b2540, 0.18);
          g.fillCircle(x + LAYOUT.CELL_SIZE / 2, y + LAYOUT.CELL_SIZE / 2, 23);
          g.lineStyle(1, COLORS.PANEL_EDGE, 0.15);
          g.strokeRect(x + 2, y + 2, LAYOUT.CELL_SIZE - 4, LAYOUT.CELL_SIZE - 4);
          g.setDepth(2);
          this.fogGraphics.push(g);
        }
      }
  }

  _renderPiece(r, c, piece) {
    const x = LAYOUT.BOARD_OFFSET_X + c * LAYOUT.CELL_SIZE + LAYOUT.CELL_SIZE / 2;
    const y = LAYOUT.BOARD_OFFSET_Y + r * LAYOUT.CELL_SIZE + LAYOUT.CELL_SIZE / 2;
    const key = `${piece.type.toLowerCase()}_${piece.owner === Owner.PLAYER ? 'w' : 'd'}`;
    const shadow = this.add.ellipse(
      x + 2,
      y + LAYOUT.CELL_SIZE * 0.34,
      LAYOUT.PIECE_SHADOW_WIDTH,
      LAYOUT.PIECE_SHADOW_HEIGHT,
      0x000000,
      0.34,
    ).setDepth(3);
    const obj = this.add.image(x, y, key)
      .setDisplaySize(LAYOUT.PIECE_SIZE, LAYOUT.PIECE_SIZE)
      .setDepth(4);
    this.pieceObjects[`${r},${c}`] = {
      destroy: () => { shadow.destroy(); obj.destroy(); },
      setVisible: visible => { shadow.setVisible(visible); obj.setVisible(visible); },
    };
  }

  _clearHighlights() {
    this.highlightGraphics.forEach(g => g.destroy());
    this.highlightGraphics = [];
  }

  _highlightCells(cells, color, alpha = 0.45) {
    for (const { row, col } of cells) {
      const x = LAYOUT.BOARD_OFFSET_X + col * LAYOUT.CELL_SIZE;
      const y = LAYOUT.BOARD_OFFSET_Y + row * LAYOUT.CELL_SIZE;
      const g = this.add.graphics();
      g.fillStyle(color, alpha);
      g.fillRoundedRect(x + 4, y + 4, LAYOUT.CELL_SIZE - 8, LAYOUT.CELL_SIZE - 8, 6);
      g.lineStyle(2, color, Math.min(1, alpha + 0.25));
      g.strokeRoundedRect(x + 5, y + 5, LAYOUT.CELL_SIZE - 10, LAYOUT.CELL_SIZE - 10, 6);
      g.setDepth(3);
      this.highlightGraphics.push(g);
    }
  }

  _onPointerDown(pointer) {
    if (!pointer?.rightButtonDown?.()) return;
    if (this.state !== State.SELECTED) return;
    if (this.animating || this.tutorialLocked) return;
    this._cancelSelectedMove();
  }

  _cancelSelectedMove() {
    this._clearHighlights();
    this.state = State.WAITING;
    this.selectedCell = null;
    this._showMovablePieces();
    this._showThreatsIfInCheck();
    this._updateHint('default');
  }

  _onCellClick(r, c) {
    if (this.state === State.AI_TURN || this.state === State.GAME_OVER) return;
    if (this.animating) return;
    if (this.tutorialLocked) return;

    if (this.state === State.SUMMON_MODE) {
      const squares = this.summonSys.getSummonableSquares(this.board, Owner.PLAYER);
      if (squares.some(s => s.row === r && s.col === c)) {
        this.summonSys.summon(this.board, Owner.PLAYER, this.pendingSummonType, r, c);
        this.hasSummoned = true;
        this.summonedCells.add(`${r},${c}`);
        this._clearHighlights();
        this.state = State.WAITING;
        this.pendingSummonType = null;
        this._refreshBoard();
        this._animateSummon(r, c);
        if (this.tutorialMode) this.events.emit('tutorial-summoned');
        this._checkGameOver();
        if (this.state === State.GAME_OVER) return;
        if (this.hasMoved) {
          if (!this.tutorialMode) { this._endTurn(); return; }
          this._emitPlayerAction();
          return;
        }
        this._showMovablePieces();
        this._showThreatsIfInCheck();
        this._emitPlayerAction();
        return;
      }
      this._clearHighlights();
      this.state = State.WAITING;
      this.pendingSummonType = null;
      this._showMovablePieces();
      this._updateHint('default');
      this.events.emit('summon-cancel');
      return;
    }

    if (this.state === State.SELECTED) {
      if (this.selectedCell.row === r && this.selectedCell.col === c) {
        this._cancelSelectedMove();
        return;
      }
      const moves = this.calc.getMoves(this.board, this.selectedCell.row, this.selectedCell.col);
      if (moves.some(m => m.row === r && m.col === c)) {
        const isCapture = !!this.board.getPiece(r, c);
        const { row: fr, col: fc } = this.selectedCell;
        this._clearHighlights();
        this.state = State.WAITING;
        this.selectedCell = null;
        this.animating = true;
        this._animateMove(fr, fc, r, c, isCapture, () => {
          this.animating = false;
          this.board.movePiece(fr, fc, r, c);
          this.hasMoved = true;
          if (this.tutorialMode) this.events.emit('tutorial-piece-moved');
          this._checkPromotion();
          this._refreshBoard();
          this._checkGameOver();
          if (this.state === State.GAME_OVER) return;
          if (this.hasSummoned || this.timeLeft <= 0) {
            if (!this.tutorialMode) { this._endTurn(); return; }
            this._emitPlayerAction();
            return;
          }
          this._showThreatsIfInCheck();
          this._emitPlayerAction();
        });
        return;
      }
      this._cancelSelectedMove();
    }

    const piece = this.board.getPiece(r, c);
    if (piece && piece.owner === Owner.PLAYER) {
      if (this.hasMoved) return;
      if (this.summonedCells.has(`${r},${c}`)) return;
      this.state = State.SELECTED;
      this.selectedCell = { row: r, col: c };
      const moves = this.calc.getMoves(this.board, r, c);
      this._clearHighlights();
      this._highlightCells([{ row: r, col: c }], COLORS.SELECTED);
      this._highlightCells(moves, COLORS.MOVE_HIGHLIGHT);
      this._showThreatsIfInCheck();
      this._updateHint('selected');
      if (this.tutorialMode) this.events.emit('tutorial-piece-selected');
    }
  }

  _animateMove(fr, fc, tr, tc, isCapture, callback) {
    const fromX = LAYOUT.BOARD_OFFSET_X + fc * LAYOUT.CELL_SIZE + LAYOUT.CELL_SIZE / 2;
    const fromY = LAYOUT.BOARD_OFFSET_Y + fr * LAYOUT.CELL_SIZE + LAYOUT.CELL_SIZE / 2;
    const toX = LAYOUT.BOARD_OFFSET_X + tc * LAYOUT.CELL_SIZE + LAYOUT.CELL_SIZE / 2;
    const toY = LAYOUT.BOARD_OFFSET_Y + tr * LAYOUT.CELL_SIZE + LAYOUT.CELL_SIZE / 2;
    const piece = this.board.getPiece(fr, fc);

    if (isCapture) {
      const cx = LAYOUT.BOARD_OFFSET_X + tc * LAYOUT.CELL_SIZE;
      const cy = LAYOUT.BOARD_OFFSET_Y + tr * LAYOUT.CELL_SIZE;
      const flash = this.add.graphics();
      flash.fillStyle(COLORS.THREAT, 0.82);
      flash.fillRoundedRect(cx + 4, cy + 4, LAYOUT.CELL_SIZE - 8, LAYOUT.CELL_SIZE - 8, 6);
      flash.setDepth(6);
      this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
    }

    if (!piece) { callback(); return; }
    const origObj = this.pieceObjects[`${fr},${fc}`];
    if (origObj) origObj.setVisible(false);

    const key = `${piece.type.toLowerCase()}_${piece.owner === Owner.PLAYER ? 'w' : 'd'}`;
    const animPiece = this.add.image(fromX, fromY, key)
      .setDisplaySize(LAYOUT.PIECE_SIZE, LAYOUT.PIECE_SIZE)
      .setDepth(6);

    this.tweens.add({
      targets: animPiece,
      x: toX,
      y: toY,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        animPiece.destroy();
        callback();
      },
    });
  }

  _animateSummon(r, c) {
    const x = LAYOUT.BOARD_OFFSET_X + c * LAYOUT.CELL_SIZE + LAYOUT.CELL_SIZE / 2;
    const y = LAYOUT.BOARD_OFFSET_Y + r * LAYOUT.CELL_SIZE + LAYOUT.CELL_SIZE / 2;
    const flash = this.add.graphics();
    flash.fillStyle(COLORS.GOLD, 0.92);
    flash.fillCircle(x, y, LAYOUT.CELL_SIZE / 2);
    flash.lineStyle(3, 0xffffff, 0.8);
    flash.strokeCircle(x, y, LAYOUT.CELL_SIZE / 2 + 4);
    flash.setDepth(6);
    this.tweens.add({ targets: flash, alpha: 0, scaleX: 2, scaleY: 2, duration: 420, onComplete: () => flash.destroy() });
  }

  _animateCheck() {
    const kingPos = this.board.findKing(Owner.PLAYER);
    if (!kingPos) return;
    if (this.checkRing) { this.checkRing.destroy(); this.checkRing = null; }
    const x = LAYOUT.BOARD_OFFSET_X + kingPos.col * LAYOUT.CELL_SIZE;
    const y = LAYOUT.BOARD_OFFSET_Y + kingPos.row * LAYOUT.CELL_SIZE;
    const ring = this.add.graphics();
    ring.lineStyle(4, COLORS.THREAT, 1);
    ring.strokeRoundedRect(x + 3, y + 3, LAYOUT.CELL_SIZE - 6, LAYOUT.CELL_SIZE - 6, 6);
    ring.setDepth(5);
    this.checkRing = ring;
    this.tweens.add({ targets: ring, alpha: 0.25, duration: 300, yoyo: true, repeat: 3 });
  }

  _clearCheckRing() {
    if (this.checkRing) { this.checkRing.destroy(); this.checkRing = null; }
  }

  _showTurnBanner(owner) {
    const cx = LAYOUT.BOARD_OFFSET_X + (BOARD_SIZE * LAYOUT.CELL_SIZE) / 2;
    const cy = LAYOUT.BOARD_OFFSET_Y + (BOARD_SIZE * LAYOUT.CELL_SIZE) / 2;
    const isPlayer = owner === Owner.PLAYER;
    const label = isPlayer ? UI_COPY.game.playerTurn : UI_COPY.game.aiTurn;
    const accentColor = isPlayer ? COLORS.EMERALD : 0xff6b35;
    const bgColor = isPlayer ? 0x071a0f : 0x1a0707;
    const textColor = isPlayer ? '#2ecc71' : '#ff6b35';

    const border = this.add.rectangle(cx, cy, 242, 80, accentColor).setDepth(10).setAlpha(0);
    const bg = this.add.rectangle(cx, cy, 232, 70, bgColor).setDepth(10).setAlpha(0);
    const txt = this.add.text(cx, cy, label, {
      fontSize: '34px', color: textColor, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11).setAlpha(0);

    const targets = [border, bg, txt];
    this.tweens.add({
      targets,
      alpha: 1,
      duration: 150,
      ease: 'Power2',
      onComplete: () => {
        this.time.delayedCall(550, () => {
          this.tweens.add({
            targets,
            alpha: 0,
            duration: 250,
            onComplete: () => { border.destroy(); bg.destroy(); txt.destroy(); },
          });
        });
      },
    });
  }

  _showMovablePieces() {
    if (this.hasMoved) return;
    const movable = [];
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = this.board.getPiece(r, c);
        if (piece && piece.owner === Owner.PLAYER && !this.summonedCells.has(`${r},${c}`)) {
          const moves = this.calc.getMoves(this.board, r, c);
          if (moves.length > 0) movable.push({ row: r, col: c });
        }
      }
    this._highlightCells(movable, COLORS.MOVABLE_PIECE, 0.32);
  }

  _showThreatsIfInCheck() {
    if (this.detector.isInCheck(this.board, Owner.PLAYER)) {
      const threats = this.detector.getThreats(this.board, Owner.PLAYER);
      this._highlightCells(threats, COLORS.THREAT, 0.7);
      this.events.emit('check', true);
      this._animateCheck();
    } else {
      this._clearCheckRing();
      this.events.emit('check', false);
    }
  }

  _updateHint(mode = 'default') {
    this.currentHintMode = mode;
    if (!this.hintText) return;
    const hint = getTurnHint({
      hasMoved: this.hasMoved,
      hasSummoned: this.hasSummoned,
      mode,
    });
    this.hintText.setText(hint);
    this.hintText.setColor(mode === 'summon' ? '#6fffe0' : (mode === 'ai' ? '#f7c84b' : '#ffffff'));
  }

  _emitPlayerAction() {
    this._updateHint('default');
    this.events.emit('player-action', {
      hasMoved: this.hasMoved,
      hasSummoned: this.hasSummoned,
      mana: this.board.mana[Owner.PLAYER],
      summonCounts: this.board.summonCounts[Owner.PLAYER],
    });
  }

  _startTurn(owner) {
    this.board.addMana(owner, MANA_PER_TURN);
    this.board.currentTurn = owner;
    this.timeLeft = TURN_TIME_LIMIT;
    this.hasMoved = false;
    this.hasSummoned = false;
    this.summonedCells = new Set();
    this.pendingSummonType = null;

    if (this.turnTimer) { this.turnTimer.remove(); this.turnTimer = null; }
    this._showTurnBanner(owner);
    this.events.emit('turn-start', {
      turn: owner,
      mana: this.board.mana,
      timeLeft: this.timeLeft,
      summonCounts: this.board.summonCounts[Owner.PLAYER],
    });

    if (owner === Owner.AI) {
      this.state = State.AI_TURN;
      this.aiOverlay.setAlpha(0.25);
      this._updateHint('ai');
      this.time.delayedCall(AI_THINK_DELAY, this._doAITurn, [], this);
    } else {
      this.aiOverlay.setAlpha(0);
      this.turnTimer = this.time.addEvent({
        delay: 1000,
        callback: this._tickTimer,
        callbackScope: this,
        loop: true,
      });
      this.state = State.WAITING;
      this._showMovablePieces();
      this._showThreatsIfInCheck();
      this._updateHint('default');
    }
  }

  _tickTimer() {
    this.timeLeft--;
    this.events.emit('timer-tick', this.timeLeft);
    if (this.timeLeft <= 0) {
      if (this.turnTimer) { this.turnTimer.remove(); this.turnTimer = null; }
      if (this.board.currentTurn === Owner.PLAYER && !this.animating) this._endTurn();
    }
  }

  _endTurn() {
    if (this.turnTimer) { this.turnTimer.remove(); this.turnTimer = null; }
    this._clearHighlights();
    this.selectedCell = null;
    this.pendingSummonType = null;
    this.state = State.WAITING;
    this._updateHint('ai');
    const next = this.board.currentTurn === Owner.PLAYER ? Owner.AI : Owner.PLAYER;
    this._startTurn(next);
  }

  _doAITurn() {
    const moveAction = this.ai.getMove(this.board);
    if (moveAction) {
      const isCapture = !!this.board.getPiece(moveAction.to.row, moveAction.to.col);
      const visible = this._getVisibleCells();
      const srcVisible = visible.has(`${moveAction.from.row},${moveAction.from.col}`);
      if (srcVisible) {
        this.animating = true;
        this._animateMove(moveAction.from.row, moveAction.from.col, moveAction.to.row, moveAction.to.col, isCapture, () => {
          this.animating = false;
          this.board.movePiece(moveAction.from.row, moveAction.from.col, moveAction.to.row, moveAction.to.col);
          this._doAIPostMove();
        });
        return;
      } else if (isCapture && visible.has(`${moveAction.to.row},${moveAction.to.col}`)) {
        const cx = LAYOUT.BOARD_OFFSET_X + moveAction.to.col * LAYOUT.CELL_SIZE;
        const cy = LAYOUT.BOARD_OFFSET_Y + moveAction.to.row * LAYOUT.CELL_SIZE;
        const flash = this.add.graphics();
        flash.fillStyle(COLORS.THREAT, 0.86);
        flash.fillRoundedRect(cx + 4, cy + 4, LAYOUT.CELL_SIZE - 8, LAYOUT.CELL_SIZE - 8, 6);
        flash.setDepth(6);
        this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
      }
      this.board.movePiece(moveAction.from.row, moveAction.from.col, moveAction.to.row, moveAction.to.col);
    }
    this._doAIPostMove();
  }

  _doAIPostMove() {
    const summonAction = this.ai.getSummon(this.board);
    if (summonAction) {
      this.summonSys.summon(this.board, Owner.AI, summonAction.pieceType, summonAction.to.row, summonAction.to.col);
    }
    this._checkPromotion();
    this._refreshBoard();
    if (summonAction) {
      const visible = this._getVisibleCells();
      if (visible.has(`${summonAction.to.row},${summonAction.to.col}`))
        this._animateSummon(summonAction.to.row, summonAction.to.col);
    }
    this._checkGameOver();
    if (this.state !== State.GAME_OVER) this._endTurn();
  }

  _checkGameOver() {
    if (!this.board.findKing(Owner.PLAYER)) {
      this._gameOver(Owner.AI);
    } else if (!this.board.findKing(Owner.AI)) {
      this._gameOver(Owner.PLAYER);
    } else if (this.detector.isCheckmate(this.board, Owner.PLAYER)) {
      this._gameOver(Owner.AI);
    } else if (this.detector.isCheckmate(this.board, Owner.AI)) {
      this._gameOver(Owner.PLAYER);
    }
  }

  _gameOver(winner) {
    this.state = State.GAME_OVER;
    this.input.off('pointerdown', this._onPointerDown, this);
    if (this.turnTimer) this.turnTimer.remove();
    this.time.delayedCall(800, () => {
      this.scene.stop('UI');
      if (this.tutorialMode) this.scene.stop('Tutorial');
      this.scene.start('Result', { winner, difficulty: this.difficulty });
    });
  }

  startSummonMode(pieceType) {
    if (this.tutorialLocked) return;
    if (this.hasSummoned) return;
    if (this.state === State.SUMMON_MODE && this.pendingSummonType === pieceType) {
      this._clearHighlights();
      this.pendingSummonType = null;
      this.state = State.WAITING;
      this._showMovablePieces();
      this._updateHint('default');
      this.events.emit('summon-cancel');
      return;
    }
    if (this.state !== State.WAITING && this.state !== State.SUMMON_MODE) return;
    if (!this.summonSys.canSummon(this.board, Owner.PLAYER, pieceType)) return;
    this.pendingSummonType = pieceType;
    this.state = State.SUMMON_MODE;
    this._clearHighlights();
    const squares = this.summonSys.getSummonableSquares(this.board, Owner.PLAYER);
    this._highlightCells(squares, COLORS.SUMMON_HIGHLIGHT);
    this._updateHint('summon');
    this.events.emit('summon-mode', { pieceType, hasMoved: this.hasMoved, hasSummoned: this.hasSummoned });
    if (this.tutorialMode) this.events.emit('tutorial-summon-clicked');
  }

  _checkPromotion() {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const pp = this.board.getPiece(0, c);
      if (pp?.type === PieceType.PAWN && pp.owner === Owner.PLAYER)
        this.board.setPiece(0, c, new Piece(PieceType.QUEEN, Owner.PLAYER));
      const ap = this.board.getPiece(4, c);
      if (ap?.type === PieceType.PAWN && ap.owner === Owner.AI)
        this.board.setPiece(4, c, new Piece(PieceType.QUEEN, Owner.AI));
    }
  }

  endTurnManually() {
    const canEnd = [State.WAITING, State.SELECTED, State.SUMMON_MODE].includes(this.state);
    if (canEnd && this.board.currentTurn === Owner.PLAYER && !this.animating) {
      if (this.tutorialMode) this.events.emit('tutorial-turn-ended');
      this._endTurn();
    }
  }

  surrender() {
    if (this.state === State.GAME_OVER) return;
    this._gameOver(Owner.AI);
  }

  getMana() { return this.board.mana; }
  getCurrentTurn() { return this.board.currentTurn; }
  getSummonCounts() { return this.board.summonCounts[Owner.PLAYER]; }
}

function addHintFrame(scene, x, y, width, height) {
  const g = scene.add.graphics().setDepth(5);
  g.fillStyle(COLORS.PANEL_DEEP, 0.92);
  g.fillRoundedRect(x, y, width, height, 8);
  g.lineStyle(2, COLORS.PANEL_EDGE, 0.62);
  g.strokeRoundedRect(x, y, width, height, 8);
  return g;
}
