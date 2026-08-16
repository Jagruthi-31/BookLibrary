import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Plus } from "lucide-react";
import { BookGrid } from "@/components/books/BookGrid";
import { EmptyState } from "@/components/books/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { useBooks } from "@/hooks/useBooks";
import { useDeleteBook } from "@/hooks/useDeleteBook";
import { useToast } from "@/context/ToastContext";
import { toggleFavorite } from "@/services/booksService";
import { toFriendlyError } from "@/lib/utils";

export default function RecentlyAddedPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [layout] = useState<"grid" | "list">("grid");

  const { books, total, isLoading, isLoadingMore, hasMore, loadMore, removeBookLocally, updateBookLocally } = useBooks({
    scope: "recently_added",
  });

  const deleteFlow = useDeleteBook((id) => removeBookLocally(id));

  const handleToggleFavorite = async (book: { id: string; is_favorite: boolean }) => {
    const next = !book.is_favorite;
    updateBookLocally(book.id, { is_favorite: next });
    try {
      await toggleFavorite(book.id, next);
    } catch (err) {
      updateBookLocally(book.id, { is_favorite: !next });
      toast.error(toFriendlyError(err, "Couldn't update favorites. Please try again."));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Recently Added</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {total} {total === 1 ? "book" : "books"} · newest first
          </p>
        </div>
        <Button onClick={() => navigate("/books/new")} className="hidden sm:inline-flex">
          <Plus size={16} /> Add Book
        </Button>
      </div>

      <BookGrid
        books={books}
        layout={layout}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onToggleFavorite={handleToggleFavorite}
        onDelete={deleteFlow.requestDelete}
        emptyState={
          <EmptyState
            icon={<Clock size={24} />}
            title="Your library is empty"
            description="Add your first book and it will appear here."
            action={
              <Button onClick={() => navigate("/books/new")}>
                <Plus size={16} /> Add Your First Book
              </Button>
            }
          />
        }
      />

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
