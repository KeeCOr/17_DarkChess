import { Piece } from './Piece.js';
import { SUMMON_COSTS } from '../config.js';

export class SummonSystem {
  getCost(board, owner, pieceType) {
    const base = SUMMON_COSTS[pieceType];
    if (base === undefined) return Infinity;
    const count = board.summonCounts?.[owner]?.[pieceType] || 0;
    return base + count;
  }

  getSummonableSquares(board, owner) {
    const kingPos = board.findKing(owner);
    if (!kingPos) return [];
    const squares = [];
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = kingPos.row + dr, nc = kingPos.col + dc;
        if (board.isInBounds(nr, nc) && !board.getPiece(nr, nc))
          squares.push({ row: nr, col: nc });
      }
    return squares;
  }

  canSummon(board, owner, pieceType) {
    const cost = this.getCost(board, owner, pieceType);
    if (board.mana[owner] < cost) return false;
    return this.getSummonableSquares(board, owner).length > 0;
  }

  summon(board, owner, pieceType, row, col) {
    const cost = this.getCost(board, owner, pieceType);
    board.spendMana(owner, cost);
    board.setPiece(row, col, new Piece(pieceType, owner));
    if (!board.summonCounts[owner]) board.summonCounts[owner] = {};
    board.summonCounts[owner][pieceType] = (board.summonCounts[owner][pieceType] || 0) + 1;
  }
}
