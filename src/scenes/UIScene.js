// src/scenes/UIScene.js
import {
  COLORS, LAYOUT, Owner, PieceType, SUMMON_COSTS, SUMMON_REPEAT_COST_INCREASE, TEXT_COLORS,
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

    addPanel(this, LAYOUT.HUD_PANEL_X, LAYOUT.HUD_PANEL_Y, LAYOUT.HUD_PANEL_WIDTH, LAYOUT.HUD_PANEL_HEIGHT, { strokeAlpha: 0.68, alpha: 0.98 });

    this.turnText = this.add.text(PANEL_X, 34, UI_COPY.game.playerTurn, {
      fontSize: '23px', color: TEXT_COLORS.SUCCESS, fontStyle: 'bold',
    });
    this.timerText = this.add.text(PANEL_X, 66, '60', {
      fontSize: '30px', color: TEXT_COLORS.TIMER, fontStyle: 'bold',
    });

    const help = addTextButton(this, PANEL_X + 198, 42, 28, 28, UI_COPY.game.help, { fontSize: '16px', active: true });
    help.rect.on('pointerdown', () => this._showHelp());

    addDivider(this, PANEL_X, 108, 188);
    addSectionLabel(this, PANEL_X, 122, UI_COPY.game.action);
    this.moveSlot = this._addActionSlot(PANEL_X, 152, UI_COPY.game.moveSlot);
    this.summonSlot = this._addActionSlot(PANEL_X + 98, 152, UI_COPY.game.summonSlot);

    this.ruleText = this.add.text(PANEL_X, 188, UI_COPY.game.turnRule, {
      fontSize: '13px', color: '#ffffff', fontStyle: 'bold',
    });
    this.ruleSubText = this.add.text(PANEL_X, 206, UI_COPY.game.turnRuleSub, {
      fontSize: '11px', color: TEXT_COLORS.MUTED,
    });

    addDivider(this, PANEL_X, 230, 188);
    addSectionLabel(this, PANEL_X, LAYOUT.HUD_SUMMON_LABEL_Y, UI_COPY.game.summon);
    this.summonHint = this.add.text(PANEL_X, 262, UI_COPY.game.summonHint, {
      fontSize: '10px', color: '#6fffe0', fontStyle: 'bold',
      wordWrap: { width: 100 },
    }).setOrigin(0, 0);
    this.manaBadge = this.add.rectangle(PANEL_X + 154, LAYOUT.HUD_MANA_Y, 88, 24, COLORS.BUTTON_DISABLED)
      .setAlpha(0.86);
    this.manaBadge.setStrokeStyle(1, COLORS.PANEL_EDGE, 0.45);
    this._addManaIcon(PANEL_X + 124, LAYOUT.HUD_MANA_Y, 0.88);
    this.manaText = this.add.text(PANEL_X + 138, LAYOUT.HUD_MANA_Y, '0/10', {
      fontSize: '15px', color: TEXT_COLORS.MANA, fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    this.summonButtons = {};
    SUMMONABLE.forEach((type, i) => {
      const y = LAYOUT.HUD_SUMMON_START_Y + i * LAYOUT.HUD_SUMMON_ROW_GAP;
      const button = addTextButton(this, PANEL_X + 100, y, 200, LAYOUT.HUD_SUMMON_ROW_HEIGHT, '', { enabled: false, fontSize: '14px' });
      const icon = this.add.image(PANEL_X + 22, y, `${type.toLowerCase()}_w`).setDisplaySize(32, 32).setAlpha(0.3).setDepth(2);
      const name = this.add.text(PANEL_X + 48, y - 7, getPieceName(type), {
        fontSize: '13px', color: TEXT_COLORS.PRIMARY, fontStyle: 'bold',
      }).setOrigin(0, 0.5).setAlpha(0.5).setDepth(2);
      const manaIcon = this._addManaIcon(PANEL_X + 50, y + 9, 0.72, 2);
      manaIcon.setAlpha(0.45);
      const cost = this.add.text(PANEL_X + 60, y + 9, String(SUMMON_COSTS[type]), {
        fontSize: '11px', color: TEXT_COLORS.DIM, fontStyle: 'bold',
      }).setOrigin(0, 0.5).setAlpha(0.5).setDepth(2);

      button.rect.on('pointerdown', () => {
        if (!button.rect.getData('enabled')) return;
        this.gameScene.startSummonMode(type);
        this._highlightActiveSummon(button.rect.getData('active') ? null : type);
      });
      this.summonButtons[type] = { ...button, icon, manaIcon, name, cost };
    });

    this.checkText = this.add.text(PANEL_X, 494, UI_COPY.game.check, {
      fontSize: '19px', color: TEXT_COLORS.DANGER, fontStyle: 'bold',
    }).setVisible(false);

    this.endButton = addTextButton(this, PANEL_X + 58, LAYOUT.HUD_FOOTER_Y, 112, 36, UI_COPY.game.endTurn, { danger: true, fontSize: '15px' });
    this.endButton.rect.on('pointerdown', () => this.gameScene.endTurnManually());

    this.surrenderButton = addTextButton(this, PANEL_X + 154, LAYOUT.HUD_FOOTER_Y, 72, 36, UI_COPY.game.surrender, { fontSize: '13px' });
    this.surrenderButton.rect.setFillStyle(0x171a22);
    this.surrenderButton.text.setColor(TEXT_COLORS.MUTED);
    this.surrenderButton.rect.on('pointerdown', () => this._showSurrenderConfirm());

    this.gameScene.events.on('turn-start', this._onTurnStart, this);
    this.gameScene.events.on('timer-tick', this._onTimerTick, this);
    this.gameScene.events.on('check', this._onCheck, this);
    this.gameScene.events.on('player-action', this._onPlayerAction, this);
    this.gameScene.events.on('summon-cancel', this._onSummonCancel, this);
    this.gameScene.events.on('summon-mode', this._onSummonMode, this);
  }

  _addActionSlot(x, y, label) {
    const bg = this.add.rectangle(x + 43, y, 88, 50, COLORS.BUTTON_BG).setAlpha(0.95);
    bg.setStrokeStyle(2, COLORS.PANEL_EDGE, 0.55);
    const labelText = this.add.text(x + 43, y - 10, label, {
      fontSize: '12px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    const stateText = this.add.text(x + 43, y + 10, UI_COPY.game.moveReady, {
      fontSize: '13px', color: '#6fffe0', fontStyle: 'bold',
    }).setOrigin(0.5);
    return { bg, labelText, stateText };
  }

  _addManaIcon(x, y, scale = 1, depth = 2) {
    const g = this.add.graphics().setDepth(depth);
    const w = 7 * scale;
    const h = 9 * scale;
    g.fillStyle(0x37d9ff, 1);
    g.beginPath();
    g.moveTo(x, y - h);
    g.lineTo(x + w, y);
    g.lineTo(x, y + h);
    g.lineTo(x - w, y);
    g.closePath();
    g.fillPath();
    g.lineStyle(Math.max(1, 1.5 * scale), 0xd8fbff, 0.9);
    g.strokePath();
    return g;
  }

  _showHelp() {
    const cx = LAYOUT.GAME_WIDTH / 2, cy = LAYOUT.GAME_HEIGHT / 2;
    const overlay = this.add.rectangle(cx, cy, LAYOUT.GAME_WIDTH, LAYOUT.GAME_HEIGHT, 0x000000, 0.66).setDepth(60).setInteractive();
    const panel = addPanel(this, cx - 235, cy - 150, 470, 300, { depth: 61, stroke: COLORS.GOLD });
    const title = this.add.text(cx, cy - 118, UI_COPY.help.title, {
      fontSize: '24px', color: TEXT_COLORS.GOLD, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(62);

    const lines = UI_COPY.help.lines.map(line => `- ${line}`).join('\n');
    const body = this.add.text(cx - 200, cy - 76, lines, {
      fontSize: '15px', color: '#ffffff', lineSpacing: 9,
      wordWrap: { width: 400 },
    }).setDepth(62);

    const ok = addTextButton(this, cx, cy + 112, 120, 38, UI_COPY.help.close, { active: true, depth: 62 });
    const objs = [overlay, panel, title, body, ok.rect, ok.text];
    const close = () => objs.forEach(o => o.destroy());
    ok.rect.on('pointerdown', close);
    overlay.on('pointerdown', close);
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
    this.manaText.setText(`${mana[Owner.PLAYER]}/10`);
    this.checkText.setVisible(false);
    this._updateActionStatus(false, false);
    this._refreshSummonButtons(playerTurn ? mana[Owner.PLAYER] : -1, false, summonCounts || {});
  }

  _onCheck(inCheck) {
    this.checkText.setVisible(inCheck);
    if (inCheck) {
      this.tweens.add({
        targets: this.checkText,
        scaleX: 1.18, scaleY: 1.18,
        duration: 120, yoyo: true, repeat: 2,
      });
    }
  }

  _onPlayerAction({ hasMoved, hasSummoned, mana, summonCounts }) {
    this._refreshSummonButtons(mana, hasSummoned, summonCounts || {});
    this._updateActionStatus(hasMoved, hasSummoned);
    this.manaText.setText(`${mana}/10`);
    this._highlightActiveSummon(null);
  }

  _onSummonCancel() {
    this._highlightActiveSummon(null);
  }

  _onSummonMode({ pieceType }) {
    this._highlightActiveSummon(pieceType);
  }

  _onTimerTick(timeLeft) {
    this.timerText.setText(String(timeLeft));
    this.timerText.setColor(timeLeft <= 10 ? TEXT_COLORS.TIMER_LOW : TEXT_COLORS.TIMER);
  }

  _updateActionStatus(hasMoved, hasSummoned) {
    this._setActionSlot(this.moveSlot, hasMoved);
    this._setActionSlot(this.summonSlot, hasSummoned);
  }

  _setActionSlot(slot, done) {
    slot.bg.setFillStyle(done ? COLORS.EMERALD : COLORS.BUTTON_BG);
    slot.bg.setAlpha(done ? 1 : 0.95);
    slot.stateText.setText(done ? UI_COPY.game.moveDone : UI_COPY.game.moveReady);
    slot.stateText.setColor(done ? '#ffffff' : '#6fffe0');
  }

  _refreshSummonButtons(playerMana, hasSummoned, summonCounts) {
    for (const [type, entry] of Object.entries(this.summonButtons)) {
      const count = summonCounts?.[type] || 0;
      const cost = (SUMMON_COSTS[type] || 1) + count * SUMMON_REPEAT_COST_INCREASE;
      const enabled = !hasSummoned && playerMana >= cost;
      setButtonState(entry, { enabled, active: false });
      entry.rect.setData('active', false);
      entry.cost.setText(String(cost));
      entry.cost.setColor(enabled ? '#dceeff' : TEXT_COLORS.DIM);
      entry.cost.setAlpha(enabled ? 1 : 0.6);
      entry.manaIcon.setAlpha(enabled ? 1 : 0.42);
      entry.icon.setAlpha(enabled ? 0.96 : 0.34);
      entry.name.setAlpha(enabled ? 1 : 0.58);
      entry.name.setColor(enabled ? TEXT_COLORS.PRIMARY : TEXT_COLORS.DIM);
    }
  }

  _highlightActiveSummon(activeType) {
    for (const [type, entry] of Object.entries(this.summonButtons)) {
      const isActive = type === activeType;
      entry.rect.setData('active', isActive);
      if (entry.rect.getData('enabled')) {
        setButtonState(entry, { enabled: true, active: isActive });
        entry.cost.setColor(isActive ? '#1a1208' : '#dceeff');
        entry.manaIcon.setAlpha(1);
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
      this.gameScene.events.off('summon-mode', this._onSummonMode, this);
    }
  }
}
