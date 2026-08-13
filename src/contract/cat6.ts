/**
 * Phase-6 catalog data contract types (`cat6`).
 * Authority: docs/phases/phase-6/specs/catalog-data-contract.md
 */

import type {
  CaseCompatSpec,
  CpuCompatSpec,
  GpuCompatSpec,
  MotherboardCompatSpec,
  PsuCompatSpec,
  RamCompatSpec,
} from "./compat2";
import type { PhysicalSpec } from "./phys3";
import type { EvidenceRightsClass, EvidenceSourceClass } from "./prov4";
import type { PartCategoryV2 } from "./vs2";

export const CAT6_CONTRACT_VERSION = "cat6" as const;
export type Cat6ContractVersion = typeof CAT6_CONTRACT_VERSION;

/**
 * §3 — lowercase ASCII SKU tail after "{category}." with hyphen-separated segments.
 * Examples: `asus-dual-rtx4070-o12g`, `amd-ryzen5-7600`.
 */
export const CAT6_ID_SUFFIX_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)+$/;

export type CompatSpec =
  | CpuCompatSpec
  | MotherboardCompatSpec
  | GpuCompatSpec
  | RamCompatSpec
  | PsuCompatSpec
  | CaseCompatSpec;

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
  /**
   * Why this part is in the catalog when its presence would otherwise
   * contradict the catalog's stated scope. Free text, and absent for every
   * part that needs no such explanation — which is nearly all of them.
   *
   * Exists for C15: a non-AM5 board in an AM5-scoped catalog is a deliberate
   * negative fixture, and that has to be legible in the part file rather than
   * only in a phase document.
   */
  roleNote?: string;
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
  clearanceLimits?: CatalogSourceRef;
  performanceSpec?: CatalogSourceRef;
  msrp?: CatalogSourceRef;
  streetPrice?: CatalogSourceRef;
}

/**
 * Product-relative bounding dimensions of the physical product, mm, as read from
 * the vendor's published figures. Scene-axis mapping is owned by the Step 6
 * geometry generator, not this field.
 */
export interface DimensionsMm {
  /**
   * Each axis is optional, because vendors publish partial dimensions: a
   * motherboard page prints a two-figure board outline with no thickness, and a
   * memory vendor may publish module height alone. Only axes the source
   * actually published are recorded.
   *
   * A missing axis is never filled from the part's form factor. ATX, SFX and
   * UDIMM standardise mounting geometry, not a SKU's physical dimensions, and
   * substituting one for the other would state a measurement no vendor made.
   *
   * Consumers that need a complete box — collision geometry above all — build
   * one only when all three axes are present. A check that needs a single axis
   * may use that axis when it is published.
   */
  /** Longest principal dimension, mm. */
  lengthMm?: number;
  /** Second principal dimension, mm. */
  heightMm?: number;
  /** Third principal dimension (thickness / depth), mm. */
  thicknessMm?: number;
  /**
   * The vendor's printed dimension string, verbatim, before any interpretation.
   */
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
   * Which published boost figure boostClockMhz records when a vendor lists
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

/** Phase-6 machine-checkable clearance predicate subject. */
export type ClearanceConditionSubject = "psu.lengthMm";

export type ClearanceConditionOperator = "lte" | "gt";

/**
 * Optional structured predicate alongside verbatim `condition` text.
 * Conservative applicability pruning only — a true result is not proof that the
 * full vendor condition is selected.
 */
export interface ClearanceCondition {
  subject: ClearanceConditionSubject;
  operator: ClearanceConditionOperator;
  valueMm: number;
}

/** One published clearance limit, with the condition it holds under. */
export interface ClearanceLimit {
  /** The limit in mm. */
  limitMm: number;
  /**
   * The vendor's printed condition, verbatim. Absent when the vendor states the
   * limit unconditionally. Never parsed for evaluation — display/provenance only.
   */
  condition?: string;
  /**
   * Optional structured necessary conditions for conservative branch pruning.
   * Unmodeled qualifiers in `condition` remain unresolved.
   */
  appliesWhen?: ClearanceCondition[];
}

/**
 * Internal clearance limits a case vendor publishes. These, not `dimensionsMm`,
 * are what physical validation needs: `dimensionsMm` is the external box, and
 * fit is decided by the internal envelope. Arrays, because vendors publish
 * limits that vary by configuration — one real page states PSU length as
 * "1 HDD Tray: 255 mm max, 2 HDD Tray: 155 mm max". These are alternatives,
 * not simultaneous constraints.
 */
export interface CaseClearanceLimits {
  maxGpuLength?: ClearanceLimit[];
  maxCpuCoolerHeight?: ClearanceLimit[];
  maxPsuLength?: ClearanceLimit[];
  /** The vendor's printed lines for this block, verbatim. */
  raw: string;
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
  clearanceLimits?: CaseClearanceLimits;
  performanceSpec?: PerformanceSpec;
  provenance: CatalogProvenance;
  image?: CatalogImageRef;
  notes?: string;
  compatSpec?: CompatSpec;
  physicalSpec?: PhysicalSpec;
}

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

export interface CatalogMsrp {
  amount: number;
  currency: string;
  sourceId: string;
  retrievedAt: string;
}

export interface CatalogStreetPrice {
  amount: number;
  currency: string;
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

/**
 * `benchmarks/cat6/catalog-prices.json` — Step 10. Rows are ordered by `partId`
 * ascending (schema-enforced) so the file has one deterministic byte layout.
 */
export interface CatalogPriceFile {
  catalogContractVersion: Cat6ContractVersion;
  /** e.g. "cat6-prices-20260811". Bumped whenever a row is added or revalued. */
  dataVersion: string;
  rows: CatalogPriceRow[];
}

export const CAT6_CATALOG_PRICES_PATH =
  "/benchmarks/cat6/catalog-prices.json" as const;

export const CAT6_IMAGE_SOURCE_REGISTRY_PATH =
  "/benchmarks/cat6/image-source-registry.json" as const;

export type ImageSourceDecision =
  | "approved"
  | "approved-metadata-only"
  | "rejected";

/**
 * One image source rights decision. Mirrors Phase 4 source-rights-record
 * fields (publisher, canonical URL, rights class, retrieval date, decision)
 * plus verbatim reuse terms (RK1).
 */
export interface ImageSourceRegistryEntry {
  sourceId: string;
  publisher: string;
  canonicalUrl: string;
  /** Required citation: the owner can follow any image here in one hop. */
  citation: string;
  rightsClass: EvidenceRightsClass;
  retrievedAt: string;
  decision: ImageSourceDecision;
  /** Verbatim reuse terms as published, not paraphrased. */
  verbatimTerms: string;
  notes?: string;
}

export interface ImageSourceRegistryFile {
  catalogContractVersion: Cat6ContractVersion;
  registryVersion: string;
  reviewedAt: string;
  sources: ImageSourceRegistryEntry[];
}
