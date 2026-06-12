export function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mkt-section-head">
      <h2>{title}</h2>
      <div className="mkt-divider" aria-hidden="true" />
      {subtitle && <p className="mkt-section-sub">{subtitle}</p>}
    </div>
  );
}
