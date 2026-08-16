import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  trackClassName,
  barClassName,
}: {
  value: number;
  className?: string;
  trackClassName?: string;
  barClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-paper-soft", trackClassName, className)}
    >
      <div
        className={cn("h-full rounded-full bg-accent transition-[width] duration-300 ease-out", barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-paper-soft px-2 py-0.5 text-xs font-medium text-ink-muted",
        className
      )}
    >
      {children}
    </span>
  );
}
