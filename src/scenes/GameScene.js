// src/scenes/GameScene.js
import { Board } from '../game/Board.js';
import { Piece } from '../game/Piece.js';
import { MoveCalculator } from '../game/MoveCalculator.js';
import { CheckDetector } from '../game/CheckDetector.js';
import { SummonSystem } from '../game/SummonSystem.js';
import { AIController } from '../game/AIController.js';
import {
  PieceType, Owner, COLORS, LAYOUT, MANA_PER_TURN, TURN_TIME_LIMIT,
  AI_THINK_DELAY, PIECE_LABELS, TEXT_COLORS,
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

    this._setupBoard();
    this._drawBoard();
    this._renderAllPieces();
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

  _renderAllPieces() {
    Object.values(this.pieceObjects).forEach(o => o.destroy());
    this.pieceObjects = {};
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 5; c++) {
        const piece = this.board.getPiece(r, c);
        if (piece) this._renderPiece(r, c, piece);
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
    }).setOrigin(0.5).setDepth(1);
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
      g.setDepth(0.5);
      this.highlightGraphics.push(g);
    }
  }

  _onCellClick(r, c) {
    if (this.state === State.AI_TURN || this.state === State.GAME_OVER) return;

    if (this.state === State.SUMMON_MODE) {
      const squares = this.summonSys.getSummonableSquares(this.board, Owner.PLAYER);
      if (squares.some(s => s.row === r && s.col === c)) {
        this.summonSys.summon(this.board, Owner.PLAYER, this.pendingSummonType, r, c);
        this._renderAllPieces();
        this._clearHighlights();
        this.state = State.WAITING;
        this.pendingSummonType = null;
        this._endTurn();
        return;
      }
      this._clearHighlights();
      this.state = State.WAITING;
      this.pendingSummonType = null;
      return;
    }

    if (this.state === State.SELECTED) {
      const moves = this.calc.getMoves(this.board, this.selectedCell.row, this.selectedCell.col);
      if (moves.some(m => m.row === r && m.col === c)) {
        this.board.movePiece(this.selectedCell.row, this.selectedCell.col, r, c);
        this._renderAllPieces();
        this._clearHighlights();
        this.state = State.WAITING;
        this.selectedCell = null;
        this._checkGameOver();
        if (this.state !== State.GAME_OVER) this._endTurn();
        return;
      }
      this._clearHighlights();
      this.state = State.WAITING;
      this.selectedCell = null;
    }

    const piece = this.board.getPiece(r, c);
    if (piece && piece.owner === Owner.PLAYER) {
      this.state = State.SELECTED;
      this.selectedCell = { row: r, col: c };
      const moves = this.calc.getMoves(this.board, r, c);
      this._clearHighlights();
      this._highlightCells([{ row: r, col: c }], COLORS.SELECTED);
      this._highlightCells(moves, COLORS.MOVE_HIGHLIGHT);
      this._showThreatsIfInCheck();
    }
  }

  _showThreatsIfInCheck() {
    if (this.detector.isInCheck(this.board, Owner.PLAYER)) {
      const threats = this.detector.getThreats(this.board, Owner.PLAYER);
      this._highlightCells(threats, COLORS.THREAT, 0.7);
    }
  }

  _startTurn(owner) {
    this.board.addMana(owner, MANA_PER_TURN);
    this.board.currentTurn = owner;
    this.timeLeft = TURN_TIME_LIMIT;

    if (this.turnTimer) this.turnTimer.remove();
    this.turnTimer = this.time.addEvent({
      delay: 1000,
      callback: this._tickTimer,
      callbackScope: this,
      loop: true,
    });

    this.events.emit('turn-start', {
      turn: owner,
      mana: this.board.mana,
      timeLeft: this.timeLeft,
    });

    if (owner === Owner.AI) {
      this.state = State.AI_TURN;
      this.time.delayedCall(AI_THINK_DELAY, this._doAITurn, [], this);
    } else {
      this.state = State.WAITING;
      this._showThreatsIfInCheck();
    }
  }

  _tickTimer() {
    this.timeLeft--;
    this.events.emit('timer-tick', this.timeLeft);
    if (this.timeLeft <= 0) {
      this.turnTimer?.remove();
      if (this.board.currentTurn === Owner.PLAYER) this._endTurn();
    }
  }

  _endTurn() {
    if (this.turnTimer) this.turnTimer.remove();
    this._clearHighlights();
    this.state = State.WAITING;
    const next = this.board.currentTurn === Owner.PLAYER ? Owner.AI : Owner.PLAYER;
    this._startTurn(next);
  }

  _doAITurn() {
    const action = this.ai.getAction(this.board);
    if (action.type === 'move') {
      this.board.movePiece(action.from.row, action.from.col, action.to.row, action.to.col);
    } else if (action.type === 'summon') {
      this.summonSys.summon(this.board, Owner.AI, action.pieceType, action.to.row, action.to.col);
    }
    this._renderAllPieces();
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
    if (this.state !== State.WAITING) return;
    if (!this.summonSys.canSummon(this.board, Owner.PLAYER, pieceType)) return;
    this.pendingSummonType = pieceType;
    this.state = State.SUMMON_MODE;
    this._clearHighlights();
    const squares = this.summonSys.getSummonableSquares(this.board, Owner.PLAYER);
    this._highlightCells(squares, COLORS.SUMMON_HIGHLIGHT);
  }

  getMana() { return this.board.mana; }
  getCurrentTurn() { return this.board.currentTurn; }
}
