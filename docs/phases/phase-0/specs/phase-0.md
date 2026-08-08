# Phase 0 — Vertical Slice

Status: **fixed scope** (implementation not started)  
Canonical reference for phase-0 bounds. Detailed field shapes live in
[`vertical-slice-data-contract.md`](./vertical-slice-data-contract.md).

This phase is a **technical connection check**, not a product MVP.
When the exit scenario works end-to-end, stop and tag `vertical-slice-v0`.

---

## 1. Goal

Prove that one thin path connects:

1. User selects CPU and GPU on a single build screen.
2. `BuildState` updates.
3. The 3D view swaps the GPU model from the selected part’s GLB.
4. Expected FPS **ranges** refresh for the fixed game across **three resolutions**.
5. A full page reload restores the same build from the URL.

If that path works, phase 0 is done. Everything else waits.

---

## 2. Supported inventory (fixed counts)

Do not add parts beyond this set during phase 0.

| Kind | Count | Fixed IDs (contract fixtures) |
|------|------:|-------------------------------|
| Case | 1 | `case.mid-tower-atx-01` |
| Motherboard | 1 | `mb.atx-b650-01` |
| CPU | 2 | `cpu.zen4-7600`, `cpu.zen4-7800x3d` |
| GPU | 2 | `gpu.rtx4070`, `gpu.rtx4080` |
| Cooler | 1 | `cooler.air-twin-tower-01` |
| Game | 1 | `game.cyberpunk-2077` |
| Graphics preset | 1 | `preset.raster-ultra` |
| Resolutions | 3 | `1080p`, `1440p`, `4k` |

Notes:

- IDs are stable strings used in JSON, TypeScript, and URL state.
- Display names may change later; IDs must not without a contract version bump.
- Performance numbers in fixtures are **explicit stubs** for wiring, not real benchmarks.
  They must still carry `confidence`, `dataVersion`, and human-readable `basis` so the UI never pretends to know more than it does.

---

## 3. In-scope behavior

### 3.1 Single build screen

One screen that shows at least:

- CPU selector (exactly the two CPUs)
- GPU selector (exactly the two GPUs)
- Read-only summary of the fixed case, motherboard, cooler, game, and preset
- 3D viewport of the current build (at minimum: case + selected GPU visible and swappable)
- Performance panel: for the fixed game + preset, show an FPS **range** for each of the three resolutions
- Current `dataVersion` / confidence visible next to estimates (even if small text)

CPU and cooler remain on the board for state completeness; phase 0 does not require animated CPU install or cooler mesh swaps if time is tight, but:

- **GPU mesh swap is mandatory** when `gpuId` changes.
- Performance **must** recompute when `cpuId` or `gpuId` changes.

### 3.2 Parts as data files

Each part is loadable without code changes beyond dropping files under `parts/`:

```text
parts/{category}/{id}/part.json
parts/{category}/{id}/model.glb
```

Phase 0 may ship placeholder GLBs (simple boxes) as long as paths resolve and GPU swap is visible.

### 3.3 Build state persistence

- Source of truth while running: in-memory `BuildState`.
- Persistence: **URL query string** (required). Optional `localStorage` is allowed only as a non-authoritative cache; reload must work from the URL alone.
- Encoding rules: see the data contract.

### 3.4 Performance path (stub OK)

```text
BuildState → PerformanceQuery (per resolution) → PerformanceEstimate
```

- Output is always a **range** (`fpsMin` / `fpsMax`), never a single fake “score”.
- Every estimate includes `confidence`, `dataVersion`, and `basis`.
- If a combo has no fixture row, return a structured “unavailable” estimate — do **not** invent numbers.

---

## 4. Completion scenario (must work end-to-end)

The following is the only success path that closes phase 0:

