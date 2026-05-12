// src/scenes/GameScene.js
import { Board } from '../game/Board.js';
import { Piece } from '../game/Piece.js';
import { MoveCalculator } from '../game/MoveCalculator.js';
import { CheckDetector } from '../game/CheckDetector.js';
import { SummonSystem } from '../game/SummonSystem.js';
import { AIController } from '../game/AIController.js';
import {
  PieceType, Owner, COLORS, LAYOUT, MANA_PER_TURN, TURN_TIME_LIMIT,
  AI_THINK_DELAY, PIECE_LABELS, TEXT_COLORS, BOARD_SIZE,
} from '../config.js';

const State = {
  WAITING: 'WAITING',
  SELECTED: 'SELECTED',
  SUMMON_MODE: 'SUMMON_MODE',
  AI_TURN: 'AI_TURN',
  GAME_OVER: 'GAME_OVER',
};

export class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) {
    this.difficulty = data.difficulty;
    this.playerPlacements = data.playerPlacements;
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
    this.summonedCells = new Set();

    this._setupBoard();
    this._drawBoard();
    const boardCX = LAYOUT.BOARD_OFFSET_X + (BOARD_SIZE * LAYOUT.CELL_SIZE) / 2;
    const boardCY = LAYOUT.BOARD_OFFSET_Y + (BOARD_SIZE * LAYOUT.CELL_SIZE) / 2;
    this.aiOverlay = this.add.rectangle(
      boardCX, boardCY,
      BOARD_SIZE * LAYOUT.CELL_SIZE, BOARD_SIZE * LAYOUT.CELL_SIZE,
      0x000000,
    ).setDepth(1).setAlpha(0);
    this._refreshBoard();
    this.scene.launch('UI');
    this._startTurn(Owner.PLAYER);
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
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 5; c++) {
        const x = LAYOUT.BOARD_OFFSET_X + c * LAYOUT.CELL_SIZE + LAYOUT.CELL_SIZE / 2;
        const y = LAYOUT.BOARD_OFFSET_Y + r * LAYOUT.CELL_SIZE + LAYOUT.CELL_SIZE / 2;
        const isLight = (r + c) % 2 === 0;
        const cell = this.add.rectangle(x, y, LAYOUT.CELL_SIZE - 2, LAYOUT.CELL_SIZE - 2,
          isLight ? COLORS.BOARD_LIGHT : COLORS.BOARD_DARK);
        cell.setInteractive();
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
        // 자신의 위치
        visible.add(`${r},${c}`);
        // 인접 1칸
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE)
              visible.add(`${nr},${nc}`);
          }
        // 이동 가능한 모든 경로
        const moves = this.calc.getMoves(this.board, r, c);
        for (const m of moves) visible.add(`${m.row},${m.col}`);
      }
    // 체크를 거는 적 기물은 항상 보임
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
          g.fillStyle(0x000000, 1);
          g.fillRect(x, y, LAYOUT.CELL_SIZE, LAYOUT.CELL_SIZE);
          g.setDepth(2);
          this.fogGraphics.push(g);
        }
      }
  }

  _renderPiece(r, c, piece) {
    const x = LAYOUT.BOARD_OFFSET_X + c * LAYOUT.CELL_SIZE + LAYOUT.CELL_SIZE / 2;
    const y = LAYOUT.BOARD_OFFSET_Y + r * LAYOUT.CELL_SIZE + LAYOUT.CELL_SIZE / 2;
    const isKing = piece.type === PieceType.KING;
    const color = isKing
      ? (piece.owner === Owner.PLAYER ? TEXT_COLORS.KING_PLAYER : TEXT_COLORS.KING_AI)
      : (piece.owner === Owner.PLAYER ? TEXT_COLORS.PLAYER_PIECE : TEXT_COLORS.AI_PIECE);
    const obj = this.add.text(x, y, PIECE_LABELS[piece.type], {
      fontSize: isKing ? '30px' : '26px', color, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(4);
    this.pieceObjects[`${r},${c}`] = obj;
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
      g.fillRect(x, y, LAYOUT.CELL_SIZE, LAYOUT.CELL_SIZE);
      g.setDepth(3);
      this.highlightGraphics.push(g);
    }
  }

  _onCellClick(r, c) {
    if (this.state === State.AI_TURN || this.state === State.GAME_OVER) return;
    if (this.animating) return;

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
        this._checkGameOver();
        if (this.state === State.GAME_OVER) return;
        if (this.hasMoved) { this._endTurn(); return; }
        this._showMovablePieces();
        this._showThreatsIfInCheck();
        this._emitPlayerAction();
        return;
      }
      this._clearHighlights();
      this.state = State.WAITING;
      this.pendingSummonType = null;
      return;
    }

    if (this.state === State.SELECTED) {
      if (this.selectedCell.row === r && this.selectedCell.col === c) {
        this._clearHighlights();
        this.state = State.WAITING;
        this.selectedCell = null;
        this._showMovablePieces();
        this._showThreatsIfInCheck();
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
          this._checkPromotion();
          this._refreshBoard();
          this._checkGameOver();
          if (this.state === State.GAME_OVER) return;
          if (this.hasSummoned || this.timeLeft <= 0) { this._endTurn(); return; }
          this._showThreatsIfInCheck();
          this._emitPlayerAction();
        });
        return;
      }
      this._clearHighlights();
      this.state = State.WAITING;
      this.selectedCell = null;
      this._showMovablePieces();
      this._showThreatsIfInCheck();
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
      flash.fillStyle(0xff2200, 0.9);
      flash.fillRect(cx, cy, LAYOUT.CELL_SIZE, LAYOUT.CELL_SIZE);
      flash.setDepth(6);
      this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
    }

    if (!piece) { callback(); return; }

    const isKing = piece.type === PieceType.KING;
    const color = isKing
      ? (piece.owner === Owner.PLAYER ? TEXT_COLORS.KING_PLAYER : TEXT_COLORS.KING_AI)
      : (piece.owner === Owner.PLAYER ? TEXT_COLORS.PLAYER_PIECE : TEXT_COLORS.AI_PIECE);

    const origObj = this.pieceObjects[`${fr},${fc}`];
    if (origObj) origObj.setVisible(false);

    const animPiece = this.add.text(fromX, fromY, PIECE_LABELS[piece.type], {
      fontSize: isKing ? '30px' : '26px', color, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(6);

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
    flash.fillStyle(0xffdd00, 0.9);
    flash.fillCircle(x, y, LAYOUT.CELL_SIZE / 2);
    flash.setDepth(6);
    this.tweens.add({ targets: flash, alpha: 0, scaleX: 2, scaleY: 2, duration: 400, onComplete: () => flash.destroy() });
  }

  _animateCheck() {
    const kingPos = this.board.findKing(Owner.PLAYER);
    if (!kingPos) return;
    // 킹 셀에 빨간 테두리 표시
    if (this.checkRing) { this.checkRing.destroy(); this.checkRing = null; }
    const x = LAYOUT.BOARD_OFFSET_X + kingPos.col * LAYOUT.CELL_SIZE;
    const y = LAYOUT.BOARD_OFFSET_Y + kingPos.row * LAYOUT.CELL_SIZE;
    const ring = this.add.graphics();
    ring.lineStyle(4, 0xff2200, 1);
    ring.strokeRect(x + 2, y + 2, LAYOUT.CELL_SIZE - 4, LAYOUT.CELL_SIZE - 4);
    ring.setDepth(5);
    this.checkRing = ring;
    // 테두리 깜빡임
    this.tweens.add({ targets: ring, alpha: 0.3, duration: 300, yoyo: true, repeat: 3 });
  }

  _clearCheckRing() {
    if (this.checkRing) { this.checkRing.destroy(); this.checkRing = null; }
  }

  _showTurnBanner(owner) {
    const cx = LAYOUT.BOARD_OFFSET_X + (BOARD_SIZE * LAYOUT.CELL_SIZE) / 2;
    const cy = LAYOUT.BOARD_OFFSET_Y + (BOARD_SIZE * LAYOUT.CELL_SIZE) / 2;
    const isPlayer = owner === Owner.PLAYER;
    const label = isPlayer ? '내 턴' : 'AI 턴';
    const accentColor = isPlayer ? 0x2ecc71 : 0xff6b35;
    const bgColor = isPlayer ? 0x071a0f : 0x1a0707;
    const textColor = isPlayer ? '#2ecc71' : '#ff6b35';

    const border = this.add.rectangle(cx, cy, 228, 78, accentColor).setDepth(10).setAlpha(0);
    const bg = this.add.rectangle(cx, cy, 220, 70, bgColor).setDepth(10).setAlpha(0);
    const txt = this.add.text(cx, cy, label, {
      fontSize: '38px', color: textColor, fontStyle: 'bold',
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
    this._highlightCells(movable, COLORS.MOVABLE_PIECE, 0.35);
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

  _emitPlayerAction() {
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
      this.aiOverlay.setAlpha(0.28);
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
    }
  }

  _tickTimer() {
    this.timeLeft--;
    this.events.emit('timer-tick', this.timeLeft);
    if (this.timeLeft <= 0) {
      if (this.turnTimer) { this.turnTimer.remove(); this.turnTimer = null; }
      // 애니메이션 중이면 애니메이션 콜백이 끝난 뒤 endTurn 처리
      if (this.board.currentTurn === Owner.PLAYER && !this.animating) this._endTurn();
    }
  }

  _endTurn() {
    if (this.turnTimer) { this.turnTimer.remove(); this.turnTimer = null; }
    this._clearHighlights();
    this.pendingSummonType = null;
    this.state = State.WAITING;
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
        flash.fillStyle(0xff2200, 0.9);
        flash.fillRect(cx, cy, LAYOUT.CELL_SIZE, LAYOUT.CELL_SIZE);
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
    if (this.turnTimer) this.turnTimer.remove();
    this.time.delayedCall(800, () => {
      this.scene.stop('UI');
      this.scene.start('Result', { winner, difficulty: this.difficulty });
    });
  }

  startSummonMode(pieceType) {
    if (this.hasSummoned) return;
    // 같은 버튼 → 취소
    if (this.state === State.SUMMON_MODE && this.pendingSummonType === pieceType) {
      this._clearHighlights();
      this.pendingSummonType = null;
      this.state = State.WAITING;
      this._showMovablePieces();
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
    if (this.state === State.WAITING && this.board.currentTurn === Owner.PLAYER) this._endTurn();
  }

  surrender() {
    if (this.state === State.GAME_OVER) return;
    this._gameOver(Owner.AI);
  }

  getMana() { return this.board.mana; }
  getCurrentTurn() { return this.board.currentTurn; }
  getSummonCounts() { return this.board.summonCounts[Owner.PLAYER]; }
}
