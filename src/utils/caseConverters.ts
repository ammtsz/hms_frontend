/**
 * Case conversion utilities for API integration
 * Handles automatic conversion between snake_case (backend) and camelCase (frontend)
 */

/**
 * Convert a string from camelCase to snake_case
 */
function camelToSnake(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * Convert a string from snake_case to camelCase
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Recursively convert object keys from camelCase to snake_case
 */
function toSnakeCase(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj;
  }

  const converted: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = camelToSnake(key);
    converted[newKey] = toSnakeCase(value);
  }

  return converted;
}

/**
 * Recursively convert object keys from snake_case to camelCase
 */
function toCamelCase(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj;
  }

  const converted: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = snakeToCamel(key);
    converted[newKey] = toCamelCase(value);
  }

  return converted;
}

/**
 * Transform keys utilities
 * Use this object for consistent case conversion across the app
 */
export const transformKeys = {
  toCamelCase,
  toSnakeCase,
} as const;

/**
 * Individual export functions for convenience
 */
export { toCamelCase, toSnakeCase };