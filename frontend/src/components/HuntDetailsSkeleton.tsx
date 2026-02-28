import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

export function HuntDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-background pt-20 px-4 mb-[90px]">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Hunt Info Card skeleton */}
        <Card className="bg-white">
          <CardHeader className="bg-main text-main-foreground p-6 border-b-2 border-black -my-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex-1">
                <Skeleton className="h-6 w-48 bg-main-foreground/30" />
              </CardTitle>
              <Skeleton className="h-9 w-9 shrink-0 bg-main-foreground/30 rounded-base" />
            </div>
          </CardHeader>

          <CardContent className="mt-4">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-[90%] mb-6" />

            <div className="bg-muted rounded-lg p-6 mb-6 border-2 border-black shadow-[-2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Management Card skeleton */}
        <Card className="bg-white">
          <CardHeader className="bg-accent text-accent-foreground p-6 border-b-2 border-black -my-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold">
                <Skeleton className="h-6 w-40 bg-accent-foreground/30" />
              </CardTitle>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 shrink-0 bg-accent-foreground/30 rounded-base" />
                <Skeleton className="h-8 w-20 bg-accent-foreground/30 rounded-base hidden sm:block" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </CardContent>
        </Card>

        {/* Start Hunt button skeleton */}
        <Skeleton className="h-12 w-full rounded-base" />
      </div>
    </div>
  );
}
