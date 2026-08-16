import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  value,
  size = 14,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`Rated ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = value >= i;
        const half = !filled && value >= i - 0.5;
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-border" strokeWidth={1.5} />
            {(filled || half) && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: half ? "50%" : "100%" }}>
                <Star size={size} className="text-gold" fill="currentColor" strokeWidth={1.5} />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

export function RatingInput({
  value,
  onChange,
  size = 24,
}: {
  value: number;
  onChange: (value: number) => void;
  size?: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value;

  return (
    <div
      className="inline-flex items-center gap-1"
      onMouseLeave={() => setHovered(null)}
      role="radiogroup"
      aria-label="Book rating"
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
          className="focus-ring rounded p-0.5"
          onMouseEnter={() => setHovered(i)}
          onClick={() => onChange(value === i ? 0 : i)}
        >
          <Star
            size={size}
            className={cn("transition-colors", display >= i ? "text-gold" : "text-border")}
            fill={display >= i ? "currentColor" : "none"}
            strokeWidth={1.5}
          />
        </button>
      ))}
      {value > 0 && (
        <button
          type="button"
          onClick={() => onChange(0)}
          className="focus-ring ml-1.5 text-xs text-ink-faint underline-offset-2 hover:text-ink hover:underline"
        >
          Clear
        </button>
      )}
    </div>
  );
}
