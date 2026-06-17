/**
 * Patient Utility Functions
 * 
 * Pure utility functions for patient data validation and calculations.
 * These functions don't involve API calls and can be used across the application.
 */

import { Patient } from "@/types/types";
import { PatientResponseDto } from "@/api/types";
import { getTodayClinic } from "@/utils/timezoneDate";

/**
 * Validate patient data before creation/update
 */
export function validatePatientData({
  name,
  phone,
  birthDate
}: {
  name: string;
  phone?: string;
  birthDate: string;
}) {
  const errors: string[] = [];

  // Name validation
  if (!name || name.trim().length === 0) {
    errors.push("Name is required");
  } else if (name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  // Phone validation (optional but must be valid if provided)
  if (phone && phone.trim().length > 0) {
    const phoneRegex = /^\d{10,15}$/; // Simple phone validation
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      errors.push("Phone number must be 10-15 digits");
    }
  }

  // Birth date validation
  const today = getTodayClinic();
  if (birthDate > today) {
    errors.push("Birth date cannot be in the future");
  }

  const birthYear = parseInt(birthDate.split('-')[0]);
  const currentYear = new Date().getFullYear();
  if (currentYear - birthYear > 120) {
    errors.push("Birth date is too far in the past");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calculate age from birth date
 */
export function calculateAge(birthDate: string): number {
  const birthDateObj = new Date(birthDate + 'T00:00:00');
  const today = new Date();
  let age = today.getFullYear() - birthDateObj.getFullYear();
  const monthDiff = today.getMonth() - birthDateObj.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Get human-readable treatment status label
 */
export function getTreatmentStatusLabel(status: string): string {
  switch (status) {
    case "N":
      return "Novo Paciente";
    case "T":
      return "Em Tratamento";
    case "A":
      return "Alta";
    case "F":
      return "Ausente";
    default:
      return status;
  }
}