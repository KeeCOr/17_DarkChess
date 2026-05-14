import { describe, it, expect, beforeAll } from 'vitest';
import { Owner } from '../src/config.js';

beforeAll(() => {
  globalThis.Phaser = { Scene: class {} };
});

describe('GameScene manual turn ending', () => {
  it('allows ending the player turn while a piece is selected', async () => {
    const { GameScene } = await import('../src/scenes/GameScene.js');
    const scene = Object.create(GameScene.prototype);
    let ended = false;

    scene.state = 'SELECTED';
    scene.board = { currentTurn: Owner.PLAYER };
    scene.tutorialMode = false;
    scene.events = { emit: () => {} };
    scene._endTurn = () => { ended = true; };

    scene.endTurnManually();

    expect(ended).toBe(true);
  });

  it('cancels selected movement with a right-click', async () => {
    const { GameScene } = await import('../src/scenes/GameScene.js');
    const scene = Object.create(GameScene.prototype);
    let cleared = false;
    let movableShown = false;
    let threatsShown = false;
    let hintMode = null;

    scene.state = 'SELECTED';
    scene.selectedCell = { row: 4, col: 2 };
    scene.tutorialLocked = false;
    scene.animating = false;
    scene._clearHighlights = () => { cleared = true; };
    scene._showMovablePieces = () => { movableShown = true; };
    scene._showThreatsIfInCheck = () => { threatsShown = true; };
    scene._updateHint = mode => { hintMode = mode; };

    scene._onPointerDown({ rightButtonDown: () => true });

    expect(scene.state).toBe('WAITING');
    expect(scene.selectedCell).toBe(null);
    expect(cleared).toBe(true);
    expect(movableShown).toBe(true);
    expect(threatsShown).toBe(true);
    expect(hintMode).toBe('default');
  });
});
