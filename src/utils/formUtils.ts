// Common form utility functions

/** User-facing hint for the expected phone display format */
export const PHONE_FORMAT_MESSAGE = "Phone must be in the format (XXX) XXX-XXXX";

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
