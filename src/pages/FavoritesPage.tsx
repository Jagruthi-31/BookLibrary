import { useState } from "react";
import { Heart } from "lucide-react";
import { BookGrid } from "@/components/books/BookGrid";
import { EmptyState } from "@/components/books/EmptyState";
import { SearchBar } from "@/components/books/SearchBar";
import { ViewToggle } from "@/components/books/LibraryToolbar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useBooks } from "@/hooks/useBooks";
import { useDebouncedValue } from "@/hooks/useDebounce";
import { useDeleteBook } from "@/hooks/useDeleteBook";
import { useToast } from "@/context/ToastContext";
import { toggleFavorite } from "@/services/booksService";
import { toFriendlyError } from "@/lib/utils";

export default function FavoritesPage() {
  const toast = useToast();
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 300);
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  const { books, total, isLoading, isLoadingMore, hasMore, loadMore, removeBookLocally, updateBookLocally } = useBooks({
    search,
    scope: "favorites",
  });

  const deleteFlow = useDeleteBook((id) => removeBookLocally(id));

  const handleToggleFavorite = async (book: { id: string; is_favorite: boolean }) => {
    updateBookLocally(book.id, { is_favorite: false });
    removeBookLocally(book.id);
    try {
      await toggleFavorite(book.id, false);
    } catch (err) {
      toast.error(toFriendlyError(err, "Couldn't update favorites. Please try again."));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Favorites</h1>
        <p className="mt-0.5 text-sm text-ink-muted">
          {total} {total === 1 ? "book" : "books"}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={searchInput} onChange={setSearchInput} className="sm:max-w-xs" placeholder="Search favorites" />
        <ViewToggle value={layout} onChange={setLayout} />
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
          <EmptyState icon={<Heart size={24} />} title="No favorites yet" description="Favorite books to find them quickly later." />
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
