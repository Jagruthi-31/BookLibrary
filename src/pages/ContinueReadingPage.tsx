import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { EmptyState } from "@/components/books/EmptyState";
import { BookGridSkeleton } from "@/components/common/Skeletons";
import { BookCoverFallback } from "@/components/books/BookCoverFallback";
import { ProgressBar } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { useBooks } from "@/hooks/useBooks";

export default function ContinueReadingPage() {
  const { books, total, isLoading } = useBooks({ scope: "continue_reading", sort: "recently_read" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Continue Reading</h1>
        <p className="mt-0.5 text-sm text-ink-muted">
          {total} {total === 1 ? "book" : "books"} in progress
        </p>
      </div>

      {isLoading ? (
        <BookGridSkeleton count={6} />
      ) : books.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={24} />}
          title="Nothing to continue"
          description="Open a book to start building your reading history."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {books.map((book) => (
            <div key={book.id} className="flex gap-4 rounded-card border border-border bg-card p-4">
              <div className="h-24 w-16 shrink-0 overflow-hidden rounded">
                {book.cover_url ? (
                  <img src={book.cover_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <BookCoverFallback title={book.title} author={book.author} className="h-full w-full" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <p className="truncate font-display text-[15px] font-medium text-ink">{book.title}</p>
                  <p className="truncate text-xs text-ink-muted">{book.author || "Unknown author"}</p>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center gap-2">
                    <ProgressBar value={book.reading_progress} className="h-1.5" />
                    <span className="shrink-0 font-mono text-xs text-ink-faint">{Math.round(book.reading_progress)}%</span>
                  </div>
                  <p className="mb-2 text-[11px] text-ink-faint">
                    Page {book.current_page}
                    {book.total_pages ? ` of ${book.total_pages}` : ""}
                  </p>
                  <Link to={`/reader/${book.id}`}>
                    <Button size="sm" className="w-full">
                      Continue Reading
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
