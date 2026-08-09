# Product UX corrective closeout (`product-ux-1`)

Date: **2026-08-09**
Decision: **PASS — owner approved**

## Decision record

After receiving the local run instructions (`pnpm dev`, or `pnpm build` plus
`pnpm preview`), the owner explicitly approved the shipped product UX on
2026-08-09. This records the human gate required by Step 9 of the corrective
plan; it does not substitute a new automated test result.

## Accepted surface

- fixed light application surface;
- desktop builder shell with selectors, 3D viewport, and primary result
  summary visible together at the required 1280x720 viewport;
- sticky 3D viewport and full-case default framing;
- compatibility, fit, FPS, and price summary at the product level;
- evidence, physical, cooling, price, compatibility, and performance domain
  details collapsed by default and available on demand;
- GPU change propagation through the summary, canonical URL, pilot state, and
  3D assembly.

## Verification supporting the decision

| Check | Result |
|-------|--------|
| `pnpm test:all` | **PASS** — 173 unit + 14 E2E |
| `pnpm build` | **PASS** |
| `e2e/product-ux-shell.spec.ts` | **PASS** — T1-T7, T9, T10 |
| Live 1280x720 inspection | **Software walkthrough PASS** — compact shell, collapsed duplicate domains, full-case framing |
| Owner UX decision | **PASS — 2026-08-09** |

## Boundary retained

This closeout changes no contract, fixture, inventory, or engine. It does
**not** close Phase 4 Step 9. The separate Phase 4 evidence-quality review is
blocked until an authentic, independently inspectable raw performance capture
is supplied.
