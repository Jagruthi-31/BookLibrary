-- ============================================================================
-- Athenaeum — Personal Book Library
-- Initial schema: books table, indexes, RLS, storage buckets & policies.
-- Run this once in the Supabase SQL editor (or via `supabase db push`).
-- Safe to re-run: every statement is idempotent.
-- ============================================================================

-- Needed for gen_random_uuid()
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. Table
-- ----------------------------------------------------------------------------
create table if not exists public.books (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,

  title             text not null check (char_length(trim(title)) > 0),
  author            text,
  description       text,
  cover_url         text,
  rating            numeric(2,1) not null default 0 check (rating >= 0 and rating <= 5),
  category          text,
  tags              text[] not null default '{}',

  pdf_path          text not null,
  pdf_file_name     text,
  pdf_size          bigint check (pdf_size is null or pdf_size >= 0),

  total_pages       integer check (total_pages is null or total_pages >= 0),
  current_page      integer not null default 0 check (current_page >= 0),
  reading_progress  numeric(5,2) not null default 0 check (reading_progress >= 0 and reading_progress <= 100),
  is_favorite       boolean not null default false,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  last_opened_at    timestamptz
);

comment on table public.books is 'One row per PDF a user has added to their personal library.';
comment on column public.books.pdf_path is 'Storage object path in the "books" bucket: {user_id}/{book_id}/book.pdf';

-- ----------------------------------------------------------------------------
-- 2. Indexes
-- ----------------------------------------------------------------------------
create index if not exists idx_books_user_id        on public.books (user_id);
create index if not exists idx_books_title           on public.books (title);
create index if not exists idx_books_created_at      on public.books (created_at desc);
create index if not exists idx_books_last_opened_at  on public.books (last_opened_at desc nulls last);
create index if not exists idx_books_rating          on public.books (rating desc);
-- Speeds up "search title/author" for large libraries.
create index if not exists idx_books_title_trgm on public.books using gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(author,'')));

-- ----------------------------------------------------------------------------
-- 3. updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_books_updated_at on public.books;
create trigger trg_books_updated_at
  before update on public.books
  for each row
  execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. Row Level Security — Postgres table
-- ----------------------------------------------------------------------------
alter table public.books enable row level security;

drop policy if exists "Users can view own books"   on public.books;
drop policy if exists "Users can insert own books" on public.books;
drop policy if exists "Users can update own books" on public.books;
drop policy if exists "Users can delete own books" on public.books;

create policy "Users can view own books"
  on public.books for select
  using (auth.uid() = user_id);

create policy "Users can insert own books"
  on public.books for insert
  with check (auth.uid() = user_id);

create policy "Users can update own books"
  on public.books for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own books"
  on public.books for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 5. Storage buckets
--    "books"        — private. Holds the actual PDF files.
--    "book-covers"  — public. Reserved for future direct cover uploads;
--                      v1 accepts a cover image URL instead.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('books', 'books', false, 314572800, array['application/pdf'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('book-covers', 'book-covers', true, 10485760, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ----------------------------------------------------------------------------
-- 6. Storage policies — objects are stored at {user_id}/{book_id}/book.pdf,
--    so the first path segment (storage.foldername(name))[1] is the owner.
-- ----------------------------------------------------------------------------
drop policy if exists "Users can upload own book pdfs" on storage.objects;
drop policy if exists "Users can view own book pdfs"   on storage.objects;
drop policy if exists "Users can update own book pdfs" on storage.objects;
drop policy if exists "Users can delete own book pdfs" on storage.objects;

create policy "Users can upload own book pdfs"
  on storage.objects for insert
  with check (
    bucket_id = 'books'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view own book pdfs"
  on storage.objects for select
  using (
    bucket_id = 'books'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own book pdfs"
  on storage.objects for update
  using (
    bucket_id = 'books'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own book pdfs"
  on storage.objects for delete
  using (
    bucket_id = 'books'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- book-covers is public-read (it's just cover art), but still scoped for writes
-- in case direct cover uploads are added later.
drop policy if exists "Anyone can view covers"          on storage.objects;
drop policy if exists "Users can upload own covers"     on storage.objects;
drop policy if exists "Users can update own covers"     on storage.objects;
drop policy if exists "Users can delete own covers"     on storage.objects;

create policy "Anyone can view covers"
  on storage.objects for select
  using (bucket_id = 'book-covers');

create policy "Users can upload own covers"
  on storage.objects for insert
  with check (
    bucket_id = 'book-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own covers"
  on storage.objects for update
  using (
    bucket_id = 'book-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own covers"
  on storage.objects for delete
  using (
    bucket_id = 'book-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- Done. Verify in the Supabase dashboard:
--   Table Editor → books (RLS badge should read "Enabled")
--   Storage → books (Private), book-covers (Public)
-- ============================================================================
