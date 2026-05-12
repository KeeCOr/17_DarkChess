// src/scenes/ResultScene.js
import { LAYOUT, COLORS, TEXT_COLORS, Owner } from '../config.js';

export class ResultScene extends Phaser.Scene {
  constructor() { super('Result'); }

  init(data) {
    this.winner = data.winner;
    this.difficulty = data.difficulty;
  }

  create() {
    const cx = LAYOUT.GAME_WIDTH / 2;
    this.add.rectangle(cx, LAYOUT.GAME_HEIGHT / 2, LAYOUT.GAME_WIDTH, LAYOUT.GAME_HEIGHT, COLORS.PANEL_BG);

    const msg = this.winner === Owner.PLAYER ? '승리!' : '패배...';
    const color = this.winner === Owner.PLAYER ? TEXT_COLORS.KING_PLAYER : TEXT_COLORS.AI_PIECE;
    this.add.text(cx, 180, msg, {
      fontSize: '64px', color, fontStyle: 'bold',
    }).setOrigin(0.5);

    const replayBtn = this.add.rectangle(cx, 320, 200, 52, COLORS.BUTTON_BG).setInteractive();
    this.add.text(cx, 320, '다시하기', { fontSize: '22px', color: TEXT_COLORS.PRIMARY }).setOrigin(0.5);
    replayBtn.on('pointerover', () => replayBtn.setFillStyle(COLORS.BUTTON_HOVER));
    replayBtn.on('pointerout', () => replayBtn.setFillStyle(COLORS.BUTTON_BG));
    replayBtn.on('pointerdown', () => {
      this.scene.start('Placement', { difficulty: this.difficulty });
    });

    const menuBtn = this.add.rectangle(cx, 390, 200, 52, COLORS.BUTTON_BG).setInteractive();
    this.add.text(cx, 390, '메인 메뉴', { fontSize: '22px', color: TEXT_COLORS.PRIMARY }).setOrigin(0.5);
    menuBtn.on('pointerover', () => menuBtn.setFillStyle(COLORS.BUTTON_HOVER));
    menuBtn.on('pointerout', () => menuBtn.setFillStyle(COLORS.BUTTON_BG));
    menuBtn.on('pointerdown', () => {
      this.scene.stop('UI');
      this.scene.start('Menu');
    });
  }

}
