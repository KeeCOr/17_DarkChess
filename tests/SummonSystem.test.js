import { describe, it, expect } from 'vitest';
import { SummonSystem } from '../src/game/SummonSystem.js';
import { Board } from '../src/game/Board.js';
import { Piece } from '../src/game/Piece.js';
import { PieceType, Owner } from '../src/config.js';

function makeBoard(placements) {
  const b = new Board();
  for (const [r, c, type, owner] of placements)
    b.setPiece(r, c, new Piece(type, owner));
  return b;
}

describe('SummonSystem', () => {
  const sys = new SummonSystem();

  it('getSummonableSquares returns adjacent empty cells around king', () => {
    const b = makeBoard([[4, 2, PieceType.KING, Owner.PLAYER]]);
    const squares = sys.getSummonableSquares(b, Owner.PLAYER);
    expect(squares).toContainEqual({ row: 3, col: 1 });
    expect(squares).toContainEqual({ row: 3, col: 2 });
    expect(squares).toContainEqual({ row: 3, col: 3 });
    expect(squares).toContainEqual({ row: 4, col: 1 });
    expect(squares).toContainEqual({ row: 4, col: 3 });
    // row 5 is out of bounds
    expect(squares.every(s => s.row >= 0 && s.row < 5)).toBe(true);
  });

  it('getSummonableSquares excludes occupied cells', () => {
    const b = makeBoard([
      [4, 2, PieceType.KING, Owner.PLAYER],
      [3, 2, PieceType.PAWN, Owner.PLAYER],
    ]);
    const squares = sys.getSummonableSquares(b, Owner.PLAYER);
    expect(squares).not.toContainEqual({ row: 3, col: 2 });
  });

  it('canSummon returns false when not enough mana', () => {
    const b = makeBoard([[4, 2, PieceType.KING, Owner.PLAYER]]);
    b.mana[Owner.PLAYER] = 0;
    expect(sys.canSummon(b, Owner.PLAYER, PieceType.PAWN)).toBe(false);
  });

  it('canSummon returns true when mana sufficient and square available', () => {
    const b = makeBoard([[4, 2, PieceType.KING, Owner.PLAYER]]);
    b.mana[Owner.PLAYER] = 3;
    expect(sys.canSummon(b, Owner.PLAYER, PieceType.KNIGHT)).toBe(true);
  });

  it('increases repeated summon cost by 2 mana each time', () => {
    const b = makeBoard([[4, 2, PieceType.KING, Owner.PLAYER]]);

    expect(sys.getCost(b, Owner.PLAYER, PieceType.PAWN)).toBe(1);
    b.summonCounts[Owner.PLAYER][PieceType.PAWN] = 1;
    expect(sys.getCost(b, Owner.PLAYER, PieceType.PAWN)).toBe(3);
    b.summonCounts[Owner.PLAYER][PieceType.PAWN] = 2;
    expect(sys.getCost(b, Owner.PLAYER, PieceType.PAWN)).toBe(5);
  });

  it('summon places piece and deducts mana', () => {
    const b = makeBoard([[4, 2, PieceType.KING, Owner.PLAYER]]);
    b.mana[Owner.PLAYER] = 5;
    sys.summon(b, Owner.PLAYER, PieceType.ROOK, 3, 2);
    expect(b.getPiece(3, 2)).not.toBeNull();
    expect(b.getPiece(3, 2).type).toBe(PieceType.ROOK);
    expect(b.getPiece(3, 2).owner).toBe(Owner.PLAYER);
    expect(b.mana[Owner.PLAYER]).toBe(0);
  });
});
