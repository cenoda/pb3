# Phase 4 + 4.1 — freeze record

| Field | Value |
|-------|--------|
| Date | **2026-08-09** |
| Decision | **Owner freeze** — pause further Phase 4 / 4.1 product work |
| Tree | `main` at freeze (see git log around this commit) |
| Parallel | **Phase 5 may proceed** as a separate track (Nox-aligned); not blocked on finishing est1 sim / Step 9 |

---

## 1. Why freeze

Phase 4 established **evidence discipline** (prov4, no fake first-party, external
rights/aggregation). Phase 4.1 established a **temporary draft combination
estimator** (`est1`) and a **manufacturer specs spine** (AMD catalog auto-harvest).

Continuing immediately into full **spec→FPS simulation** and multi-CPU product
numbers is large. Owner + Nox direction: **pause here**, open **Phase 5** in
parallel. Frozen docs are owner-agreed baseline.

---

## 2. What is frozen (accepted as current truth)

### Phase 4 (`prov4` + external-evidence-1)

| Item | State at freeze |
|------|-----------------|
| Invalid first-party pilot claim | **Removed** |
| External observation contract + aggregation | **Shipped** |
| Source-rights fail-closed | **Shipped** |
| Exact-match product external FPS | **Empty by design** (no invented rows) |
| Pilot product FPS UX | **Unavailable / synthetic residual** paths honest |
| Step 9 evidence-quality owner PASS | **Not claimed** — remains open if/when work resumes |

### Phase 4.1 (`est1`)

| Item | State at freeze |
|------|-----------------|
| Algorithm O1–O9 | **Locked** |
| Temporary draft function caveat | **Documented** (no MB/cooling in M0 query) |
| `est1` pure estimator + UI classes | **Software green** |
| Manufacturer-centric multi-CPU strategy | **Documented** (AMD catalog = sim **inputs**) |
| AMD specs auto-harvest | **Shipped** (`vendor-catalog/`, curator script) |
| Spec-driven full FPS simulator | **Not done** — intentional freeze boundary |
| Game FPS from manufacturer catalog | **N/A** — catalog is specs; FPS is our function |

### Product UX

| Item | State |
|------|--------|
| `product-ux-1` | **Closed** (earlier) |

---

## 3. Explicitly not done (resume later)

- Owner Step 9 PASS for external evidence quality
- Spec-feature → combination FPS simulation (beyond anchor/scale M0)
- Filling `CpuScaleEdge` / vendor FPS anchors for product `est1-estimated`
- Motherboard / cooling / power transforms in estimator
- Phase 4 “full evidence-grade catalog”

---

## 4. Resume rules

1. Unfreeze only with **explicit owner instruction**.
2. Prefer a new corrective or phase-4.x package rather than silent continuation.
3. Phase 5 work must **not** silently rewrite frozen `prov4` / `est1` contracts;
   coordinate if shared surfaces change.

---

## 5. Pointers

| Doc | Role |
|-----|------|
| [`../phase-4.1/`](../phase-4.1/) | est1 + AMD catalog automation |
| [`../../corrections/phase4-external-evidence-1/`](../../corrections/phase4-external-evidence-1/) | External evidence correction |
| [`SOURCE_INGESTION_INVESTIGATION.md`](./SOURCE_INGESTION_INVESTIGATION.md) | Why exact review FPS was empty |
| [`../../roadmap/PHASES.md`](../../roadmap/PHASES.md) | Roadmap freeze + Phase 5 parallel note |
