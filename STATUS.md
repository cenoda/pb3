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
7. **Phase 4 M0** — original Steps 1–8 software path implemented; false
   first-party claim removed; **external-evidence corrective Steps 1–5
   implemented (2026-08-09)** — Step 9 blocked pending re-audit —
   [`docs/phases/phase-4/`](docs/phases/phase-4/) ·
   [`docs/corrections/phase4-external-evidence-1/`](docs/corrections/phase4-external-evidence-1/)
8. ~~**Product UX corrective gate (`product-ux-1`)**~~ — implementation and
   **owner UX walkthrough PASS complete (2026-08-09)**; **not** Phase 5;
   Phase 4 Step 9 unchanged —
   [`docs/corrections/product-ux-1/`](docs/corrections/product-ux-1/)
9. **Phase 4.1 (`est1`)** — M0 combination estimator **implemented
   (2026-08-09)** — O1–O9 locked; sidecar only; temporary draft caveat —
   [`docs/phases/phase-4.1/`](docs/phases/phase-4.1/)
10. ~~**Phase 5 (제품 표면)**~~ → **완료 · 소유자 승인 (2026-08-09)** —
    [`docs/phases/phase-5/`](docs/phases/phase-5/)
11. **Phase 6 (실제 부품 카탈로그, `cat6`)** — M0 수락 + O1–O8 확정 (2026-08-10);
    **Steps 1–11 완료** (Step 5: manifest/loader **O8**; Step 6: 물리 권위 경계 +
    O7 witness; Step 7: default build 조립 검증 PASS, default 변경 없음,
    Phase 0 exit + O7 재실행 green; Step 8: 미커버리지 사유 문구 사용자 언어화;
    Step 9: 카탈로그 14→22개 성장, ≈30 미달 — AMD 등 일부 제조사 사이트
    fetch 불가로 소싱 중단, O7 쌍 불변; Step 10: 22개 중 14개 가격 확보(street
    12·MSRP전용 2, 8개는 소싱 실패로 행 자체 없음) — `benchmarks/price2/` 삭제
    (**B11** 종료), 기본 빌드는 CPU/GPU 무가격·PSU MSRP전용이라 총액이 항상
    partial; Step 11: 무결성 테스트 9개 + 가격 매핑 단위테스트 재작성 + E2E
    2건 재고정 —
    [`STEPS.md`](docs/phases/phase-6/STEPS.md) §Step 10–11), Step 12(오너
    무작위 점검)만 남음 —
    [`docs/phases/phase-6/`](docs/phases/phase-6/)
12. **Phase 7 (카탈로그 브라우저 + 이미지)** — 미계획; Phase 6 종료 및 이미지
    권리 ADR 이후 별도 M0 필요

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

## Phase 4 M0 owner acceptance (2026-08-09)

| 항목 | 상태 |
|------|------|
| Direction / title | Evidence-grade data and validation |
| Pilot path | **Single-build evidence pilot** |
| Scope spec | **Owner-accepted** — [`specs/phase-4.md`](docs/phases/phase-4/specs/phase-4.md) |
| Provenance contract | **Owner-accepted** `prov4` — [`provenance-data-contract.md`](docs/phases/phase-4/specs/provenance-data-contract.md) |
| Implementation plan | **Owner-accepted** — [`implementation_plan.md`](docs/phases/phase-4/implementation_plan.md) |
| D1–D16 | **Accepted** (phase-4.md §11) |
| O1 | **A** — ≥1 first-party measured cell; `runCount >= 2`; all 3 cells registry-bound |
| O2 | **A** — Experimental only |
| O3 | **A** — 365 days |
| O4 | **A** — `benchmarks/prov4/` |
| Cinebench / cooling | Out / empty unavailable |
| Audit remediations retained | high gate · geometry join · 3-cell · sidecar · asOf · charter metrics · RawArtifactReference · first-party runCount≥2 |
| Pilot build | `DEFAULT_BUILD_STATE_V2` (7600 + 4070 ATX set) |
| Owner M0 acceptance | **PASS (2026-08-09)** |
| Implementation start | **Authorized (2026-08-09)** — explicit start instruction |
| Implementation / fixtures / deps | Original Steps 1–8 implemented; evidence fixture safety-corrected after invalid first-party claim; Step 9 blocked |

