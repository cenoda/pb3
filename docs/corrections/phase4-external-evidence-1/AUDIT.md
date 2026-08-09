# Audit — invalid Phase 4 first-party claim

Date: **2026-08-09**

## Finding

`benchmarks/prov4/raw/pilot-1080p-capture.json` was a 1,362-byte derived JSON
summary introduced in the same implementation commit as the evidence record.
It was not frame-level PresentMon output and could not independently establish
that the stated runs occurred. A matching SHA-256 established file integrity,
not measurement authenticity.

The repository therefore had no defensible basis for:

- `metricKind: "first-party-measured"`;
- the claimed average, 1% low, and frametime values;
- the `src.first-party.lab-cp2077-pilot` registry source;
- the PresentMon capture-condition and raw-artifact claims.

## Immediate safety correction

The candidate correction removes all four claims above and deletes the derived
raw-summary file. The required three-row pilot shape remains for software
continuity, but every performance row is now explicitly
`metricKind: "synthetic-stub"`, `confidence: "stub"`, with unavailable charter
metrics. This intentionally causes the old O1-A completion claim to fail.

## Remaining gap

Phase 4 Step 9 remains open. The owner accepted the sibling corrective plan
and authorized Cursor implementation on 2026-08-09; implementation and
re-audit remain pending.
