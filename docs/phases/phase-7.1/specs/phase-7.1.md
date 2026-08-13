# Phase 7.1 — Catalog source-ingestion pipeline (M0 scope)

Status: **M0 accepted 2026-08-13. Decisions O1–O10 locked as proposed
(no amendments).** First slice Steps 1–8 software closeout accepted
2026-08-13. Collection increment is a dry-run follow-up, not Step 9/10.

Charter authority: [`../../../../PROJECT_CHARTER.md`](../../../../PROJECT_CHARTER.md)
§2 (깊이 우선), §6 (부품 데이터 모델 원칙).
Prerequisite: Phase 6 `cat6` catalog + Phase 7 image registry, both owner-closed.
Frozen: [`../../phase-4/FREEZE.md`](../../phase-4/FREEZE.md) — do not break
`prov4` / `est1`.
Reused patterns:

- [`../../phase-6/specs/catalog-data-contract.md`](../../phase-6/specs/catalog-data-contract.md)
  (`cat6` identity, provenance, prices, image ref)
- [`../../phase-4/specs/provenance-data-contract.md`](../../phase-4/specs/provenance-data-contract.md)
  (`EvidenceRightsClass`, source-rights fail-closed)
- [`../../phase-7/specs/phase-7.md`](../../phase-7/specs/phase-7.md)
  (exact-SKU images; no related-SKU substitution)
- [`../../phase-4.1/AMD_CATALOG_AUTOMATION.md`](../../phase-4.1/AMD_CATALOG_AUTOMATION.md)
  (build-time manufacturer harvest; not a runtime fetch)

---

## 0. Purpose

Phase 6 and Phase 7 made catalog facts and the two shipped CPU images by
**hand**: open a page, read terms, write JSON, copy a file. That does not
scale, and it invites the two failures this project has already paid for —
invented numbers, and related-SKU stand-ins.

Phase 7.1 replaces that labor with a **bounded, evidence-first ingest
pipeline**. An agent may fetch, parse, hash, match, and emit a review packet.
An agent may not approve rights, publish an uncertain SKU, overwrite the
shipped catalog, commit, or push.

The product of this phase is the pipeline and its dry-run evidence — not a
fuller image grid and not live prices.

---

## 1. Current baseline and accepted boundaries

| Fact | State |
|------|--------|
| Catalog | 22 real `cat6` parts via `parts/catalog-manifest.json` |
| Images shipped | `cpu.amd-ryzen-5-7600` (FAL / `cc-attribution`), `cpu.amd-ryzen-7-7800x3d` (CC0 / `licensed`) |
| Images uncovered | GPU, motherboard, case, cooler, RAM, PSU — manufacturer press **rejected**; no exact-SKU Commons still found |
| Prices | `benchmarks/cat6/catalog-prices.json` — 13 rows; street KRW snapshots and/or MSRP; not a live feed |
| Specs | Per-part `provenance` + `benchmarks/cat6/catalog-source-registry.json` |
| Runtime | Static SPA (ADR-001). No runtime scrape. |
| Frozen | Phase 4 / 4.1 public contracts and fixtures |
| Out | Phase 8, ADR-004 real-hardware GLBs, inventory growth, new UI |

Known identity traps already recorded in the tree (the matcher must treat
these as **different** SKUs):

| Catalog SKU | Must not confuse with |
|-------------|------------------------|
| `cpu.amd-ryzen-5-7600` boxed `100-100001015BOX` | tray `100-000001015` |
| `cpu.amd-ryzen-7-7800x3d` boxed `100-100000910WOF` | tray `100-000000910` |
| `gpu.asus-dual-rtx4070-o12g` | 4070 SUPER, 4060 / 4060 Ti, other Dual SKUs |
| `cooler.noctua-nh-d15-g2` | original NH-D15 |
| `case.fractal-design-north-tg-dark` | Fractal Focus G |
| `ram.teamgroup-t-create-expert-ddr5-6000-32gb` | same family 64 GB kit |
| `motherboard.gigabyte-b650m-aorus-elite-ax-rev-1-3` | other board revisions |

