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
    <section data-testid="part-filter-controls">
      <div className="filters-compact">
        <label>
          <span style={{ display: "block", fontWeight: 600 }}>
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
            style={{ width: "100%" }}
          >
            <option value="all">All</option>
            <option value="ATX">ATX</option>
            <option value="Micro-ATX">Micro-ATX</option>
          </select>
        </label>
        <label>
          <span style={{ display: "block", fontWeight: 600 }}>
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
            style={{ width: "100%" }}
          >
            <option value="all">All</option>
            <option value="16">16 GB</option>
            <option value="32">32 GB</option>
          </select>
        </label>
        <label>
          <span style={{ display: "block", fontWeight: 600 }}>
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
            style={{ width: "100%" }}
          >
            <option value="all">All</option>
            <option value="550">≥ 550 W</option>
            <option value="750">≥ 750 W</option>
          </select>
        </label>
        <div className="filters-actions">
          <button
            type="button"
            data-testid="filter-reset"
            onClick={() => onChange(DEFAULT_PART_FILTERS)}
          >
            Reset filters
          </button>
        </div>
      </div>
    </section>
  );
}
