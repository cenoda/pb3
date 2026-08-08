# Agent browser exploration (Playwright MCP + CLI)

**Not a regression suite.** This is how Aria / Lira / Nox (and the owner) **explore** the running SPA when Playwright Test alone is not enough confidence — especially UI, URL feel, and 3D viewport hooks.

| Layer | Package / entry | Role |
|-------|-----------------|------|
| **Regression (required for gates)** | `@playwright/test` → `pnpm test:e2e` | Deterministic Step 8 |
| **Agent explore — CLI** | `@playwright/cli` → `playwright-cli` / `pnpm explore:phase0` | Token-efficient coding-agent browser control |
| **Agent explore — MCP** | `@playwright/mcp` via MCP host | Tool-calling agents (Cursor, Claude Code, etc.) |

Neither MCP nor CLI replaces `pnpm test` / `pnpm test:e2e`. They are **always available**, **not always required** on every change. Recommended before `vertical-slice-v0` and after large UI/URL/viewport edits.

**Not in scope:** OS-level mouse injection (xdg, raw screen coordinates). Agents drive Playwright’s **accessibility tree / locators**, same engine as tests.

Official docs:

- [Playwright MCP](https://playwright.dev/docs/getting-started-mcp)
- [Playwright CLI (coding agents)](https://playwright.dev/docs/getting-started-cli)

---

## Prerequisites

```bash
pnpm install
# browsers already used by @playwright/test; if missing:
pnpm exec playwright install chromium
```

Start the app (dev is enough for exploration):

```bash
pnpm dev
# → http://127.0.0.1:5173
```

Stable hooks for agents (prefer these over CSS soup):

| Hook | Purpose |
|------|---------|
| `data-testid="cpu-select"` | CPU `<select>` |
| `data-testid="gpu-select"` | GPU `<select>` |
| `data-testid="performance-panel"` | Perf panel root |
| `data-testid="perf-range-{1080p\|1440p\|4k}"` | FPS range text |
| `data-testid="build-viewport"` | + `data-gpu-id`, `data-glb-path` |
| `data-testid="build-summary"` | Fixed parts summary |

---

## Path A — Playwright CLI (recommended for coding agents)

DevDependency: `@playwright/cli`.

### One-shot Phase 0 walkthrough

```bash
# terminal 1
pnpm dev

# terminal 2
pnpm explore:phase0
```

Writes under `docs/verification/explore-notes/`:

- `cli-walkthrough-YYYY-MM-DD.md` — step log
- `after-gpu-swap.png` — screenshot after GPU change

Override URL/session:

```bash
BASE_URL=http://127.0.0.1:5173 PLAYWRIGHT_CLI_SESSION=pb3-explore pnpm explore:phase0
```

### Manual CLI session (ad-hoc)

```bash
pnpm exec playwright-cli -s=pb3-explore open http://127.0.0.1:5173/ --no-headed
pnpm exec playwright-cli -s=pb3-explore snapshot
pnpm exec playwright-cli -s=pb3-explore select data-testid=cpu-select cpu.zen4-7800x3d
pnpm exec playwright-cli -s=pb3-explore select data-testid=gpu-select gpu.rtx4080
pnpm exec playwright-cli -s=pb3-explore eval "() => location.href"
pnpm exec playwright-cli -s=pb3-explore screenshot --filename=docs/verification/explore-notes/manual.png
pnpm exec playwright-cli -s=pb3-explore close
```

Notes from live use (2026-08-08):

- Boolean flags: use `--no-headed` / `--headed`, **not** `--headed=false`.
- Named session (`-s=pb3-explore`) keeps state across CLI invocations.
- `select data-testid=cpu-select <value>` works; CSS form also fine.
- Snapshot shows comboboxes as **CPU** / **GPU** with fixture display names.

---

## Path B — Playwright MCP (tool-calling agents)

No app code change. Point the **MCP host** at Microsoft’s server:

Example config (copy into Cursor / Claude Code / VS Code MCP settings):  
[`mcp-playwright.example.json`](./mcp-playwright.example.json)

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest", "--browser=chrome", "--isolated"]
    }
  }
}
```

- Default MCP browser is **headed** (you can watch); pass `--headless` if needed.
- `--isolated` avoids sharing cookies/profile across projects.
- Claude Code: `claude mcp add playwright npx @playwright/mcp@latest`
- Cursor: Settings → MCP → add server with the same command/args.

Then ask the agent (with `pnpm dev` running):

> Open http://127.0.0.1:5173, confirm default BuildState and three FPS ranges,  
> switch CPU to 7800X3D, switch GPU to 4080, check URL + data-gpu-id, reload, report.

MCP returns **a11y snapshots** (roles/text/refs) so agents do not need vision models for structure. Screenshots are optional for GLB color/length.

---

## Phase 0 exploration checklist (agent report template)

Use after live CLI/MCP run. Copy into chat / shared memory / PR note.

```text
Agent: Aria | Lira | Nox
Tool: CLI | MCP
Base URL: http://127.0.0.1:5173
Date:

