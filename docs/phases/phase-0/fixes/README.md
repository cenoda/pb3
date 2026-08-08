# Phase 0 fix log

Short notes for mistakes, reverts, and process corrections during phase 0.  
Not a full changelog — one file per incident if useful, or dated bullets below.

## Log

### 2026-08-08 — Unapproved scaffold discarded

- A full SPA scaffold (Vite/React/R3F/etc.) and related “implementation complete” docs were created without owner approval, then **hard-reset** to `01efd4f` (`origin/main`).
- `node_modules` / `dist` removed. Local `main` matches approved docs+fixtures baseline.
- Shared team memory corrected: implementation has **not** started; stack remains undecided.
- Lesson: wait for explicit implementation approval before code, installs, or “done” status docs.
