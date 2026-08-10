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
 * Bounding dimensions of the physical product, mm, in the phys3 axis
 * convention (mm, Y-up). SSOT the collision box is generated from.
 */
export interface DimensionsMm {
  widthMm: number;
  heightMm: number;
  depthMm: number;
}

/**
 * SKU-level factory configuration. Every field optional: a vendor that does not
 * publish a value leaves it absent rather than inheriting the chip's reference
 * value, which would erase the very difference this contract exists to record.
 */
export interface PerformanceSpec {
  /** Published boost / max clock, MHz. */
  boostClockMhz?: number;
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
