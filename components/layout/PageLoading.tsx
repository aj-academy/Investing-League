export function PageLoading({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="wrap z" style={{ paddingTop: 24 }}>
      <div className="ldr on">
        <div className="lring" />
        <div className="ltxt">{label}</div>
      </div>
    </div>
  );
}
