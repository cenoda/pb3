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
- **Phase 1 홈**: [`docs/phases/phase-1/`](docs/phases/phase-1/)
- **Phase 1 스코프 락 + 데이터 계약 + fixture**: 소유자 수락 완료 (2026-08-08) — [`phase-1.md`](docs/phases/phase-1/specs/phase-1.md) / [`performance-data-contract.md`](docs/phases/phase-1/specs/performance-data-contract.md) / [`benchmarks/perf1/`](benchmarks/perf1/)
- **Phase 1 성능 엔진 (`perf1`)**: 구현·검증·문서 동기화 완료 (2026-08-08) — `38b76d1` + closeout docs; 모든 fixture 값은 `confidence: "stub"` (실측 아님)
- **Phase 3 M0 계획 패키지**: 스코프·`phys3` 계약·구현 계획 및 5개
  결정안 소유자 수락 완료 (2026-08-08) — synthetic `Experimental` GLB,
  Apache-2.0, box OBB + `0.1 mm` epsilon, 새 의존성 없음, runtime cooling
  `unavailable`, cooler normal/180°
- **Phase 3 (`phys3`)**: 구현·검증·owner closeout 완료 (2026-08-08) —
  `acd038b` + closeout docs/keepsake; geometry data version
  `phys3-exp-20260808`
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
- **E2E (Amendment 2026-08-08):** Playwright Test headless Chromium — `pnpm test:e2e`, `e2e/exit-scenario.spec.ts`
- **Agent explore (optional):** Playwright CLI (`pnpm explore:phase0`) + Playwright MCP example — [`docs/verification/AGENT_BROWSER_EXPLORATION.md`](docs/verification/AGENT_BROWSER_EXPLORATION.md)
- **fixture:** 디스크 SSOT = 루트 `parts/`, `benchmarks/` · HTTP = `/parts`, `/benchmarks` · Vite dev 서빙 + build 시 `dist/` 복사
- **문서:** [`docs/decisions/ADR-003-stage3-tooling-and-fixtures.md`](docs/decisions/ADR-003-stage3-tooling-and-fixtures.md)

## 라이선스 (ADR-004)

- **코드 + 데이터(`parts/`, `benchmarks/`):** Apache License 2.0 (루트 `LICENSE` 파일)
- **3D 에셋 (`model.glb`):** 아직 미정 — 실제 하드웨어 모델 쓰기 전에 별도 결정 필요 (제조사 트레이드마크/디자인권 이슈)
- **문서:** [`docs/decisions/ADR-004-license-code-apache-2.0.md`](docs/decisions/ADR-004-license-code-apache-2.0.md)

## 아직 정하지 않음

- 제3자/제조사 파생 실제 하드웨어 3D 에셋의 출처별 권리·라이선스
  (프로젝트 직접 작성 synthetic fixture GLB는 Apache-2.0으로 결정됨)
- 배포 호스트 세부 (의도적 미룸; 이후 GCP/Azure)
- GCP vs Azure 구체 상품
- 실측 벤치마크 원시 스키마 (제품 1단계)
- 완성형 생산용 `part.json` 필드
- UI 컴포넌트 라이브러리 / CSS 접근 (스캐폴드 시 최소로)

## 다음 작업

1. ~~**명시적 구현 시작** → 스캐폴드 (ADR-001–003) → 로컬 종료 시나리오~~ → **구현 완료 (2026-08-08)**
2. ~~Playwright headless E2E (Step 8 자동화)~~ → **추가 완료 (2026-08-08)**
3. ~~**태그 `vertical-slice-v0`** — 소유자가 `pnpm test:all` green 확인 후 수행~~ → **완료 (2026-08-08)**
4. ~~**Phase 1 (성능 엔진)** — 스코프·계약·fixture·구현·검증·closeout~~ → **완료 (2026-08-08)**
5. ~~**Phase 2 (기본 견적 서비스)** — M0 수락 → 구현·검증·closeout~~ → **구현 완료 (2026-08-08)** — [`docs/phases/phase-2/`](docs/phases/phase-2/)
6. ~~**Phase 3 (3D 물리 검증)** — M0 수락 → 구현·검증·closeout~~ → **완료
   (2026-08-08)** — [`docs/phases/phase-3/`](docs/phases/phase-3/)

## Phase 0 종료 승인 (2026-08-08)

