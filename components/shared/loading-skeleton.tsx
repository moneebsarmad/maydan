import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export function LoadingSkeleton({
  className,
  lines = 4,
}: LoadingSkeletonProps) {
  return (
    <div className={cn("rounded-3xl border border-stone-200 p-5", className)}>
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-1/3 rounded-full bg-stone-200" />
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={`skeleton-line-${index}`}
            className={cn(
              "h-3 rounded-full bg-stone-200",
              index === lines - 1 ? "w-2/3" : "w-full",
            )}
          />
        ))}
      </div>
    </div>
  );
}
