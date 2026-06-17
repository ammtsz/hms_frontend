import { PatientBasic } from "@/types/types";

/**
 * Check if a patient name or phone matches another patient (case-insensitive, fuzzy matching)
 */
export function checkForDuplicatePatients(
  allPatients: PatientBasic[],
  name: string,
  phone: string,
  currentPatientId: string
): Array<{ id: string; name: string; phone: string; priority: string; status: string }> {
  const duplicates: Array<{
    id: string;
    name: string;
    phone: string;
    priority: string;
    status: string;
  }> = [];

  const normalizedName = normalizeName(name);
  const normalizedPhone = normalizePhone(phone);

  for (const patient of allPatients) {
    // Skip the current patient being edited
    if (patient.id === currentPatientId) continue;

    const patientNormalizedName = normalizeName(patient.name);
    const patientNormalizedPhone = normalizePhone(patient.phone || "");

    // Check for exact name match
    if (patientNormalizedName === normalizedName) {
      duplicates.push({
        id: patient.id,
        name: patient.name,
        phone: patient.phone || "",
        priority: patient.priority,
        status: patient.status,
      });
      continue;
    }

    // Check for exact phone match (if phone provided)
    if (normalizedPhone && patientNormalizedPhone === normalizedPhone) {
      duplicates.push({
        id: patient.id,
        name: patient.name,
        phone: patient.phone || "",
        priority: patient.priority,
        status: patient.status,
      });
      continue;
    }

    // Check for similar names (Levenshtein distance or similar)
    if (areSimilarNames(normalizedName, patientNormalizedName)) {
      duplicates.push({
        id: patient.id,
        name: patient.name,
        phone: patient.phone || "",
        priority: patient.priority,
        status: patient.status,
      });
    }
  }

  return duplicates;
}

/**
 * Normalize name for comparison (lowercase, remove accents, trim)
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .trim();
}

/**
 * Normalize phone for comparison (remove all non-digits)
 */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Check if two names are similar using a simple similarity algorithm
 * Returns true if names have >80% similarity
 */
function areSimilarNames(name1: string, name2: string): boolean {
  // If names are too short, don't do fuzzy matching
  if (name1.length < 3 || name2.length < 3) return false;

  // Calculate similarity using Levenshtein distance
  const distance = levenshteinDistance(name1, name2);
  const maxLength = Math.max(name1.length, name2.length);
  const similarity = 1 - distance / maxLength;

  // Consider similar if >80% match
  return similarity > 0.8;
}

/**
 * Calculate Levenshtein distance between two strings
 * (minimum number of single-character edits required to change one word into the other)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}
