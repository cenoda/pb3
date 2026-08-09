import type { PartDefinitionV2 } from "../contract/partV2";

export interface PartPickerProps {
  label: string;
  testId: string;
  value: string;
  options: PartDefinitionV2[];
  onChange: (partId: string) => void;
}

/** One labelled part slot in the parts rail. */
export function PartPicker({
  label,
  testId,
  value,
  options,
  onChange,
}: PartPickerProps) {
  const selectId = `part-${testId}`;

  return (
    <div className="part-picker">
      <label className="part-picker-label" htmlFor={selectId}>
        {label}
      </label>
      <select
        id={selectId}
        className="part-picker-select"
        data-testid={testId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((part) => (
          <option key={part.id} value={part.id}>
            {part.displayName}
          </option>
        ))}
      </select>
    </div>
  );
}
