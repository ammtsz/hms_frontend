import React from "react";
import { cn } from "@/utils/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "icon";

/** Horizontal alignment of icon + label (default `center` for actions). */
export type ButtonAlign = "start" | "center" | "end";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Content alignment; use `start` for list-style ghost rows (nav, menus). */
  align?: ButtonAlign;
  /** Stretch to full width of the parent (common with `align="start"`). */
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingText?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-700 text-white hover:bg-blue-800 focus-visible:ring-blue-500",
  secondary:
    "bg-blue-100 text-blue-800 hover:bg-blue-200 focus-visible:ring-blue-500",
  outline:
    "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 focus-visible:ring-blue-500",
  ghost:
    "bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-blue-500",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: "min-h-[32px] px-2 py-1 text-xs",
  sm: "min-h-[40px] px-3 py-1.5 text-sm",
  md: "min-h-[44px] px-4 py-2 text-sm",
  lg: "min-h-[48px] px-5 py-3 text-base",
  icon: "min-h-[44px] min-w-[44px] p-2",
};

const alignClasses: Record<ButtonAlign, string> = {
  start: "justify-start text-left",
  center: "justify-center text-center",
  end: "justify-end text-right",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      align = "center",
      fullWidth = false,
      isLoading = false,
      loadingText = "Carregando...",
      disabled,
      className,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center gap-2 rounded-md font-semibold transition-colors",
          alignClasses[align],
          fullWidth && "w-full",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {isLoading ? loadingText : children}
      </button>
    );
  },
);

Button.displayName = "Button";
