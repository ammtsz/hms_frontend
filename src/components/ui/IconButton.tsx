import React from "react";
import { cn } from "@/utils/cn";

export type IconButtonTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "purple";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: IconButtonTone;
}

const toneClasses: Record<IconButtonTone, string> = {
  neutral: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
  primary: "text-blue-600 hover:bg-blue-50 hover:text-blue-900",
  success: "text-green-600 hover:bg-green-50 hover:text-green-900",
  warning: "text-amber-700 hover:bg-amber-50 hover:text-amber-900",
  danger: "text-red-600 hover:bg-red-50 hover:text-red-900",
  purple: "text-purple-600 hover:bg-purple-50 hover:text-purple-900",
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ tone = "neutral", className, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded p-1 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer",
          toneClasses[tone],
          className,
        )}
        {...props}
      />
    );
  },
);

IconButton.displayName = "IconButton";
