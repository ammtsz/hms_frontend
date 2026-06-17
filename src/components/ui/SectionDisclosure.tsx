import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/utils/cn";

export interface SectionDisclosureProps {
  title: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function SectionDisclosure({
  title,
  isOpen,
  onToggle,
  children,
  className,
  bodyClassName,
}: SectionDisclosureProps) {
  return (
    <section className={cn("rounded-lg border border-gray-200", className)}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-t-lg bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100"
        aria-expanded={isOpen}
      >
        <span className="text-lg font-medium text-gray-900">{title}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-600" aria-hidden />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-600" aria-hidden />
        )}
      </button>

      {isOpen ? (
        <div className={cn("p-4", bodyClassName)}>{children}</div>
      ) : null}
    </section>
  );
}
