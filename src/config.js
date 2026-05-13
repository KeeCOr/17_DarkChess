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

export const LAYOUT = Object.freeze({
  CELL_SIZE: 80,
  BOARD_OFFSET_X: 80,
  BOARD_OFFSET_Y: 80,
  GAME_WIDTH: 800,
  GAME_HEIGHT: 600,
  PANEL_X: 510,
  PANEL_WIDTH: 240,
});

export const COLORS = Object.freeze({
  BACKDROP: 0x111426,
  PANEL_BG: 0x17213b,
  PANEL_DEEP: 0x0d1324,
  PANEL_EDGE: 0xb7893d,
  BOARD_FRAME: 0x3b2a1a,
  BOARD_LIGHT: 0xdcc18b,
  BOARD_DARK: 0x8d6841,
  PLAYER_PIECE: 0x4a90d9,
  AI_PIECE: 0xe74c3c,
  MOVE_HIGHLIGHT: 0x19d98a,
  SUMMON_HIGHLIGHT: 0x20e0b0,
  MOVABLE_PIECE: 0xf3d071,
  SELECTED: 0xf7c84b,
  THREAT: 0xd93636,
  GOLD: 0xd4a64a,
  GOLD_DARK: 0x5c3b16,
  EMERALD: 0x2fa866,
  CRIMSON: 0x923232,
  TEXT_PRIMARY: 0xffffff,
  TEXT_MUTED: 0x95a0b8,
  BUTTON_BG: 0x263155,
  BUTTON_HOVER: 0x394779,
  BUTTON_DISABLED: 0x151a2d,
});

// CSS string versions for use with Phaser text objects (add.text style)
export const TEXT_COLORS = Object.freeze({
  PLAYER_PIECE: '#4a90d9',
  AI_PIECE: '#e74c3c',
  KING_PLAYER: '#2ecc71',
  KING_AI: '#ff6b35',
  PRIMARY: '#ffffff',
  MUTED: '#95a0b8',
  DIM: '#566077',
  GOLD: '#d4a64a',
  MANA: '#37d9ff',
  TIMER: '#f7c84b',
  TIMER_LOW: '#ff4444',
  SUCCESS: '#2fd17d',
  DANGER: '#ff5a5a',
});
