interface PartSelectorProps {
  label: string;
  value: string;
  options: Array<{ id: string; displayName: string }>;
  onChange: (id: string) => void;
  /** Stable hook for Playwright / headless E2E. */
  testId?: string;
}

export function PartSelector({
  label,
  value,
  options,
  onChange,
  testId,
}: PartSelectorProps) {
  return (
    <label style={{ display: "block", marginBottom: "0.75rem" }}>
      <span style={{ display: "block", marginBottom: "0.25rem", fontWeight: 600 }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{ width: "100%", padding: "0.5rem" }}
        data-testid={testId}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.displayName}
          </option>
        ))}
      </select>
    </label>
  );
}
