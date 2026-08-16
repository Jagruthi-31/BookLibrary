import { ArrowUpDown, SlidersHorizontal, LayoutGrid, List, Check } from "lucide-react";
import { DropdownMenu, MenuItem } from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/Button";
import { RatingInput } from "@/components/ui/RatingStars";
import { cn } from "@/lib/utils";
import { SORT_LABELS, type BookFilters, type ReadingStatus, type SortOption } from "@/types/book";

export function SortMenu({ value, onChange }: { value: SortOption; onChange: (v: SortOption) => void }) {
  return (
    <DropdownMenu
      trigger={
        <Button variant="secondary" size="sm">
          <ArrowUpDown size={14} /> Sort
        </Button>
      }
    >
      {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
        <MenuItem
          key={option}
          onClick={() => onChange(option)}
          icon={value === option ? <Check size={14} /> : <span className="w-[14px]" />}
        >
          {SORT_LABELS[option]}
        </MenuItem>
      ))}
    </DropdownMenu>
  );
}

const STATUS_OPTIONS: { value: ReadingStatus; label: string }[] = [
  { value: "not_started", label: "Not Started" },
  { value: "reading", label: "Reading" },
  { value: "finished", label: "Finished" },
];

export function FilterMenu({
  filters,
  onChange,
  categories,
  activeCount,
}: {
  filters: BookFilters;
  onChange: (filters: BookFilters) => void;
  categories: string[];
  activeCount: number;
}) {
  return (
    <DropdownMenu
      trigger={
        <Button variant="secondary" size="sm">
          <SlidersHorizontal size={14} /> Filter
          {activeCount > 0 && (
            <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] text-paper">
              {activeCount}
            </span>
          )}
        </Button>
      }
      className="w-72 p-3"
    >
      <div onClick={(e) => e.stopPropagation()} className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">Reading status</p>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onChange({ ...filters, status: filters.status === opt.value ? null : opt.value })}
                className={cn(
                  "focus-ring rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  filters.status === opt.value
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border text-ink-muted hover:bg-paper-soft"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">Minimum rating</p>
          <RatingInput
            size={18}
            value={filters.minRating ?? 0}
            onChange={(v) => onChange({ ...filters, minRating: v || null })}
          />
        </div>

        {categories.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">Category</p>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => onChange({ ...filters, category: filters.category === cat ? null : cat })}
                  className={cn(
                    "focus-ring rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    filters.category === cat
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border text-ink-muted hover:bg-paper-soft"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={filters.favoritesOnly}
            onChange={(e) => onChange({ ...filters, favoritesOnly: e.target.checked })}
            className="h-4 w-4 rounded accent-accent"
          />
          Favorites only
        </label>

        {activeCount > 0 && (
          <button
            onClick={() => onChange({ minRating: null, category: null, favoritesOnly: false, status: null })}
            className="focus-ring text-xs font-medium text-accent hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>
    </DropdownMenu>
  );
}

export function ViewToggle({ value, onChange }: { value: "grid" | "list"; onChange: (v: "grid" | "list") => void }) {
  return (
    <div className="flex items-center rounded-card border border-border p-0.5">
      <button
        onClick={() => onChange("grid")}
        aria-label="Grid view"
        aria-pressed={value === "grid"}
        className={cn("focus-ring rounded-[7px] p-1.5", value === "grid" ? "bg-paper-soft text-ink" : "text-ink-faint")}
      >
        <LayoutGrid size={15} />
      </button>
      <button
        onClick={() => onChange("list")}
        aria-label="List view"
        aria-pressed={value === "list"}
        className={cn("focus-ring rounded-[7px] p-1.5", value === "list" ? "bg-paper-soft text-ink" : "text-ink-faint")}
      >
        <List size={15} />
      </button>
    </div>
  );
}