The already-shipped 7800X3D Commons photo cites OPN `100-000000910` (tray
family) for the boxed catalog SKU of the same silicon. That is a **recorded
Phase 7 owner-approved exception**, not a matcher default. New matches must
not generalize it.

---

## 2. Exit conditions (normative)

The first implementation slice ends when all eight hold.

1. **A curator pipeline exists** that can run the stage machine through
   `rights-reviewed` and emit a dry-run report **without** writing
   `parts/**`, `benchmarks/cat6/**`, or the catalog manifest.
2. **Three adapters run end-to-end on fixtures** (and optionally live, never
   in CI): Wikimedia CPU image, manufacturer GPU image, AMD structured spec.
3. **Exact-SKU matching is fail-closed.** Related names, related generations,
   boxed/tray/regional/revision/capacity/color variants, and missing part
   numbers do not become `exact`.
4. **Rights review never auto-approves storage.** Manufacturer images without
   a redistribution grant, screenshots, related-SKU images, unclear terms,
   modification-prohibited assets, and metadata-only sources are rejected or
   left `pending`.
5. **Candidate/fetched bytes cannot enter the shipped catalog by accident.**
   Workspace is gitignored and is not Vite-served or copied to `dist/`.
6. **Owner review packets** contain only identity, citation, rights,
   preview/hash, proposed field diffs, and unresolved conflicts.
7. **Integrity tests** listed in §13 pass. `pnpm test` / `pnpm test:all` /
   `pnpm build` stay green. Frozen Phase 4 / 4.1 files are untouched.
8. **No apply, no commit, no push, no inventory growth, no UI change** in
   the first slice.

**Owner gate (first slice):** pick any dry-run packet and verify (a) the
cited URL, (b) the SKU verdict, (c) the rights recommendation, and (d) that
the shipped tree is bitwise unchanged by the dry-run.

A later apply slice (Step 10) has its own exit: only owner-approved packets
may mutate the shipped tree, and only after the same integrity gates.

---

## 3. Scope

| In | Out |
|----|-----|
| Build-time ingest pipeline and `ing7` sidecar types | Runtime fetch / SPA network to vendors |
| Candidate / fetched / normalized / match / rights / packet artifacts in `.ingest/` | New UI, category-page redesign, comparison UI |
| Three first-slice adapters (CPU image, GPU image, AMD spec) | Automatic rights approval or owner approval |
| Exact-SKU matcher against the existing 22 parts | Inventory expansion / new categories |
| Rights review records and dry-run reports | Automatic shipment into `parts/**` or `benchmarks/cat6/**` |
| Street-price **rules** (and a later adapter step) | Live pricing claim or scheduled refresh |
| Integrity tests for separation, identity, rights, provenance, determinism | Phase 8, ADR-004 real-3D meshes |
| Optional later owner-apply command | Commit, push, backend, auth, deploy |

### Explicit non-goals

- No new UI.
- No category-page redesign.
- No Phase 8.
- No real-hardware 3D mesh work.
- No automatic rights approval.
- No automatic owner approval.
- No live pricing claim.
- No backend, auth, or deployment.
- No inventory expansion.
- No commit or push as part of this phase's agent work.

---

## 4. Proposed artifact / file layout

```text
.ingest/                                gitignored workspace — never shipped
  candidates/                           stage: candidate
  fetched/                              raw bytes + fetch sidecar
  normalized/                           deterministic structured extracts
  matches/                              exact-SKU verdicts
  rights/                               drafted rights review records
  packets/                              owner review packets
  reports/                              dry-run reports
  apply-staging/                        later slice only; still not shipped

src/contract/ing7.ts                    NEW — types + ING7_CONTRACT_VERSION
src/contract/ing7.schema.ts             NEW — Zod
src/ingest/                             NEW — pure functions (no network)
  stages.ts
  normalize.ts
  matchExactSku.ts
  reviewRights.ts
  buildReviewPacket.ts
  buildDryRunReport.ts
  proposedDiff.ts
scripts/ingest/                         NEW — Node curator CLI
  cli.mjs                               dry-run by default
  fetch.mjs                             bounded public GET
  adapters/
    wikimedia-cpu-image.ts
    manufacturer-gpu-image.ts
    amd-product-spec.ts
    danawa-street-price.ts              Step 9 only — not first slice
  apply.mjs                             Step 10 only — refuses without flags

src/test/ing7.schema.test.ts
src/test/ing7.matchExactSku.test.ts
src/test/ing7.reviewRights.test.ts
src/test/ing7.integrity.test.ts
src/test/fixtures/ing7/                 checked-in synthetic fixtures only

.gitignore                              ADD `.ingest/`
```

