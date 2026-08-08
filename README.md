# 3D PC Builder

설명 가능한 성능 예측과 실제 치수 기반 3D 물리 검증을 연결하는 프로젝트입니다.

**Phase 0 (vertical slice)** 앱이 구현되어 있습니다: 정적 SPA로 CPU/GPU 선택 → URL 동기화 → GPU GLB 스왑 → 성능 범위 표시. **Phase 1 (성능 엔진, `perf1`)** 이 연결되어 baseline lookup(96행), 환경 보정(apply/withhold), Cinebench workload lookup, PerformancePanel 통합이 동작합니다. 현재 모든 perf1 fixture 값은 `confidence: "stub"` wiring fixture이며 실측 데이터가 아닙니다. 스택은 [ADR-001](docs/decisions/ADR-001-runtime-static-spa.md)–[004](docs/decisions/ADR-004-license-code-apache-2.0.md) 기준입니다.

## 로컬 실행

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm build && pnpm preview
```

## 테스트

| 명령 | 내용 |
|------|------|
| `pnpm test` | Vitest — 스키마, 카탈로그, URL, vs0·perf1 룩업·보정 |
| `pnpm test:e2e` | Playwright **Test** headless — Phase 0 종료 시나리오 (build + `vite preview`) |
| `pnpm test:e2e:headed` | 동일, headed 브라우저 |
| `pnpm test:all` | unit + e2e (태그/`vertical-slice-v0` 전 권장) |
| `pnpm explore:phase0` | Playwright **CLI** 에이전트 탐색 (먼저 `pnpm dev`) — 회귀 아님 |
| Playwright **MCP** | 호스트에 `@playwright/mcp` 등록 — 채팅 에이전트 브라우징 |

첫 브라우저 바이너리: `pnpm exec playwright install chromium`

- E2E: [`e2e/exit-scenario.spec.ts`](e2e/exit-scenario.spec.ts) · [`playwright.config.ts`](playwright.config.ts)
- 에이전트 탐색: [`docs/verification/AGENT_BROWSER_EXPLORATION.md`](docs/verification/AGENT_BROWSER_EXPLORATION.md)

## 문서

- [프로젝트 헌장](PROJECT_CHARTER.md)
- [현재 상태](STATUS.md)
- [에이전트 규칙 (AGENTS.md)](AGENTS.md) ← Aria / Lira / Nox 공통 브리프
- [Phase 0 홈](docs/phases/phase-0/) ← TODO · plan · fixes · specs
- [Phase 1 홈](docs/phases/phase-1/) ← perf1 성능 엔진 (2026-08-08 closeout)
- [Phase 0 범위](docs/phases/phase-0/specs/phase-0.md) ← 범위·금지·종료 조건
- [Phase 0 데이터 계약 (`vs0`)](docs/phases/phase-0/specs/vertical-slice-data-contract.md)
- [구현 플랜](docs/phases/phase-0/implementation_plan.md)
- [개발 단계](docs/roadmap/PHASES.md)
- [의사결정 기록 안내](docs/decisions/README.md)
- [부품 데이터 안내](parts/README.md)
- [벤치마크 데이터 안내](benchmarks/README.md)

## 현재 원칙

- 완성형 생산 `part.json`이나 전체 벤치 파이프라인을 지금 설계하지 않는다.
- 0단계 최소 계약(`vs0`) 밖으로 필드를 미리 넓히지 않는다.
- FPS는 **범위 + confidence + basis**만; 없는 조합은 `unavailable` (숫자 발명 금지).
- 0단계 고정 범위 밖으로 부품·기능을 확장하지 않는다.
- 태그 `vertical-slice-v0`는 소유자가 `pnpm test:all` 통과 후 생성한다.
