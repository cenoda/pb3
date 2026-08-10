# `cat6` — Catalog data contract (M0 draft)

Status: **Accepted 2026-08-10; owner decisions O1–O8 locked. Amended 2026-08-10
(Step 1.1) after the first real part was authored — product-relative
`DimensionsMm`, `boostClockBasis`, and rules C10–C11.**
Scope authority: [`phase-6.md`](./phase-6.md).

Contract version string: **`cat6`**. It replaces `vs0` as the `contractVersion`
of `part.json`. It does **not** replace `vs2` (build state / URL), `compat2`,
`phys3`, `perf1`, `prov4`, or `est1` — all of those keep their current public
shapes.

---

## 1. What changes and why

`PartDefinitionV2` (`src/contract/partV2.ts`) describes a part well enough to run
the engines and not well enough to say where any of it came from. Every field in
a fixture `part.json` is an assertion with no author, no citation, and no date.

`cat6` adds exactly what is needed to make each assertion traceable, plus the
SKU-level fields that make **O3**'s per-SKU granularity a modelled fact rather
than a naming convention:

| Added | Reason |
|-------|--------|
| `identity` | A real part has a manufacturer and a model; `displayName` alone is a UI string |
| `dimensionsMm` | The dimension becomes the sourced datum; the mesh becomes derived from it |
| `performanceSpec` | Boost clock and power limit — **why** an ASUS and an MSI 4070 differ. Without these, SKU-level ids assert a difference the data cannot show |
| `provenance` | Per field-group source reference — the point of the phase |
| `image` | Defined so Phase 7 has a place to read from; **populated by no part in this phase** (scope §5) |

Everything else — `id`, `category`, `displayName`, `modelGlbPath`, `compatSpec`,
`physicalSpec`, `notes` — carries over from `PartDefinitionV2` unchanged.

---

## 2. Types

```ts
export const CAT6_CONTRACT_VERSION = "cat6" as const;
export type Cat6ContractVersion = typeof CAT6_CONTRACT_VERSION;

/** Reused from prov4 at the type level only. No prov4 fixture shape changes. */
import type { EvidenceRightsClass, EvidenceSourceClass } from "./prov4";

export interface PartIdentity {
  /** Manufacturer as printed by the manufacturer: "AMD", "ASUS", "MSI". */
  manufacturer: string;
  /** Retail model as printed: "Dual GeForce RTX 4070 OC". */
  modelName: string;
  /** Manufacturer part number / SKU, when published. */
  partNumber?: string;
  /**
   * The silicon the SKU is built on: "AMD Ryzen 5 7600", "NVIDIA RTX 4070".
   * Grouping metadata for a future estimator that reasons per chip and adjusts
   * per SKU. NOT a join key — perf1 joins on part id (O3).
   */
  chipModel?: string;
  /** ISO-8601 date (YYYY-MM-DD) of market release, when published. */
  releasedAt?: string;
}

/** A pointer into the cat6 source registry, with the date it was read. */
export interface CatalogSourceRef {
  sourceId: string;
  /** ISO-8601 date the cited page or document was retrieved. */
  retrievedAt: string;
}

/**
 * One reference per field group. A group present in the part MUST have a
 * reference here; a group absent MUST NOT.
 */
export interface CatalogProvenance {
  identity: CatalogSourceRef;
  compatSpec?: CatalogSourceRef;
  dimensions?: CatalogSourceRef;
  performanceSpec?: CatalogSourceRef;
  msrp?: CatalogSourceRef;
  streetPrice?: CatalogSourceRef;
}

/**
 * Product-relative bounding dimensions of the physical product, mm, as read
 * from the vendor's published figures — not scene axes (+X/+Y/+Z). Vendors
 * often print three unlabeled numbers (e.g. ASUS prints
 * "267.01 x 133.94 x 51.13 mm" with no labels). Storing scene axes directly
 * would bury an interpretation step inside a field that is supposed to be a
 * quotation, and the mapping from product dimensions to scene axes differs per
 * category. `cat6` therefore stores what the vendor printed (`raw`), the
 * principal-dimension assignment (`lengthMm` / `heightMm` / `thicknessMm`), and
 * how that assignment was read (`assignmentBasis`). The scene-axis mapping
 * belongs to the geometry generator (implementation plan Step 6), where it is
 * written once per category and can be reviewed. The collision box is generated
 * from these product-relative figures via that mapping — see rule **C4**.
 */
export interface DimensionsMm {
  /** Longest principal dimension, mm. */
  lengthMm: number;
  /** Second principal dimension, mm. */
  heightMm: number;
  /** Third principal dimension (thickness / depth), mm. */
  thicknessMm: number;
  /** The vendor's printed dimension string, verbatim, before any interpretation. */
  raw: string;
  /**
   * How the raw figures were assigned to the three fields above, and on what
   * evidence. Required, because vendors frequently print unlabeled figures and
   * the assignment is then an inference, not a quotation.
   */
  assignmentBasis: string;
}

/**
 * SKU-level factory configuration. Every field optional: a vendor that does not
 * publish a value leaves it absent rather than inheriting the chip's reference
 * value, which would erase the very difference this contract exists to record.
 */
export interface PerformanceSpec {
  /** Published boost / max clock, MHz. */
  boostClockMhz?: number;
  /**
   * Which published boost figure `boostClockMhz` records when a vendor lists
   * more than one (e.g. default mode vs OC mode).
   */
  boostClockBasis?: string;
  /** Published base clock, MHz. */
  baseClockMhz?: number;
  /** Default board / package power limit, W (TGP, TDP, or PPT as published). */
  defaultPowerLimitW?: number;
  /** Free text naming which of TGP / TDP / PPT the vendor published. */
  powerLimitBasis?: string;
}

/**
 * Defined for Phase 7. No part populates this in Phase 6: an image file needs a
 * source-specific rights decision that does not exist yet (ADR-004 leaves the
 * equivalent question open for 3D assets).
 */
export interface CatalogImageRef {
  /** Repo-relative path under the part folder. */
  path: string;
  sourceId: string;
  rightsClass: EvidenceRightsClass;
  retrievedAt: string;
}

export interface PartDefinitionV3 {
  contractVersion: Cat6ContractVersion;
  /** SKU-level id — see §3. */
  id: string;
  category: PartCategoryV2;
  /** Real product name. MUST NOT contain "(fixture)". */
  displayName: string;
  identity: PartIdentity;
  modelGlbPath: string;
  dimensionsMm?: DimensionsMm;
  performanceSpec?: PerformanceSpec;
  provenance: CatalogProvenance;
  image?: CatalogImageRef;
  notes?: string;
  compatSpec?: CompatSpec;
  physicalSpec?: PhysicalSpec;
}
```

