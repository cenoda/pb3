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
    <section className="panel mount-compact" data-testid="mount-controls">
      <h2 style={{ marginTop: 0, fontSize: "0.95rem" }}>Mount</h2>
      <p className="muted" style={{ marginTop: 0, marginBottom: "0.35rem" }}>
        Declared cooler orientations only.
      </p>
      <label style={{ display: "block", marginBottom: "0.35rem" }}>
        Cooler orientation
        <select
          data-testid="cooler-orientation-select"
          value={coolerOrientationId}
          onChange={(e) =>
            onCoolerOrientationChange(
              e.target.value as "normal" | "rotated-180",
            )
          }
          style={{ display: "block", marginTop: "0.2rem", width: "100%" }}
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
