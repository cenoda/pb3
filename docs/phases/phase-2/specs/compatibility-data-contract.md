# Phase 2 Data Contract — Compatibility, Price, and `vs2` BuildState

Status: **M0 planning draft — not owner-accepted**
Scope authority: [`phase-2.md`](./phase-2.md)

This document defines the Phase 2 types: the logical **compatibility** model,
the static **price** model, and the **`vs2`** extension of the `vs0`
`BuildState`/URL contract. It does not define fixture rows, a filtering UI, or
a live pricing integration.

It follows the same discipline as
[`vertical-slice-data-contract.md`](../../phase-0/specs/vertical-slice-data-contract.md)
(`vs0`) and
[`performance-data-contract.md`](../../phase-1/specs/performance-data-contract.md)
(`perf1`): IDs are opaque strings, unknown/missing data returns a structured
result rather than an invented value, and every incompatibility carries a
human-readable explanation.

---

## 1. Contract versions

Phase 2 introduces **two** independent version strings, matching how `vs0` and
`perf1` are already independent lineages:

| Contract | Version | Governs |
|----------|---------|---------|
| `BuildState` / URL | **`vs2`** | Extends `vs0`; adds `ramId`, `psuId`; case/motherboard become real selections instead of fixed singletons |
| Compatibility + price | **`compat2`** | New — compatibility reports and price fixture rows |

`vs2` is a breaking, additive change to `vs0` per the existing rule "bump only
on breaking field change; never silently widen" ([`vertical-slice-data-contract.md`](../../phase-0/specs/vertical-slice-data-contract.md)
§1.5). `compat2` is a new lineage because compatibility/price did not exist
under `vs0` or `perf1`.

`perf1` is **unchanged** by this document.

---

## 2. Shared conventions (reused, not redefined)

- `EstimateConfidence` — reused unchanged from `vs0`/`perf1`:
  `"stub" | "low" | "medium" | "high" | "none"`. Price and compatibility rows
  that are fixture-only use `"stub"`.
- IDs are opaque strings compared for equality only (`vs0` §1.1).
- Money and specs are never invented when a fixture row is missing; the
  result is a structured `unavailable`/missing outcome (`vs0` §1.2, extended
  here to price and compatibility).

---

## 3. `vs2` — `BuildState` and URL extension

### 3.1 Extended `BuildState`

```typescript
export const VS2_CONTRACT_VERSION = "vs2" as const;
export type Vs2ContractVersion = typeof VS2_CONTRACT_VERSION;

export type PartCategoryV2 =
  | "case"
  | "motherboard"
  | "cpu"
  | "gpu"
  | "cooler"
  | "ram"
  | "psu";

export interface BuildStateV2 {
  contractVersion: Vs2ContractVersion;

  caseId: string;
  motherboardId: string;
  cpuId: string;
  gpuId: string;
  coolerId: string;
  ramId: string;
  psuId: string;

  /** Fixed constants, unchanged from vs0. */
  gameId: string;
  presetId: string;
}
```

`caseId` and `motherboardId` now resolve against a 2-entry catalog per phase
category instead of a single fixed id (phase-2.md §2.2). `ramId` and `psuId`
are new required fields.

### 3.2 Default `BuildStateV2`

The phase-2 default build must resolve to fixture ids that also satisfy every
compatibility check in §4 as `compatible` — a default build must never itself
be shown as incompatible.

```json
{
  "contractVersion": "vs2",
  "caseId": "case.mid-tower-atx-01",
  "motherboardId": "mb.atx-b650-01",
  "cpuId": "cpu.zen4-7600",
  "gpuId": "gpu.rtx4070",
  "coolerId": "cooler.air-twin-tower-01",
  "ramId": "ram.ddr5-32gb-6000",
  "psuId": "psu.750w-atx",
  "gameId": "game.cyberpunk-2077",
  "presetId": "preset.raster-ultra"
}
```

RAM/PSU fixture ids above are illustrative placeholders for this planning
document; final ids are chosen when fixtures are authored in implementation.

### 3.3 URL rules

Same normative shape as `vs0` §6, extended with two query keys:

| Query key | `BuildStateV2` field | Encoder | Decoder if missing |
|-----------|----------------------|---------|---------------------|
| `v` | `contractVersion` | always written as `vs2` | see §3.4 |
| `cpu` | `cpuId` | always written | default fixture CPU |
| `gpu` | `gpuId` | always written | default fixture GPU |
| `case` | `caseId` | always written | default fixture case |
| `mb` | `motherboardId` | always written | default fixture motherboard |
| `cooler` | `coolerId` | always written | default fixture cooler |
| `ram` | `ramId` | always written | default fixture RAM |
| `psu` | `psuId` | always written | default fixture PSU |
| `game` | `gameId` | always written | default fixture game constant |
| `preset` | `presetId` | always written | default fixture preset constant |