1. User opens the app with the default build (or a clean URL).
2. User selects the other CPU → build state updates → performance ranges for all three resolutions update.
3. User selects the other GPU → build state updates → **3D GPU model swaps** → performance ranges update.
4. User copies the URL (or reloads the page) → the same CPU, GPU, and derived performance view are restored.
5. Changing CPU/GPU again still works after restore.

Checklist (same as exit criteria):

- [ ] User can select CPU and GPU.
- [ ] `BuildState` changes with selection.
- [ ] 3D view replaces the GPU when `gpuId` changes.
- [ ] Per-resolution expected performance ranges refresh for the fixed game/preset.
- [ ] Full reload restores the same configuration from the URL.

---

## 5. Explicitly forbidden in phase 0

Do not implement, design deeply for, or expand fixtures toward:

| Forbidden | Rationale |
|-----------|-----------|
| Extra cases, boards, CPUs, GPUs, coolers, games, presets | Scope lock |
| RGB editing, cable routing, assembly animation | Polish / later 3D |
| Precise collision, clearance, auto-fit | Phase 3 |
| Anchor/socket runtime mounting logic | Phase 3 (GLB may omit real anchors) |
| Cooling / airflow simulation or thermal derating | Phase 1+ / 3 |
| Login, accounts, community, comments | Product surface |
| Live price APIs, cart, affiliate | Commercial surface |
| Admin CMS, bulk import tools | Ops surface |
| AI model generation pipeline | Tooling later |
| Real PresentMon / bench collection runners | After schema + phase 1 engine |
| Logical compatibility engine beyond the fixed set | Phase 2 |
| UI polish, design system, marketing pages | Not required to exit |
| Backend, database, auth | Static client is enough |
| Multi-language UI | Optional later |

If a task is not required by section 3 or 4, it is out of scope.

---

## 6. Exit criteria and freeze

**Exit when** the section 4 scenario works on a clean checkout with fixture data only.

Then:

1. Tag the repository: `vertical-slice-v0`.
2. Freeze further 3D feature work until **phase 1 (performance engine)** completes.
3. During the freeze, only these 3D-related changes are allowed:
   - Data-contract breakage fixes
   - Bugs that make the slice scenario fail
4. Do not expand part counts or add games until a later phase explicitly reopens that scope.

---

## 7. Non-goals for documents produced in phase 0

Phase 0 docs must **not** attempt to finalize:

- Full production `part.json` for all commercial fields
- Complete benchmark ingestion pipeline
- Environment-correction model details beyond a stub `basis` string
- License text for code vs assets (tracked separately later — resolved for code/data by [`ADR-004`](../../decisions/ADR-004-license-code-apache-2.0.md); 3D assets still open)
- Application stack choice (decided **after** this contract is accepted — resolved by [`ADR-001`](../../decisions/ADR-001-runtime-static-spa.md)–[`ADR-003`](../../decisions/ADR-003-stage3-tooling-and-fixtures.md))

---

## 8. Deliverable order inside phase 0

1. This document (scope lock) — **done**
2. [`vertical-slice-data-contract.md`](./vertical-slice-data-contract.md) with types + examples — **done**
3. Fixture `part.json` (+ placeholder GLBs) and performance fixture table — **done**
4. Stack decision + scaffold (only after explicit implementation approval) — **not started**
5. Implement the exit scenario → tag `vertical-slice-v0`

---

## 9. Related documents

| Document | Role |
|----------|------|
| [PROJECT_CHARTER.md](../../../PROJECT_CHARTER.md) | Philosophy and multi-phase plan |
| [vertical-slice-data-contract.md](./vertical-slice-data-contract.md) | Types, JSON, URL rules |
| [STATUS.md](../../../STATUS.md) | Living “what is decided” |
| [PHASES.md](../../roadmap/PHASES.md) | Phase list |
| [VERTICAL_SLICE_EXIT_CRITERIA.md](../../verification/VERTICAL_SLICE_EXIT_CRITERIA.md) | Pointer to this exit checklist |
| [phase-0 home](../README.md) | Specs index, TODO, fixes |
