# Phase 6 — STEPS.md

Step closeout records. Home: [`README.md`](./README.md) ·
Plan: [`implementation_plan.md`](./implementation_plan.md) ·
Migration: [`ID_MIGRATION.md`](./ID_MIGRATION.md)

---

# Step 6 — Visual geometry and physical authority boundary

## 1. What was built (Step 6, 2026-08-10)

- **Authority model.** `kind === "clearance-limit"` checks from published catalog
  facts are authoritative. OBB `collision` / `clearance` geometry (from GLB
  bounds, overlap, missing `physicalSpec`) is **advisory-only**: it supports 3D
  preview, assembly visualization, and debug overlap signals, and never sets
  `overallStatus`, build verdict, blocked/caution/showResults, or factual reason
  text.
- **Scalar clearance-limit evaluator**
  (`src/physical/clearanceLimit/evaluateClearanceLimits.ts`): evaluates
  `maxCpuCoolerHeight` / `maxGpuLength` / `maxPsuLength` from published case
  `clearanceLimits` against selected parts' `dimensionsMm`, reporting `fit` /
  `interference` / `conditional` / `unavailable` per **C13** with conservative
  `appliesWhen` pruning. `conditional` is now a `PhysicalValidationStatus`
  member (**B3** resolved).
- **CPU collision geometry removed.** The synthetic `collision:cpu-die` node is
  gone; both CPU `physicalSpec.collisionNodes` are empty, and the stale cooler
  `allowedContacts` reference went with it (**B8**, **B12** closed).
- **No invented envelope boxes.** The generator derives no internal clearance
  volumes or case envelope boxes from scalar limits or case exterior
  `dimensionsMm` (**B14** closed).
- **Slot 14 admitted**
  (`motherboard.gigabyte-b650m-aorus-elite-ax-rev-1-3`): visual-only plane GLB,
  collision-less `physicalSpec`, runtime manifest entry — 14 of 14 parts
  loadable.
- **O7 witness proven in the running app** by
  `e2e/phase6-o7-slot14-witness.spec.ts`.
- **Geometry data version unchanged.** No re-point: no new geometry
  representation dataset exists; `phys3-exp-20260808` is retained (plan Step 6).
  Coverage note: **10 of 14** parts carry `physicalSpec`; the other four — the
  A3 case, the TUF B860M, the V550 SFX, and the G.SKILL kit — carry none; their
  GLBs are visual-only.

## 2. Authoritative clearance-limit arithmetic (**RK1**)

### The O7 interference verdict — the changed `phys3` verdict

| Input | Value | Where it comes from |
|---|---|---|
| LIAN LI A3-mATX `maxCpuCoolerHeight` | **165 mm** | published `clearanceLimits` (single limit; no branches) |
| Noctua NH-D15 G2 `dimensionsMm.heightMm` | **168 mm** | published "Height with fan(s): 168 mm" |
| Comparison | **168 mm > 165 mm** | scalar rule: `heightMm > limitMm` → `interference` |
| Excess | **3 mm** | |

Result: check `clearance-limit:cpu-cooler-height` → `interference`; overall
physical status `interference`; verdict **"do not physically fit"** (blocked).

**Authority, stated plainly:** this result comes from **published catalog facts
and the clearance-limit evaluator** — `clearanceLimits` and `dimensionsMm`,
each provenance-backed in `benchmarks/cat6/catalog-source-registry.json` — and
**not** from OBB geometry, GLB mesh bounds, or engineered mesh collision. The
A3 case carries no `physicalSpec` at all; the limit lives in catalog facts,
which is exactly the point of the authority boundary.

### The O7 reachability route (why slot 14)

Before slot 14, every build containing the A3 case was compat-blocked before the
physical stage — `case-form-factor` with the ATX boards, `cpu-socket` with the
LGA1851 board — so the interference existed in the data but could not be shown
in the app. Slot 14 (GIGABYTE B650M AORUS ELITE AX Rev. 1.3 — AM5 · DDR5 ·
Micro-ATX) opens the compat-clean path:

| Check | Arithmetic | Result |
|---|---|---|
| `case-form-factor` | A3 `["Micro-ATX"]` ∋ Micro-ATX | compatible |
| `cpu-socket` | AM5 ↔ AM5 | compatible |
| `ram-support` | DDR5 ↔ DDR5, 6000 ≤ 8000 | compatible |
| `psu-wattage` | (65 + 200) × 1.3 = 344.5 W ≤ 750 W | compatible |
| `chipset-bios` | no map under O6 | unavailable — does not hide the physical stage |
| physical | 168 > 165 | **interference** |

Witness build: A3 + slot 14 + NH-D15 G2 + Ryzen 5 7600 + T-CREATE
DDR5-6000 + ASUS Dual RTX 4070 OC + Corsair RM750e. The E2E asserts
`physical-validation-panel[data-overall-status="interference"]` and check
`clearance-limit:cpu-cooler-height[data-status="interference"]`.

### Counter-check on the default build (unchanged verdict, recorded)

