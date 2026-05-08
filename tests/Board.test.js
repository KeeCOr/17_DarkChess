import { describe, it, expect } from 'vitest';
import { Board } from '../src/game/Board.js';
import { Piece } from '../src/game/Piece.js';
import { PieceType, Owner } from '../src/config.js';

describe('Board', () => {
  it('starts with empty grid', () => {
    const b = new Board();
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 5; c++)
        expect(b.getPiece(r, c)).toBeNull();
  });

  it('setPiece and getPiece round-trip', () => {
    const b = new Board();
    const p = new Piece(PieceType.ROOK, Owner.PLAYER);
    b.setPiece(2, 3, p);
    expect(b.getPiece(2, 3)).toBe(p);
  });

  it('movePiece relocates piece and clears origin', () => {
    const b = new Board();
    const p = new Piece(PieceType.PAWN, Owner.PLAYER);
    b.setPiece(3, 3, p);
    b.movePiece(3, 3, 2, 3);
    expect(b.getPiece(2, 3)).toBe(p);
    expect(b.getPiece(3, 3)).toBeNull();
  });

  it('findKing locates the king', () => {
    const b = new Board();
    b.setPiece(4, 2, new Piece(PieceType.KING, Owner.PLAYER));
    expect(b.findKing(Owner.PLAYER)).toEqual({ row: 4, col: 2 });
  });

  it('findKing returns null when no king', () => {
    const b = new Board();
    expect(b.findKing(Owner.PLAYER)).toBeNull();
  });

  it('addMana caps at MAX_MANA', () => {
    const b = new Board();
    b.addMana(Owner.PLAYER, 100);
    expect(b.mana[Owner.PLAYER]).toBe(10);
  });

  it('clone produces deep copy', () => {
    const b = new Board();
    b.setPiece(0, 0, new Piece(PieceType.PAWN, Owner.AI));
    b.mana[Owner.PLAYER] = 5;
    const c = b.clone();
    expect(c.getPiece(0, 0)).not.toBe(b.getPiece(0, 0));
    expect(c.getPiece(0, 0).type).toBe(PieceType.PAWN);
    expect(c.mana[Owner.PLAYER]).toBe(5);
    c.mana[Owner.PLAYER] = 9;
    expect(b.mana[Owner.PLAYER]).toBe(5); // original unchanged
  });

  it('isInBounds rejects out-of-bounds', () => {
    const b = new Board();
    expect(b.isInBounds(0, 0)).toBe(true);
    expect(b.isInBounds(4, 4)).toBe(true);
    expect(b.isInBounds(-1, 0)).toBe(false);
    expect(b.isInBounds(5, 0)).toBe(false);
  });
});
