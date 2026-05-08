import { describe, it, expect } from 'vitest';
import { Piece } from '../src/game/Piece.js';
import { PieceType, Owner } from '../src/config.js';

describe('Piece', () => {
  it('stores type and owner', () => {
    const p = new Piece(PieceType.PAWN, Owner.PLAYER);
    expect(p.type).toBe(PieceType.PAWN);
    expect(p.owner).toBe(Owner.PLAYER);
  });

  it('clone produces equal but distinct object', () => {
    const p = new Piece(PieceType.QUEEN, Owner.AI);
    const c = p.clone();
    expect(c.type).toBe(p.type);
    expect(c.owner).toBe(p.owner);
    expect(c).not.toBe(p);
  });
});
