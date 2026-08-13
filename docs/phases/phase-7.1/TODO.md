# Phase 7.1 TODO

Home: [`README.md`](./README.md) · Scope: [`specs/phase-7.1.md`](./specs/phase-7.1.md)
· Plan: [`implementation_plan.md`](./implementation_plan.md)

Status: **M0 accepted 2026-08-13. O1–O10 locked as proposed.
First slice Steps 1–8 software closeout accepted 2026-08-13.
Collection increment follow-up authorized (still dry-run).**

## M0 planning gate

- [x] Draft the bounded scope spec (`specs/phase-7.1.md`).
- [x] Draft the ordered, file-level `implementation_plan.md`.
- [x] Draft this checklist.
- [x] Owner locks O1–O10 (as proposed, no amendments) — **2026-08-13**.
- [x] Owner accepts the complete M0 planning package — **2026-08-13**.
- [x] Receive a **separate** explicit instruction to start implementation.

## First implementation slice

- [x] Step 1 — `ing7` types + Zod + schema tests; `.gitignore` `.ingest/`
- [x] Step 2 — workspace helpers + candidate writer (no catalog I/O)
- [x] Step 3 — bounded fetch; CI is fixture-only
- [x] Step 4 — deterministic normalizer
- [x] Step 5 — exact-SKU matcher (boxed/tray, SUPER, G2, capacity, revision)
- [x] Step 6 — rights review engine (never emits `approved`)
- [x] Step 7 — three adapters + `pnpm ingest:dry-run` + review packets
- [x] Step 8 — integrity + `pnpm test:all` / `pnpm build` green; shipped tree clean
- [x] First-slice software closeout — **2026-08-13**

## Collection increment (still dry-run; not Step 9/10)

- [x] Candidate list as checked-in data (`scripts/ingest/candidates.json`)
- [x] Commons File: URL → API fetch + live `extmetadata` parse
- [x] AMD product page `dt`/`dd` parse (real HTML, not fixture-only `#product-spec`)
- [x] `--live` stacks packets under `.ingest/` only; `--apply` still refused

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
