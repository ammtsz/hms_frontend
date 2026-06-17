import React from "react";
import { cn } from "@/utils/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid = false, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        aria-invalid={invalid || props["aria-invalid"]}
        className={cn(
          "w-full min-h-[44px] rounded-md border bg-white px-3 py-2 text-base text-gray-900 shadow-sm",
          "placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500",
          "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500",
          invalid ? "border-red-500 focus:ring-red-500" : "border-gray-300",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
