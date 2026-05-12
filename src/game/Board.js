import { Piece } from './Piece.js';
import { BOARD_SIZE, MAX_MANA, Owner, PieceType } from '../config.js';

export class Board {
  constructor() {
    this.grid = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
    this.mana = { [Owner.PLAYER]: 0, [Owner.AI]: 0 };
    this.currentTurn = Owner.PLAYER;
    this.summonCounts = { [Owner.PLAYER]: {}, [Owner.AI]: {} };
  }

  isInBounds(row, col) {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
  }

  getPiece(row, col) {
    return this.grid[row][col];
  }

  setPiece(row, col, piece) {
    this.grid[row][col] = piece;
  }

  removePiece(row, col) {
    this.grid[row][col] = null;
  }

  movePiece(fromRow, fromCol, toRow, toCol) {
    this.grid[toRow][toCol] = this.grid[fromRow][fromCol];
    this.grid[fromRow][fromCol] = null;
  }

  findKing(owner) {
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++) {
        const p = this.grid[r][c];
        if (p && p.type === PieceType.KING && p.owner === owner) return { row: r, col: c };
      }
    return null;
  }

  addMana(owner, amount) {
    this.mana[owner] = Math.min(MAX_MANA, this.mana[owner] + amount);
  }

  spendMana(owner, amount) {
    this.mana[owner] -= amount;
  }

  clone() {
    const b = new Board();
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++)
        b.grid[r][c] = this.grid[r][c] ? this.grid[r][c].clone() : null;
    b.mana = { ...this.mana };
    b.currentTurn = this.currentTurn;
    b.summonCounts = {
      [Owner.PLAYER]: { ...this.summonCounts[Owner.PLAYER] },
      [Owner.AI]: { ...this.summonCounts[Owner.AI] },
    };
    return b;
  }

  getAllPieces(owner) {
    const result = [];
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++) {
        const p = this.grid[r][c];
        if (p && p.owner === owner) result.push({ piece: p, row: r, col: c });
      }
    return result;
  }
}
