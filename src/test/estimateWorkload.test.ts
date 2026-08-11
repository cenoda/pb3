import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadCinebenchFixtures } from "../catalog/loadPerf1Fixtures";
import type { CinebenchFixtureFile, WorkloadQuery } from "../contract/perf1";
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

  it("returns unavailable with preparation message for uncovered workload row", () => {
    const fixtures = JSON.parse(
      readFileSync(
        join(repoRoot, "benchmarks/perf1/cinebench-fixtures.json"),
        "utf8",
      ),
    ) as CinebenchFixtureFile;
    const query: WorkloadQuery = {
      cpuId: "cpu.amd-ryzen-5-7600",
      workloadId: "cinebench.r23",
      metric: "metric.multi-core",
    };
    const emptyFixtures: CinebenchFixtureFile = {
      contractVersion: fixtures.contractVersion,
      dataVersion: fixtures.dataVersion,
      rows: [],
    };

    const result = estimateWorkload(query, emptyFixtures);

    expect(result).toEqual({
      status: "unavailable",
      reason:
        "The combination performance estimator is still in preparation; performance data is not available yet.",
    });
    expect(result).not.toHaveProperty("score");
    if ("status" in result) {
      expect(result.reason).toMatch(/preparation/i);
      expect(result.reason).not.toMatch(/perf1|fixture row|fixture table/i);
    }

    const coveredResult = estimateWorkload(query, fixtures);
    expect(coveredResult).not.toHaveProperty("status");
    if ("score" in coveredResult) {
      expect(coveredResult.score).toBeGreaterThan(0);
    }
  });
});
