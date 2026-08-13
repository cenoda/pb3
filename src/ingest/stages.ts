import type { IngestStage } from "../contract/ing7";

export const FIRST_SLICE_TERMINAL_STAGES: IngestStage[] = [
  "fetch-failed",
  "normalize-failed",
  "review-candidate",
  "rights-reviewed",
  "rights-rejected",
];

export const SHIPPED_STAGE: IngestStage = "shipped";

/** Dry-run must never reach shipped. */
export function assertNotShipped(stage: IngestStage): void {
  if (stage === SHIPPED_STAGE) {
    throw new Error("ing7 dry-run must not transition to shipped");
  }
}
