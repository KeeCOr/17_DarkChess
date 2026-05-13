# Turn Rules Layout UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the in-game layout so turn rules, summoning, and visibility are understandable during play.

**Architecture:** Keep game logic in `GameScene` and presentation in `UIScene`. Use shared labels and helper functions from `src/ui/visuals.js`, add tests for the new copy/state helpers, and update package/docs/build artifacts.

**Tech Stack:** Phaser 3, Vite, Electron Builder, Vitest.

---

### Task 1: Copy and State Helpers

**Files:**
- Modify: `src/ui/visuals.js`
- Modify: `tests/VisualTheme.test.js`

- [ ] Add readable Korean labels for turn slots, board hints, and help popup text.
- [ ] Add pure helper `getTurnHint({ hasMoved, hasSummoned, mode })`.
- [ ] Test labels and hint outputs.

### Task 2: In-Game Layout and Feedback

**Files:**
- Modify: `src/scenes/UIScene.js`
- Modify: `src/scenes/GameScene.js`
- Modify: `src/scenes/TutorialScene.js`

- [ ] Rebuild HUD layout with top status, action slots, summon cards, help, end turn, and surrender.
- [ ] Emit UI mode events from `GameScene` for default, selected piece, summon mode, action complete, and cancelled summon.
- [ ] Add board hint text under the board and a help popup.
- [ ] Improve text contrast and summon/visibility highlights.

### Task 3: Version, Docs, Build

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `docs/ChessSummon_기획서.md`
- Modify: `docs/ChessSummon_기획서.html`

- [ ] Bump version to 0.1.2 and update artifact name.
- [ ] Update docs with the new turn-rule UX.
- [ ] Run `npm test`.
- [ ] Run `npm run dist`.
- [ ] Copy `release/ChessSummon_v0.1.2_portable.exe` to repo root and remove older root portable exe files.