### Source registry

`benchmarks/cat6/catalog-source-registry.json`. The shape mirrors `prov4`'s
`EvidenceSourceRegistryFile` deliberately — the project already has one way of
describing where a fact came from, and a second one would be a liability.

```ts
export interface CatalogSource {
  sourceId: string;
  /** "manufacturer-spec" for specs; retailer listings are "external-review". */
  sourceClass: EvidenceSourceClass;
  rightsClass: EvidenceRightsClass;
  title: string;
  /** Publisher-side origin: product page title, datasheet name, retailer name. */
  origin: string;
  /** Required for every cat6 source. A spec with no citation is not a source. */
  citation: string;
  publishedAt?: string;
  /** SHA-256 of the archived document, when the source is a file (e.g. a PDF). */
  documentSha256?: string;
  notes?: string;
}

export interface CatalogSourceRegistryFile {
  catalogContractVersion: Cat6ContractVersion;
  registryVersion: string;
  sources: CatalogSource[];
}
```

`citation` is **required** here where `prov4` makes it optional. A catalog fact
with no citation has no reason to be in this contract.

### Manifest

`parts/catalog-manifest.json` — replaces the hardcoded `PHASE2_PART_PATHS` array
(**O8**). Adding a part becomes a data edit, per Charter §6.

```ts
export interface CatalogManifestEntry {
  id: string;
  category: PartCategoryV2;
  /** Repo-relative path to part.json. */
  path: string;
}

export interface CatalogManifestFile {
  catalogContractVersion: Cat6ContractVersion;
  /** e.g. "cat6-20260810". Bumped whenever the part set changes. */
  catalogVersion: string;
  parts: CatalogManifestEntry[];
}
```

### Prices (**O5** — both MSRP and street snapshot)

`benchmarks/cat6/catalog-prices.json`. A **separate file with its own shape**,
mapped into the existing `compat2` `PricedPart` at load time; `compat2` is not
modified.

