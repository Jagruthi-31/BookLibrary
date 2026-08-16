import type { LibraryStats } from "@/hooks/useLibraryStats";

const ITEMS: { key: keyof LibraryStats; label: string }[] = [
  { key: "total", label: "Books" },
  { key: "reading", label: "Currently Reading" },
  { key: "finished", label: "Finished" },
  { key: "favorites", label: "Favorites" },
];

export function LibraryStatsBar({ stats }: { stats: LibraryStats | null }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {ITEMS.map(({ key, label }) => (
        <div key={key} className="rounded-card border border-border bg-card px-4 py-3">
          <p className="font-mono text-2xl font-medium text-ink">{stats[key]}</p>
          <p className="mt-0.5 text-xs text-ink-muted">{label}</p>
        </div>
      ))}
    </div>
  );
}
