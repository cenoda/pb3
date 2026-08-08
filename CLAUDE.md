# CLAUDE.md

Project instructions for Claude Code (and Grok Claude-compat) in this repository.

**Full agent brief (SSOT):** [`AGENTS.md`](./AGENTS.md) — read it first and follow it.

## Hard gates (do not skip)

- **Phase 0 app and Phase 1 `perf1` engine are implemented and closed out**. Phase 2 `vs2`/`compat2` is closed out. Phase 3 `phys3` implementation is complete and **awaiting owner closeout**. Source lives under `src/`; fixtures stay at repo-root `parts/` and `benchmarks/`.
- **Runtime locked:** static SPA — `docs/decisions/ADR-001-runtime-static-spa.md` (phases 0–3 scope; revisit if server compute is required).
- **Stack core locked:** TypeScript + React + R3F + Vite — `docs/decisions/ADR-002-stack-core-ts-react-r3f-vite.md`.
- **Stage 3 locked:** pnpm + Zod + Zustand + Vitest; fixture `/parts` + `/benchmarks` — `docs/decisions/ADR-003-stage3-tooling-and-fixtures.md`.
- **E2E locked (project practice):** Playwright **Test** headless Chromium — `e2e/exit-scenario.spec.ts`, `pnpm test:e2e`. Prefer `pnpm test:all` before hand-off or tag.
- **Agent explore (optional):** Playwright CLI (`pnpm explore:phase0` with `pnpm dev`) and/or Playwright MCP (`@playwright/mcp`) — see `docs/verification/AGENT_BROWSER_EXPLORATION.md`. Not a merge gate.
- **License locked (code + data):** Apache License 2.0, root `LICENSE` — `docs/decisions/ADR-004-license-code-apache-2.0.md`. 3D asset (`model.glb`) license still open.
- Experimental scaffold `1d54c10` was **discarded**; it is not baseline.
- Phase-0 home: `docs/phases/phase-0/` (specs, TODO, plan, fixes).
- Never invent FPS; unknown combos are `unavailable`. Estimates are ranges with confidence.
- Tag `vertical-slice-v0` is **created and pushed**.

## Session bootstrap

1. `AGENTS.md`
2. `STATUS.md`
3. `docs/phases/phase-0/TODO.md`
4. Contract when needed: `docs/phases/phase-0/specs/vertical-slice-data-contract.md`
5. Plan when coding: `docs/phases/phase-0/implementation_plan.md`

## Verification

```bash
pnpm test          # Vitest unit
pnpm test:e2e      # Playwright headless (build + preview)
pnpm test:all      # both
pnpm build         # production bundle + fixture copy into dist/
```

## Language

- Talk to the user in **Korean** (team identity).
- Repo-facing text (specs, commits, ADRs, this file): **English** unless the file you edit is already Korean prose — then match that file.

## Identity note

Global persona (Lira) and team bridge/memory rules come from the harness / `~/.agent-team/`. This file is **project** policy only.