Encoder: always writes every `BuildStateV2` field (same rule as `vs0` §6.1
rule 3) — the canonical share link is the full `vs2` form.

Decoder: missing keys fill from the default `BuildStateV2` (§3.2), same
leniency rule as `vs0` §6.1 rule 4.

### 3.4 Backward compatibility with `vs0` links

A link with `v=vs0` is a **valid decode input**, not an error:

1. If `v === "vs0"`, treat all present `vs0` keys (`cpu`, `gpu`, `case`, `mb`,
   `cooler`, `game`, `preset`) as inputs to the `vs2` decode.
2. `ramId` and `psuId` are not present on a `vs0` link — always fill them from
   the `vs2` default (§3.2).
3. Validate the resulting candidate `BuildStateV2` the same way as any other
   decode (§3.5). Invalid → fall back to the full `vs2` default.
4. After a successful decode from a `v=vs0` link, the app should rewrite the
   address bar to the canonical `v=vs2` full form (same "rewrite to canonical"
   behavior `vs0` §6.4 already describes for partial links).

This mirrors how `vs0` already treats partial links as compatibility input
only, never re-emitted as canonical (§3.3 above).

### 3.5 Validation invariants

A `BuildStateV2` is valid for phase 2 only if:

1. `contractVersion === "vs2"` (post-decode; a `v=vs0` input is normalized to
   `vs2` per §3.4 before this check runs).
2. Every id exists in the loaded phase-2 catalog with the expected category
   (`case`, `motherboard`, `cpu`, `gpu`, `cooler`, `ram`, `psu`).
3. `gameId === "game.cyberpunk-2077"` and `presetId === "preset.raster-ultra"`
   (still phase-0 constants).
4. `cpuId`/`gpuId` are among the fixed Phase 0/1 sets (phase-2.md §2.1).
5. `caseId`/`motherboardId`/`ramId`/`psuId` are among the fixed Phase 2 sets
   (phase-2.md §2.2–§2.3).

Invalid → fall back to the default `BuildStateV2` (§3.2), same as `vs0` §5.1.

Note: **validity here is catalog membership, not compatibility.** An
internally-valid `BuildStateV2` (every id resolves) may still be reported
`incompatible` by the §4 compatibility engine — that is expected and is not a
decode error.

---

## 4. Compatibility model

### 4.1 `CompatibilityCheckId`

```typescript
export type CompatibilityCheckId =
  | "cpu-socket"
  | "chipset-bios"
  | "ram-support"
  | "psu-wattage"
  | "case-form-factor";
```

Exactly the five checks in phase-2.md §3.3. No further check id is added
without a documented scope change.

### 4.2 Result shape

```typescript
export type CompatibilityStatus = "compatible" | "incompatible" | "unavailable";

export interface CompatibilityCheckResult {
  checkId: CompatibilityCheckId;

  status: CompatibilityStatus;

  /**
   * Required when status === "incompatible".
   * Recommended (not required) when status === "unavailable" to explain
   * which declared field was missing.
   * Omitted when status === "compatible".
   */
  explanation?: string;

  /** Ids of the parts this check compared, for UI attribution. */
  involvedPartIds: string[];
}

export interface CompatibilityReport {
  compatContractVersion: "compat2";

  /** Echo of the BuildStateV2 ids this report was computed from. */
  buildStateVersion: "vs2";

  checks: CompatibilityCheckResult[];

  /**
   * Aggregate status:
   * - "incompatible" if any check is "incompatible"
   * - else "unavailable" if any check is "unavailable"
   * - else "compatible"
   */
  overallStatus: CompatibilityStatus;

  dataVersion: string;
}
```

`explanation` is **mandatory in practice** for `incompatible` (phase-2.md
§3.4) — a schema validator should reject an `incompatible` result with no
`explanation`.

### 4.3 Per-check comparison inputs (spec fields, not geometry)

These are the declared `part.json`-level (or sibling spec) fields each check
reads. Exact fixture field names are finalized when fixtures are authored;
this table fixes the **semantic** inputs so the engine and fixtures agree.

