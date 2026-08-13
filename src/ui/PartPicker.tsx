import type { ImageSourceRegistryEntry } from "../contract/cat6";
import type { PartDefinitionV2 } from "../contract/partV2";
import { ImageAttribution } from "./ImageAttribution";

export interface PartPickerProps {
  label: string;
  testId: string;
  value: string;
  options: PartDefinitionV2[];
  onChange: (partId: string) => void;
  imageSources?: ReadonlyMap<string, ImageSourceRegistryEntry>;
  showGrid?: boolean;
  showSelect?: boolean;
}

export function keySpecLines(part: PartDefinitionV2): string[] {
  const spec = part.compatSpec;
  switch (part.category) {
    case "cpu":
      if (spec && "socket" in spec && "tdpWatts" in spec) {
        return [spec.socket, `${spec.tdpWatts} W TDP`];
      }
      return [];
    case "gpu": {
      const lines: string[] = [];
      if (spec && "tdpWatts" in spec) {
        lines.push(`${spec.tdpWatts} W TGP`);
      }
      if (part.dimensionsMm?.lengthMm !== undefined) {
        lines.push(`${part.dimensionsMm.lengthMm} mm`);
      }
      return lines.slice(0, 2);
    }
    case "motherboard":
      if (spec && "socket" in spec && "formFactor" in spec) {
        return [spec.socket, spec.formFactor];
      }
      return [];
    case "ram":
      if (spec && "capacityGb" in spec && "speedMtS" in spec) {
        return [`${spec.capacityGb} GB`, `${spec.speedMtS} MT/s`];
      }
      return [];
    case "psu":
      if (spec && "wattage" in spec) {
        return [`${spec.wattage} W`];
      }
      return [];
    case "case":
      if (spec && "supportedFormFactors" in spec) {
        return [spec.supportedFormFactors.join(", ")];
      }
      return [];
    case "cooler":
      if (part.dimensionsMm?.heightMm !== undefined) {
        return [`${part.dimensionsMm.heightMm} mm height`];
      }
      return [];
    default:
      return [];
  }
}

/** One labelled part slot: grid of cards, native select kept for E2E/a11y. */
export function PartPicker({
  label,
  testId,
  value,
  options,
  onChange,
  imageSources,
  showGrid = true,
  showSelect = true,
}: PartPickerProps) {
  const selectId = `part-${testId}`;
  const gridId = `${testId}-grid`;

  return (
    <div className="part-picker">
      <label className="part-picker-label" htmlFor={selectId}>
        {label}
      </label>
      {showSelect ? <select
        id={selectId}
        className={showGrid ? "part-picker-select visually-hidden" : "part-picker-select"}
        data-testid={testId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((part) => (
          <option key={part.id} value={part.id}>
            {part.displayName}
          </option>
        ))}
      </select> : null}
      {showGrid ? <div
        className="part-picker-grid"
        data-testid={gridId}
        role="listbox"
        aria-label={label}
      >
        {options.map((part) => {
          const selected = part.id === value;
          const source = part.image
            ? imageSources?.get(part.image.sourceId)
            : undefined;
          const specs = keySpecLines(part);
          return (
            <div
              key={part.id}
              role="option"
              aria-selected={selected}
              tabIndex={0}
              className={
                selected ? "part-card part-card-selected" : "part-card"
              }
              data-part-id={part.id}
              onClick={() => onChange(part.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onChange(part.id);
                }
              }}
            >
              {part.image ? (
                <img
                  className="part-card-image"
                  src={`/${part.image.path}`}
                  alt=""
                />
              ) : (
                <div className="part-card-placeholder">
                  image not yet available
                </div>
              )}
              <span className="part-card-name">{part.displayName}</span>
              {specs.length > 0 ? (
                <span className="part-card-specs">{specs.join(" · ")}</span>
              ) : null}
              {part.image?.rightsClass === "cc-attribution" && source ? (
                <ImageAttribution source={source} />
              ) : null}
            </div>
          );
        })}
      </div> : null}
    </div>
  );
}
