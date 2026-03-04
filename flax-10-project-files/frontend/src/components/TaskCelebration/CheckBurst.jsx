/**
 * Stub check-burst animation. Restore full component from branch if needed.
 */
export function CheckBurst({ active, children }) {
  return <span className={active ? "check-burst-active" : ""}>{children}</span>;
}
