import { useEffect, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus, Maximize, Minimize, Scan, MoveHorizontal } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import type { FitMode } from "@/hooks/usePdfDocument";

interface ReaderToolbarProps {
  pageNumber: number;
  numPages: number;
  scale: number;
  fitMode: FitMode;
  isFullscreen: boolean;
  onPrev: () => void;
  onNext: () => void;
  onGoToPage: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
  onFitPage: () => void;
  onToggleFullscreen: () => void;
}

export function ReaderToolbar({
  pageNumber,
  numPages,
  scale,
  fitMode,
  isFullscreen,
  onPrev,
  onNext,
  onGoToPage,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onFitPage,
  onToggleFullscreen,
}: ReaderToolbarProps) {
  const [draft, setDraft] = useState(String(pageNumber));

  useEffect(() => {
    if (document.activeElement?.id !== "page-input") {
      setDraft(String(pageNumber));
    }
  }, [pageNumber]);

  const submitPage = (e: FormEvent) => {
    e.preventDefault();
    const num = parseInt(draft, 10);
    if (!Number.isNaN(num)) onGoToPage(num);
    else setDraft(String(pageNumber));
  };

  return (
    <div className="flex items-center justify-center gap-1 border-t border-border bg-card/95 px-3 py-2 backdrop-blur-sm sm:gap-2">
      <div className="flex items-center gap-0.5">
        <Tooltip label="Zoom out" side="top">
          <button onClick={onZoomOut} aria-label="Zoom out" className="focus-ring rounded-md p-2 text-ink-muted hover:bg-paper-soft hover:text-ink">
            <Minus size={15} />
          </button>
        </Tooltip>
        <span className="w-11 text-center font-mono text-xs text-ink-muted">{Math.round(scale * 100)}%</span>
        <Tooltip label="Zoom in" side="top">
          <button onClick={onZoomIn} aria-label="Zoom in" className="focus-ring rounded-md p-2 text-ink-muted hover:bg-paper-soft hover:text-ink">
            <Plus size={15} />
          </button>
        </Tooltip>
      </div>

      <div className="mx-1 h-5 w-px bg-border sm:mx-2" />

      <div className="hidden items-center gap-0.5 sm:flex">
        <Tooltip label="Fit to width" side="top">
          <button
            onClick={onFitWidth}
            aria-label="Fit to width"
            aria-pressed={fitMode === "width"}
            className={`focus-ring rounded-md p-2 hover:bg-paper-soft hover:text-ink ${fitMode === "width" ? "text-accent" : "text-ink-muted"}`}
          >
            <MoveHorizontal size={15} />
          </button>
        </Tooltip>
        <Tooltip label="Fit to page" side="top">
          <button
            onClick={onFitPage}
            aria-label="Fit to page"
            aria-pressed={fitMode === "page"}
            className={`focus-ring rounded-md p-2 hover:bg-paper-soft hover:text-ink ${fitMode === "page" ? "text-accent" : "text-ink-muted"}`}
          >
            <Scan size={15} />
          </button>
        </Tooltip>
      </div>

      <div className="mx-1 h-5 w-px bg-border sm:mx-2" />

      <div className="flex items-center gap-0.5">
        <Tooltip label="Previous page" side="top">
          <button
            onClick={onPrev}
            disabled={pageNumber <= 1}
            aria-label="Previous page"
            className="focus-ring rounded-md p-2 text-ink-muted hover:bg-paper-soft hover:text-ink disabled:opacity-30"
          >
            <ChevronLeft size={17} />
          </button>
        </Tooltip>

        <form onSubmit={submitPage} className="flex items-center gap-1 font-mono text-xs text-ink-muted">
          <input
            id="page-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={submitPage}
            inputMode="numeric"
            aria-label="Page number"
            className="focus-ring h-7 w-10 rounded-md border border-border bg-card text-center text-ink"
          />
          <span>/ {numPages || "—"}</span>
        </form>

        <Tooltip label="Next page" side="top">
          <button
            onClick={onNext}
            disabled={pageNumber >= numPages}
            aria-label="Next page"
            className="focus-ring rounded-md p-2 text-ink-muted hover:bg-paper-soft hover:text-ink disabled:opacity-30"
          >
            <ChevronRight size={17} />
          </button>
        </Tooltip>
      </div>

      <div className="mx-1 h-5 w-px bg-border sm:mx-2" />

      <Tooltip label={isFullscreen ? "Exit fullscreen" : "Fullscreen"} side="top">
        <button
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          className="focus-ring rounded-md p-2 text-ink-muted hover:bg-paper-soft hover:text-ink"
        >
          {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
        </button>
      </Tooltip>
    </div>
  );
}
