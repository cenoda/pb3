import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { ClearanceLimit } from "../contract/cat6";
import { physicalValidationStatusSchema } from "../contract/phys3.schema";
import { partDefinitionV3Schema } from "../contract/cat6.schema";
import { DEFAULT_BUILD_STATE_V2 } from "../contract/vs2";
import { partDefinitionV2Schema } from "../contract/vs2.schema";
import { buildAssemblyState } from "../physical/buildAssemblyState";
import { buildPhysicalValidationReport } from "../physical/buildPhysicalValidationReport";
import { aggregatePhysicalStatus } from "../physical/collision/types";
import {
  aggregateBranchStatuses,
  branchFitsLimit,
  evaluateClearanceLimits,
  isBranchDefinitelyInapplicable,
  isPredicateDefinitelyFalse,
} from "../physical/clearanceLimit/evaluateClearanceLimits";
import {
  indexGlbPhysicalNodesFromPath,
  type GlbPhysicalIndex,
} from "../physical/indexGlbPhysicalNodes.node";
import { buildVerdict } from "../ui/buildVerdict";
import { createPartCatalog } from "../state/validateBuildState";
import { catalogManifestFileSchema } from "../contract/cat6.schema";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const A3_PART_PATH = "parts/case/case.lian-li-a3-matx-black/part.json";

function readJson(relPath: string): unknown {
  return JSON.parse(
    fs.readFileSync(path.join(repoRoot, relPath), "utf8"),
  );
}

function loadCatalogAndIndexes() {
  const manifest = catalogManifestFileSchema.parse(
    JSON.parse(
      fs.readFileSync(
        path.join(repoRoot, "parts/catalog-manifest.json"),
        "utf8",
      ),
    ),
  );
  const parts = manifest.parts.map((entry) => {
    const raw = JSON.parse(
      fs.readFileSync(path.join(repoRoot, entry.path), "utf8"),
    );
    return partDefinitionV2Schema.parse(raw);
  });
  const catalog = createPartCatalog(parts);
  const indexes = new Map<string, GlbPhysicalIndex>();
  for (const part of parts) {
    if (!part.physicalSpec) continue;
    indexes.set(
      part.id,
      indexGlbPhysicalNodesFromPath(
        part.id,
        path.join(repoRoot, part.modelGlbPath),
      ),
    );
  }
  return { catalog, indexes, parts };
}

function partsMapForBuild(partIds: string[]) {
  const { parts } = loadCatalogAndIndexes();
  const selected = parts.filter((p) => partIds.includes(p.id));
  return createPartCatalog(selected).byId;
}

function compatReportFit() {
  return {
    compatContractVersion: "compat2" as const,
    buildStateVersion: "vs2" as const,
    checks: [],
    overallStatus: "compatible" as const,
    dataVersion: "test",
  };
}

describe("phys3 conditional status", () => {
  it("parses conditional through the phys3 schema", () => {
    expect(physicalValidationStatusSchema.safeParse("conditional").success).toBe(
      true,
    );
  });
});

describe("aggregatePhysicalStatus precedence", () => {
  const base = {
    involvedPartIds: ["a"],
    involvedNodeNames: ["n"],
    evidenceSourceIds: [],
  };

  it("orders interference > unavailable > conditional > fit", () => {
    expect(
      aggregatePhysicalStatus([
        { checkId: "1", kind: "collision", status: "fit", ...base },
        { checkId: "2", kind: "clearance-limit", status: "conditional", ...base },
      ]),
    ).toBe("conditional");

    expect(
      aggregatePhysicalStatus([
        { checkId: "1", kind: "collision", status: "conditional", ...base },
        { checkId: "2", kind: "collision", status: "unavailable", ...base, explanation: "x" },
      ]),
    ).toBe("unavailable");

    expect(
      aggregatePhysicalStatus([
        { checkId: "1", kind: "collision", status: "conditional", ...base },
        { checkId: "2", kind: "collision", status: "interference", ...base, explanation: "x" },
      ]),
    ).toBe("interference");
  });
});

