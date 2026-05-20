// src/scenes/MenuScene.js
import { LAYOUT, Difficulty, TEXT_COLORS } from '../config.js';
import { addStageBackground, addTextButton, UI_COPY } from '../ui/visuals.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    this.mode = 'mode';
    this.buttons = [];
    this._showModeSelect();
  }

  _clearMenu() {
    this.children.removeAll(true);
    this.buttons = [];
  }

  _showModeSelect() {
    this._clearMenu();
    const cx = LAYOUT.GAME_WIDTH / 2;
    addStageBackground(this, UI_COPY.menu.title);

    this.add.text(cx, 148, '5x5 전술판 위에서 병사를 소환해 왕을 무너뜨리세요', {
      fontSize: '16px',
      color: TEXT_COLORS.MUTED,
    }).setOrigin(0.5);

    this.add.text(cx, 220, UI_COPY.menu.modeTitle, {
      fontSize: '22px',
      color: TEXT_COLORS.GOLD,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const single = addTextButton(this, cx, 315, 240, 56, UI_COPY.menu.single, { fontSize: '21px', active: true });
    single.rect.on('pointerdown', () => this._showDifficultySelect());

    const multi = addTextButton(this, cx, 395, 240, 56, UI_COPY.menu.multiplayer, { fontSize: '21px' });
    multi.rect.on('pointerdown', () => this.scene.start('MultiplayerLobby'));
  }

  _showDifficultySelect() {
    this._clearMenu();
    const cx = LAYOUT.GAME_WIDTH / 2;
    addStageBackground(this, UI_COPY.menu.title);

    this.add.text(cx, 148, UI_COPY.menu.single, {
      fontSize: '16px',
      color: TEXT_COLORS.MUTED,
    }).setOrigin(0.5);

    this.add.text(cx, 215, UI_COPY.menu.subtitle, {
      fontSize: '22px',
      color: TEXT_COLORS.GOLD,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const difficulties = [
      { value: Difficulty.EASY, y: 300 },
      { value: Difficulty.MEDIUM, y: 380 },
      { value: Difficulty.HARD, y: 460 },
    ];

    for (const { value, y } of difficulties) {
      const label = UI_COPY.menu.difficulties[value];
      const hint = UI_COPY.menu.difficultyHints[value];
      const button = addTextButton(this, cx, y, 230, 54, label, { fontSize: '21px' });
      this.add.text(cx, y + 36, hint, {
        fontSize: '12px',
        color: TEXT_COLORS.MUTED,
      }).setOrigin(0.5);
      this._wireDifficultyOption(button, cx, y, value);
    }

    const back = addTextButton(this, cx, 535, 150, 40, UI_COPY.menu.back, { fontSize: '15px' });
    back.rect.on('pointerdown', () => this._showModeSelect());
  }

  _wireDifficultyOption(button, x, y, value) {
    const startPlacement = () => this.scene.start('Placement', { difficulty: value });
    button.rect.on('pointerdown', startPlacement);

    const hitArea = this.add.rectangle(x, y + 18, 270, 76, 0x000000)
      .setAlpha(0.001)
      .setDepth(5)
      .setInteractive({ useHandCursor: true })
      .setData('difficultyHitArea', value);

    hitArea.on('pointerover', () => button.rect.setFillStyle(0x394779));
    hitArea.on('pointerout', () => button.rect.setFillStyle(0x263155));
    hitArea.on('pointerdown', startPlacement);
  }
}