Checked-in test fixtures are **synthetic** HTML/JSON snippets and hashes.
They are not a second catalog. Live fetches, binary images, and page dumps
stay in `.ingest/`.

Vite continues to serve only `/parts` and `/benchmarks`. `.ingest/` is
outside both trees on purpose.

No new ADR. `ing7` is a phase sidecar, the same kind of decision as `cat6`
and `est1`, recorded here rather than under `docs/decisions/`.

---

## 5. Pipeline stages and state transitions

```text
                  ┌─────────────┐
                  │  candidate  │
                  └──────┬──────┘
                         │ fetch ok
                         ▼
                    ┌─────────┐     fetch fail
                    │ fetched │──────────────────► fetch-failed (terminal)
                    └────┬────┘
                         │ parse + canonicalize
                         ▼
                  ┌─────────────┐   unparseable / incomplete
                  │ normalized  │──────────────────► normalize-failed (terminal)
                  └──────┬──────┘
                         │ exact-SKU matcher
          ┌──────────────┼──────────────────┐
          ▼              ▼                  ▼
     sku-exact     sku-ambiguous      sku-unavailable
          │              │                  │
          │              └────────┬─────────┘
          │                       ▼
          │              review-candidate (no ship path)
          ▼
   rights-reviewed ──reject──► rights-rejected (terminal)
          │
          │ owner sets approved
          ▼
   owner-approved ──reject──► owner-rejected (terminal)
          │
          │ explicit apply (later slice)
          ▼
       shipped
```

Normative transition rules:

| From | To | Who / what may fire it |
|------|----|------------------------|
| (none) | `candidate` | Adapter or curator lists a URL + intended `partId` + source type |
| `candidate` | `fetched` | Bounded public GET succeeded; raw bytes + SHA-256 + headers stored |
| `candidate` | `fetch-failed` | HTTP error, robots refusal, timeout — keep the error, invent nothing |
| `fetched` | `normalized` | Deterministic parser emitted a record; input hash recorded |
| `fetched` | `normalize-failed` | Required identity keys absent; do not guess |
| `normalized` | `sku-exact` | Matcher found one catalog part by an allowed identity key |
| `normalized` | `sku-ambiguous` | Two or more catalog parts, or one part plus a conflicting variant token |
| `normalized` | `sku-unavailable` | No allowed identity key matched |
| `sku-ambiguous` / `sku-unavailable` | `review-candidate` | Packet emitted; **ship path closed** |
| `sku-exact` | `rights-reviewed` | Rights engine wrote a drafted record (`pending` or `rejected` / `approved-metadata-only`) |
| `rights-reviewed` | `rights-rejected` | Hard reject rule hit (see §8) |
| `rights-reviewed` | `owner-approved` | **Owner only** |
| `rights-reviewed` | `owner-rejected` | **Owner only** |
| `owner-approved` | `shipped` | Explicit apply command, later slice, after integrity gates |

The agent default command stops after writing packets + a dry-run report. It
must not have a hidden path to `shipped`.

---

## 6. Source types

