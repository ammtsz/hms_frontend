/**
 * Timezone display helpers for the fixed clinic timezone (from env).
 */

/**
 * Get a readable city name from an IANA timezone identifier.
 * @param timezone IANA timezone identifier (e.g., "America/Vancouver")
 */
export function getTimezoneCityName(timezone: string): string {
  if (!timezone) {
    return "";
  }

  const parts = timezone.split("/");
  const cityPart = parts[parts.length - 1];
  return cityPart.replace(/_/g, " ");
}

/**
 * Get the GMT offset string for a timezone (respects DST).
 * @param timezone IANA timezone identifier
 */
export function getTimezoneOffsetString(timezone: string): string {
  if (!timezone) {
    return "GMT";
  }

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    });
    const offsetPart = formatter
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName");

    if (offsetPart?.value) {
      return offsetPart.value.replace(/^UTC/, "GMT");
    }
  } catch {
    // Invalid IANA timezone
  }

  return "GMT";
}
