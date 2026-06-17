import React from "react";
import { cn } from "@/utils/cn";

/** Mobile: card-like stacked rows; md+: normal table layout */
export const stackedTableClasses = {
  table: "block w-full md:table md:min-w-full",
  header: "hidden md:table-header-group",
  body: "block space-y-3 md:table-row-group md:space-y-0 md:divide-y md:divide-gray-200",
  row: "block rounded-lg border border-gray-200 bg-white p-3 shadow-sm md:table-row md:border-0 md:border-b md:border-gray-200 md:bg-transparent md:p-0 md:shadow-none",
  cell: "block py-2 md:table-cell md:px-4 md:py-3",
  actionsCell:
    "block border-t border-gray-100 py-2 pt-3 md:table-cell md:border-0 md:py-3",
} as const;

export function TableMobileLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500 md:hidden",
        className,
      )}
    >
      {children}
    </span>
  );
}

export interface TableContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function TableContainer({
  className,
  children,
  ...props
}: TableContainerProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-gray-200",
        className,
      )}
      {...props}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export type TableProps = React.TableHTMLAttributes<HTMLTableElement>;

export function Table({ className, ...props }: TableProps) {
  return (
    <table
      className={cn("min-w-full divide-y divide-gray-200", className)}
      {...props}
    />
  );
}

export type TableSectionProps =
  React.HTMLAttributes<HTMLTableSectionElement>;

export function TableHeader({ className, ...props }: TableSectionProps) {
  return <thead className={cn("bg-gray-100", className)} {...props} />;
}

export function TableBody({ className, ...props }: TableSectionProps) {
  return (
    <tbody
      className={cn("divide-y divide-gray-200 bg-white", className)}
      {...props}
    />
  );
}

export type TableRowProps = React.HTMLAttributes<HTMLTableRowElement>;

export function TableRow({ className, ...props }: TableRowProps) {
  return (
    <tr
      className={cn("transition-colors hover:bg-gray-50", className)}
      {...props}
    />
  );
}

export interface TableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "center" | "right";
}

export function TableHead({
  align = "left",
  className,
  ...props
}: TableHeadProps) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <th
      className={cn(
        "px-4 py-3 text-sm font-semibold text-gray-700",
        alignClass,
        className,
      )}
      {...props}
    />
  );
}

export interface TableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "center" | "right";
}

export function TableCell({
  align = "left",
  className,
  ...props
}: TableCellProps) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <td
      className={cn("px-4 py-3 text-sm text-gray-700", alignClass, className)}
      {...props}
    />
  );
}
