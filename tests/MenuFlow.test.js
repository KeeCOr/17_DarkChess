import { describe, it, expect, beforeAll } from 'vitest';
import { Difficulty } from '../src/config.js';

beforeAll(() => {
  globalThis.Phaser = { Scene: class {} };
});

function makeMenuScene() {
  const rectangles = [];
  const starts = [];

  const makeRect = () => {
    const data = {};
    const handlers = {};
    const rect = {
      data,
      handlers,
      setInteractive() { this.interactive = true; return this; },
      setAlpha(value) { this.alpha = value; return this; },
      setDepth(value) { this.depth = value; return this; },
      setStrokeStyle() { return this; },
      setFillStyle(value) { this.fill = value; return this; },
      setData(key, value) { data[key] = value; return this; },
      getData(key) { return data[key]; },
      on(event, handler) { handlers[event] = handler; return this; },
      destroy() {},
    };
    rectangles.push(rect);
    return rect;
  };

  const text = {
    setOrigin() { return this; },
    setDepth() { return this; },
    setColor() { return this; },
    setAlpha() { return this; },
    destroy() {},
  };
  const graphics = {
    lineStyle() { return this; },
    strokeRect() { return this; },
    strokeCircle() { return this; },
    beginPath() { return this; },
    moveTo() { return this; },
    lineTo() { return this; },
    closePath() { return this; },
    strokePath() { return this; },
    destroy() {},
  };

  return {
    rectangles,
    starts,
    scene: {
      add: {
        rectangle: makeRect,
        text: () => text,
        graphics: () => graphics,
      },
      children: { removeAll() {} },
      tweens: { add() {} },
      scene: { start: (key, data) => starts.push({ key, data }) },
    },
  };
}

describe('menu flow', () => {
  it('lets the enlarged difficulty hit area start placement', async () => {
    const { MenuScene } = await import('../src/scenes/MenuScene.js');
    const { scene, rectangles, starts } = makeMenuScene();
    Object.setPrototypeOf(scene, MenuScene.prototype);

    scene._showDifficultySelect();
    const hardHitArea = rectangles.find(rect => rect.getData('difficultyHitArea') === Difficulty.HARD);

    expect(hardHitArea).toBeDefined();
    hardHitArea.handlers.pointerdown();
    expect(starts).toEqual([
      { key: 'Placement', data: { difficulty: Difficulty.HARD } },
    ]);
  });
});
