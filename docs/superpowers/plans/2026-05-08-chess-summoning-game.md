# Chess Summoning Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 5x5 chess summoning game in Phaser.js where players earn mana each turn to summon chess pieces adjacent to their king.

**Architecture:** Pure JS game logic (Board, Piece, MoveCalculator, CheckDetector, SummonSystem, AIController) is fully decoupled from Phaser scenes, enabling unit testing with Vitest. Phaser scenes handle rendering and input only. GameScene + UIScene run simultaneously and communicate via Phaser's built-in event emitter.

**Tech Stack:** Phaser 3, Vite, Vitest

---

## File Map

| File | Responsibility |
|---|---|
| `src/config.js` | All constants: PieceType, Owner, costs, colors, layout |
| `src/main.js` | Phaser game init, scene registration |
| `src/game/Piece.js` | Piece data class |
| `src/game/Board.js` | 5x5 board state, mana, clone |
| `src/game/MoveCalculator.js` | Legal moves for each piece type |
| `src/game/CheckDetector.js` | isInCheck, getThreats, isCheckmate |
| `src/game/SummonSystem.js` | Summonable squares, cost validation, execute summon |
| `src/game/AIController.js` | Easy/medium/hard AI, minimax |
| `src/scenes/BootScene.js` | Asset preload (colored shapes, no external assets) |
| `src/scenes/MenuScene.js` | Title + difficulty selection |
| `src/scenes/PlacementScene.js` | Place pawns in bottom 2 rows before game starts |
| `src/scenes/GameScene.js` | Board render, piece selection, move/summon execution, turn/timer logic |
| `src/scenes/UIScene.js` | HUD overlay: mana bar, summon panel, timer, turn label |
| `src/scenes/ResultScene.js` | Win/lose display, replay/menu buttons |
| `tests/Piece.test.js` | Piece unit tests |
| `tests/Board.test.js` | Board unit tests |
| `tests/MoveCalculator.test.js` | Move logic unit tests |
| `tests/CheckDetector.test.js` | Check detection unit tests |
| `tests/SummonSystem.test.js` | Summon logic unit tests |
| `tests/AIController.test.js` | AI unit tests |

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.js`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "chess-summon",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "phaser": "^3.87.0"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create index.html**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Chess Summon</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #1a1a2e; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
  </style>
</head>
<body>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create vite.config.js**

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 4: Create directory structure**

```bash
mkdir -p src/game src/scenes tests
```

- [ ] **Step 5: Install dependencies**

```bash
npm install
```

Expected output: `added N packages`

- [ ] **Step 6: Verify Phaser installed**

```bash
ls node_modules/phaser/dist/phaser.min.js
```

Expected: file exists

- [ ] **Step 7: Commit**

```bash
git init
git add package.json index.html vite.config.js
git commit -m "chore: project setup with Phaser, Vite, Vitest"
```

---

## Task 2: config.js

**Files:**
- Create: `src/config.js`

- [ ] **Step 1: Create src/config.js**

```javascript
export const BOARD_SIZE = 5;
export const TURN_TIME_LIMIT = 60; // seconds
export const MANA_PER_TURN = 2;
export const MAX_MANA = 10;
export const AI_THINK_DELAY = 600; // ms
export const MINIMAX_DEPTH = 3;

export const PieceType = Object.freeze({
  KING: 'KING',
  QUEEN: 'QUEEN',
  ROOK: 'ROOK',
  BISHOP: 'BISHOP',
  KNIGHT: 'KNIGHT',
  PAWN: 'PAWN',
});

export const Owner = Object.freeze({
  PLAYER: 'PLAYER',
  AI: 'AI',
});

export const Difficulty = Object.freeze({
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
});

export const SUMMON_COSTS = Object.freeze({
  [PieceType.PAWN]: 1,
  [PieceType.KNIGHT]: 3,
  [PieceType.BISHOP]: 3,
  [PieceType.ROOK]: 5,
  [PieceType.QUEEN]: 8,
});

export const PIECE_VALUES = Object.freeze({
  [PieceType.PAWN]: 1,
  [PieceType.KNIGHT]: 3,
  [PieceType.BISHOP]: 3,
  [PieceType.ROOK]: 5,
  [PieceType.QUEEN]: 8,
  [PieceType.KING]: 100,
});

export const PIECE_LABELS = Object.freeze({
  [PieceType.KING]: 'K',
  [PieceType.QUEEN]: 'Q',
  [PieceType.ROOK]: 'R',
  [PieceType.BISHOP]: 'B',
  [PieceType.KNIGHT]: 'N',
  [PieceType.PAWN]: 'P',
});

