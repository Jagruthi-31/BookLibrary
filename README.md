# Athenaeum — Personal Book Library

A calm, private home for the PDF books you own. Add a book, upload the PDF once, and read it from anywhere — the cloud copy is the source of truth, so your local file never needs to stick around.

![status](https://img.shields.io/badge/status-v1-blue)

## What it does

- Add books with title, author, description, cover URL, rating, category, and tags
- Upload the PDF straight to Supabase Storage with a real progress bar, cancel, and retry
- Read PDFs in a dedicated, distraction-free reader (zoom, fit-to-width/page, fullscreen, in-book search, keyboard shortcuts, mobile swipe)
- Automatically remembers your page and offers to resume next time
- Search, sort, and filter your library; browse Favorites, Continue Reading, and Recently Added
- Edit or delete books safely — the old PDF is never removed until a replacement is confirmed
- Everything is private per-account, enforced by Postgres and Storage row-level security

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Build tool | Vite + React + TypeScript | Fast dev loop, small footprint, strong typing |
| Styling | Tailwind CSS | Consistent design tokens without a heavy component framework |
| Backend | Supabase (Postgres, Auth, Storage) | One managed service for data, auth, and file storage with built-in RLS |
| PDF rendering | pdf.js (`pdfjs-dist`) | Renders PDFs to canvas entirely client-side — no server-side conversion needed |
| Routing | react-router-dom | Standard client-side routing |

Every third-party UI element (dialogs, dropdowns, toasts, tooltips) is a small first-party component in `src/components/ui`, rather than a large external kit — that keeps the bundle lean and every piece easy to restyle.

## Project structure

```
src/
  components/
    ui/          Generic primitives: Button, Input, Dialog, DropdownMenu, Tooltip, RatingStars…
    layout/       AppShell, Sidebar, TopBar, MobileNav
    books/        BookCard, BookGrid, AddEditBookForm, PdfUploadField, toolbar, empty states…
    reader/       PdfViewport, ReaderToolbar, ReaderTopBar, ResumeReadingDialog
    common/       Skeletons, Toast, ConfirmDialog
  pages/          One file per route (Library, Favorites, BookDetails, Reader, Settings…)
  context/        AuthContext, ThemeContext, ToastContext
  hooks/          useBooks, useBookUpload, usePdfDocument, useDeleteBook, useLibraryStats…
  services/       authService, booksService, storageService — all Supabase calls live here
  types/          Shared TypeScript types
  lib/            supabase client singleton, formatting/validation utilities
supabase/
  migrations/0001_init.sql   Full schema, indexes, RLS, and Storage policies
```

Nothing talks to Supabase directly from a component — components call hooks, hooks call `services/*`, and only `services/*` and `lib/supabase.ts` import the Supabase client. That keeps the data layer swappable and testable.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Once it's ready, open **Project Settings → API** and copy:
   - **Project URL**
   - **anon / publishable** key (do *not* use the `service_role` key here)

## 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

`.env` is git-ignored — never commit it, and never put a `service_role` key in frontend code.

## 3. Create the database schema

Open **SQL Editor** in the Supabase dashboard, paste the contents of [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql), and run it.

It is idempotent (safe to re-run) and creates, in order:

1. The `books` table with all metadata + reading-progress columns
2. Indexes on `user_id`, `title`, `created_at`, `last_opened_at`, and `rating`
3. An `updated_at` trigger
4. Row Level Security policies so a user can only see/insert/update/delete their **own** rows
5. Two Storage buckets: `books` (private — holds PDFs) and `book-covers` (public — reserved for a future direct-cover-upload feature; v1 uses a cover URL field instead)
6. Storage RLS policies scoped to `{user_id}/...` object paths

If you'd rather run it from the CLI:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

### Verifying it worked

- **Table Editor → books**: the RLS badge should read "Enabled"
- **Storage**: you should see a private `books` bucket and a public `book-covers` bucket
- **Authentication → Policies**: 4 policies on `books`, 4+4 on `storage.objects`

## 4. Enable email/password auth

Supabase enables email/password sign-up by default. If you want to skip email confirmation while testing locally: **Authentication → Providers → Email → Confirm email → off**. Turn it back on before shipping to real users.

## 5. Run locally

```bash
npm install
npm run dev
```

Open the printed local URL, create an account, and add your first book.

## 6. Build for production

```bash
npm run build   # outputs to dist/
npm run preview # sanity-check the production build locally
```

## 7. Deploy

The app is a static Vite build, so it deploys to any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages, etc.). Set the same two environment variables in your host's dashboard, then point the build command at `npm run build` and the output directory at `dist`.

## How PDF permanence works

1. When you add a book, a random book ID is generated **before** the upload starts.
2. The PDF is streamed to `Storage: books/{user_id}/{book_id}/{filename}` using `XMLHttpRequest` directly against the Storage REST endpoint — this is what gives the real progress bar and cancel support that the default Supabase JS client doesn't expose.
3. Only **after** the upload succeeds does the app write the `books` row, storing the Storage **path** (never the binary, never a local file path).
4. The reader and download button always ask Supabase for a fresh short-lived signed URL — the bucket itself stays private, and nothing is ever made public by accident.
5. Deleting your original local file has no effect on the app; deleting a book *in* the app removes the Storage object first, then the database row, and reports a clear error if either step fails partway through instead of pretending it succeeded.

## Security notes

- Every table and Storage bucket is protected by Row Level Security — the frontend never decides whose data it can see; Postgres and Storage enforce it based on the authenticated session.
- The publishable (`anon`) key is safe to ship in frontend code by design — it can only do what RLS allows. The `service_role` key is never used here and must never be added to frontend code or committed.
- PDFs are private by default; the app reads them only via time-limited signed URLs generated per request.
- Storage paths are namespaced by `auth.uid()`, so RLS can be written as a simple, auditable "first folder segment must match the caller" rule.

## What's deliberately *not* in v1

The schema and file layout leave room to add these later without a rewrite: EPUB support, notes/highlights/bookmarks, reading goals and stats, multiple collections, author/category pages, import/export, offline/PWA reading, and OCR search. Keeping v1 focused on a fast, reliable PDF library was the priority.

## License

Use this however you'd like for your own personal library.
