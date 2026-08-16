import type { Book } from "@/types/book";
import { BookCard } from "@/components/books/BookCard";
import { BookGridSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

interface BookGridProps {
  books: Book[];
  layout: "grid" | "list";
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onToggleFavorite: (book: Book) => void;
  onDelete: (book: Book) => void;
  emptyState: React.ReactNode;
}

export function BookGrid({
  books,
  layout,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  onToggleFavorite,
  onDelete,
  emptyState,
}: BookGridProps) {
  if (isLoading) return <BookGridSkeleton />;
  if (books.length === 0) return <>{emptyState}</>;

  return (
    <div>
      {layout === "grid" ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} layout="grid" onToggleFavorite={onToggleFavorite} onDelete={onDelete} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {books.map((book) => (
            <BookCard key={book.id} book={book} layout="list" onToggleFavorite={onToggleFavorite} onDelete={onDelete} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button variant="secondary" onClick={onLoadMore} isLoading={isLoadingMore}>
            {isLoadingMore ? "Loading" : "Load more books"}
          </Button>
        </div>
      )}
      {isLoadingMore && !hasMore && (
        <div className="mt-6 flex justify-center text-ink-faint">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}
    </div>
  );
}
