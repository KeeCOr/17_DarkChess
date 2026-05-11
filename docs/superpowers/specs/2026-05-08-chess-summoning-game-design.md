# Chess Summoning Game — Design Spec
Date: 2026-05-08

## Overview

5x5 체스 보드 위에서 킹과 폰으로 시작해 마나를 모아 체스말을 소환하는 전략 게임.
웹(Phaser.js)으로 먼저 출시하고, 이후 모바일(Capacitor)과 스팀(Electron)으로 이식.

---

## Platform & Tech Stack

- **엔진:** Phaser.js (웹 브라우저)
- **언어:** JavaScript (ES2020+)
- **향후 이식:** Capacitor(모바일), Electron(스팀)

---

## Architecture

```
src/
├── main.js                  # Phaser 게임 초기화 및 씬 등록
├── config.js                # 마나 비용, 말 스탯 등 전역 상수
├── scenes/
│   ├── BootScene.js         # 에셋 프리로드
│   ├── MenuScene.js         # 메인 메뉴 + 난이도 선택
│   ├── PlacementScene.js    # 게임 시작 전 폰 배치 페이즈
│   ├── GameScene.js         # 핵심 게임 로직 + 보드 렌더링
│   ├── UIScene.js           # HUD 오버레이 (마나, 소환 패널, 타이머)
│   └── ResultScene.js       # 게임 결과 (승/패 + 재도전)
└── game/
    ├── Board.js             # 5x5 보드 상태 관리
    ├── Piece.js             # 말 클래스 (타입, 소유자, 이동 규칙)
    ├── MoveCalculator.js    # 이동 가능 영역 계산
    ├── SummonSystem.js      # 소환 로직 (마나 소비, 왕 인접 검증)
    ├── CheckDetector.js     # 체크/체크메이트 감지, 위협 말 추적
    └── AIController.js      # 난이도별 AI
```

**GameScene + UIScene 분리:** 보드 렌더링과 HUD를 별도 씬으로 운영해 입력 처리와 UI 업데이트를 독립적으로 관리.

---

## Scene Flow

```
MenuScene (난이도 선택: 쉬움 / 보통 / 어려움)
    ↓
PlacementScene (하단 2행에 폰 4개 자유 배치 → 준비 완료 버튼)
    ↓
GameScene + UIScene (본게임, 60초 타임 클락)
    ↓
ResultScene (승/패 + 재도전 / 메뉴로)
```

---

## Game Rules

### Board & Initial State

- 보드: 5x5
- 플레이어: 하단, AI: 상단
- 킹 위치: 플레이어 하단 중앙(3열), AI 상단 중앙(3열)
- 폰 4개: PlacementScene에서 플레이어가 하단 2행 내 자유 배치
- AI 폰 4개: 2행(위에서 두 번째 줄)에 자동 배치

### Turn Rules

- 턴당 **이동 OR 소환 택1** (중복 불가)
- 한 턴에 말 하나만 이동, 소환도 하나만 가능
- 턴 제한 시간: **60초** (초과 시 턴 자동 종료)

### Mana System

- 매 턴 시작 시 +2 마나 자동 충전
- 최대 마나: 10 (초과분 소멸)
- 소환 비용:

| 말 | 마나 비용 |
|---|---|
| 폰 (Pawn) | 1 |
| 나이트 (Knight) | 3 |
| 비숍 (Bishop) | 3 |
| 룩 (Rook) | 5 |
| 퀸 (Queen) | 8 |

### Summon Rules

- 소환 위치: 킹 기준 인접 8칸 중 빈 칸만 허용
- 소환한 턴에는 해당 말 이동 불가
- 킹은 소환 불가 (시작 말)

### Check & Endgame

- 체크 상태: 위협 말에 빨간 테두리 표시
- 체크메이트 또는 킹이 잡히면 게임 종료
- 승패 결과를 ResultScene에서 표시

---

## UI / UX

### GameScene 인터랙션

- 말 클릭 → 이동 가능 칸 **파란색** 하이라이트
- 체크 상태 → 위협 말 **빨간 테두리** 강조
- 소환 버튼 클릭 → 킹 인접 빈 칸 **초록색** 하이라이트
- AI 턴 중 플레이어 입력 잠금

### UIScene HUD

- 좌측: 현재 마나 / 최대 마나 (예: 4 / 10)
- 우측: 소환 가능 말 목록 + 마나 비용 (마나 부족 시 회색 비활성화)
- 상단 또는 중앙: 60초 카운트다운 타이머
- 하단: 현재 턴 표시 (내 턴 / AI 턴)

---

## AI System

### 난이도별 동작

| 난이도 | 이동 전략 | 소환 전략 |
|---|---|---|
| 쉬움 | 랜덤 이동 | 마나 모이면 랜덤 소환 |
| 보통 | 잡을 수 있으면 잡기, 킹 보호 우선 | 마나 효율 고려 (폰·나이트 위주) |
| 어려움 | Minimax + 알파베타 가지치기 (탐색 깊이 3) | 상황에 따라 강한 말 소환, 체크 적극 시도 |

### 어려움 난이도 평가 함수

- 말 가치 합산 (폰1 / 나이트3 / 비숍3 / 룩5 / 퀸8)
- 킹 위협 여부 보너스 점수
- 보드 중앙(3x3) 장악도 가산점

5x5 보드 특성상 Minimax 깊이 3으로도 충분한 성능 보장.

---

## Out of Scope (MVP)

- 멀티플레이어 (추후 구현)
- 모바일/스팀 빌드 (웹 MVP 완성 후)
- 캐스링, 앙파상 등 표준 체스 특수 규칙
- 세이브/로드
- 사운드 효과 및 애니메이션 (기본 렌더링 우선)