```typescript
export interface CpuCompatSpec {
  socket: string; // e.g. "AM5"
  tdpWatts: number;
}

export interface MotherboardCompatSpec {
  socket: string;
  chipset: string;
  formFactor: "ATX" | "Micro-ATX";
  supportedMemoryType: "DDR5";
  maxMemorySpeedMtS: number;
  /** Per-CPU-id minimum BIOS version known to support that CPU on this board. */
  biosMinVersionForCpu: Record<string, string>;
}

export interface GpuCompatSpec {
  tdpWatts: number;
}

export interface RamCompatSpec {
  memoryType: "DDR5";
  speedMtS: number;
}

export interface PsuCompatSpec {
  wattage: number;
}

export interface CaseCompatSpec {
  supportedFormFactors: Array<"ATX" | "Micro-ATX">;
}
```

### 4.4 Check semantics

| Check | Rule | `unavailable` when |
|-------|------|---------------------|
| `cpu-socket` | `cpu.socket === motherboard.socket` → compatible; else incompatible | Either spec is missing the `socket` field |
| `chipset-bios` | Look up `motherboard.biosMinVersionForCpu[cpuId]`; if present, compatible (phase 2 does not model the user's currently-flashed BIOS version — presence of a documented minimum is treated as compatible, since verifying the user's actual BIOS is out of scope) | No entry for `cpuId` in `biosMinVersionForCpu` — **never** assume compatible from a missing entry |
| `ram-support` | `ram.memoryType === motherboard.supportedMemoryType` **and** `ram.speedMtS <= motherboard.maxMemorySpeedMtS` → compatible; type mismatch or over-speed → incompatible | Either spec missing the relevant field |
| `psu-wattage` | `psu.wattage >= (cpu.tdpWatts + gpu.tdpWatts) * PSU_HEADROOM_MULTIPLIER` → compatible; else incompatible. `PSU_HEADROOM_MULTIPLIER` is a fixed constant, value **open** (phase-2.md §9) — must be set before implementation, not left as a silent default in code | Any of `psu.wattage`, `cpu.tdpWatts`, `gpu.tdpWatts` missing |
| `case-form-factor` | `motherboard.formFactor ∈ case.supportedFormFactors` → compatible; else incompatible | Either spec missing the relevant field |

`chipset-bios` is intentionally a **declared-data** check, not a live BIOS
probe — Phase 2 has no way to read a user's actual motherboard firmware. The
UI must present this as "board vendor states BIOS ≥ X supports this CPU," not
as a guarantee the user's board is already updated.

### 4.5 Example — incompatible result

```json
{
  "compatContractVersion": "compat2",
  "buildStateVersion": "vs2",
  "checks": [
    {
      "checkId": "cpu-socket",
      "status": "incompatible",
      "explanation": "CPU cpu.zen4-7600 uses socket AM5; motherboard mb.legacy-b450-01 uses socket AM4. These parts cannot be paired.",
      "involvedPartIds": ["cpu.zen4-7600", "mb.legacy-b450-01"]
    }
  ],
  "overallStatus": "incompatible",
  "dataVersion": "compat2-fixture-draft"
}
```

(`mb.legacy-b450-01` is an illustrative non-fixture example id to show the
incompatible shape; the actual phase-2 fixture set is fixed to the two
motherboard ids in phase-2.md §2.2.)

### 4.6 Example — unavailable result

```json
{
  "compatContractVersion": "compat2",
  "buildStateVersion": "vs2",
  "checks": [
    {
      "checkId": "chipset-bios",
      "status": "unavailable",
      "explanation": "No documented minimum BIOS version for cpu.zen4-7800x3d on mb.atx-b650-01.",
      "involvedPartIds": ["cpu.zen4-7800x3d", "mb.atx-b650-01"]
    }
  ],
  "overallStatus": "unavailable",
  "dataVersion": "compat2-fixture-draft"
}
```

---

## 5. Price model

### 5.1 `PricedPart`

```typescript
export interface PricedPart {
  partId: string;
  category: PartCategoryV2;

  status: "ok" | "unavailable";

  /** Present only when status === "ok". */
  amount?: number;
  currency?: string;

  /**
   * Fixture provenance string, e.g.
   * "phase-2 fixture price; not a live market quote".
   * Present regardless of status.
   */
  basis: string;

  /** Present only when status === "unavailable". */
  reason?: string;

  dataVersion: string;
}
```

### 5.2 `BuildPriceSummary`

```typescript
export interface BuildPriceSummary {
  compatContractVersion: "compat2";

  lines: PricedPart[];

  /** Sum over lines with status === "ok" only. */
  subtotalAmount: number;
  currency: string;

  /**
   * true when at least one selected part has status === "unavailable" —
   * the UI must label subtotalAmount as partial, not present it as a
   * complete total.
   */
  isPartial: boolean;

  dataVersion: string;
}
```

### 5.3 Currency (open decision)

