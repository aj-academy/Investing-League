"use client";

export function ExportButtons() {
  return (
    <div className="journal-actions">
      <a className="jbtn" href="/api/export/csv">
        ⬇ CSV
      </a>
      <a className="jbtn" href="/api/export/json">
        ⬇ JSON
      </a>
    </div>
  );
}
