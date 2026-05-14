// src/scenes/ResultScene.js
import { LAYOUT, TEXT_COLORS, Owner } from '../config.js';
import { addStageBackground, addTextButton, UI_COPY } from '../ui/visuals.js';

export class ResultScene extends Phaser.Scene {
  constructor() { super('Result'); }

  init(data) {
    this.winner = data.winner;
    this.difficulty = data.difficulty;
  }

  create() {
    const cx = LAYOUT.GAME_WIDTH / 2;
    const playerWon = this.winner === Owner.PLAYER;
    addStageBackground(this, playerWon ? UI_COPY.result.win : UI_COPY.result.lose);

    this.add.text(cx, 165, playerWon ? '왕좌를 지켜냈습니다' : '왕좌를 빼앗겼습니다', {
      fontSize: '18px',
      color: playerWon ? TEXT_COLORS.SUCCESS : TEXT_COLORS.DANGER,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const replay = addTextButton(this, cx, 320, 220, 54, UI_COPY.result.replay);
    replay.rect.on('pointerdown', () => this._replay());

    const menu = addTextButton(this, cx, 390, 220, 54, UI_COPY.result.menu);
    menu.rect.on('pointerdown', () => {
      this.scene.stop('UI');
      this.scene.start('Menu');
    });
  }

  _replay() {
    this.scene.start('Placement', { difficulty: this.difficulty, skipTutorialPrompt: true });
  }
}
