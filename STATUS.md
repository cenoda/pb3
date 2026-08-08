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

- **IDE:** WebStorm + Cursor + Zed 사용. 공통 포맷/들여쓰기는 루트 `.editorconfig`. Zed는 `.zed/settings.json` + `.zed/tasks.json`, Cursor는 `.vscode/settings.json` + `.vscode/extensions.json`(추천 확장) + `.cursor/rules/pb3-phase-0.mdc`(AGENTS.md 게이트 상시 로드) — 전부 git 추적. WebStorm `.idea/`는 로컬 전용(gitignore), 패키지 매니저는 pnpm으로 설정
- **Git push:** 소유자가 직접 진행 (에이전트는 요청/허용 시에만 커밋)
- **기술 결정 순서:** [`docs/decisions/TECH-DECISION-ORDER.md`](docs/decisions/TECH-DECISION-ORDER.md)
- **공개 사이트:** 지금은 **불가/비범위** — Phase 0 검증은 **로컬**만 가정
- **이후 배포 방향:** **GCP 또는 Azure** (정적 산출물). 벤더 락인 없는 portable `dist/` 유지. 세부 상품·IaC는 나중

## 런타임 (ADR-001)

- **결정:** 정적 SPA
- **문서:** [`docs/decisions/ADR-001-runtime-static-spa.md`](docs/decisions/ADR-001-runtime-static-spa.md)
- **유효 범위:** 헌장 0~3단계 스코프 (백엔드·인증·서버 측 실측 성능 모델 없음)
- **재검토:** 실측 벤치 수집, 계정, 서버 중개 공유 등 **서버 컴퓨트**가 제품 요구가 되면 ADR 개정/대체 (보통 SPA + API로 확장)

## 스택 코어 (ADR-002)

- **결정:** **TypeScript + React + R3F + Vite**
- **문서:** [`docs/decisions/ADR-002-stack-core-ts-react-r3f-vite.md`](docs/decisions/ADR-002-stack-core-ts-react-r3f-vite.md)
- **아님:** 구현 시작 승인 아님. 폐기 스캐폴드 `1d54c10` 자동 부활 아님

## Stage 3 도구 (ADR-003)

- **패키지 매니저:** pnpm
- **스키마 / 상태 / 테스트:** Zod / Zustand / Vitest
- **fixture:** 디스크 SSOT = 루트 `parts/`, `benchmarks/` · HTTP = `/parts`, `/benchmarks` · Vite dev 서빙 + build 시 `dist/` 복사
- **문서:** [`docs/decisions/ADR-003-stage3-tooling-and-fixtures.md`](docs/decisions/ADR-003-stage3-tooling-and-fixtures.md)

## 라이선스 (ADR-004)

- **코드 + 데이터(`parts/`, `benchmarks/`):** Apache License 2.0 (루트 `LICENSE` 파일)
- **3D 에셋 (`model.glb`):** 아직 미정 — 실제 하드웨어 모델 쓰기 전에 별도 결정 필요 (제조사 트레이드마크/디자인권 이슈)
- **문서:** [`docs/decisions/ADR-004-license-code-apache-2.0.md`](docs/decisions/ADR-004-license-code-apache-2.0.md)

## 아직 정하지 않음

- 3D 에셋 라이선스 (실제 하드웨어 모델 사용 전 결정)
- 배포 호스트 세부 (의도적 미룸; 이후 GCP/Azure)
- GCP vs Azure 구체 상품
- 실측 벤치마크 원시 스키마 (제품 1단계)
- 완성형 생산용 `part.json` 필드
- UI 컴포넌트 라이브러리 / CSS 접근 (스캐폴드 시 최소로)

## 다음 작업

1. **명시적 구현 시작** → 스캐폴드 (ADR-001–003) → 로컬 종료 시나리오 → 태그 `vertical-slice-v0`
