export function SectionHeader({
  title,
  subtitle,
  align = "center",
}: {
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={`mkt-section-head${align === "left" ? " mkt-section-head--left" : ""}`}
    >
      <h2>{title}</h2>
      <div className="mkt-divider" aria-hidden="true" />
      {subtitle && <p className="mkt-section-sub">{subtitle}</p>}
    </div>
  );
}