describe("clearance-limit scalar evaluator", () => {
  const caseLimit = (limitMm: number, appliesWhen?: ClearanceLimit["appliesWhen"]) => ({
    limitMm,
    condition: "test branch",
    appliesWhen,
  });

  it("unknown applicability fact retains a branch", () => {
    const limit = caseLimit(200, [
      { subject: "psu.lengthMm", operator: "gt", valueMm: 140 },
    ]);
    expect(
      isBranchDefinitelyInapplicable(limit, { psuLengthMm: undefined }),
    ).toBe(false);
  });

  it("definitely-false psu.lengthMm predicate excludes a branch", () => {
    const limit = caseLimit(200, [
      { subject: "psu.lengthMm", operator: "gt", valueMm: 140 },
    ]);
    expect(isBranchDefinitelyInapplicable(limit, { psuLengthMm: 140 })).toBe(true);
    expect(isPredicateDefinitelyFalse(
      { subject: "psu.lengthMm", operator: "gt", valueMm: 140 },
      { psuLengthMm: 140 },
    )).toBe(true);
  });

  it("no appliesWhen means retained", () => {
    expect(isBranchDefinitelyInapplicable(caseLimit(200), { psuLengthMm: 140 })).toBe(
      false,
    );
  });

  it("target measurement missing → unavailable", () => {
    const partsById = partsMapForBuild([
      "case.lian-li-a3-matx-black",
      "cooler.noctua-nh-d15-g2",
    ]);
    const cooler = partsById.get("cooler.noctua-nh-d15-g2");
    if (cooler) {
      cooler.dimensionsMm = undefined;
    }
    const checks = evaluateClearanceLimits({
      partsById,
      casePartId: "case.lian-li-a3-matx-black",
      selectedPartIds: { coolerId: "cooler.noctua-nh-d15-g2" },
    });
    const coolerCheck = checks.find((c) =>
      c.checkId === "clearance-limit:cpu-cooler-height",
    );
    expect(coolerCheck?.status).toBe("unavailable");
  });

  it("all retained fit → fit", () => {
    expect(aggregateBranchStatuses(["fit", "fit"])).toBe("fit");
  });

  it("all retained fail → interference", () => {
    expect(aggregateBranchStatuses(["fail", "fail"])).toBe("interference");
  });

  it("mixed retained results → conditional", () => {
    expect(aggregateBranchStatuses(["fit", "fail"])).toBe("conditional");
  });

  it("zero retained branches → unavailable", () => {
    expect(aggregateBranchStatuses([])).toBe("unavailable");
  });

  it("exact 140 mm and 150 mm threshold behavior", () => {
    expect(branchFitsLimit(140, 140)).toBe(true);
    expect(branchFitsLimit(141, 140)).toBe(false);

    const lte140 = caseLimit(140, [
      { subject: "psu.lengthMm", operator: "lte", valueMm: 140 },
    ]);
    const gt140 = caseLimit(140, [
      { subject: "psu.lengthMm", operator: "gt", valueMm: 140 },
    ]);
    expect(isBranchDefinitelyInapplicable(lte140, { psuLengthMm: 140 })).toBe(false);
    expect(isBranchDefinitelyInapplicable(gt140, { psuLengthMm: 140 })).toBe(true);

    const lte150 = caseLimit(150, [
      { subject: "psu.lengthMm", operator: "lte", valueMm: 150 },
    ]);
    const gt150 = caseLimit(150, [
      { subject: "psu.lengthMm", operator: "gt", valueMm: 150 },
    ]);
    expect(isBranchDefinitelyInapplicable(lte150, { psuLengthMm: 140 })).toBe(false);
    expect(isBranchDefinitelyInapplicable(gt150, { psuLengthMm: 140 })).toBe(true);
    expect(isBranchDefinitelyInapplicable(gt150, { psuLengthMm: 151 })).toBe(false);
  });

  it("A3 + NH-D15 G2 yields cooler-height interference (165 mm vs 168 mm)", () => {
    const partsById = partsMapForBuild([
      "case.lian-li-a3-matx-black",
      "cooler.noctua-nh-d15-g2",
      "psu.corsair-rm750e",
    ]);
    const checks = evaluateClearanceLimits({
      partsById,
      casePartId: "case.lian-li-a3-matx-black",
      selectedPartIds: {
        coolerId: "cooler.noctua-nh-d15-g2",
        psuId: "psu.corsair-rm750e",
      },
    });
    const coolerCheck = checks.find(
      (c) => c.checkId === "clearance-limit:cpu-cooler-height",
    );
    expect(coolerCheck?.status).toBe("interference");
    expect(coolerCheck?.kind).toBe("clearance-limit");
  });

  it("A3 + RM750e 140 mm filters provably impossible PSU-length GPU branches", () => {
    const a3 = partDefinitionV3Schema.parse(readJson(A3_PART_PATH));
    const gpuLimits = a3.clearanceLimits?.maxGpuLength ?? [];
    const facts = { psuLengthMm: 140 };

    const retained = gpuLimits.filter(
      (limit) => !isBranchDefinitelyInapplicable(limit, facts),
    );
    const excluded = gpuLimits.filter((limit) =>
      isBranchDefinitelyInapplicable(limit, facts),
    );

    expect(excluded.some((l) => l.condition?.includes(">150mm"))).toBe(true);
    expect(excluded.some((l) => l.condition?.includes(">140mm"))).toBe(true);
    expect(retained.some((l) => l.condition?.includes("S2"))).toBe(true);
    expect(retained.some((l) => l.condition?.includes("S3"))).toBe(true);

    const partsById = partsMapForBuild([
      "case.lian-li-a3-matx-black",
      "gpu.asus-dual-rtx4070-o12g",
      "psu.corsair-rm750e",
    ]);
    const gpuCheck = evaluateClearanceLimits({
      partsById,
      casePartId: "case.lian-li-a3-matx-black",
      selectedPartIds: {
        gpuId: "gpu.asus-dual-rtx4070-o12g",
        psuId: "psu.corsair-rm750e",
      },
    }).find(
      (c) => c.checkId === "clearance-limit:gpu-length",
    );
    expect(gpuCheck?.status).toBe("conditional");
  });

  const A3_NON_DEFAULT_BUILD = {
    ...DEFAULT_BUILD_STATE_V2,
    caseId: "case.lian-li-a3-matx-black",
    gpuId: "gpu.asus-proart-rtx4080-o16g",
    psuId: "psu.cooler-master-v550-sfx-gold",
    coolerId: "cooler.noctua-nh-d15-g2",
  };

  it("uses selected GPU/PSU from full catalog, not first manifest entries", () => {
    const { catalog } = loadCatalogAndIndexes();
    const checks = evaluateClearanceLimits({
      partsById: catalog.byId,
      casePartId: A3_NON_DEFAULT_BUILD.caseId,
      selectedPartIds: {
        gpuId: A3_NON_DEFAULT_BUILD.gpuId,
        coolerId: A3_NON_DEFAULT_BUILD.coolerId,
        psuId: A3_NON_DEFAULT_BUILD.psuId,
      },
    });

    const gpuCheck = checks.find((c) => c.checkId === "clearance-limit:gpu-length");
    expect(gpuCheck?.involvedPartIds).toContain("gpu.asus-proart-rtx4080-o16g");
    expect(gpuCheck?.involvedPartIds).not.toContain("gpu.asus-dual-rtx4070-o12g");
    expect(gpuCheck?.explanation).toContain("300 mm length");

    const coolerCheck = checks.find(
      (c) => c.checkId === "clearance-limit:cpu-cooler-height",
    );
    expect(coolerCheck?.involvedPartIds).toContain("cooler.noctua-nh-d15-g2");
    expect(coolerCheck?.explanation).toContain("168 mm height");
  });
});

