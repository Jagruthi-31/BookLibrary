import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchBar({
  value,
  onChange,
  className,
  placeholder = "Search by title, author, or tag",
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search your library"
        className="focus-ring h-10 w-full rounded-card border border-border bg-card pl-9 pr-9 text-sm text-ink placeholder:text-ink-faint"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="focus-ring absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-faint hover:text-ink"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
