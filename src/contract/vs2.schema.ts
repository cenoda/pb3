import { z } from "zod";
import { physicalSpecSchema } from "./phys3.schema";
import { vs0ContractVersionSchema } from "./vs0.schema";

export const vs2ContractVersionSchema = z.literal("vs2");

export const partCategoryV2Schema = z.enum([
  "case",
  "motherboard",
  "cpu",
  "gpu",
  "cooler",
  "ram",
  "psu",
]);

export const motherboardFormFactorSchema = z.enum(["ATX", "Micro-ATX"]);

export const cpuCompatSpecSchema = z.object({
  socket: z.string().min(1),
  tdpWatts: z.number().positive(),
});

export const motherboardCompatSpecSchema = z.object({
  socket: z.string().min(1),
  chipset: z.string().min(1),
  formFactor: motherboardFormFactorSchema,
  supportedMemoryType: z.literal("DDR5"),
  maxMemorySpeedMtS: z.number().positive().optional(),
  biosMinVersionForCpu: z.record(z.string().min(1)),
});

export const gpuCompatSpecSchema = z.object({
  tdpWatts: z.number().positive(),
});

export const ramCompatSpecSchema = z.object({
  memoryType: z.literal("DDR5"),
  speedMtS: z.number().positive(),
  capacityGb: z.number().positive(),
});

export const psuCompatSpecSchema = z.object({
  wattage: z.number().positive(),
});

export const caseCompatSpecSchema = z.object({
  supportedFormFactors: z.array(motherboardFormFactorSchema).min(1),
});

export const compatSpecSchema = z.union([
  cpuCompatSpecSchema,
  motherboardCompatSpecSchema,
  gpuCompatSpecSchema,
  ramCompatSpecSchema,
  psuCompatSpecSchema,
  caseCompatSpecSchema,
]);

export const partDefinitionV2Schema = z.object({
  contractVersion: vs0ContractVersionSchema,
  id: z.string().min(1),
  category: partCategoryV2Schema,
  displayName: z.string().min(1),
  modelGlbPath: z.string().min(1),
  notes: z.string().optional(),
  compatSpec: compatSpecSchema.optional(),
  /** Nested phys3 block; omitted = visual-only coverage. */
  physicalSpec: physicalSpecSchema.optional(),
});

export const buildStateV2Schema = z.object({
  contractVersion: vs2ContractVersionSchema,
  caseId: z.string().min(1),
  motherboardId: z.string().min(1),
  cpuId: z.string().min(1),
  gpuId: z.string().min(1),
  coolerId: z.string().min(1),
  ramId: z.string().min(1),
  psuId: z.string().min(1),
  gameId: z.string().min(1),
  presetId: z.string().min(1),
});

/** Lenient decode input: accepts vs0 or vs2 version marker before normalization. */
export const legacyUrlVersionSchema = z.enum(["vs0", "vs2"]);
