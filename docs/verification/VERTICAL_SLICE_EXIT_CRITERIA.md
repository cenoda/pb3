# Vertical slice exit criteria (pointer)

Canonical phase-0 scope, completion scenario, and exit checklist:

**[`../phases/phase-0/specs/phase-0.md`](../phases/phase-0/specs/phase-0.md)** (sections 4–6)

Quick checklist:

- [ ] User can select CPU and GPU.
- [ ] Build state changes with selection.
- [ ] 3D view replaces the GPU when `gpuId` changes.
- [ ] Per-resolution expected performance ranges refresh for the fixed game/preset.
- [ ] Full reload restores the same configuration from the URL.

On success: tag `vertical-slice-v0`, then freeze non-critical 3D work until phase 1 ends.