| Type | `sourceKind` | First slice | Typical `sourceClass` | Typical `rightsClass` |
|------|--------------|-------------|----------------------|------------------------|
| Manufacturer specification page | `manufacturer-spec-page` | Yes — AMD product/spec page | `manufacturer-spec` | `public-spec` (facts only) |
| Manufacturer product / image page | `manufacturer-image-page` | Yes — ASUS Dual RTX 4070 product page | `manufacturer-spec` | usually no storage grant → reject image |
| Explicitly licensed still (Wikimedia Commons or equivalent) | `licensed-still` | Yes — Commons CPU file pages | `external-review` or `manufacturer-spec` as recorded | `cc-attribution` or `licensed` (CC0) |
| Domestic street-price listing | `domestic-street-price` | **Specified; adapter in Step 9** | `external-review` | `fair-use-citation` for the number; no page dump in `parts/` |

Rules common to every type:

- Record `canonicalUrl`, `retrievedAt`, `httpStatus`, and SHA-256 of the
  exact bytes parsed.
- Identify the curator (`User-Agent` must name the project and “build-time”).
- Respect robots / site terms; on doubt, `fetch-failed` or
  `approved-metadata-only`, never silent scrape-and-store.
- Do not treat a search-result page, category listing, or related-product
  rail as the SKU page.

---

## 7. Exact-SKU matching rules

Match **only** by an explicit identity key found in the source **and** on
the catalog part:

1. Manufacturer part number / OPN / product ID (`identity.partNumber`).
2. Manufacturer model number printed as the SKU (for example
   `DUAL-RTX4070-O12G`).
3. A catalog-recorded canonical SKU that the source also prints verbatim.

Normalization allowed before compare:

- Unicode NFKC.
- Trim.
- Case-fold.
- Collapse internal whitespace.
- Strip trademark symbols (`™`, `®`) and the word `AMD` / `NVIDIA` **only**
  when comparing marketing names as a **non-decisive** hint.

Normalization **not** allowed:

- Stripping `BOX`, `WOF`, `PIB`, tray/boxed tokens, region suffixes, `SUPER`,
  `Ti`, `OC`, revision strings, capacity, color, or generation marks
  (`G2`, `V2`, `rev 1.3`).
- Stemming or edit-distance.
- “Same silicon” / “same family” inference.
- Matching on `chipModel` or `displayName` alone.

Hard distinctions (any difference ⇒ not `sku-exact`):

| Axis | Example |
|------|---------|
| Boxed vs tray | `100-100001015BOX` ≠ `100-000001015` |
| Regional / PIB vs WOF | `100-100000910WOF` ≠ a Korean PIB SKU |
| Revision | B650M AORUS ELITE AX Rev. 1.3 ≠ Rev. 1.0 / 1.2 / 1.4 |
| Capacity | 32 GB kit ≠ 64 GB kit of the same family |
| Color / finish | North TG Dark ≠ North Mesh / White |
| Generation / related model | NH-D15 G2 ≠ NH-D15; Focus G ≠ North; 4070 ≠ 4070 SUPER |

Outcomes:

| Verdict | Meaning | Ship path |
|---------|---------|-----------|
| `sku-exact` | Exactly one catalog part; every present variant token agrees | May proceed to rights review |
| `sku-ambiguous` | Multiple parts, or variant tokens conflict, or only a marketing name hit | Review candidate only |
| `sku-unavailable` | No allowed key matched | Review candidate only |

A marketing-name-only hit such as “Ryzen 5 7600” without a product ID is
**never** `sku-exact` (boxed vs tray is unresolved).

The Phase 7 7800X3D Commons exception (tray OPN photo used for the boxed
catalog SKU) stays a one-off owner decision already shipped. The matcher
must not encode “tray OPN implies boxed SKU.”

Never invent dimensions, prices, specifications, or rights to force a match.

---

## 8. Image rights gate

Every **shipped** image must have all of:

| Field | Role |
|-------|------|
| `sourceId` | Registry identity |
| `canonicalUrl` | Stable page for the file or license statement |
| `citation` | One-hop owner check |
| `publisher` / `author` | Who published / who created |
| `rightsClass` | Existing `EvidenceRightsClass` |
| `retrievedAt` | ISO-8601 date |
| `decision` | `approved` only after owner review |
| `verbatimTerms` | License or reuse terms, not a paraphrase |
| `exactSkuEvidence` | The identity key that made `sku-exact` |