The default build (Fractal Design North TG Dark + NH-D15 G2 + RM750e) stays
`fit` under the same evaluator: `maxCpuCoolerHeight` 170 mm ("without Fan
Bracket") ≥ 168 mm → fit with 2 mm clearance; RM750e 140 mm ≤ 155 mm and
≤ 255 mm → fit in every published PSU branch (**I5**). The O7 verdict is not a
special case of the rule.

## 3. Deviations from the M0 plan

- **No new `geometryDataVersion`** (`cat6-spec-⟨date⟩` was never created). The
  M0 text assumed Step 6 would produce a new dimensions-driven geometry dataset;
  it did not, so no re-point (plan Step 6). `phys3-exp-20260808` retained
  everywhere.
- **No GLB-vs-`dimensionsMm` tolerance gate** (the planned 0.1 mm
  render-equality contract) — superseded by **C16**: visual geometry is not
  catalog truth.
- **OBB geometry demoted, not deleted.** The fixture mechanics
  (`clearance:cooler-sidekeepout`, OBB overlap) remain in the GLBs for preview
  and debug but no longer set verdicts; the OBB engine stays.
- **Fixture-era verdicts superseded.** The default-build `fit` and the O7
  interference now rest on published scalar limits instead of tuned collision
  geometry.

## 4. Status after this record

Step 6 is **complete**. Step 7 follows below. Steps 8–12 remain open. Phase 7
has not started.

---

# Step 7 — Default build assembly verification

## 5. What was verified (Step 7, 2026-08-11)

Default build (`DEFAULT_BUILD_STATE_V2`) was audited against the live
manifest-loaded 14-part `cat6` catalog. **It assembles.** No change to the
default part set was required (**RK5**).

### Default build (unchanged)

| Slot | Part id |
|------|---------|
| Case | `case.fractal-design-north-tg-dark` |
| Motherboard | `motherboard.gigabyte-b650-aorus-elite-ax-v2` |
| CPU | `cpu.amd-ryzen-5-7600` |
| GPU | `gpu.asus-dual-rtx4070-o12g` |
| Cooler | `cooler.noctua-nh-d15-g2` |
| RAM | `ram.teamgroup-t-create-expert-ddr5-6000-32gb` |
| PSU | `psu.corsair-rm750e` |

### Catalog + assembly

| Check | Evidence |
|-------|----------|
| Manifest size | `parts/catalog-manifest.json` → 14 parts, `catalogContractVersion: "cat6"` |
| Default ids resolve | all 7 default part ids present in manifest / `loadPartCatalog` |
| Mounts | `buildAssemblyState` → `allMounted === true`, 6 selections, empty `unavailableReasons` |
| 3D viewport | `data-assembly-status="fit"`; `data-assembly-poses` includes mb / cooler / psu / gpu |

### Authoritative clearance-limit arithmetic (default)

| Family | Measurement | Published limits | Result |
|--------|-------------|------------------|--------|
| CPU cooler height | NH-D15 G2 **168 mm** | North **170 mm** ("without Fan Bracket") | **fit** (2 mm clearance) |
| PSU length | RM750e **140 mm** | **255 mm** (1 HDD Tray) and **155 mm** (2 HDD Tray) | **fit** on **both** branches (**I5**) |
| GPU length | Dual RTX 4070 OC **267.01 mm** | North **355 mm** | **fit** |

OBB `collision` / `clearance` checks on the default orientation: all **fit** —
no false advisory interference, and none of them set authoritative status
(Step 6 authority boundary).

### Browser / E2E evidence (2026-08-11)

Commands:

```bash
pnpm exec vitest run src/test/phase6-step7-default-assembly.test.ts
pnpm exec playwright test \
  e2e/phase6-step7-default-assembly.spec.ts \
  e2e/exit-scenario.spec.ts \
  e2e/phase6-o7-slot14-witness.spec.ts
```

Results:

| Suite | Result |
|-------|--------|
| Unit `phase6-step7-default-assembly.test.ts` | **3/3 PASS** |
| E2E `phase6-step7-default-assembly.spec.ts` | **1/1 PASS** — clean `/` load, 14-part manifest via HTTP, default selectors, viewport poses, cooler/PSU/GPU clearance-limit `fit`, zero OBB interference |
| E2E `exit-scenario.spec.ts` (Phase 0 path) | **4/4 PASS** — clean load, CPU change, GPU swap, reload/share-link restore, invalid-part fallback, fixture HTTP |
| E2E `phase6-o7-slot14-witness.spec.ts` | **1/1 PASS** — O7 still reachable; `clearance-limit:cpu-cooler-height` interference; verdict blocked |

### Truth-sync artifacts added

- `src/test/phase6-step7-default-assembly.test.ts` — locks catalog size, mounts,
  cooler/PSU branch arithmetic, no OBB interference
- `e2e/phase6-step7-default-assembly.spec.ts` — locks the same criteria in the
  running SPA against `vite preview` + dist fixtures

### Status after this record

Step 7 is **complete**. Default build unchanged. Steps 8–12 are open. Do not
start catalog growth, price work, or Phase 7 from this record.
