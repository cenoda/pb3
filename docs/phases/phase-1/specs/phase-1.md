# Phase 1 — Performance Prediction Engine

Status: **owner-accepted (2026-08-08)** — scope, data contract, and fixtures accepted; implementation **not started**  
Canonical reference for phase-1 bounds. Detailed field shapes will live in
[`performance-data-contract.md`](./performance-data-contract.md) *(deliverable 2; not written yet)*.

This phase delivers an **explainable performance engine** with a clean split between
baseline performance under controlled conditions and a **limited** environment-correction
layer. It is not a product MVP and does not reopen Phase 0’s 3D scope.

Authority: [PROJECT_CHARTER.md](../../../PROJECT_CHARTER.md) §4 “1단계 — 성능 예측 엔진”
and §5 “성능 데이터 원칙”.

---

## 1. Goal

Design and implement two cooperating models:

### 1.1 Baseline performance model

Performance under **controlled baseline conditions**: adequate cooling, manufacturer
default power limits, and other normative “lab” assumptions documented per estimate.

- **Inputs:** CPU, GPU, game/workload, resolution, graphics preset, upscaling mode,
  frame generation (on/off), system RAM profile, implicit VRAM from GPU, default power
  limit profile.
- **Output:** FPS **range** (`fpsMin` / `fpsMax`), human-readable **basis**, **confidence**,
  **dataVersion**, and an explicit **bottleneck / limiting-factor** explanation (per charter
  §1 — not a single invented score).

### 1.2 Environment correction model

Adjusts baseline estimates when the user supplies **allowed** correction inputs. Phase 1
does **not** run real thermal or fluid simulation.

- **Allowed correction inputs only:**
  - CPU power limit tier (relative to default)
  - GPU power limit tier (relative to default)
  - Coarse cooling bucket — `sufficient` / `marginal` / `insufficient` — **user-selected
    or evidence-backed only; never guessed**
  - Load profile — transient vs sustained
- **When evidence is missing:** do not apply sustained-performance correction silently.
  Return an explicit withheld state (e.g. “sustained-performance correction was not
  computed”) alongside whatever baseline or partial correction is valid.
- **Forward compatibility:** the correction layer’s input interface must accept normalized
  values from a future Phase 3 cooling system (cooling headroom, intake restriction, etc.)
  without rewriting the baseline model.

The existing Phase 0 UI may continue to show performance ranges; Phase 1 upgrades the
**engine and explanations** behind that panel. No new 3D features are required to exit.

---

## 2. Supported inventory (fixed counts)

Do not add parts, games, or open-ended picker dimensions beyond this set during phase 1.
Phase 1 is about the **estimation model**, not catalog expansion.

### 2.1 Reused from Phase 0 (part / game fixtures)

| Kind | Count | Fixed IDs |
|------|------:|-----------|
| CPU | 2 | `cpu.zen4-7600`, `cpu.zen4-7800x3d` |
| GPU | 2 | `gpu.rtx4070`, `gpu.rtx4080` |
| Game | 1 | `game.cyberpunk-2077` |
| Graphics preset | 1 | `preset.raster-ultra` |
| Resolutions | 3 | `1080p`, `1440p`, `4k` |

Case, motherboard, and cooler IDs from Phase 0 remain in `BuildState` for URL continuity
but are **not** performance-engine lookup keys in phase 1.

### 2.2 New baseline dimensions (fixed allowed values)

| Dimension | Count | Fixed IDs | Role |
|-----------|------:|-----------|------|
| Upscaling mode | 2 | `upscale.off`, `upscale.dlss-quality` | Native raster vs one fixed DLSS Quality profile |
| Frame generation | 2 | `framegen.off`, `framegen.on` | Real baseline dimension — anticipates a future monitor/display spec (refresh rate, VRR) that FG interacts with; phase 1 does not model monitors, but keeping FG as a real dimension avoids re-deriving the baseline model later |
| System RAM profile | 2 | `ram.16gb-ddr5`, `ram.32gb-ddr5` | Baseline dimension — lets the model surface RAM-bound scenarios (charter §1 “RAM 한계” bottleneck) instead of hiding them behind a fixed profile |
| Baseline power profile | 1 | `power.default` | Manufacturer default CPU/GPU power limits |

**VRAM** is not a separate picker: it is **implicit** from `gpuId` (documented in the
data contract; fixture metadata may echo nominal GB for explanation only).

### 2.3 Environment correction dimensions (optional per query)

Each correction dimension is optional at query time. Omitting a dimension must not cause
a guess — see §3.2.

