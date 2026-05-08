import { describe, it, expect } from 'vitest';
import { MoveCalculator } from '../src/game/MoveCalculator.js';
import { Board } from '../src/game/Board.js';
import { Piece } from '../src/game/Piece.js';
import { PieceType, Owner } from '../src/config.js';

function makeBoard(placements) {
  const b = new Board();
  for (const [r, c, type, owner] of placements)
    b.setPiece(r, c, new Piece(type, owner));
  return b;
}

describe('MoveCalculator', () => {
  const calc = new MoveCalculator();

  it('pawn (player) moves up one square', () => {
    const b = makeBoard([[3, 2, PieceType.PAWN, Owner.PLAYER]]);
    const moves = calc.getMoves(b, 3, 2);
    expect(moves).toContainEqual({ row: 2, col: 2 });
    expect(moves).toHaveLength(1);
  });

  it('pawn (player) captures diagonally', () => {
    const b = makeBoard([
      [3, 2, PieceType.PAWN, Owner.PLAYER],
      [2, 1, PieceType.PAWN, Owner.AI],
      [2, 3, PieceType.PAWN, Owner.AI],
    ]);
    const moves = calc.getMoves(b, 3, 2);
    expect(moves).toContainEqual({ row: 2, col: 1 });
    expect(moves).toContainEqual({ row: 2, col: 3 });
  });

  it('pawn (player) cannot capture own piece', () => {
    const b = makeBoard([
      [3, 2, PieceType.PAWN, Owner.PLAYER],
      [2, 1, PieceType.PAWN, Owner.PLAYER],
    ]);
    const moves = calc.getMoves(b, 3, 2);
    expect(moves).not.toContainEqual({ row: 2, col: 1 });
  });

  it('pawn (AI) moves down one square', () => {
    const b = makeBoard([[1, 2, PieceType.PAWN, Owner.AI]]);
    const moves = calc.getMoves(b, 1, 2);
    expect(moves).toContainEqual({ row: 2, col: 2 });
  });

  it('knight moves in L-shape', () => {
    const b = makeBoard([[2, 2, PieceType.KNIGHT, Owner.PLAYER]]);
    const moves = calc.getMoves(b, 2, 2);
    expect(moves).toContainEqual({ row: 0, col: 1 });
    expect(moves).toContainEqual({ row: 0, col: 3 });
    expect(moves).toContainEqual({ row: 4, col: 1 });
    expect(moves).toContainEqual({ row: 4, col: 3 });
  });

  it('bishop slides diagonally and is blocked', () => {
    const b = makeBoard([
      [2, 2, PieceType.BISHOP, Owner.PLAYER],
      [0, 0, PieceType.PAWN, Owner.AI],
    ]);
    const moves = calc.getMoves(b, 2, 2);
    expect(moves).toContainEqual({ row: 1, col: 1 });
    expect(moves).toContainEqual({ row: 0, col: 0 }); // capture
    expect(moves).not.toContainEqual({ row: -1, col: -1 }); // out of bounds
  });

  it('rook slides straight and stops at own piece', () => {
    const b = makeBoard([
      [2, 2, PieceType.ROOK, Owner.PLAYER],
      [2, 4, PieceType.PAWN, Owner.PLAYER],
    ]);
    const moves = calc.getMoves(b, 2, 2);
    expect(moves).toContainEqual({ row: 2, col: 3 });
    expect(moves).not.toContainEqual({ row: 2, col: 4 }); // blocked by own piece
  });

  it('queen combines bishop and rook', () => {
    const b = makeBoard([[2, 2, PieceType.QUEEN, Owner.PLAYER]]);
    const moves = calc.getMoves(b, 2, 2);
    // diagonal
    expect(moves).toContainEqual({ row: 0, col: 0 });
    // straight
    expect(moves).toContainEqual({ row: 0, col: 2 });
    expect(moves).toContainEqual({ row: 2, col: 4 });
  });

  it('king moves one step in any direction', () => {
    const b = makeBoard([[2, 2, PieceType.KING, Owner.PLAYER]]);
    const moves = calc.getMoves(b, 2, 2);
    expect(moves).toHaveLength(8);
  });

  it('returns empty for empty cell', () => {
    const b = new Board();
    expect(calc.getMoves(b, 0, 0)).toEqual([]);
  });
});
