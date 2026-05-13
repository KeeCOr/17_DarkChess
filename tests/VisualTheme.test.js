import { describe, it, expect } from 'vitest';
import { LAYOUT, PieceType } from '../src/config.js';
import { getPieceName, UI_COPY, getButtonColors, getTurnHint } from '../src/ui/visuals.js';

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

  it('explains one move and one summon per turn', () => {
    expect(UI_COPY.game.moveSlot).toBe('이동 1회');
    expect(UI_COPY.game.summonSlot).toBe('소환 1회');
    expect(UI_COPY.help.lines).toContain('한 턴에는 이동 1회와 소환 1회를 각각 사용할 수 있습니다.');
  });

  it('uses mana icon semantics instead of a separate cost label', () => {
    expect(UI_COPY.game.manaIconLabel).toBe('마나');
    expect(UI_COPY.game.cost).toBe('');
  });

  it('returns clear board hints for turn states', () => {
    expect(getTurnHint({ hasMoved: false, hasSummoned: false, mode: 'default' }))
      .toBe('말을 선택해 이동하거나, 소환 카드를 선택하세요');
    expect(getTurnHint({ hasMoved: false, hasSummoned: false, mode: 'summon' }))
      .toBe('초록 칸을 클릭하면 선택한 말을 소환합니다');
    expect(getTurnHint({ hasMoved: true, hasSummoned: false, mode: 'default' }))
      .toBe('이동 완료. 아직 소환 1회를 사용할 수 있습니다');
    expect(getTurnHint({ hasMoved: true, hasSummoned: true, mode: 'default' }))
      .toBe('이번 턴 행동 완료. 턴 종료를 누르세요');
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

  it('keeps rendered board pieces inside a single cell', () => {
    expect(LAYOUT.PIECE_SIZE).toBeGreaterThanOrEqual(82);
    expect(LAYOUT.PIECE_SIZE).toBeLessThanOrEqual(LAYOUT.CELL_SIZE + 8);
    expect(LAYOUT.PIECE_SHADOW_WIDTH).toBeLessThanOrEqual(LAYOUT.CELL_SIZE - 18);
  });

  it('reserves non-overlapping right panel zones', () => {
    expect(LAYOUT.HUD_PANEL_X + LAYOUT.HUD_PANEL_WIDTH).toBeLessThanOrEqual(LAYOUT.GAME_WIDTH - 30);
    expect(LAYOUT.HUD_MANA_Y).toBeGreaterThan(LAYOUT.HUD_SUMMON_LABEL_Y);
    expect(LAYOUT.HUD_MANA_Y).toBeLessThan(LAYOUT.HUD_SUMMON_START_Y - 8);
    expect(LAYOUT.HUD_SUMMON_START_Y + LAYOUT.HUD_SUMMON_ROW_GAP * 4 + LAYOUT.HUD_SUMMON_ROW_HEIGHT)
      .toBeLessThanOrEqual(LAYOUT.HUD_FOOTER_Y - 14);
  });
});