```ts
export interface CatalogMsrp {
  amount: number;
  currency: string;      // as the manufacturer published it, usually "USD"
  sourceId: string;
  retrievedAt: string;
}

export interface CatalogStreetPrice {
  amount: number;
  currency: string;      // domestic listing currency, "KRW"
  /** The retailer whose listing was read, e.g. "Danawa lowest listing". */
  retailer: string;
  /** ISO-3166-1 alpha-2 market the listing applies to, e.g. "KR". */
  region: string;
  sourceId: string;
  /** ISO-8601 date the listing was read. This is a snapshot, not a feed. */
  retrievedAt: string;
}

export interface CatalogPriceRow {
  partId: string;
  category: PartCategoryV2;
  msrp?: CatalogMsrp;
  street?: CatalogStreetPrice;
}
```

**Total-currency rule (RK9).** `BuildPriceSummary` carries a single `currency`
and `subtotalAmount`, so two currencies cannot both feed a total.

- The **street snapshot drives the total**. It is what a buyer in the declared
  region actually pays.
- **MSRP is never summed.** It travels as reference metadata on the row.
- A part with no street snapshot maps to `status: "unavailable"`, which makes the
  summary `isPartial` — already modelled in `compat2`. It never falls back to
  MSRP inside a total, because a USD list price silently added to a KRW subtotal
  is exactly the class of invented number this phase removes.

Mapped `PricedPart.basis` reads:
`"⟨retailer⟩ listing in ⟨region⟩, retrieved ⟨retrievedAt⟩; snapshot, not a live quote"`.

Street prices are **manually curated**. No scraping, no scheduled refresh: there
is no server (ADR-001), and a dated manual snapshot with a citation is a fact,
whereas an auto-refreshed number in a static bundle would be a stale claim
dressed as a live one.

---

## 3. Part ids

Ids are **SKU-level** and are assigned once, in the migration step (scope §4).

```
{category}.{vendor}-{model}-{variant}
```

- `gpu.asus-dual-rtx4070-o12g`
- `motherboard.asus-tuf-b650-plus-wifi`
- `cpu.amd-ryzen5-7600`

The prefix is the **literal `PartCategoryV2` value** — `motherboard`, not `mb`.
The fixture catalog abbreviated it, which would force an abbreviation map into
code and break the folder-equals-category integrity check for no gain. Verbosity
is free here: nothing but a diff reader ever looks at an id.

Rules:

- Lowercase, ASCII, dot separating the category, hyphens inside.
- The category prefix must equal `category`, and the folder name must equal `id`.
- The suffix matches `^[a-z0-9]+(?:-[a-z0-9]+)+$` — at least two hyphen-separated
  segments, so a bare vendor name is not a valid id.
- Ids stay **opaque to code**: nothing parses vendor, chip, or platform out of an
  id string. The convention is for humans reading a diff.
- Once the migration lands, an id is stable. Renaming again breaks every share
  link a second time and requires its own decision.
- No fixture id survives (**O4**). The legacy set — `case.mid-tower-atx-01`,
  `case.micro-atx-mini-01`, `mb.atx-b650-01`, `mb.micro-b450-01`,
  `cpu.zen4-7600`, `cpu.zen4-7800x3d`, `gpu.rtx4070`, `gpu.rtx4080`,
  `cooler.air-twin-tower-01`, `ram.ddr5-32gb-6000`, `ram.ddr5-16gb-7200`,
  `psu.750w-atx`, `psu.550w-sfx` — is recorded in `ID_MIGRATION.md` and asserted
  absent by the integrity test.

---

## 4. Rules (normative)

