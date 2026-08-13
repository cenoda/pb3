# Phase 7.1 — Implementation plan

Derived from [`specs/phase-7.1.md`](./specs/phase-7.1.md). Required by the
"plan before code" rule in [`../README.md`](../README.md).

Status: **Accepted 2026-08-13. Owner decisions O1–O10 locked as proposed
(no amendments).** Implementation is not started — a separate start
instruction is still required. See `README.md` §"Implementation hand-off".

---

## Method: evidence first, catalog last

For every source, in this order:

1. Record a `candidate` (URL, `sourceKind`, optional intended `partId`).
2. Fetch into `.ingest/fetched/` with hash + `retrievedAt`.
3. Normalize deterministically. Missing identity keys fail closed.
4. Exact-SKU match against the **current** 22-part catalog. Related SKUs
   and variant splits become `unavailable` / `ambiguous`.
5. Draft a rights review record. The agent may recommend; it may not set
   `approved`.
6. Emit an owner review packet and a dry-run report.
7. Stop.

Writing `parts/**` or `benchmarks/cat6/**` is a later apply step (Step 10)
and is not in the first slice.

Every step ends with `pnpm test` at an unchanged-or-higher pass count. From
Step 2 on, a dedicated `ing7` test file must be green. `pnpm test:e2e` is a
regression check that the product surface did not move; it is not how this
pipeline is proven.

---

## What is untouchable

| Area | Action |
|------|--------|
| `parts/**/part.json`, `parts/**/image.*` | **Untouched** in Steps 1–8. Step 10 only, and only from an owner-approved packet |
| `parts/catalog-manifest.json` | **Untouched.** No inventory change |
| `benchmarks/cat6/**` | **Read-only** in the first slice |
| `src/contract/cat6.ts`, `cat6.schema.ts` | **Untouched.** `ing7` is a sidecar |
| `src/contract/prov4.ts`, `prov4.schema.ts` | **Untouched.** Reuse `EvidenceRightsClass` as-is (`cc-attribution` already exists) |
| `src/contract/est1.ts`, `benchmarks/est1/**`, `scripts/curate-amd-product-catalog.py` | **Untouched.** Frozen Phase 4.1 harvest is not an input sink |
| `benchmarks/prov4/**` | **Untouched** |
| `src/App.tsx`, `src/ui/**`, `src/styles/**` | **Untouched.** No UI |
| `src/catalog/loadPartCatalog.ts`, `loadImageSourceRegistry.ts` | **Untouched** |
| `compat2`, `perf1`, `phys3`, `vs2` | **Untouched** |
| `docs/decisions/ADR-00*` | **Unchanged.** No new ADR. ADR-004 3D remains open and unused |
| Existing Phase 7 image integrity tests | **Keep passing.** Do not weaken them |

---

## Target layout

```text
src/contract/ing7.ts
src/contract/ing7.schema.ts
src/ingest/stages.ts
src/ingest/normalize.ts
src/ingest/matchExactSku.ts
src/ingest/reviewRights.ts
src/ingest/buildReviewPacket.ts
src/ingest/buildDryRunReport.ts
src/ingest/proposedDiff.ts
scripts/ingest/cli.mjs
scripts/ingest/fetch.mjs
scripts/ingest/adapters/wikimedia-cpu-image.ts
scripts/ingest/adapters/manufacturer-gpu-image.ts
scripts/ingest/adapters/amd-product-spec.ts
src/test/ing7.schema.test.ts
src/test/ing7.matchExactSku.test.ts
src/test/ing7.reviewRights.test.ts
src/test/ing7.integrity.test.ts
src/test/fixtures/ing7/
.gitignore                                         # add .ingest/
package.json                                       # add ingest:dry-run only
```

Optional later (not first slice):

```text
scripts/ingest/adapters/danawa-street-price.ts     # Step 9
scripts/ingest/apply.mjs                           # Step 10
```

---

## First slice — Steps 1–8

### Step 1 — `ing7` contract + Zod, no I/O

Add `src/contract/ing7.ts` and `src/contract/ing7.schema.ts` from spec §12.
Schema tests cover: unique `candidateId`, SHA-256 hex, ISO dates, stage
enums, rights draft enum **rejects** `"approved"`, packet requires the six
owner-facing sections, dry-run report requires `shippedTreeDirty: false`.