The pipeline must **reject** (or refuse to recommend approve) when any of
these is true:

- Manufacturer image with no storage / redistribution grant (ASUS / Gigabyte
  / Fractal / Noctua / G.SKILL / Corsair pattern already recorded in
  `image-source-registry.json`).
- Screenshot, captured UI, watermarked retailer composite, or video frame.
- Related-SKU or family photo.
- License terms missing, contradictory, or “contact us for permission.”
- Modifications (crop / resize / EXIF strip) are prohibited **and** the
  pipeline would need a derivative to store.
- Source decision is `approved-metadata-only` or `rejected`.
- Author/publisher cannot be named.

Agent-written rights records use:

```text
pending | rejected | approved-metadata-only
```

`approved` is owner-only. A drafted record may include
`recommendedDecision` and `recommendReason`; those are not authority.

Specs and street prices do not become image rights. A `public-spec` grant
to cite a TDP does not grant storage of the product render on the same page.

---

## 9. Price and specification provenance

Reuse `cat6` field groups. Do not invent a parallel price engine.

| Rule | Requirement |
|------|-------------|
| Raw evidence | Keep fetched bytes (or a hash + content-type) in `.ingest/fetched/` |
| Retrieval date | Every proposed fact carries `retrievedAt` |
| MSRP vs street | Separate objects; never sum MSRP; never convert USD MSRP into KRW street |
| No fixture aggregation | Do not average, min, or max existing `catalog-prices.json` rows to fill a hole |
| No estimate from absence | Missing street stays omitted / `unavailable`; never a guessed KRW figure |
| Source identity | `sourceId` + citation + publisher; bump a source revision note when the page changes |
| Spec inheritance | C10 still holds: a board SKU does not inherit chip reference clocks into `performanceSpec` |
| Conflicts | If a new extract disagrees with shipped `part.json` / price row, the packet shows both values and does not overwrite |

Street-price semantics (when Step 9 exists):

- Region `KR`, currency `KRW` for street snapshots that feed the total.
- Retailer named (`Danawa lowest listing`, etc.).
- Snapshot, not a feed. Dry-run copy must not say “live.”
- A listing that does not name the exact SKU is `sku-unavailable`.

---

## 10. Automation boundaries

The agent **may**:

- Fetch bounded public URLs with an identified curator `User-Agent`.
- Parse structured metadata (JSON-LD, published spec tables, Commons API
  license fields, AMD `data-json` / product-spec HTML).
- Write `ing7` candidate / fetched / normalized / match / rights / packet
  records under `.ingest/`.
- Compute SHA-256 and deterministic diffs against the current catalog.
- Generate owner review packets and dry-run reports.
- Run schema and integrity checks.

The agent **may not** automatically:

- Set `decision: "approved"` on rights.
- Publish `sku-ambiguous` or `sku-unavailable` as if exact.
- Overwrite `parts/**`, `benchmarks/cat6/**`, registries, or the manifest.
- Replace a missing image with a related product.
- Commit or push.
- Add parts or categories.
- Call the later apply command without an owner-approved packet and an
  explicit `--apply` flag.

Network policy: sequential, time-limited, no retry hammering, no runtime
SPA use. CI must not require the public internet; live fetch is opt-in.

---

## 11. Owner review packet

One packet per `(partId, sourceKind, sourceUrl)` candidate that reached
normalization. The owner should not need the rest of the workspace.

Required sections — **only** these:

1. **Exact SKU identity** — catalog `id`, `identity.partNumber` /
   `modelName`, source-printed identity keys, matcher verdict, variant-axis
   checks.
2. **Source URL and citation** — canonical URL, publisher, retrieval date,
   content hash.
3. **Rights decision** — drafted `decision` (`pending` / `rejected` /
   `approved-metadata-only`), `recommendedDecision`, verbatim terms excerpt,
   reject-rule ids if any.
