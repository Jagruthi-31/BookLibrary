import { useCallback, useRef, useState } from "react";
import { idleUpload, type UploadState } from "@/types/book";
import { uploadBookPdf, buildPdfPath, type UploadHandle } from "@/services/storageService";

/**
 * Encapsulates the "select a PDF, watch it upload, allow cancel/retry" flow
 * used by both Add Book and Edit Book. Resolves to the Storage path once the
 * upload finishes so the caller can save it to the book row.
 */
export function useBookUpload(userId: string | undefined, bookId: string) {
  const [uploadState, setUploadState] = useState<UploadState>(idleUpload);
  const fileRef = useRef<File | null>(null);
  const handleRef = useRef<UploadHandle | null>(null);
  const [resolvedPath, setResolvedPath] = useState<string | null>(null);

  const runUpload = useCallback(
    (file: File) => {
      if (!userId) return;
      const path = buildPdfPath(userId, bookId, file.name);
      setUploadState({ status: "uploading", progress: 0, fileName: file.name, fileSize: file.size, error: null });
      setResolvedPath(null);

      const handle = uploadBookPdf(path, file, (percent) => {
        setUploadState((prev) => ({ ...prev, progress: percent }));
      });
      handleRef.current = handle;

      handle.promise
        .then(() => {
          setUploadState((prev) => ({ ...prev, status: "success", progress: 100 }));
          setResolvedPath(path);
        })
        .catch((err: Error) => {
          setUploadState((prev) => ({
            ...prev,
            status: "error",
            error: err.message || "The PDF could not be uploaded.",
          }));
        });
    },
    [userId, bookId]
  );

  const selectFile = useCallback(
    (file: File) => {
      fileRef.current = file;
      runUpload(file);
    },
    [runUpload]
  );

  const cancelUpload = useCallback(() => {
    handleRef.current?.cancel();
    setUploadState(idleUpload);
    setResolvedPath(null);
  }, []);

  const retryUpload = useCallback(() => {
    if (fileRef.current) runUpload(fileRef.current);
  }, [runUpload]);

  const reset = useCallback(() => {
    fileRef.current = null;
    handleRef.current = null;
    setUploadState(idleUpload);
    setResolvedPath(null);
  }, []);

  return {
    uploadState,
    selectFile,
    cancelUpload,
    retryUpload,
    reset,
    resolvedPath,
    selectedFile: fileRef.current,
  };
}
