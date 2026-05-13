// src/scenes/TutorialScene.js
import { COLORS, LAYOUT, TEXT_COLORS } from '../config.js';
import { addPanel, addTextButton, UI_COPY } from '../ui/visuals.js';

const BOARD_X = LAYOUT.BOARD_OFFSET_X;
const BOARD_Y = LAYOUT.BOARD_OFFSET_Y;
const BOARD_W = 5 * LAYOUT.CELL_SIZE;
const BOARD_H = 5 * LAYOUT.CELL_SIZE;
const PANEL_X = LAYOUT.PANEL_X;

const HIGHLIGHT_RECTS = {
  board: { x: BOARD_X - 10, y: BOARD_Y - 10, w: BOARD_W + 20, h: BOARD_H + 20 },
  summonUI: { x: PANEL_X - 10, y: 278, w: 218, h: 216 },
  endBtn: { x: PANEL_X - 8, y: 524, w: 198, h: 42 },
};

const STEPS = [
  { text: UI_COPY.tutorial.steps[0], highlight: 'board', waitEvent: 'tutorial-piece-selected' },
  { text: UI_COPY.tutorial.steps[1], highlight: 'board', waitEvent: 'tutorial-piece-moved' },
  { text: UI_COPY.tutorial.steps[2], highlight: 'summonUI', waitEvent: 'tutorial-summon-clicked' },
  { text: UI_COPY.tutorial.steps[3], highlight: 'board', waitEvent: 'tutorial-summoned' },
  { text: UI_COPY.tutorial.steps[5], highlight: 'endBtn', waitEvent: 'tutorial-turn-ended' },
  { text: UI_COPY.tutorial.steps[6], highlight: null, waitEvent: null },
];

export class TutorialScene extends Phaser.Scene {
  constructor() { super({ key: 'Tutorial', active: false }); }

  create() {
    this.gameScene = this.scene.get('Game');
    this.stepIndex = 0;
    this._overlayObjs = [];

    this.gameScene.events.on('tutorial-piece-selected', () => this._tryAdvance('tutorial-piece-selected'), this);
    this.gameScene.events.on('tutorial-piece-moved', () => this._tryAdvance('tutorial-piece-moved'), this);
    this.gameScene.events.on('tutorial-summon-clicked', () => this._tryAdvance('tutorial-summon-clicked'), this);
    this.gameScene.events.on('tutorial-summoned', () => this._tryAdvance('tutorial-summoned'), this);
    this.gameScene.events.on('tutorial-turn-ended', () => this._tryAdvance('tutorial-turn-ended'), this);
    this.gameScene.events.on('check', (inCheck) => {
      if (inCheck && this.stepIndex < STEPS.length - 1)
        this._showHint(UI_COPY.tutorial.checkHint);
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
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.58).setDepth(20).setInteractive();
    this._overlayObjs.push(overlay);

    if (step.highlight) {
      const r = HIGHLIGHT_RECTS[step.highlight];
      const border = this.add.graphics().setDepth(21);
      border.lineStyle(4, COLORS.GOLD, 1);
      border.strokeRoundedRect(r.x, r.y, r.w, r.h, 8);
      border.lineStyle(10, COLORS.GOLD, 0.14);
      border.strokeRoundedRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4, 10);
      this.tweens.add({ targets: border, alpha: 0.42, duration: 620, yoyo: true, repeat: -1 });
      this._overlayObjs.push(border);
    }

    const boxY = step.highlight
      ? Math.min(HIGHLIGHT_RECTS[step.highlight].y + HIGHLIGHT_RECTS[step.highlight].h + 58, H - 86)
      : H / 2;
    const boxX = (step.highlight === 'summonUI' || step.highlight === 'endBtn')
      ? PANEL_X + 95
      : W / 2;

    const lines = step.text.split('\n').length;
    const boxH = 48 + lines * 25;
    const panel = addPanel(this, boxX - 152, boxY - boxH / 2, 304, boxH, { depth: 21 });
    const txt = this.add.text(boxX, boxY - 4, step.text, {
      fontSize: '16px', color: TEXT_COLORS.PRIMARY, align: 'center', lineSpacing: 7,
    }).setOrigin(0.5).setDepth(23);
    this._overlayObjs.push(panel, txt);

    const dotsY = boxY + boxH / 2 + 18;
    const total = STEPS.length - 1;
    const dotSpacing = 15;
    const startX = boxX - (total - 1) * dotSpacing / 2;
    for (let i = 0; i < total; i++) {
      const dot = this.add.circle(
        startX + i * dotSpacing, dotsY, 4,
        i < this.stepIndex ? COLORS.GOLD : (i === this.stepIndex ? 0xffffff : 0x566077),
      ).setDepth(23);
      this._overlayObjs.push(dot);
    }

    if (!step.waitEvent) {
      const confirm = addTextButton(this, boxX, boxY + boxH / 2 + 45, 112, 36, UI_COPY.tutorial.confirm, { active: true, depth: 23 });
      this._overlayObjs.push(confirm.rect, confirm.text);
      confirm.rect.on('pointerdown', () => this._finish());
    }
  }

  _showHint(text) {
    const hintBg = addPanel(this, LAYOUT.GAME_WIDTH / 2 - 190, 14, 380, 36, { depth: 30, stroke: COLORS.CRIMSON });
    const hint = this.add.text(LAYOUT.GAME_WIDTH / 2, 32, text, {
      fontSize: '15px', color: TEXT_COLORS.TIMER, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(31);
    this.time.delayedCall(3000, () => { hintBg.destroy(); hint.destroy(); });
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
