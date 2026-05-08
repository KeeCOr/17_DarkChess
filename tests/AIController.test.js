import { describe, it, expect } from 'vitest';
import { AIController } from '../src/game/AIController.js';
import { Board } from '../src/game/Board.js';
import { Piece } from '../src/game/Piece.js';
import { PieceType, Owner, Difficulty } from '../src/config.js';

function makeStartBoard() {
  const b = new Board();
  b.setPiece(0, 2, new Piece(PieceType.KING, Owner.AI));
  b.setPiece(1, 0, new Piece(PieceType.PAWN, Owner.AI));
  b.setPiece(1, 1, new Piece(PieceType.PAWN, Owner.AI));
  b.setPiece(1, 3, new Piece(PieceType.PAWN, Owner.AI));
  b.setPiece(1, 4, new Piece(PieceType.PAWN, Owner.AI));
  b.setPiece(4, 2, new Piece(PieceType.KING, Owner.PLAYER));
  b.setPiece(3, 0, new Piece(PieceType.PAWN, Owner.PLAYER));
  b.setPiece(3, 4, new Piece(PieceType.PAWN, Owner.PLAYER));
  b.mana[Owner.AI] = 4;
  return b;
}

describe('AIController', () => {
  it('easy returns an action (move or summon)', () => {
    const ai = new AIController(Difficulty.EASY);
    const action = ai.getAction(makeStartBoard());
    expect(['move', 'summon', 'pass']).toContain(action.type);
  });

  it('medium returns an action', () => {
    const ai = new AIController(Difficulty.MEDIUM);
    const action = ai.getAction(makeStartBoard());
    expect(['move', 'summon', 'pass']).toContain(action.type);
  });

  it('hard returns an action', () => {
    const ai = new AIController(Difficulty.HARD);
    const action = ai.getAction(makeStartBoard());
    expect(['move', 'summon', 'pass']).toContain(action.type);
  });

  it('medium captures player piece when available', () => {
    const b = new Board();
    b.setPiece(0, 2, new Piece(PieceType.KING, Owner.AI));
    b.setPiece(4, 2, new Piece(PieceType.KING, Owner.PLAYER));
    b.setPiece(2, 2, new Piece(PieceType.ROOK, Owner.AI));
    b.setPiece(3, 2, new Piece(PieceType.PAWN, Owner.PLAYER)); // capturable
    b.mana[Owner.AI] = 0;
    const ai = new AIController(Difficulty.MEDIUM);
    const action = ai.getAction(b);
    expect(action.type).toBe('move');
    expect(action.to).toEqual({ row: 3, col: 2 });
  });
});
