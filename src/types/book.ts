/**
 * Mirrors the `public.books` table. Kept close to the DB shape so services
 * can pass rows through with minimal mapping.
 */
export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  description: string | null;
  cover_url: string | null;
  rating: number; // 0–5, half-star increments allowed
  category: string | null;
  tags: string[];
  pdf_path: string; // Storage object path: {user_id}/{book_id}/book.pdf
  pdf_file_name: string | null;
  pdf_size: number | null; // bytes
  total_pages: number | null;
  current_page: number;
  reading_progress: number; // 0–100
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  last_opened_at: string | null;
}

/** Fields the Add/Edit form collects before a book row exists. */
export interface BookFormValues {
  title: string;
  author: string;
  description: string;
  cover_url: string;
  rating: number;
  category: string;
  tags: string[];
}

export const emptyBookForm: BookFormValues = {
  title: "",
  author: "",
  description: "",
  cover_url: "",
  rating: 0,
  category: "",
  tags: [],
};

export type ReadingStatus = "not_started" | "reading" | "finished";

export function getReadingStatus(book: Book): ReadingStatus {
  if (book.reading_progress >= 99.5) return "finished";
  if (book.reading_progress > 0 || book.current_page > 0) return "reading";
  return "not_started";
}

export type SortOption =
  | "recently_added"
  | "recently_read"
  | "title_asc"
  | "title_desc"
  | "rating_desc"
  | "rating_asc"
  | "progress_desc"
  | "progress_asc";

export const SORT_LABELS: Record<SortOption, string> = {
  recently_added: "Recently Added",
  recently_read: "Recently Read",
  title_asc: "Title A → Z",
  title_desc: "Title Z → A",
  rating_desc: "Highest Rated",
  rating_asc: "Lowest Rated",
  progress_desc: "Most Progress",
  progress_asc: "Least Progress",
};

export interface BookFilters {
  minRating: number | null;
  category: string | null;
  favoritesOnly: boolean;
  status: ReadingStatus | null;
}

export const emptyFilters: BookFilters = {
  minRating: null,
  category: null,
  favoritesOnly: false,
  status: null,
};

/** Upload lifecycle for the Add/Edit book PDF field. */
export type UploadStatus = "idle" | "uploading" | "success" | "error";

export interface UploadState {
  status: UploadStatus;
  progress: number; // 0–100
  fileName: string | null;
  fileSize: number | null;
  error: string | null;
}

export const idleUpload: UploadState = {
  status: "idle",
  progress: 0,
  fileName: null,
  fileSize: null,
  error: null,
};
