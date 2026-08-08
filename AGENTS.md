# AGENTS.md — project rules for every coding agent

This file is the **repository-level agent brief**. Aria (Grok Build), Lira (Claude Code), and Nox (Codex) should treat it as project SSOT for *how to work here*. Personal identity, tone, and global team rules live outside the repo (`~/.agent-team/`, harness home configs).

---

## Critical gate (read first)

| Fact | State |
|------|--------|
| Repository contents | **Docs + fixtures only** — no app source, no `package.json`, no build/test/lint toolchain |
| Implementation | **Not started** |
| Stack / runtime / license | **Undecided** |
| Tag `vertical-slice-v0` | **Not created** |
| Discarded history | Experimental scaffold `1d54c10` (Vite/React/R3F SPA + ADR-001) was **fully discarded**. Do not revive it unless the owner re-approves a stack and implementation start |

**Do not** invent code, scaffold an app, install dependencies, lock a stack, or write an ADR that claims the stack is chosen **until the owner explicitly says to start implementation** (e.g. “구현 시작”, “start implementation”, or a named stack + “scaffold now”).

Docs, fixtures, agent briefs, and status updates **are** allowed without that gate. Prefer the smallest correct doc change.

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

## Current phase: Phase 0 (vertical slice)

Phase 0 is a **technical connection check**, not a product MVP. Prove one thin path end-to-end, then freeze 3D work until Phase 1 (performance engine).

### Canonical phase home

```text
docs/phases/phase-0/
  README.md
  TODO.md                          ← open / done checklist
  specs/phase-0.md                 ← scope, inventory, forbidden work, exit criteria
  specs/vertical-slice-data-contract.md   ← vs0 types, JSON, URL rules
  fixes/                           ← short incident / fix notes
```

Pointer stubs (do not re-expand into full duplicates):

- `docs/phase-0.md` → phase home
- `docs/vertical-slice-data-contract.md` → contract under `specs/`

### Living status

| Doc | Role |
|-----|------|
| [`STATUS.md`](STATUS.md) | Project-wide decided vs open |
| [`docs/phases/phase-0/TODO.md`](docs/phases/phase-0/TODO.md) | Phase-0 checklist |
| [`docs/decisions/README.md`](docs/decisions/README.md) | ADR index (formal ADRs not started) |

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

1. **Runtime shape** (+ deploy host) — static SPA is a **candidate**, **not formally locked**
2. **Language** (still undecided) → **UI + 3D as a pair** → bundler
3. Package manager / schema / state / test / fixture HTTP paths
4. IDE/DX anytime — owner plans **WebStorm + Cursor**
5. **License** parallel; finish code license before third-party deps

Owner handles **git push**. Record locks as `docs/decisions/ADR-NNN-*.md`. Until locked, do not assume TypeScript, Vite, React, R3F, Zod, Vitest, Zustand, or any other stack.

---

## Working rules (all agents)

1. **Read before write.** Open `STATUS.md`, phase-0 `TODO.md`, and the relevant spec before changing docs or data.
2. **Smallest correct change.** No drive-by refactors or speculative “while we’re here” features.
3. **Match local style.** Korean for many project prose docs; English for contracts, agent briefs, code, commits, ADRs. Match the file you edit.
4. **No secrets** in the repo, commits, logs, or shared memory.
5. **Commits:** create git commits when the owner asks or clearly allows it for the task. Prefer conventional, complete-sentence commit messages in English. Do not force-push or rewrite published history without explicit request.
6. **Verification:** after fixture or contract edits, re-check path/id consistency where practical. Do not claim tests/builds ran if they did not. There is **no** project build/test command until implementation starts.
7. **Shared team memory** (`agent-memory` / `~/.agent-team/shared-memory/`): on non-trivial work, read; after durable decisions or hand-offs, write short English bullets. Never store secrets.
8. **Peer consult** (Aria / Lira / Nox): advisory only; task owner remains the agent the user is talking to unless reassigned.

---

## What to edit freely vs what needs approval

| Allowed without “implementation start” | Needs explicit owner approval |
|----------------------------------------|-------------------------------|
| Specs, STATUS, TODO, README, charter links | App scaffold, `package.json`, lockfiles |
| Fixture JSON / placeholder GLBs within phase-0 IDs | New stack ADRs that claim a lock |
| Agent briefs (`AGENTS.md`, `CLAUDE.md`, `.grok/rules/`) | Application source under `src/` (or equivalent) |
| Decision log *open questions* | Tags (`vertical-slice-v0`), deploy pipeline |

---

## Quick start for a new session

1. Read this file.
2. Skim [`STATUS.md`](STATUS.md) and [`docs/phases/phase-0/TODO.md`](docs/phases/phase-0/TODO.md).
3. If touching data shapes: [`docs/phases/phase-0/specs/vertical-slice-data-contract.md`](docs/phases/phase-0/specs/vertical-slice-data-contract.md).
4. If implementation is requested: **stop and confirm stack + scope** with the owner first unless they already named both.
5. Update `STATUS.md` / phase TODO when durable state changes.
6. Optionally: `agent-memory search "pb3"` and write hand-off facts after decisions.

---

## Harness prefix files in this repo

| Path | Who loads it |
|------|----------------|
| [`AGENTS.md`](AGENTS.md) | Grok, Codex, and other AGENTS-aware tools (this file) |
| [`CLAUDE.md`](CLAUDE.md) | Claude Code (+ Grok Claude-compat); thin pointer + hard gates |
| [`.grok/rules/pb3-phase-0.md`](.grok/rules/pb3-phase-0.md) | Grok Build project rules (hard gates, always scanned) |

Do not hand-edit global identity copies under `~/.grok/`, `~/.claude/`, `~/.codex/` for project facts — put project facts **here**.
