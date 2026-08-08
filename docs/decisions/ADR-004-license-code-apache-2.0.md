# ADR-004: License — code + data under Apache-2.0, 3D assets deferred

- **Status:** Accepted
- **Date:** 2026-08-08
- **Deciders:** Project owner (with agent facilitation)
- **Related:** [`TECH-DECISION-ORDER.md`](./TECH-DECISION-ORDER.md) parallel license track

---

## Context

The tech decision order flags open-source license as a parallel track that should finish **before** the first third-party dependency install (Stage 3 tooling — pnpm/Zod/Zustand/Vitest — is locked but not yet installed). The project also has three distinct license surfaces:

- **Code** (future `src/`, config, build scripts)
- **Data** (`parts/**` fixture JSON, `benchmarks/**` fixture JSON)
- **3D assets** (`model.glb` — currently placeholders; later may model real hardware shapes)

These don't necessarily need the same license.

---

## Decision

| Surface | License | Notes |
|---------|---------|-------|
| **Code** | **Apache License 2.0** | Repo root `LICENSE` file added (unmodified Apache-2.0 text) |
| **Data** (`parts/**`, `benchmarks/**` fixture JSON) | **Apache License 2.0** (same umbrella as code) | No separate data license file; simplest to maintain while fixtures stay small and owner-authored |
| **3D assets** (`model.glb`) | **Still open / deferred** | Placeholder GLBs today carry no meaningful IP. Real hardware models later may raise manufacturer trademark/design-rights questions distinct from code copyright — do **not** assume Apache-2.0 covers assets. Revisit before any non-placeholder model ships. |

All current dependencies targeted by ADR-002/ADR-003 (React, R3F/three, Vite, TypeScript, Zod, Zustand, Vitest, pnpm) are MIT/BSD-licensed and compatible with Apache-2.0 — no conflict for planned installs.

---

## Options considered

| Option | Why not (for code/data) |
|--------|--------------------------|
| MIT | Simpler, but no explicit patent grant; Apache-2.0's patent clause is preferred with no real downside given full dependency compatibility |
| GPL / AGPL | Copyleft is heavier than needed for a permissive-stack static SPA; would also complicate consuming permissive dependencies' ecosystem norms |
| CC0 / Unlicense for data | One license umbrella (Apache-2.0) for code + data is simpler to track than two regimes while fixtures remain owner-authored and small |

---

## Consequences

### Positive

- Third-party installs (Stage 3, ADR-003) are now unblocked on the license axis.
- Single, well-understood permissive license with patent grant for code + data.

### Negative / accepted

- 3D asset licensing remains an open follow-up; must be resolved before shipping non-placeholder hardware models.
- No `NOTICE` file added (not required unless the project later redistributes modified Apache-2.0 third-party NOTICE content).

---

## Follow-ups

1. Decide 3D asset license before replacing placeholder GLBs with real hardware models.
2. Optional: add SPDX license headers to source files at implementation scaffold time.
3. Owner: **start implementation** remains the only other gate before scaffold (ADR-001–003).
