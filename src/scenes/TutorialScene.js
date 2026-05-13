// src/scenes/TutorialScene.js
import { LAYOUT } from '../config.js';

const BOARD_X = LAYOUT.BOARD_OFFSET_X;
const BOARD_Y = LAYOUT.BOARD_OFFSET_Y;
const BOARD_W = 5 * LAYOUT.CELL_SIZE;
const BOARD_H = 5 * LAYOUT.CELL_SIZE;
const PANEL_X = 510;

const HIGHLIGHT_RECTS = {
  board:    { x: BOARD_X - 4,  y: BOARD_Y - 4, w: BOARD_W + 8, h: BOARD_H + 8 },
  summonUI: { x: PANEL_X - 4,  y: 205,          w: 198,         h: 260 },
  endBtn:   { x: PANEL_X - 4,  y: 522,          w: 198,         h: 36 },
};

const STEPS = [
  { text: '폰을 클릭해보세요',                       highlight: 'board',    waitEvent: 'tutorial-piece-selected' },
  { text: '이동할 칸을 선택하세요',                   highlight: 'board',    waitEvent: 'tutorial-piece-moved' },
  { text: '마나 +2!\n소환 버튼을 눌러보세요',          highlight: 'summonUI', waitEvent: 'tutorial-summon-clicked' },
  { text: '왕 주변 빈 칸을 클릭해\n소환하세요',        highlight: 'board',    waitEvent: 'tutorial-summoned' },
  { text: '턴 종료 버튼을 눌러\nAI에게 턴을 넘기세요', highlight: 'endBtn',   waitEvent: 'tutorial-turn-ended' },
  { text: '튜토리얼 완료!\n자유롭게 플레이하세요',     highlight: null,       waitEvent: null },
];

export class TutorialScene extends Phaser.Scene {
  constructor() { super({ key: 'Tutorial', active: false }); }

  create() {
    this.gameScene = this.scene.get('Game');
    this.stepIndex = 0;
    this._overlayObjs = [];

    this.gameScene.events.on('tutorial-piece-selected', () => this._tryAdvance('tutorial-piece-selected'), this);
    this.gameScene.events.on('tutorial-piece-moved',    () => this._tryAdvance('tutorial-piece-moved'),    this);
    this.gameScene.events.on('tutorial-summon-clicked', () => this._tryAdvance('tutorial-summon-clicked'), this);
    this.gameScene.events.on('tutorial-summoned',       () => this._tryAdvance('tutorial-summoned'),       this);
    this.gameScene.events.on('tutorial-turn-ended',     () => this._tryAdvance('tutorial-turn-ended'),     this);
    this.gameScene.events.on('check', (inCheck) => {
      if (inCheck && this.stepIndex < STEPS.length - 1)
        this._showHint('체크! 이동으로 왕의 위협을 피하세요.');
    }, this);

    this._showStep();
  }

  _tryAdvance(event) {
    const step = STEPS[this.stepIndex];
    if (step && step.waitEvent === event) this._nextStep();
  }

  _nextStep() {
    this.stepIndex++;
    this._showStep();
  }

  _clearOverlay() {
    this._overlayObjs.forEach(o => o.destroy());
    this._overlayObjs = [];
  }

  _showStep() {
    this._clearOverlay();
    const step = STEPS[this.stepIndex];
    if (!step) { this._finish(); return; }

    const W = LAYOUT.GAME_WIDTH, H = LAYOUT.GAME_HEIGHT;

    // 반투명 전체 오버레이
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setDepth(20).setInteractive();
    this._overlayObjs.push(overlay);

    // 하이라이트 테두리
    if (step.highlight) {
      const r = HIGHLIGHT_RECTS[step.highlight];
      const border = this.add.graphics().setDepth(21);
      border.lineStyle(3, 0xffaa00, 1);
      border.strokeRect(r.x, r.y, r.w, r.h);
      this.tweens.add({ targets: border, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
      this._overlayObjs.push(border);
    }

    // 텍스트 박스 위치 (하이라이트 아래, 없으면 중앙)
    const boxY = step.highlight
      ? Math.min(HIGHLIGHT_RECTS[step.highlight].y + HIGHLIGHT_RECTS[step.highlight].h + 50, H - 80)
      : H / 2;
    const boxX = (step.highlight === 'summonUI' || step.highlight === 'endBtn')
      ? PANEL_X + 95
      : W / 2;

    const lines = step.text.split('\n').length;
    const boxH = 40 + lines * 24;

    const panelBorder = this.add.rectangle(boxX, boxY, 284, boxH + 4, 0xffaa00).setDepth(21);
    const panel = this.add.rectangle(boxX, boxY, 280, boxH, 0x1a1a2e).setDepth(22);
    const txt = this.add.text(boxX, boxY, step.text, {
      fontSize: '16px', color: '#ffffff', align: 'center', lineSpacing: 6,
    }).setOrigin(0.5).setDepth(23);
    this._overlayObjs.push(panelBorder, panel, txt);

    // 진행 점
    const dotsY = boxY + boxH / 2 + 18;
    const total = STEPS.length - 1; // 마지막(done) 제외
    const dotSpacing = 14;
    const startX = boxX - (total - 1) * dotSpacing / 2;
    for (let i = 0; i < total; i++) {
      const dot = this.add.circle(
        startX + i * dotSpacing, dotsY, 4,
        i < this.stepIndex ? 0xffaa00 : (i === this.stepIndex ? 0xffffff : 0x555555),
      ).setDepth(23);
      this._overlayObjs.push(dot);
    }

    // 마지막 단계: "확인" 버튼
    if (!step.waitEvent) {
      const confirmBtn = this.add.rectangle(boxX, boxY + boxH / 2 + 40, 100, 34, 0x2a8a4a).setInteractive().setDepth(23);
      const confirmTxt = this.add.text(boxX, boxY + boxH / 2 + 40, '확인', {
        fontSize: '16px', color: '#ffffff',
      }).setOrigin(0.5).setDepth(24);
      this._overlayObjs.push(confirmBtn, confirmTxt);
      confirmBtn.on('pointerdown', () => this._finish());
    }
  }

  _showHint(text) {
    const hint = this.add.text(LAYOUT.GAME_WIDTH / 2, 20, text, {
      fontSize: '15px', color: '#ffdd00', backgroundColor: '#1a1a2e',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setDepth(30);
    this.time.delayedCall(3000, () => hint.destroy());
  }

  _finish() {
    this._clearOverlay();
    this.gameScene.tutorialMode = false;
    this.gameScene.tutorialLocked = false;
    this.scene.stop();
  }

  shutdown() {
    if (this.gameScene) {
      ['tutorial-piece-selected', 'tutorial-piece-moved', 'tutorial-summon-clicked',
        'tutorial-summoned', 'tutorial-turn-ended', 'check'].forEach(ev =>
        this.gameScene.events.off(ev, undefined, this));
    }
  }
}
