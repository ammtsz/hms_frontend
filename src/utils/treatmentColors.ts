/**
 * Color hex codes for visual representation of physiotherapy colors.
 * Maps Portuguese color names to their hex code equivalents.
 */
const COLOR_HEX_CODES: Record<string, string> = {
  rosa: "#EC4899",
  vermelho: "#DC2626",
  laranja: "#EA580C",
  amarelo: "#CA8A04",
  verde: "#16A34A",
  azul: "#2563EB",
  indigo: "#4F46E5",
  violeta: "#7C3AED",
  branco: "#E5E7EB",
};

/**
 * Converts a color name to its hex code
 * @param color - Portuguese color name (case-insensitive)
 * @returns Hex code for the color, or gray (#6B7280) if not found
 */
export const getColorCode = (color: string): string => {
  return COLOR_HEX_CODES[color.toLowerCase()] || "#6B7280";
};

/**
 * Returns the color as hex with alpha for background-only opacity.
 * Use for backgrounds so text color stays fully opaque.
 * @param color - Portuguese color name (case-insensitive)
 * @param opacity - 0–1 (e.g. 0.25 for 25% background opacity)
 * @returns 8-digit hex (#RRGGBBAA)
 */
export const getColorCodeWithOpacity = (
  color: string,
  opacity: number,
): string => {
  const hex = getColorCode(color);
  const alphaHex = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${alphaHex}`;
};
