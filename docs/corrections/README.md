# Corrections

Bounded **corrective gates** over the existing application. These are **not**
charter phases, not roadmap expansions, and not architecture resets.

| Work item | Path | Status |
|-----------|------|--------|
| Product UX M0 (builder surface) | [`product-ux-1/`](./product-ux-1/) | **Closed — owner UX PASS (2026-08-09)**; Phase 4 Step 9 unchanged |
| Phase 4 external evidence correction | [`phase4-external-evidence-1/`](./phase4-external-evidence-1/) | **Owner-accepted; Cursor implementation authorized (2026-08-09)**; false first-party claim removed |
| Product UX 2 (product journey) | [`product-ux-2/`](./product-ux-2/) | **Closed into Phase 5 (2026-08-09).** Audit delivered (verdict FAIL); the work itself moved to [`../phases/phase-5/`](../phases/phase-5/) |

**The corrective track is closed.** Product-surface work is a charter phase
(Phase 5), not a corrective gate. `product-ux-1` shipped the application shell;
`product-ux-2` produced the audit that scopes Phase 5 and did not proceed to
implementation. Do not open new product-surface correctives — extend Phase 5.

## Rules

1. A corrective gate may restructure **product surface presentation only** unless
   an accepted plan says otherwise.
2. Existing contracts (`vs0`, `perf1`, `vs2`, `compat2`, `phys3`, `prov4`),
   engines, fixtures, and functional behavior remain preserved unless the plan
   explicitly and narrowly amends them (default: no contract changes).
3. Implementation still requires:
   - owner acceptance of the corrective package, **and**
   - a separate explicit implementation-start instruction.
4. Corrective work does **not** replace Phase 4 Step 9 evidence-quality
   closeout, and does **not** open Phase 5.

Charter phases remain under [`../phases/`](../phases/). Roadmap order remains
under [`../roadmap/PHASES.md`](../roadmap/PHASES.md).
