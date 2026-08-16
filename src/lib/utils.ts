import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRelativeDate(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? "" : "s"} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  return formatDate(iso);
}

/** Deterministic pseudo-random hue from a string, used for spine-color accents. */
export function hueFromString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

export function initialsFromTitle(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number
): (...args: Args) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}

/** Friendly wrapper for errors thrown by Supabase calls. Logs the real error, returns a safe message. */
export function toFriendlyError(err: unknown, fallback: string): string {
  // eslint-disable-next-line no-console
  console.error(fallback, err);
  return fallback;
}

export const ALLOWED_PDF_TYPES = ["application/pdf"];
export const MAX_PDF_SIZE_BYTES = 300 * 1024 * 1024; // 300 MB

export function validatePdfFile(file: File): string | null {
  const isPdfType = ALLOWED_PDF_TYPES.includes(file.type) || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdfType) return "That file doesn't look like a PDF. Choose a .pdf file.";
  if (file.size > MAX_PDF_SIZE_BYTES) {
    return `This file is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_PDF_SIZE_BYTES)}.`;
  }
  if (file.size === 0) return "This file appears to be empty.";
  return null;
}
