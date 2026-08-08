# Phase 2 — Basic Estimate Service

Status: **owner-accepted (2026-08-08)** — scope and all M0 open decisions
accepted; implementation **not started**
Canonical reference for phase-2 bounds. Detailed field shapes live in
[`compatibility-data-contract.md`](./compatibility-data-contract.md).

This phase connects **general part selection**, **part filtering**, **logical
compatibility**, **price aggregation**, and **save/share behavior** into the
existing Phase 0/1 app. It matches the baseline of an ordinary parts-picker site
per charter §4 "2단계"; it is not the technically hardest phase and does not
reopen 3D scope.

Authority: [PROJECT_CHARTER.md](../../../PROJECT_CHARTER.md) §4 "2단계 — 기본
견적 서비스".

This document is a **planning artifact (M0 gate)**. It fixes scope so an
`implementation_plan.md` can be written and reviewed. Owner acceptance of this
document (recorded in `STATUS.md`, 2026-08-08) does **not** by itself
authorize implementation — that requires a separate explicit "start
implementation" instruction.

---

## 1. Goal

Design (not yet implement) three cooperating pieces on top of the existing
`vs0` `BuildState` / `perf1` performance engine:

1. **General part selection + filtering** — every catalog category becomes a
   real picker (not just CPU/GPU), with simple attribute filters.
2. **Logical compatibility** — a structured compatible / incompatible /
   unavailable report over selection pairs, driven by declared spec fields
   (socket, chipset, BIOS, RAM type/speed, PSU wattage, form factor). No
   physical geometry.
3. **Price aggregation** — static fixture price per part, summed for the
   current build, clearly labeled as non-live.
4. **Save/share continuity** — extend the existing URL-first save/share model
   to the larger `BuildState` without breaking `vs0` canonical links.

---

## 2. Inventory boundaries (M0 decision — do not expand silently)

Phase 2 inventory is a **deliberate, bounded** expansion over Phase 0/1. This
table is the scope lock for phase 2; any further growth requires a documented
decision, not an incidental fixture addition.

### 2.1 Reused unchanged from Phase 0/1

| Kind | Count | Fixed IDs |
|------|------:|-----------|
| CPU | 2 | `cpu.zen4-7600`, `cpu.zen4-7800x3d` |
| GPU | 2 | `gpu.rtx4070`, `gpu.rtx4080` |
| Cooler | 1 | `cooler.air-twin-tower-01` |
| Game | 1 | `game.cyberpunk-2077` (still a phase-0 constant) |
| Preset | 1 | `preset.raster-ultra` (still a phase-0 constant) |
| Resolutions | 3 | `1080p`, `1440p`, `4k` |

CPU, GPU, cooler, game, and preset counts do **not** grow in phase 2. The
charter scopes "general part selection" to picking among **existing and newly
added catalog categories**, not to widening every category at once.

### 2.2 Expanded from a single fixed instance to a real picker

| Kind | Phase 0/1 count | Phase 2 target count | Why expand |
|------|---:|---:|---|
| Case | 1 | 2 | Needed to exercise a real case picker and a case↔motherboard form-factor compatibility check (ATX vs Micro-ATX) |
| Motherboard | 1 | 2 | Needed to exercise a real motherboard picker and CPU-socket / chipset / BIOS compatibility checks across two different boards |

`case.mid-tower-atx-01` and `mb.atx-b650-01` remain valid IDs; phase 2 adds one
sibling id per category rather than replacing the phase-0 fixtures.

### 2.3 New categories

| Kind | Count | Role |
|------|------:|------|
| RAM (as a catalog part, `ram.*`) | 2 | Real selectable RAM kit (capacity, speed, type) — distinct from the `perf1` RAM **tier** dimension (`ram.16gb-ddr5` / `ram.32gb-ddr5`); see §5 for why these stay separate in phase 2 |
| PSU (`psu.*`) | 2 | Real selectable PSU (wattage, form factor) for price aggregation and a wattage-sufficiency compatibility check |

New categories start at 2 SKUs each — enough to prove selection, filtering, and
at least one incompatible pairing per category, matching the "depth over
breadth" principle (charter §2).

### 2.4 Explicitly out of scope for Phase 2 inventory

| Category | Status |
|----------|--------|
| Storage (SSD/HDD) | Out of scope for phase-2 M0. No compatibility rule is proposed for it yet; revisit in a later phase or a phase-2 amendment before adding it |
| Case fans, additional coolers, AIO liquid coolers | Out of scope |
| Peripherals (monitor, keyboard, mouse) | Out of scope |
| Additional games/presets | Out of scope — still phase-0 constants |
| Any category not listed in §2.1–§2.3 | Out of scope until a documented decision reopens catalog scope |

