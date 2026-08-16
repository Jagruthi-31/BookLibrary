import { supabase } from "@/lib/supabase";
import type { Book, BookFilters, BookFormValues, SortOption } from "@/types/book";

const PAGE_SIZE = 60;

export interface ListBooksParams {
  userId: string;
  search?: string;
  sort?: SortOption;
  filters?: BookFilters;
  page?: number; // 0-indexed
  scope?: "all" | "favorites" | "continue_reading" | "recently_added";
}

export interface ListBooksResult {
  books: Book[];
  total: number;
  hasMore: boolean;
}

function applySort(query: any, sort: SortOption = "recently_added") {
  switch (sort) {
    case "recently_added":
      return query.order("created_at", { ascending: false });
    case "recently_read":
      return query.order("last_opened_at", { ascending: false, nullsFirst: false });
    case "title_asc":
      return query.order("title", { ascending: true });
    case "title_desc":
      return query.order("title", { ascending: false });
    case "rating_desc":
      return query.order("rating", { ascending: false });
    case "rating_asc":
      return query.order("rating", { ascending: true });
    case "progress_desc":
      return query.order("reading_progress", { ascending: false });
    case "progress_asc":
      return query.order("reading_progress", { ascending: true });
    default:
      return query.order("created_at", { ascending: false });
  }
}

export async function listBooks(params: ListBooksParams): Promise<ListBooksResult> {
  const { userId, search, sort, filters, page = 0, scope = "all" } = params;

  let query = supabase.from("books").select("*", { count: "exact" }).eq("user_id", userId);

  if (search && search.trim()) {
    const term = search.trim().replace(/[%_]/g, "");
    query = query.or(
      `title.ilike.%${term}%,author.ilike.%${term}%,category.ilike.%${term}%,tags.cs.{${term}}`
    );
  }

  if (scope === "favorites") query = query.eq("is_favorite", true);
  if (scope === "continue_reading") query = query.not("last_opened_at", "is", null).lt("reading_progress", 99.5);
  if (scope === "recently_added") query = query.order("created_at", { ascending: false });

  if (filters?.favoritesOnly) query = query.eq("is_favorite", true);
  if (filters?.category) query = query.eq("category", filters.category);
  if (filters?.minRating) query = query.gte("rating", filters.minRating);
  if (filters?.status === "not_started") query = query.eq("current_page", 0);
  if (filters?.status === "reading") query = query.gt("current_page", 0).lt("reading_progress", 99.5);
  if (filters?.status === "finished") query = query.gte("reading_progress", 99.5);

  if (scope !== "recently_added") {
    query = applySort(query, sort);
  }

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  const total = count ?? 0;
  return {
    books: (data ?? []) as Book[],
    total,
    hasMore: from + (data?.length ?? 0) < total,
  };
}

export async function getBook(id: string): Promise<Book> {
  const { data, error } = await supabase.from("books").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Book;
}

export async function getLibraryStats(userId: string) {
  const { data, error } = await supabase
    .from("books")
    .select("reading_progress, is_favorite, current_page")
    .eq("user_id", userId);
  if (error) throw error;

  const rows = data ?? [];
  const total = rows.length;
  const finished = rows.filter((r) => r.reading_progress >= 99.5).length;
  const reading = rows.filter((r) => r.current_page > 0 && r.reading_progress < 99.5).length;
  const favorites = rows.filter((r) => r.is_favorite).length;

  return { total, finished, reading, favorites };
}

export async function getCategories(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("books")
    .select("category")
    .eq("user_id", userId)
    .not("category", "is", null);
  if (error) throw error;
  const set = new Set((data ?? []).map((r) => r.category as string).filter(Boolean));
  return Array.from(set).sort();
}

export interface CreateBookInput extends BookFormValues {
  id?: string;
  user_id: string;
  pdf_path: string;
  pdf_file_name: string;
  pdf_size: number;
}

export async function createBook(input: CreateBookInput): Promise<Book> {
  const { data, error } = await supabase
    .from("books")
    .insert({
      ...(input.id ? { id: input.id } : {}),
      user_id: input.user_id,
      title: input.title.trim(),
      author: input.author.trim() || null,
      description: input.description.trim() || null,
      cover_url: input.cover_url.trim() || null,
      rating: input.rating,
      category: input.category.trim() || null,
      tags: input.tags,
      pdf_path: input.pdf_path,
      pdf_file_name: input.pdf_file_name,
      pdf_size: input.pdf_size,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Book;
}

/** Reserves a row before the PDF finishes uploading isn't used in v1 — books are
 * created only after a successful upload so we never end up with orphaned rows
 * that point at a non-existent Storage object. See AddBookPage for the flow. */

export interface UpdateBookInput extends Partial<BookFormValues> {
  pdf_path?: string;
  pdf_file_name?: string;
  pdf_size?: number;
}

export async function updateBook(id: string, input: UpdateBookInput): Promise<Book> {
  const payload: Record<string, unknown> = { ...input };
  if (typeof payload.title === "string") payload.title = (payload.title as string).trim();
  if (typeof payload.author === "string") payload.author = (payload.author as string).trim() || null;
  if (typeof payload.description === "string") payload.description = (payload.description as string).trim() || null;
  if (typeof payload.cover_url === "string") payload.cover_url = (payload.cover_url as string).trim() || null;
  if (typeof payload.category === "string") payload.category = (payload.category as string).trim() || null;

  const { data, error } = await supabase.from("books").update(payload).eq("id", id).select("*").single();
  if (error) throw error;
  return data as Book;
}

export async function deleteBookRow(id: string) {
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<Book> {
  const { data, error } = await supabase
    .from("books")
    .update({ is_favorite: isFavorite })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Book;
}

export interface ProgressUpdate {
  current_page: number;
  total_pages?: number;
  reading_progress: number;
}

/** Called (debounced) while reading, and once on open/close. */
export async function updateReadingProgress(id: string, progress: ProgressUpdate) {
  const { error } = await supabase
    .from("books")
    .update({
      current_page: progress.current_page,
      total_pages: progress.total_pages,
      reading_progress: progress.reading_progress,
      last_opened_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function touchLastOpened(id: string) {
  const { error } = await supabase.from("books").update({ last_opened_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}
