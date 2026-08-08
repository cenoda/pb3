# 현재 상태

## 확정됨

- 프로젝트 철학과 성공 기준
- 개발 단계의 순서
- 성능 엔진의 기준 성능/환경 보정 경계
- 0단계 수직 슬라이스의 범위와 종료 조건
- 부품의 기본 파일 구성: `part.json` + `model.glb`
- 모델 좌표계와 단위: mm, Y-up
- **Phase 0 홈**: [`docs/phases/phase-0/`](docs/phases/phase-0/)
- **Phase 0 범위**: [`docs/phases/phase-0/specs/phase-0.md`](docs/phases/phase-0/specs/phase-0.md)
- **Phase 0 데이터 계약 (`vs0`)**: [`docs/phases/phase-0/specs/vertical-slice-data-contract.md`](docs/phases/phase-0/specs/vertical-slice-data-contract.md)
- **URL 규칙 (수락)**
  - 인코더: `BuildState` **모든** 필드를 항상 기록 (정규 공유 링크)
  - 디코더: 누락 키는 기본 fixture로 복구 (부분 링크는 호환 입력만)
- **게임/프리셋**: Phase 0 상수 (`game.cyberpunk-2077`, `preset.raster-ultra`) — 별도 정의 파일 없음
- **Fixture 배치 완료** (2026-08-08)
  - `part.json` × 7 + placeholder `model.glb` × 7
  - `benchmarks/vs0/performance-fixtures.json` (12행, 전부 `confidence: "stub"`)
  - `benchmarks/vs0/performance-unavailable.examples.json` (unavailable 테스트 전용, 12행 테이블과 분리)

## Fixture 무결성 검증 (일회 실행, PASS)

| 검사 | 결과 |
|------|------|
| 7개 part fixture 존재, id/category/path 일치 | PASS |
| 모든 `modelGlbPath` → 실제 GLB, `glTF` v2 헤더 유효 | PASS |
| default `BuildState`의 part ID → 실제 fixture | PASS |
| default game/preset 상수 존재 | PASS |
| 성능 12행 = 2×2×3, 중복·누락 없음 | PASS |
| 모든 성능 행 `confidence: "stub"`, fpsMin &lt; fpsMax | PASS |
| 성능 행 cpu/gpu ID → part fixture | PASS |
| unavailable 예시 쿼리가 본 테이블에 없음, fps null | PASS |
| GPU 플레이스홀더: rtx4070 짧고 파랑 / rtx4080 길고 주황 (시각 구분) | PASS |

## 에이전트 문서

- 공통 브리프: [`AGENTS.md`](AGENTS.md) (모든 하네스)
- Claude 진입점: [`CLAUDE.md`](CLAUDE.md) → `AGENTS.md` 포인터 + 하드 게이트
- Grok 프로젝트 규칙: [`.grok/rules/pb3-phase-0.md`](.grok/rules/pb3-phase-0.md)

## 도구 / 운영 (스택과 무관)

- **IDE:** WebStorm + Cursor 사용 예정
- **Git push:** 소유자가 직접 진행 (에이전트는 요청/허용 시에만 커밋)
- **기술 결정 순서:** [`docs/decisions/TECH-DECISION-ORDER.md`](docs/decisions/TECH-DECISION-ORDER.md)

## 아직 정하지 않음

- **1단계:** 앱 런타임 형태 (**공식 락 전**), 배포 호스트
- **2단계:** 언어 (**미정**), UI + 3D (동시 결정), 빌드 도구
- **3단계:** 패키지 매니저, 스키마/상태/테스트, fixture HTTP 경로
- 오픈소스 라이선스 (코드 / 데이터 / 3D 에셋 분리 논의; 의존성 설치 전 코드 라이선스 권장)
- 실측 벤치마크 원시 스키마 (제품 1단계)
- 완성형 생산용 `part.json` 필드

## 다음 작업

1. **Stage 1:** 런타임 형태 (± 배포 호스트) 논의·락
2. Stage 2→3 스택 코어·부수 도구 (언어는 아직 미정)
3. 명시적 구현 시작 승인 후 스캐폴드 → 종료 시나리오 → 태그 `vertical-slice-v0`
