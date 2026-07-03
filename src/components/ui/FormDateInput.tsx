"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  birthDateDisplayToIso,
  birthDateIsoToDisplay,
  formatBirthDateMask,
} from "@/utils/formUtils";
import { Input } from "./Input";

export interface FormDateInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "defaultValue" | "onChange"
> {
  /** Controlled value in YYYY-MM-DD format, or "" when empty/incomplete. */
  value?: string;
  /** Called with ISO YYYY-MM-DD when complete/valid, or "" when incomplete/cleared. */
  onValueChange?: (isoValue: string) => void;
  invalid?: boolean;
}

/**
 * Birth-date field using MM/DD/YYYY text entry.
 *
 * Native `<input type="date">` resets day/month while typing the year in
 * Chromium (Chrome, Edge). A masked text input avoids that browser quirk.
 */
export function FormDateInput({
  value = "",
  onValueChange,
  invalid = false,
  disabled,
  className,
  ...props
}: FormDateInputProps) {
  const [display, setDisplay] = useState(() => birthDateIsoToDisplay(value));
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (value === prevValueRef.current) return;
    prevValueRef.current = value;

    const displayIso = birthDateDisplayToIso(display) ?? "";
    if (value !== displayIso) {
      setDisplay(birthDateIsoToDisplay(value));
    }
  }, [value, display]);

  const handleDisplayChange = (raw: string) => {
    const next = formatBirthDateMask(raw);
    setDisplay(next);
    onValueChange?.(birthDateDisplayToIso(next) ?? "");
  };

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="mm/dd/yyyy"
      value={display}
      onChange={(event) => handleDisplayChange(event.target.value)}
      invalid={invalid}
      disabled={disabled}
      className={className}
      maxLength={10}
    />
  );
}