### 2.5 Fixture count summary (target, M0 draft)

```text
2 case + 2 motherboard + 2 CPU + 2 GPU + 1 cooler + 2 RAM + 2 PSU = 13 parts
```

Up from 7 parts in Phase 0. This count is a planning target for the
`implementation_plan.md` fixture step, not yet checked-in fixture data.

---

## 3. Logical compatibility model

### 3.1 Principle

Logical compatibility compares **declared spec fields** in `part.json` (or a
sibling spec file) for equality/threshold rules. It never inspects 3D geometry,
never runs collision or clearance checks, and never needs `model.glb`. Physical
fit remains Phase 3 (charter §4 "3단계").

### 3.2 Compatibility inputs

A compatibility check runs over the current selection subset:

- `caseId`
- `motherboardId`
- `cpuId`
- `gpuId`
- `ramId`
- `psuId`

`coolerId` is **not** a phase-2 compatibility input (no logical cooler-socket
rule is defined this phase; cooler mounting is physical, deferred to Phase 3).

### 3.3 Compatibility dimensions (M0 decision)

| Check | Compares | Result basis |
|-------|----------|---------------|
| CPU socket ↔ motherboard socket | `cpu.socket` vs `motherboard.socket` | Equality |
| Motherboard chipset ↔ BIOS support for CPU | `motherboard.chipset` + `motherboard.biosMinVersionForCpu[cpuId]` (fixture-declared map) | Table lookup; **unavailable** (not "compatible") when the CPU/chipset pair has no declared BIOS entry — never assume compatibility from a missing row |
| RAM type/speed ↔ motherboard support | `ram.memoryType` + `ram.speedMtS` vs `motherboard.supportedMemoryType` + `motherboard.maxMemorySpeedMtS` | Type equality + speed ≤ max |
| PSU wattage ↔ estimated system draw | `psu.wattage` vs `cpu.tdpWatts + gpu.tdpWatts` × `PSU_HEADROOM_MULTIPLIER = 1.3` (stub constant, 30% headroom; owner-accepted 2026-08-08, to be replaced by a real draw model later) | Threshold with fixed margin (see contract §4.4); never a measured live draw |
| Case form factor ↔ motherboard form factor | `case.supportedFormFactors` vs `motherboard.formFactor` | Set membership |

These five checks are the complete phase-2 compatibility surface. No socket
pin-count negotiation, no multi-GPU, no PCIe lane arbitration — those are not
in the charter's phase-2 dimension list and are not added here.

### 3.4 Output shape (structured, never a single boolean)

Each check returns one of three statuses:

- `compatible` — the compared fields satisfy the rule.
- `incompatible` — the compared fields fail the rule; **a human-readable
  explanation is mandatory** on every incompatible result.
- `unavailable` — one or both parts lack the declared spec field needed for
  this check (e.g. missing BIOS map entry). Never defaults to `compatible`.

A build-level `CompatibilityReport` aggregates all five checks plus an overall
status (`incompatible` if any check is `incompatible`; else `unavailable` if
any check is `unavailable`; else `compatible`). Full types: contract §4.

### 3.5 Explicitly out of scope

- Physical collision, clearance, or mounting geometry (Phase 3).
- GLB anchor/socket runtime validation (Phase 3).
- Cooling/airflow adequacy (Phase 1 environment correction covers user-declared
  cooling buckets for performance only, not a phase-2 compatibility check).
- Multi-part combinatorial optimization ("suggest a compatible build").

---

## 4. Price aggregation

### 4.1 Strategy (M0 decision)

Phase 2 prices are **static fixture data**, one price record per part id,
checked into `benchmarks/price2/` (or an equivalent fixture path decided in the
implementation plan) alongside the existing `parts/` and `benchmarks/` SSOT.
Prices are explicitly **not** live: no price API, no scraping, no per-vendor
comparison.

- Each priced part carries a currency, a numeric amount, and a `basis` string
  identical in spirit to the `perf1` epistemic discipline (e.g. `"phase-2
  fixture price; not a live market quote"`).
- Missing price for a selected part → that line is `unavailable`, not `0` and
  not silently excluded from the sum's presentation (the UI must say a price
  is missing, not just skip it invisibly).
- Total price is a sum **only** over parts with an available fixture price. If
  any priced part is unavailable, the aggregate total is shown as **partial**
  (labeled), not silently short.

### 4.2 Live pricing

Explicitly out of scope for phase 2. Any future live pricing (vendor APIs,
scraping, affiliate feeds) requires its own accepted decision (likely a new
ADR touching ADR-001's "no first-party backend" scope, since live pricing at
scale usually implies a server-side fetch/cache layer) before any phase reopens
it. This document does not pre-approve that direction.

