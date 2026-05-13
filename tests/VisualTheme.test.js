import { describe, it, expect } from 'vitest';
import { PieceType } from '../src/config.js';
import { getPieceName, UI_COPY, getButtonColors } from '../src/ui/visuals.js';

describe('visual theme helpers', () => {
  it('provides readable Korean labels for all summonable pieces', () => {
    expect(getPieceName(PieceType.PAWN)).toBe('병사');
    expect(getPieceName(PieceType.KNIGHT)).toBe('기사');
    expect(getPieceName(PieceType.BISHOP)).toBe('주교');
    expect(getPieceName(PieceType.ROOK)).toBe('성채');
    expect(getPieceName(PieceType.QUEEN)).toBe('여왕');
  });

  it('keeps primary UX copy readable instead of mojibake', () => {
    expect(UI_COPY.menu.subtitle).toBe('난이도를 선택하세요');
    expect(UI_COPY.game.endTurn).toBe('턴 종료');
    expect(UI_COPY.game.surrender).toBe('기권');
    expect(UI_COPY.tutorial.complete).toContain('튜토리얼 완료');
  });

  it('returns distinct button colors for enabled, active, and disabled states', () => {
    const enabled = getButtonColors({ enabled: true, active: false });
    const active = getButtonColors({ enabled: true, active: true });
    const disabled = getButtonColors({ enabled: false, active: false });

    expect(enabled.fill).not.toBe(active.fill);
    expect(enabled.fill).not.toBe(disabled.fill);
    expect(disabled.alpha).toBeLessThan(enabled.alpha);
    expect(active.text).toBe(0x1a1208);
  });
});