## Phase 4 implementation progress (2026-08-09)

| Step | Status |
|------|--------|
| 1. `prov4` types + Zod + schema tests | **Done** — `runCount` 0/1 reject; high-gate structural; bare artifact string reject |
| 2. Pilot constants + freshness/binding | **Done** |
| 3. `benchmarks/prov4/*` + integrity | **Done** — 3 perf / 7 geo / empty cooling; raw artifact digest match |
| 4. Loaders | **Done** — fail-closed Zod + repo-file digest verify |
| 5. PerformancePanel sidecar overlay | **Done** — exact pilot key only |
| 6. Physical/cooling disclosure | **Done** — phys3 join + empty cooling unavailable |
| 7. EvidenceDisclosurePanel | **Done** |
| 8. E2E + build regression | **Done** — unit **171**, e2e **9**, `dist/benchmarks/prov4` present |
| 9. Evidence-quality closeout | **Pending** — software green ≠ closeout; owner PASS required |

### Phase 4 software verification (2026-08-09)

| Check | Result |
|-------|--------|
| `pnpm test` | **25 files, 171 tests PASS** (Phase 3 baseline was 18/96) |
| `pnpm test:e2e` | **9 tests PASS** (Phase 0+2+3 + new Phase 4) |
| `pnpm test:all` | PASS |
| `pnpm build` | PASS; `dist/benchmarks/prov4/**` copied |
| Pilot 1080p | `synthetic-stub`; false first-party metrics, capture conditions, source, and raw-summary artifact removed |
| Pilot 1440p / 4k | `synthetic-stub` + MetricUnavailable charter fields |
| Geometry | 7× Experimental; join on `phys3EvidenceSourceId` |
| Cooling | empty rows → unavailable |
| Human verification | empty (no `"high"` claims shipped) |
| `perf1` / `phys3` / `vs2` public shapes | **unchanged** |

### Phase 4 evidence-quality gate (not closed)

- Owner has **not** yet accepted evidence-quality closeout.
- No first-party performance package is currently shipped. All three pilot
  performance rows are explicit synthetic stubs pending an accepted external
  evidence correction.
- Do **not** treat green tests alone as Phase 4 PASS.

### Phase 4 external evidence correction (`phase4-external-evidence-1`, 2026-08-09)

| 항목 | 상태 |
|------|------|
| Package acceptance | **PASS (owner, 2026-08-09)** |
| Corrective Steps 1–5 | **Implemented (2026-08-09)** — ADR-005, observation contract, aggregation engine, UI disclosure |
| Source rights record | `benchmarks/prov4/source-rights-record.json` + ADR-005 |
| Curated observations | `benchmarks/prov4/external-performance-observations.json` — audit-only near-miss rows; **no exact-match FPS ingested** |
| Product pilot FPS | External aggregate **unavailable** → **perf1 synthetic fallback** (not sidecar synthetic-stub as product range) |
| Verification | `pnpm test` **28 files / 184 tests PASS** · `pnpm test:e2e` **14/14 PASS** · `pnpm build` PASS · `dist/benchmarks/prov4/**` present |
| Step 9 closeout | **BLOCKED** — independent re-audit + owner PASS required; no verified external aggregate ships yet |

### Phase 4 external evidence correction candidate (2026-08-09)

- Home: [`docs/corrections/phase4-external-evidence-1/`](docs/corrections/phase4-external-evidence-1/)
- False `first-party-measured` claim and derived PresentMon-labeled summary:
  **removed** (prior safety correction).
- Corrective implementation Steps 1–5: **complete (2026-08-09)**.
- Next gate: independent re-audit and explicit owner Phase 4 Step 9 closeout.

## Product UX corrective gate (`product-ux-1`, 2026-08-09)

Bounded corrective **product surface** over the Phase 0–4 app.
**Not** Phase 5, **not** an architecture reset. Contracts / inventory frozen.

