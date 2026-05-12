import { MoveCalculator } from './MoveCalculator.js';
import { SummonSystem } from './SummonSystem.js';
import { Piece } from './Piece.js';
import { BOARD_SIZE, PieceType, SUMMON_COSTS } from '../config.js';

export class CheckDetector {
  constructor() {
    this.calculator = new MoveCalculator();
    this.summonSys = new SummonSystem();
  }

  getThreats(board, kingOwner) {
    const kingPos = board.findKing(kingOwner);
    if (!kingPos) return [];
    const threats = [];
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = board.getPiece(r, c);
        if (piece && piece.owner !== kingOwner) {
          const moves = this.calculator.getMoves(board, r, c);
          if (moves.some(m => m.row === kingPos.row && m.col === kingPos.col))
            threats.push({ row: r, col: c });
        }
      }
    return threats;
  }

  isInCheck(board, owner) {
    return this.getThreats(board, owner).length > 0;
  }

  isCheckmate(board, owner) {
    if (!this.isInCheck(board, owner)) return false;

    // Check if any move resolves check
    const pieces = board.getAllPieces(owner);
    for (const { row, col } of pieces) {
      const moves = this.calculator.getMoves(board, row, col);
      for (const move of moves) {
        const clone = board.clone();
        clone.movePiece(row, col, move.row, move.col);
        if (!this.isInCheck(clone, owner)) return false;
      }
    }

    // Check if any summon resolves check
    const squares = this.summonSys.getSummonableSquares(board, owner);
    for (const sq of squares) {
      for (const type of Object.values(PieceType)) {
        if (type === PieceType.KING) continue;
        const cost = this.summonSys.getCost(board, owner, type);
        if (board.mana[owner] >= cost) {
          const clone = board.clone();
          clone.setPiece(sq.row, sq.col, new Piece(type, owner));
          if (!this.isInCheck(clone, owner)) return false;
        }
      }
    }

    return true;
  }
}
