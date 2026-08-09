# Product UX 2 (`product-ux-2`)

Second product-level corrective gate over the existing SPA. `product-ux-1`
delivered the application **shell**; this gate judges the **product journey**.

**Closed 2026-08-09 — absorbed into [Phase 5](../../phases/phase-5/).**

| Step | Artifact | Status |
|------|----------|--------|
| 1. Audit (no code) | [`AUDIT.md`](./AUDIT.md) | **Done — 2026-08-09, verdict FAIL** |
| 2. Plan | — | **Moved.** Product-surface work is a charter phase, not a corrective gate: [`../../phases/phase-5/`](../../phases/phase-5/) |

This folder is retained for the audit evidence only. New product-surface work
goes to Phase 5.

## Boundary

- Presentation only. No contract (`vs0`, `perf1`, `vs2`, `compat2`, `phys3`,
  `prov4`, `est1`), fixture, engine, or inventory change unless an accepted plan
  narrowly amends it.
- Does not reopen Phase 0–4 architecture and does not close Phase 4 Step 9.
- Desktop only; mobile explicitly out of scope for this gate.
- Provenance data (source ids, digests, freshness) is **retained**, relocated
  behind a user-framed disclosure — never deleted.

## Reproducing the audit

```bash
pnpm build
pnpm exec vite preview --host 127.0.0.1 --port 4173 --strictPort
# then drive http://127.0.0.1:4173/ at 1280x720 / 1440x900 / 1920x1080
```
