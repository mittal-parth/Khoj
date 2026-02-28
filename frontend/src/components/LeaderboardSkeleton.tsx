import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Skeleton } from "./ui/skeleton";

export function LeaderboardSkeleton() {
  return (
    <div className="overflow-x-auto overflow-y-auto flex-1 -mx-4 px-4">
      <Table className="w-full">
        <TableHeader className="border-t-1 border-black">
          <TableRow>
            <TableHead className="text-center font-bold text-sm px-2 sm:px-4">
              Rank
            </TableHead>
            <TableHead className="text-left font-bold text-sm px-2 sm:px-4">
              Team
            </TableHead>
            <TableHead className="text-center font-bold text-sm px-2 sm:px-4">
              Clues
            </TableHead>
            <TableHead className="text-center font-bold text-sm px-2 sm:px-4">
              Score
            </TableHead>
            <TableHead className="w-8 px-2" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3, 4].map((i) => (
            <TableRow key={i}>
              <TableCell className="text-center px-2 sm:px-4">
                <Skeleton className="h-5 w-5 mx-auto" />
              </TableCell>
              <TableCell className="px-2 sm:px-4 min-w-[100px]">
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="text-center px-2 sm:px-4">
                <Skeleton className="h-4 w-6 mx-auto" />
              </TableCell>
              <TableCell className="text-center px-2 sm:px-4">
                <Skeleton className="h-4 w-10 mx-auto" />
              </TableCell>
              <TableCell className="px-2 w-8">
                <Skeleton className="h-8 w-8 shrink-0" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function LeaderboardAttestationsSkeleton() {
  return (
    <div className="border-l-2 border-border/50 pl-4 py-2 space-y-4">
      {[1, 2, 3].map((clueIndex) => (
        <div key={clueIndex}>
          <div className="relative flex items-center mb-2">
            <div
              className="absolute w-2 h-2 rounded-full bg-border -left-[21px] top-1/2 -translate-y-1/2 shrink-0"
              aria-hidden
            />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="ml-4 space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <Skeleton className="h-4 w-20 shrink-0" />
              <Skeleton className="h-4 w-4 shrink-0" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Skeleton className="h-4 w-20 shrink-0" />
              <Skeleton className="h-4 w-4 shrink-0" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
