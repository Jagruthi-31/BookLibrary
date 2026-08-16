import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, X, MoreVertical, Download, ExternalLink, ChevronDown } from "lucide-react";
import { DropdownMenu, MenuItem } from "@/components/ui/DropdownMenu";
import { Tooltip } from "@/components/ui/Tooltip";

interface ReaderTopBarProps {
  title: string;
  onSearch: (query: string) => Promise<void>;
  onSearchNext: () => void;
  searchStatus: "idle" | "searching" | "found" | "not_found";
  onDownload: () => void;
  onOpenInNewTab: () => void;
}

export function ReaderTopBar({ title, onSearch, onSearchNext, searchStatus, onDownload, onOpenInNewTab }: ReaderTopBarProps) {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query);
  };

  return (
    <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2.5 sm:px-4">
      <Tooltip label="Back to book" side="bottom">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="focus-ring shrink-0 rounded-md p-2 text-ink-muted hover:bg-paper-soft hover:text-ink"
        >
          <ArrowLeft size={17} />
        </button>
      </Tooltip>

      {searchOpen ? (
        <form onSubmit={submitSearch} className="flex flex-1 items-center gap-1.5">
          <div className="relative flex-1">
            <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search in this book"
              className="focus-ring h-8 w-full rounded-md border border-border bg-paper-soft pl-7 pr-2 text-sm text-ink placeholder:text-ink-faint"
            />
          </div>
          {searchStatus === "found" && (
            <button type="button" onClick={onSearchNext} className="focus-ring rounded-md p-1.5 text-ink-muted hover:bg-paper-soft">
              <ChevronDown size={15} />
            </button>
          )}
          {searchStatus === "not_found" && <span className="shrink-0 text-xs text-ink-faint">No matches</span>}
          <button
            type="button"
            onClick={() => {
              setSearchOpen(false);
              setQuery("");
            }}
            aria-label="Close search"
            className="focus-ring shrink-0 rounded-md p-1.5 text-ink-muted hover:bg-paper-soft"
          >
            <X size={15} />
          </button>
        </form>
      ) : (
        <>
          <h1 className="min-w-0 flex-1 truncate font-display text-sm font-medium text-ink sm:text-base">{title}</h1>
          <Tooltip label="Search in book" side="bottom">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search in book"
              className="focus-ring shrink-0 rounded-md p-2 text-ink-muted hover:bg-paper-soft hover:text-ink"
            >
              <Search size={16} />
            </button>
          </Tooltip>
          <DropdownMenu
            trigger={
              <button aria-label="More options" className="focus-ring shrink-0 rounded-md p-2 text-ink-muted hover:bg-paper-soft hover:text-ink">
                <MoreVertical size={16} />
              </button>
            }
          >
            <MenuItem icon={<Download size={14} />} onClick={onDownload}>
              Download
            </MenuItem>
            <MenuItem icon={<ExternalLink size={14} />} onClick={onOpenInNewTab}>
              Open in new tab
            </MenuItem>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}
