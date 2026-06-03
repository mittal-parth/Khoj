import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Fixed viewport — all mocks share this size; content must fit without scrolling. */
export const PHONE_WIDTH = 272;
export const PHONE_SCREEN_HEIGHT = 448;

interface PhoneFrameProps {
  children: ReactNode;
  className?: string;
}

export function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div
      className={cn('mx-auto shrink-0', className)}
      style={{ width: PHONE_WIDTH }}
    >
      <div className="rounded-[2.5rem] border-[3px] border-border bg-ink p-[9px] shadow-shadow">
        <div className="relative rounded-[1.85rem] border-2 border-border bg-background overflow-hidden">
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 z-20 w-[78px] h-[20px] rounded-full bg-ink"
            aria-hidden
          />
          <div className="relative z-10 flex items-end justify-between px-4 pt-2.5 pb-0.5 text-[9px] font-medium text-foreground/45">
            <span>9:41</span>
            <span className="w-3 h-1.5 border border-current rounded-sm" />
          </div>
          <div
            className="relative overflow-hidden"
            style={{ height: PHONE_SCREEN_HEIGHT }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