- 감사 실행: `pnpm build` / `pnpm test` (4 files, 14/14) / `pnpm test:e2e` (4/4) 전부 재실행 확인, working tree clean
- 소유자 명시 승인: **PASS**
- 태그: `vertical-slice-v0` 생성 및 원격 push 완료
- Phase 0 3D 동결 **해제** (2026-08-08): Phase 1 종료 조건 충족 — 이후 Phase 3 3D 작업은 해당 phase plan에서 재개 가능; Phase 1 자체는 3D 범위 없음

## Phase 0 구현 상태 (2026-08-08)

| 항목 | 상태 |
|------|------|
| Vite + React + R3F 스캐폴드 | 완료 |
| Fixture HTTP (`/parts`, `/benchmarks`) dev + build | 완료 |
| Contract layer (`vs0.ts`, Zod schemas) | 완료 |
| Catalog + performance loaders | 완료 |
| BuildState + URL sync (full encode / lenient decode) | 완료 |
| Performance panel (3 resolutions, stub ranges) | 완료 |
| 3D viewport + GPU GLB swap | 완료 |
| `pnpm test` (4 test files, 14 tests) | PASS |
| `pnpm build` + `dist/parts` + `dist/benchmarks` | PASS (static-copy 경로 flatten 버그 수정 포함) |
| Step 8 exit scenario | Playwright headless (`pnpm test:e2e`) — 수동 전용 게이트에서 자동화로 승격 |
| Tag `vertical-slice-v0` | **완료** (2026-08-08, PASS 승인 후 생성·push) |

## Phase 1 구현 상태 (2026-08-08)

| 항목 | 상태 |
|------|------|
| `perf1` contract types + Zod (`src/contract/perf1.ts`, `perf1.schema.ts`) | 완료 |
| perf1 fixture loaders (`loadPerf1Fixtures.ts`) | 완료 |
| 96-row baseline lookup (`estimateBaseline.ts`, `baselineQuery.ts`) | 완료 |
| Environment correction apply / withhold (`applyCorrection.ts`) | 완료 |
| Cinebench workload lookup (`estimateWorkload.ts`) | 완료 |
| PerformancePanel integration (upscale / framegen / RAM / correction / Cinebench) | 완료 |
| `pnpm test` (9 files, 39 tests) | PASS |
| `pnpm test:e2e` (Phase 0 exit scenario, 4 tests) | PASS |
| `pnpm test:all` + `pnpm build` | PASS (closeout 재실행) |
| Fixture 값 | 전부 `confidence: "stub"` — 실측·벤치 수집·열 시뮬레이션 없음 |
| Phase 0 3D freeze | **해제** (phase-1.md §6) |

## Phase 1 종료 승인 (2026-08-08)

- 구현 커밋: `38b76d1` (`feat(perf): wire perf1 baseline and correction engine`)
- 검증: `pnpm test:all` (39 unit + 4 e2e) · `pnpm build` · `pnpm dev` 수동 walkthrough 12항목 PASS
- 데이터: `benchmarks/perf1/` stub fixture만 사용; 실측 벤치 검증·열 시뮬레이션·ingestion 파이프라인 **미구현**
- Phase 2 작업 **시작하지 않음**

## Phase 2 구현 상태 (2026-08-08)

| 항목 | 상태 |
|------|------|
| `vs2` / `compat2` contract types + Zod (`src/contract/vs2.ts`, `compat2.ts`, `*.schema.ts`) | 완료 |
| Phase-2 catalog (13 parts) + nested `compatSpec` on disk | 완료 |
| Fixture SSOT: `benchmarks/compat2/compatibility-examples.json`, `benchmarks/price2/price-fixtures.json` | 완료 |
| Compatibility engine (5 checks + aggregate report) | 완료 |
| Price aggregation (`buildPriceSummary`, partial total labeling) | 완료 |
| Part selection UI (7 categories) + attribute filters | 완료 |
| Compatibility + price panels | 완료 |
| `vs2` URL encode/decode + `vs0` legacy backward-compat | 완료 |
| `perf1` RAM tier ↔ RAM SKU mapping | **deferred** (not wired) |
| `PSU_HEADROOM_MULTIPLIER` | stub **1.3** in `checkPsuWattage.ts` |
| `pnpm test` (13 files, 62 tests) | PASS |
| `pnpm test:e2e` (Phase 0 exit + Phase 2 completion, 5 tests) | PASS |
| `pnpm test:all` + `pnpm build` | PASS (closeout 재실행) |

## Phase 2 종료 승인 (2026-08-08)

