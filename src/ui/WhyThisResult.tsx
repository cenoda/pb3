import type { BuildPriceSummary, CompatibilityReport } from "../contract/compat2";
import type {
  CoolingHookResult,
  PhysicalValidationReport,
} from "../contract/phys3";
import type {
  CorrectionInput,
  WorkloadEstimateResult,
  WorkloadId,
  WorkloadMetric,
} from "../contract/perf1";
import type { PilotDisclosureReport } from "../contract/prov4";
import type { Est1Fixtures } from "../estimate/loadEst1Fixtures";
import type { Prov4Fixtures } from "../provenance/loadProv4Fixtures";
import { EvidenceDetails } from "./EvidenceDetails";

const COMPAT_LABELS: Record<
  CompatibilityReport["checks"][number]["checkId"],
  string
> = {
  "cpu-socket": "CPU socket ↔ motherboard socket",
  "chipset-bios": "Chipset / BIOS support",
  "ram-support": "RAM type & speed",
  "psu-wattage": "PSU wattage",
  "case-form-factor": "Case form factor",
};

export interface WhyThisResultProps {
  compatibility: CompatibilityReport;
  physical: PhysicalValidationReport;
  cooling: CoolingHookResult;
  /** Null when the verdict blocks results (spec R1); never shown as a total. */
  price: BuildPriceSummary | null;
  disclosure: PilotDisclosureReport;
  prov4Fixtures: Prov4Fixtures;
  est1Fixtures: Est1Fixtures;
  workloads: Array<{
    workloadId: WorkloadId;
    metric: WorkloadMetric;
    result: WorkloadEstimateResult;
  }>;
  coolerOrientationId: "normal" | "rotated-180";
  onCoolerOrientationChange: (id: "normal" | "rotated-180") => void;
  onResetMounts: () => void;
  correction: CorrectionInput;
  onCorrectionChange: (correction: CorrectionInput) => void;
  onResetCorrection: () => void;
}

/**
 * The single disclosure on the product surface (spec §2). Everything technical
 * lives here: engine checks, price line items, evidence in full, and the engine
 * controls that are not product controls.
 */
