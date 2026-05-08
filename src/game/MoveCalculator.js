import { PieceType, Owner } from '../config.js';

export class MoveCalculator {
  getMoves(board, row, col) {
    const piece = board.getPiece(row, col);
    if (!piece) return [];
    switch (piece.type) {
      case PieceType.PAWN:   return this._pawnMoves(board, row, col, piece.owner);
      case PieceType.KNIGHT: return this._knightMoves(board, row, col, piece.owner);
      case PieceType.BISHOP: return this._slideMoves(board, row, col, piece.owner, [[-1,-1],[-1,1],[1,-1],[1,1]]);
      case PieceType.ROOK:   return this._slideMoves(board, row, col, piece.owner, [[-1,0],[1,0],[0,-1],[0,1]]);
      case PieceType.QUEEN:  return this._slideMoves(board, row, col, piece.owner, [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]);
      case PieceType.KING:   return this._kingMoves(board, row, col, piece.owner);
      default: return [];
    }
  }

  _pawnMoves(board, row, col, owner) {
    const moves = [];
    const dir = owner === Owner.PLAYER ? -1 : 1;
    const nr = row + dir;
    if (board.isInBounds(nr, col) && !board.getPiece(nr, col))
      moves.push({ row: nr, col });
    for (const dc of [-1, 1]) {
      const nc = col + dc;
      if (board.isInBounds(nr, nc)) {
        const t = board.getPiece(nr, nc);
        if (t && t.owner !== owner) moves.push({ row: nr, col: nc });
      }
    }
    return moves;
  }

  _knightMoves(board, row, col, owner) {
    const moves = [];
    for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
      const nr = row + dr, nc = col + dc;
      if (board.isInBounds(nr, nc)) {
        const t = board.getPiece(nr, nc);
        if (!t || t.owner !== owner) moves.push({ row: nr, col: nc });
      }
    }
    return moves;
  }

  _slideMoves(board, row, col, owner, directions) {
    const moves = [];
    for (const [dr, dc] of directions) {
      let nr = row + dr, nc = col + dc;
      while (board.isInBounds(nr, nc)) {
        const t = board.getPiece(nr, nc);
        if (!t) { moves.push({ row: nr, col: nc }); }
        else { if (t.owner !== owner) moves.push({ row: nr, col: nc }); break; }
        nr += dr; nc += dc;
      }
    }
    return moves;
  }

  _kingMoves(board, row, col, owner) {
    const moves = [];
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr, nc = col + dc;
        if (board.isInBounds(nr, nc)) {
          const t = board.getPiece(nr, nc);
          if (!t || t.owner !== owner) moves.push({ row: nr, col: nc });
        }
      }
    return moves;
  }
}
