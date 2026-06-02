import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function MockScreen({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'h-full w-full overflow-hidden bg-background flex flex-col p-2.5 box-border',
        className,
      )}
    >
      {children}
    </div>
  );
}