| Dimension | Count | Fixed IDs | Notes |
|-----------|------:|-----------|-------|
| CPU power limit | 2 | `cpu-power.default`, `cpu-power.reduced` | `reduced` = documented fixed offset from default (exact % in contract) |
| GPU power limit | 2 | `gpu-power.default`, `gpu-power.reduced` | Same discipline as CPU |
| Cooling bucket | 3 | `cooling.sufficient`, `cooling.marginal`, `cooling.insufficient` | User-selected or evidence-backed only |
| Load profile | 2 | `load.transient`, `load.sustained` | Sustained correction requires applicable fixture/evidence |

At the phase-1 scope-lock stage, the magnitude of `cpu-power.reduced` /
`gpu-power.reduced` is an **undetermined stub value** — `confidence: "stub"`, same as
every other unbacked phase-1 row. Per charter §5, there are two legitimate future paths
to back it with a real number:

1. **External review / community data** (charter §5 “외부 리뷰 자료”): cross-validate
   multiple third-party sources reporting FPS at a specific power-limit offset for the
   same or comparable CPU/GPU. This can raise confidence to `"low"` or `"medium"` —
   never `"high"`, since charter §5 explicitly disallows treating non-reproducible
   external data as high-confidence real measurement.
2. **First-party controlled measurement** (charter §5 “1차 출처”): run the actual
   hardware at a documented power limit and capture FPS via the raw benchmark ingestion
   pipeline (schema still undecided — see [`STATUS.md`](../../../STATUS.md) “아직 정하지
   않음” → 실측 벤치마크 원시 스키마). This is the only path that can reach `"high"`.

Neither path is implemented at the phase-1 scope-lock stage. Phase 1 only requires that
the `confidence` field (inherited from the `vs0` `EstimateConfidence` scale:
`"stub" | "low" | "medium" | "high" | "none"`) honestly reflects whichever of these, if
any, backs a given row — never present a `stub` / `low` / `medium` value as if it were
`"high"`.

### 2.4 Baseline lookup matrix size

Happy-path baseline fixtures must cover the full cross product:

```text
2 CPUs × 2 GPUs × 1 game × 1 preset × 3 resolutions × 2 upscaling modes
  × 2 frame-gen states × 2 RAM tiers = 96 rows
```

All stub rows remain `confidence: "stub"` until real benchmark ingestion exists.
Correction examples may be a **small separate table** (not necessarily 96 × correction
combinations).

### 2.5 Cinebench workload (new, CPU-only)

Architecturally separate from the game/FPS baseline path in §2.1–§2.4. Cinebench is
**CPU-only** — no `gpuId`, resolution, graphics preset, upscaling, or frame-generation
relevance. Output is a **score** (points), not an FPS range. Authority: charter §5
“작업 부하: 자동화·재현 가능한 공개 벤치마크 프로필 우선”.

| Dimension | Count | Fixed IDs | Notes |
|-----------|------:|-----------|-------|
| Cinebench version | 2 | `cinebench.r23`, `cinebench.2024` | Last “R”-branded release + first non-“R” release. A further version must not be added until its real name/existence is confirmed — do not invent a third ID now. |
| Metric | 2 | `metric.single-core`, `metric.multi-core` | Both stored per version, not just the headline multi-core number |

Matrix (separate table — **not** folded into the §2.4 FPS baseline):

```text
2 CPUs × 2 Cinebench versions × 2 metrics = 8 rows
```

Fully independent of the game/GPU/resolution/preset/upscale/FG axes in §2.1–§2.4.

---

## 3. In-scope behavior

### 3.1 Baseline path

```text
BaselineQuery → baseline model → BaselineEstimate (per resolution or bundled panel)
```

- Output is always a **range**, never a single fake FPS.
- Every supported estimate includes `confidence`, `dataVersion`, `basis`, and
  `limitingFactor` (or equivalent structured explanation): e.g. GPU-bound, CPU-bound,
  VRAM pressure, power limit, RAM-bound (exercisable via `ram.16gb-ddr5` in the baseline
  matrix) — whichever the model asserts for that combo.
- Unknown or unsupported baseline keys → structured `status: "unavailable"` — **do not**
  invent numbers.
- Conditions that differ materially from the baseline profile must not be merged into one
  number (charter §5 normalization).

### 3.2 Environment correction path

```text
BaselineEstimate + CorrectionInput (partial allowed) → correction layer → CorrectedEstimate
```

- Applying an **allowed** correction input changes the range (or applicable sub-range) and
  appends a visible **reason** tied to the correction (e.g. power limit reduction,
  insufficient cooling under sustained load).
