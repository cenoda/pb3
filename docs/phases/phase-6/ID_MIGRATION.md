# Phase 6 — Part id migration

Status: **Step 5 executed 2026-08-10; Step 6 slot 14 admitted 2026-08-10.** Products are the owner's Step 3 selection.
Legacy fixture ids are retired; **14 `cat6` parts are authored** under `parts/`, and
the **runtime manifest loads all 14**. Slot 14
(`motherboard.gigabyte-b650m-aorus-elite-ax-rev-1-3`) has a visual-only plane GLB
and collision-less `physicalSpec`. **O7 running-app reachability** is proven by
`e2e/phase6-o7-slot14-witness.spec.ts`.

Authority: [`specs/phase-6.md`](./specs/phase-6.md) §4 (**O3**, **O4**).
Contract: [`specs/catalog-data-contract.md`](./specs/catalog-data-contract.md) (`cat6`).

**Guard:** an integrity test asserts that **no legacy id in §2 appears anywhere** in
`src/**`, `parts/**`, `benchmarks/**`, or `e2e/**` once the migration step ends. A
half-migrated repository is the failure this table exists to prevent.

## How to read the figures

Every manufacturer figure below is **owner-supplied and not yet verified against a
cited page by this repository.** They are recorded here because the slot decisions
depend on them, not as sourced catalog data. Step 4 re-reads each figure from the
manufacturer's own page, records the citation and retrieval date in
`benchmarks/cat6/catalog-source-registry.json`, and **any figure that does not
match what the page says invalidates the invariant that rests on it** (§4) — the
slot is then re-decided, not adjusted to fit.

The two already-authored parts are the exception: their figures are in the repo
with provenance.

---

## 1. Decisions carried into this table

### D1 — Slot 9 keeps the `cpu-socket` negative, under a narrow written exception

**O2** scopes the catalog to AM5 + DDR5. Slot 9's only role is to make
`checkCpuSocket` return `incompatible`, and the legacy fixture did it with
impossible hardware (`AM4` + `B450` + `DDR5`; B450 is DDR4). A real AM4 board is
DDR4 and would need the `supportedMemoryType: "DDR5"` literal widened — the change
O2 explicitly deferred.

The exception, to be recorded in the contract, is **not** justified by
`MotherboardCompatSpec.socket` happening to be typed `string`:

> The production and default catalog remains AM5 + DDR5 scoped. A non-AM5 DDR5
> motherboard may exist **only** when it is explicitly designated as a negative
> fixture whose purpose is to exercise `cpu-socket: incompatible`.

One slot deliberately outside the socket boundary, for a test, is a narrower and
more honest position than keeping hardware that does not exist.

### D2 — `maxMemorySpeedMtS` is the vendor-published maximum supported rate

Board vendors publish a list (`8000(OC) / 7800(OC) / … / 5600 / 5200 / 4800`).
Recording the JEDEC floor would mark DDR5-6000/6400/7200 kits — memory people run
every day — as `incompatible`, which makes the compat engine disagree with reality.
Calling it "the EXPO speed" is also wrong, because the list is not EXPO-only.

Rule to add to `cat6` **before Step 4 authors any motherboard**:

> `maxMemorySpeedMtS` records the highest memory data rate that the motherboard
> vendor explicitly lists as supported for that SKU, including values marked
> OC/XMP/EXPO where applicable.
>
> This is a catalog compatibility ceiling, not a guarantee that every memory kit,
> CPU IMC, DIMM population, or timing configuration will operate at that rate.

### D3 — **F4 is unresolved, not accepted**

Under **O6** no board carries `biosMinVersionForCpu`, so `checkChipsetBios` returns
`unavailable` for every build and `buildVerdict` (`src/ui/buildVerdict.ts:83`)
demotes every otherwise-clean build — including the default build — to
`level: "caution"`, *"These parts work together, with one thing we could not
check."*

That is **not accepted as the phase's UX outcome.** It erases the distinction
between "a build with a real unchecked risk" and "a build whose BIOS provenance we
simply do not model". It stays an open blocker, resolved in its own bounded step
that looks at verdict semantics and
`benchmarks/compat2/compatibility-examples.json` together.

**It does not block Step 3 or Step 4.** Selection, this migration table, and
authoring all proceed. What is forbidden is papering over it — **no invented BIOS
minimum is written into any board to make the banner go away.**

### D4 — Conditional clearance produces three outcomes, not two

Superseding the earlier `unavailable` routing. Where a vendor publishes several
clearance branches for the catalogued SKU, the evaluator evaluates **all** of them
even when it cannot determine which one holds:

| Across all published branches | Outcome |
|---|---|
| fits in every branch | `fit` |
| fails in every branch | `interference` |
| fit in some, fail in others | `conditional` |

A 140 mm PSU against `1 HDD Tray: 255 mm / 2 HDD Tray: 155 mm` is `fit` outright —
`140 ≤ 155` and `140 ≤ 255` — with no need to model tray state. A 200 mm PSU is
`conditional`. "We do not know which branch holds" and "we cannot judge at all" are
different facts and must not collapse into the same `unavailable`.

