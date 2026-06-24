"use client";

function openNativeDatePicker(input: HTMLInputElement | null) {
  if (!input) return;
  try {
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
  } catch {
    /* ignore — fallback to focus */
  }
  input.focus();
}

export function DatePickerField({
  value,
  onChange,
  className = "date-picker-input",
  min,
  max,
  id,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  min?: string;
  max?: string;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <div className={`date-picker-wrap${disabled ? " date-picker-wrap-disabled" : ""}`}>
      <input
        id={id}
        type="date"
        className={className}
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Tab" || e.key === "Escape") return;
          e.preventDefault();
        }}
        onPaste={(e) => e.preventDefault()}
        onClick={(e) => openNativeDatePicker(e.currentTarget)}
        onFocus={(e) => openNativeDatePicker(e.currentTarget)}
      />
      <button
        type="button"
        className="date-picker-btn"
        tabIndex={-1}
        disabled={disabled}
        aria-label="Open calendar"
        onClick={(e) => {
          const input = e.currentTarget.parentElement?.querySelector(
            "input[type=date]",
          ) as HTMLInputElement | null;
          openNativeDatePicker(input);
        }}
      />
    </div>
  );
}
