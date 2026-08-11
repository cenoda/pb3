# AGENTS.md — project rules for every coding agent

This file is the **repository-level agent brief**. Aria (Grok Build), Lira (Claude Code), and Nox (Codex) should treat it as project SSOT for *how to work here*. Personal identity, tone, and global team rules live outside the repo (`~/.agent-team/`, harness home configs).

---

## Critical gate (read first)

| Fact | State |
|------|--------|
| Repository contents | **Phase 0–3 app, docs, and fixtures** — Vite/React/R3F SPA under `src/`, 13-part catalog and fixtures at repo-root `parts/` + `benchmarks/` |
| Implementation | **Phase 0–3 complete**; Phase 4 external-evidence + **Phase 4.1 `est1` M0 + AMD specs catalog harvest** shipped (2026-08-09) |
| Current planning gate | **Phase 6 complete and owner-closed (2026-08-12)** — `docs/phases/phase-6/`; Steps 1–12 complete, Step 12 owner-accepted, B4 resolved, closeout recorded. **Phase 7 has not started** and still requires its own accepted M0 plan. Phase 5 remains complete (owner-approved 2026-08-09). **Phase 4 + 4.1 remain frozen** — see `docs/phases/phase-4/FREEZE.md`; Step 9 / full sim not claimed; do not silently break `prov4`/`est1` |
| Stack / runtime / tooling | **Locked** (ADR-001–003) + **Playwright** for exit-scenario E2E |
| License | Code + data + project-authored synthetic fixture GLBs: **Apache-2.0** (ADR-004); third-party/manufacturer-derived real-hardware GLBs still require a separate source-specific decision |
| Tag `vertical-slice-v0` | **Created and pushed** after owner-authorized Phase 0 PASS |
| Discarded history | Experimental scaffold `1d54c10` was **fully discarded**. Current tree is a fresh scaffold — do not revive `1d54c10` as baseline |

Prefer the smallest correct change. Do not expand an accepted phase inventory or
non-goals silently. Every further phase still needs an accepted
`implementation_plan.md` and a separate explicit implementation-start
instruction before code.

---

## What this project is

**3D PC Builder** — connect **explainable performance prediction** (FPS *ranges* + confidence + data version; never a single fake number) with **real-dimension 3D physical validation** (fit/interference, not only logical compatibility).

Full philosophy and multi-phase plan: [`PROJECT_CHARTER.md`](PROJECT_CHARTER.md).

Core principles that constrain every change:

- Prefer “not enough data” / `unavailable` over invented numbers.
- Depth over breadth — few parts/games done well.
- Separate concerns: logical compatibility ≠ physical collision; baseline performance ≠ environmental correction; visual mesh ≠ collision/mount data.
- Data-driven parts: a new part should be `part.json` + `model.glb` under `parts/`, not a code fork.

---

## Current implementation baseline: Phase 0–3 implemented and closed out

Phase 0 remains the historical vertical-slice regression baseline below. Phase
1 (`perf1`), Phase 2 (`vs2`/`compat2`), and Phase 3 (`phys3`) are implemented
and closed out (2026-08-08). Phase 3 implementation commit: `acd038b`.

### Canonical phase home

```text
docs/phases/phase-0/
  README.md
  TODO.md                          ← open / done checklist
  implementation_plan.md           ← ordered, file-level build plan (required before code)
  specs/phase-0.md                 ← scope, inventory, forbidden work, exit criteria
  specs/vertical-slice-data-contract.md   ← vs0 types, JSON, URL rules
  fixes/                           ← short incident / fix notes
```

**Plan-before-code rule:** every phase requires its own `docs/phases/phase-N/implementation_plan.md`,
written and reviewed before any scaffold or source file for that phase exists. Locked ADRs and an
accepted spec/contract feed the plan; they don't replace it.

Pointer stubs (do not re-expand into full duplicates):

- `docs/phase-0.md` → phase home
- `docs/vertical-slice-data-contract.md` → contract under `specs/`

### Living status

| Doc | Role |
|-----|------|
| [`STATUS.md`](STATUS.md) | Project-wide decided vs open |
| [`docs/phases/phase-0/TODO.md`](docs/phases/phase-0/TODO.md) | Phase-0 checklist |
| [`docs/decisions/README.md`](docs/decisions/README.md) | Accepted ADR index |

