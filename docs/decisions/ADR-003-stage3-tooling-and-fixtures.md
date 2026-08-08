# ADR-003: Stage 3 tooling + fixture HTTP strategy

- **Status:** Accepted
- **Date:** 2026-08-08
- **Deciders:** Project owner (with agent facilitation)
- **Depends on:** [`ADR-001`](./ADR-001-runtime-static-spa.md), [`ADR-002`](./ADR-002-stack-core-ts-react-r3f-vite.md)
- **Related:** [`TECH-DECISION-ORDER.md`](./TECH-DECISION-ORDER.md) Stage 3, `vs0` contract paths

---

## Context

ADR-002 locked **TypeScript + React + R3F + Vite**. Stage 3 chooses low-risk satellites that usually follow that core, plus how fixture files reach the browser **without moving** repo-root SSOT (`parts/`, `benchmarks/`).

Still **not** implementation start: no install/scaffold until the owner explicitly says so.

---

## Decision

### Package manager

| Choice | **pnpm** |
|--------|----------|
| Lockfile | `pnpm-lock.yaml` committed when implementation starts |
| Why | Fast installs, strict `node_modules` layout, first-class Vite docs support |
| Revisit | If the owner standardizes on npm-only tooling elsewhere; migration cost is low |

Use `pnpm` for install/run scripts in docs and CI once implementation exists. Do not mix lockfiles.

### Schema validation

| Choice | **Zod** |
|--------|---------|
| Use for | Runtime parse of `part.json`, performance fixture tables, URL-decoded `BuildState` (and similar `vs0` boundaries) |
| Why | TS-first, small, good error messages; pairs with “never invent FPS / fail closed to unavailable” |

### Client state

| Choice | **Zustand** |
|--------|-------------|
| Use for | `BuildState` and thin UI stores (selection → URL encode; decode on load) |
| Why | Minimal API, no Provider maze; enough for Phase 0 single-screen state |
| Not | Redux, full React Context-as-store for the whole app (Context for tree-local UI is fine) |

### Tests

| Choice | **Vitest** |
|--------|------------|
| Use for | Pure logic first: URL encode/decode, performance lookup, Zod schemas, catalog loaders |
| Why | Same toolchain family as Vite; fast unit tests without a browser for most Phase 0 logic |
| Browser/E2E | See **Amendment 2026-08-08** below — **Playwright** is now the project E2E tool for the Phase 0 exit scenario |

### Fixture HTTP strategy (normative)

| Rule | Detail |
|------|--------|
| **SSOT on disk** | Keep fixtures at repo root: `parts/**`, `benchmarks/**`. Do **not** make `public/parts` the source of truth. |
| **Browser URL prefix** | App loads fixtures from site-root URLs **`/parts/...`** and **`/benchmarks/...`**. |
| **Path mapping** | `PartDefinition.modelGlbPath` is repo-root relative (e.g. `parts/gpu/gpu.rtx4070/model.glb`). In the browser, request **`/${modelGlbPath}`** (leading slash), i.e. `/parts/gpu/gpu.rtx4070/model.glb`. Same idea for benchmark JSON under `/benchmarks/vs0/...`. |
| **Vite dev** | Configure Vite so those URL prefixes are served from the repo-root directories (middleware plugin, `server.fs.allow` + static middleware, or equivalent). |
| **Vite build** | Copy `parts/` and `benchmarks/` into `dist/` at the same URL paths (e.g. `vite-plugin-static-copy` or a small custom plugin) so `vite preview` and later static hosts (GCP/Azure) work identically. |
| **Base URL** | Phase 0 assumes deploy at site root (`base: '/'`). If a subpath host appears later, revisit `base` and absolute URL helpers together — not required now (no live site). |

Anti-patterns:

- Duplicating fixture trees under `src/` or only under `public/` as a second SSOT
- Bundling large GLBs through the JS graph as arbitrary imports unless a deliberate code-split strategy is added later
- Fetching fixtures from external CDNs in Phase 0

---

## Options briefly rejected

| Option | Why not (for now) |
|--------|-------------------|
| npm / yarn as primary | Fine tools; pnpm chosen for one lockfile convention |
| Yup / io-ts / no schema | Zod fits TS + fail-closed parsing better for this team default |
| Redux / Jotai / Context-only | Heavier or more boilerplate than needed for Phase 0 |
| Jest only | Vitest is the natural Vite pair |
| Move fixtures into `public/` | Breaks “repo-root data SSOT” and confuses docs/agents |

---

## Scope of validity

- Holds for ADR-001 static SPA + ADR-002 stack while Phase 0 (and the same client architecture) remains.
- Fixture URL rules remain valid on any static host that serves `dist/` as site root.
- Revisit package manager or state library only with a short ADR amendment if pain is demonstrated—not casually mid-scaffold.

---

## Consequences

### Positive

- Scaffold can pick defaults without re-arguing Stage 3.
- Contract paths stay stable: disk layout ↔ HTTP paths.
- Pure logic is testable before heavy R3F UI work.

### Negative / accepted

- pnpm must be available in the owner environment (or install via Corepack).
- One small Vite plugin/config surface to maintain for fixtures.
- Zod/Zustand/Vitest/Playwright add dependencies (expected for Stage 3 + E2E amendment).

### Explicit non-consequence

- Does not lock UI component libraries or CSS approach.
- Does not require pixel-level WebGL assertions; E2E proves URL/state/perf/selector + GPU id/path hooks.

---

## Amendment 2026-08-08 — Playwright E2E

| Choice | **Playwright** (`@playwright/test`, headless Chromium) |
|--------|--------------------------------------------------------|
| Use for | Phase 0 **exit scenario** (spec §4 / plan Step 8): clean load, CPU/GPU change, URL rewrite, reload restore, fixture HTTP on built `dist/` |
| Commands | `pnpm test:e2e` (build + `vite preview`); `pnpm test:all` = Vitest + Playwright |
| Spec path | `e2e/exit-scenario.spec.ts` · config `playwright.config.ts` |
| Why now | Owner requires automated regression instead of manual-only Step 8; ADR-003 already allowed optional browser E2E |
| Not | Full visual regression of GLB meshes; optional headed run via `pnpm test:e2e:headed` for human sanity |

Vitest remains the pure-logic suite. Playwright does **not** replace unit tests.

---

## Follow-ups

1. ~~Parallel: open-source **license**~~ — done (ADR-004).
2. ~~Owner: **start implementation**~~ — Phase 0 shipped and `vertical-slice-v0` was tagged and pushed; Phase 1 `perf1` closeout is complete.
