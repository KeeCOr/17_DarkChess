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
});
