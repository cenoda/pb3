import { describe, expect, it } from "vitest";
import { classifyFreshness } from "../provenance/classifyFreshness";

describe("classifyFreshness", () => {
  const nowIso = "2026-08-09T00:00:00.000Z";

  it("returns unknown when asOf is omitted", () => {
    const result = classifyFreshness({
      policy: { maxAgeDays: 365 },
      nowIso,
    });
    expect(result.state).toBe("unknown");
    expect(result.ageDays).toBeUndefined();
  });

  it("returns unknown when asOf is empty or invalid", () => {
    expect(
      classifyFreshness({
        asOf: "   ",
        policy: { maxAgeDays: 365 },
        nowIso,
      }).state,
    ).toBe("unknown");
    expect(
      classifyFreshness({
        asOf: "not-a-date",
        policy: { maxAgeDays: 365 },
        nowIso,
      }).state,
    ).toBe("unknown");
  });

  it("returns current when age ≤ maxAgeDays", () => {
    const result = classifyFreshness({
      asOf: "2026-07-01T00:00:00.000Z",
      policy: { maxAgeDays: 365 },
      nowIso,
    });
    expect(result.state).toBe("current");
    expect(result.ageDays).toBe(39);
  });

  it("returns stale when age > maxAgeDays", () => {
    const result = classifyFreshness({
      asOf: "2024-01-01T00:00:00.000Z",
      policy: { maxAgeDays: 365 },
      nowIso,
    });
    expect(result.state).toBe("stale");
    expect(result.ageDays).toBeGreaterThan(365);
  });

  it("returns current with explanation when maxAgeDays omitted", () => {
    const result = classifyFreshness({
      asOf: "2020-01-01T00:00:00.000Z",
      policy: {},
      nowIso,
    });
    expect(result.state).toBe("current");
    expect(result.explanation).toMatch(/no automatic freshness window/i);
  });
});
