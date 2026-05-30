export function LoadingScanner({
  active,
  title,
  sub,
}: {
  active: boolean;
  title: string;
  sub: string;
}) {
  return (
    <div className={`ldr ${active ? "on" : ""}`}>
      <div className="lring" />
      <div className="ltxt">{title}</div>
      <div className="lsub">{sub}</div>
    </div>
  );
}