| # | Rule |
|---|------|
| **C1** | **Absence over invention.** An unsourceable field is omitted — never estimated, rounded from a review, or inherited from the fixture catalog. Downstream, an omitted field yields `unavailable`, which every consuming engine already supports. |
| **C2** | **No orphan facts.** Every present field group has a `provenance` entry; every entry resolves to a registry `sourceId`; every registry entry has a `citation` and every reference a `retrievedAt`. Violations fail the schema or the integrity test, not review. |
| **C3** | **`displayName` is the real product name** and must not contain `"(fixture)"`. Phase 5 **D2** required that suffix precisely until this phase; it is now false. |
| **C4** | **Dimensions are the geometry SSOT.** `dimensionsMm` is authored from the source; the collision box is generated from it. Hand-tuning a mesh to produce a desired verdict is prohibited — that practice is what this phase exists to remove. |
| **C5** | **Model grade does not improve.** `physicalSpec.evidence.modelGrade` stays `Experimental`. Cited dimensions do not make a box mesh a verified model, and `Verified` under Charter §6 requires manual physical verification this phase does not perform. `basis` states "box mesh derived from cited dimensions". |
| **C6** | **Ids are SKU-level, assigned once, opaque to code** (§3). |
| **C7** | **No image file ships.** `image` is defined and populated by no part until a rights ADR exists. The integrity test asserts this. |
| **C8** | **`cat6` is a hard switch.** After migration the schema accepts `contractVersion: "cat6"` only. No dual-read window: every part file is migrated in one step and no external producer of `part.json` exists. |
| **C9** | **`biosMinVersionForCpu` is not populated** (**O6**). Socket compatibility only. `checkChipsetBios` already reports `unavailable` when the map is absent, so no engine changes. |
| **C10** | **A SKU does not inherit its chip's numbers into `performanceSpec`.** That group exists to record how this SKU differs from others built on the same chip; filling it from a reference figure erases exactly that. If the board partner does not publish a value, the `performanceSpec` field is absent. **`compatSpec` is different:** it feeds compatibility checks, its fields are chip-level facts, and a chip-vendor figure is a real published fact. It may be recorded, cited to the chip vendor rather than the board partner, and the registry source must record any scope caveat the chip vendor states. |
| **C11** | **Dimensions are product-relative, not scene axes.** `dimensionsMm` stores the vendor's printed string (`raw`), principal-dimension numbers (`lengthMm` / `heightMm` / `thicknessMm`), and the assignment rationale (`assignmentBasis`). Mapping product axes to phys3 scene axes (+X/+Y/+Z) is owned by the Step 6 geometry generator, once per category — not buried inside a field that is supposed to be a quotation. |

---

## 5. Zod / integrity split

Schema (`src/contract/cat6.schema.ts`) — structural, per file:

- `contractVersion` literal `"cat6"`
- `identity.manufacturer` / `identity.modelName` non-empty
- `displayName` non-empty and not matching `/\(fixture\)/`
- `id` matching the §3 pattern, category prefix equal to `category`
- `provenance.identity` required; group-presence refinement in both directions
  for `compatSpec`, `dimensionsMm`, `performanceSpec`
- every `retrievedAt` / `releasedAt` / `publishedAt` an ISO-8601 date
- `dimensionsMm`: `lengthMm` / `heightMm` / `thicknessMm` finite and `> 0`;
  `raw` and `assignmentBasis` non-empty strings
- `performanceSpec` numbers finite and `> 0`; `boostClockBasis` /
  `powerLimitBasis` non-empty when present
- `image`, if present, complete

Integrity test (`src/test/cat6.integrity.test.ts`) — cross-file:

- every `provenance` `sourceId` resolves in the registry
- every registry source has a non-empty `citation`
- manifest ids unique; folder name equals `id`; folder category equals
  `category`; every manifest path exists and parses
- every part id referenced by `perf1`, `cat6` prices, `prov4` pilot rows,
  `est1`, and the default build exists in the manifest (the scope §4 join guard)
- **no legacy fixture id appears** in `src/**`, `parts/**`, `benchmarks/**`, or
  `e2e/**` (**RK7**)
- `dimensionsMm` matches the half-extents in the generated GLB, within the
  `0.1 mm` phys3 epsilon
- no part populates `image` (**C7**)
- no `displayName` contains `"(fixture)"` (**C3**)
- no price row where `street` is absent maps into a non-partial total (**RK9**)

The split follows the existing convention: Zod rejects a malformed file,
integrity tests reject a well-formed file that lies about its neighbours.

---

## 6. What this contract deliberately does not add

- **No confidence field on catalog facts.** A manufacturer spec is not a
  measurement; it needs a citation, not a confidence grade. `confidence` stays
  where it belongs, on performance estimates.
- **No stock, availability, or price-history fields.** Live-data features, and
  there is no server (ADR-001).
- **No compatibility rules.** `compat2` owns those; `cat6` supplies inputs.
- **No new category.** The seven `PartCategoryV2` categories stand; storage,
  fans, and monitors are not in this phase.
- **No DDR4 or second-socket fields.** Deferred with **O2**, and noted there as a
  known future `compat2` widening rather than something `cat6` pre-empts.
