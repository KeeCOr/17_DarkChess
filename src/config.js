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
