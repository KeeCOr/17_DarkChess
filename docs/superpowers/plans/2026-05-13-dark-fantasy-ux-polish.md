# Dark Fantasy UX Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish Chess Summon's layout, art presentation, and UX feedback into a cohesive dark fantasy tactics interface.

**Architecture:** Add focused presentation helpers in `src/ui/visuals.js`, expand the shared color/config palette, and update each Phaser scene to use common backgrounds, buttons, panels, and labels. Keep game state and rules unchanged.

**Tech Stack:** Phaser 3, Vite, Electron Builder, Vitest.

---

### Task 1: Shared Visual Language

**Files:**
- Modify: `src/config.js`
- Create: `src/ui/visuals.js`

- [ ] Add theme colors, layout constants, Korean labels, and reusable Phaser drawing helpers for backgrounds, panels, buttons, dividers, and board frames.
- [ ] Keep helpers stateless so scenes remain responsible for behavior.
- [ ] Run `npm test` to ensure config exports do not break game logic tests.

### Task 2: Menu, Placement, Tutorial, Result Screens

**Files:**
- Modify: `src/scenes/MenuScene.js`
- Modify: `src/scenes/PlacementScene.js`
- Modify: `src/scenes/TutorialScene.js`
- Modify: `src/scenes/ResultScene.js`

- [ ] Replace plain backgrounds with the dark fantasy stage treatment.
- [ ] Restore readable Korean labels.
- [ ] Improve button hover/press feedback and modal hierarchy.
- [ ] Preserve scene transitions and tutorial events.

### Task 3: Board, Fog, HUD, and In-Game Feedback

**Files:**
- Modify: `src/scenes/GameScene.js`
- Modify: `src/scenes/UIScene.js`

- [ ] Add board frame, coordinate labels, softer fog, and clearer selected/move/summon highlights.
- [ ] Make piece art more legible with shadows and stronger display sizing.
- [ ] Rework the HUD into scannable sections with clear summon button states.
- [ ] Improve turn banner, check indicator, surrender confirmation, and disabled action feedback.

### Task 4: Docs, Version, Build

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `docs/ChessSummon_기획서.md`
- Modify: `docs/ChessSummon_기획서.html`

- [ ] Bump patch version.
- [ ] Update the planning docs to describe the dark fantasy UX polish.
- [ ] Run `npm test`.
- [ ] Run `npm run dist`.
- [ ] Copy `release/ChessSummon_v{version}_portable.exe` to the repo root and remove older root portable executables.
