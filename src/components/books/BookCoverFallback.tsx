import { hueFromString } from "@/lib/utils";

export function BookCoverFallback({ title, author, className }: { title: string; author?: string | null; className?: string }) {
  const hue = hueFromString(title || "book");
  const base = `hsl(${hue} 38% 30%)`;
  const deep = `hsl(${hue} 44% 16%)`;

  return (
    <div
      className={className}
      style={{
        background: `linear-gradient(155deg, ${base} 0%, ${deep} 100%)`,
      }}
    >
      <div className="flex h-full w-full flex-col justify-between p-4">
        <div className="h-[2px] w-8 bg-white/30" />
        <div className="min-w-0">
          <p
            className="font-display text-[15px] font-medium leading-snug text-white/95"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </p>
          {author && <p className="mt-1.5 truncate text-[11px] text-white/60">{author}</p>}
        </div>
        <div className="h-[2px] w-8 bg-white/30" />
      </div>
    </div>
  );
}
