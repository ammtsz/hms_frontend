import React from "react";
import { cn } from "@/utils/cn";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid = false, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        aria-invalid={invalid || props["aria-invalid"]}
        className={cn(
          "w-full min-h-[44px] rounded-md border bg-white px-3 py-2 text-base text-gray-900 shadow-sm",
          "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500",
          "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500",
          invalid ? "border-red-500 focus:ring-red-500" : "border-gray-300",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);

Select.displayName = "Select";
