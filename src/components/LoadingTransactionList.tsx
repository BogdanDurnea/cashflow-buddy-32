import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export function LoadingTransactionList() {
  return (
    <div className="space-y-1 animate-fade-in">
      {[...Array(6)].map((_, i) => (
        <div key={i}>
          <div className="p-3 sm:p-4 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
              <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
          <Separator />
        </div>
      ))}
    </div>
  );
}
