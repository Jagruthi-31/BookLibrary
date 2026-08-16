import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "error";

export interface ToastItem {
  id: number;
  message: string;
  title?: string;
  variant: ToastVariant;
}

const ICONS: Record<ToastVariant, typeof Info> = {
  default: Info,
  success: CheckCircle2,
  error: AlertTriangle,
};

const ICON_COLORS: Record<ToastVariant, string> = {
  default: "text-accent",
  success: "text-success",
  error: "text-danger",
};

export function ToastViewport({
  items,
  onDismiss,
}: {
  items: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6"
      role="region"
      aria-label="Notifications"
    >
      {items.map((item) => {
        const Icon = ICONS[item.variant];
        return (
          <div
            key={item.id}
            role="status"
            aria-live="polite"
            className="animate-slide-up flex items-start gap-3 rounded-card border border-border bg-card p-3.5 shadow-floating"
          >
            <Icon className={cn("mt-0.5 h-4.5 w-4.5 shrink-0", ICON_COLORS[item.variant])} size={18} />
            <div className="min-w-0 flex-1">
              {item.title && <p className="text-sm font-medium text-ink">{item.title}</p>}
              <p className="text-sm text-ink-muted">{item.message}</p>
            </div>
            <button
              onClick={() => onDismiss(item.id)}
              aria-label="Dismiss notification"
              className="focus-ring shrink-0 rounded p-1 text-ink-faint hover:text-ink"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
