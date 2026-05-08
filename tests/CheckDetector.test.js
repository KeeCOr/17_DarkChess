import { describe, it, expect } from 'vitest';
import { CheckDetector } from '../src/game/CheckDetector.js';
import { Board } from '../src/game/Board.js';
import { Piece } from '../src/game/Piece.js';
import { PieceType, Owner } from '../src/config.js';

function makeBoard(placements) {
  const b = new Board();
  for (const [r, c, type, owner] of placements)
    b.setPiece(r, c, new Piece(type, owner));
  return b;
}

describe('CheckDetector', () => {
  const det = new CheckDetector();

  it('isInCheck returns false when king is safe', () => {
    const b = makeBoard([[4, 2, PieceType.KING, Owner.PLAYER]]);
    expect(det.isInCheck(b, Owner.PLAYER)).toBe(false);
  });

  it('isInCheck returns true when rook threatens king', () => {
    const b = makeBoard([
      [4, 2, PieceType.KING, Owner.PLAYER],
      [0, 2, PieceType.ROOK, Owner.AI],
    ]);
    expect(det.isInCheck(b, Owner.PLAYER)).toBe(true);
  });

  it('getThreats returns the threatening piece position', () => {
    const b = makeBoard([
      [4, 2, PieceType.KING, Owner.PLAYER],
      [0, 2, PieceType.ROOK, Owner.AI],
    ]);
    const threats = det.getThreats(b, Owner.PLAYER);
    expect(threats).toContainEqual({ row: 0, col: 2 });
  });

  it('isInCheck false when piece is blocked', () => {
    const b = makeBoard([
      [4, 2, PieceType.KING, Owner.PLAYER],
      [2, 2, PieceType.PAWN, Owner.PLAYER], // blocker
      [0, 2, PieceType.ROOK, Owner.AI],
    ]);
    expect(det.isInCheck(b, Owner.PLAYER)).toBe(false);
  });

  it('isCheckmate returns true in a mated position', () => {
    // King at corner (0,0) in check from rook at (0,2), all escape squares covered
    const b = makeBoard([
      [0, 0, PieceType.KING, Owner.PLAYER],
      [0, 2, PieceType.ROOK, Owner.AI],  // checks king on row 0
      [1, 1, PieceType.QUEEN, Owner.AI], // covers (1,0), (1,1), (0,1)
      [2, 2, PieceType.KING, Owner.AI],  // AI king needed for valid board
    ]);
    expect(det.isCheckmate(b, Owner.PLAYER)).toBe(true);
  });

  it('isCheckmate returns false when escape is possible', () => {
    const b = makeBoard([
      [4, 2, PieceType.KING, Owner.PLAYER],
      [0, 2, PieceType.ROOK, Owner.AI],
      [0, 0, PieceType.KING, Owner.AI],
    ]);
    expect(det.isCheckmate(b, Owner.PLAYER)).toBe(false);
  });
});