describe("buildVerdict with conditional physical status", () => {
  const nameOf = (id: string) => id;

  it("conditional alone produces caution with results visible", () => {
    const verdict = buildVerdict({
      compatibility: compatReportFit(),
      physical: {
        physicalContractVersion: "phys3",
        buildStateVersion: "vs2",
        assemblyState: {
          physicalContractVersion: "phys3",
          buildStateVersion: "vs2",
          mountSelections: [],
        },
        checks: [
          {
            checkId: "clearance-limit:gpu-length",
            kind: "clearance-limit",
            status: "conditional",
            involvedPartIds: ["case.lian-li-a3-matx-black", "gpu.asus-dual-rtx4070-o12g"],
            involvedNodeNames: ["clearance-limit:maxGpuLength"],
            explanation: "GPU length fits some branches and fails others.",
            evidenceSourceIds: [],
          },
        ],
        overallStatus: "conditional",
        geometryDataVersion: "test",
      },
      nameOf,
    });
    expect(verdict.level).toBe("caution");
    expect(verdict.showResults).toBe(true);
  });

  it("does not regress fit, interference, or unavailable verdict behavior", () => {
    const compat = compatReportFit();

    expect(
      buildVerdict({
        compatibility: compat,
        physical: {
          physicalContractVersion: "phys3",
          buildStateVersion: "vs2",
          assemblyState: {
            physicalContractVersion: "phys3",
            buildStateVersion: "vs2",
            mountSelections: [],
          },
          checks: [],
          overallStatus: "fit",
          geometryDataVersion: "test",
        },
        nameOf,
      }).level,
    ).toBe("ok");

    expect(
      buildVerdict({
        compatibility: compat,
        physical: {
          physicalContractVersion: "phys3",
          buildStateVersion: "vs2",
          assemblyState: {
            physicalContractVersion: "phys3",
            buildStateVersion: "vs2",
            mountSelections: [],
          },
          checks: [
            {
              checkId: "collision:x",
              kind: "collision",
              status: "interference",
              involvedPartIds: ["a"],
              involvedNodeNames: ["collision:x"],
              explanation: "overlap",
              evidenceSourceIds: [],
            },
          ],
          overallStatus: "interference",
          geometryDataVersion: "test",
        },
        nameOf,
      }).showResults,
    ).toBe(false);

    expect(
      buildVerdict({
        compatibility: compat,
        physical: {
          physicalContractVersion: "phys3",
          buildStateVersion: "vs2",
          assemblyState: {
            physicalContractVersion: "phys3",
            buildStateVersion: "vs2",
            mountSelections: [],
          },
          checks: [
            {
              checkId: "coverage:x",
              kind: "collision",
              status: "unavailable",
              involvedPartIds: ["a"],
              involvedNodeNames: ["part:a"],
              explanation: "missing",
              evidenceSourceIds: [],
            },
          ],
          overallStatus: "unavailable",
          geometryDataVersion: "test",
        },
        nameOf,
      }).showResults,
    ).toBe(false);
  });

  it("physical conditional precedes compat unavailable (B15 regression guard)", () => {
    const verdict = buildVerdict({
      compatibility: {
        compatContractVersion: "compat2",
        buildStateVersion: "vs2",
        checks: [
          {
            checkId: "chipset-bios",
            status: "unavailable",
            explanation: "No BIOS minimum documented.",
            involvedPartIds: ["cpu.amd-ryzen-5-7600", "motherboard.gigabyte-b650-aorus-elite-ax-v2"],
          },
        ],
        overallStatus: "unavailable",
        dataVersion: "test",
      },
      physical: {
        physicalContractVersion: "phys3",
        buildStateVersion: "vs2",
        assemblyState: {
          physicalContractVersion: "phys3",
          buildStateVersion: "vs2",
          mountSelections: [],
        },
        checks: [
          {
            checkId: "clearance-limit:gpu-length",
            kind: "clearance-limit",
            status: "conditional",
            involvedPartIds: ["case.lian-li-a3-matx-black", "gpu.asus-dual-rtx4070-o12g"],
            involvedNodeNames: ["clearance-limit:maxGpuLength"],
            explanation: "mixed branches",
            evidenceSourceIds: [],
          },
        ],
        overallStatus: "conditional",
        geometryDataVersion: "test",
      },
      nameOf,
    });
    expect(verdict.level).toBe("caution");
    expect(verdict.showResults).toBe(true);
  });
});

