import { MoveCalculator } from './MoveCalculator.js';
import { CheckDetector } from './CheckDetector.js';
import { SummonSystem } from './SummonSystem.js';
import { Piece } from './Piece.js';
import {
  Difficulty, Owner, PieceType, SUMMON_COSTS, PIECE_VALUES, MINIMAX_DEPTH,
} from '../config.js';

const SUMMONABLE_TYPES = [PieceType.PAWN, PieceType.KNIGHT, PieceType.BISHOP, PieceType.ROOK, PieceType.QUEEN];

export class AIController {
  constructor(difficulty) {
    this.difficulty = difficulty;
    this.calc = new MoveCalculator();
    this.detector = new CheckDetector();
    this.summon = new SummonSystem();
  }

  getAction(board) {
    switch (this.difficulty) {
      case Difficulty.EASY:   return this._easyAction(board);
      case Difficulty.MEDIUM: return this._mediumAction(board);
      case Difficulty.HARD:   return this._hardAction(board);
    }
  }

  // --- Easy: random move or random summon ---
  _easyAction(board) {
    const allMoves = this._getAllMoves(board, Owner.AI);
    const summonOptions = this._getSummonOptions(board, Owner.AI);
    const options = [...allMoves.map(m => ({ type: 'move', ...m })),
                     ...summonOptions.map(s => ({ type: 'summon', ...s }))];
    if (options.length === 0) return { type: 'pass' };
    return options[Math.floor(Math.random() * options.length)];
  }

  // --- Medium: capture if possible, else advance, summon cheap pieces ---
  _mediumAction(board) {
    const allMoves = this._getAllMoves(board, Owner.AI);
    // prefer capturing moves
    const captures = allMoves.filter(m => board.getPiece(m.to.row, m.to.col) !== null);
    if (captures.length > 0) {
      captures.sort((a, b) => {
        const va = PIECE_VALUES[board.getPiece(a.to.row, a.to.col).type] || 0;
        const vb = PIECE_VALUES[board.getPiece(b.to.row, b.to.col).type] || 0;
        return vb - va;
      });
      return { type: 'move', ...captures[0] };
    }
    // summon if affordable
    const summonOptions = this._getSummonOptions(board, Owner.AI);
    const affordable = summonOptions.filter(s => SUMMON_COSTS[s.pieceType] <= board.mana[Owner.AI]);
    if (affordable.length > 0) return { type: 'summon', ...affordable[Math.floor(Math.random() * affordable.length)] };
    // else random move
    if (allMoves.length > 0) return { type: 'move', ...allMoves[Math.floor(Math.random() * allMoves.length)] };
    return { type: 'pass' };
  }

  // --- Hard: minimax with alpha-beta ---
  _hardAction(board) {
    let bestScore = -Infinity;
    let bestAction = { type: 'pass' };
    const actions = this._generateActions(board, Owner.AI);
    for (const action of actions) {
      const clone = this._applyAction(board.clone(), action, Owner.AI);
      const score = this._minimax(clone, MINIMAX_DEPTH - 1, -Infinity, Infinity, false);
      if (score > bestScore) { bestScore = score; bestAction = action; }
    }
    return bestAction;
  }

  _minimax(board, depth, alpha, beta, maximizing) {
    const owner = maximizing ? Owner.AI : Owner.PLAYER;
    if (depth === 0) return this._evaluate(board);
    if (this.detector.isCheckmate(board, Owner.PLAYER)) return 10000;
    if (this.detector.isCheckmate(board, Owner.AI)) return -10000;

    const actions = this._generateActions(board, owner);
    if (actions.length === 0) return this._evaluate(board);

    if (maximizing) {
      let max = -Infinity;
      for (const action of actions) {
        const clone = this._applyAction(board.clone(), action, owner);
        const score = this._minimax(clone, depth - 1, alpha, beta, false);
        max = Math.max(max, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break;
      }
      return max;
    } else {
      let min = Infinity;
      for (const action of actions) {
        const clone = this._applyAction(board.clone(), action, owner);
        const score = this._minimax(clone, depth - 1, alpha, beta, true);
        min = Math.min(min, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break;
      }
      return min;
    }
  }

  _evaluate(board) {
    let score = 0;
    const center = [1, 2, 3];
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 5; c++) {
        const p = board.getPiece(r, c);
        if (!p) continue;
        const val = PIECE_VALUES[p.type] || 0;
        const centerBonus = (center.includes(r) && center.includes(c)) ? 0.1 : 0;
        score += p.owner === Owner.AI ? val + centerBonus : -(val + centerBonus);
      }
    if (this.detector.isInCheck(board, Owner.PLAYER)) score += 2;
    if (this.detector.isInCheck(board, Owner.AI)) score -= 2;
    return score;
  }

  _generateActions(board, owner) {
    const actions = [];
    const moves = this._getAllMoves(board, owner);
    actions.push(...moves.map(m => ({ type: 'move', ...m })));
    const summons = this._getSummonOptions(board, owner);
    actions.push(...summons.map(s => ({ type: 'summon', ...s })));
    return actions;
  }

  _getAllMoves(board, owner) {
    const result = [];
    for (const { row, col } of board.getAllPieces(owner)) {
      const moves = this.calc.getMoves(board, row, col);
      for (const to of moves) result.push({ from: { row, col }, to });
    }
    return result;
  }

  _getSummonOptions(board, owner) {
    const options = [];
    const squares = this.summon.getSummonableSquares(board, owner);
    for (const type of SUMMONABLE_TYPES) {
      if (this.summon.canSummon(board, owner, type)) {
        for (const sq of squares)
          options.push({ pieceType: type, to: sq });
      }
    }
    return options;
  }

  _applyAction(board, action, owner) {
    if (action.type === 'move')
      board.movePiece(action.from.row, action.from.col, action.to.row, action.to.col);
    else if (action.type === 'summon')
      this.summon.summon(board, owner, action.pieceType, action.to.row, action.to.col);
    board.addMana(owner, 2); // simulate next turn mana
    return board;
  }
}
