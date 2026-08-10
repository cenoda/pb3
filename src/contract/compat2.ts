import type { PartCategoryV2 } from "./vs2";

export const COMPAT2_CONTRACT_VERSION = "compat2" as const;
export type Compat2ContractVersion = typeof COMPAT2_CONTRACT_VERSION;

/**
 * Stub PSU sizing margin (30% headroom over CPU+GPU TDP sum).
 * Replace with a real system draw model later — do not duplicate this value elsewhere.
 */
export const PSU_HEADROOM_MULTIPLIER = 1.3;

export type CompatibilityCheckId =
  | "cpu-socket"
  | "chipset-bios"
  | "ram-support"
  | "psu-wattage"
  | "case-form-factor";

export type CompatibilityStatus = "compatible" | "incompatible" | "unavailable";

export interface CompatibilityCheckResult {
  checkId: CompatibilityCheckId;
  status: CompatibilityStatus;
  explanation?: string;
  involvedPartIds: string[];
}

export interface CompatibilityReport {
  compatContractVersion: Compat2ContractVersion;
  buildStateVersion: "vs2";
  checks: CompatibilityCheckResult[];
  overallStatus: CompatibilityStatus;
  dataVersion: string;
}

export interface CpuCompatSpec {
  socket: string;
  tdpWatts: number;
}

export interface MotherboardCompatSpec {
  socket: string;
  chipset: string;
  formFactor: "ATX" | "Micro-ATX";
  supportedMemoryType: "DDR5";
  /**
   * The highest memory data rate the board vendor explicitly lists for this
   * SKU, OC/XMP/EXPO values included (cat6 rule C14).
   *
   * Optional because some vendors publish no exact maximum — ASUS states one
   * board's ceiling as "Support up to 8800+MT/s (OC)", where the trailing "+"
   * is a floor for the overclocking ceiling rather than a maximum. Recording a
   * number there would invent one. `checkRamSupport` already reports
   * `unavailable` when this is absent, so the omission costs the memory check
   * and nothing else: the board's socket and form factor still drive their own
   * checks.
   */
  maxMemorySpeedMtS?: number;
  biosMinVersionForCpu: Record<string, string>;
}

export interface GpuCompatSpec {
  tdpWatts: number;
}

export interface RamCompatSpec {
  memoryType: "DDR5";
  speedMtS: number;
  capacityGb: number;
}

export interface PsuCompatSpec {
  wattage: number;
}

export interface CaseCompatSpec {
  supportedFormFactors: Array<"ATX" | "Micro-ATX">;
}

export type CompatSpec =
  | CpuCompatSpec
  | MotherboardCompatSpec
  | GpuCompatSpec
  | RamCompatSpec
  | PsuCompatSpec
  | CaseCompatSpec;

export interface PricedPart {
  partId: string;
  category: PartCategoryV2;
  status: "ok" | "unavailable";
  amount?: number;
  currency?: string;
  basis: string;
  reason?: string;
  dataVersion: string;
}

export interface BuildPriceSummary {
  compatContractVersion: Compat2ContractVersion;
  lines: PricedPart[];
  subtotalAmount: number;
  currency: string;
  isPartial: boolean;
  dataVersion: string;
}

export interface CompatibilityExampleFile {
  compatContractVersion: Compat2ContractVersion;
  dataVersion: string;
  examples: CompatibilityReport[];
}

export interface PriceFixtureFile {
  compatContractVersion: Compat2ContractVersion;
  dataVersion: string;
  rows: PricedPart[];
}

export const COMPAT2_FIXTURE_BASIS =
  "phase-2 fixture price; not a live market quote" as const;

export const COMPAT2_PRICE_FIXTURES_PATH =
  "/benchmarks/price2/price-fixtures.json" as const;

export const COMPAT2_COMPAT_EXAMPLES_PATH =
  "/benchmarks/compat2/compatibility-examples.json" as const;