[ ] Clean open → full canonical query (v,cpu,gpu,case,mb,cooler,game,preset)
[ ] Default cpu=cpu.zen4-7600 gpu=gpu.rtx4070
[ ] Ranges: 1080p 80–95 · 1440p 52–64 · 4k 28–36 FPS (stub table)
[ ] Other CPU → 1440p 58–70; data-gpu-id still gpu.rtx4070
[ ] Other GPU → 1440p 115–138; data-gpu-id gpu.rtx4080; glb path …/gpu.rtx4080/model.glb
[ ] Reload → same selection + ranges from URL only
[ ] Invalid cpu id → fallback default full query
[ ] Console: note anything beyond favicon 404 / WebGL ReadPixels noise

Findings / risks:
```

### Live run results (2026-08-08, Aria via CLI)

| Step | Result |
|------|--------|
| Clean open | PASS — full query rewrite; defaults 7600/4070 |
| Ranges | PASS — 80–95 / 52–64 / 28–36 |
| Other CPU | PASS — 58–70 FPS @1440p; gpuId stayed 4070 |
| Other GPU | PASS — 115–138 @1440p; glb `parts/gpu/gpu.rtx4080/model.glb` |
| Reload | PASS — 7800x3d + 4080 restored |
| Invalid CPU | PASS — fell back to 7600 + 4070 |
| Console noise | `favicon.ico` 404 (cosmetic); WebGL `ReadPixels` stall warnings (driver, not product bug) |
| Screenshot | `explore-notes/after-gpu-swap.png` |

Regression suite still: `pnpm test:all`.

---

## When to use what

| Situation | Prefer |
|-----------|--------|
| CI / pre-tag / “did we break Step 8?” | `pnpm test:all` |
| Coding agent mid-task, low tokens | **CLI** (`explore:phase0` or ad-hoc) |
| Chat agent with MCP host, long explore loop | **MCP** |
| Human wants to see the window | MCP headed default, or `playwright-cli open … --headed` |
| Pixel-perfect GLB color | Human eye or screenshot + vision; a11y snapshot alone is weak |

---

## Policy for this repo

1. **Always available** once `pnpm install` + browsers exist.
2. **Not a merge gate** unless the owner says so for a release/tag.
3. **Recommended** before `vertical-slice-v0` and after material UI/URL/viewport changes — any of Aria / Lira / Nox can run explore and leave a short report (template above).
4. Artifacts under `docs/verification/explore-notes/` may be committed when useful; local `.playwright-cli/` is gitignored.
5. Do not expand Phase 0 inventory while “just exploring.”

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `spawnSync vite ENOENT` via raw node | Use `pnpm dev` (PATH includes `node_modules/.bin`) |
| `boolean option '--headed' should not be passed with '=value'` | Use `--headed` or `--no-headed` |
| Browser not open | `playwright-cli -s=… open <url>` first |
| MCP cannot see display | Run MCP with `--headless`, or standalone server with display |
| Stale session | `playwright-cli -s=… close` or `kill-all` |
