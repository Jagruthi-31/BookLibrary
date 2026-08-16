import { useRef, type MutableRefObject } from "react";
import { Loader2, AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PdfViewportProps {
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  isDocLoading: boolean;
  isPageRendering: boolean;
  error: string | null;
  onRetry: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

const SWIPE_THRESHOLD = 60;

export function PdfViewport({
  canvasRef,
  containerRef,
  isDocLoading,
  isPageRendering,
  error,
  onRetry,
  onSwipeLeft,
  onSwipeRight,
}: PdfViewportProps) {
  const touchStartX = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX > 0) onSwipeRight();
      else onSwipeLeft();
    }
    touchStartX.current = null;
  };

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <AlertTriangle size={28} className="text-danger" />
        <p className="font-medium text-ink">{error}</p>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RotateCcw size={13} /> Try again
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="relative flex flex-1 items-start justify-center overflow-auto bg-paper-soft px-4 py-6"
    >
      {isDocLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink-faint">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading your book…</p>
        </div>
      )}
      <div className="relative">
        <canvas ref={canvasRef} className="rounded-sm bg-white shadow-floating" />
        {isPageRendering && !isDocLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/40">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
          </div>
        )}
      </div>
    </div>
  );
}