`PhysicalValidationStatus` has no `conditional` member and `unavailable` is
promoted to `blocked` by the display layer, so this needs a phys3 change. It is
therefore a **candidate blocker before Step 6**, not a later-phase follow-up
(§6). Until it lands, the default build is chosen to clear every published branch
unconditionally — which is why slot 10 is a 140 mm PSU.

---

## 2. The slot table

Legacy motherboard ids used the `mb.` prefix; `cat6` §3 requires the id prefix to
be the literal `PartCategoryV2` value, so they become `motherboard.*`.

| # | Legacy id | New id | Product | Role preserved |
|---|-----------|--------|---------|----------------|
| 1 | `case.mid-tower-atx-01` | `case.fractal-design-north-tg-dark` ✅ | Fractal Design North Black TG Dark | Default build · `prov4` pilot · phys3 core |
| 2 | `case.micro-atx-mini-01` | `case.lian-li-a3-matx-black` | LIAN LI A3-mATX Black | `case-form-factor` negative · **O7** interference host |
| 3 | `cooler.air-twin-tower-01` | `cooler.noctua-nh-d15-g2` | Noctua NH-D15 G2 | Default build · `prov4` pilot · **O7** interference source |
| 4 | `cpu.zen4-7600` | `cpu.amd-ryzen-5-7600` | AMD Ryzen 5 7600 (`100-100001015BOX`) | Default build · `prov4` pilot · `perf1` CPU #1 |
| 5 | `cpu.zen4-7800x3d` | `cpu.amd-ryzen-7-7800x3d` | AMD Ryzen 7 7800X3D (`100-100000910WOF`) | `perf1` CPU #2 · `psu-wattage` negative (high TDP) |
| 6 | `gpu.rtx4070` | `gpu.asus-dual-rtx4070-o12g` ✅ | ASUS Dual RTX 4070 OC 12GB | Default build · `prov4` pilot · `perf1` GPU #1 |
| 7 | `gpu.rtx4080` | `gpu.asus-proart-rtx4080-o16g` | ASUS ProArt RTX 4080 OC 16GB (`PROART-RTX4080-O16G`) | `perf1` GPU #2 · `psu-wattage` negative (high TGP) |
| 8 | `mb.atx-b650-01` | `motherboard.gigabyte-b650-aorus-elite-ax-v2` | GIGABYTE B650 AORUS ELITE AX V2 | Default build · `prov4` pilot · phys3 anchor hub |
| 9 | `mb.micro-b450-01` | `motherboard.asus-tuf-gaming-b860m-plus-wifi` | ASUS TUF GAMING B860M-PLUS WIFI | `cpu-socket` negative — **under D1 only** |
| 10 | `psu.750w-atx` | `psu.corsair-rm750e` | Corsair RM750e 750 W (`CP-9020295-NA`) | Default build · `prov4` pilot · phys3 |
| 11 | `psu.550w-sfx` | `psu.cooler-master-v550-sfx-gold` | Cooler Master V550 SFX Gold (`MPY-5501-SFHAGV`) | `psu-wattage` negative |
| 12 | `ram.ddr5-32gb-6000` | `ram.teamgroup-t-create-expert-ddr5-6000-32gb` | TEAMGROUP T-CREATE EXPERT DDR5-6000 32GB (`CTCED532G6000HC30DC01`) | Default build · `prov4` pilot · phys3 |
| 13 | `ram.ddr5-16gb-7200` | `ram.gskill-trident-z5-rgb-ddr5-8400` | G.SKILL Trident Z5 RGB DDR5-8400 (`F5-8400J4052G24GX2-TZ5RW`) | `ram-support` over-speed negative |
| **14** | *(none — new part)* | `motherboard.gigabyte-b650m-aorus-elite-ax-rev-1-3` | GIGABYTE B650M AORUS ELITE AX **Rev. 1.3** | **O7 reachability witness** — see §5 |

Slots 1, 3, 4, 6, 8, 10, 12 are simultaneously the default build
(`DEFAULT_BUILD_STATE_V2`, `src/contract/vs2.ts:63`) and the `prov4` pilot set
(`PROV4_PILOT_PART_IDS`, `src/contract/prov4.ts:526`).

---

## 3. Field-level derivations, per slot

Only the fields a slot's role depends on. Everything else is authored in Step 4
from the cited page.

