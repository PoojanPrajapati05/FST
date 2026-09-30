import { Skeleton } from "@/components/ui/skeleton";

export default function GroupLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6 animate-pulse">
      {/* Back button */}
      <Skeleton className="h-6 w-24" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      {/* Tabs */}
      <Skeleton className="h-11 w-80 rounded-xl" />

      {/* Content */}
      <div className="space-y-4">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  );
}
