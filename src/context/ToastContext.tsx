import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { ToastViewport, type ToastItem, type ToastVariant } from "@/components/common/Toast";

interface ToastContextValue {
  toast: (message: string, opts?: { title?: string; variant?: ToastVariant; durationMs?: number }) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);
let idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue["toast"]>((message, opts) => {
    const id = ++idCounter;
    const durationMs = opts?.durationMs ?? 4500;
    setItems((prev) => [...prev, { id, message, title: opts?.title, variant: opts?.variant ?? "default" }]);
    if (durationMs > 0) {
      setTimeout(() => dismiss(id), durationMs);
    }
  }, [dismiss]);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (message, title) => toast(message, { title, variant: "success" }),
      error: (message, title) => toast(message, { title: title ?? "Something went wrong", variant: "error" }),
    }),
    [toast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
