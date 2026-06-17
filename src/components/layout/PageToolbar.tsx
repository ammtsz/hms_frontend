import React from "react";
import { cn } from "@/utils/cn";

export interface PageToolbarProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps filters and toolbar actions with mobile-safe flex wrap.
 */
export function PageToolbar({ children, className }: PageToolbarProps) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-wrap items-center gap-2 sm:gap-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
