/**
 * Timezone utility functions and constants
 * Centralized timezone configuration for consistent display across the application
 */

export interface TimezoneOption {
  value: string;
  label: string;
  cityName: string;
  offset: string;
}

/**
 * Comprehensive list of supported timezones with famous cities for each GMT offset
 * Organized by GMT offset for better user experience
 */
export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  // GMT-8
  { value: "America/Los_Angeles", label: "United States (Los Angeles)", cityName: "Los Angeles", offset: "GMT-8" },
  { value: "America/Vancouver", label: "Canada (Vancouver)", cityName: "Vancouver", offset: "GMT-8" },
  
  // GMT-7
  { value: "America/Denver", label: "United States (Denver)", cityName: "Denver", offset: "GMT-7" },
  { value: "America/Phoenix", label: "United States (Phoenix)", cityName: "Phoenix", offset: "GMT-7" },
  
  // GMT-6
  { value: "America/Chicago", label: "United States (Chicago)", cityName: "Chicago", offset: "GMT-6" },
  { value: "America/Mexico_City", label: "Mexico (Mexico City)", cityName: "Mexico City", offset: "GMT-6" },
  
  // GMT-5
  { value: "America/New_York", label: "United States (New York)", cityName: "New York", offset: "GMT-5" },
  { value: "America/Toronto", label: "Canada (Toronto)", cityName: "Toronto", offset: "GMT-5" },
  
  // GMT-3
  { value: "America/Sao_Paulo", label: "Brazil (Sao Paulo)", cityName: "Sao Paulo", offset: "GMT-3" },
  { value: "America/Argentina/Buenos_Aires", label: "Argentina (Buenos Aires)", cityName: "Buenos Aires", offset: "GMT-3" },
  
  // GMT+0
  { value: "Europe/London", label: "United Kingdom (London)", cityName: "London", offset: "GMT+0" },
  { value: "Africa/Casablanca", label: "Morocco (Casablanca)", cityName: "Casablanca", offset: "GMT+0" },
  
  // GMT+1
  { value: "Europe/Paris", label: "France (Paris)", cityName: "Paris", offset: "GMT+1" },
  { value: "Europe/Berlin", label: "Germany (Berlin)", cityName: "Berlin", offset: "GMT+1" },
  { value: "Europe/Rome", label: "Italy (Rome)", cityName: "Rome", offset: "GMT+1" },
  
  // GMT+2
  { value: "Europe/Athens", label: "Greece (Athens)", cityName: "Athens", offset: "GMT+2" },
  { value: "Africa/Cairo", label: "Egypt (Cairo)", cityName: "Cairo", offset: "GMT+2" },
  
  // GMT+3
  { value: "Europe/Moscow", label: "Russia (Moscow)", cityName: "Moscow", offset: "GMT+3" },
  { value: "Asia/Dubai", label: "United Arab Emirates (Dubai)", cityName: "Dubai", offset: "GMT+3" },
  
  // GMT+5
  { value: "Asia/Karachi", label: "Pakistan (Karachi)", cityName: "Karachi", offset: "GMT+5" },
  
  // GMT+7
  { value: "Asia/Bangkok", label: "Thailand (Bangkok)", cityName: "Bangkok", offset: "GMT+7" },
  
  // GMT+8
  { value: "Asia/Shanghai", label: "China (Shanghai)", cityName: "Shanghai", offset: "GMT+8" },
  { value: "Asia/Singapore", label: "Singapore", cityName: "Singapore", offset: "GMT+8" },
  
  // GMT+9
  { value: "Asia/Tokyo", label: "Japan (Tokyo)", cityName: "Tokyo", offset: "GMT+9" },
  { value: "Asia/Seoul", label: "South Korea (Seoul)", cityName: "Seoul", offset: "GMT+9" },
  
  // GMT+10
  { value: "Australia/Sydney", label: "Australia (Sydney)", cityName: "Sydney", offset: "GMT+10" },
  { value: "Australia/Melbourne", label: "Australia (Melbourne)", cityName: "Melbourne", offset: "GMT+10" },
];

/**
 * Get the city name for a given timezone
 * @param timezone IANA timezone identifier (e.g., "America/Sao_Paulo")
 * @returns Formatted city name (e.g., "Sao Paulo")
 */
export function getTimezoneCityName(timezone: string): string {
  const option = TIMEZONE_OPTIONS.find((tz) => tz.value === timezone);
  if (option) {
    return option.cityName;
  }
  
  // Fallback: extract city from timezone identifier and format it
  const parts = timezone.split("/");
  const cityPart = parts[parts.length - 1];
  return cityPart.replace(/_/g, " ");
}

/**
 * Get the full label for a given timezone
 * @param timezone IANA timezone identifier
 * @returns Formatted label with country and city (e.g., "Brazil (Sao Paulo)")
 */
export function getTimezoneLabel(timezone: string): string {
  const option = TIMEZONE_OPTIONS.find((tz) => tz.value === timezone);
  return option ? option.label : timezone;
}

/**
 * Get the GMT offset string for a given timezone
 * @param timezone IANA timezone identifier
 * @returns GMT offset string (e.g., "GMT-3", "GMT+9")
 */
export function getTimezoneOffsetString(timezone: string): string {
  const option = TIMEZONE_OPTIONS.find((tz) => tz.value === timezone);
  return option ? option.offset : "GMT+0";
}

/**
 * Get timezone options grouped by GMT offset
 * Useful for displaying timezones in categorized lists
 */
export function getTimezonesByOffset(): Record<string, TimezoneOption[]> {
  return TIMEZONE_OPTIONS.reduce((acc, tz) => {
    if (!acc[tz.offset]) {
      acc[tz.offset] = [];
    }
    acc[tz.offset].push(tz);
    return acc;
  }, {} as Record<string, TimezoneOption[]>);
}