export function WhyThisResult(props: WhyThisResultProps) {
  const {
    compatibility,
    physical,
    cooling,
    price,
    disclosure,
    prov4Fixtures,
    est1Fixtures,
    workloads,
    coolerOrientationId,
    onCoolerOrientationChange,
    onResetMounts,
    correction,
    onCorrectionChange,
    onResetCorrection,
  } = props;

  return (
    <details className="why" data-testid="why-this-result">
      <summary className="why-summary">Why this result?</summary>

      <div className="why-body">
        <div
          className="why-section"
          data-testid="compatibility-panel"
          data-overall-status={compatibility.overallStatus}
        >
          <h3 className="why-heading">Compatibility checks</h3>
          <p className="why-note" data-testid="compatibility-overall">
            Overall: <strong>{compatibility.overallStatus}</strong> · data{" "}
            {compatibility.dataVersion}
          </p>
          <ul className="why-list">
            {compatibility.checks.map((check) => (
              <li
                key={check.checkId}
                data-testid={`compat-check-${check.checkId}`}
                data-status={check.status}
              >
                <strong>{COMPAT_LABELS[check.checkId]}</strong>: {check.status}
                {check.explanation ? (
                  <div
                    className="why-note"
                    data-testid={`compat-explanation-${check.checkId}`}
                  >
                    {check.explanation}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        <div
          className="why-section"
          data-testid="physical-validation-panel"
          data-overall-status={physical.overallStatus}
          data-geometry-version={physical.geometryDataVersion}
        >
          <h3 className="why-heading">Physical fit</h3>
          <p className="why-note" data-testid="physical-overall">
            Overall: <strong>{physical.overallStatus}</strong> · geometry{" "}
            {physical.geometryDataVersion} · model grade: Experimental
            (synthetic fixture; not manufacturer-verified)
          </p>
          <ul className="why-list">
            {physical.checks.map((check) => (
              <li
                key={check.checkId}
                data-testid={`physical-check-${check.checkId}`}
                data-status={check.status}
                data-kind={check.kind}
              >
                <strong>{check.kind} check</strong>: {check.status}
                <div className="why-note">id: {check.checkId}</div>
                {check.explanation ? (
                  <div
                    className="why-note"
                    data-testid={`physical-explanation-${check.checkId}`}
                  >
                    {check.explanation}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        <div
          className="why-section"
          data-testid="cooling-evidence-panel"
          data-status={cooling.status}
          data-mode="physical"
        >
          <h3 className="why-heading">Cooling</h3>
          {cooling.status === "unavailable" ? (
            <>
              <p className="why-note" data-testid="cooling-status">
                Status: <strong>unavailable</strong>
              </p>
              <p className="why-note" data-testid="cooling-reason">
                {cooling.reason}
              </p>
              <p className="why-note" data-testid="cooling-explanation">
                {cooling.explanation}
              </p>
              <p className="why-note">
                Performance baseline remains; correction withheld (no invented
                derate).
              </p>
            </>
          ) : (
            <>
              <p className="why-note" data-testid="cooling-status">
                Status: <strong>available</strong>
              </p>
              <p className="why-note" data-testid="cooling-headroom">
                coolingHeadroom: {cooling.correctionInput.coolingHeadroom}
              </p>
              <p className="why-note" data-testid="cooling-intake">
                intakeRestrictionSeverity:{" "}
                {cooling.correctionInput.intakeRestrictionSeverity}
              </p>
              <p className="why-note" data-testid="cooling-evidence-id">
                evidenceSourceId: {cooling.correctionInput.evidenceSourceId}
              </p>
              <p className="why-note" data-testid="cooling-bucket">
                coolingBucketId:{" "}
                {cooling.correctionInput.coolingBucketId ?? "(not mapped)"}
              </p>
            </>
          )}
        </div>

        {price === null ? (
          <div className="why-section" data-testid="price-summary-panel">
            <h3 className="why-heading">Price line items</h3>
            <p className="why-note">
              Not shown: this build cannot be assembled, so it has no price.
            </p>
          </div>
        ) : (
        <div
          className="why-section"
          data-testid="price-summary-panel"
          data-is-partial={price.isPartial ? "true" : "false"}
        >
          <h3 className="why-heading">Price line items</h3>
          <p className="why-note" data-testid="price-subtotal">
            Subtotal: {price.currency} {price.subtotalAmount} · fixture prices,
            not live market quotes
            {price.isPartial ? (
              <span data-testid="price-partial-label">
                {" "}
                (partial total — some parts lack fixture prices)
              </span>
            ) : null}
          </p>
          <ul className="why-sublist">
            {price.lines.map((line) => (
              <li key={line.partId} data-testid={`price-line-${line.partId}`}>
                {line.partId}:{" "}
                {line.status === "ok" && line.amount != null ? (
                  <span>
                    {line.currency} {line.amount}
                  </span>
                ) : (
                  <span data-testid={`price-unavailable-${line.partId}`}>
                    unavailable ({line.reason ?? "missing price"})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
        )}

        <EvidenceDetails
          report={disclosure}
          est1Fixtures={est1Fixtures}
          prov4Fixtures={prov4Fixtures}
        />

        <div className="why-section" data-testid="cinebench-panel">
          <h3 className="why-heading">CPU workloads (Cinebench)</h3>
          <ul className="why-list">
            {workloads.map(({ workloadId, metric, result }) => {
              const key = `${workloadId}-${metric}`;
              return (
                <li
                  key={key}
                  data-testid={`cinebench-row-${key}`}
                  data-status={"status" in result ? result.status : "ok"}
                >
                  <strong>
                    {workloadId} · {metric}
                  </strong>
                  {"score" in result ? (
                    <div data-testid={`cinebench-score-${key}`}>
                      {result.score} pts (confidence: {result.confidence})
                    </div>
                  ) : (
                    <div data-testid={`cinebench-unavailable-${key}`}>
                      {result.reason}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="why-section" data-testid="engine-controls">
          <h3 className="why-heading">Engine controls</h3>
          <p className="why-note">
            Diagnostic inputs, not product settings. Changing them changes what
            the engines are asked, not what the parts are.
          </p>

          <div className="why-controls" data-testid="mount-controls">
            <label className="why-control">
              Cooler orientation (declared only)
              <select
                data-testid="cooler-orientation-select"
                value={coolerOrientationId}
                onChange={(event) =>
                  onCoolerOrientationChange(
                    event.target.value as "normal" | "rotated-180",
                  )
                }
              >
                <option value="normal">normal</option>
                <option value="rotated-180">rotated-180</option>
              </select>
            </label>
            <button
              type="button"
              className="action-button"
              data-testid="mount-reset"
              onClick={onResetMounts}
            >
              Reset to auto
            </button>
          </div>

          <div className="why-controls" data-testid="correction-controls">
            <label className="why-control">
              CPU power
              <select
                data-testid="cpu-power-select"
                value={correction.cpuPowerId ?? ""}
                onChange={(event) =>
                  onCorrectionChange({
                    ...correction,
                    cpuPowerId: emptyToUndefined(event.target.value) as
                      | CorrectionInput["cpuPowerId"]
                      | undefined,
                  })
                }
              >
                <option value="">(unset)</option>
                <option value="cpu-power.default">cpu-power.default</option>
                <option value="cpu-power.reduced">cpu-power.reduced</option>
              </select>
            </label>

            <label className="why-control">
              GPU power
              <select
                data-testid="gpu-power-select"
                value={correction.gpuPowerId ?? ""}
                onChange={(event) =>
                  onCorrectionChange({
                    ...correction,
                    gpuPowerId: emptyToUndefined(event.target.value) as
                      | CorrectionInput["gpuPowerId"]
                      | undefined,
                  })
                }
              >
                <option value="">(unset)</option>
                <option value="gpu-power.default">gpu-power.default</option>
                <option value="gpu-power.reduced">gpu-power.reduced</option>
              </select>
            </label>

            <label className="why-control">
              Cooling bucket
              <select
                data-testid="cooling-select"
                value={correction.coolingBucketId ?? ""}
                onChange={(event) =>
                  onCorrectionChange({
                    ...correction,
                    coolingBucketId: emptyToUndefined(event.target.value) as
                      | CorrectionInput["coolingBucketId"]
                      | undefined,
                  })
                }
              >
                <option value="">(unset)</option>
                <option value="cooling.sufficient">cooling.sufficient</option>
                <option value="cooling.marginal">cooling.marginal</option>
                <option value="cooling.insufficient">
                  cooling.insufficient
                </option>
              </select>
            </label>

            <label className="why-control">
              Load profile
              <select
                data-testid="load-profile-select"
                value={correction.loadProfileId ?? ""}
                onChange={(event) =>
                  onCorrectionChange({
                    ...correction,
                    loadProfileId: emptyToUndefined(event.target.value) as
                      | CorrectionInput["loadProfileId"]
                      | undefined,
                  })
                }
              >
                <option value="">(unset)</option>
                <option value="load.transient">load.transient</option>
                <option value="load.sustained">load.sustained</option>
              </select>
            </label>

            <label className="why-control">
              Evidence source id
              <input
                data-testid="evidence-source-input"
                value={correction.evidenceSourceId ?? ""}
                onChange={(event) =>
                  onCorrectionChange({
                    ...correction,
                    evidenceSourceId: emptyToUndefined(event.target.value),
                  })
                }
              />
            </label>

            <button
              type="button"
              className="action-button"
              data-testid="reset-correction"
              onClick={onResetCorrection}
            >
              Reset correction
            </button>
          </div>
        </div>
      </div>
    </details>
  );
}

function emptyToUndefined(value: string): string | undefined {
  return value === "" ? undefined : value;
}