4. **Image preview / hash** — if the candidate is an image: local
   `.ingest/` preview path (not under `parts/`), bytes, SHA-256, dimensions,
   MIME type. No preview required for spec/price packets.
5. **Proposed field changes** — JSON patch-style list against current
   `part.json` / `catalog-prices.json` / image registry. Empty list if
   confirm-only.
6. **Conflicts and unresolved fields** — shipped value vs extracted value;
   fields the parser saw but could not place; boxed/tray/revision leftovers.

Packets are written as JSON (`ing7` schema) plus an optional Markdown
rendering for humans. Neither file is a ship instruction.

---

## 12. `ing7` sidecar contract (draft types)

Contract version string: **`ing7`**. Breaking field changes bump the
string. This sidecar does **not** change `cat6`, `prov4`, `est1`, `perf1`,
`phys3`, `vs2`, or `compat2` public shapes.

```ts
export const ING7_CONTRACT_VERSION = "ing7" as const;

export type IngestStage =
  | "candidate"
  | "fetched"
  | "normalized"
  | "sku-exact"
  | "sku-ambiguous"
  | "sku-unavailable"
  | "review-candidate"
  | "rights-reviewed"
  | "rights-rejected"
  | "owner-approved"
  | "owner-rejected"
  | "fetch-failed"
  | "normalize-failed"
  | "shipped";

export type IngestSourceKind =
  | "manufacturer-spec-page"
  | "manufacturer-image-page"
  | "licensed-still"
  | "domestic-street-price";

export type SkuMatchVerdict = "exact" | "ambiguous" | "unavailable";

export type RightsDraftDecision =
  | "pending"
  | "rejected"
  | "approved-metadata-only";

export type VariantAxis =
  | "boxed-tray"
  | "region"
  | "revision"
  | "capacity"
  | "color"
  | "generation"
  | "model";

export interface IngestCandidate {
  contractVersion: "ing7";
  candidateId: string;
  stage: "candidate";
  sourceKind: IngestSourceKind;
  intendedPartId?: string; // hint only; matcher is authoritative
  canonicalUrl: string;
  createdAt: string;       // ISO-8601 date
}

export interface IngestFetched {
  contractVersion: "ing7";
  candidateId: string;
  stage: "fetched" | "fetch-failed";
  canonicalUrl: string;
  retrievedAt: string;
  httpStatus?: number;
  contentType?: string;
  sha256: string;          // of stored bytes; required on success
  bytesPath?: string;      // relative to .ingest/fetched/
  error?: string;
}

export interface NormalizedIdentity {
  manufacturer?: string;
  modelName?: string;
  partNumbers: string[];   // every explicit PN / OPN / model number printed
  variantTokens: string[]; // BOX, WOF, SUPER, Rev. 1.3, 32GB, …
}

export interface IngestNormalized {
  contractVersion: "ing7";
  candidateId: string;
  stage: "normalized" | "normalize-failed";
  sourceKind: IngestSourceKind;
  inputSha256: string;
  identity: NormalizedIdentity;
  extractedFields: Record<string, unknown>; // only keys the adapter knows
  rawQuotes: string[];     // verbatim snippets used
}

export interface SkuMatchRecord {
  contractVersion: "ing7";
  candidateId: string;
  stage: "sku-exact" | "sku-ambiguous" | "sku-unavailable" | "review-candidate";
  verdict: SkuMatchVerdict;
  matchedPartId?: string;
  matchedBy?: "partNumber" | "modelNumber" | "canonicalSku";
  evidence: string;
  variantConflicts: VariantAxis[];
  rejectedPartIds: string[];
}

export interface RightsReviewRecord {
  contractVersion: "ing7";
  candidateId: string;
  stage: "rights-reviewed" | "rights-rejected";
  sourceId: string;
  publisher: string;
  author?: string;
  canonicalUrl: string;
  citation: string;
  rightsClass: import("../../../../src/contract/prov4").EvidenceRightsClass;
  retrievedAt: string;
  decision: RightsDraftDecision; // never "approved" from the agent
  recommendedDecision: RightsDraftDecision | "approved";
  recommendReason: string;
  verbatimTerms: string;
  exactSkuEvidence: string;
  rejectRuleIds: string[];
}

export interface ProposedFieldChange {
  target:
    | "part.json"
    | "catalog-prices.json"
    | "image-source-registry.json"
    | "catalog-source-registry.json"
    | "catalog-manifest.json"
    | "image-file";
  path: string;            // JSON pointer or repo-relative image path
  op: "add" | "replace" | "remove" | "unchanged";
  before?: unknown;
  after?: unknown;
  reason: string;
}

export interface OwnerReviewPacket {
  contractVersion: "ing7";
  packetId: string;
  candidateId: string;
  partId?: string;
  sku: SkuMatchRecord;
  source: { url: string; citation: string; publisher: string; retrievedAt: string; sha256: string };
  rights: RightsReviewRecord;
  image?: { previewPath: string; sha256: string; bytes: number; mimeType: string };
  proposedChanges: ProposedFieldChange[];
  conflicts: string[];
  unresolvedFields: string[];
  ownerDecision?: "approved" | "rejected";
  ownerDecidedAt?: string;
}

export interface DryRunReport {
  contractVersion: "ing7";
  reportId: string;
  generatedAt: string;
  adapterIds: string[];
  packets: string[];       // packetIds
  shippedTreeDirty: false;
  summary: {
    exact: number;
    ambiguous: number;
    unavailable: number;
    rightsRejected: number;
    pendingOwner: number;
  };
}
```

