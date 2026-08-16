import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import * as booksService from "@/services/booksService";
import type { Book, BookFilters, SortOption } from "@/types/book";
import { toFriendlyError } from "@/lib/utils";

interface UseBooksParams {
  search?: string;
  sort?: SortOption;
  filters?: BookFilters;
  scope?: "all" | "favorites" | "continue_reading" | "recently_added";
}

export function useBooks({ search, sort, filters, scope = "all" }: UseBooksParams) {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(0);
  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (page: number, append: boolean) => {
      if (!user) return;
      const thisRequest = ++requestId.current;
      append ? setIsLoadingMore(true) : setIsLoading(true);
      setError(null);
      try {
        const result = await booksService.listBooks({ userId: user.id, search, sort, filters, page, scope });
        if (requestId.current !== thisRequest) return; // stale response
        setBooks((prev) => (append ? [...prev, ...result.books] : result.books));
        setTotal(result.total);
        setHasMore(result.hasMore);
        pageRef.current = page;
      } catch (err) {
        if (requestId.current !== thisRequest) return;
        setError(toFriendlyError(err, "Unable to load your library. Please try again."));
      } finally {
        if (requestId.current === thisRequest) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, search, sort, JSON.stringify(filters), scope]
  );

  useEffect(() => {
    fetchPage(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    fetchPage(pageRef.current + 1, true);
  }, [fetchPage, hasMore, isLoadingMore]);

  const refetch = useCallback(() => fetchPage(0, false), [fetchPage]);

  const removeBookLocally = useCallback((id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  }, []);

  const updateBookLocally = useCallback((id: string, patch: Partial<Book>) => {
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }, []);

  return {
    books,
    total,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refetch,
    removeBookLocally,
    updateBookLocally,
  };
}