This draft proposes **`"USD"`** as the fixed fixture currency for phase 2,
matching the mostly-English/international part naming already used in Phase
0/1 fixtures. This is listed as open in phase-2.md §9 pending owner
confirmation; implementation must not proceed on this field until confirmed.

### 5.4 Example fixture row

```json
{
  "partId": "gpu.rtx4070",
  "category": "gpu",
  "status": "ok",
  "amount": 599,
  "currency": "USD",
  "basis": "phase-2 fixture price; not a live market quote",
  "dataVersion": "compat2-fixture-draft"
}
```

### 5.5 Example unavailable row

```json
{
  "partId": "ram.ddr5-32gb-6000",
  "category": "ram",
  "status": "unavailable",
  "basis": "phase-2 fixture price; not a live market quote",
  "reason": "no fixture price row for this part id yet",
  "dataVersion": "compat2-fixture-draft"
}
```

### 5.6 Example partial summary

```json
{
  "compatContractVersion": "compat2",
  "lines": [
    { "partId": "gpu.rtx4070", "category": "gpu", "status": "ok", "amount": 599, "currency": "USD", "basis": "phase-2 fixture price; not a live market quote", "dataVersion": "compat2-fixture-draft" },
    { "partId": "ram.ddr5-32gb-6000", "category": "ram", "status": "unavailable", "basis": "phase-2 fixture price; not a live market quote", "reason": "no fixture price row for this part id yet", "dataVersion": "compat2-fixture-draft" }
  ],
  "subtotalAmount": 599,
  "currency": "USD",
  "isPartial": true,
  "dataVersion": "compat2-fixture-draft"
}
```

---

## 6. Fixture file shapes (draft, paths to be confirmed in implementation plan)

```typescript
export interface CompatibilityExampleFile {
  compatContractVersion: "compat2";
  dataVersion: string;
  examples: CompatibilityReport[];
}

export interface PriceFixtureFile {
  compatContractVersion: "compat2";
  dataVersion: string;
  rows: PricedPart[];
}
```

Suggested (not final) paths, following the `benchmarks/{contract}/` convention
established by `benchmarks/vs0/` and `benchmarks/perf1/`:

```text
benchmarks/compat2/
  compatibility-examples.json
  price-fixtures.json
```

Case/motherboard/RAM/PSU spec fields (§4.3) live on each part's `part.json`
under `parts/{category}/{id}/part.json`, following the existing `vs0` layout
(`vertical-slice-data-contract.md` §4.1) — extended with the new compat spec
fields, not a parallel spec file. Exact field placement (top-level vs a nested
`compatSpec` object) is an implementation-plan decision, not fixed here.

---

## 7. Explicitly out of this contract

Do **not** add these fields "for later" in phase-2 fixture files:

- Physical dimensions, clearance, or collision meshes (Phase 3).
- Live price API response shapes.
- User account / saved-build server records.
- A `perf1` RAM-tier-to-RAM-SKU mapping table (open decision, phase-2.md §9).
- Multi-currency conversion tables.

When a later phase needs them, extend with a new contract version
(`compat3`, `vs3`, or an equivalent id) rather than silently widening
`compat2`/`vs2` loaders without a version bump.

---

## 8. Validation checklist (to run once fixtures exist)

- [ ] Every phase-2 part `part.json` includes the compat spec fields its
      category requires (§4.3)
- [ ] Default `BuildStateV2` (§3.2) resolves to fixture ids and reports
      `overallStatus: "compatible"`
- [ ] At least one deliberately incompatible combination exists in test
      fixtures with a required `explanation`
- [ ] At least one deliberately `unavailable` compatibility case exists
      (missing BIOS map entry)
- [ ] Price fixture covers every phase-2 part id, or a documented gap
      exercises the `unavailable` price path
- [ ] `v=vs0` legacy link decodes into a valid `vs2` `BuildStateV2` with
      RAM/PSU defaults filled (§3.4)
- [ ] Types in this document wired via a schema validator (Zod, per ADR-003)
      — requires implementation

---

## 9. Related documents

| Document | Role |
|----------|------|
| [phase-2.md](./phase-2.md) | Scope, inventory, forbidden work, open decisions |
| [vertical-slice-data-contract.md](../../phase-0/specs/vertical-slice-data-contract.md) | `vs0` types this contract extends |
| [performance-data-contract.md](../../phase-1/specs/performance-data-contract.md) | `perf1` types (unchanged by phase 2) |
| [PROJECT_CHARTER.md](../../../PROJECT_CHARTER.md) | Long-term principles |
| [STATUS.md](../../../STATUS.md) | Decision log |
| [phase-2 home](../README.md) | Specs index, TODO |