- **Cooling bucket** values are never inferred by the engine; they must be user-selected
  or backed by declared evidence (future Phase 3 may supply evidence).
- **Sustained load** without applicable correction data → explicit withhold message;
  baseline (or non-sustained partial correction) may still be shown.
- Correction inputs outside §2.3 are rejected or ignored with a clear “not supported in
  phase 1” outcome — not silently clamped to a default guess.

### 3.3 Phase 3 interface hook (design only in docs first)

The correction layer exposes a stable input surface (names TBD in the data contract) so
Phase 3 can later supply normalized cooling signals, for example:

- cooling headroom (normalized scalar or bucket mapping)
- intake restriction severity
- evidence source id (3D layout vs user override)

The baseline model API does not change when those inputs appear.

A future display/monitor input (refresh rate in Hz, VRR support) is expected to interact
with the frame generation dimension; keeping FG as a real baseline dimension now (rather
than a constant) is intentional preparation for that, without adding monitor scope to
phase 1.

### 3.4 Integration with Phase 0 app

- CPU/GPU selection and URL persistence behave as today (`vs0` `BuildState`).
- Performance panel continues to show per-resolution ranges for the fixed game/preset;
  phase 1 may add correction controls and explanation text but must not require new GLB
  work or viewport features to exit.
- Phase 0 E2E exit scenario must remain green throughout phase 1 unless the owner
  explicitly expands the regression suite.

### 3.5 Cinebench workload path

```text
WorkloadQuery → workload model → WorkloadEstimate
```

A `WorkloadEstimate` output **distinct from** `PerformanceEstimate` — no `gpuId`, no
resolution/preset/upscale/FG fields. Shape (names finalized in the data contract):

- `cpuId`
- `workloadId` (Cinebench version: `cinebench.r23` or `cinebench.2024`)
- `metric` (`metric.single-core` or `metric.multi-core`)
- `score` (points — never invent when data is missing)
- `confidence`, `dataVersion`, `basis`

Same “never invent a number” discipline as the FPS path. Confidence follows the ladder
established in §2.3 (external review / community aggregation → `"low"` or `"medium"`;
first-party controlled measurement → `"high"` only) — reuse that paragraph by reference,
do not treat Cinebench as a special case.

- Unknown or unconfirmed Cinebench version ID → structured `status: "unavailable"`.
- **Out of scope for phase 1:** applying the environment-correction model (§3.2 — power
  limit, cooling bucket, sustained load) to Cinebench scores. Baseline Cinebench scores
  only; correction-under-Cinebench is a future decision, not assumed now.

---

## 4. Completion scenario (must work end-to-end)

Performance-engine-only success path (3D behavior is inherited from Phase 0; no new 3D
requirements):

1. User opens the app with a supported CPU/GPU build (default or restored URL).
2. User views performance for `game.cyberpunk-2077` / `preset.raster-ultra` across
   `1080p`, `1440p`, and `4k` → each resolution shows an **explained range** (basis,
   confidence, dataVersion, limiting factor).
3. User switches `upscale.off` ↔ `upscale.dlss-quality` (when exposed in UI or via
   documented test harness) → ranges update with an explanation of what changed.
4. User switches `framegen.off` ↔ `framegen.on` (when exposed in UI or via documented
   test harness) → ranges update with an explanation of what changed.
5. User queries an **unsupported** combo (e.g. unknown upscaling id or out-of-matrix part
   pair in tests) → structured **unavailable**, never an invented FPS.
6. User applies an allowed correction (e.g. `cooling.insufficient` + `load.sustained`
   with matching stub evidence) → range changes and the UI shows **why**.
7. User omits sustained correction evidence (or selects sustained without data) → app states
   explicitly that sustained-performance correction was **not computed**; no silent skip.
8. Reload preserves build state; performance output remains consistent with the same inputs.
9. User queries a supported CPU + confirmed Cinebench version (`cinebench.r23` or
   `cinebench.2024`) + metric (`metric.single-core` or `metric.multi-core`) → returns a
   scored `WorkloadEstimate` with basis and confidence; querying an unconfirmed or unknown
   version ID → structured **unavailable**, same discipline as the FPS path.

Checklist (to be automated in implementation):

- [ ] Supported baseline combo returns explained range for all three resolutions.
- [ ] Unsupported combo returns structured unavailable.
- [ ] Allowed correction input changes range with visible reason.
- [ ] Withheld correction never triggers a guessed sustained derate.
- [ ] Supported Cinebench CPU + version + metric returns scored `WorkloadEstimate`.
- [ ] Unknown/unconfirmed Cinebench version returns structured unavailable.
- [ ] Phase 0 exit scenario still passes (`pnpm test:all`).

