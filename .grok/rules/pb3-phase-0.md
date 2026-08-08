# pb3 — Phase 0 hard rules (Grok project rules)

Loaded automatically under `.grok/rules/`. Detail lives in repo-root `AGENTS.md`.

## Gates

- **Phase 0 app is implemented** (Steps 1–8 under `src/`). Fixtures SSOT: repo-root `parts/`, `benchmarks/`.
- **Runtime locked:** static SPA — `docs/decisions/ADR-001-runtime-static-spa.md` (scoped phases 0–3; revisit if server compute needed).
- **Stack core locked:** TS + React + R3F + Vite — `docs/decisions/ADR-002-stack-core-ts-react-r3f-vite.md`.
- **Stage 3 locked:** pnpm, Zod, Zustand, Vitest; fixtures via `/parts` + `/benchmarks` — `docs/decisions/ADR-003-stage3-tooling-and-fixtures.md`.
- **E2E:** Playwright Test headless (`pnpm test:e2e`) is the regression gate for Step 8. Prefer `pnpm test:all` after behavior changes.
- **Agent explore (optional):** Playwright CLI / MCP — `docs/verification/AGENT_BROWSER_EXPLORATION.md`. Always available; not required every commit.
- **Do not revive** discarded scaffold `1d54c10` as baseline (even if a future stack looks similar).
- Phase home: `docs/phases/phase-0/`. Contract version `vs0`. URL: full encode / lenient decode. No invented FPS.
- Deploy: local only for Phase 0; later GCP/Azure; portable static output.
- Tag `vertical-slice-v0` is owner-only.
- Commits when the owner asks or allows; English commit messages; no force-push unless asked. Push only when the owner explicitly requests it.

## Before non-trivial work

1. Read `AGENTS.md` and `STATUS.md`.
2. Check `docs/phases/phase-0/TODO.md` and `implementation_plan.md`.
3. Prefer smallest correct change; run `pnpm test` and/or `pnpm test:e2e` as relevant.
