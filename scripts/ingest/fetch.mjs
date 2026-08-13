#!/usr/bin/env node
/** Bounded public GET used by `--live`. CI must not import this for pnpm test. */
export {
  FETCH_TIMEOUT_MS,
  INGEST_USER_AGENT,
  fetchCandidateBytes,
} from "../../src/ingest/fetchBounded.ts";
