// Common form utility functions

import { isValidDateString } from "@/utils/timezoneDate";

/** User-facing hint for the expected phone display format */
export const PHONE_FORMAT_MESSAGE = "Phone must be in the format (XXX) XXX-XXXX";

/**
 * Masks birth-date text entry as MM/DD/YYYY (digits only, max 8).
 */
export function formatBirthDateMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * Converts ISO YYYY-MM-DD to MM/DD/YYYY display, or "" if invalid/empty.
 */
export function birthDateIsoToDisplay(iso: string | null | undefined): string {
  if (!iso || !isValidDateString(iso)) return "";
  const [year, month, day] = iso.split("-");
  return `${month}/${day}/${year}`;
}

/**
 * Converts complete MM/DD/YYYY display to ISO YYYY-MM-DD, or null if incomplete/invalid.
 * Does not enforce "not in the future" — that stays in form validation.
 */
export function birthDateDisplayToIso(display: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display.trim());
  if (!match) return null;
  const [, month, day, year] = match;
  const iso = `${year}-${month}-${day}`;
  return isValidDateString(iso) ? iso : null;
}

/**
 * Formats phone number for US standards
 * @param value - Raw phone input
 * @returns Formatted phone number (XXX) XXX-XXXX
 */
export function formatPhoneNumber(value: string): string {
  if (!value) return "";

  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, "");

  // Format as (XXX) XXX-XXXX for US phones
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
  } else if (numbers.length <= 10) {
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6)}`;
  } else {
    // Limit to 10 digits
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  }
}

/**
 * Safely creates a Date from string input
 * @param dateString - Date string input
 * @returns Valid Date object or current date
 */
export function createSafeDate(dateString: string): Date {
  if (!dateString) return new Date();
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? new Date() : date;
}

/**
 * Validates phone number format
 * @param phone - Phone number to validate
 * @returns True if valid or empty, false otherwise
 */
export function validatePhoneFormat(phone: string): boolean {
  if (!phone) return true; // Optional field
  return /^\(\d{3}\) \d{3}-\d{4}$/.test(phone);
}

/**
 * Common form validation for patient data
 * @param data - Patient form data
 * @param requirePhone - Whether phone is required
 * @param requireBirthDate - Whether birth date is required
 * @returns Validation error message or null if valid
 */
export function validatePatientForm(
  data: {
    name: string;
    phone: string;
    birthDate: string | null;
  },
  requirePhone = false,
  requireBirthDate = false
): string | null {
  if (!data.name.trim()) {
    return "Name is required";
  }

  if (requireBirthDate && !data.birthDate) {
    return "Date of birth is required";
  }

  if (requirePhone && !data.phone.trim()) {
    return "Phone is required";
  }

  if (data.phone && !validatePhoneFormat(data.phone)) {
    return PHONE_FORMAT_MESSAGE;
  }

  return null;
}
