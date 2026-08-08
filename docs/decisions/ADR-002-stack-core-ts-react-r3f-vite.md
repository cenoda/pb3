# ADR-002: Stack core — TypeScript + React + R3F + Vite

- **Status:** Accepted
- **Date:** 2026-08-08
- **Deciders:** Project owner (with agent facilitation)
- **Depends on:** [`ADR-001-runtime-static-spa.md`](./ADR-001-runtime-static-spa.md)
- **Related:** [`TECH-DECISION-ORDER.md`](./TECH-DECISION-ORDER.md) Stage 2

---

## Context

ADR-001 locked the app runtime as a **static SPA** (scoped to charter phases 0–3). Stage 2 needs a concrete **language**, **UI + 3D pair**, and **bundler** so implementation can be scaffolded later without reopening foundation debates.

Owner direction: **TypeScript** and **React** are chosen; **Vite** was unfamiliar but accepted as the standard static-SPA build tool for this pair. **R3F** (react-three-fiber) is the 3D half of the React pair (not vanilla Three.js alone).

This is a **conscious stack lock**, not automatic revival of discarded experimental commit `1d54c10`. That scaffold is still **not** baseline; any future scaffold must follow current specs, fixtures, and ADRs.

**Implementation is still not started** until the owner explicitly says to start implementation (scaffold / install deps / app code).

---

## Options considered

### Language

| Option | Notes |
|--------|--------|
| **TypeScript** | Types align with `vs0` contracts; strong IDE support (WebStorm / Cursor). |
| JavaScript | Less ceremony; weaker contract enforcement. |
| Other (Rust/WASM, etc.) | Out of proportion for Phase 0. |

### UI + 3D (must decide as a pair)

| Option | Notes |
|--------|--------|
| **React + R3F** | UI state, URL, performance panel, and GPU GLB swap share one reactive tree. |
| React + raw Three.js | Possible; more manual canvas lifecycle wiring. |
| Vanilla DOM + Three.js | Fewer deps; UI/state wiring cost grows quickly. |
| Vue/Svelte + Three wrappers | Viable; smaller shared ecosystem for this project’s agents/docs. |

### Bundler

| Option | Notes |
|--------|--------|
| **Vite** | Default pairing for TS + React static SPA; fast dev server; portable `dist/`. |
| Webpack / others | Workable; more config surface for Phase 0. |

---

## Decision

Lock Stage 2 stack core as:

| Layer | Choice |
|-------|--------|
| Language | **TypeScript** |
| UI | **React** |
| 3D | **react-three-fiber (R3F)** on **three** (and typical helpers such as `@react-three/drei` when needed) |
| Bundler / dev / build | **Vite** |

### Normative expectations

1. Source is TypeScript; browser target consistent with ADR-001 static SPA.
2. UI is React function components / hooks (exact style guide can wait for scaffold).
3. 3D viewport integrates via R3F; GPU model swap follows part `modelGlbPath` from fixtures.
4. Vite produces static build output suitable for local preview and later GCP/Azure static hosting (portable artifact; no PaaS-specific framework lock-in).
5. Fixture paths (`parts/`, `benchmarks/`) remain repo-root SSOT; **how** Vite serves/copies them is **Stage 3** (fixture HTTP strategy), not fixed in this ADR beyond “must work in dev and production build.”

### Out of scope for this ADR (Stage 3+)

- Package manager (`npm` / `pnpm` / …)
- Schema validation, client state library, test runner (e.g. Zod / Zustand / Vitest) — likely defaults later, **not locked here**
- Exact folder layout under `src/`
- Open-source license
- Implementation scaffold itself

---

## Scope of validity

Same product envelope as ADR-001:

- Valid while the product remains a **static SPA** under charter phases **0–3** assumptions (no first-party backend / auth / server-side measured performance model as app runtime).
- If ADR-001 is revisited (server compute required), **re-check** whether this stack still fits (usually the SPA client stack **remains** and an API is added beside it).

### Revisit this ADR when

- React or R3F becomes a clear productivity or technical blocker for Phase 0 exit criteria
- A different UI+3D pair is deliberately chosen after a spike
- Build toolchain must change for non-negotiable host/toolchain constraints

Do **not** revisit merely because a discarded historical scaffold used similar libraries.

---

## Consequences

### Positive

- Stage 3 and scaffold work have a fixed core.
- Strong match to Phase 0 flow: selection UI ↔ state ↔ R3F viewport ↔ stub perf panel ↔ URL.
- Aligns with common docs/examples and agent familiarity.

### Negative / accepted costs

- React + R3F learning surface for contributors new to client 3D.
- Dependency weight vs vanilla Three.
- Must keep “spec-first” discipline so scaffold does not invent features outside Phase 0.

### Explicit non-consequence

- Accepting this ADR **does not** authorize dependency install or app code. That remains behind **“start implementation.”**

---

## Follow-ups

1. Stage 3: package manager, schema/state/test defaults, fixture serve/copy strategy under Vite.
2. Parallel: code/data/asset licenses before third-party deps if not already settled.
3. Owner: explicit **start implementation** → scaffold only to Phase 0 exit checklist.