Add `.ingest/` to `.gitignore`. Do not create a tracked `.ingest/` tree.

`pnpm test` green. No adapters yet.

### Step 2 — Workspace helpers + candidate writer

Pure helpers that resolve a workspace root (default `.ingest/`, overridable
in tests). Write `IngestCandidate` JSON with stable key order.

Integrity test: writing a candidate does not create files under `parts/` or
`benchmarks/`.

### Step 3 — Bounded fetch (fixture-first)

`scripts/ingest/fetch.mjs` plus a thin wrapper used by tests. Production
path: identified `User-Agent`, timeout, no parallel hammering, store bytes +
`IngestFetched` sidecar.

CI path: replay `src/test/fixtures/ing7/**` as if fetched. **No live
network in `pnpm test`.**

Failed fetches become `fetch-failed` with status/error, not invented HTML.

### Step 4 — Deterministic normalizer

`src/ingest/normalize.ts` plus per-adapter extractors called from it.
Output `IngestNormalized`: identity keys, variant tokens, raw quotes,
`extractedFields` limited to keys the adapter declares.

Same fixture bytes ⇒ byte-identical JSON (injected clock). Unparseable
input ⇒ `normalize-failed`.

### Step 5 — Exact-SKU matcher

`src/ingest/matchExactSku.ts` reads the on-disk catalog (manifest +
`part.json` identity fields) in tests via fixture snapshots of the 22
identities — do not import Vite loaders.

Must include unit cases:

| Source identity | Expected |
|-----------------|----------|
| `100-100001015BOX` | `sku-exact` → `cpu.amd-ryzen-5-7600` |
| `100-000001015` (tray) | `sku-unavailable` or `ambiguous`, never exact on the boxed part |
| `DUAL-RTX4070-O12G` | `sku-exact` → `gpu.asus-dual-rtx4070-o12g` |
| “ASUS Dual 4070 SUPER” / `4060` | not exact on the 4070 O12G part |
| “NH-D15” without G2 | not exact on `cooler.noctua-nh-d15-g2` |
| “Fractal Design Focus G” | not exact on North |
| T-Create Expert 64 GB tokens | not exact on the 32 GB part |
| “Ryzen 5 7600” marketing name only | `sku-ambiguous` / `unavailable`, never exact |
| Legacy id `cpu.zen4-7600` | never a match key |

### Step 6 — Rights review engine

`src/ingest/reviewRights.ts`. Input: normalized record + matcher verdict +
verbatim terms. Output: `RightsReviewRecord`.

Hard-coded reject rules (ids appear on the packet):

| Id | Rule |
|----|------|
| `R1` | No storage/redistribution grant on manufacturer terms |
| `R2` | Screenshot / captured UI / video frame |
| `R3` | Matcher verdict is not `exact` |
| `R4` | License missing, unclear, or contradictory |
| `R5` | Modification prohibited and a derivative would be stored |
| `R6` | Metadata-only source |

The function must not return `decision: "approved"`. TypeScript + Zod both
forbid it. Wikimedia CC0/FAL fixtures may recommend `approved` while
leaving `decision: "pending"`. ASUS press-kit fixture must `rejected` via
R1 (terms already captured in the Phase 7 registry).

### Step 7 — Three adapters + CLI dry-run

Implement:

1. `wikimedia-cpu-image` — Commons file page / license metadata for the
   two known CPU stills (fixtures first). Produces image packets.
2. `manufacturer-gpu-image` — ASUS Dual RTX 4070 product/press URL.
   Expected honest result: `sku-exact` + `rights-rejected` (R1).
3. `amd-product-spec` — Ryzen 5 7600 product page structured fields
   (product IDs, clocks, TDP). Writes **to `.ingest/` only**. Does not
   refresh `benchmarks/est1/vendor-catalog/`.

CLI: `pnpm ingest:dry-run` (name may be adjusted at implementation).
Default flags: `--workspace .ingest --no-apply --no-network` in CI.
Local optional `--live` is documented, never required.

