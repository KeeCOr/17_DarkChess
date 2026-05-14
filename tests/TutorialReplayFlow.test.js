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

  it('lets tutorial overlay clicks pass through to highlighted game controls', async () => {
    const { TutorialScene } = await import('../src/scenes/TutorialScene.js');
    const scene = Object.create(TutorialScene.prototype);
    const overlay = {
      setDepth() { return this; },
      setInteractive() { this.interactive = true; return this; },
      destroy() {},
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
      rectangle: () => overlay,
      graphics: () => graphics,
      text: () => text,
      circle: () => ({ setDepth() { return this; }, destroy() {} }),
    };
    scene.tweens = { add: () => {} };

    scene._showStep();

    expect(overlay.interactive).not.toBe(true);
  });

  it('marks replay placement as a direct retry without tutorial prompt', async () => {
    const { ResultScene } = await import('../src/scenes/ResultScene.js');
    const scene = Object.create(ResultScene.prototype);
    const starts = [];

    scene.difficulty = Difficulty.EASY;
    scene.scene = { start: (key, data) => starts.push({ key, data }) };

    scene._replay();

    expect(starts).toEqual([
      { key: 'Placement', data: { difficulty: Difficulty.EASY, skipTutorialPrompt: true } },
    ]);
  });
});
