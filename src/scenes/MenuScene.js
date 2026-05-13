// src/scenes/MenuScene.js
import { LAYOUT, Difficulty, TEXT_COLORS } from '../config.js';
import { addStageBackground, addTextButton, UI_COPY } from '../ui/visuals.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const cx = LAYOUT.GAME_WIDTH / 2;
    addStageBackground(this, UI_COPY.menu.title);

    this.add.text(cx, 148, '5x5 전술판 위에서 병사를 소환해 왕을 무너뜨리세요', {
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
      button.rect.on('pointerdown', () => {
        this.scene.start('Placement', { difficulty: value });
      });
    }
  }
}