| Slot | Field | Value | Why the role needs it |
|---|---|---|---|
| 2 | `supportedFormFactors` | `["Micro-ATX"]` | The product also accepts Mini-ITX; `compat2`'s `CaseCompatSpec` models only ATX and Micro-ATX (`compat2.ts:65`), so Mini-ITX is dropped and the omission reported — same handling as slot 1. ATX must be genuinely absent for the negative to be real, not a modelling artifact |
| 2 | `maxCpuCoolerHeight` | 165 mm | Upper half of the O7 arithmetic |
| 3 | cooler height | 168 mm | Lower half of the O7 arithmetic |
| 4 | `socket` / `tdpWatts` | `AM5` / 65 W | Default build; low-TDP half of the headroom pair |
| 5 | `tdpWatts` | 120 W | `psu-wattage` negative |
| 7 | `tdpWatts` | 320 W | `psu-wattage` negative. **320 W is NVIDIA's chip-level TGP, not an ASUS board figure** — cited to NVIDIA with the scope caveat on the registry entry, exactly as slot 6 handles the 4070's 200 W (**C10**) |
| 8 | `maxMemorySpeedMtS` | 8000 | Ceiling for both RAM outcomes, under **D2** |
| 9 | `socket` / `formFactor` | `LGA1851` / `Micro-ATX` | `cpu-socket` negative under **D1** |
| 10 | `wattage` / length | 750 W / 140 mm | Default build; 140 mm is chosen to clear every published PSU branch of slot 1 |
| 11 | `wattage` | 550 W | `psu-wattage` negative |
| 12 | `speedMtS` | 6000 | Must sit at or under slot 8's ceiling |
| 12 | module height | 32 mm | See **I5** — this one needs its own sourced figure |
| 13 | `speedMtS` | 8400 | Must exceed slot 8's ceiling |
| 14 | `socket` / `chipset` / `formFactor` | `AM5` / `B650` / `Micro-ATX` | Compat-clean path into slot 2 — **I8** |
| 14 | `maxMemorySpeedMtS` | 8000 | Under **D2**. Must sit at or above slot 12's 6000, or **I8** fails at `ram-support` |
| 14 | `identity` | board revision **Rev. 1.3** recorded | GIGABYTE publishes revision-specific pages under one model name; collapsing the revision would make the cited figures unattributable to what was read |

### Slot 14's revision is part of its identity

The id carries `-rev-1-3` and `identity` records the revision explicitly. This is
**O3**'s SKU granularity applied one level deeper: for GIGABYTE boards the PCB
revision selects the spec page, so `b650m-aorus-elite-ax` alone does not name a
single set of figures. Whichever page Step 4 reads, the revision it belongs to is
what the id and `identity` must say.

---

## 4. Invariants

These, not the product names, are what the migration must preserve. Each was
checked against the engine that consumes it.

### I1 — Default build assembles

Slots 1 + 3 + 4 + 6 + 8 + 10 + 12 must be compatible and physically fit on real
data (**RK5**). `checkChipsetBios` will read `unavailable` under **O6** — that is
**D3**, tracked separately, not a failure of this invariant.

### I2 — O7 physical interference is genuine

```
slot 2  LIAN LI A3-mATX   maxCpuCoolerHeight  165 mm
slot 3  Noctua NH-D15 G2  height              168 mm
        168 > 165  →  interference, 3 mm excess
```

and the same cooler clears the default case:

```
slot 1  Fractal North TG  maxCpuCoolerHeight  170 mm  ("without Fan Bracket")
        168 ≤ 170  →  fit, 2 mm clearance
```

This replaces the hand-authored `clearance:cooler-sidekeepout`, which exists only
to be hit. **The margins are 3 mm and 2 mm**; both figures must be re-read from the
manufacturer's page at authoring, because a 2 mm transcription error inverts the
default build's verdict.

Slot 1 records exactly one cooler branch (the 145 mm figure is Mesh-only and
dropped under **C12**), so this evaluates unambiguously under **D4**.

### I3 — PSU wattage negative

`checkPsuWattage` (`src/compat/checkPsuWattage.ts:25`) computes
`(cpuTdp + gpuTdp) × PSU_HEADROOM_MULTIPLIER` and returns `compatible` only when
`wattage >= required`:

```
(120 + 320) × 1.3 = 572 W required
slot 11 = 550 W        550 < 572  →  incompatible, 22 W short
```

Reproduced from published figures with nothing adjusted. **Note the dependency:**
`PSU_HEADROOM_MULTIPLIER = 1.3` is a stub. If it is ever revised downward past
`550 / 440 = 1.25`, this negative silently becomes `compatible`. Recorded so a
future change to the constant is known to break a catalog invariant.

### I4 — RAM over-speed negative

`checkRamSupport` (`src/compat/checkRamSupport.ts:34`) returns `incompatible` when
`ram.speedMtS > motherboard.maxMemorySpeedMtS`:

```
slot 13 = 8400 MT/s  >  slot 8 = 8000 MT/s  →  incompatible, 400 MT/s over
```

This invariant exists **only** under **D2**. Record the JEDEC figure for slot 8
instead and the comparison inverts.

### I5 — Default build PSU clears every branch unconditionally

```
slot 10 length 140 mm  vs slot 1 published PSU branches
    140 ≤ 255  (1 HDD Tray)
    140 ≤ 155  (2 HDD Trays)
    →  fit in every branch  →  fit  (D4)
```

This is the deliberate mitigation for **D4**: the default build never depends on
the unimplemented `conditional` status.

### I6 — Default build RAM does not raise the cooler above slot 1's limit

