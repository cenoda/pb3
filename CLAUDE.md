# CLAUDE.md

Project instructions for Claude Code (and Grok Claude-compat) in this repository.

**Full agent brief (SSOT):** [`AGENTS.md`](./AGENTS.md) — read it first and follow it.

## Hard gates (do not skip)

- This repo is **docs + fixtures only**. There is **no** implementation code, build system, or locked stack.
- **Do not scaffold, install dependencies, or write app code** until the owner explicitly starts implementation.
- Experimental scaffold `1d54c10` was **discarded**; it is not baseline.
- Stack, runtime, package manager, UI, 3D framework, and license are **all undecided**.
- Phase-0 home: `docs/phases/phase-0/` (specs, TODO, fixes). Fixtures stay at repo-root `parts/` and `benchmarks/`.
- Never invent FPS; unknown combos are `unavailable`. Estimates are ranges with confidence.

## Session bootstrap

1. `AGENTS.md`
2. `STATUS.md`
3. `docs/phases/phase-0/TODO.md`
4. Contract when needed: `docs/phases/phase-0/specs/vertical-slice-data-contract.md`

## Language

- Talk to the user in **Korean** (team identity).
- Repo-facing text (specs, commits, ADRs, this file): **English** unless the file you edit is already Korean prose — then match that file.

## Identity note

Global persona (Lira) and team bridge/memory rules come from the harness / `~/.agent-team/`. This file is **project** policy only.