Determinism: adapters sort `partNumbers`, `variantTokens`, and
`proposedChanges` lexicographically. Reports do not include wall-clock
times other than `retrievedAt` / `generatedAt` supplied by the caller
(tests inject a fixed clock).

---

## 13. CI / integrity gates

New Vitest coverage must assert:

| Gate | Assertion |
|------|-----------|
| Candidate / shipped separation | Dry-run writes only under `.ingest/` (or a test temp dir). `parts/**` and `benchmarks/cat6/**` hashes unchanged |
| Workspace not shipped | `.ingest/` is gitignored; Vite copy targets remain `parts` + `benchmarks` only |
| Exact SKU binding | Boxed/tray, SUPER, G2, Focus G, 32 vs 64 GB, Rev. 1.3 fixtures fail closed |
| `sourceId` registry binding | A proposed image/spec/price change names a `sourceId`; apply (later) refuses unknown ids |
| Approved rights required | No packet with `decision !== "approved"` can be applied; agent cannot emit `approved` |
| Image file / reference parity | Existing Phase 7 tests remain: populated `image` ⇒ approved registry + on-disk file |
| Orphan image detection | Existing “no unreferenced `parts/**/image.*`” test remains |
| Provenance completeness | Proposed spec/price fields carry `sourceId` + `retrievedAt`; C2 group-presence still holds |
| Deterministic output | Same fixtures + injected clock ⇒ byte-identical normalized records and reports |
| No legacy / related SKU substitution | Legacy fixture ids stay absent; related-SKU fixtures cannot become `sku-exact` |
| Frozen Phase 4 / 4.1 | `src/contract/prov4.ts` / `est1.ts` and `benchmarks/prov4/**` / `benchmarks/est1/**` are not modified by this phase |
| No Phase 8 / ADR-004 3D | Plan and tests do not add mesh ingest or `model.glb` replacement |

First slice does not need new Playwright coverage. Existing `pnpm test:e2e`
must stay green because the UI and shipped catalog do not change.

---

## 14. Smallest useful implementation slice

| Include | Exclude |
|---------|---------|
| `ing7` types + Zod + schema tests | Street-price adapter (Step 9) |
| Workspace helpers + `.gitignore` | Owner-apply / ship command (Step 10) |
| Wikimedia CPU image adapter | Additional Commons hunts for uncovered categories |
| Manufacturer GPU image adapter (ASUS Dual 4070 page; expected rights reject) | New shipped GPU image |
| AMD structured spec adapter (7600 product page → clocks / product IDs) | Writes into `benchmarks/est1/vendor-catalog/` |
| Candidate JSON, fetch sidecar, deterministic normalize | Runtime SPA fetch |
| Exact-SKU matcher | Fuzzy / family matching |
| Rights review record | `decision: "approved"` from the agent |
| Dry-run report + review packets | Catalog mutation, commit, push, UI |

