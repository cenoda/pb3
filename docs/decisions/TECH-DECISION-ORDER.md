# Tech decision order (Phase 0 → implementation)

Status: **process accepted** (individual items still open unless noted)  
Language: English (decision process); Korean summary may live in `STATUS.md`.

This is the dependency order for stack choices. Do not reverse it: later choices must not force earlier ones.

## Owner / environment notes

| Topic | State |
|-------|--------|
| IDE | **WebStorm** and **Cursor** (planned; DX, not a stack lock) |
| Git push | Owner pushes; agents commit only when asked/allowed |
| Language | **Not decided** (TypeScript is a low-risk default candidate only) |
| Implementation | **Not started** until owner explicitly starts it |
| **Live public site** | **Not available now** — do not block Phase 0 on a deployed URL |
| **Likely future hosts** | **GCP** or **Azure** (static / object-storage + CDN style). Not Vercel/Netlify/GitHub Pages as the planned primary |

## Stage 1 — Foundation (blocks everything else)

| Decision | Why first | Notes |
|----------|-----------|--------|
| **App runtime shape** | Determines whether a backend, SSR, or client-only model is in play | Phase-0 non-goals already exclude backend, auth, prices → **static SPA is a strong candidate (not locked)**, not yet formally locked |
| **Deploy host** | Narrows once runtime is static assets | **Deferred for Phase 0.** Verify exit criteria with **local preview** only. When deploy matters later: prefer **GCP or Azure** static hosting; keep build output portable (static files + SPA fallback), avoid host-specific frameworks |

## Stage 2 — Stack core (tightly coupled)

| Decision | Coupling |
|----------|----------|
| **Language** | Low risk to pick early once runtime is SPA; still **open** |
| **UI framework + 3D stack** | **Decide as a pair** (e.g. React ↔ R3F, or vanilla ↔ Three.js). Do not pick one without the other |
| **Bundler / build tool** | Usually follows the UI choice; Vite is a common default for SPA + TS, not locked |

## Stage 3 — Satellite tools (follow Stage 2)

| Decision | Depends on |
|----------|------------|
| Package manager (`npm` / `pnpm` / …) | Low risk; anytime after Stage 2 starts |
| Schema / state / test (e.g. Zod, store, Vitest) | Natural defaults once UI stack is known |
| Fixture HTTP path strategy | Build tool static-serve conventions (`public/`, copy plugin, etc.) |

## Stage 4 — Not urgent

| Decision | Notes |
|----------|--------|
| IDE / DX polish | Preference; WebStorm + Cursor already planned |

## Parallel track (does not block Stage 1–2 discussion)

| Decision | Notes |
|----------|--------|
| **Open-source license** (code / data / 3D assets may differ) | Can discuss anytime; **finish code license before adding third-party dependencies** to avoid painful incompatibility rework |

## Recommended sequence (short)

```text
runtime shape  (deploy host deferred: local only for now; later GCP or Azure)
  → language
  → (UI framework + 3D stack together)
  → bundler
  → package manager / schema / state / test / fixture serve
  → implement scaffold (only after owner “start implementation”)
```

License: parallel, but before `npm install` / equivalent.

### Deploy implications (accepted constraint)

- No requirement for a public demo URL in Phase 0.
- Do not design the scaffold around a specific PaaS (Vercel/Netlify/etc.).
- Prefer **portable static artifacts** so the same `dist/` (or equivalent) can land on GCS + CDN, Azure Static Web Apps / Blob + CDN, or local `preview`.
- Cloud-specific IaC/CI for GCP/Azure is **out of Phase 0** unless the owner reopens it.

## Formal ADRs

When a stage item is locked, add `ADR-NNN-title.md` under this folder and update:

- [`README.md`](./README.md) (index)
- [`STATUS.md`](../../STATUS.md)
- [`docs/phases/phase-0/TODO.md`](../phases/phase-0/TODO.md)
- [`AGENTS.md`](../../AGENTS.md) (if gates change)
