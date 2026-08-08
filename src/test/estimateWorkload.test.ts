import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadCinebenchFixtures } from "../catalog/loadPerf1Fixtures";
import type { WorkloadQuery } from "../contract/perf1";
import { estimateWorkload } from "../perf/estimateWorkload";

const repoRoot = join(import.meta.dirname, "../..");

describe("estimateWorkload", () => {
  it("returns exact stub scores for all 8 supported rows", async () => {
    const fixtures = await loadCinebenchFixtures();
    expect(fixtures.rows).toHaveLength(8);

    for (const row of fixtures.rows) {
      const query: WorkloadQuery = {
        cpuId: row.cpuId,
        workloadId: row.workloadId,
        metric: row.metric,
      };
      const result = estimateWorkload(query, fixtures);

      expect(result).not.toHaveProperty("status");
      if ("score" in result) {
        expect(result.score).toBe(row.score);
        expect(result.confidence).toBe("stub");
        expect(result.dataVersion).toBe("perf1");
        expect(result.basis).toBe(row.basis);
      }
    }
  });

  it("returns unavailable for unconfirmed workload id without invented score", () => {
    const fixtures = JSON.parse(
      readFileSync(
        join(repoRoot, "benchmarks/perf1/cinebench-fixtures.json"),
        "utf8",
      ),
    );
    const examples = JSON.parse(
      readFileSync(
        join(repoRoot, "benchmarks/perf1/unavailable-examples.json"),
        "utf8",
      ),
    );

    const workloadExample = examples.examples.find(
      (e: { query: WorkloadQuery }) => "workloadId" in e.query,
    );

    const result = estimateWorkload(workloadExample.query, fixtures);
    expect(result).toEqual(workloadExample.result);
    expect(result).not.toHaveProperty("score");
  });
});
