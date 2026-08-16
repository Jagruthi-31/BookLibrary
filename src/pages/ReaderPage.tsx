import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, AlertTriangle } from "lucide-react";
import { ReaderTopBar } from "@/components/reader/ReaderTopBar";
import { ReaderToolbar } from "@/components/reader/ReaderToolbar";
import { PdfViewport } from "@/components/reader/PdfViewport";
import { ResumeReadingDialog } from "@/components/reader/ResumeReadingDialog";
import { Button } from "@/components/ui/Button";
import { usePdfDocument } from "@/hooks/usePdfDocument";
import * as booksService from "@/services/booksService";
import { getSignedPdfUrl, getDownloadUrl } from "@/services/storageService";
import { useToast } from "@/context/ToastContext";
import { debounce, toFriendlyError } from "@/lib/utils";
import type { Book } from "@/types/book";

export default function ReaderPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [book, setBook] = useState<Book | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingBook, setIsLoadingBook] = useState(true);
  const [resumeDecided, setResumeDecided] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchStatus, setSearchStatus] = useState<"idle" | "searching" | "found" | "not_found">("idle");

  const rootRef = useRef<HTMLDivElement>(null);
  const lastQuery = useRef("");
  const latestProgress = useRef<{ page: number; total: number } | null>(null);

  const loadBook = useCallback(async () => {
    if (!bookId) return;
    setIsLoadingBook(true);
    setLoadError(null);
    try {
      const b = await booksService.getBook(bookId);
      setBook(b);
      const url = await getSignedPdfUrl(b.pdf_path);
      setSignedUrl(url);
      booksService.touchLastOpened(bookId).catch(() => {});
    } catch (err) {
      setLoadError(toFriendlyError(err, "This book could not be opened. It may have been removed."));
    } finally {
      setIsLoadingBook(false);
    }
  }, [bookId]);

  useEffect(() => {
    loadBook();
  }, [loadBook]);

  useEffect(() => {
    if (book && book.current_page <= 1) setResumeDecided(true);
  }, [book]);

  const debouncedSave = useMemo(
    () =>
      debounce((page: number, total: number) => {
        if (!bookId) return;
        const progress = total ? Math.min(100, Math.round((page / total) * 10000) / 100) : 0;
        booksService
          .updateReadingProgress(bookId, { current_page: page, total_pages: total || undefined, reading_progress: progress })
          .catch(() => {});
      }, 1200),
    [bookId]
  );

  const handlePageChange = useCallback(
    (page: number, total: number) => {
      latestProgress.current = { page, total };
      if (resumeDecided) debouncedSave(page, total);
    },
    [debouncedSave, resumeDecided]
  );

  const pdf = usePdfDocument({ url: signedUrl, onPageChange: handlePageChange });

  // Flush the latest position on unmount so a quick visit still saves.
  useEffect(() => {
    return () => {
      if (!bookId || !latestProgress.current) return;
      const { page, total } = latestProgress.current;
      const progress = total ? Math.min(100, Math.round((page / total) * 10000) / 100) : 0;
      booksService
        .updateReadingProgress(bookId, { current_page: page, total_pages: total || undefined, reading_progress: progress })
        .catch(() => {});
    };
  }, [bookId]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      rootRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (e.key === "ArrowLeft") pdf.prevPage();
      else if (e.key === "ArrowRight") pdf.nextPage();
      else if (e.key === "+" || e.key === "=") pdf.zoomIn();
      else if (e.key === "-") pdf.zoomOut();
      else if (e.key.toLowerCase() === "f") toggleFullscreen();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pdf, toggleFullscreen]);

  const handleSearch = useCallback(
    async (query: string) => {
      lastQuery.current = query;
      setSearchStatus("searching");
      const page = await pdf.searchDocument(query, pdf.pageNumber);
      if (page) {
        pdf.goToPage(page);
        setSearchStatus("found");
      } else {
        setSearchStatus("not_found");
      }
    },
    [pdf]
  );

  const handleSearchNext = useCallback(async () => {
    if (!lastQuery.current) return;
    const page = await pdf.searchDocument(lastQuery.current, pdf.pageNumber);
    if (page) pdf.goToPage(page);
  }, [pdf]);

  const handleDownload = useCallback(async () => {
    if (!book) return;
    try {
      const url = await getDownloadUrl(book.pdf_path, book.pdf_file_name);
      const a = document.createElement("a");
      a.href = url;
      a.download = book.pdf_file_name ?? "book.pdf";
      a.click();
    } catch (err) {
      toast.error(toFriendlyError(err, "Couldn't start the download. Please try again."));
    }
  }, [book, toast]);

  const handleOpenInNewTab = useCallback(async () => {
    if (!book) return;
    try {
      const url = await getSignedPdfUrl(book.pdf_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(toFriendlyError(err, "Couldn't open the PDF in a new tab."));
    }
  }, [book, toast]);

  if (isLoadingBook) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-paper-soft">
        <Loader2 className="h-6 w-6 animate-spin text-ink-faint" />
      </div>
    );
  }

  if (loadError || !book) {
    return (
      <div className="flex h-dvh w-full flex-col items-center justify-center gap-3 bg-paper-soft p-8 text-center">
        <AlertTriangle size={28} className="text-danger" />
        <p className="max-w-sm font-medium text-ink">{loadError ?? "This book could not be found."}</p>
        <Button variant="secondary" onClick={() => navigate("/library")}>
          Back to Library
        </Button>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="flex h-dvh w-full flex-col bg-card">
      <ReaderTopBar
        title={book.title}
        onSearch={handleSearch}
        onSearchNext={handleSearchNext}
        searchStatus={searchStatus}
        onDownload={handleDownload}
        onOpenInNewTab={handleOpenInNewTab}
      />

      <PdfViewport
        canvasRef={pdf.canvasRef}
        containerRef={pdf.containerRef}
        isDocLoading={pdf.isDocLoading}
        isPageRendering={pdf.isPageRendering}
        error={pdf.error}
        onRetry={loadBook}
        onSwipeLeft={pdf.nextPage}
        onSwipeRight={pdf.prevPage}
      />

      <ReaderToolbar
        pageNumber={pdf.pageNumber}
        numPages={pdf.numPages}
        scale={pdf.scale}
        fitMode={pdf.fitMode}
        isFullscreen={isFullscreen}
        onPrev={pdf.prevPage}
        onNext={pdf.nextPage}
        onGoToPage={pdf.goToPage}
        onZoomIn={pdf.zoomIn}
        onZoomOut={pdf.zoomOut}
        onFitWidth={pdf.setFitWidth}
        onFitPage={pdf.setFitPageMode}
        onToggleFullscreen={toggleFullscreen}
      />

      <ResumeReadingDialog
        open={!resumeDecided && book.current_page > 1}
        page={book.current_page}
        totalPages={book.total_pages}
        onContinue={() => {
          pdf.goToPage(book.current_page);
          setResumeDecided(true);
        }}
        onStartOver={() => {
          pdf.goToPage(1);
          setResumeDecided(true);
        }}
      />
    </div>
  );
}