---

## 5. Save/share behavior

### 5.1 Continuity requirement

The existing `vs0` canonical share link (§6 of
[`vertical-slice-data-contract.md`](../../phase-0/specs/vertical-slice-data-contract.md))
must keep decoding successfully after phase 2 ships. A user who saved a
Phase-0/1-era link must still be able to open it and get a valid (if
phase-2-default-filled) build.

### 5.2 Mechanism (M0 decision)

- Persistence mechanism stays **URL query string as the authoritative store**,
  consistent with ADR-001 (static SPA, no server-mediated share) and the
  existing `vs0` pattern. Optional non-authoritative `localStorage` caching is
  allowed under the same rule as Phase 0 (reload must still work from the URL
  alone).
- `BuildState` gains new fields (`ramId`, `psuId`) and the case/motherboard
  fields go from single fixed values to real selections. Per the `vs0` rule
  "bump only on breaking field change; never silently widen," this is a
  **contract version bump**: `vs0` → `vs2` for the `BuildState`/URL contract.
  (Numbering follows the `BuildState` contract's own lineage — `vs0` is the
  only prior version — not the separate `perf1` performance contract
  lineage.)
- **Decoder backward compatibility:** a URL with `v=vs0` (no `ram`/`psu` keys)
  must still decode into a valid `vs2` `BuildState` by filling `ramId` and
  `psuId` from the phase-2 default fixture. A `v=vs0` link is accepted as a
  **compatibility input**, matching how `vs0` itself already treats partial
  links — never re-emitted as canonical.