### Fixed inventory (do not expand while phase 0 is open)

| Kind | Count | IDs |
|------|------:|-----|
| Case | 1 | `case.mid-tower-atx-01` |
| Motherboard | 1 | `mb.atx-b650-01` |
| CPU | 2 | `cpu.zen4-7600`, `cpu.zen4-7800x3d` |
| GPU | 2 | `gpu.rtx4070`, `gpu.rtx4080` |
| Cooler | 1 | `cooler.air-twin-tower-01` |
| Game | 1 | `game.cyberpunk-2077` (phase-0 **constant**, not a free picker) |
| Preset | 1 | `preset.raster-ultra` (phase-0 **constant**) |
| Resolutions | 3 | `1080p`, `1440p`, `4k` |

### End-to-end flow the eventual app must satisfy

```text
part.json × N ──load──► PartCatalog
URL (?cpu&gpu…) ──decode──► BuildState ──validate against catalog──► ok / defaults
                              ├─► resolve GPU modelGlbPath ──► load GLB ──► viewport swap
                              └─► queriesForBuild(state) ──► estimatePerformance × 3 ──► UI ranges
```

### Contract rules agents must not violate

- Contract version string: **`vs0`**. Bump only on breaking field changes; never silently widen.
- IDs are **opaque strings** — do not parse structure out of them.
- Unknown / missing combos → structured `status: "unavailable"` — **never** invent FPS.
- Estimates are always a **range** (`fpsMin` / `fpsMax`) with `confidence`, `dataVersion`, `basis`.
- URL: encoder writes **every** `BuildState` field (canonical share link); decoder fills missing keys from default fixture state (lenient partial links are input-only).
- Units: **mm**, **Y-up** for GLB.

### Explicit non-goals (phase 0)

Extra parts/games, precise collision/anchors, RGB, assembly animation, real performance model, backend, auth, live pricing, design system, model authoring tools. Full forbidden list: `docs/phases/phase-0/specs/phase-0.md` §5.

---

## Fixture data (already checked in)

| Path | Role |
|------|------|
| `parts/{category}/{id}/part.json` | Part identity + `modelGlbPath` |
| `parts/{category}/{id}/model.glb` | Visual mesh (phase-0 placeholders OK if GPU swap is distinguishable) |
| `benchmarks/vs0/performance-fixtures.json` | Stub table: 2×2×3 = 12 rows, all `confidence: "stub"` |
| `benchmarks/vs0/performance-unavailable.examples.json` | Unavailable-path examples only — **not** in the main table |

Folder name must equal `part.json` `id`. Data-only integrity checks already **PASS** (see `STATUS.md`).

Fixtures stay at **repo root** `parts/` and `benchmarks/` — do not move them under `docs/`.

---

## Tech decision order (process accepted)

Canonical detail: [`docs/decisions/TECH-DECISION-ORDER.md`](docs/decisions/TECH-DECISION-ORDER.md).

1. **Runtime — locked:** **static SPA** ([`ADR-001`](docs/decisions/ADR-001-runtime-static-spa.md)). Phases **0–3** scope; revisit if server compute is required. **Deploy deferred** (local only; later GCP/Azure; portable static output).
2. **Stack core — locked:** **TypeScript + React + R3F + Vite** ([`ADR-002`](docs/decisions/ADR-002-stack-core-ts-react-r3f-vite.md)). Discarded scaffold `1d54c10` is not baseline.
3. **Stage 3 — locked:** **pnpm**, **Zod**, **Zustand**, **Vitest**; fixtures SSOT at repo-root `parts/` + `benchmarks/`, HTTP `/parts` + `/benchmarks`, Vite dev serve + build copy ([`ADR-003`](docs/decisions/ADR-003-stage3-tooling-and-fixtures.md)).
4. **E2E — adopted:** **Playwright Test** (headless Chromium) for Phase 0 exit scenario — `e2e/exit-scenario.spec.ts`, `pnpm test:e2e` (see ADR-003 amendment).
5. **Agent browser exploration (optional):** **Playwright CLI** (`@playwright/cli`, `pnpm explore:phase0`) and **Playwright MCP** (`@playwright/mcp` in the host) for live a11y-driven browsing — not a regression gate. See [`docs/verification/AGENT_BROWSER_EXPLORATION.md`](docs/verification/AGENT_BROWSER_EXPLORATION.md).
6. IDE/DX — owner plans **WebStorm + Cursor**
7. **License — locked (ADR-004):** code + data + project-authored synthetic fixture GLBs = **Apache License 2.0** (root `LICENSE`). Third-party or manufacturer-derived real-hardware GLBs still require a separate source-specific decision.

