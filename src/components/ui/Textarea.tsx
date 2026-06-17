import React from "react";
import { cn } from "@/utils/cn";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid = false, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || props["aria-invalid"]}
        className={cn(
          "w-full min-h-[96px] rounded-md border bg-white px-3 py-2 text-base text-gray-900 shadow-sm",
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

Textarea.displayName = "Textarea";
