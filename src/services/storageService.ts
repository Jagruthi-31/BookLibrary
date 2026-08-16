import { supabase, BOOKS_BUCKET, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/supabase";

export interface UploadHandle {
  promise: Promise<void>;
  cancel: () => void;
}

/**
 * Builds the canonical Storage path for a book's PDF.
 * Keeping this in one place is what makes ownership checks in RLS
 * ({user_id} as the first path segment) reliable.
 */
export function buildPdfPath(userId: string, bookId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "book.pdf";
  return `${userId}/${bookId}/${safeName}`;
}

/**
 * Uploads a PDF straight to the Supabase Storage REST endpoint via XHR so we
 * get real upload progress and the ability to cancel — capabilities the
 * supabase-js storage client does not expose directly.
 */
export function uploadBookPdf(
  path: string,
  file: File,
  onProgress: (percent: number) => void
): UploadHandle {
  const xhr = new XMLHttpRequest();

  const promise = new Promise<void>((resolve, reject) => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        reject(new Error("Your session expired. Sign in again and retry the upload."));
        return;
      }

      const url = `${SUPABASE_URL}/storage/v1/object/${BOOKS_BUCKET}/${encodeURIComponent(path)
        .replace(/%2F/g, "/")}`;

      xhr.open("POST", url, true);
      xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
      xhr.setRequestHeader("apikey", SUPABASE_PUBLISHABLE_KEY);
      xhr.setRequestHeader("Content-Type", file.type || "application/pdf");
      xhr.setRequestHeader("x-upsert", "true");
      xhr.setRequestHeader("Cache-Control", "3600");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(100);
          resolve();
        } else {
          let message = "The upload failed. Please try again.";
          try {
            const parsed = JSON.parse(xhr.responseText);
            if (parsed?.message) message = parsed.message;
          } catch {
            // ignore malformed error body
          }
          reject(new Error(message));
        }
      };

      xhr.onerror = () => reject(new Error("Upload failed — check your connection and try again."));
      xhr.onabort = () => reject(new Error("Upload cancelled."));

      xhr.send(file);
    })().catch(reject);
  });

  return {
    promise,
    cancel: () => xhr.abort(),
  };
}

/** Deletes a PDF from the books bucket. Safe to call even if it was already removed. */
export async function deleteBookPdf(path: string) {
  const { error } = await supabase.storage.from(BOOKS_BUCKET).remove([path]);
  if (error) throw error;
}

/**
 * Returns a short-lived, authorized URL to stream a private PDF. Generated
 * on demand — never stored — so the reader never needs a public bucket.
 */
export async function getSignedPdfUrl(path: string, expiresInSeconds = 60 * 30) {
  const { data, error } = await supabase.storage.from(BOOKS_BUCKET).createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function getDownloadUrl(path: string, fileName: string | null) {
  const { data, error } = await supabase.storage
    .from(BOOKS_BUCKET)
    .createSignedUrl(path, 60 * 5, { download: fileName ?? true });
  if (error) throw error;
  return data.signedUrl;
}
