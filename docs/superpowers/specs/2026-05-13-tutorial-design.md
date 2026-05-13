# Tutorial System Design
**Date:** 2026-05-13
**Project:** ChessSummon v0.1.0

---

## Overview

쉬움 난이도 선택 시 선택적으로 진입하는 인게임 튜토리얼. GameScene 위에 TutorialScene을 병렬 실행해 특정 UI 요소를 하이라이트하고 6단계 미션을 통해 플레이어를 안내한다.

---

## Trigger Flow

```
MenuScene → 쉬움 선택 → PlacementScene
  PlacementScene 자동 배치 완료 후
  → "튜토리얼을 볼까요?" 팝업 (예 / 아니오)
  → 예: GameScene.start({ difficulty, playerPlacements, tutorialMode: true })
  → GameScene.create() 에서 tutorialMode===true 이면
    this.scene.launch('Tutorial')
```

---

## Architecture

### 씬 구성
- **TutorialScene**: GameScene 위 오버레이 씬. 단계 상태 머신, 그래픽, 이벤트 수신 담당.
- **GameScene**: 기존 로직 유지. `tutorialMode`, `tutorialLocked` 플래그 추가, 관련 이벤트 emit 5곳 추가.

### GameScene 변경 사항
```
this.tutorialMode   : boolean  — init(data)에서 수신
this.tutorialLocked : boolean  — TutorialScene이 제어
```

잠금 적용 위치 (각 메서드 진입부):
- `_onCellClick` — 셀 선택/이동 차단
- `startSummonMode` — 소환 버튼 차단
- `endTurnManually` — 턴 종료 차단

emit 추가 위치:
- 폰 선택 완료 시 → `'tutorial-piece-selected'`
- 이동 완료 시 → `'tutorial-piece-moved'`
- 소환 버튼 클릭 시 → `'tutorial-summon-clicked'`
- 소환 완료 시 → `'tutorial-summoned'`
- 턴 종료 시 → `'tutorial-turn-ended'`

### TutorialScene
- `this.scene.get('Game').events` 로 이벤트 구독
- 현재 단계의 `waitEvent` 수신 시 다음 단계로 진행
- `gameScene.tutorialLocked` 를 true/false로 제어
- 씬 종료(`shutdown`) 시 모든 이벤트 구독 해제

---

## Tutorial Steps

```js
const STEPS = [
  {
    id: 'select-pawn',
    text: '폰을 클릭해보세요',
    highlight: 'board',
    waitEvent: 'tutorial-piece-selected',
  },
  {
    id: 'move-pawn',
    text: '이동할 칸을 선택하세요',
    highlight: 'board',
    waitEvent: 'tutorial-piece-moved',
  },
  {
    id: 'summon-btn',
    text: '마나 +2가 쌓였어요! 오른쪽 소환 버튼을 눌러보세요',
    highlight: 'summonUI',
    waitEvent: 'tutorial-summon-clicked',
  },
  {
    id: 'summon-place',
    text: '왕 주변 빈 칸을 클릭해 소환하세요',
    highlight: 'board',
    waitEvent: 'tutorial-summoned',
  },
  {
    id: 'end-turn',
    text: '턴 종료 버튼을 눌러 AI에게 턴을 넘기세요',
    highlight: 'endBtn',
    waitEvent: 'tutorial-turn-ended',
  },
  {
    id: 'done',
    text: '튜토리얼 완료! 이제 자유롭게 플레이하세요',
    highlight: null,
    waitEvent: null,
  },
];
```

마지막 단계(done)는 "확인" 버튼 클릭 시 TutorialScene 종료, `gameScene.tutorialLocked = false`.

---

## Contextual Hints (미션 외 자동 팝업)

tutorialMode가 활성화된 상태에서 아래 이벤트 발생 시 TutorialScene이 힌트 팝업을 3초간 표시:

| 이벤트 | 힌트 텍스트 |
|--------|-------------|
| `check` | "체크! 왕이 위협받고 있어요. 이동으로 위협을 피하세요." |
| `pawn-promoted` | "폰이 끝줄에 도달해 퀸으로 승급됐습니다!" |

---

## Visual Design

### 오버레이 레이어 (depth 20)
- 전체 화면 반투명 검정 (alpha 0.55)
- 하이라이트 대상 영역만 알파 0으로 뚫어서 밝게 표시 (Phaser Graphics mask)

### 말풍선 텍스트박스 (depth 21)
- 위치: 하이라이트 영역 바로 아래 또는 위 (영역에 따라 자동 결정)
- 배경: 어두운 패널 (#1a1a2e), 테두리: 주황 (#ffaa00)
- 텍스트: 흰색, 18px
- 진행 점 표시: `● ● ○ ○ ○ ○` (현재 단계 기준)

### 화살표
- 하이라이트 영역의 경계에서 텍스트박스를 향해 작은 삼각형 화살표

### 잠금 중 비활성 영역
- 하이라이트 외 영역 클릭 시 아무 반응 없음 (`tutorialLocked` 플래그로 처리)

---

## Highlight Targets

| highlight 값 | 대상 영역 좌표 |
|--------------|---------------|
| `'board'` | LAYOUT.BOARD_OFFSET_X/Y 기준 5×5 보드 전체 |
| `'summonUI'` | UIScene 소환 버튼 패널 (x≈510, y≈210, w≈190, h≈260) |
| `'endBtn'` | 턴 종료 버튼 (x≈510, y≈522, w≈190, h≈36) |
| `null` | 오버레이 없음, 텍스트박스만 중앙 표시 |

---

## Files Changed

| 파일 | 변경 유형 |
|------|-----------|
| `src/scenes/TutorialScene.js` | 신규 |
| `src/scenes/PlacementScene.js` | 수정 — 쉬움 선택 시 튜토리얼 팝업 추가 |
| `src/scenes/GameScene.js` | 수정 — 플래그, 잠금 체크, 이벤트 emit |
| `src/main.js` | 수정 — TutorialScene 씬 등록 |

---

## Out of Scope

- 튜토리얼 진행 상태 저장 (로컬 스토리지) — 미구현, 매번 쉬움 시작 시 물어봄
- 보통/어려움 난이도에서의 튜토리얼
- 튜토리얼 중 AI 행동 제한 (AI는 정상 진행)
