# ChessSummon 작업 규칙

## 빌드 및 실행파일 배치

지시사항 수행 완료 후 반드시 아래 순서로 실행한다.

### 빌드 명령어

```bash
cd C:/Development/17_DC && npm run dist
```

`npm run dist` = `vite build && electron-builder --win --x64` (한 번에 처리)

### 실행파일 배치
- 빌드 출력: `C:/Development/17_DC/release/ChessSummon_v{버전}_portable.exe`
- 루트에도 동일하게 배치: `C:/Development/17_DC/ChessSummon_v{버전}_portable.exe`
- 이전 버전 루트 파일은 삭제

### 버전 관리
- `C:/Development/17_DC/package.json`의 `version` 패치 버전 증가 후 빌드

## 기획서 최신화

기능 추가/변경 후 반드시 업데이트:
- `docs/ChessSummon_기획서.md`
- `docs/ChessSummon_기획서.html`
