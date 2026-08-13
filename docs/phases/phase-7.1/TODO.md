# Phase 7.1 TODO

Home: [`README.md`](./README.md) · Scope: [`specs/phase-7.1.md`](./specs/phase-7.1.md)
· Plan: [`implementation_plan.md`](./implementation_plan.md)

Status: **M0 accepted 2026-08-13. O1–O10 locked as proposed.
Implementation not started.**

## M0 planning gate

- [x] Draft the bounded scope spec (`specs/phase-7.1.md`).
- [x] Draft the ordered, file-level `implementation_plan.md`.
- [x] Draft this checklist.
- [x] Owner locks O1–O10 (as proposed, no amendments) — **2026-08-13**.
- [x] Owner accepts the complete M0 planning package — **2026-08-13**.
- [ ] Receive a **separate** explicit instruction to start implementation.

## First implementation slice (blocked on the gate above)

- [ ] Step 1 — `ing7` types + Zod + schema tests; `.gitignore` `.ingest/`
- [ ] Step 2 — workspace helpers + candidate writer (no catalog I/O)
- [ ] Step 3 — bounded fetch; CI is fixture-only
- [ ] Step 4 — deterministic normalizer
- [ ] Step 5 — exact-SKU matcher (boxed/tray, SUPER, G2, capacity, revision)
- [ ] Step 6 — rights review engine (never emits `approved`)
- [ ] Step 7 — three adapters + `pnpm ingest:dry-run` + review packets
- [ ] Step 8 — integrity + `pnpm test:all` / `pnpm build` green; shipped tree clean

## Later slices (not first-slice exit)

- [ ] Step 9 — domestic street-price adapter (candidates only)
- [ ] Step 10 — owner-apply command (`--apply` + owner-approved packet; no commit)

## Explicitly out

- New UI / category-page redesign
- Phase 8
- Real-hardware 3D meshes / ADR-004 follow-up
- Automatic rights approval
- Automatic owner approval
- Live pricing claim
- Backend, auth, or deployment
- Inventory expansion beyond the existing 22 parts
- Mutation of frozen Phase 4 / 4.1 contracts or `benchmarks/est1/**`
- Commit or push as part of agent work