Owner handles **git push** unless they explicitly ask the agent to push. Record further locks as `docs/decisions/ADR-NNN-*.md`.

---

## Working rules (all agents)

1. **Read before write.** Open `STATUS.md`, phase-0 `TODO.md`, and the relevant spec before changing docs or data.
2. **Smallest correct change.** No drive-by refactors or speculative “while we’re here” features.
3. **Match local style.** Korean for many project prose docs; English for contracts, agent briefs, code, commits, ADRs. Match the file you edit.
4. **No secrets** in the repo, commits, logs, or shared memory.
5. **Commits:** create git commits when the owner asks or clearly allows it for the task. Prefer conventional, complete-sentence commit messages in English. Do not force-push or rewrite published history without explicit request.
6. **Verification:** after app, fixture, or contract edits run the relevant suite and do not claim green without running it:
   - `pnpm test` — Vitest pure logic (`src/test/**`)
   - `pnpm test:e2e` — Playwright Test headless exit scenario against `vite preview` (`e2e/**`)
   - `pnpm test:all` — both (preferred before tag / hand-off)
   - `pnpm build` when touching Vite config or fixture HTTP wiring
   - Optional explore: `pnpm dev` + `pnpm explore:phase0` or Playwright MCP (see agent browser doc) — recommended before tag / after large UI changes; not required on every commit
7. **Shared team memory** (`agent-memory` / `~/.agent-team/shared-memory/`): on non-trivial work, read; after durable decisions or hand-offs, write short English bullets. Never store secrets.
8. **Peer consult** (Aria / Lira / Nox): advisory only; task owner remains the agent the user is talking to unless reassigned.

---

## What to edit freely vs what needs approval

| Allowed | Needs explicit owner approval |
|---------|-------------------------------|
| Specs, STATUS, TODO, README, charter links | Tags (`vertical-slice-v0`) |
| Fixture JSON / placeholder GLBs within phase-0 IDs | Expanding inventory beyond phase-0 fixed IDs |
| Agent briefs (`AGENTS.md`, `CLAUDE.md`, `.grok/rules/`) | New stack ADRs that claim a lock |
| App source under `src/`, `e2e/`, Vite config within plan | Deploy pipeline / live hosting |
| Unit + Playwright tests | Force-push / history rewrite |

## Quick start for a new session

1. Read this file.
2. Skim [`STATUS.md`](STATUS.md) and [`docs/phases/phase-0/TODO.md`](docs/phases/phase-0/TODO.md).
3. If touching data shapes: [`docs/phases/phase-0/specs/vertical-slice-data-contract.md`](docs/phases/phase-0/specs/vertical-slice-data-contract.md).
4. For Phase 0 code: follow [`docs/phases/phase-0/implementation_plan.md`](docs/phases/phase-0/implementation_plan.md); run `pnpm test:all` after behavior changes.
5. Update `STATUS.md` / phase TODO when durable state changes.
6. Optionally: `agent-memory search "pb3"` and write hand-off facts after decisions.


## Harness prefix files in this repo

| Path | Who loads it |
|------|----------------|
| [`AGENTS.md`](AGENTS.md) | Grok, Codex, and other AGENTS-aware tools (this file) |
| [`CLAUDE.md`](CLAUDE.md) | Claude Code (+ Grok Claude-compat); thin pointer + hard gates |
| [`.grok/rules/pb3-phase-0.md`](.grok/rules/pb3-phase-0.md) | Grok Build project rules (hard gates, always scanned) |

Do not hand-edit global identity copies under `~/.grok/`, `~/.claude/`, `~/.codex/` for project facts — put project facts **here**.
