import { COLORS, LAYOUT, PieceType, TEXT_COLORS } from '../config.js';

export const UI_COPY = Object.freeze({
  menu: {
    title: 'Chess Summon',
    subtitle: '난이도를 선택하세요',
    difficulties: {
      EASY: '쉬움',
      MEDIUM: '보통',
      HARD: '어려움',
    },
    difficultyHints: {
      EASY: '자동 배치 + 튜토리얼 선택',
      MEDIUM: '자동 배치로 바로 시작',
      HARD: '직접 배치 후 전투',
    },
  },
  placement: {
    title: '전초 배치',
    subtitle: '하단 2개 행에 병사 4명을 배치하세요',
    ready: '전투 시작',
    count: '배치 병사',
  },
  tutorialPrompt: {
    title: '튜토리얼을 볼까요?',
    body: '게임 방법을 단계별로 알려드립니다',
    yes: '네',
    no: '아니요',
  },
  game: {
    playerTurn: '내 턴',
    aiTurn: 'AI 턴',
    mana: '마나',
    action: '행동 현황',
    moveReady: '이동 가능',
    moveDone: '이동 완료',
    summonReady: '소환 가능',
    summonDone: '소환 완료',
    summon: '소환',
    endTurn: '턴 종료',
    surrender: '기권',
    check: '체크!',
    confirmSurrender: '정말 기권하시겠습니까?',
    cancel: '취소',
  },
  tutorial: {
    steps: [
      '병사를 클릭해보세요',
      '이동할 칸을 선택하세요',
      '마나 +2!\n소환 버튼을 눌러보세요',
      '아군 주변 빈 칸을 클릭해\n소환하세요',
      '턴 종료 버튼을 눌러\nAI에게 턴을 넘겨보세요',
      '튜토리얼 완료!\n자유롭게 플레이하세요',
    ],
    checkHint: '체크! 이동으로 왕의 위협을 피하세요.',
    complete: '튜토리얼 완료!',
    confirm: '확인',
  },
  result: {
    win: '승리!',
    lose: '패배...',
    replay: '다시하기',
    menu: '메인 메뉴',
  },
});

export function getPieceName(type) {
  return {
    [PieceType.PAWN]: '병사',
    [PieceType.KNIGHT]: '기사',
    [PieceType.BISHOP]: '주교',
    [PieceType.ROOK]: '성채',
    [PieceType.QUEEN]: '여왕',
    [PieceType.KING]: '왕',
  }[type] || type;
}

export function getButtonColors({ enabled = true, active = false, danger = false } = {}) {
  if (!enabled) {
    return { fill: COLORS.BUTTON_DISABLED, stroke: 0x242c45, text: 0x566077, alpha: 0.48 };
  }
  if (active) {
    return { fill: COLORS.GOLD, stroke: 0xffdf7a, text: 0x1a1208, alpha: 1 };
  }
  if (danger) {
    return { fill: COLORS.CRIMSON, stroke: 0xd65a4a, text: 0xffffff, alpha: 1 };
  }
  return { fill: COLORS.BUTTON_BG, stroke: 0x526092, text: 0xffffff, alpha: 1 };
}

export function addStageBackground(scene, title = '') {
  const { GAME_WIDTH: w, GAME_HEIGHT: h } = LAYOUT;
  scene.add.rectangle(w / 2, h / 2, w, h, COLORS.BACKDROP);
  scene.add.rectangle(w / 2, h / 2, w - 54, h - 42, COLORS.PANEL_BG).setAlpha(0.92);

  const g = scene.add.graphics();
  g.lineStyle(2, COLORS.PANEL_EDGE, 0.45);
  g.strokeRect(36, 30, w - 72, h - 60);
  g.lineStyle(1, COLORS.GOLD, 0.18);
  for (let i = 0; i < 6; i++) {
    const r = 96 + i * 38;
    g.strokeCircle(w / 2, h / 2 + 18, r);
  }
  g.lineStyle(2, COLORS.EMERALD, 0.16);
  g.beginPath();
  g.moveTo(w / 2, 96);
  g.lineTo(w / 2 + 165, h / 2 + 150);
  g.lineTo(w / 2 - 165, h / 2 + 150);
  g.closePath();
  g.strokePath();

  if (title) {
    scene.add.text(w / 2, 88, title, {
      fontSize: '44px',
      color: TEXT_COLORS.PRIMARY,
      fontStyle: 'bold',
      fontFamily: 'Georgia, serif',
    }).setOrigin(0.5);
  }
}

export function addPanel(scene, x, y, width, height, options = {}) {
  const depth = options.depth ?? 0;
  const alpha = options.alpha ?? 0.96;
  const g = scene.add.graphics().setDepth(depth);
  g.fillStyle(COLORS.PANEL_DEEP, alpha);
  g.fillRoundedRect(x, y, width, height, 8);
  g.lineStyle(2, options.stroke ?? COLORS.PANEL_EDGE, options.strokeAlpha ?? 0.65);
  g.strokeRoundedRect(x, y, width, height, 8);
  return g;
}

export function addSectionLabel(scene, x, y, text, depth = 0) {
  return scene.add.text(x, y, text, {
    fontSize: '12px',
    color: TEXT_COLORS.GOLD,
    fontStyle: 'bold',
  }).setDepth(depth);
}

export function addDivider(scene, x, y, width, depth = 0) {
  const g = scene.add.graphics().setDepth(depth);
  g.lineStyle(1, COLORS.PANEL_EDGE, 0.35);
  g.lineBetween(x, y, x + width, y);
  return g;
}

export function addTextButton(scene, x, y, width, height, label, options = {}) {
  const state = getButtonColors(options);
  const rect = scene.add.rectangle(x, y, width, height, state.fill)
    .setInteractive({ useHandCursor: true })
    .setAlpha(state.alpha)
    .setDepth(options.depth ?? 0);
  rect.setStrokeStyle(1, state.stroke, 0.85);

  const text = scene.add.text(x, y, label, {
    fontSize: options.fontSize || '18px',
    color: `#${state.text.toString(16).padStart(6, '0')}`,
    fontStyle: 'bold',
    align: 'center',
  }).setOrigin(0.5).setDepth((options.depth ?? 0) + 1);

  rect.on('pointerover', () => {
    if (rect.getData('enabled') === false) return;
    rect.setFillStyle(options.active ? COLORS.GOLD : (options.danger ? 0xb4453d : COLORS.BUTTON_HOVER));
  });
  rect.on('pointerout', () => {
    if (rect.getData('enabled') === false) return;
    rect.setFillStyle(options.active ? COLORS.GOLD : (options.danger ? COLORS.CRIMSON : COLORS.BUTTON_BG));
  });
  rect.on('pointerdown', () => {
    if (rect.getData('enabled') === false) return;
    scene.tweens.add({ targets: [rect, text], scaleX: 0.97, scaleY: 0.97, duration: 60, yoyo: true });
  });

  rect.setData('enabled', options.enabled !== false);
  return { rect, text };
}

export function setButtonState(button, options = {}) {
  const state = getButtonColors(options);
  button.rect.setData('enabled', options.enabled !== false);
  button.rect.setFillStyle(state.fill);
  button.rect.setStrokeStyle(1, state.stroke, 0.85);
  button.rect.setAlpha(state.alpha);
  button.text.setColor(`#${state.text.toString(16).padStart(6, '0')}`);
  button.text.setAlpha(state.alpha < 1 ? 0.65 : 1);
}
