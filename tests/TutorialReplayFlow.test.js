import { describe, it, expect, beforeAll } from 'vitest';
import { Difficulty } from '../src/config.js';
import { UI_COPY } from '../src/ui/visuals.js';

beforeAll(() => {
  globalThis.Phaser = { Scene: class {} };
});

describe('tutorial and replay flow', () => {
  it('keeps every tutorial copy step in the tutorial sequence', async () => {
    const { TUTORIAL_STEPS } = await import('../src/scenes/TutorialScene.js');
    const texts = TUTORIAL_STEPS.map(step => step.text);

    expect(texts).toContain(UI_COPY.tutorial.steps[4]);
  });

  it('builds click blockers around the highlighted tutorial target', async () => {
    const { buildTutorialMaskRects } = await import('../src/scenes/TutorialScene.js');
    const highlight = { x: 100, y: 120, w: 200, h: 160 };

    const rects = buildTutorialMaskRects(800, 600, highlight);

    expect(rects).toEqual([
      { x: 400, y: 60, w: 800, h: 120 },
      { x: 400, y: 440, w: 800, h: 320 },
      { x: 50, y: 200, w: 100, h: 160 },
      { x: 550, y: 200, w: 500, h: 160 },
    ]);
  });

  it('blocks clicks outside the highlighted tutorial target', async () => {
    const { TutorialScene } = await import('../src/scenes/TutorialScene.js');
    const scene = Object.create(TutorialScene.prototype);
    const rectangles = [];
    const makeRectangle = () => {
      const rect = {
        interactive: false,
        setDepth() { return this; },
        setAlpha() { return this; },
        setStrokeStyle() { return this; },
        setInteractive() { this.interactive = true; return this; },
        on() { return this; },
        setData() { return this; },
        destroy() {},
      };
      rectangles.push(rect);
      return rect;
    };
    const text = { setOrigin() { return this; }, setDepth() { return this; }, destroy() {} };
    const graphics = {
      setDepth() { return this; },
      lineStyle() { return this; },
      strokeRoundedRect() { return this; },
      fillStyle() { return this; },
      fillRoundedRect() { return this; },
      destroy() {},
    };

    scene.stepIndex = 0;
    scene._overlayObjs = [];
    scene.add = {
      rectangle: makeRectangle,
      graphics: () => graphics,
      text: () => text,
      circle: () => ({ setDepth() { return this; }, destroy() {} }),
    };
    scene.tweens = { add: () => {} };

    scene._showStep();

    expect(rectangles).toHaveLength(4);
    expect(rectangles.every(rect => rect.interactive)).toBe(true);
  });

  it('blocks the whole tutorial screen when there is only an info step', async () => {
    const { TutorialScene } = await import('../src/scenes/TutorialScene.js');
    const scene = Object.create(TutorialScene.prototype);
    const rectangles = [];
    const makeRectangle = () => {
      const rect = {
        interactive: false,
        setDepth() { return this; },
        setAlpha() { return this; },
        setStrokeStyle() { return this; },
        setInteractive() { this.interactive = true; return this; },
        on() { return this; },
        setData() { return this; },
        destroy() {},
      };
      rectangles.push(rect);
      return rect;
    };
    const text = { setOrigin() { return this; }, setDepth() { return this; }, destroy() {} };
    const graphics = {
      setDepth() { return this; },
      lineStyle() { return this; },
      strokeRoundedRect() { return this; },
      fillStyle() { return this; },
      fillRoundedRect() { return this; },
      destroy() {},
    };

    scene.stepIndex = 4;
    scene._overlayObjs = [];
    scene.add = {
      rectangle: makeRectangle,
      graphics: () => graphics,
      text: () => text,
      circle: () => ({ setDepth() { return this; }, destroy() {} }),
    };
    scene.tweens = { add: () => {} };

    scene._showStep();

    expect(rectangles[0].interactive).toBe(true);
  });

  it('marks replay placement as a direct retry without tutorial prompt', async () => {
    const { ResultScene } = await import('../src/scenes/ResultScene.js');
    const scene = Object.create(ResultScene.prototype);
    const starts = [];
    const stops = [];

    scene.difficulty = Difficulty.EASY;
    scene.scene = {
      stop: key => stops.push(key),
      start: (key, data) => starts.push({ key, data }),
    };

    scene._replay();

    expect(stops).toEqual(['UI', 'Tutorial', 'Game']);
    expect(starts).toEqual([
      { key: 'Placement', data: { difficulty: Difficulty.EASY, skipTutorialPrompt: true } },
    ]);
  });

  it('starts hard mode battle immediately with the edited pawn positions', async () => {
    const { PlacementScene } = await import('../src/scenes/PlacementScene.js');
    const scene = Object.create(PlacementScene.prototype);
    const starts = [];

    scene.difficulty = Difficulty.HARD;
    scene.pawnCount = 4;
    scene.placed = {
      '3,0': true,
      '3,1': true,
      '4,0': true,
      '4,4': true,
    };
    scene.scene = { start: (key, data) => starts.push({ key, data }) };
    scene.time = { delayedCall: () => { throw new Error('hard mode start should not depend on a delayed timer'); } };

    scene._startGame();

    expect(starts).toEqual([
      {
        key: 'Game',
        data: {
          difficulty: Difficulty.HARD,
          playerPlacements: [
            { row: 3, col: 0 },
            { row: 3, col: 1 },
            { row: 4, col: 0 },
            { row: 4, col: 4 },
          ],
        },
      },
    ]);
  });

  it('does not start hard mode battle before four pawns are placed', async () => {
    const { PlacementScene } = await import('../src/scenes/PlacementScene.js');
    const scene = Object.create(PlacementScene.prototype);
    const starts = [];

    scene.difficulty = Difficulty.HARD;
    scene.pawnCount = 3;
    scene.placed = {
      '3,0': true,
      '3,1': true,
      '4,0': true,
    };
    scene.scene = { start: (key, data) => starts.push({ key, data }) };
    scene.time = { delayedCall: () => { throw new Error('incomplete hard mode placement should not schedule start'); } };

    scene._startGame();

    expect(starts).toEqual([]);
  });
});