A GPU adapter that correctly emits `rights-rejected` is a **pass**, not a
miss. That is the Phase 7 finding encoded as a machine rule.

---

## 15. Decisions (locked 2026-08-13 as proposed, no amendments)

| # | Question | Proposed | Rationale |
|---|----------|----------|-----------|
| **O1** | Workspace | Repo-root `.ingest/`, gitignored, never Vite-served | Keeps raw bytes out of the shipped catalog and out of `dist/` |
| **O2** | Contract | Sidecar `ing7`; no `cat6` / `prov4` / `est1` public-shape change | Same discipline as `est1` beside `perf1` |
| **O3** | First-slice adapters | Wikimedia CPU image + manufacturer GPU image + AMD spec | One proven image class, one known reject class, one structured spec |
| **O4** | Street-price adapter | Specified now; implement in Step 9 after the dry-run slice is green | Needed in the contract; not needed to prove the pipeline |
| **O5** | Apply / ship | Not in the first slice; later command requires owner-approved packet + `--apply` | Matches “no automatic shipment” |
| **O6** | Matcher strictness | Exact PN / model number / canonical SKU only; marketing name is never exact | Boxed/tray and revision traps are already in this catalog |
| **O7** | Rights authority | Agent drafts `pending` / `rejected` / `approved-metadata-only` only | Phase 4 / 7 fail-closed pattern |
| **O8** | CI network | Fixture-only; live fetch is explicit and local | Reproducible gates; no flaky vendor HTML in CI |
| **O9** | Existing shipped images | Dry-run may propose confirm-only; must not overwrite without apply | Protects the two lawful CPU photos |
| **O10** | ADR | No new ADR | No runtime, license, or evidence-policy change |

---

## 16. Failure modes

| Id | Mode | Honest response |
|----|------|-----------------|
| F1 | Vendor HTML changes / bot challenge | `fetch-failed`; keep URL + status; do not invent a parse |
| F2 | AMD page no longer embeds structured specs | Adapter fails closed; do not scrape random prose into clocks |
| F3 | Commons file is the right silicon, wrong package/SKU | `sku-ambiguous` or `unavailable`; do not reuse the 7800X3D exception |
| F4 | Manufacturer image exists but terms forbid storage | `rights-rejected` — success for the pipeline |
| F5 | Street listing is a bundle or wrong region | `sku-unavailable`; no KRW guess |
| F6 | Extract disagrees with shipped `part.json` | Conflict on the packet; shipped value stays |
| F7 | Agent (or future apply) would touch frozen `prov4` / `est1` | Hard fail the command |

---

## 17. Rollback strategy

First slice rollback is deletion-only:

1. Remove `src/contract/ing7.ts`, `src/contract/ing7.schema.ts`,
   `src/ingest/`, `scripts/ingest/`, and `src/test/ing7*.ts`.
2. Revert the `.gitignore` line for `.ingest/`.
3. Delete the local `.ingest/` directory.
4. Confirm `git status` shows no `parts/**` or `benchmarks/cat6/**` diffs.

Because dry-run cannot mutate the shipped catalog, there is no data rollback
for the first slice.

If a later apply slice has shipped a bad packet: restore the previous
`part.json` / image / registry bytes from git, set that packet to
`owner-rejected`, and record the incident under this phase folder — the
same posture as Phase 4's false first-party correction.

---

## 18. Implementation start gate

Items 1–2 are done (O1–O10 locked; M0 accepted 2026-08-13).
Implementation still starts only when:

3. Owner gives a **separate** explicit instruction to start
   implementation (the hand-off block in `README.md`).

Accepting this package is not that instruction.

---

## 19. Next step

Paste the implementation hand-off in `README.md` in a new session to
authorize Steps 1–8 only.