---

## 5. Explicitly forbidden in phase 1

Do not implement, design deeply for, or expand fixtures toward:

| Forbidden | Rationale |
|-----------|-----------|
| Real thermal, airflow, or fluid simulation | Charter §4; Phase 3 cooling |
| Inferring cooling bucket without user or evidence | Charter §4 |
| Full logical compatibility engine | Phase 2 |
| 3D collision, clearance, anchors, mounting, cooling mesh | Phase 3; frozen from Phase 0 §6 |
| Extra cases, boards, CPUs, GPUs, coolers, games, presets beyond §2 | Scope lock |
| RGB, cable routing, assembly animation | Phase 0 non-goals; still frozen |
| Live price APIs, cart, affiliate | Commercial surface |
| Login, accounts, community, backend, database, auth | Static SPA scope |
| Public deploy requirement | Local verification sufficient |
| PresentMon / bench runner implementation in-app | Ingestion pipeline follows contract + fixtures |
| Presenting `*.reduced` power-tier offsets as measured/verified values without real benchmark evidence | §2.3 epistemic rule; ingestion schema still open |
| Applying environment correction (power/cooling/load) to Cinebench scores | Deferred to a future phase decision; not in phase-1 scope |
| Inventing a Cinebench version ID/name not confirmed to exist | Charter §2 “모르는 것은 추정하지 않는다” |
| Inventing FPS or confidence when data is missing | Charter §2, §5 |

If a task is not required by §3 or §4, it is out of scope.

---

## 6. Exit criteria and freeze

**Exit when** the §4 scenario works on a clean checkout with phase-1 fixture data (stub
confidence allowed) and Phase 0 regression stays green.

Then:

1. Record phase-1 completion in [`STATUS.md`](../../../STATUS.md) and [`TODO.md`](../TODO.md).
2. **Lift the Phase 0 3D freeze** ([`phase-0.md` §6](../phase-0/specs/phase-0.md)): Phase 3
   3D assembly and cooling work may resume on a later phase plan; phase 1 itself does not
   implement that 3D scope.
3. Do not expand part or game counts until a later phase explicitly reopens catalog scope.

Until phase 1 exits, Phase 0’s freeze remains in force: 3D changes are limited to
data-contract fixes and exit-scenario regression fixes only.

---

## 7. Non-goals for documents produced in phase 1

Phase 1 docs must **not** attempt to finalize in this scope document:

- Raw benchmark ingestion schema, runner config, or PresentMon field mapping
- Complete production `part.json` commercial fields
- Full Phase 3 cooling node schema or GLB anchor rules
- UI design system or marketing copy
- Application stack choice (locked by ADR-001–003)

**Next deliverable:** [`performance-data-contract.md`](./performance-data-contract.md) —
baseline + correction types, normative unavailable/withhold rules, raw benchmark record
shape, and contract version bump policy. Write only after this scope doc is accepted.

---

## 8. Deliverable order inside phase 1

1. This document (scope lock) — **owner-accepted (2026-08-08)**
2. [`performance-data-contract.md`](./performance-data-contract.md) — **owner-accepted (2026-08-08)**
3. Fixture stub data — **owner-accepted (2026-08-08)**, `benchmarks/perf1/`:
   - Baseline FPS table (96 rows), correction examples, unavailable / withhold examples
   - Cinebench workload table (8 rows; §2.5)
   All happy-path stubs marked `confidence: "stub"`
4. [`implementation_plan.md`](../implementation_plan.md) — ordered, file-level plan
   (next; owner approval of scope + contract now given)
5. Implementation → exit §4 → lift Phase 0 3D freeze

---

## 9. Related documents

| Document | Role |
|----------|------|
| [PROJECT_CHARTER.md](../../../PROJECT_CHARTER.md) | Philosophy; §4 phase 1, §5 performance data principles |
| [STATUS.md](../../../STATUS.md) | Living “what is decided” |
| [PHASES.md](../../roadmap/PHASES.md) | Phase list |
| [phase-0.md](../phase-0/specs/phase-0.md) | Predecessor slice; 3D freeze authority |
| [vertical-slice-data-contract.md](../phase-0/specs/vertical-slice-data-contract.md) | Phase 0 `vs0` types (URL + panel wiring) |
| [phase-1 home](../README.md) | Specs index, TODO |
| [TODO.md](../TODO.md) | Working checklist |
