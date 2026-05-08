import { MoveCalculator } from './MoveCalculator.js';
import { BOARD_SIZE } from '../config.js';

export class CheckDetector {
  constructor() {
    this.calculator = new MoveCalculator();
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
    const pieces = board.getAllPieces(owner);
    for (const { row, col } of pieces) {
      const moves = this.calculator.getMoves(board, row, col);
      for (const move of moves) {
        const clone = board.clone();
        clone.movePiece(row, col, move.row, move.col);
        if (!this.isInCheck(clone, owner)) return false;
      }
    }
    return true;
  }
}