Slot 12 is chosen at 32 mm module height so the NH-D15 G2's front fan need not be
raised, which would push the assembly past slot 1's 170 mm limit and break **I2**'s
2 mm margin.

```
slot 12 module height          32 mm   (TEAMGROUP, 32(H) × 133(L) × 7(W) mm)
NH-D15 G2 dual-fan RAM limit   32 mm   (Noctua, out-of-box configuration)
        32 ≤ 32   →  front fan not raised  →  cooler stays 168 mm
        168 ≤ 170  →  I2's 2 mm clearance holds
```

**Both citations are recorded — B6 is closed.** Neither figure is an expectation
any more:

| Figure | Where it lives | Source |
|---|---|---|
| Module height 32 mm | `ram.teamgroup-t-create-expert-ddr5-6000-32gb` → `dimensionsMm.heightMm`, with `provenance.dimensions` | `source.cat6.teamgroup.t-create-expert-ddr5-6000-32gb.product` — publishes all three axes labelled, `32(H) × 133(L) × 7(W) mm` |
| RAM clearance 32 mm, cooler height 168 mm, and the raise-increases-height rule | `cooler.noctua-nh-d15-g2` → `notes` (cat6 has no field for a cooler's RAM clearance), height in `dimensionsMm.heightMm` with provenance | `source.cat6.noctua.nh-d15-g2-ram-faq` and `source.cat6.noctua.nh-d15-g2.specifications` |

Noctua states the mechanism directly rather than leaving it to be inferred: the
out-of-box clearance is 32 mm at the default 168 mm height, and raising the front
fan for taller memory raises the cooler by the same amount — its own worked example
is 35 mm memory giving a 171 mm cooler.

The arithmetic runs on authored data in
`src/test/cat6.batch.invariants.test.ts`, which reads the module height from the
memory part and the cooler height from the cooler part rather than restating
either. **RK3 still governs a correction:** if a re-read changes a figure, the part
or the invariant is re-decided — the numbers are not adjusted to preserve the
conclusion — and the test fails rather than drifting.

The margin is **exactly zero** — `32 ≤ 32`. Any correction upward on the module
height, or downward on the cooler's clearance, breaks the invariant with no slack
at all. That is a property of the selection, not of the evidence, and it is why the
equality is asserted explicitly rather than as an inequality that would pass on a
wrong number.

### I7 — `case-form-factor` negative

```
slot 2 supports ["Micro-ATX"]  ·  slot 8 is ATX  →  incompatible
```

Slot 14 does **not** change this. Slot 2's negative role is unchanged: paired with
the ATX board it is still `case-form-factor: incompatible`, and only the slot 14
pairing opens the physical path (**I8**).

### I8 — The O7 demonstration build is compat-clean

The build that makes **I2** visible in the running app:

| Slot | Part |
|---|---|
| 2 | LIAN LI A3-mATX Black |
| 14 | GIGABYTE B650M AORUS ELITE AX Rev. 1.3 |
| 3 | Noctua NH-D15 G2 |
| 4 | Ryzen 5 7600 |
| 12 | T-CREATE EXPERT DDR5-6000 |
| 6 | ASUS Dual RTX 4070 OC |
| 10 *or* 11 | see **I9** |

Every compatibility check must pass so that `buildVerdict` reaches the physical
stage:

```
case-form-factor  slot 2 ["Micro-ATX"] ∋ slot 14 Micro-ATX   →  compatible
cpu-socket        AM5 ↔ AM5                                  →  compatible
ram-support       DDR5 ↔ DDR5,  6000 ≤ 8000                  →  compatible
psu-wattage       (65 + 200) × 1.3 = 344.5 W  ≤  PSU wattage →  compatible
chipset-bios                                                 →  unavailable (D3)
```

then the physical stage reports `168 > 165` — a real interference from published
figures.

`chipset-bios` reads `unavailable` under **O6**, which demotes the verdict to
`caution` but keeps `showResults: true` (`src/ui/buildVerdict.ts:83–92`), so the
physical stage is still reached and the interference is still shown. **D3** does
not hide **I2**.

### I9 — The demonstration build must produce exactly one interference

`buildVerdict` returns on the **first** physical check with
`status === "interference"` (`src/ui/buildVerdict.ts:58–67`). If the **I8** build
violates more than one of slot 2's published limits, the interference the user sees
is whichever check is enumerated first — which may not be the cooler.

So at authoring time, against slot 2's published limits:

- slot 6's length must clear slot 2's `maxGpuLength` (the ASUS Dual 4070 is
  267.01 mm — already in the repo with provenance)
- the chosen PSU's length must clear slot 2's `maxPsuLength`

A3-mATX is a compact case and its PSU support has not been read yet. If it does not
take slot 10's 140 mm ATX unit, **slot 11** (Cooler Master V550 SFX, 100 mm) is the
substitute and stays compat-clean here — `550 ≥ 344.5` — because its `psu-wattage`
negative role only fires against the slot 5 + slot 7 pair, not this build.

**This is a Step 4 gate, not an assumption.** Reading slot 2's limits decides which
PSU the demonstration build uses; if no catalog part clears the other limits, the
demonstration is ambiguous and slot 2 is re-decided.

---

## 5. Why slot 14 exists — O7 reachability

`buildVerdict` (`src/ui/buildVerdict.ts:45–56`) returns on the **first**
`incompatible` compatibility check, with `showResults: false`, **before** any
physical check is consulted. So a build that is compat-blocked never displays its
physical verdict.

With the catalog as selected, every build containing slot 2 is compat-blocked:

| Slot 2 paired with | Blocked by |
|---|---|
| slot 8 (ATX) | `case-form-factor` — **I7** |
| slot 9 (LGA1851 Micro-ATX) + any AM5 CPU | `cpu-socket` — **D1** |

Those are the only two motherboards, and **O2** admits no LGA1851 CPU. So **I2's
interference exists in the data but can never be shown in the running app** —
which is what exit condition 4 and **O7** require ("a catalog that cannot
demonstrate it removes that capability from the running app").

**Resolution (owner-approved): slot 14, GIGABYTE B650M AORUS ELITE AX Rev. 1.3.**
A real AM5 · DDR5 · Micro-ATX board opens a compat-clean path into slot 2, so the
physical stage is reached and `168 > 165` is what the user sees (**I8**). It is a
new part rather than the migration of a legacy id, and it fits the phase's target
shape (≈3–6 per category; motherboards go to three).

### Slot 14's role, stated normatively

> **O7 reachability witness** — a compat-clean AM5 / DDR5 / Micro-ATX path into
> slot 2's real physical interference.

It is not "a third motherboard". If a later change removes it, or changes it such
that **I8** stops being compat-clean, **O7 stops being demonstrable in the running
app** even though the interference data is unchanged. That is the failure mode this
role statement exists to make visible.

Slot 14 does not take over slot 2's `case-form-factor` negative, and does not
resolve **B3** — the `conditional` status is still needed for genuinely conditional
parts, and no part in this build is one.

---

## 6. Ordering and blockers

| # | Item | Gate |
|---|------|------|
| B1 | **D2** `maxMemorySpeedMtS` rule written into `cat6` | Before Step 4 authors **any** motherboard |
| B2 | **D1** negative-fixture exception written into `cat6` / `specs/phase-6.md` | Before slot 9 is authored |
| B3 | **D4** three-outcome C13 + `conditional` in `PhysicalValidationStatus`, **and branch filtering** (below) | ✅ **Resolved 2026-08-10** — `conditional` status, conservative `appliesWhen` pruning, and selected-build part resolution in `evaluateClearanceLimits` |
| B4 | **D3** F4 permanent-caution resolution | Bounded step of its own. Does **not** gate Steps 3–4 |
| B5 | Slot 14 selection | ✅ **Closed** — GIGABYTE B650M AORUS ELITE AX Rev. 1.3, approved 2026-08-10 |
| B6 | **I6** sourcing (cooler RAM clearance + module height) | ✅ **Closed 2026-08-10** — both citations recorded; **I6** derived from authored data. See below |
| B7 | **I9** — which PSU the **I8** demonstration build uses | ✅ **Closed** — slot 10 (Corsair RM750e, 140 mm ATX); slot 2 supports ATX up to 220 mm |
| B8 | **CPU package dimensions** — no public AMD product page publishes them, but exit condition 4 wants every physical-core part's box derived from cited dimensions | Before Step 6. Found authoring slot 4; see below |
| B9 | **`MotherboardCompatSpec.maxMemorySpeedMtS` is required**, which blocked slot 9 from carrying a `compatSpec` at all | ✅ **Closed** — field made optional; slot 9's `cpu-socket` negative verified restored |
| B10 | **`DimensionsMm` was all-or-nothing**, so parts with partial published dimensions recorded none | ✅ **Closed** — each axis optional, at least one required; published axes now kept |
| B11 | **No catalog price is sourced yet**, so the running app's only prices are the 13 phase-2 fixture amounts | Before the **O5** price step. Found during Step 4; see below |

### B11 — the fixture prices are not catalog prices

Step 4 re-points the 13 `benchmarks/price2` amounts onto the new ids and stops
there. They stay compat2 `PricedPart` rows carrying
`basis: "phase-2 fixture price; not a live market quote"`, which is what they
are.

They are **not** migrated into `benchmarks/cat6/catalog-prices.json`. `cat6`'s
`CatalogStreetPrice` requires `retailer` ("the retailer whose listing was read"),
`region`, `sourceId` and `retrievedAt` ("ISO-8601 date the listing was read; this
is a snapshot, not a feed"). Carrying a synthetic number into those fields would
publish a dated retailer quote for a real, named SKU that no one read — the exact
claim the shape exists to make, and a charter §2 violation with a `sourceId` that
resolves to nothing in `catalog-source-registry.json`. The gap between $49 and
what an NH-D15 G2 actually costs is the size of the lie.

The consequence, recorded rather than hidden: **the price the app shows is a
fixture amount attached to a real product name.** That is inherited from Phase 2
and not made worse here, but it does not survive to a release. The **O5** step
authors real MSRP and dated street snapshots per SKU, and deletes
`benchmarks/price2/` at that point.

### B9 — a required memory ceiling blocked the socket negative (resolved)

**Owner decision: option 1.** `maxMemorySpeedMtS` is now optional on
`MotherboardCompatSpec` (`src/contract/compat2.ts:46`,
`src/contract/vs2.schema.ts:29`). No logic changed: `checkRamSupport` already
tested the field for null and returned `unavailable` with a reason.

Slot 9 therefore carries `socket`, `chipset`, `formFactor` and
`supportedMemoryType` while leaving the ceiling absent, and its `cpu-socket`
negative is restored — verified by driving `checkCpuSocket` and `checkRamSupport`
directly from the authored specs, since the catalog loader now reads
`parts/catalog-manifest.json` (Step 5). The memory check reports `unavailable` for this board,
which is the true statement, and boards that do publish a ceiling are unaffected.

The record of what was decided against is kept below.

### B9 — the original finding

`motherboardCompatSpecSchema` (`src/contract/vs2.schema.ts:24`) requires
`maxMemorySpeedMtS`. ASUS publishes slot 9's ceiling as **`Support up to
8800+MT/s (OC)`** — the trailing `+` states a floor for the overclocking ceiling,
not an exact maximum, and converting it into one is an interpretation this catalog
has not authorised.

So slot 9 cannot carry a `compatSpec` at all, which means it cannot carry
`socket: "LGA1851"` either — and `checkCpuSocket` reports `unavailable` instead of
`incompatible`. **The board is in the catalog under the C15 exception for a role it
currently cannot perform.** Nothing else in the catalog produces a `cpu-socket`
negative, so that path is unexercised until this is decided.

The part is authored with everything else in place, so whichever option is taken
completes it with one field.

Options:

1. **Make `maxMemorySpeedMtS` optional in `MotherboardCompatSpec`.** The engine
   already handles its absence: `checkRamSupport`
   (`src/compat/checkRamSupport.ts:12`) tests `maxMemorySpeedMtS == null` and
   returns `unavailable` with a reason. So this is a type and schema change with
   **no logic change** — and it is the honest shape, because "the vendor did not
   publish an exact ceiling" is a real state this contract cannot currently
   express. It does touch compat2, which Phase 6 otherwise leaves alone.
2. **Record 8800.** Defensible under C14's literal wording — 8800 is the highest
   rate explicitly listed — and it understates rather than overstates, since the
   `+` means the true ceiling is at least that. It is inert in practice: every
   build containing slot 9 is `cpu-socket` blocked before `ram-support` is
   reached. But it writes a number the vendor did not print as a maximum.
3. **Choose a different slot 9** whose vendor publishes an exact ceiling. Keeps
   both contracts untouched and costs one re-selection.

### B10 — partial published dimensions could not be recorded (resolved)

**Owner decision: allow partial dimensions.** Each axis of `DimensionsMm` is
optional; `raw` and `assignmentBasis` stay required, and a record with no axis at
all is rejected — a dimensions record that records no dimension is not a record,
and a part with nothing published omits the field entirely.

The governing rule, which is the point of the change rather than the optionality:

> A missing axis is **never** filled from the part's form factor. ATX, SFX and
> UDIMM standardise mounting geometry, not a SKU's physical dimensions.
> Consumers needing a complete box build one only when all three axes are
> present; a check needing a single axis may use that axis when published.

Recorded as a result: the boards keep their published two-figure outlines, and the
G.SKILL kit keeps its 44 mm module height cited to the FAQ that publishes it. CPUs
still carry no record, because they publish no axis (**B8** is unchanged).

Nothing consumes `dimensionsMm` outside tests yet — the Step 6 generator does not
exist — so the all-three-present guard has to be built into that generator when it
is written. Tests assert which parts currently have complete boxes and which do
not, so the generator's input set is pinned before it is written.

### B10 — the original finding

`DimensionsMm` requires `lengthMm`, `heightMm` and `thicknessMm` together. Three
kinds of part in this catalog publish fewer:

| Part | Published | Missing |
|---|---|---|
| Motherboards (slots 8, 9, 14) | board outline, two figures | thickness |
| G.SKILL kit (slot 13) | module height 44 mm | length, thickness |
| CPUs (slots 4, 5) | nothing | all three — this is **B8** |

In each case the whole field is absent, so a figure the vendor **did** publish is
discarded. For slot 13 that figure is the module height — the same class of number
that invariant **I6** turns on for slot 12.

This is the same decision as **B8** and should be taken with it: either
`DimensionsMm` gains optional members and Step 6's generator handles partial boxes,
or exit condition 4 is narrowed to the parts whose dimensions are fully
publishable. Not urgent for the demonstration build, which needs none of these
boxes, but Step 6 cannot generate geometry for these parts as things stand.

### B8 — CPU package dimensions: decision (pre-Step-6 closure, 2026-08-10)

AMD's Ryzen 5 7600 and Ryzen 7 7800X3D product pages publish **no** sourced
package width, length, or height. Published `CCD Size` / `IOD Size` figures are
silicon die areas, not package dimensions.

**Approved decision for Step 6:**

1. `dimensionsMm` stays absent on CPU slots — correct under exit condition 3.
2. The legacy synthetic `collision:cpu-die` box is **not** accepted as real-product
   physical truth.
3. Step 6 **excludes CPU collision geometry** while preserving socket/mount semantics.
4. Official package mechanical geometry may be reintroduced later when a suitable
   primary source is obtained.
5. Exit condition 4 is **not** weakened: physical-core membership does not require
   every member to expose a collision box (see `PHYS3_PHYSICAL_CORE_IDS` comment).

**Renderer note (read-only audit):** each CPU GLB carries a separate `visual:*` mesh
and `collision:cpu-die`; `MountedPartModel` renders only `visual:*` nodes.
Removing collision geometry in Step 6 does not remove CPU visibility.

**B12 follow-up:** when the CPU collision node is removed in Step 6, stale cooler
`allowedContacts` references to `collision:cpu-die` must be removed in the same step.

Options 1–3 from the pre-decision list above are superseded by this ruling except
that option 1 (official package drawing) remains the preferred path if a primary
source is found later.

### B8 — CPU package dimensions are not on the product page (original finding)

AMD's Ryzen 5 7600 page publishes no package width, length or height. What it does
publish — `CCD Size: 71mm²`, `IOD Size: 122mm²` — is **silicon die area**, not a
package dimension, and cannot be converted into one.

`dimensionsMm` is therefore absent on slot 4, which is correct under exit
condition 3 (unsourceable means absent). But the CPU is a phys3 physical-core part:
the legacy fixture carries `collision:cpu-die`, and Step 6 derives collision boxes
from `dimensionsMm`. Exit condition 4 asks that **every** physical-core part's box
come from cited dimensions, and as it stands the CPU cannot satisfy that.

This is a category-level problem, not a slot-4 one: it will recur for slot 5 and for
any CPU added later.

**What is not yet established:** whether AMD publishes AM5 package drawings
somewhere other than the product page. AMD's x86 thermal-design material treats
package drawings as separate technical documentation, sometimes behind access
requirements. That is a reason to go looking, **not** grounds to record that the
dimensions do not exist or are unobtainable — neither has been checked.

Options, for the step that resolves this:

1. Find an official AM5 package drawing and cite it. Preferred; the dimension is a
   socket-level fact shared by every AM5 CPU, so one citation covers the category.
2. Narrow exit condition 4 to the physical-core parts whose dimensions are
   publishable, and record the CPU as a known exception with its reason.
3. Drop the CPU from collision geometry entirely, since it sits under the cooler and
   its box has never decided a verdict.

**Not an option:** the widely repeated 40 × 40 mm figure. It is not in any source
this repository has read, and writing it down would be the fixture problem returning
under a real product's name.

### B3, second half — branch filtering, found while authoring slot 2

`ClearanceLimit.condition` is free text, deliberately (**C13**: no configuration
model exists to name conditions against). Slot 2 is the first part where that
costs something measurable.

Six of its fourteen GPU-length branches are conditioned on the PSU's own length —
`ATX PSU >150mm`, `ATX PSU >140mm`, `ATX PSU <=140mm`, and so on. With slot 10's
140 mm unit selected, the `>150mm` and `>140mm` branches **cannot apply to the
build at all**, but no evaluator can determine that: the predicate is inside a
string.

For this fixture it happens not to matter. The 258 mm `S2` and `S3` branches carry
no PSU predicate, fail independently, and the verdict is `conditional` either way.
**That is a coincidence of this case, not a property of the design.** A case whose
only failing branches are PSU-length-conditioned would be reported `conditional`
when the selected PSU makes it an unambiguous `fit` — a false `conditional`, which
is the same class of error as the `unavailable`-means-blocked problem **D4** was
written to fix.

So adding the `conditional` status alone is not sufficient. Whatever step resolves
**B3** has to decide whether conditions stay free text (and the status is reported
more often than the facts warrant) or gain enough structure to be filtered against
a build. **Resolved 2026-08-10:** `condition` remains verbatim provenance/display
text; structured `appliesWhen` predicates (`psu.lengthMm` with `lte` \| `gt`)
perform conservative branch pruning against the selected build's PSU length.

---

## 7. Consumers to re-point

Verified by grep against the working tree.

| Consumer | What changes |
|----------|--------------|
| `src/contract/vs2.ts` | **Step 5 (O8) done:** `PHASE2_PART_PATHS` removed; runtime catalog membership comes from `parts/catalog-manifest.json` via `loadPartCatalog`. `DEFAULT_BUILD_STATE_V2` unchanged; manifest does not choose defaults — loader join-guards that every default part id is manifest-listed. `PHASE2_*_IDS` / `PHASE0_*_IDS` constants remain for contract/fixture semantics (e.g. perf1 schema, T2 subset checks); runtime selection validation uses manifest-loaded catalog id + category only |
| `src/contract/prov4.ts` | `PROV4_PILOT_PART_IDS` re-pointed |
| `src/contract/vs0.ts`, `perf1.ts`, `perf1.schema.ts`, `est1.ts`, `est1.schema.ts`, `phys3.ts`, `prov4.schema.ts` | Doc-comment and example ids |
| `src/perf/applyCorrection.ts`, `src/perf/estimateWorkload.ts`, `src/estimate/estimatorQuery.ts`, `src/provenance/pilotBuild.ts`, `src/provenance/bindPerformanceEvidence.ts` | Hardcoded example ids; mechanical |
| `src/viewport/GpuModel.tsx` | **Path re-point only**, under the carve-out below |
| `benchmarks/perf1/*.json` (4 files) | `cpuId` / `gpuId` re-pointed; coverage stays 4 pairs; values stay `stub` |
| `benchmarks/prov4/pilot-*.json`, `external-performance-observations.json` | Pilot re-pointed; no grade change |
| `benchmarks/phys3/physical-validation-examples.json` | **Rewritten** from real dimensions (**RK1**), not re-pointed |
| **`benchmarks/compat2/compatibility-examples.json`** | **Rewritten, not a mechanical re-point.** Its first example asserts `chipset-bios: "compatible"` and `overallStatus: "compatible"`; under **O6** both become `unavailable`. Tied to **D3** — do not rewrite the expectations by inventing a BIOS minimum |
| `benchmarks/vs0/*.json` | Re-pointed |
| `benchmarks/price2/price-fixtures.json` | **Re-pointed, not deleted.** Deletion is deferred to the step that authors **O5**'s sourced prices, because the supersession this row originally assumed has not happened: no catalog price has been sourced yet. The 13 amounts stay phase-2 fixtures and keep their `basis` — `phase-2 fixture price; not a live market quote`. Moving them under `benchmarks/cat6/` in `CatalogPriceRow` shape would have dressed a synthetic number as a dated retailer snapshot of a real SKU, which `CatalogStreetPrice` (`retailer`, `retrievedAt`, `sourceId`) exists to assert. See **B11** |
| `e2e/**` (7 specs) | Selections re-pointed; each assertion's meaning preserved (**RK4**) |
| `src/test/**` (~25 files) | Re-pointed with the code they cover |

### Step 5 — manifest and loader (**O8**, done 2026-08-10)

`parts/catalog-manifest.json` is the single runtime membership index: 13 loadable
parts today. `loadPartCatalog` fetches the manifest, validates with
`catalogManifestFileSchema`, loads only listed `part.json` paths, and join-guards
that `DEFAULT_BUILD_STATE_V2` references ids present in the loaded catalog.
`PHASE2_PART_PATHS` is deleted. Runtime selection validation and `buildStore`
setters derive allowed ids from the loaded catalog (`catalogAllowedIds`), not from
`PHASE2_*_IDS` / `PHASE0_*_IDS` — those constants remain in `vs2.ts` for
contract/fixture meaning only.

**Slot 14 (`motherboard.gigabyte-b650m-aorus-elite-ax-rev-1-3`) — admitted Step 6
(2026-08-10):** visual-only 244 × 244 mm plane GLB, collision-less
`physicalSpec`, runtime manifest entry. O7 witness build is reachable in the
running app. **B3**, **B8**, and **B11** unchanged.

### `src/viewport/GpuModel.tsx` — carve-out (owner ruling, 2026-08-10)

The file contains two hardcoded GLB paths and nothing else id-related:

```ts
useGLTF.preload("/parts/gpu/gpu.rtx4070/model.glb");
useGLTF.preload("/parts/gpu/gpu.rtx4080/model.glb");
```

Both paths stop existing once slots 6 and 7 are renamed. §6 names `src/App.tsx`,
`src/ui/**`, and `src/styles/**` as read-only and does not list `src/viewport/**`,
but §6's heading is "No display-layer change" and this is display code — the text
alone does not settle it. **The owner ruled:**

> A **mechanical path re-point** is allowed, so the existing preload keeps
> resolving after the migration. This is not new display behaviour. Leaving the app
> preloading assets that no longer exist is itself a half-migration.

**Allowed:** replacing the two path strings with the new part paths.

**Not allowed in this phase**, and not to be smuggled in as cleanup:

- generalising the hardcoded two-GPU structure
- a catalog-driven or manifest-driven preload refactor
- any change to viewport behaviour
- any UI or display-logic change
- incidental edits to surrounding code

### Follow-up (not this phase)

`GpuModel.tsx` preloads a hardcoded list of exactly two GPUs. That is already the
wrong shape for a 3–6 GPU catalog: GPUs added in this phase get no preload, and the
list has to be hand-edited per part — the same "adding a part should be data, not a
code edit" problem **O8** solves for catalog loading. Recorded for the phase that
owns the display layer; explicitly **out of scope here**.
