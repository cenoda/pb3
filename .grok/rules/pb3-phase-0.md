# pb3 — Phase 0 hard rules (Grok project rules)

Loaded automatically under `.grok/rules/`. Detail lives in repo-root `AGENTS.md`.

## Gates

- **Docs + fixtures only** until explicit owner “start implementation”. No app code or dependency install without that gate.
- **Runtime locked:** static SPA — `docs/decisions/ADR-001-runtime-static-spa.md` (scoped phases 0–3; revisit if server compute needed).
- **Stack core locked:** TS + React + R3F + Vite — `docs/decisions/ADR-002-stack-core-ts-react-r3f-vite.md`.
- **Stage 3 locked:** pnpm, Zod, Zustand, Vitest; fixtures via `/parts` + `/benchmarks` — `docs/decisions/ADR-003-stage3-tooling-and-fixtures.md`. Lock is **not** implementation start.
- **Do not revive** discarded scaffold `1d54c10` as baseline (even if a future stack looks similar).
- Phase home: `docs/phases/phase-0/`. Fixtures: `parts/`, `benchmarks/vs0/`.
- Contract version `vs0`. URL: full encode / lenient decode. No invented FPS.
- Deploy: local only for Phase 0; later GCP/Azure; portable static output.
- Commits when the owner asks or allows; English commit messages; no force-push unless asked.

## Before non-trivial work

1. Read `AGENTS.md` and `STATUS.md`.
2. Check `docs/phases/phase-0/TODO.md`.
3. Prefer smallest correct doc/data change.
