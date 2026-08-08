import type { PartFilters } from "./partFilters";
import { DEFAULT_PART_FILTERS } from "./partFilters";

interface PartFilterControlsProps {
  filters: PartFilters;
  onChange: (filters: PartFilters) => void;
}

export function PartFilterControls({
  filters,
  onChange,
}: PartFilterControlsProps) {
  return (
    <section
      data-testid="part-filter-controls"
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        padding: "0.75rem",
        marginBottom: "1rem",
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Filters</h2>
      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        <span style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>
          Motherboard form factor
        </span>
        <select
          data-testid="filter-motherboard-form-factor"
          value={filters.motherboardFormFactor}
          onChange={(event) =>
            onChange({
              ...filters,
              motherboardFormFactor: event.target
                .value as PartFilters["motherboardFormFactor"],
            })
          }
          style={{ width: "100%", padding: "0.5rem" }}
        >
          <option value="all">All</option>
          <option value="ATX">ATX</option>
          <option value="Micro-ATX">Micro-ATX</option>
        </select>
      </label>
      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        <span style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>
          RAM capacity (GB)
        </span>
        <select
          data-testid="filter-ram-capacity"
          value={filters.ramCapacityGb}
          onChange={(event) =>
            onChange({
              ...filters,
              ramCapacityGb: event.target.value as PartFilters["ramCapacityGb"],
            })
          }
          style={{ width: "100%", padding: "0.5rem" }}
        >
          <option value="all">All</option>
          <option value="16">16 GB</option>
          <option value="32">32 GB</option>
        </select>
      </label>
      <label style={{ display: "block" }}>
        <span style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>
          PSU minimum wattage
        </span>
        <select
          data-testid="filter-psu-wattage"
          value={filters.psuWattageMin}
          onChange={(event) =>
            onChange({
              ...filters,
              psuWattageMin: event.target.value as PartFilters["psuWattageMin"],
            })
          }
          style={{ width: "100%", padding: "0.5rem" }}
        >
          <option value="all">All</option>
          <option value="550">≥ 550 W</option>
          <option value="750">≥ 750 W</option>
        </select>
      </label>
      <button
        type="button"
        data-testid="filter-reset"
        onClick={() => onChange(DEFAULT_PART_FILTERS)}
        style={{ marginTop: "0.75rem", padding: "0.4rem 0.75rem" }}
      >
        Reset filters
      </button>
    </section>
  );
}
