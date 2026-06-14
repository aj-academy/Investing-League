export function DisclaimerBox({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "warning";
}) {
  return (
    <div
      className={
        variant === "warning" ? "mkt-warning-box" : "mkt-disclaimer-box"
      }
    >
      {children}
    </div>
  );
}
