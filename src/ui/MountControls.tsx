interface MountControlsProps {
  coolerOrientationId: "normal" | "rotated-180";
  onCoolerOrientationChange: (id: "normal" | "rotated-180") => void;
  onReset: () => void;
}

export function MountControls({
  coolerOrientationId,
  onCoolerOrientationChange,
  onReset,
}: MountControlsProps) {
  return (
    <section
      data-testid="mount-controls"
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        padding: "0.75rem",
        marginBottom: "1rem",
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Mount controls</h2>
      <p style={{ marginTop: 0, fontSize: "0.9rem", color: "#4b5563" }}>
        Declared cooler orientations only (no free transform).
      </p>
      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        Cooler orientation
        <select
          data-testid="cooler-orientation-select"
          value={coolerOrientationId}
          onChange={(e) =>
            onCoolerOrientationChange(
              e.target.value as "normal" | "rotated-180",
            )
          }
          style={{ display: "block", marginTop: "0.25rem", width: "100%" }}
        >
          <option value="normal">normal</option>
          <option value="rotated-180">rotated-180</option>
        </select>
      </label>
      <button type="button" data-testid="mount-reset" onClick={onReset}>
        Reset to auto
      </button>
    </section>
  );
}