Emit packets under `.ingest/packets/` and one `DryRunReport` under
`.ingest/reports/`. `proposedDiff.ts` compares extracts to current
`part.json` / registry / prices and lists add/replace/unchanged/conflict.
Dry-run must set `shippedTreeDirty: false` after verifying git or a
content-hash snapshot of `parts/` + `benchmarks/cat6/`.

### Step 8 — Integrity + regression

`src/test/ing7.integrity.test.ts` implements spec §13 for the first slice:

- candidate/shipped separation (hash snapshot)
- `.gitignore` contains `.ingest/`
- Vite config still copies only `parts` and `benchmarks`
- SKU identity cases from Step 5
- rights engine cannot emit `approved`
- proposed image change without `sourceId` is rejected by schema
- existing Phase 7 image parity + orphan tests still pass
- no `src/contract/prov4.ts` / `est1.ts` diff required by this phase
  (assert the files were not part of the step; do not snapshot-freeze
  unrelated future edits)
- deterministic normalize + report

Run:

```bash
pnpm test
pnpm test:e2e
pnpm test:all
pnpm build
pnpm ingest:dry-run
```

`pnpm ingest:dry-run` must exit 0 on fixtures and leave `git status`
clean for `parts/` and `benchmarks/`.

---

## Later slices (specified, not first-slice exit)

### Step 9 — Domestic street-price adapter

`danawa-street-price` (or equivalent KR listing). Fixture-first. Exact
SKU only. Writes street **candidates**, never `catalog-prices.json`.
MSRP stays a separate object. No FX conversion. No aggregation of
existing fixture rows.

### Step 10 — Owner-apply (still no commit)

`scripts/ingest/apply.mjs`:

- Refuses unless `--apply` **and** a packet with `ownerDecision: "approved"`.
- Refuses `sku-ambiguous`, `sku-unavailable`, and any rights `decision`
  other than owner-set approved.
- Refuses unknown `sourceId`s.
- Writes only the packet's `proposedChanges`.
- Does not `git commit` or `git push`.
- Re-runs the Phase 7 image/price integrity tests after write.

This step is **not** authorized by accepting the first slice.

---

## Dry-run verification commands

```bash
pnpm test
pnpm test:all
pnpm build
pnpm ingest:dry-run
# optional local only — never a merge gate
# pnpm ingest:dry-run --live
```

Success for the first slice:

- New `ing7` unit tests pass.
- Prior unit + E2E counts do not regress.
- `dist/` contains no `.ingest/` tree.
- `parts/**` and `benchmarks/cat6/**` are unmodified.
- Dry-run report exists and `shippedTreeDirty` is `false`.
- GPU manufacturer packet is rights-rejected (or pending with R1), not shipped.

---

## Owner approval gate

**Planning gate (now):** lock O1–O10, accept this package, then a separate
implementation-start instruction.

**First-slice closeout:** owner opens any packet, follows citation → SKU
verdict → rights recommendation, and confirms the shipped tree did not
change.

**Apply gate (Step 10, later):** owner sets `ownerDecision` on named
packets. No packet, no write.

---

## Failure modes

See spec §16. Implementation-level additions:

- If Commons HTML cannot be parsed in CI fixtures, store a trimmed
  fixture snapshot rather than skipping the adapter.
- If ASUS terms text drifts, update the **fixture** and keep R1; do not
  treat a parse miss as a storage grant.
- If the AMD product page stops exposing structured fields, the spec
  adapter fails closed and the dry-run records `normalize-failed`.

---

## Rollback strategy

First slice: delete the new `ing7` / `src/ingest/` / `scripts/ingest/`
files, revert `.gitignore` and `package.json` script lines, delete
`.ingest/`. No catalog rollback.

Step 10 (later): `git checkout` the affected `parts/` or
`benchmarks/cat6/` paths; mark the packet `owner-rejected`.

---

## Explicit implementation start gate

Items 1–2 are done. Do not create any file listed under “Target layout”
until the owner (or a later session) pastes the `README.md`
implementation hand-off as a start instruction.

Accepting this plan is not that message. It authorizes **Steps 1–8
only** when given. Steps 9–10 stay blocked.
