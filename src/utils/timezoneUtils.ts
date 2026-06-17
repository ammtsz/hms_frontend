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
  { value: "America/Los_Angeles", label: "Estados Unidos (Los Angeles)", cityName: "Los Angeles", offset: "GMT-8" },
  { value: "America/Vancouver", label: "Canadá (Vancouver)", cityName: "Vancouver", offset: "GMT-8" },
  
  // GMT-7
  { value: "America/Denver", label: "Estados Unidos (Denver)", cityName: "Denver", offset: "GMT-7" },
  { value: "America/Phoenix", label: "Estados Unidos (Phoenix)", cityName: "Phoenix", offset: "GMT-7" },
  
  // GMT-6
  { value: "America/Chicago", label: "Estados Unidos (Chicago)", cityName: "Chicago", offset: "GMT-6" },
  { value: "America/Mexico_City", label: "México (Cidade do México)", cityName: "Cidade do México", offset: "GMT-6" },
  
  // GMT-5
  { value: "America/New_York", label: "Estados Unidos (Nova York)", cityName: "Nova York", offset: "GMT-5" },
  { value: "America/Toronto", label: "Canadá (Toronto)", cityName: "Toronto", offset: "GMT-5" },
  
  // GMT-3
  { value: "America/Sao_Paulo", label: "Brasil (São Paulo)", cityName: "São Paulo", offset: "GMT-3" },
  { value: "America/Argentina/Buenos_Aires", label: "Argentina (Buenos Aires)", cityName: "Buenos Aires", offset: "GMT-3" },
  
  // GMT+0
  { value: "Europe/London", label: "Reino Unido (Londres)", cityName: "Londres", offset: "GMT+0" },
  { value: "Africa/Casablanca", label: "Marrocos (Casablanca)", cityName: "Casablanca", offset: "GMT+0" },
  
  // GMT+1
  { value: "Europe/Paris", label: "França (Paris)", cityName: "Paris", offset: "GMT+1" },
  { value: "Europe/Berlin", label: "Alemanha (Berlim)", cityName: "Berlim", offset: "GMT+1" },
  { value: "Europe/Rome", label: "Itália (Roma)", cityName: "Roma", offset: "GMT+1" },
  
  // GMT+2
  { value: "Europe/Athens", label: "Grécia (Atenas)", cityName: "Atenas", offset: "GMT+2" },
  { value: "Africa/Cairo", label: "Egito (Cairo)", cityName: "Cairo", offset: "GMT+2" },
  
  // GMT+3
  { value: "Europe/Moscow", label: "Rússia (Moscou)", cityName: "Moscou", offset: "GMT+3" },
  { value: "Asia/Dubai", label: "Emirados Árabes (Dubai)", cityName: "Dubai", offset: "GMT+3" },
  
  // GMT+5
  { value: "Asia/Karachi", label: "Paquistão (Karachi)", cityName: "Karachi", offset: "GMT+5" },
  
  // GMT+7
  { value: "Asia/Bangkok", label: "Tailândia (Bangkok)", cityName: "Bangkok", offset: "GMT+7" },
  
  // GMT+8
  { value: "Asia/Shanghai", label: "China (Xangai)", cityName: "Xangai", offset: "GMT+8" },
  { value: "Asia/Singapore", label: "Singapura", cityName: "Singapura", offset: "GMT+8" },
  
  // GMT+9
  { value: "Asia/Tokyo", label: "Japão (Tóquio)", cityName: "Tóquio", offset: "GMT+9" },
  { value: "Asia/Seoul", label: "Coreia do Sul (Seul)", cityName: "Seul", offset: "GMT+9" },
  
  // GMT+10
  { value: "Australia/Sydney", label: "Austrália (Sydney)", cityName: "Sydney", offset: "GMT+10" },
  { value: "Australia/Melbourne", label: "Austrália (Melbourne)", cityName: "Melbourne", offset: "GMT+10" },
];

/**
 * Get the city name for a given timezone
 * @param timezone IANA timezone identifier (e.g., "America/Sao_Paulo")
 * @returns Formatted city name (e.g., "São Paulo")
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
 * @returns Formatted label with country and city (e.g., "Brasil (São Paulo)")
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
