import { useCallback, useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
// Vite serves the worker as a static asset URL; this is the standard pattern for pdfjs-dist v4.
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { debounce } from "@/lib/utils";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export type FitMode = "width" | "page" | "custom";

interface UsePdfDocumentOptions {
  url: string | null;
  initialPage?: number;
  onPageChange?: (page: number, numPages: number) => void;
}

export function usePdfDocument({ url, initialPage = 1, onPageChange }: UsePdfDocumentOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const docRef = useRef<PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const pageCache = useRef<Map<number, PDFPageProxy>>(new Map());
  const textCache = useRef<Map<number, string>>(new Map());
  const hasAppliedInitialPage = useRef(false);

  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumberState] = useState(1);
  const [scale, setScale] = useState(1);
  const [fitMode, setFitMode] = useState<FitMode>("width");
  const [isDocLoading, setIsDocLoading] = useState(true);
  const [isPageRendering, setIsPageRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setIsDocLoading(true);
    setError(null);
    pageCache.current.clear();
    textCache.current.clear();
    hasAppliedInitialPage.current = false;

    const loadingTask = pdfjsLib.getDocument({ url });
    loadingTask.promise
      .then((doc) => {
        if (cancelled) return;
        docRef.current = doc;
        setNumPages(doc.numPages);
        if (!hasAppliedInitialPage.current) {
          setPageNumberState(Math.max(1, Math.min(doc.numPages, initialPage)));
          hasAppliedInitialPage.current = true;
        }
        setIsDocLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error("Failed to load PDF", err);
        setError("This PDF could not be opened. The file may be corrupted or unavailable.");
        setIsDocLoading(false);
      });

    return () => {
      cancelled = true;
      loadingTask.destroy?.();
      docRef.current?.destroy();
      docRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const getPage = useCallback(async (num: number) => {
    if (!docRef.current) return null;
    if (pageCache.current.has(num)) return pageCache.current.get(num)!;
    const page = await docRef.current.getPage(num);
    pageCache.current.set(num, page);
    return page;
  }, []);

  const computeFitScale = useCallback(
    async (num: number, mode: FitMode) => {
      const page = await getPage(num);
      const container = containerRef.current;
      if (!page || !container) return 1;
      const viewport = page.getViewport({ scale: 1 });
      const availableWidth = container.clientWidth - 32;
      const availableHeight = container.clientHeight - 32;
      if (mode === "page") return Math.min(availableWidth / viewport.width, availableHeight / viewport.height);
      return availableWidth / viewport.width;
    },
    [getPage]
  );

  const renderPage = useCallback(
    async (num: number, explicitScale?: number) => {
      const page = await getPage(num);
      const canvas = canvasRef.current;
      if (!page || !canvas) return;

      let useScale = explicitScale;
      if (useScale === undefined) {
        useScale = fitMode === "custom" ? scale : await computeFitScale(num, fitMode);
      }
      useScale = Math.max(0.25, Math.min(4, useScale));

      setIsPageRendering(true);
      const viewport = page.getViewport({ scale: useScale });
      const context = canvas.getContext("2d");
      if (!context) return;

      const outputScale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

      renderTaskRef.current?.cancel();
      const task = page.render({ canvasContext: context, viewport, transform });
      renderTaskRef.current = task;
      try {
        await task.promise;
        setScale(useScale);
      } catch (err: unknown) {
        const name = (err as { name?: string })?.name;
        if (name !== "RenderingCancelledException") {
          // eslint-disable-next-line no-console
          console.error("Failed to render PDF page", err);
        }
      } finally {
        setIsPageRendering(false);
      }
    },
    [getPage, scale, fitMode, computeFitScale]
  );

  useEffect(() => {
    if (isDocLoading || !docRef.current) return;
    renderPage(pageNumber);
    onPageChange?.(pageNumber, numPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, isDocLoading]);

  useEffect(() => {
    if (fitMode === "custom") return;
    const onResize = debounce(() => renderPage(pageNumber), 200);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitMode, pageNumber]);

  const goToPage = useCallback(
    (num: number) => {
      const clamped = Math.max(1, Math.min(numPages || 1, Math.round(num)));
      setPageNumberState(clamped);
    },
    [numPages]
  );

  const nextPage = useCallback(() => goToPage(pageNumber + 1), [goToPage, pageNumber]);
  const prevPage = useCallback(() => goToPage(pageNumber - 1), [goToPage, pageNumber]);

  const zoomIn = useCallback(() => {
    setFitMode("custom");
    const next = Math.min(4, Math.round((scale + 0.15) * 100) / 100);
    renderPage(pageNumber, next);
  }, [scale, pageNumber, renderPage]);

  const zoomOut = useCallback(() => {
    setFitMode("custom");
    const next = Math.max(0.25, Math.round((scale - 0.15) * 100) / 100);
    renderPage(pageNumber, next);
  }, [scale, pageNumber, renderPage]);

  const setFitWidth = useCallback(() => {
    setFitMode("width");
    renderPage(pageNumber);
  }, [pageNumber, renderPage]);

  const setFitPageMode = useCallback(() => {
    setFitMode("page");
    renderPage(pageNumber);
  }, [pageNumber, renderPage]);

  const getPageText = useCallback(
    async (num: number) => {
      if (textCache.current.has(num)) return textCache.current.get(num)!;
      const page = await getPage(num);
      if (!page) return "";
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .toLowerCase();
      textCache.current.set(num, text);
      return text;
    },
    [getPage]
  );

  /** Finds the next page (starting after `fromPage`) containing `query`, wrapping around the document. */
  const searchDocument = useCallback(
    async (query: string, fromPage = 1): Promise<number | null> => {
      const q = query.trim().toLowerCase();
      if (!q || !docRef.current || numPages === 0) return null;
      for (let i = 1; i <= numPages; i++) {
        const num = ((fromPage - 1 + i) % numPages) + 1;
        const text = await getPageText(num);
        if (text.includes(q)) return num;
      }
      return null;
    },
    [numPages, getPageText]
  );

  return {
    canvasRef,
    containerRef,
    numPages,
    pageNumber,
    scale,
    fitMode,
    isDocLoading,
    isPageRendering,
    error,
    goToPage,
    nextPage,
    prevPage,
    zoomIn,
    zoomOut,
    setFitWidth,
    setFitPageMode,
    searchDocument,
  };
}