export const CELL_SIZE = 80;
export const BOARD_OFFSET_X = 80;
export const BOARD_OFFSET_Y = 80;
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const COLORS = Object.freeze({
  BOARD_LIGHT: 0xf0d9b5,
  BOARD_DARK: 0xb58863,
  PLAYER_PIECE: 0x4a90d9,
  AI_PIECE: 0xe74c3c,
  MOVE_HIGHLIGHT: 0x00ff88,
  SUMMON_HIGHLIGHT: 0x00cc66,
  SELECTED: 0xffdd00,
  THREAT: 0xff2200,
  PANEL_BG: 0x16213e,
  TEXT_PRIMARY: 0xffffff,
  TEXT_MUTED: 0x888888,
  BUTTON_BG: 0x2a2a5a,
  BUTTON_HOVER: 0x3a3a8a,
});
```

- [ ] **Step 2: Commit**

```bash
git add src/config.js
git commit -m "feat: add game constants and config"
```

---

## Task 3: Piece class

**Files:**
- Create: `src/game/Piece.js`
- Create: `tests/Piece.test.js`

- [ ] **Step 1: Write failing test**

```javascript
// tests/Piece.test.js
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/Piece.test.js
```

Expected: FAIL — `Piece` not defined

- [ ] **Step 3: Implement Piece.js**

```javascript
// src/game/Piece.js
export class Piece {
  constructor(type, owner) {
    this.type = type;
    this.owner = owner;
  }

