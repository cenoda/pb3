# ADR-001: App runtime = static SPA (scoped)

- **Status:** Accepted
- **Date:** 2026-08-08
- **Deciders:** Project owner (with agent facilitation)
- **Related:** [`TECH-DECISION-ORDER.md`](./TECH-DECISION-ORDER.md), Phase 0 non-goals, [`PROJECT_CHARTER.md`](../../PROJECT_CHARTER.md) phases 0–3

---

## Context

Phase 0 must prove one thin browser path: part fixtures → `BuildState` → GPU GLB swap → stub FPS ranges → full URL encode / lenient decode → reload restore. Charter phases 0–3, as currently written, do **not** require a first-party app backend, authentication, live pricing, or a server-side measured performance model.

Stage 2 (language, UI + 3D pair, bundler) needs a firm **runtime footing**. A vague “probably SPA” leaves those choices without a base; an absolute “never a server” would force a full ADR reversal if server compute appears later, and would erode trust in decision records.

Deploy is already deferred: no live public site now; later hosts likely GCP or Azure; Phase 0 verification is **local only**. That does not change the runtime shape of the app itself.

---

## Options considered

| Option | Summary |
|--------|---------|
| **A. Static SPA** | Build produces static assets; all Phase 0–3 product logic runs in the browser; host only serves files (plus SPA fallback when deployed). |
| B. SSR / meta-framework | Server renders HTML and/or hosts API routes in the same app. |
| C. Full-stack (API + DB from day one) | Dedicated backend as part of the app runtime. |
| D. MPA / mostly static HTML | Multi-page or document-centric, minimal client app. |

---

## Decision

**Choose A: static SPA**, with an explicit **scope of validity** and **revisit triggers** (below).

### Definition (normative for this ADR)

1. The application is a **single-page client app** in the browser.
2. **Build output is static files** (HTML/JS/CSS + fixtures such as JSON/GLB). No app server is required to run the product logic in scope.
3. State sharing for Phase 0 uses **URL (and/or local client state)** as already specified in the `vs0` contract — not server sessions.
4. Future deploy targets (GCP / Azure / local preview) consume the **same portable static artifact**; scaffolding must not depend on a specific PaaS.

### Scope of validity (critical)

> **This decision is valid within the current product scope of phases 0–3** as described in the project charter and Phase 0 specs — namely where there is **no first-party backend**, **no authentication**, and **no server-side measured performance model** as part of the app runtime.
>
> If later work needs **server compute** — for example **measured benchmark collection**, **accounts**, **server-mediated sharing**, or similar — this ADR is **not** an eternal ban on servers. **Re-open and re-decide** (amend this ADR or supersede with a new one). Prefer **adding a separate API/service in front of or beside the existing SPA** over rewriting the client from scratch, unless a later ADR concludes otherwise.

This scoped lock is intentional:

| Too loose | Too tight | This ADR |
|-----------|-----------|----------|
| “Maybe SPA” — Stage 2 has no base | “Forever no server” — future backend forces ADR contradiction | **Locked SPA for current 0–3 scope**, with written revisit triggers |

---

## Consequences

### Positive

- Stage 2 can assume a browser-only app + static deploy artifact.
- Aligns with Phase 0 non-goals (no backend, auth, prices).
- Fixture layout (`parts/`, `benchmarks/`) stays static-file friendly.
- Portable `dist/` (or equivalent) fits deferred GCP/Azure hosting.

### Negative / accepted costs

- No SSR benefits (SEO, server session) while this ADR holds — acceptable for current goals.
- Large assets and logic stay client-side; loading and bundle discipline remain client concerns.
- When revisit triggers fire, team must **explicitly** record the new runtime boundary (not silently grow a “hidden” server into the SPA repo without an ADR update).

### Neutral

- A later backend does **not** automatically invalidate the SPA **client**; it usually becomes SPA + API. Only the *runtime shape of the whole product* is re-evaluated.

---

## Revisit when (non-exhaustive)

Re-open this ADR if any of the following becomes an **in-scope product requirement**:

- Server-side or fleet **measured benchmark collection / aggregation**
- **Accounts**, authN/authZ, or private builds
- **Server-mediated share/sync** (not just URL state)
- Live **pricing**, checkout, or other trusted server workflows
- Any feature that needs secrets, authoritative multi-user state, or non-public compute

Do **not** revisit merely because:

- A static host or CDN is chosen (GCP/Azure)
- Local `preview` vs cloud static hosting differs
- Phase 1 improves the **client-side** performance model using shipped data files

---

## Follow-ups (not decided here)

- Language, UI + 3D pair, bundler (Stage 2)
- Package manager, schema/state/test, fixture HTTP paths (Stage 3)
- Exact GCP vs Azure product and IaC
- Open-source license (parallel; before third-party deps)
