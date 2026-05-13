// src/scenes/UIScene.js
import {
  COLORS, LAYOUT, Owner, PieceType, SUMMON_COSTS, TEXT_COLORS,
} from '../config.js';
import {
  addDivider, addPanel, addSectionLabel, addTextButton, getPieceName,
  setButtonState, UI_COPY,
} from '../ui/visuals.js';

const SUMMONABLE = [PieceType.PAWN, PieceType.KNIGHT, PieceType.BISHOP, PieceType.ROOK, PieceType.QUEEN];
const PANEL_X = LAYOUT.PANEL_X;

export class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UI', active: false }); }

  create() {
    this.gameScene = this.scene.get('Game');

    addPanel(this, PANEL_X - 18, 22, 244, 556, { strokeAlpha: 0.55 });

    this.turnText = this.add.text(PANEL_X, 42, UI_COPY.game.playerTurn, {
      fontSize: '24px', color: TEXT_COLORS.PRIMARY, fontStyle: 'bold',
    });
    this.timerText = this.add.text(PANEL_X, 76, String(60), {
      fontSize: '34px', color: TEXT_COLORS.TIMER, fontStyle: 'bold',
    });

    addDivider(this, PANEL_X, 124, 188);
    addSectionLabel(this, PANEL_X, 140, UI_COPY.game.mana);
    this.manaText = this.add.text(PANEL_X, 160, '0 / 10', {
      fontSize: '22px', color: TEXT_COLORS.MANA, fontStyle: 'bold',
    });

    addSectionLabel(this, PANEL_X, 198, UI_COPY.game.action);
    this.moveStatus = this._addStatusChip(PANEL_X, 222, UI_COPY.game.moveReady, false);
    this.summonStatus = this._addStatusChip(PANEL_X + 100, 222, UI_COPY.game.summonReady, false);

    addDivider(this, PANEL_X, 255, 188);
    addSectionLabel(this, PANEL_X, 270, UI_COPY.game.summon);
    this.summonButtons = {};
    SUMMONABLE.forEach((type, i) => {
      const y = 306 + i * 43;
      const button = addTextButton(this, PANEL_X + 94, y, 188, 35, '', { enabled: false, fontSize: '15px' });
      const icon = this.add.image(PANEL_X + 24, y, `${type.toLowerCase()}_w`).setDisplaySize(28, 28).setAlpha(0.3).setDepth(2);
      const name = this.add.text(PANEL_X + 48, y, getPieceName(type), {
        fontSize: '14px', color: TEXT_COLORS.PRIMARY, fontStyle: 'bold',
      }).setOrigin(0, 0.5).setAlpha(0.5).setDepth(2);
      const cost = this.add.text(PANEL_X + 166, y, String(SUMMON_COSTS[type]), {
        fontSize: '17px', color: TEXT_COLORS.DIM, fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(0.5).setDepth(2);

      button.rect.on('pointerdown', () => {
        if (!button.rect.getData('enabled')) return;
        this.gameScene.startSummonMode(type);
        this._highlightActiveSummon(button.rect.getData('active') ? null : type);
      });
      this.summonButtons[type] = { ...button, icon, name, cost };
    });

    this.checkText = this.add.text(PANEL_X, 503, UI_COPY.game.check, {
      fontSize: '20px', color: TEXT_COLORS.DANGER, fontStyle: 'bold',
    }).setVisible(false);

    this.endButton = addTextButton(this, PANEL_X + 94, 540, 188, 38, UI_COPY.game.endTurn, { danger: true });
    this.endButton.rect.on('pointerdown', () => this.gameScene.endTurnManually());

    this.surrenderButton = addTextButton(this, PANEL_X + 94, 584, 188, 28, UI_COPY.game.surrender, { enabled: true, fontSize: '13px' });
    this.surrenderButton.rect.setFillStyle(0x171a22);
    this.surrenderButton.text.setColor(TEXT_COLORS.MUTED);
    this.surrenderButton.rect.on('pointerdown', () => this._showSurrenderConfirm());

    this.gameScene.events.on('turn-start', this._onTurnStart, this);
    this.gameScene.events.on('timer-tick', this._onTimerTick, this);
    this.gameScene.events.on('check', this._onCheck, this);
    this.gameScene.events.on('player-action', this._onPlayerAction, this);
    this.gameScene.events.on('summon-cancel', this._onSummonCancel, this);
  }

  _addStatusChip(x, y, label, done) {
    const bg = this.add.rectangle(x + 42, y, 84, 24, done ? COLORS.EMERALD : COLORS.BUTTON_DISABLED).setAlpha(done ? 0.95 : 0.65);
    bg.setStrokeStyle(1, done ? 0x7df0a8 : 0x30384f, 0.8);
    const text = this.add.text(x + 42, y, label, {
      fontSize: '12px', color: done ? TEXT_COLORS.PRIMARY : TEXT_COLORS.DIM, fontStyle: 'bold',
    }).setOrigin(0.5);
    return { bg, text };
  }

  _showSurrenderConfirm() {
    const cx = LAYOUT.GAME_WIDTH / 2, cy = LAYOUT.GAME_HEIGHT / 2;
    const overlay = this.add.rectangle(cx, cy, LAYOUT.GAME_WIDTH, LAYOUT.GAME_HEIGHT, 0x000000, 0.62).setDepth(50).setInteractive();
    const panel = addPanel(this, cx - 160, cy - 78, 320, 156, { depth: 51, stroke: COLORS.CRIMSON });
    const msg = this.add.text(cx, cy - 34, UI_COPY.game.confirmSurrender, {
      fontSize: '18px', color: TEXT_COLORS.PRIMARY, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(52);

    const yes = addTextButton(this, cx - 70, cy + 34, 112, 38, UI_COPY.game.surrender, { danger: true, depth: 52 });
    const no = addTextButton(this, cx + 70, cy + 34, 112, 38, UI_COPY.game.cancel, { depth: 52 });

    const objs = [overlay, panel, msg, yes.rect, yes.text, no.rect, no.text];
    const close = () => objs.forEach(o => o.destroy());
    yes.rect.on('pointerdown', () => { close(); this.gameScene.surrender(); });
    no.rect.on('pointerdown', close);
    overlay.on('pointerdown', close);
  }

  _onTurnStart({ turn, mana, timeLeft, summonCounts }) {
    const playerTurn = turn === Owner.PLAYER;
    this.turnText.setText(playerTurn ? UI_COPY.game.playerTurn : UI_COPY.game.aiTurn);
    this.turnText.setColor(playerTurn ? TEXT_COLORS.SUCCESS : TEXT_COLORS.DANGER);
    this.timerText.setText(String(timeLeft));
    this.timerText.setColor(TEXT_COLORS.TIMER);
    this.manaText.setText(`${mana[Owner.PLAYER]} / 10`);
    this.checkText.setVisible(false);
    this._updateActionStatus(false, false);
    this._refreshSummonButtons(
      playerTurn ? mana[Owner.PLAYER] : -1,
      false,
      summonCounts || {},
    );
  }

  _onCheck(inCheck) {
    this.checkText.setVisible(inCheck);
    if (inCheck) {
      this.tweens.add({
        targets: this.checkText,
        scaleX: 1.22, scaleY: 1.22,
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
    this._setStatusChip(this.moveStatus, hasMoved ? UI_COPY.game.moveDone : UI_COPY.game.moveReady, hasMoved);
    this._setStatusChip(this.summonStatus, hasSummoned ? UI_COPY.game.summonDone : UI_COPY.game.summonReady, hasSummoned);
  }

  _setStatusChip(chip, label, done) {
    chip.bg.setFillStyle(done ? COLORS.EMERALD : COLORS.BUTTON_DISABLED);
    chip.bg.setAlpha(done ? 0.95 : 0.65);
    chip.text.setText(label);
    chip.text.setColor(done ? TEXT_COLORS.PRIMARY : TEXT_COLORS.DIM);
  }

  _refreshSummonButtons(playerMana, hasSummoned, summonCounts) {
    for (const [type, entry] of Object.entries(this.summonButtons)) {
      const count = summonCounts?.[type] || 0;
      const cost = (SUMMON_COSTS[type] || 1) + count;
      const enabled = !hasSummoned && playerMana >= cost;
      setButtonState(entry, { enabled, active: false });
      entry.rect.setData('active', false);
      entry.cost.setText(String(cost));
      entry.cost.setColor(enabled ? TEXT_COLORS.PRIMARY : TEXT_COLORS.DIM);
      entry.cost.setAlpha(enabled ? 1 : 0.5);
      entry.icon.setAlpha(enabled ? 0.92 : 0.3);
      entry.name.setAlpha(enabled ? 1 : 0.5);
      entry.name.setColor(enabled ? TEXT_COLORS.PRIMARY : TEXT_COLORS.DIM);
    }
  }

  _highlightActiveSummon(activeType) {
    for (const [type, entry] of Object.entries(this.summonButtons)) {
      const isActive = type === activeType;
      entry.rect.setData('active', isActive);
      if (entry.rect.getData('enabled')) {
        setButtonState(entry, { enabled: true, active: isActive });
        entry.cost.setColor(isActive ? '#1a1208' : TEXT_COLORS.PRIMARY);
        entry.name.setColor(isActive ? '#1a1208' : TEXT_COLORS.PRIMARY);
        entry.icon.setAlpha(1);
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
