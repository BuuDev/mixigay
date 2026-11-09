/** Pulsing broadcast dot. CSS-only; static for reduced-motion users. */
export function LiveDot({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`inline-block size-2 rounded-full bg-current motion-safe:animate-td-pulse ${className}`} />;
}