  clone() {
    return new Piece(this.type, this.owner);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/Piece.test.js
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/game/Piece.js tests/Piece.test.js
git commit -m "feat: add Piece class"
```

---

## Task 4: Board class

**Files:**
- Create: `src/game/Board.js`
- Create: `tests/Board.test.js`

- [ ] **Step 1: Write failing tests**

```javascript
// tests/Board.test.js
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/Board.test.js
```

Expected: FAIL

- [ ] **Step 3: Implement Board.js**

```javascript
// src/game/Board.js
import { Piece } from './Piece.js';
import { BOARD_SIZE, MAX_MANA, Owner } from '../config.js';

export class Board {
  constructor() {
    this.grid = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
    this.mana = { [Owner.PLAYER]: 0, [Owner.AI]: 0 };
    this.currentTurn = Owner.PLAYER;
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
        if (p && p.type === 'KING' && p.owner === owner) return { row: r, col: c };
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
```

- [ ] **Step 4: Run tests**

```bash
npm test -- tests/Board.test.js
```

Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/game/Board.js tests/Board.test.js
git commit -m "feat: add Board class"
```

---

## Task 5: MoveCalculator

**Files:**
- Create: `src/game/MoveCalculator.js`
- Create: `tests/MoveCalculator.test.js`

- [ ] **Step 1: Write failing tests**

```javascript
// tests/MoveCalculator.test.js
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/MoveCalculator.test.js
```

Expected: FAIL

- [ ] **Step 3: Implement MoveCalculator.js**

```javascript
// src/game/MoveCalculator.js
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
```

- [ ] **Step 4: Run tests**

```bash
npm test -- tests/MoveCalculator.test.js
```

Expected: PASS (10 tests)

- [ ] **Step 5: Commit**

```bash
git add src/game/MoveCalculator.js tests/MoveCalculator.test.js
git commit -m "feat: add MoveCalculator for all piece types"
```

---

## Task 6: CheckDetector

**Files:**
- Create: `src/game/CheckDetector.js`
- Create: `tests/CheckDetector.test.js`

- [ ] **Step 1: Write failing tests**

```javascript
// tests/CheckDetector.test.js
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
    // King cornered with no moves, rooks covering escape
    const b = makeBoard([
      [4, 4, PieceType.KING, Owner.PLAYER],
      [4, 2, PieceType.ROOK, Owner.AI],  // covers row 4
      [2, 4, PieceType.ROOK, Owner.AI],  // covers col 4
      [0, 0, PieceType.KING, Owner.AI],  // AI king needed for valid board
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/CheckDetector.test.js
```

Expected: FAIL

- [ ] **Step 3: Implement CheckDetector.js**

```javascript
// src/game/CheckDetector.js
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
```

- [ ] **Step 4: Run tests**

```bash
npm test -- tests/CheckDetector.test.js
```

Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/game/CheckDetector.js tests/CheckDetector.test.js
git commit -m "feat: add CheckDetector"
```

---

## Task 7: SummonSystem

**Files:**
- Create: `src/game/SummonSystem.js`
- Create: `tests/SummonSystem.test.js`

- [ ] **Step 1: Write failing tests**

```javascript
// tests/SummonSystem.test.js
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
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm test -- tests/SummonSystem.test.js
```

Expected: FAIL

- [ ] **Step 3: Implement SummonSystem.js**

```javascript
// src/game/SummonSystem.js
import { Piece } from './Piece.js';
import { SUMMON_COSTS } from '../config.js';

export class SummonSystem {
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
    const cost = SUMMON_COSTS[pieceType];
    if (!cost || board.mana[owner] < cost) return false;
    return this.getSummonableSquares(board, owner).length > 0;
  }

  summon(board, owner, pieceType, row, col) {
    board.spendMana(owner, SUMMON_COSTS[pieceType]);
    board.setPiece(row, col, new Piece(pieceType, owner));
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- tests/SummonSystem.test.js
```

Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/game/SummonSystem.js tests/SummonSystem.test.js
git commit -m "feat: add SummonSystem"
```

---

## Task 8: AIController

**Files:**
- Create: `src/game/AIController.js`
- Create: `tests/AIController.test.js`

- [ ] **Step 1: Write failing tests**

```javascript
// tests/AIController.test.js
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
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm test -- tests/AIController.test.js
```

Expected: FAIL

- [ ] **Step 3: Implement AIController.js**

```javascript
// src/game/AIController.js
import { MoveCalculator } from './MoveCalculator.js';
import { CheckDetector } from './CheckDetector.js';
import { SummonSystem } from './SummonSystem.js';
import { Piece } from './Piece.js';
import {
  Difficulty, Owner, PieceType, SUMMON_COSTS, PIECE_VALUES, MINIMAX_DEPTH,
} from '../config.js';

const SUMMONABLE_TYPES = [PieceType.PAWN, PieceType.KNIGHT, PieceType.BISHOP, PieceType.ROOK, PieceType.QUEEN];

export class AIController {
  constructor(difficulty) {
    this.difficulty = difficulty;
    this.calc = new MoveCalculator();
    this.detector = new CheckDetector();
    this.summon = new SummonSystem();
  }

  getAction(board) {
    switch (this.difficulty) {
      case Difficulty.EASY:   return this._easyAction(board);
      case Difficulty.MEDIUM: return this._mediumAction(board);
      case Difficulty.HARD:   return this._hardAction(board);
    }
  }

  // --- Easy: random move or random summon ---
  _easyAction(board) {
    const allMoves = this._getAllMoves(board, Owner.AI);
    const summonOptions = this._getSummonOptions(board, Owner.AI);
    const options = [...allMoves.map(m => ({ type: 'move', ...m })),
                     ...summonOptions.map(s => ({ type: 'summon', ...s }))];
    if (options.length === 0) return { type: 'pass' };
    return options[Math.floor(Math.random() * options.length)];
  }

  // --- Medium: capture if possible, else advance, summon cheap pieces ---
  _mediumAction(board) {
    const allMoves = this._getAllMoves(board, Owner.AI);
    // prefer capturing moves
    const captures = allMoves.filter(m => board.getPiece(m.to.row, m.to.col) !== null);
    if (captures.length > 0) {
      captures.sort((a, b) => {
        const va = PIECE_VALUES[board.getPiece(a.to.row, a.to.col).type] || 0;
        const vb = PIECE_VALUES[board.getPiece(b.to.row, b.to.col).type] || 0;
        return vb - va;
      });
      return { type: 'move', ...captures[0] };
    }
    // summon if affordable
    const summonOptions = this._getSummonOptions(board, Owner.AI);
    const affordable = summonOptions.filter(s => SUMMON_COSTS[s.pieceType] <= board.mana[Owner.AI]);
    if (affordable.length > 0) return { type: 'summon', ...affordable[Math.floor(Math.random() * affordable.length)] };
    // else random move
    if (allMoves.length > 0) return { type: 'move', ...allMoves[Math.floor(Math.random() * allMoves.length)] };
    return { type: 'pass' };
  }

  // --- Hard: minimax with alpha-beta ---
  _hardAction(board) {
    let bestScore = -Infinity;
    let bestAction = { type: 'pass' };
    const actions = this._generateActions(board, Owner.AI);
    for (const action of actions) {
      const clone = this._applyAction(board.clone(), action, Owner.AI);
      const score = this._minimax(clone, MINIMAX_DEPTH - 1, -Infinity, Infinity, false);
      if (score > bestScore) { bestScore = score; bestAction = action; }
    }
    return bestAction;
  }

  _minimax(board, depth, alpha, beta, maximizing) {
    const owner = maximizing ? Owner.AI : Owner.PLAYER;
    const opponent = maximizing ? Owner.PLAYER : Owner.AI;
    if (depth === 0) return this._evaluate(board);
    if (this.detector.isCheckmate(board, Owner.PLAYER)) return 10000;
    if (this.detector.isCheckmate(board, Owner.AI)) return -10000;

    const actions = this._generateActions(board, owner);
    if (actions.length === 0) return this._evaluate(board);

    if (maximizing) {
      let max = -Infinity;
      for (const action of actions) {
        const clone = this._applyAction(board.clone(), action, owner);
        const score = this._minimax(clone, depth - 1, alpha, beta, false);
        max = Math.max(max, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break;
      }
      return max;
    } else {
      let min = Infinity;
      for (const action of actions) {
        const clone = this._applyAction(board.clone(), action, owner);
        const score = this._minimax(clone, depth - 1, alpha, beta, true);
        min = Math.min(min, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break;
      }
      return min;
    }
  }

  _evaluate(board) {
    let score = 0;
    const center = [1, 2, 3];
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 5; c++) {
        const p = board.getPiece(r, c);
        if (!p) continue;
        const val = PIECE_VALUES[p.type] || 0;
        const centerBonus = (center.includes(r) && center.includes(c)) ? 0.1 : 0;
        score += p.owner === Owner.AI ? val + centerBonus : -(val + centerBonus);
      }
    if (this.detector.isInCheck(board, Owner.PLAYER)) score += 2;
    if (this.detector.isInCheck(board, Owner.AI)) score -= 2;
    return score;
  }

  _generateActions(board, owner) {
    const actions = [];
    const moves = this._getAllMoves(board, owner);
    actions.push(...moves.map(m => ({ type: 'move', ...m })));
    const summons = this._getSummonOptions(board, owner);
    actions.push(...summons.map(s => ({ type: 'summon', ...s })));
    return actions;
  }

  _getAllMoves(board, owner) {
    const result = [];
    for (const { row, col } of board.getAllPieces(owner)) {
      const moves = this.calc.getMoves(board, row, col);
      for (const to of moves) result.push({ from: { row, col }, to });
    }
    return result;
  }

  _getSummonOptions(board, owner) {
    const options = [];
    const squares = this.summon.getSummonableSquares(board, owner);
    for (const type of SUMMONABLE_TYPES) {
      if (this.summon.canSummon(board, owner, type)) {
        for (const sq of squares)
          options.push({ pieceType: type, to: sq });
      }
    }
    return options;
  }

  _applyAction(board, action, owner) {
    if (action.type === 'move')
      board.movePiece(action.from.row, action.from.col, action.to.row, action.to.col);
    else if (action.type === 'summon')
      this.summon.summon(board, owner, action.pieceType, action.to.row, action.to.col);
    board.addMana(owner, 2); // simulate next turn mana
    return board;
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- tests/AIController.test.js
```

Expected: PASS (4 tests)

- [ ] **Step 5: Run all tests**

```bash
npm test
```

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/game/AIController.js tests/AIController.test.js
git commit -m "feat: add AIController with easy/medium/hard difficulty"
```

---

## Task 9: BootScene

**Files:**
- Create: `src/scenes/BootScene.js`

- [ ] **Step 1: Create BootScene.js**

```javascript
// src/scenes/BootScene.js
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // No external assets — all rendering uses Phaser Graphics primitives
  }

  create() {
    this.scene.start('Menu');
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/BootScene.js
git commit -m "feat: add BootScene"
```

---

## Task 10: MenuScene

**Files:**
- Create: `src/scenes/MenuScene.js`

- [ ] **Step 1: Create MenuScene.js**

```javascript
// src/scenes/MenuScene.js
import { GAME_WIDTH, GAME_HEIGHT, COLORS, Difficulty } from '../config.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const cx = GAME_WIDTH / 2;
    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.PANEL_BG);

    this.add.text(cx, 120, 'Chess Summon', {
      fontSize: '48px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 200, '난이도를 선택하세요', {
      fontSize: '24px', color: '#aaaaaa',
    }).setOrigin(0.5);

    const difficulties = [
      { label: '쉬움', value: Difficulty.EASY, y: 300 },
      { label: '보통', value: Difficulty.MEDIUM, y: 380 },
      { label: '어려움', value: Difficulty.HARD, y: 460 },
    ];

    for (const { label, value, y } of difficulties) {
      const btn = this.add.rectangle(cx, y, 200, 50, COLORS.BUTTON_BG).setInteractive();
      this.add.text(cx, y, label, { fontSize: '22px', color: '#ffffff' }).setOrigin(0.5);
      btn.on('pointerover', () => btn.setFillStyle(COLORS.BUTTON_HOVER));
      btn.on('pointerout', () => btn.setFillStyle(COLORS.BUTTON_BG));
      btn.on('pointerdown', () => this.scene.start('Placement', { difficulty: value }));
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/MenuScene.js
git commit -m "feat: add MenuScene with difficulty selection"
```

---

## Task 11: PlacementScene

**Files:**
- Create: `src/scenes/PlacementScene.js`

- [ ] **Step 1: Create PlacementScene.js**

```javascript
// src/scenes/PlacementScene.js
import { CELL_SIZE, BOARD_OFFSET_X, BOARD_OFFSET_Y, COLORS, GAME_WIDTH, PieceType, Owner } from '../config.js';

const KING_ROW = 4, KING_COL = 2;
const PAWN_COUNT = 4;

export class PlacementScene extends Phaser.Scene {
  constructor() { super('Placement'); }

  init(data) {
    this.difficulty = data.difficulty;
    // placed[row][col] = true if pawn placed there
    this.placed = {};
    this.pawnCount = 0;
  }

  create() {
    const cx = GAME_WIDTH / 2;
    this.add.rectangle(cx, 300, GAME_WIDTH, 600, COLORS.PANEL_BG);

    this.add.text(cx, 30, '폰 배치 (4개)', {
      fontSize: '22px', color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(cx, 60, '아래 2행에 폰을 배치하세요', {
      fontSize: '16px', color: '#aaaaaa',
    }).setOrigin(0.5);

    this._drawBoard();

    // Ready button (disabled until 4 pawns placed)
    this.readyBtn = this.add.rectangle(cx, 540, 180, 46, 0x555555).setInteractive();
    this.readyText = this.add.text(cx, 540, '준비 완료', {
      fontSize: '20px', color: '#888888',
    }).setOrigin(0.5);

    this.readyBtn.on('pointerdown', () => {
      if (this.pawnCount < PAWN_COUNT) return;
      const placements = Object.entries(this.placed).map(([key]) => {
        const [r, c] = key.split(',').map(Number);
        return { row: r, col: c };
      });
      this.scene.start('Game', { difficulty: this.difficulty, playerPlacements: placements });
    });
  }

  _drawBoard() {
    this.cellGraphics = {};
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const x = BOARD_OFFSET_X + c * CELL_SIZE + CELL_SIZE / 2;
        const y = BOARD_OFFSET_Y + r * CELL_SIZE + CELL_SIZE / 2;
        const isLight = (r + c) % 2 === 0;
        const cell = this.add.rectangle(x, y, CELL_SIZE - 2, CELL_SIZE - 2,
          isLight ? COLORS.BOARD_LIGHT : COLORS.BOARD_DARK);

        // King cell
        if (r === KING_ROW && c === KING_COL) {
          this.add.text(x, y, 'K', { fontSize: '28px', color: '#2ecc71', fontStyle: 'bold' }).setOrigin(0.5);
          continue;
        }

        // Valid placement zone (rows 3-4, excluding king)
        if (r >= 3) {
          cell.setInteractive();
          cell.on('pointerover', () => { if (!this.placed[`${r},${c}`]) cell.setFillStyle(0xaaffaa); });
          cell.on('pointerout', () => { if (!this.placed[`${r},${c}`]) cell.setFillStyle(isLight ? COLORS.BOARD_LIGHT : COLORS.BOARD_DARK); });
          cell.on('pointerdown', () => this._togglePawn(r, c, x, y, cell, isLight));
          this.cellGraphics[`${r},${c}`] = { cell, x, y, isLight, text: null };
        }
      }
    }
  }

  _togglePawn(r, c, x, y, cell, isLight) {
    const key = `${r},${c}`;
    if (this.placed[key]) {
      // Remove pawn
      delete this.placed[key];
      this.pawnCount--;
      this.cellGraphics[key].text?.destroy();
      this.cellGraphics[key].text = null;
      cell.setFillStyle(isLight ? COLORS.BOARD_LIGHT : COLORS.BOARD_DARK);
    } else {
      if (this.pawnCount >= PAWN_COUNT) return;
      this.placed[key] = true;
      this.pawnCount++;
      this.cellGraphics[key].text = this.add.text(x, y, 'P', {
        fontSize: '26px', color: '#4a90d9', fontStyle: 'bold',
      }).setOrigin(0.5);
      cell.setFillStyle(0x4a90d9);
    }
    this._updateReadyButton();
  }

  _updateReadyButton() {
    const ready = this.pawnCount >= PAWN_COUNT;
    this.readyBtn.setFillStyle(ready ? 0x2a8a4a : 0x555555);
    this.readyText.setColor(ready ? '#ffffff' : '#888888');
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/PlacementScene.js
git commit -m "feat: add PlacementScene for pawn placement"
```

---

## Task 12: GameScene

**Files:**
- Create: `src/scenes/GameScene.js`

- [ ] **Step 1: Create GameScene.js**

```javascript
// src/scenes/GameScene.js
import { Board } from '../game/Board.js';
import { Piece } from '../game/Piece.js';
import { MoveCalculator } from '../game/MoveCalculator.js';
import { CheckDetector } from '../game/CheckDetector.js';
import { SummonSystem } from '../game/SummonSystem.js';
import { AIController } from '../game/AIController.js';
import {
  PieceType, Owner, COLORS, CELL_SIZE, BOARD_OFFSET_X, BOARD_OFFSET_Y,
  MANA_PER_TURN, TURN_TIME_LIMIT, AI_THINK_DELAY, PIECE_LABELS,
} from '../config.js';

const State = { WAITING: 'WAITING', SELECTED: 'SELECTED', SUMMON_MODE: 'SUMMON_MODE', AI_TURN: 'AI_TURN', GAME_OVER: 'GAME_OVER' };

export class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) {
    this.difficulty = data.difficulty;
    this.playerPlacements = data.playerPlacements;
  }

  create() {
    this.board = new Board();
    this.calc = new MoveCalculator();
    this.detector = new CheckDetector();
    this.summonSys = new SummonSystem();
    this.ai = new AIController(this.difficulty);
    this.state = State.WAITING;
    this.selectedCell = null;
    this.highlightGraphics = [];
    this.pieceObjects = {};
    this.timeLeft = TURN_TIME_LIMIT;
    this.pendingSummonType = null;

    this._setupBoard();
    this._drawBoard();
    this._renderAllPieces();
    this._startTurn(Owner.PLAYER);
  }

  _setupBoard() {
    // AI king + pawns
    this.board.setPiece(0, 2, new Piece(PieceType.KING, Owner.AI));
    this.board.setPiece(1, 0, new Piece(PieceType.PAWN, Owner.AI));
    this.board.setPiece(1, 1, new Piece(PieceType.PAWN, Owner.AI));
    this.board.setPiece(1, 3, new Piece(PieceType.PAWN, Owner.AI));
    this.board.setPiece(1, 4, new Piece(PieceType.PAWN, Owner.AI));
    // Player king
    this.board.setPiece(4, 2, new Piece(PieceType.KING, Owner.PLAYER));
    // Player pawns from placement
    for (const { row, col } of this.playerPlacements)
      this.board.setPiece(row, col, new Piece(PieceType.PAWN, Owner.PLAYER));
  }

  _drawBoard() {
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 5; c++) {
        const x = BOARD_OFFSET_X + c * CELL_SIZE + CELL_SIZE / 2;
        const y = BOARD_OFFSET_Y + r * CELL_SIZE + CELL_SIZE / 2;
        const isLight = (r + c) % 2 === 0;
        const cell = this.add.rectangle(x, y, CELL_SIZE - 2, CELL_SIZE - 2,
          isLight ? COLORS.BOARD_LIGHT : COLORS.BOARD_DARK);
        cell.setInteractive();
        cell.on('pointerdown', () => this._onCellClick(r, c));
      }
  }

  _renderAllPieces() {
    Object.values(this.pieceObjects).forEach(o => o.destroy());
    this.pieceObjects = {};
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 5; c++) {
        const piece = this.board.getPiece(r, c);
        if (piece) this._renderPiece(r, c, piece);
      }
  }

  _renderPiece(r, c, piece) {
    const x = BOARD_OFFSET_X + c * CELL_SIZE + CELL_SIZE / 2;
    const y = BOARD_OFFSET_Y + r * CELL_SIZE + CELL_SIZE / 2;
    const color = piece.owner === Owner.PLAYER ? '#4a90d9' : '#e74c3c';
    if (piece.type === PieceType.KING) {
      const kingColor = piece.owner === Owner.PLAYER ? '#2ecc71' : '#ff6b35';
      const obj = this.add.text(x, y, PIECE_LABELS[piece.type], {
        fontSize: '30px', color: kingColor, fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(1);
      this.pieceObjects[`${r},${c}`] = obj;
    } else {
      const obj = this.add.text(x, y, PIECE_LABELS[piece.type], {
        fontSize: '26px', color, fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(1);
      this.pieceObjects[`${r},${c}`] = obj;
    }
  }

  _clearHighlights() {
    this.highlightGraphics.forEach(g => g.destroy());
    this.highlightGraphics = [];
  }

  _highlightCells(cells, color, alpha = 0.45) {
    for (const { row, col } of cells) {
      const x = BOARD_OFFSET_X + col * CELL_SIZE;
      const y = BOARD_OFFSET_Y + row * CELL_SIZE;
      const g = this.add.graphics();
      g.fillStyle(color, alpha);
      g.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      g.setDepth(0.5);
      this.highlightGraphics.push(g);
    }
  }

  _onCellClick(r, c) {
    if (this.state === State.AI_TURN || this.state === State.GAME_OVER) return;

    if (this.state === State.SUMMON_MODE) {
      const squares = this.summonSys.getSummonableSquares(this.board, Owner.PLAYER);
      if (squares.some(s => s.row === r && s.col === c)) {
        this.summonSys.summon(this.board, Owner.PLAYER, this.pendingSummonType, r, c);
        this._renderAllPieces();
        this._clearHighlights();
        this.state = State.WAITING;
        this.pendingSummonType = null;
        this._endTurn();
        return;
      }
      this._clearHighlights();
      this.state = State.WAITING;
      this.pendingSummonType = null;
      return;
    }

    if (this.state === State.SELECTED) {
      const moves = this.calc.getMoves(this.board, this.selectedCell.row, this.selectedCell.col);
      if (moves.some(m => m.row === r && m.col === c)) {
        this.board.movePiece(this.selectedCell.row, this.selectedCell.col, r, c);
        this._renderAllPieces();
        this._clearHighlights();
        this.state = State.WAITING;
        this.selectedCell = null;
        this._checkGameOver();
        if (this.state !== State.GAME_OVER) this._endTurn();
        return;
      }
      this._clearHighlights();
      this.state = State.WAITING;
      this.selectedCell = null;
    }

    // Select own piece
    const piece = this.board.getPiece(r, c);
    if (piece && piece.owner === Owner.PLAYER) {
      this.state = State.SELECTED;
      this.selectedCell = { row: r, col: c };
      const moves = this.calc.getMoves(this.board, r, c);
      this._clearHighlights();
      this._highlightCells([{ row: r, col: c }], COLORS.SELECTED);
      this._highlightCells(moves, COLORS.MOVE_HIGHLIGHT);
      this._showThreatsIfInCheck();
    }
  }

  _showThreatsIfInCheck() {
    if (this.detector.isInCheck(this.board, Owner.PLAYER)) {
      const threats = this.detector.getThreats(this.board, Owner.PLAYER);
      this._highlightCells(threats, COLORS.THREAT, 0.7);
    }
  }

  _startTurn(owner) {
    this.board.addMana(owner, MANA_PER_TURN);
    this.board.currentTurn = owner;
    this.timeLeft = TURN_TIME_LIMIT;

    if (this.turnTimer) this.turnTimer.remove();
    this.turnTimer = this.time.addEvent({
      delay: 1000,
      callback: this._tickTimer,
      callbackScope: this,
      loop: true,
    });

    this.events.emit('turn-start', {
      turn: owner,
      mana: this.board.mana,
      timeLeft: this.timeLeft,
    });

    if (owner === Owner.AI) {
      this.state = State.AI_TURN;
      this.time.delayedCall(AI_THINK_DELAY, this._doAITurn, [], this);
    } else {
      this.state = State.WAITING;
      this._showThreatsIfInCheck();
    }
  }

  _tickTimer() {
    this.timeLeft--;
    this.events.emit('timer-tick', this.timeLeft);
    if (this.timeLeft <= 0) {
      this.turnTimer?.remove();
      if (this.board.currentTurn === Owner.PLAYER) this._endTurn();
    }
  }

  _endTurn() {
    this.turnTimer?.remove();
    this._clearHighlights();
    this.state = State.WAITING;
    const next = this.board.currentTurn === Owner.PLAYER ? Owner.AI : Owner.PLAYER;
    this._startTurn(next);
  }

  _doAITurn() {
    const action = this.ai.getAction(this.board);
    if (action.type === 'move') {
      this.board.movePiece(action.from.row, action.from.col, action.to.row, action.to.col);
    } else if (action.type === 'summon') {
      this.summonSys.summon(this.board, Owner.AI, action.pieceType, action.to.row, action.to.col);
    }
    this._renderAllPieces();
    this._checkGameOver();
    if (this.state !== State.GAME_OVER) this._endTurn();
  }

  _checkGameOver() {
    if (!this.board.findKing(Owner.PLAYER)) {
      this._gameOver(Owner.AI);
    } else if (!this.board.findKing(Owner.AI)) {
      this._gameOver(Owner.PLAYER);
    } else if (this.detector.isCheckmate(this.board, Owner.PLAYER)) {
      this._gameOver(Owner.AI);
    } else if (this.detector.isCheckmate(this.board, Owner.AI)) {
      this._gameOver(Owner.PLAYER);
    }
  }

  _gameOver(winner) {
    this.state = State.GAME_OVER;
    this.turnTimer?.remove();
    this.time.delayedCall(800, () => {
      this.scene.start('Result', { winner });
    });
  }

  // Called by UIScene to trigger summon mode
  startSummonMode(pieceType) {
    if (this.state !== State.WAITING) return;
    if (!this.summonSys.canSummon(this.board, Owner.PLAYER, pieceType)) return;
    this.pendingSummonType = pieceType;
    this.state = State.SUMMON_MODE;
    this._clearHighlights();
    const squares = this.summonSys.getSummonableSquares(this.board, Owner.PLAYER);
    this._highlightCells(squares, COLORS.SUMMON_HIGHLIGHT);
  }

  getMana() { return this.board.mana; }
  getCurrentTurn() { return this.board.currentTurn; }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: add GameScene with full game logic"
```

---

## Task 13: UIScene

**Files:**
- Create: `src/scenes/UIScene.js`

- [ ] **Step 1: Create UIScene.js**

```javascript
// src/scenes/UIScene.js
import {
  COLORS, GAME_WIDTH, Owner, PieceType, SUMMON_COSTS, PIECE_LABELS,
} from '../config.js';

const SUMMONABLE = [PieceType.PAWN, PieceType.KNIGHT, PieceType.BISHOP, PieceType.ROOK, PieceType.QUEEN];
const PANEL_X = 510;

export class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UI', active: false }); }

  create() {
    this.gameScene = this.scene.get('Game');

    // Panel background
    this.add.rectangle(PANEL_X + 115, 300, 240, 600, COLORS.PANEL_BG);

    // Turn label
    this.turnText = this.add.text(PANEL_X, 30, '내 턴', {
      fontSize: '20px', color: '#ffffff',
    });

    // Timer
    this.timerText = this.add.text(PANEL_X, 60, '60', {
      fontSize: '32px', color: '#ffdd00', fontStyle: 'bold',
    });

    // Mana
    this.add.text(PANEL_X, 110, 'MANA', { fontSize: '14px', color: '#aaaaaa' });
    this.manaText = this.add.text(PANEL_X, 130, '0 / 10', {
      fontSize: '22px', color: '#00ccff',
    });

    // Summon panel
    this.add.text(PANEL_X, 180, '소환 (클릭 후 칸 선택)', { fontSize: '13px', color: '#aaaaaa' });
    this.summonButtons = {};
    SUMMONABLE.forEach((type, i) => {
      const y = 215 + i * 52;
      const btn = this.add.rectangle(PANEL_X + 90, y, 190, 44, COLORS.BUTTON_BG).setInteractive();
      const label = `${PIECE_LABELS[type]}  (${SUMMON_COSTS[type]} 마나)`;
      const txt = this.add.text(PANEL_X + 90, y, label, {
        fontSize: '17px', color: '#ffffff',
      }).setOrigin(0.5);
      btn.on('pointerover', () => btn.setFillStyle(COLORS.BUTTON_HOVER));
      btn.on('pointerout', () => btn.setFillStyle(COLORS.BUTTON_BG));
      btn.on('pointerdown', () => this.gameScene.startSummonMode(type));
      this.summonButtons[type] = { btn, txt };
    });

    // Listen to GameScene events
    this.gameScene.events.on('turn-start', this._onTurnStart, this);
    this.gameScene.events.on('timer-tick', this._onTimerTick, this);
  }

  _onTurnStart({ turn, mana, timeLeft }) {
    this.turnText.setText(turn === Owner.PLAYER ? '내 턴' : 'AI 턴');
    this.timerText.setText(String(timeLeft));
    this.manaText.setText(`${mana[Owner.PLAYER]} / 10`);
    this._refreshSummonButtons(mana[Owner.PLAYER]);
  }

  _onTimerTick(timeLeft) {
    this.timerText.setText(String(timeLeft));
    this.timerText.setColor(timeLeft <= 10 ? '#ff4444' : '#ffdd00');
  }

  _refreshSummonButtons(playerMana) {
    for (const [type, { btn, txt }] of Object.entries(this.summonButtons)) {
      const affordable = playerMana >= SUMMON_COSTS[type];
      btn.setFillStyle(affordable ? COLORS.BUTTON_BG : 0x333333);
      txt.setColor(affordable ? '#ffffff' : '#666666');
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/UIScene.js
git commit -m "feat: add UIScene HUD overlay"
```

---

## Task 14: ResultScene

**Files:**
- Create: `src/scenes/ResultScene.js`

- [ ] **Step 1: Create ResultScene.js**

```javascript
// src/scenes/ResultScene.js
import { GAME_WIDTH, GAME_HEIGHT, COLORS, Owner } from '../config.js';

export class ResultScene extends Phaser.Scene {
  constructor() { super('Result'); }

  init(data) { this.winner = data.winner; }

  create() {
    const cx = GAME_WIDTH / 2;
    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.PANEL_BG);

    const msg = this.winner === Owner.PLAYER ? '승리!' : '패배...';
    const color = this.winner === Owner.PLAYER ? '#2ecc71' : '#e74c3c';
    this.add.text(cx, 180, msg, {
      fontSize: '64px', color, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Replay button
    const replayBtn = this.add.rectangle(cx, 320, 200, 52, COLORS.BUTTON_BG).setInteractive();
    this.add.text(cx, 320, '다시하기', { fontSize: '22px', color: '#ffffff' }).setOrigin(0.5);
    replayBtn.on('pointerover', () => replayBtn.setFillStyle(COLORS.BUTTON_HOVER));
    replayBtn.on('pointerout', () => replayBtn.setFillStyle(COLORS.BUTTON_BG));
    replayBtn.on('pointerdown', () => {
      this.scene.stop('UI');
      this.scene.start('Menu');
    });

    // Menu button
    const menuBtn = this.add.rectangle(cx, 390, 200, 52, COLORS.BUTTON_BG).setInteractive();
    this.add.text(cx, 390, '메인 메뉴', { fontSize: '22px', color: '#ffffff' }).setOrigin(0.5);
    menuBtn.on('pointerover', () => menuBtn.setFillStyle(COLORS.BUTTON_HOVER));
    menuBtn.on('pointerout', () => menuBtn.setFillStyle(COLORS.BUTTON_BG));
    menuBtn.on('pointerdown', () => {
      this.scene.stop('UI');
      this.scene.start('Menu');
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/ResultScene.js
git commit -m "feat: add ResultScene"
```

---

## Task 15: main.js — Wire Everything

**Files:**
- Create: `src/main.js`

- [ ] **Step 1: Create src/main.js**

```javascript
// src/main.js
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { PlacementScene } from './scenes/PlacementScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { ResultScene } from './scenes/ResultScene.js';
import { GAME_WIDTH, GAME_HEIGHT } from './config.js';

new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1a1a2e',
  scene: [BootScene, MenuScene, PlacementScene, GameScene, UIScene, ResultScene],
});
```

- [ ] **Step 2: Update GameScene to launch UIScene alongside it**

In `src/scenes/GameScene.js`, in the `create()` method, add after `this._startTurn(Owner.PLAYER);`:

```javascript
this.scene.launch('UI');
```

- [ ] **Step 3: Run dev server**

```bash
npm run dev
```

Expected: Vite dev server starts, game loads in browser at `http://localhost:5173`

- [ ] **Step 4: Manual smoke test**
  - Menu appears with 3 difficulty buttons
  - Clicking a difficulty goes to PlacementScene
  - 4 pawns can be placed in bottom 2 rows; king is shown fixed
  - Ready button activates after all 4 placed
  - Game starts: board shows pieces, mana=2 (first turn grant), timer counts down
  - Clicking a piece shows blue move highlights
  - In check: threatening piece shows red border
  - Summon buttons in UI panel are greyed out when insufficient mana
  - Clicking a summon button then a green-highlighted cell places a piece
  - AI takes its turn after player ends theirs
  - Game ends with result screen on checkmate or king capture

- [ ] **Step 5: Run all unit tests one final time**

```bash
npm test
```

Expected: all tests PASS

- [ ] **Step 6: Final commit**

```bash
git add src/main.js src/scenes/GameScene.js
git commit -m "feat: wire all scenes, complete MVP"
```
