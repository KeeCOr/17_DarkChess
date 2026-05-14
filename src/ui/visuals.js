import { COLORS, LAYOUT, PieceType, TEXT_COLORS } from '../config.js';

export const UI_COPY = Object.freeze({
  menu: {
    title: 'Chess Summon',
    modeTitle: '플레이 모드 선택',
    single: '싱글 플레이',
    multiplayer: '멀티 플레이',
    back: '뒤로',
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
    manaIconLabel: '마나',
    action: '이번 턴 행동',
    moveSlot: '이동 1회',
    summonSlot: '소환 1회',
    turnRule: '이동 1회 + 소환 1회',
    turnRuleSub: '둘 다 사용하면 턴 종료',
    moveReady: '가능',
    moveDone: '완료',
    summonReady: '가능',
    summonDone: '완료',
    summon: '소환 카드',
    summonHint: '아군 주변 빈 칸',
    endTurn: '턴 종료',
    surrender: '기권',
    help: '?',
    check: '체크!',
    confirmSurrender: '정말 기권하시겠습니까?',
    cancel: '취소',
    cost: '',
    notEnoughMana: '마나 부족',
    selected: '선택',
  },
  hints: {
    default: '말을 선택해 이동하거나, 소환 카드를 선택하세요',
    selected: '밝은 칸으로 이동하면 새 시야가 열립니다',
    summon: '초록 칸을 클릭하면 선택한 말을 소환합니다',
    moveRemaining: '소환 완료. 아직 이동 1회를 사용할 수 있습니다',
    summonRemaining: '이동 완료. 아직 소환 1회를 사용할 수 있습니다',
    done: '이번 턴 행동 완료. 턴 종료를 누르세요',
    ai: 'AI가 수를 계산하고 있습니다',
  },
  help: {
    title: '전투 도움말',
    lines: [
      '한 턴에는 이동 1회와 소환 1회를 각각 사용할 수 있습니다.',
      '소환은 아군 말 주변 8칸 중 빈 칸에만 가능합니다.',
      '말을 선택하면 이동 가능한 칸이 밝게 표시됩니다.',
      '시야는 내 말 주변 1칸, 이동 가능한 경로, 체크 위협 말이 밝혀집니다.',
      '두 행동을 모두 사용했다면 턴 종료를 누르세요.',
    ],
    close: '확인',
  },
  tutorial: {
    steps: [
      '병사를 클릭해보세요',
      '이동할 칸을 선택하세요\n이동하면 새 시야가 열립니다',
      '마나 +2!\n소환 카드는 턴마다 1번 사용할 수 있습니다',
      '아군 주변 초록 칸을 클릭해\n소환하세요',
      '한 턴에는 이동 1회와 소환 1회가 가능합니다',
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
  multiplayer: {
    title: '온라인 멀티 플레이',
    nicknamePrompt: '랭크에 사용할 닉네임을 입력하세요',
    connecting: '서버에 연결 중...',
    offline: '서버 연결 실패: npm run online:server 를 먼저 실행하세요',
    account: '계정',
    rank: '랭크 포인트',
    queue: '빠른 매칭',
    queued: '상대를 찾는 중...',
    matched: '매칭 완료',
    server: 'ws://localhost:8787',
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

export function getTurnHint({ hasMoved = false, hasSummoned = false, mode = 'default' } = {}) {
  if (mode === 'ai') return UI_COPY.hints.ai;
  if (mode === 'selected') return UI_COPY.hints.selected;
  if (mode === 'summon') return UI_COPY.hints.summon;
  if (hasMoved && hasSummoned) return UI_COPY.hints.done;
  if (hasMoved) return UI_COPY.hints.summonRemaining;
  if (hasSummoned) return UI_COPY.hints.moveRemaining;
  return UI_COPY.hints.default;
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
  g.fillStyle(options.fill ?? COLORS.PANEL_DEEP, alpha);
  g.fillRoundedRect(x, y, width, height, options.radius ?? 8);
  g.lineStyle(options.lineWidth ?? 2, options.stroke ?? COLORS.PANEL_EDGE, options.strokeAlpha ?? 0.65);
  g.strokeRoundedRect(x, y, width, height, options.radius ?? 8);
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