| 항목 | 상태 |
|------|------|
| Baseline commit | **`e73602a`** |
| Home | [`docs/corrections/product-ux-1/`](docs/corrections/product-ux-1/) |
| Package acceptance | **PASS (owner, 2026-08-09)** |
| Implementation start | **Authorized (2026-08-09)** |
| Implementation Steps 1–9 (software) | **Complete** — theme, builder shell, `BuildResultSummary`, sticky viewport, progressive disclosure, dedupe, product labels, E2E |
| O1–O5 as shipped | A / A sticky / **B filters collapsed** (T3) / A FPS chips / B `app-shell.css` |
| Verification | `pnpm test:all` **173 unit + 14 e2e PASS**; `pnpm build` PASS |
| Owner UX walkthrough PASS | **PASS (owner, 2026-08-09)** |
| Formal corrective closeout | **Complete (2026-08-09)** |
| Phase 4 Step 9 | **BLOCKED** — the digest is internally consistent, but the checked-in 1,362-byte JSON is a derived summary authored with the implementation, not independently verifiable PresentMon raw output |
| Contracts / inventory | **Unchanged** |

**Shipped headline:** owned light theme; at 1280×720 selectors + sticky 3D +
compat/fit/FPS/price summary co-visible; evidence/physical diagnostics
collapsed by default; pilot non-carry preserved.

Phase 4 evidence review did **not** pass with this UX approval. Closeout needs
an authentic raw capture export (or equivalent independently inspectable
artifact) tied to the recorded runs and capture conditions; the current
summary JSON and matching SHA-256 prove file integrity, not measurement
authenticity.

## Phase 4.1 combination estimator (`est1`, 2026-08-09)

Sub-path of Phase 4 — **not** Phase 5. Temporary draft combination function.

| 항목 | 상태 |
|------|------|
| Algorithm O1–O9 | **Locked** |
| M0 package + implementation start | **Authorized / implemented** (2026-08-09) |
| Contract | `est1` sidecar — `src/contract/est1.ts` + Zod; does **not** rewrite `perf1` |
| Fixtures | `benchmarks/est1/` — honest empty edges/anchors (path proofs in unit tests) |
| AMD manufacturer specs catalog | **Auto-harvest** — `benchmarks/est1/vendor-catalog/` + `scripts/curate-amd-product-catalog.py` (specs **inputs**, not game FPS) |
| Pure estimator | `estimateCombinationPerformance` + scale/rank/validate helpers |
| UI | Pilot panel/disclosure/chips: `est1-estimated` / `est1-unavailable` + outer synthetic residual labeled non-estimate; `draftCaveat` visible |
| Verification | `pnpm test` **211** · `pnpm test:e2e` **16** · `pnpm build` PASS · `dist/benchmarks/est1/**` present |
| Out of M0 | Motherboard/cooling/case airflow/non-default power; SPA runtime scrape; GPU-bound waiver |

Owner evidence-quality PASS for est1 numbers is **separate** from the software gate.

## Phase 4 + 4.1 freeze (owner, 2026-08-09)

| 항목 | 상태 |
|------|------|
| Decision | **Freeze** further Phase 4 / 4.1 product work |
| Record | [`docs/phases/phase-4/FREEZE.md`](docs/phases/phase-4/FREEZE.md) |
| Agreed baseline | Evidence discipline + honest empty external FPS + `est1` draft software + AMD specs spine |
| Not claimed | Step 9 PASS; full spec→FPS simulation; multi-CPU product FPS coverage |
| Parallel | **Phase 5 may start** as separate M0 (must not silently break `prov4`/`est1`) |
| Resume | Explicit owner unfreeze only |


## Phase 5 — Product surface (complete, owner-approved 2026-08-09)

| 항목 | 상태 |
|------|------|
| Home | [`docs/phases/phase-5/`](docs/phases/phase-5/) |
| Scope | [`specs/phase-5.md`](docs/phases/phase-5/specs/phase-5.md) — display layer only; D1–D4 locked |
| Record | [`STEPS.md`](docs/phases/phase-5/STEPS.md) · [`CLOSEOUT.md`](docs/phases/phase-5/CLOSEOUT.md) · [`screenshots/`](docs/phases/phase-5/screenshots/) |
| Commits | `e04a960` (phase opened, corrective track closed) · `dfb395f` (display layer replaced) |
| Changed | `src/App.tsx`, `src/ui/**`, `src/styles/**` replaced; `BuildViewport` framing only; e2e re-anchored |
| Unchanged | All engines, all contracts (`vs0` `perf1` `vs2` `compat2` `phys3` `prov4` `est1`), `parts/**`, `benchmarks/**` |
| Behaviour | Impossible builds present **no FPS and no price**; rejection sentence in product names; performance always with game + preset + confidence; canonical URL copyable; provenance retained in full behind one *Why this result?* disclosure |
| Verification | `pnpm test` **215** · `pnpm test:e2e` **17** · `pnpm build` PASS |
| Corrective track | **Closed** — absorbed into Phase 5; do not open new product-surface correctives |

