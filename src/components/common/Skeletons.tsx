import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer animate-shimmer rounded-md", className)} />;
}

export function BookCardSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      <Skeleton className="aspect-[2/3] w-full rounded-card" />
      <Skeleton className="h-3.5 w-4/5 rounded" />
      <Skeleton className="h-3 w-2/5 rounded" />
    </div>
  );
}

export function BookGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function BookDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-8 sm:flex-row sm:gap-10">
      <Skeleton className="aspect-[2/3] w-full max-w-[220px] rounded-card" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-7 w-3/5 rounded" />
        <Skeleton className="h-4 w-2/5 rounded" />
        <Skeleton className="h-4 w-24 rounded" />
        <div className="flex gap-2 pt-4">
          <Skeleton className="h-10 w-32 rounded-card" />
          <Skeleton className="h-10 w-24 rounded-card" />
        </div>
        <Skeleton className="mt-6 h-24 w-full rounded" />
      </div>
    </div>
  );
}
