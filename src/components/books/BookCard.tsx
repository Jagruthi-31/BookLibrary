import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MoreVertical, BookOpen, Pencil, Trash2 } from "lucide-react";
import type { Book } from "@/types/book";
import { RatingStars } from "@/components/ui/RatingStars";
import { ProgressBar } from "@/components/ui/Progress";
import { BookCoverFallback } from "@/components/books/BookCoverFallback";
import { DropdownMenu, MenuItem, MenuDivider } from "@/components/ui/DropdownMenu";
import { Tooltip } from "@/components/ui/Tooltip";
import { hueFromString } from "@/lib/utils";
import { getReadingStatus } from "@/types/book";

interface BookCardProps {
  book: Book;
  layout?: "grid" | "list";
  onToggleFavorite: (book: Book) => void;
  onDelete: (book: Book) => void;
}

export function BookCard({ book, layout = "grid", onToggleFavorite, onDelete }: BookCardProps) {
  const navigate = useNavigate();
  const [coverFailed, setCoverFailed] = useState(false);
  const hue = hueFromString(book.title);
  const status = getReadingStatus(book);
  const showProgress = status === "reading";

  const cover = (
    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-card shadow-subtle">
      <div className="spine-strip absolute inset-y-0 left-0 z-10 w-[5px]" style={{ ["--spine-color" as any]: `hsl(${hue} 45% 32%)` }} />
      {book.cover_url && !coverFailed ? (
        <img
          src={book.cover_url}
          alt=""
          loading="lazy"
          onError={() => setCoverFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <BookCoverFallback title={book.title} author={book.author} className="h-full w-full" />
      )}
      {status === "finished" && (
        <span className="absolute right-1.5 top-1.5 rounded-full bg-success/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
          Finished
        </span>
      )}
    </div>
  );

  const quickActions = (
    <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          navigate(`/reader/${book.id}`);
        }}
        className="focus-ring flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/85"
      >
        <BookOpen size={12} /> Read
      </button>
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(book);
          }}
          aria-label={book.is_favorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={book.is_favorite}
          className="focus-ring rounded-full bg-black/70 p-1.5 text-white backdrop-blur-sm hover:bg-black/85"
        >
          <Heart size={13} className={book.is_favorite ? "fill-current" : ""} />
        </button>
        <DropdownMenu
          trigger={
            <button
              aria-label="More actions"
              className="focus-ring rounded-full bg-black/70 p-1.5 text-white backdrop-blur-sm hover:bg-black/85"
            >
              <MoreVertical size={13} />
            </button>
          }
        >
          <MenuItem icon={<Pencil size={14} />} onClick={() => navigate(`/books/${book.id}/edit`)}>
            Edit
          </MenuItem>
          <MenuDivider />
          <MenuItem icon={<Trash2 size={14} />} destructive onClick={() => onDelete(book)}>
            Delete
          </MenuItem>
        </DropdownMenu>
      </div>
    </div>
  );

  if (layout === "list") {
    return (
      <Link
        to={`/books/${book.id}`}
        className="focus-ring group flex items-center gap-4 rounded-card border border-border bg-card p-3 transition-shadow hover:shadow-raised"
      >
        <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded">
          {book.cover_url && !coverFailed ? (
            <img src={book.cover_url} alt="" onError={() => setCoverFailed(true)} className="h-full w-full object-cover" />
          ) : (
            <BookCoverFallback title={book.title} author={book.author} className="h-full w-full" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[15px] font-medium text-ink">{book.title}</p>
          <p className="truncate text-sm text-ink-muted">{book.author || "Unknown author"}</p>
          <div className="mt-1.5 flex items-center gap-3">
            <RatingStars value={book.rating} size={12} />
            {showProgress && <span className="font-mono text-xs text-ink-faint">{Math.round(book.reading_progress)}%</span>}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite(book);
          }}
          aria-label={book.is_favorite ? "Remove from favorites" : "Add to favorites"}
          className="focus-ring shrink-0 rounded-full p-2 text-ink-faint hover:text-danger"
        >
          <Heart size={16} className={book.is_favorite ? "fill-current text-danger" : ""} />
        </button>
      </Link>
    );
  }

  return (
    <Link to={`/books/${book.id}`} className="focus-ring group flex flex-col gap-2.5">
      <div className="relative transition-transform duration-200 group-hover:-translate-y-0.5">
        {cover}
        {quickActions}
      </div>
      <div className="min-w-0">
        <p className="truncate font-display text-[14px] font-medium leading-tight text-ink">{book.title}</p>
        <p className="mt-0.5 truncate text-xs text-ink-muted">{book.author || "Unknown author"}</p>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <RatingStars value={book.rating} size={11} />
          {book.is_favorite && <Heart size={11} className="shrink-0 fill-current text-danger" />}
        </div>
        {showProgress && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <ProgressBar value={book.reading_progress} className="h-1" />
            <span className="shrink-0 font-mono text-[10px] text-ink-faint">{Math.round(book.reading_progress)}%</span>
          </div>
        )}
      </div>
    </Link>
  );
}
