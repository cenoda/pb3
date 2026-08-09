# AMD vendor catalog snapshots (est1)

Build-time extracts from AMD product **specifications** compare tables.
See `docs/phases/phase-4.1/AMD_CATALOG_AUTOMATION.md`.

- Specs identity spine for multi-CPU/GPU nodes — **not game FPS**.
- Refresh: `python3 scripts/curate-amd-product-catalog.py --kind both`
- Do not load these into the SPA as performance estimates.

Files:

- `amd-processors-desktop-ryzen.json` — Desktop + Ryzen filter
- `amd-graphics.json` — graphics specs rows
