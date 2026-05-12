// src/scenes/MenuScene.js
import { LAYOUT, COLORS, Difficulty } from '../config.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const cx = LAYOUT.GAME_WIDTH / 2;
    this.add.rectangle(cx, LAYOUT.GAME_HEIGHT / 2, LAYOUT.GAME_WIDTH, LAYOUT.GAME_HEIGHT, COLORS.PANEL_BG);

    this.add.text(cx, 120, 'Chess Summon', {
      fontSize: '48px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 200, '난이도를 선택하세요', {
      fontSize: '24px', color: '#aaaaaa',
    }).setOrigin(0.5);

    const difficulties = [
      { label: '쉬움', value: Difficulty.EASY, y: 300 },
      { label: '보통', value: Difficulty.MEDIUM, y: 380 },
      { label: '어려움', value: Difficulty.HARD, y: 460 },
    ];

    for (const { label, value, y } of difficulties) {
      const btn = this.add.rectangle(cx, y, 200, 50, COLORS.BUTTON_BG).setInteractive();
      this.add.text(cx, y, label, { fontSize: '22px', color: '#ffffff' }).setOrigin(0.5);
      btn.on('pointerover', () => btn.setFillStyle(COLORS.BUTTON_HOVER));
      btn.on('pointerout', () => btn.setFillStyle(COLORS.BUTTON_BG));
      btn.on('pointerdown', () => {
        this.scene.start('Placement', { difficulty: value });
      });
    }
  }

}
