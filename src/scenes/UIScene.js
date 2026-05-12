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

    this.timerText = this.add.text(PANEL_X, 58, '60', {
      fontSize: '30px', color: TEXT_COLORS.TIMER, fontStyle: 'bold',
    });

    this.add.text(PANEL_X, 100, 'MANA', { fontSize: '13px', color: TEXT_COLORS.MUTED });
    this.manaText = this.add.text(PANEL_X, 118, '0 / 10', {
      fontSize: '20px', color: TEXT_COLORS.MANA,
    });

    // Action status
    this.add.text(PANEL_X, 150, '행동 현황', { fontSize: '12px', color: TEXT_COLORS.MUTED });
    this.moveStatus = this.add.text(PANEL_X, 167, '○ 이동', { fontSize: '14px', color: '#555555' });
    this.summonStatus = this.add.text(PANEL_X + 95, 167, '○ 소환', { fontSize: '14px', color: '#555555' });

    this.add.text(PANEL_X, 193, '소환 (클릭 후 칸 선택)', { fontSize: '12px', color: TEXT_COLORS.MUTED });
    this.summonButtons = {};
    SUMMONABLE.forEach((type, i) => {
      const y = 225 + i * 52;
      const btn = this.add.rectangle(PANEL_X + 90, y, 190, 44, 0x1a1a2e).setInteractive().setAlpha(0.45);
      const label = `${PIECE_LABELS[type]}  (${SUMMON_COSTS[type]} 마나)`;
      const txt = this.add.text(PANEL_X + 90, y, label, {
        fontSize: '16px', color: '#444466',
      }).setOrigin(0.5).setAlpha(0.5);
      btn.on('pointerover', () => { if (btn.getData('enabled') && !btn.getData('active')) btn.setFillStyle(COLORS.BUTTON_HOVER); });
      btn.on('pointerout', () => { if (btn.getData('enabled') && !btn.getData('active')) btn.setFillStyle(COLORS.BUTTON_BG); });
      btn.on('pointerdown', () => {
        if (!btn.getData('enabled') && !btn.getData('active')) return;
        this.gameScene.startSummonMode(type);
        this._highlightActiveSummon(btn.getData('active') ? null : type);
      });
      this.summonButtons[type] = { btn, txt };
    });

    this.checkText = this.add.text(PANEL_X, 497, '⚠ 체크!', {
      fontSize: '20px', color: '#ff4444', fontStyle: 'bold',
    }).setVisible(false);

    const endBtn = this.add.rectangle(PANEL_X + 90, 540, 190, 36, 0x553333).setInteractive();
    this.endBtnText = this.add.text(PANEL_X + 90, 540, '턴 종료', {
      fontSize: '16px', color: TEXT_COLORS.PRIMARY,
    }).setOrigin(0.5);
    endBtn.on('pointerover', () => endBtn.setFillStyle(0x884444));
    endBtn.on('pointerout', () => endBtn.setFillStyle(0x553333));
    endBtn.on('pointerdown', () => this.gameScene.endTurnManually());
    this.endBtn = endBtn;

    const surrenderBtn = this.add.rectangle(PANEL_X + 90, 580, 190, 36, 0x333333).setInteractive();
    this.add.text(PANEL_X + 90, 580, '기권', {
      fontSize: '15px', color: '#aaaaaa',
    }).setOrigin(0.5);
    surrenderBtn.on('pointerover', () => surrenderBtn.setFillStyle(0x555555));
    surrenderBtn.on('pointerout', () => surrenderBtn.setFillStyle(0x333333));
    surrenderBtn.on('pointerdown', () => this.gameScene.surrender());

    this.gameScene.events.on('turn-start', this._onTurnStart, this);
    this.gameScene.events.on('timer-tick', this._onTimerTick, this);
    this.gameScene.events.on('check', this._onCheck, this);
    this.gameScene.events.on('player-action', this._onPlayerAction, this);
    this.gameScene.events.on('summon-cancel', this._onSummonCancel, this);
  }

  _onTurnStart({ turn, mana, timeLeft, summonCounts }) {
    this.turnText.setText(turn === Owner.PLAYER ? '내 턴' : 'AI 턴');
    this.timerText.setText(String(timeLeft));
    this.timerText.setColor(TEXT_COLORS.TIMER);
    this.manaText.setText(`${mana[Owner.PLAYER]} / 10`);
    this.checkText.setVisible(false);
    this._updateActionStatus(false, false);
    this._refreshSummonButtons(
      turn === Owner.PLAYER ? mana[Owner.PLAYER] : -1,
      false,
      summonCounts || {},
    );
  }

  _onCheck(inCheck) {
    this.checkText.setVisible(inCheck);
    if (inCheck) {
      this.tweens.add({
        targets: this.checkText,
        scaleX: 1.3, scaleY: 1.3,
        duration: 120, yoyo: true, repeat: 2,
      });
    }
  }

  _onPlayerAction({ hasMoved, hasSummoned, mana, summonCounts }) {
    this._refreshSummonButtons(mana, hasSummoned, summonCounts || {});
    this._updateActionStatus(hasMoved, hasSummoned);
    this.manaText.setText(`${mana} / 10`);
    this._highlightActiveSummon(null);
  }

  _onSummonCancel() {
    this._highlightActiveSummon(null);
  }

  _onTimerTick(timeLeft) {
    this.timerText.setText(String(timeLeft));
    this.timerText.setColor(timeLeft <= 10 ? TEXT_COLORS.TIMER_LOW : TEXT_COLORS.TIMER);
  }

  _updateActionStatus(hasMoved, hasSummoned) {
    this.moveStatus.setText(hasMoved ? '✓ 이동' : '○ 이동');
    this.moveStatus.setColor(hasMoved ? '#00ff88' : '#555555');
    this.summonStatus.setText(hasSummoned ? '✓ 소환' : '○ 소환');
    this.summonStatus.setColor(hasSummoned ? '#00ff88' : '#555555');
  }

  _refreshSummonButtons(playerMana, hasSummoned, summonCounts) {
    for (const [type, { btn, txt }] of Object.entries(this.summonButtons)) {
      const count = summonCounts?.[type] || 0;
      const cost = (SUMMON_COSTS[type] || 1) + count;
      const enabled = !hasSummoned && playerMana >= cost;
      btn.setData('enabled', enabled);
      btn.setFillStyle(enabled ? COLORS.BUTTON_BG : 0x1a1a2e);
      btn.setAlpha(enabled ? 1 : 0.45);
      txt.setText(`${PIECE_LABELS[type]}  (${cost} 마나)`);
      txt.setColor(enabled ? TEXT_COLORS.PRIMARY : '#444466');
      txt.setAlpha(enabled ? 1 : 0.5);
    }
  }

  _highlightActiveSummon(activeType) {
    for (const [type, { btn, txt }] of Object.entries(this.summonButtons)) {
      const isActive = type === activeType;
      btn.setData('active', isActive);
      if (btn.getData('enabled')) {
        btn.setFillStyle(isActive ? 0xffaa00 : COLORS.BUTTON_BG);
        btn.setAlpha(1);
        txt.setColor(isActive ? '#1a1a2e' : TEXT_COLORS.PRIMARY);
      }
    }
  }

  shutdown() {
    if (this.gameScene) {
      this.gameScene.events.off('turn-start', this._onTurnStart, this);
      this.gameScene.events.off('timer-tick', this._onTimerTick, this);
      this.gameScene.events.off('check', this._onCheck, this);
      this.gameScene.events.off('player-action', this._onPlayerAction, this);
      this.gameScene.events.off('summon-cancel', this._onSummonCancel, this);
    }
  }
}
