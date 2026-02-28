import { Card, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

export function HuntsSkeleton() {
  return (
    <div className="pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-[90px]">
      <h1 className="text-3xl font-bold mt-12 mb-6 mx-2 text-green drop-shadow-xl">
        Hunts
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mx-2">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden p-0 bg-white">
            <div className="flex h-full min-h-[250px]">
              <Skeleton className="w-1/4 shrink-0 rounded-none border-r-2 border-border" />

              <CardContent className="w-3/4 p-5 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <Skeleton className="h-6 flex-1 max-w-[70%]" />
                  <Skeleton className="h-5 w-16 shrink-0" />
                </div>

                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-[85%] mb-3" />

                <div className="flex items-center gap-2 mb-3">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                  <Skeleton className="h-4 w-24" />
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                  <Skeleton className="h-4 w-20" />
                </div>

                <Skeleton className="h-10 w-full rounded-base mt-auto" />
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
