import React from "react";
import { cn } from "@/utils/cn";

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  htmlFor?: string;
  error?: React.ReactNode;
  helpText?: React.ReactNode;
}

export function Field({
  label,
  htmlFor,
  error,
  helpText,
  className,
  children,
  ...props
}: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)} {...props}>
      {label ? (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {helpText ? <p className="text-sm text-gray-500">{helpText}</p> : null}
    </div>
  );
}
