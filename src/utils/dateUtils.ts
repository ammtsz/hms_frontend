// Date helper functions

import { getNextAppointmentDate } from "@/api/appointments";
import { getTodayClinic } from "@/utils/timezoneDate";

const DISPLAY_LOCALE = "en-US";

function parseCalendarDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  let d: Date;
  if (dateStr.includes("T")) {
    const datePart = dateStr.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      d = new Date(datePart + "T00:00:00");
    } else {
      d = new Date(dateStr);
    }
  } else {
    d = new Date(dateStr + "T00:00:00");
  }

  return isNaN(d.getTime()) ? null : d;
}

/** Format a calendar date as MM/DD/YYYY (en-US display). */
export function formatDisplayDate(dateStr: string): string {
  const d = parseCalendarDate(dateStr);
  if (!d) return dateStr;

  return d.toLocaleDateString(DISPLAY_LOCALE, {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

/** Format with weekday; uses TODAY/TOMORROW prefixes when applicable. */
export function formatDisplayDateWithDayOfWeek(dateStr: string): string {
  const d = parseCalendarDate(dateStr);
  if (!d) return dateStr;

  const todayStr = getTodayClinic();
  const today = new Date(todayStr + "T00:00:00");
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const inputDate = new Date(d);
  inputDate.setHours(0, 0, 0, 0);

  const longDate = d.toLocaleDateString(DISPLAY_LOCALE, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (inputDate.getTime() === today.getTime()) {
    return `TODAY - ${longDate}`;
  }
  if (inputDate.getTime() === tomorrow.getTime()) {
    return `TOMORROW - ${longDate}`;
  }

  return longDate;
}

// Get the default scheduling date based on clinic schedule settings
export const getDefaultSchedulingDate = async (): Promise<string> => {
  try {
    const result = await getNextAppointmentDate();
    if (result.success && result.value?.nextDate) {
      return result.value.nextDate;
    }
  } catch (error) {
    console.warn("Error fetching next available date, falling back to next Tuesday:", error);
  }

  const today = getTodayClinic();
  const todayDate = new Date(today + "T00:00:00");
  const dayOfWeek = todayDate.getDay();
  const daysUntilTuesday = (2 - dayOfWeek + 7) % 7;

  if (dayOfWeek === 2) {
    return today;
  }

  const nextTuesday = new Date(todayDate);
  nextTuesday.setDate(todayDate.getDate() + (daysUntilTuesday || 7));

  const year = nextTuesday.getFullYear();
  const month = String(nextTuesday.getMonth() + 1).padStart(2, "0");
  const day = String(nextTuesday.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Calculate days a date is overdue (how many days in the past)
 */
export const getDaysOverdue = (dateStr: string): number => {
  try {
    const todayStr = getTodayClinic();
    const today = new Date(todayStr + "T00:00:00");
    const date = new Date(dateStr + "T00:00:00");

    if (isNaN(date.getTime())) {
      return 0;
    }

    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  } catch {
    return 0;
  }
};

/**
 * Calculate days until a scheduled date
 */
export const getDaysUntil = (scheduledDate: Date | string): number => {
  try {
    const todayStr = getTodayClinic();
    const today = new Date(todayStr + "T00:00:00");
    const scheduled =
      typeof scheduledDate === "string"
        ? new Date(scheduledDate + "T00:00:00")
        : scheduledDate;

    if (isNaN(scheduled.getTime())) {
      return 0;
    }

    const diffTime = scheduled.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  } catch {
    return 0;
  }
};

export const getMinDate = (): string => {
  return getTodayClinic();
};

/**
 * Calculate the number of weeks between today and a scheduled date
 */
export const getWeeksUntil = (scheduledDate: string, fromDate?: string): number => {
  try {
    const todayStr = fromDate || getTodayClinic();
    const today = new Date(todayStr + "T00:00:00");
    const scheduled = new Date(scheduledDate + "T00:00:00");

    if (isNaN(scheduled.getTime())) {
      return 0;
    }

    const diffTime = scheduled.getTime() - today.getTime();
    const diffWeeks = diffTime / (1000 * 60 * 60 * 24 * 7);
    return Math.round(diffWeeks);
  } catch {
    return 0;
  }
};
