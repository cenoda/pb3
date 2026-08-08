# Tech decision order (Phase 0 → implementation)

Status: **process accepted** (individual items still open unless noted)  
Language: English (decision process); Korean summary may live in `STATUS.md`.

This is the dependency order for stack choices. Do not reverse it: later choices must not force earlier ones.

## Owner / environment notes

| Topic | State |
|-------|--------|
| IDE | **WebStorm** and **Cursor** (planned; DX, not a stack lock) |
| Git push | Owner pushes; agents commit only when asked/allowed |
| Language | **TypeScript** (ADR-002) |
| Implementation | **Not started** until owner explicitly starts it |
| **Live public site** | **Not available now** — do not block Phase 0 on a deployed URL |
| **Likely future hosts** | **GCP** or **Azure** (static / object-storage + CDN style). Not Vercel/Netlify/GitHub Pages as the planned primary |

## Stage 1 — Foundation (blocks everything else)

| Decision | Why first | Notes |
|----------|-----------|--------|
| **App runtime shape** | Determines whether a backend, SSR, or client-only model is in play | **Locked:** static SPA — [`ADR-001-runtime-static-spa.md`](./ADR-001-runtime-static-spa.md). Scoped to phases 0–3; revisit if server compute is required |
| **Deploy host** | Narrows once runtime is static assets | **Deferred for Phase 0.** Verify exit criteria with **local preview** only. When deploy matters later: prefer **GCP or Azure** static hosting; keep build output portable (static files + SPA fallback), avoid host-specific frameworks |

## Stage 2 — Stack core (tightly coupled) — **locked (ADR-002)**

| Decision | Choice |
|----------|--------|
| **Language** | **TypeScript** |
| **UI framework + 3D stack** | **React + R3F** (`react-three-fiber` / `three`) |
| **Bundler / build tool** | **Vite** |

Detail: [`ADR-002-stack-core-ts-react-r3f-vite.md`](./ADR-002-stack-core-ts-react-r3f-vite.md).

## Stage 3 — Satellite tools — **locked (ADR-003)**

| Decision | Choice |
|----------|--------|
| Package manager | **pnpm** |
| Schema / state / test | **Zod** / **Zustand** / **Vitest** |
| Fixture HTTP path strategy | Repo-root SSOT; browser `/parts`, `/benchmarks`; Vite dev serve + build copy into `dist/` |

Detail: [`ADR-003-stage3-tooling-and-fixtures.md`](./ADR-003-stage3-tooling-and-fixtures.md).

## Stage 4 — Not urgent

| Decision | Notes |
|----------|--------|
| IDE / DX polish | Preference; WebStorm + Cursor already planned |

## Parallel track (does not block Stage 1–2 discussion)

| Decision | Notes |
|----------|--------|
| **Open-source license** (code / data / 3D assets may differ) | **Code + data locked: Apache-2.0** ([`ADR-004`](./ADR-004-license-code-apache-2.0.md)). **3D assets still open** — resolve before real hardware models ship. |

## Recommended sequence (short)

```text
runtime shape = static SPA (ADR-001, scoped)  ✓
  deploy host deferred: local only for now; later GCP or Azure
  language + React + R3F + Vite (ADR-002)  ✓
  pnpm + Zod + Zustand + Vitest + fixture /parts|/benchmarks (ADR-003)  ✓
  license: code + data = Apache-2.0 (ADR-004)  ✓ (3D assets still open)
  → implement scaffold (only after owner “start implementation”)
```

License: code + data settled ahead of first third-party install.

### Deploy implications (accepted constraint)

- No requirement for a public demo URL in Phase 0.
- Do not design the scaffold around a specific PaaS (Vercel/Netlify/etc.).
- Prefer **portable static artifacts** so the same `dist/` (or equivalent) can land on GCS + CDN, Azure Static Web Apps / Blob + CDN, or local `preview`.
- Cloud-specific IaC/CI for GCP/Azure is **out of Phase 0** unless the owner reopens it.

## Formal ADRs

| ADR | Topic |
|-----|--------|
| [`ADR-001-runtime-static-spa.md`](./ADR-001-runtime-static-spa.md) | Static SPA runtime (scoped 0–3; revisit on server compute) |
| [`ADR-002-stack-core-ts-react-r3f-vite.md`](./ADR-002-stack-core-ts-react-r3f-vite.md) | TS + React + R3F + Vite |
| [`ADR-003-stage3-tooling-and-fixtures.md`](./ADR-003-stage3-tooling-and-fixtures.md) | pnpm, Zod, Zustand, Vitest, fixture HTTP |
| [`ADR-004-license-code-apache-2.0.md`](./ADR-004-license-code-apache-2.0.md) | License: code + data = Apache-2.0; 3D assets open |

When further items lock, add `ADR-NNN-title.md` and update:

- [`README.md`](./README.md) (index)
- [`STATUS.md`](../../STATUS.md)
- [`docs/phases/phase-0/TODO.md`](../phases/phase-0/TODO.md)
- [`AGENTS.md`](../../AGENTS.md) (if gates change)
