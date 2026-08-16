import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, BookMarked, SearchX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SearchBar } from "@/components/books/SearchBar";
import { SortMenu, FilterMenu, ViewToggle } from "@/components/books/LibraryToolbar";
import { BookGrid } from "@/components/books/BookGrid";
import { EmptyState } from "@/components/books/EmptyState";
import { LibraryStatsBar } from "@/components/books/LibraryStatsBar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useBooks } from "@/hooks/useBooks";
import { useDebouncedValue } from "@/hooks/useDebounce";
import { useDeleteBook } from "@/hooks/useDeleteBook";
import { useLibraryStats } from "@/hooks/useLibraryStats";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { getCategories, toggleFavorite } from "@/services/booksService";
import { emptyFilters, type BookFilters, type SortOption } from "@/types/book";
import { toFriendlyError } from "@/lib/utils";

export default function LibraryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 300);
  const [sort, setSort] = useState<SortOption>("recently_added");
  const [filters, setFilters] = useState<BookFilters>(emptyFilters);
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [categories, setCategories] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const { books, total, isLoading, isLoadingMore, hasMore, error, loadMore, removeBookLocally, updateBookLocally } =
    useBooks({ search, sort, filters });
  const stats = useLibraryStats(refreshKey);

  useEffect(() => {
    if (user) getCategories(user.id).then(setCategories).catch(() => {});
  }, [user, refreshKey]);

  const deleteFlow = useDeleteBook((id) => {
    removeBookLocally(id);
    setRefreshKey((k) => k + 1);
  });

  const handleToggleFavorite = async (book: { id: string; is_favorite: boolean; title: string }) => {
    const next = !book.is_favorite;
    updateBookLocally(book.id, { is_favorite: next });
    try {
      await toggleFavorite(book.id, next);
    } catch (err) {
      updateBookLocally(book.id, { is_favorite: !next });
      toast.error(toFriendlyError(err, "Couldn't update favorites. Please try again."));
    }
  };

  const activeFilterCount = [filters.minRating, filters.category, filters.favoritesOnly || null, filters.status].filter(
    Boolean
  ).length;

  const isFirstTimeEmpty = !isLoading && total === 0 && !search && activeFilterCount === 0;
  const isSearchEmpty = !isLoading && books.length === 0 && (search || activeFilterCount > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">My Library</h1>
            <p className="mt-0.5 text-sm text-ink-muted">
              {total} {total === 1 ? "book" : "books"}
            </p>
          </div>
          <Button onClick={() => navigate("/books/new")} className="hidden sm:inline-flex">
            <Plus size={16} /> Add Book
          </Button>
        </div>
      </div>

      <LibraryStatsBar stats={stats} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={searchInput} onChange={setSearchInput} className="sm:max-w-xs" />
        <div className="flex items-center gap-2">
          <SortMenu value={sort} onChange={setSort} />
          <FilterMenu filters={filters} onChange={setFilters} categories={categories} activeCount={activeFilterCount} />
          <ViewToggle value={layout} onChange={setLayout} />
        </div>
      </div>

      {error && (
        <div className="rounded-card border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">{error}</div>
      )}

      {isFirstTimeEmpty ? (
        <EmptyState
          icon={<BookMarked size={24} />}
          title="Your library is empty"
          description="Add your first book and build your personal digital library."
          action={
            <Button onClick={() => navigate("/books/new")}>
              <Plus size={16} /> Add Your First Book
            </Button>
          }
        />
      ) : isSearchEmpty ? (
        <EmptyState icon={<SearchX size={24} />} title="No books found" description="Try another title, author, or keyword." />
      ) : (
        <BookGrid
          books={books}
          layout={layout}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onToggleFavorite={handleToggleFavorite}
          onDelete={deleteFlow.requestDelete}
          emptyState={null}
        />
      )}

      <ConfirmDialog
        open={!!deleteFlow.pendingBook}
        title="Delete Book?"
        description="This will permanently remove this book and its cloud PDF."
        confirmLabel="Delete"
        isLoading={deleteFlow.isDeleting}
        onConfirm={deleteFlow.confirmDelete}
        onCancel={deleteFlow.cancelDelete}
      />

      <button
        onClick={() => navigate("/books/new")}
        aria-label="Add Book"
        className="focus-ring fixed bottom-20 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-paper shadow-floating sm:hidden"
      >
        <Plus size={22} />
      </button>
    </div>
  );
}
