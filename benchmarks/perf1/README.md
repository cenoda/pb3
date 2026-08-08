# Phase-1 performance fixtures (`perf1`)

Canonical field shapes and vocabulary: [`docs/phases/phase-1/specs/performance-data-contract.md`](../../docs/phases/phase-1/specs/performance-data-contract.md).

| File | Role |
|------|------|
| [`performance-fixtures.json`](./performance-fixtures.json) | Baseline FPS happy-path table: **96 rows** (full §2.4 cross product). All `confidence: "stub"`. |
| [`cinebench-fixtures.json`](./cinebench-fixtures.json) | Cinebench workload table: **8 rows** (2 CPU × 2 versions × 2 metrics). All `confidence: "stub"`. |
| [`correction-examples.json`](./correction-examples.json) | **Test-only** environment-correction examples (`CorrectedEstimate` / `WithheldCorrection`). |
| [`unavailable-examples.json`](./unavailable-examples.json) | **Test-only** `status: "unavailable"` examples. Not merged into happy-path tables. |

Numbers and scores are ordinal wiring stubs. They are **not** laboratory measurements. None of this data should be treated as measured benchmark evidence.
