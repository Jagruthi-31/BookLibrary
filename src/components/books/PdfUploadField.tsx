import { useRef, useState, type DragEvent } from "react";
import { FileText, UploadCloud, X, CheckCircle2, AlertTriangle, RotateCcw } from "lucide-react";
import { formatBytes, validatePdfFile, cn } from "@/lib/utils";
import type { UploadState } from "@/types/book";

interface PdfUploadFieldProps {
  uploadState: UploadState;
  onSelectFile: (file: File) => void;
  onCancel: () => void;
  onRetry: () => void;
  existingFileName?: string | null;
  existingFileSize?: number | null;
  required?: boolean;
}

export function PdfUploadField({
  uploadState,
  onSelectFile,
  onCancel,
  onRetry,
  existingFileName,
  existingFileSize,
  required,
}: PdfUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const validationError = validatePdfFile(file);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    setLocalError(null);
    onSelectFile(file);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const idle = uploadState.status === "idle";
  const showExisting = idle && existingFileName && !localError;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {idle && !showExisting && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          className={cn(
            "focus-ring flex cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed px-6 py-10 text-center transition-colors",
            isDragging ? "border-accent bg-accent-soft" : "border-border hover:bg-paper-soft"
          )}
        >
          <UploadCloud size={26} className="text-ink-faint" />
          <p className="text-sm font-medium text-ink">Choose a PDF or drag it here</p>
          <p className="text-xs text-ink-faint">
            PDF only, up to 300 MB{required && " · required"}
          </p>
        </div>
      )}

      {showExisting && (
        <div
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          className="focus-ring flex cursor-pointer items-center gap-3 rounded-card border border-border bg-paper-soft px-4 py-3 hover:bg-border/30"
        >
          <FileText size={18} className="shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{existingFileName}</p>
            <p className="text-xs text-ink-faint">{formatBytes(existingFileSize)} · Uploaded to cloud ✓</p>
          </div>
          <span className="shrink-0 text-xs font-medium text-accent">Replace</span>
        </div>
      )}

      {uploadState.status === "uploading" && (
        <div className="rounded-card border border-border bg-paper-soft px-4 py-3.5">
          <div className="flex items-center gap-3">
            <FileText size={18} className="shrink-0 text-accent" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{uploadState.fileName}</p>
              <p className="text-xs text-ink-faint">{formatBytes(uploadState.fileSize)}</p>
            </div>
            <button
              onClick={onCancel}
              aria-label="Cancel upload"
              className="focus-ring shrink-0 rounded p-1 text-ink-faint hover:text-danger"
            >
              <X size={16} />
            </button>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-200"
              style={{ width: `${uploadState.progress}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <p className="text-xs text-ink-muted">Uploading… {uploadState.progress}%</p>
            <p className="text-xs text-ink-faint">Please don't close this window.</p>
          </div>
        </div>
      )}

      {uploadState.status === "success" && (
        <div className="flex items-center gap-3 rounded-card border border-success/30 bg-success/10 px-4 py-3">
          <CheckCircle2 size={18} className="shrink-0 text-success" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{uploadState.fileName}</p>
            <p className="text-xs text-ink-muted">{formatBytes(uploadState.fileSize)} · Uploaded to cloud ✓</p>
          </div>
          <button onClick={() => inputRef.current?.click()} className="focus-ring shrink-0 text-xs font-medium text-accent hover:underline">
            Replace
          </button>
        </div>
      )}

      {uploadState.status === "error" && (
        <div className="rounded-card border border-danger/30 bg-danger-soft px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">Upload failed</p>
              <p className="text-xs text-ink-muted">{uploadState.error || "The PDF could not be uploaded."}</p>
            </div>
            <button
              onClick={onRetry}
              className="focus-ring flex shrink-0 items-center gap-1 rounded-card border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-paper-soft"
            >
              <RotateCcw size={12} /> Retry
            </button>
          </div>
        </div>
      )}

      {localError && <p className="mt-2 text-xs text-danger">{localError}</p>}
    </div>
  );
}