Carried out of the phase (judged out of scope, not overlooked): no part photos
(no image field in the part contract), selection is a dropdown rather than a
browse-and-pick dialog, 3D models are plain boxes. All three are blocked on a
**real parts catalog**, which is not started in this session.

## Phase 6 — Real parts catalog (M0 accepted; Steps 1–11 done)

| 항목 | 상태 |
|------|------|
| Home | [`docs/phases/phase-6/`](docs/phases/phase-6/) |
| Scope | [`specs/phase-6.md`](docs/phases/phase-6/specs/phase-6.md) — primarily catalog/data work; display layer read-only except as already required for data wiring. Engine logic is read-only except the **already-recorded narrow Step 6 physical-authority carve-out** (clearance-limit authoritative, OBB advisory-only; `conditional` status). No further engine expansion in Steps 7–12 without an explicit plan carve-out |
| Contract | [`catalog-data-contract.md`](docs/phases/phase-6/specs/catalog-data-contract.md) — `cat6`: SKU identity, `dimensionsMm`, `performanceSpec` (boost clock / power limit), per-group provenance, image **fields only**, manifest, MSRP + street snapshot |
| Plan | [`implementation_plan.md`](docs/phases/phase-6/implementation_plan.md) — Steps 1–12, "source first, data second" |
| Shape | 카탈로그 데이터만 (브라우저는 Phase 7) · ≈30개 소수 정예 · AM5/DDR5 단일 · 이미지는 계약만 |
| Owner decisions | **O1–O8 locked (2026-08-10)** — spec §7 |
| Owner acceptance | **Accepted 2026-08-10** by starting implementation; no separate written acceptance recorded |
| Progress | **Steps 1–11 done (2026-08-11)** — `cat6` contract; legacy ids retired repo-wide; **`parts/catalog-manifest.json` + manifest loader (O8)**. Step 6: physical authority boundary — clearance-limit checks authoritative, OBB advisory-only; slot 14 + O7 witness admitted; `phys3-exp-20260808` retained (no new geometry representation dataset). **Step 7 (2026-08-11):** default catalog build assembles cleanly (North TG Dark + NH-D15 G2 + RM750e); **`DEFAULT_BUILD_STATE_V2` unchanged**. **Step 8 (2026-08-11):** `src/perf/estimateBaseline.ts` + `estimateWorkload.ts` unavailable reasons rewritten to user language. **Step 9 (2026-08-11):** catalog grown **14 → 22 parts** (8 fully sourced additions: 1 GPU, 1 motherboard, 2 case, 1 PSU, 2 cooler, 1 RAM — cooler was the thinnest category at 1, now 3); none carry `physicalSpec` (visual-only placeholder GLBs; the clearance-limit evaluator reads `dimensionsMm`/`clearanceLimits` directly and does not require it, a pattern 4 of the original 14 parts already used). **Did not reach ≈30**: AMD.com (sole AM5 CPU vendor), GIGABYTE.com, Noctua.at, Thermalright, Kingston, Arctic and be quiet! were unfetchable this session; **cpu stays at 2**. RTX 4060 Ti excluded — NVIDIA's own TGP table does not split 8GB/16GB. O7 pair (A3-mATX × NH-D15 G2) untouched, still authoritative. **Step 10 (2026-08-11):** `benchmarks/cat6/catalog-prices.json` authored — 14 of 22 parts priced (12 street/KRW via Danawa, 2 MSRP-only via manufacturer store, 0 with both, 8 with no row at all — discontinued/unreachable listings, not fabricated); `buildPriceSummary` rewritten to map street snapshots only, MSRP never summed, non-KRW street withheld; `benchmarks/price2/` deleted, closing **B11**; default build's CPU/GPU carry no price row and its PSU is MSRP-only, so the default total is now honestly `isPartial: true` (disclosed on the surface, not hidden). **Step 11 (2026-08-11):** `cat6.step11.integrity.test.ts` (9 tests: strict cat6 parse, GLB-parses-as-glTF for all 22, no image, price-source registry resolution, KRW-only enforcement); `buildPriceSummary.test.ts` rewritten (2→9 tests); 2 E2E specs re-anchored (`phase2-compat-price.spec.ts`, `phase5-exit-conditions.spec.ts` — "fixed demo prices" copy corrected to "dated domestic street-price snapshots" in `ResultBar.tsx`/`WhyThisResult.tsx`, the only UI diff). `pnpm test` **39 files / 339 tests**; `pnpm test:e2e` **19**; `pnpm build` clean. **Next: Step 12** (owner spot-check, not an agent step). Phase 7 not started. Full record: [`docs/phases/phase-6/STEPS.md`](docs/phases/phase-6/STEPS.md) §Step 9–11 |
| **O8 — manifest/loader** | **Done (Step 5).** Runtime membership is manifest-only; default build join-guarded, not manifest-derived |
| **O7 — running-app reachability** | **Done (Step 6, 2026-08-10).** Slot 14 admitted with visual-only plane GLB + collision-less `physicalSpec`; witness build (A3 + slot 14 + NH-D15 G2) reachable in the running app; `e2e/phase6-o7-slot14-witness.spec.ts` green |
| Open blockers | **B4** (permanent `caution` under O6 — open). Resolved: **B3** (`conditional` status + branch pruning), **B8** (CPU package dimensions; synthetic CPU collision geometry removed), **B11** (sourced catalog prices, Step 10), **B12** (stale cooler `allowedContacts` removed) |
| Gate | Owner picks 3 parts at random and traces every engine-consumed field to a citation in one hop |
| **O1 — accepted consequence** | `perf1` covers 2 CPUs × 2 GPUs and Phase 4.1 (the attempt to close that gap) is frozen, so **most valid builds show no FPS**. The surface states the combination estimator is **in preparation**, via `src/perf/**` reason strings — **Step 8 done (2026-08-11)**; no UI change |
| **O3/O4 — id migration** | **Done (Step 4, 2026-08-10).** 13 legacy folders retired; 14 `cat6` SKU ids authored at Step 4, grown to **22** by Step 9 (2026-08-11); 22 `cat6` SKU ids live under `parts/**` today. `src/test/cat6.integrity.test.ts` guards `src/**`, `parts/**`, `benchmarks/**`, `e2e/**` (docs deliberately excluded). Slot 14 authored; runtime manifest lists **22** (grown from 14 by Step 9) |
| **Share links** | **Break once, deliberately.** The URL carries part ids; old links open on the default build (lenient decoder), not an error |
| **O5 — price** | **Done (Step 10, 2026-08-11).** MSRP **and** dated domestic street snapshot, manually curated — 14 of 22 parts priced (12 street/KRW, 2 MSRP-only, 8 unpriced). Street drives the total; MSRP is never summed; missing/MSRP-only/non-KRW street → `unavailable` + `isPartial`. `benchmarks/price2/` deleted |
| **O6 — BIOS** | Not considered. Socket compatibility only; `checkChipsetBios` already returns `unavailable` without the map, so no engine change |
| **O2 — platform** | AM5/DDR5 only, **temporary narrowing**. LGA1851 / LGA1700 / AM4 intended later; that will require a deliberate versioned widening of `compat2`'s DDR5 and form-factor literals |
| Phase 4 / 4.1 | Still frozen. Three mechanical carve-outs permitted: `prov4` pilot ids + geometry version, `perf1` fixture ids, and `src/perf/**` unavailable reason wording. Exercised so far: `prov4` pilot ids + `perf1` fixture ids + **`src/perf/**` unavailable reason wording (Step 8, 2026-08-11)** — the geometry-version carve-out was **not** exercised (no new geometry representation dataset; `phys3-exp-20260808` retained — Phase 6 plan Step 6) |
