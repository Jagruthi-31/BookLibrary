import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AddEditBookForm } from "@/components/books/AddEditBookForm";
import { BookDetailsSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/Button";
import { getBook } from "@/services/booksService";
import { toFriendlyError } from "@/lib/utils";
import type { Book } from "@/types/book";

export default function EditBookPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookId) return;
    setIsLoading(true);
    getBook(bookId)
      .then(setBook)
      .catch((err) => setError(toFriendlyError(err, "This book could not be found.")))
      .finally(() => setIsLoading(false));
  }, [bookId]);

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => navigate(-1)} className="focus-ring mb-6 text-sm font-medium text-ink-muted hover:text-ink">
        ← Back
      </button>
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Edit Book</h1>

      <div className="mt-8">
        {isLoading ? (
          <BookDetailsSkeleton />
        ) : error || !book ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="font-medium text-ink">{error ?? "Book not found."}</p>
            <Button variant="secondary" onClick={() => navigate("/library")}>
              Back to Library
            </Button>
          </div>
        ) : (
          <AddEditBookForm mode="edit" book={book} />
        )}
      </div>
    </div>
  );
}