describe("integrated physical report clearance limits", () => {
  it("default build remains fit with scalar clearance-limit checks", () => {
    const { catalog, indexes } = loadCatalogAndIndexes();
    const assembly = buildAssemblyState(DEFAULT_BUILD_STATE_V2, catalog, indexes);
    const report = buildPhysicalValidationReport({
      assembly,
      partsById: catalog.byId,
      glbIndexes: indexes,
    });
    expect(report.overallStatus).toBe("fit");
    expect(
      report.checks.some((c) => c.kind === "clearance-limit"),
    ).toBe(true);
  });

  it("A3 demonstration build reports cooler interference from clearance limits", () => {
    const { catalog, indexes } = loadCatalogAndIndexes();
    const build = {
      ...DEFAULT_BUILD_STATE_V2,
      caseId: "case.lian-li-a3-matx-black",
    };
    const assembly = buildAssemblyState(build, catalog, indexes);
    const report = buildPhysicalValidationReport({
      assembly,
      partsById: catalog.byId,
      glbIndexes: indexes,
    });
    const coolerLimit = report.checks.find(
      (c) => c.checkId === "clearance-limit:cpu-cooler-height",
    );
    expect(coolerLimit?.status).toBe("interference");
    expect(report.overallStatus).toBe("interference");
  });

  it("full-catalog report uses selected GPU/PSU, not first manifest entries", () => {
    const { catalog, indexes } = loadCatalogAndIndexes();
    const build = {
      ...DEFAULT_BUILD_STATE_V2,
      caseId: "case.lian-li-a3-matx-black",
      gpuId: "gpu.asus-proart-rtx4080-o16g",
      psuId: "psu.cooler-master-v550-sfx-gold",
      coolerId: "cooler.noctua-nh-d15-g2",
    };
    const assembly = buildAssemblyState(build, catalog, indexes);
    const report = buildPhysicalValidationReport({
      assembly,
      partsById: catalog.byId,
      glbIndexes: indexes,
    });

    const gpuLimit = report.checks.find(
      (c) => c.checkId === "clearance-limit:gpu-length",
    );
    expect(gpuLimit?.involvedPartIds).toContain("gpu.asus-proart-rtx4080-o16g");
    expect(gpuLimit?.involvedPartIds).not.toContain("gpu.asus-dual-rtx4070-o12g");
    expect(gpuLimit?.explanation).toContain("300 mm length");

    const coolerLimit = report.checks.find(
      (c) => c.checkId === "clearance-limit:cpu-cooler-height",
    );
    expect(coolerLimit?.involvedPartIds).toContain("cooler.noctua-nh-d15-g2");
    expect(coolerLimit?.explanation).toContain("168 mm height");
  });
});
