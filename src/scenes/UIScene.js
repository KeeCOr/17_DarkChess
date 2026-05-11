// src/scenes/UIScene.js
import {
  COLORS, LAYOUT, Owner, PieceType, SUMMON_COSTS, PIECE_LABELS, TEXT_COLORS,
} from '../config.js';

const SUMMONABLE = [PieceType.PAWN, PieceType.KNIGHT, PieceType.BISHOP, PieceType.ROOK, PieceType.QUEEN];
const PANEL_X = 510;

export class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UI', active: false }); }

  create() {
    this.gameScene = this.scene.get('Game');

    this.add.rectangle(PANEL_X + 115, LAYOUT.GAME_HEIGHT / 2, 240, LAYOUT.GAME_HEIGHT, COLORS.PANEL_BG);

    this.turnText = this.add.text(PANEL_X, 30, '내 턴', {
      fontSize: '20px', color: TEXT_COLORS.PRIMARY,
    });

    this.timerText = this.add.text(PANEL_X, 60, '60', {
      fontSize: '32px', color: TEXT_COLORS.TIMER, fontStyle: 'bold',
    });

    this.add.text(PANEL_X, 110, 'MANA', { fontSize: '14px', color: TEXT_COLORS.MUTED });
    this.manaText = this.add.text(PANEL_X, 130, '0 / 10', {
      fontSize: '22px', color: TEXT_COLORS.MANA,
    });

    this.add.text(PANEL_X, 180, '소환 (클릭 후 칸 선택)', { fontSize: '13px', color: TEXT_COLORS.MUTED });
    this.summonButtons = {};
    SUMMONABLE.forEach((type, i) => {
      const y = 215 + i * 52;
      const btn = this.add.rectangle(PANEL_X + 90, y, 190, 44, COLORS.BUTTON_BG).setInteractive();
      const label = `${PIECE_LABELS[type]}  (${SUMMON_COSTS[type]} 마나)`;
      const txt = this.add.text(PANEL_X + 90, y, label, {
        fontSize: '17px', color: TEXT_COLORS.PRIMARY,
      }).setOrigin(0.5);
      btn.on('pointerover', () => btn.setFillStyle(COLORS.BUTTON_HOVER));
      btn.on('pointerout', () => btn.setFillStyle(COLORS.BUTTON_BG));
      btn.on('pointerdown', () => this.gameScene.startSummonMode(type));
      this.summonButtons[type] = { btn, txt };
    });

    this.checkText = this.add.text(PANEL_X, 490, '⚠ 체크!', {
      fontSize: '20px', color: '#ff4444', fontStyle: 'bold',
    }).setVisible(false);

    const endBtn = this.add.rectangle(PANEL_X + 90, 545, 190, 40, 0x553333).setInteractive();
    this.endBtnText = this.add.text(PANEL_X + 90, 545, '턴 종료', {
      fontSize: '17px', color: TEXT_COLORS.PRIMARY,
    }).setOrigin(0.5);
    endBtn.on('pointerover', () => endBtn.setFillStyle(0x884444));
    endBtn.on('pointerout', () => endBtn.setFillStyle(0x553333));
    endBtn.on('pointerdown', () => this.gameScene.endTurnManually());
    this.endBtn = endBtn;

    this.gameScene.events.on('turn-start', this._onTurnStart, this);
    this.gameScene.events.on('timer-tick', this._onTimerTick, this);
    this.gameScene.events.on('check', this._onCheck, this);
    this.gameScene.events.on('player-action', this._onPlayerAction, this);
  }

  _onTurnStart({ turn, mana, timeLeft }) {
    this.turnText.setText(turn === Owner.PLAYER ? '내 턴' : 'AI 턴');
    this.timerText.setText(String(timeLeft));
    this.timerText.setColor(TEXT_COLORS.TIMER);
    this.manaText.setText(`${mana[Owner.PLAYER]} / 10`);
    this.checkText.setVisible(false);
    this._refreshSummonButtons(mana[Owner.PLAYER], false);
  }

  _onCheck(inCheck) {
    this.checkText.setVisible(inCheck);
  }

  _onPlayerAction({ hasSummoned, mana }) {
    this._refreshSummonButtons(mana, hasSummoned);
  }

  _onTimerTick(timeLeft) {
    this.timerText.setText(String(timeLeft));
    this.timerText.setColor(timeLeft <= 10 ? TEXT_COLORS.TIMER_LOW : TEXT_COLORS.TIMER);
  }

  _refreshSummonButtons(playerMana, hasSummoned) {
    for (const [type, { btn, txt }] of Object.entries(this.summonButtons)) {
      const enabled = !hasSummoned && playerMana >= SUMMON_COSTS[type];
      btn.setFillStyle(enabled ? COLORS.BUTTON_BG : 0x333333);
      txt.setColor(enabled ? TEXT_COLORS.PRIMARY : TEXT_COLORS.MUTED);
    }
  }

  shutdown() {
    if (this.gameScene) {
      this.gameScene.events.off('turn-start', this._onTurnStart, this);
      this.gameScene.events.off('timer-tick', this._onTimerTick, this);
      this.gameScene.events.off('check', this._onCheck, this);
      this.gameScene.events.off('player-action', this._onPlayerAction, this);
    }
  }
}
