# Vertical slice exit criteria (pointer)

Canonical phase-0 scope, completion scenario, and exit checklist:

**[`../phases/phase-0/specs/phase-0.md`](../phases/phase-0/specs/phase-0.md)** (sections 4–6)

Build plan + automated coverage:

**[`../phases/phase-0/implementation_plan.md`](../phases/phase-0/implementation_plan.md)** (Step 8 + §5 testing strategy)

## Automated regression (required)

```bash
pnpm test:all
# or separately:
pnpm test          # Vitest pure logic
pnpm test:e2e      # Playwright headless Chromium vs vite preview
```

Primary E2E file: [`../../../e2e/exit-scenario.spec.ts`](../../../e2e/exit-scenario.spec.ts)

Covers:

- Clean URL → default `BuildState` + three resolution ranges
- CPU change → ranges update; GPU id unchanged
- GPU change → `data-gpu-id` / glb path update + ranges
- Reload restore from URL
- Post-reload selection still works
- Partial URL → full canonical rewrite
- Invalid ids → default fallback
- Built `dist/` serves `/parts/...` and `/benchmarks/vs0/...`

Manual headed pass (`pnpm test:e2e:headed` or `pnpm dev`) remains useful for **visual** GLB color/length sanity only.

## Checklist

- [x] User can select CPU and GPU. (E2E)
- [x] Build state changes with selection. (E2E + URL)
- [x] 3D view replaces the GPU when `gpuId` changes. (E2E via `data-gpu-id` / path; visual optional)
- [x] Per-resolution expected performance ranges refresh for the fixed game/preset. (E2E)
- [x] Full reload restores the same configuration from the URL. (E2E)
- [ ] Tag `vertical-slice-v0` (owner)

On success: tag `vertical-slice-v0`, then freeze non-critical 3D work until phase 1 ends.
