"use client";

import { DatePickerField } from "@/components/ui/DatePickerField";
import {
  DEFAULT_JOURNAL_FILTERS,
  JOURNAL_PERMISSION_OPTIONS,
  JOURNAL_RESULT_OPTIONS,
  todayDateInputValue,
  type JournalFilterState,
} from "@/lib/journal/journalFilters";

export function JournalFilters({
  filters,
  onChange,
  pairs,
  totalCount,
  filteredCount,
}: {
  filters: JournalFilterState;
  onChange: (next: JournalFilterState) => void;
  pairs: string[];
  totalCount: number;
  filteredCount: number;
}) {
  const set = (patch: Partial<JournalFilterState>) => onChange({ ...filters, ...patch });

  const isDefault =
    filters.from === DEFAULT_JOURNAL_FILTERS.from &&
    filters.to === DEFAULT_JOURNAL_FILTERS.to &&
    filters.pair === DEFAULT_JOURNAL_FILTERS.pair &&
    filters.permission === DEFAULT_JOURNAL_FILTERS.permission &&
    filters.result === DEFAULT_JOURNAL_FILTERS.result;

  return (
    <div className="journal-filters">
      <div className="journal-filters-main">
        <div className="f">
          <label>From date</label>
          <DatePickerField
            className="journal-filter-date"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(from) => set({ from })}
          />
        </div>
        <div className="f">
          <label>To date</label>
          <DatePickerField
            className="journal-filter-date"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(to) => set({ to })}
          />
        </div>
        <div className="f">
          <label>Permission</label>
          <select
            className="journal-filter-select"
            value={filters.permission}
            onChange={(e) =>
              set({ permission: e.target.value as JournalFilterState["permission"] })
            }
          >
            {JOURNAL_PERMISSION_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="f">
          <label>Asset / pair</label>
          <select
            className="journal-filter-select"
            value={filters.pair}
            onChange={(e) => set({ pair: e.target.value })}
          >
            <option value="">All pairs</option>
            {pairs.map((pair) => (
              <option key={pair} value={pair}>
                {pair}
              </option>
            ))}
          </select>
        </div>
        <div className="f">
          <label>Result</label>
          <select
            className="journal-filter-select"
            value={filters.result}
            onChange={(e) => set({ result: e.target.value })}
          >
            {JOURNAL_RESULT_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="journal-filters-quick">
        <span className="journal-filter-count">
          Showing <strong>{filteredCount}</strong> of {totalCount}
        </span>
        <button
          type="button"
          className="journal-filter-chip"
          onClick={() => set({ from: todayDateInputValue(), to: todayDateInputValue() })}
        >
          Today
        </button>
        <button
          type="button"
          className="journal-filter-chip"
          onClick={() =>
            set({ permission: "TRADE ALLOWED", result: "Pending", pair: "", from: "", to: "" })
          }
        >
          Trade allowed · pending
        </button>
        <button
          type="button"
          className="journal-filter-chip"
          onClick={() => set({ permission: "TRADE ALLOWED", result: "", pair: "", from: "", to: "" })}
        >
          Trade allowed
        </button>
        {!isDefault && (
          <button
            type="button"
            className="journal-filter-chip journal-filter-chip-muted"
            onClick={() => onChange({ ...DEFAULT_JOURNAL_FILTERS })}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