- **Encoder:** going forward, the canonical share link is always the full
  `vs2` form (`v=vs2` plus every field, mirroring the `vs0` "encoder always
  writes every field" rule).
- No accounts, no server-mediated share, no shortened/opaque share codes
  requiring a backend. Full details: contract §5.

### 5.3 Explicitly out of scope

- Backend-backed share codes or shortlinks.
- Multi-user saved-build libraries / accounts.
- Any mechanism requiring authentication.

---

## 6. Continuity with existing systems

- **Phase 0 `BuildState`/URL** — extended, not replaced (see §5.2). `caseId`,
  `motherboardId`, `cpuId`, `gpuId`, `coolerId`, `gameId`, `presetId` keep
  their existing meaning; `game`/`preset` remain constants.
- **Phase 1 `perf1` engine** — unchanged. `BaselineQuery` still excludes case,
  motherboard, cooler, and (per §2.3 of this doc) the new `ramId`/`psuId`
  catalog fields. The `perf1` RAM **tier** dimension (`ram.16gb-ddr5` /
  `ram.32gb-ddr5`) is a distinct, already-accepted vocabulary from the phase-2
  RAM **catalog part** (`ram.*` ids with capacity/speed/type spec fields).
  Mapping a selected RAM SKU to a `perf1` RAM tier (so performance estimates
  react to the actual RAM chosen) is **not decided in phase 2 M0** — see §9
  open decisions. Until decided, the performance panel keeps using its own
  independent RAM tier control.
- **Logical compatibility stays separate from physical validation and
  performance correction** per charter §2: the phase-2 compatibility report
  never touches 3D geometry (Phase 3) and never mutates a `perf1`
  `PerformanceEstimate` or `CorrectionResult`.

---

## 7. Error and uncertainty policy

Same discipline as `vs0` and `perf1`, restated for phase 2's new data:

- A compatibility check with insufficient declared spec data returns
  `unavailable` with a reason — never assumed `compatible`.
- A missing price returns an `unavailable` price line — never `0` and never a
  value invented from a similar part.
- An invalid or unrecognized part id in a filter or selection returns a
  structured empty/invalid result — never a silently substituted default part
  (URL decode is the one place defaults apply, per §5.2, and that is documented
  fallback behavior, not invention).
- Nothing in phase 2 invents compatibility, price, or performance values.

---

## 8. Completion scenario (draft — to be finalized in the implementation plan)

This is a **draft** shape for the eventual phase-2 exit scenario; it is not
binding until `implementation_plan.md` and its own exit checklist are written
and reviewed:

1. User browses the expanded catalog (case, motherboard, CPU, GPU, RAM, PSU)
   with at least one working filter (e.g. by category attribute).
2. User selects a full build across all six selectable categories.
3. Compatibility report shows all five checks with a status and (for any
   incompatible check) a explanation.
4. Price panel shows a per-part price and a build total, or a labeled partial
   total if any price is unavailable.
5. User copies the canonical share URL; reload restores the same build,
   compatibility report, and price panel.
6. A saved `vs0`-era link (Phase 0/1 style, missing RAM/PSU) still opens and
   decodes to a valid build with phase-2 defaults filling the new fields.
7. An intentionally incompatible pairing (e.g. mismatched socket) shows
   `incompatible` with an explanation, never a silently "compatible" build.

---

## 9. M0 decisions record

All decisions this document originally flagged as open were resolved by the
owner on 2026-08-08:

| Decision | Resolution |
|----------|------------|
| Fixture file layout/paths for RAM/PSU parts and price records | Compatibility examples: `benchmarks/compat2/compatibility-examples.json`. Price fixtures: `benchmarks/price2/price-fixtures.json` (separate path from compatibility examples) |
| Whether a selected RAM SKU should drive the `perf1` RAM tier automatically | **Deferred** — not wired in phase 2. The `perf1` RAM tier control stays independent; `perf1` code is not touched by phase 2 |
| PSU headroom margin (§3.3) | `PSU_HEADROOM_MULTIPLIER = 1.3` (30% headroom), a stub constant documented in code and in the data contract, to be replaced by a real power-draw model in a later phase |
| Currency for phase-2 fixture prices | `USD`, fixed for all phase-2 price fixture rows |
| `PartDefinition` shape for compat spec fields | Nested `compatSpec` block (e.g. `{ "compatSpec": { "socket": "AM5", "tdpWatts": 65 } }`), not inline top-level fields |
| Phase 2 E2E coverage | **Required**, not optional — `e2e/phase2-compat-price.spec.ts` is part of the implementation-plan Step 8 test gate |

Remaining, not decided by this document (unchanged from the original draft):

| Decision | Status |
|----------|--------|
| Storage category and any further catalog expansion | Explicitly deferred, not decided here |
| Filtering UI scope (which attributes are filterable) | Deferred to `implementation_plan.md` UI integration section (implementation-time decision, not a blocker for starting) |

---

## 10. Explicitly forbidden in phase 2

| Forbidden | Rationale |
|-----------|-----------|
| Physical collision, clearance, mounting, or cooling geometry | Phase 3 |
| GLB anchor/socket runtime validation | Phase 3 |
| Live price APIs, scraping, affiliate, cart, checkout | Commercial surface; needs its own decision |
| Accounts, auth, server-mediated share/sync | Static SPA scope (ADR-001) |
| Expanding CPU/GPU/cooler/game/preset counts | Scope lock — unchanged from Phase 0/1 |
| Adding storage or any category beyond §2.1–§2.3 | Scope lock |
| Inventing compatibility, price, or performance values when data is missing | Charter §2 |
| Changing the `vs0` URL contract meaning (only additive `vs2` bump, with `vs0` accepted as legacy decode input) | §5.2 |
| Modifying `perf1` baseline/correction/workload behavior | Out of phase-2 scope; only integration question is the open RAM-tier mapping in §9 |
| Starting Phase 2 implementation from this document alone | Requires `implementation_plan.md` first, per the plan-before-code convention |

---

## 11. Deliverable order inside phase 2 (M0 gate)

1. This document (scope lock) — **owner-accepted (2026-08-08)**
2. [`compatibility-data-contract.md`](./compatibility-data-contract.md) — types for
   compatibility, price, and the `vs2` `BuildState`/URL extension —
   **owner-accepted (2026-08-08)**
3. [`implementation_plan.md`](../implementation_plan.md) — ordered, file-level
   plan — **owner-accepted (2026-08-08)**; execution requires a separate
   explicit "start implementation" instruction
4. Fixture data (RAM/PSU parts, price records, expanded case/motherboard
   siblings) — **not started**
5. Implementation → phase-2 exit scenario — **not started**

---

## 12. Related documents

| Document | Role |
|----------|------|
| [PROJECT_CHARTER.md](../../../PROJECT_CHARTER.md) | Philosophy; §4 phase 2 |
| [STATUS.md](../../../STATUS.md) | Living "what is decided" |
| [PHASES.md](../../roadmap/PHASES.md) | Phase list |
| [phase-0.md](../../phase-0/specs/phase-0.md) | Predecessor slice |
| [vertical-slice-data-contract.md](../../phase-0/specs/vertical-slice-data-contract.md) | `vs0` types (URL + catalog wiring) — extended by `vs2` |
| [phase-1.md](../../phase-1/specs/phase-1.md) | `perf1` engine scope — unchanged by phase 2 except the open RAM-tier question |
| [performance-data-contract.md](../../phase-1/specs/performance-data-contract.md) | `perf1` types |
| [phase-2 home](../README.md) | Specs index, TODO |