- 구현: `implementation_plan.md` Steps 1–9 완료
- 검증: `pnpm test:all` (62 unit + 5 e2e) · `pnpm build` · Phase 2 completion scenario (`e2e/phase2-compat-price.spec.ts`) PASS
- 데이터: fixture 가격 전부 USD stub; 호환성·가격 값은 fixture 전용 (`confidence`/basis 라벨링)
- **여전히 열림 (의도적 defer):** `perf1` RAM tier ↔ RAM SKU 자동 매핑; PSU draw stub 상수 → 실측 모델 교체

## Phase 3 구현 상태 (2026-08-08)

| 항목 | 상태 |
|------|------|
| `phys3` contract types + Zod (`src/contract/phys3.ts`, `phys3.schema.ts`) | 완료 |
| Physical-core inventory (9 IDs) + visual-only fallbacks (4 IDs) | 완료 — **재고 확장 없음** |
| Geometry data version | `phys3-exp-20260808` |
| Model grade | **Experimental** synthetic fixture (not Verified real-hardware) |
| GLB authoring | `scripts/author-phys3-glbs.mjs` (deterministic, dependency-free) |
| Mount resolver + `AssemblyState` (non-URL) | 완료 |
| Cooler orientations | `normal`, `rotated-180` |
| Collision/clearance | box OBB via `three/examples/jsm/math/OBB.js`; epsilon `0.1 mm` |
| Cooling hook | runtime `unavailable` (empty production rows); stub-only unit path |
| Viewport | bounded assembled scene (resolver-owned transforms) |
| UI panels | MountControls, PhysicalValidationPanel, CoolingEvidencePanel |
| `pnpm test` | **18 files, 96 tests PASS** (post-audit corrective fixes 2026-08-08) |
| `pnpm test:e2e` | **6 tests PASS** (Phase 0 + Phase 2 + Phase 3) |
| `pnpm test:all` + `pnpm build` | PASS |
| Owner closeout (Step 10) | **PASS — owner-accepted (2026-08-08)** |
| Keepsake screenshots | [`docs/phases/phase-3/keepsake/`](docs/phases/phase-3/keepsake/) |

## Phase 3 종료 승인 (2026-08-08)

- 구현 커밋: `acd038b` (`feat(phys3): implement Phase 3 physical validation and assembly`)
- 재감사 (read-only corrective re-audit): **PASS**
  - Inclusive `0.1 mm` epsilon (0.099/0.100 fit, 0.101 interference)
  - `PhysicalValidationReport` Zod invariants (non-empty checks + aggregate precedence)
  - `benchmarks/phys3/physical-validation-examples.json` + cooling evidence schema-parsed
  - All 8 `MountUnavailableReason` families + mount-graph DAG cycle detection
- 검증: `pnpm test` 96/96 · `pnpm test:e2e` 6/6 · `pnpm build` PASS
- Closeout Playwright 재실행: **6/6 PASS** (2026-08-08, post-push)
- Keepsake: fit / cooler-180 interference / visual-only unavailable full-page screenshots
- 소유자 명시 승인: **PASS**
- 데이터 등급: 전부 **Experimental** synthetic fixture — Verified real-hardware 아님
- 런타임 cooling: production evidence rows empty → structured `unavailable` (의도)

### Phase 3 audit corrective notes (2026-08-08)

- Inclusive `0.1 mm` overlap boundary corrected (≤0.1 fit, >0.1 interference)
- `PhysicalValidationReport` Zod invariants enforced (non-empty checks + aggregate precedence)
- Example fixture schema-validated
- Mount unavailable families covered; production mount graph is a fixed DAG with a pure cycle detector (no `cyclic_dependency` reason — not in accepted phys3 contract)

### Phase 3 physical-core IDs

`case.mid-tower-atx-01`, `mb.atx-b650-01`, `cpu.zen4-7600`, `cpu.zen4-7800x3d`,
`gpu.rtx4070`, `gpu.rtx4080`, `cooler.air-twin-tower-01`, `ram.ddr5-32gb-6000`,
`psu.750w-atx`

### Phase 3 visual-only fallback IDs

`case.micro-atx-mini-01`, `mb.micro-b450-01`, `ram.ddr5-16gb-7200`,
`psu.550w-sfx`

### Phase 3 limitations (intentional)

- No production cooling evidence / bucket mapping / FPS derate
- Synthetic Experimental geometry only — not manufacturer-verified
- Mount choices not URL-persisted
- Box OBB only (no triangle-mesh / physics engine)
- No inventory expansion beyond the existing 13-part catalog
