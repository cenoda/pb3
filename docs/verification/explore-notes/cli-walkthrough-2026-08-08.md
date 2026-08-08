# Playwright CLI walkthrough — Phase 0

- **Date:** 2026-08-08 (live runs ~07:55Z and ~07:57Z)
- **Agent:** Aria
- **Tool:** `@playwright/cli` session `pb3-explore`, `--no-headed`
- **Base URL:** http://127.0.0.1:5173 (`pnpm dev`)
- **Not a regression suite** — live exploration evidence for agent browser tooling

## Results

| Step | Result | Observed |
|------|--------|----------|
| Clean open | PASS | Full canonical query; cpu=`cpu.zen4-7600` gpu=`gpu.rtx4070` |
| Default ranges | PASS | 1080p `80–95 FPS`, 1440p `52–64 FPS`, 4k `28–36 FPS` |
| Other CPU | PASS | 1440p → `58–70 FPS`; `data-gpu-id` stayed `gpu.rtx4070` |
| Other GPU | PASS | 1440p → `115–138 FPS`; `data-gpu-id=gpu.rtx4080`; glb `parts/gpu/gpu.rtx4080/model.glb` |
| Reload | PASS | 7800x3d + 4080 + 115–138 restored from URL |
| Invalid CPU | PASS | `cpu.not-real` → default 7600+4070 full query rewrite |
| Snapshot | PASS | a11y tree: combobox CPU/GPU, summary list, three perf rows |
| Screenshot | PASS | [`after-gpu-swap.png`](./after-gpu-swap.png) |

## Console noise (non-blocking)

- `favicon.ico` 404 — cosmetic
- WebGL `ReadPixels` / GPU stall warnings — driver noise under GL automation, not product logic failures
- React DevTools install tip — dev only

## CLI pitfalls discovered

1. Use `--no-headed` / `--headed`, not `--headed=false`.
2. Prefer named session: `playwright-cli -s=pb3-explore …`.
3. `select data-testid=cpu-select <id>` works for closed fixture dropdowns.
4. Always `open` before other commands on a new session.

## Repeat

```bash
pnpm dev              # terminal 1
pnpm explore:phase0   # terminal 2
```

Or MCP: see [`../AGENT_BROWSER_EXPLORATION.md`](../AGENT_BROWSER_EXPLORATION.md) and [`../mcp-playwright.example.json`](../mcp-playwright.example.json).

Regression remains: `pnpm test:all`.
