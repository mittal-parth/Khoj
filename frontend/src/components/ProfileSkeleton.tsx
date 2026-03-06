import { Card, CardContent, CardHeader } from './ui/card';
import { Skeleton } from './ui/skeleton';

export function ProfileStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card
          key={i}
          className="rounded-2xl p-4 flex flex-col gap-2 bg-white relative before:absolute before:inset-0 before:rounded-2xl before:border-8 before:border-green before:-translate-x-2 before:translate-y-2 before:-z-10 border-[3px] border-black"
        >
          <CardHeader className="p-0">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="p-0">
            <Skeleton className="h-8 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ProfileHuntCardsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card
          key={i}
          className="rounded-2xl p-4 bg-white relative before:absolute before:inset-0 before:rounded-2xl before:border-8 before:border-green before:-translate-x-2 before:translate-y-2 before:-z-10 border-[3px] border-black"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-8 shrink-0 rounded-base" />
            </div>
            <div className="flex gap-4 mt-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-14" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
