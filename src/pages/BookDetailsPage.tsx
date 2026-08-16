import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { BookOpen, Pencil, Heart, Trash2, Calendar, Clock, FileText, Hash } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RatingStars } from "@/components/ui/RatingStars";
import { ProgressBar, Badge } from "@/components/ui/Progress";
import { BookCoverFallback } from "@/components/books/BookCoverFallback";
import { BookDetailsSkeleton } from "@/components/common/Skeletons";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useDeleteBook } from "@/hooks/useDeleteBook";
import { useToast } from "@/context/ToastContext";
import { getBook, toggleFavorite } from "@/services/booksService";
import { formatBytes, formatDate, formatRelativeDate, toFriendlyError } from "@/lib/utils";
import { getReadingStatus, type Book } from "@/types/book";

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not started",
  reading: "Reading",
  finished: "Finished",
};

export default function BookDetailsPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverFailed, setCoverFailed] = useState(false);

  const load = async () => {
    if (!bookId) return;
    setIsLoading(true);
    setError(null);
    try {
      const b = await getBook(bookId);
      setBook(b);
    } catch (err) {
      setError(toFriendlyError(err, "This book could not be found."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  const deleteFlow = useDeleteBook(() => navigate("/library"));

  const handleToggleFavorite = async () => {
    if (!book) return;
    const next = !book.is_favorite;
    setBook({ ...book, is_favorite: next });
    try {
      await toggleFavorite(book.id, next);
    } catch (err) {
      setBook((b) => (b ? { ...b, is_favorite: !next } : b));
      toast.error(toFriendlyError(err, "Couldn't update favorites."));
    }
  };

  if (isLoading) return <BookDetailsSkeleton />;

  if (error || !book) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="font-medium text-ink">{error ?? "Book not found."}</p>
        <Button variant="secondary" onClick={() => navigate("/library")}>
          Back to Library
        </Button>
      </div>
    );
  }

  const status = getReadingStatus(book);

  return (
    <div className="mx-auto max-w-4xl">
      <button onClick={() => navigate(-1)} className="focus-ring mb-6 text-sm font-medium text-ink-muted hover:text-ink">
        ← Back
      </button>

      <div className="flex flex-col gap-8 sm:flex-row sm:gap-10">
        <div className="mx-auto w-full max-w-[220px] shrink-0 sm:mx-0">
          <div className="aspect-[2/3] overflow-hidden rounded-card shadow-raised">
            {book.cover_url && !coverFailed ? (
              <img src={book.cover_url} alt="" onError={() => setCoverFailed(true)} className="h-full w-full object-cover" />
            ) : (
              <BookCoverFallback title={book.title} author={book.author} className="h-full w-full" />
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-semibold leading-tight text-ink sm:text-3xl">{book.title}</h1>
              <p className="mt-1 text-ink-muted">{book.author || "Unknown author"}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <RatingStars value={book.rating} size={16} />
            <Badge>{STATUS_LABEL[status]}</Badge>
            {book.category && <Badge>{book.category}</Badge>}
          </div>

          {status === "reading" && (
            <div className="mt-4 max-w-xs">
              <div className="mb-1 flex items-center justify-between text-xs text-ink-muted">
                <span>{Math.round(book.reading_progress)}% read</span>
                <span>
                  Page {book.current_page}
                  {book.total_pages ? ` / ${book.total_pages}` : ""}
                </span>
              </div>
              <ProgressBar value={book.reading_progress} />
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link to={`/reader/${book.id}`}>
              <Button size="lg">
                <BookOpen size={16} /> Read Book
              </Button>
            </Link>
            <Button variant="secondary" size="lg" onClick={() => navigate(`/books/${book.id}/edit`)}>
              <Pencil size={16} /> Edit
            </Button>
            <Button variant="secondary" size="lg" onClick={handleToggleFavorite}>
              <Heart size={16} className={book.is_favorite ? "fill-current text-danger" : ""} />
              {book.is_favorite ? "Favorited" : "Favorite"}
            </Button>
            <Button variant="ghost" size="lg" onClick={() => deleteFlow.requestDelete(book)}>
              <Trash2 size={16} className="text-danger" />
            </Button>
          </div>

          {book.description && <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink-muted">{book.description}</p>}

          {book.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {book.tags.map((tag) => (
                <Badge key={tag}>#{tag}</Badge>
              ))}
            </div>
          )}

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-6 text-sm sm:grid-cols-3">
            <div className="flex items-start gap-2">
              <Calendar size={15} className="mt-0.5 shrink-0 text-ink-faint" />
              <div>
                <dt className="text-xs text-ink-faint">Added</dt>
                <dd className="text-ink">{formatDate(book.created_at)}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock size={15} className="mt-0.5 shrink-0 text-ink-faint" />
              <div>
                <dt className="text-xs text-ink-faint">Last opened</dt>
                <dd className="text-ink">{formatRelativeDate(book.last_opened_at)}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FileText size={15} className="mt-0.5 shrink-0 text-ink-faint" />
              <div>
                <dt className="text-xs text-ink-faint">File size</dt>
                <dd className="text-ink">{formatBytes(book.pdf_size)}</dd>
              </div>
            </div>
            {book.total_pages && (
              <div className="flex items-start gap-2">
                <Hash size={15} className="mt-0.5 shrink-0 text-ink-faint" />
                <div>
                  <dt className="text-xs text-ink-faint">Pages</dt>
                  <dd className="text-ink">{book.total_pages}</dd>
                </div>
              </div>
            )}
          </dl>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteFlow.pendingBook}
        title="Delete Book?"
        description="This will permanently remove this book and its cloud PDF."
        confirmLabel="Delete"
        isLoading={deleteFlow.isDeleting}
        onConfirm={deleteFlow.confirmDelete}
        onCancel={deleteFlow.cancelDelete}
      />
    </div>
  );
}
