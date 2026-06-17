// Date helper functions

import { getNextAttendanceDate } from "@/api/attendances";
import { getTodayClinic } from "@/utils/timezoneDate";

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return "";
  
  // Handle both ISO date strings and date objects
  let d: Date;
  if (dateStr.includes('T')) {
    // ISO string (e.g. "2026-03-10T00:00:00.000Z" from PostgreSQL DATE)
    // Extract YYYY-MM-DD to avoid UTC interpretation - calendar dates should display as local
    const datePart = dateStr.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      d = new Date(datePart + 'T00:00:00'); // Parse as local time
    } else {
      d = new Date(dateStr);
    }
  } else {
    // Date-only string (YYYY-MM-DD) - parse as local time to avoid timezone issues
    d = new Date(dateStr + 'T00:00:00');
  }
  
  if (isNaN(d.getTime())) return dateStr;
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateWithDayOfWeekBR(dateStr: string): string {
  if (!dateStr) return "";
  
  // Handle both ISO date strings and date objects
  let d: Date;
  if (dateStr.includes('T')) {
    // ISO string - extract YYYY-MM-DD to avoid UTC interpretation
    const datePart = dateStr.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      d = new Date(datePart + 'T00:00:00'); // Parse as local time
    } else {
      d = new Date(dateStr);
    }
  } else {
    // Date-only string (YYYY-MM-DD) - parse as local time to avoid timezone issues
    d = new Date(dateStr + 'T00:00:00');
  }
  
  if (isNaN(d.getTime())) return dateStr;
  
  // Get today's date for comparison using getTodayClinic
  const todayStr = getTodayClinic();
  const today = new Date(todayStr + 'T00:00:00');
  
  // Get tomorrow's date
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Set the input date to midnight for comparison
  const inputDate = new Date(d);
  inputDate.setHours(0, 0, 0, 0);
  
  const daysOfWeek = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
    'Quinta-feira', 'Sexta-feira', 'Sábado'
  ];

  const monthsInPortuguese = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  const dayOfWeek = daysOfWeek[d.getDay()];
  const day = String(d.getDate()).padStart(2, '0');
  const month = monthsInPortuguese[d.getMonth()];
  const year = d.getFullYear();
  
  // Check if it's today or tomorrow
  if (inputDate.getTime() === today.getTime()) {
    return `HOJE - ${dayOfWeek}, ${day} de ${month} de ${year}`;
  } else if (inputDate.getTime() === tomorrow.getTime()) {
    return `AMANHÃ - ${dayOfWeek}, ${day} de ${month} de ${year}`;
  }
  
  return `${dayOfWeek}, ${day} de ${month} de ${year}`;
}

// Get the default scheduling date based on clinic schedule settings
export const getDefaultSchedulingDate = async (): Promise<string> => {
  try {
    const result = await getNextAttendanceDate();
    if (result.success && result.value?.nextDate) {
      return result.value.nextDate;
    }
  } catch (error) {
    console.warn('Error fetching next available date, falling back to next Tuesday:', error);
  }
  
  // Fallback to next Tuesday if API call fails
  const today = getTodayClinic();
  const todayDate = new Date(today + 'T00:00:00');
  const dayOfWeek = todayDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysUntilTuesday = (2 - dayOfWeek + 7) % 7; // 2 = Tuesday
  
  // If today is Tuesday, return today, otherwise calculate next Tuesday
  if (dayOfWeek === 2) {
    return today;
  }
  
  const nextTuesday = new Date(todayDate);
  nextTuesday.setDate(todayDate.getDate() + (daysUntilTuesday || 7));
  
  const year = nextTuesday.getFullYear();
  const month = String(nextTuesday.getMonth() + 1).padStart(2, '0');
  const day = String(nextTuesday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Calculate days a date is overdue (how many days in the past)
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Number of days overdue (0 if date is today or in the future)
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
 * @param scheduledDate - Date object or string date
 * @returns Number of days until the scheduled date (0 or positive)
 */
export const getDaysUntil = (scheduledDate: Date | string): number => {
  try {
    const todayStr = getTodayClinic();
    const today = new Date(todayStr + 'T00:00:00');
    const scheduled = typeof scheduledDate === 'string'
      ? new Date(scheduledDate + 'T00:00:00')
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

// Future: Implement additional date calculations for scheduling and history as needed

/**
 * Get minimum date (today) in YYYY-MM-DD format
 * @returns Today's date string in YYYY-MM-DD format
 */
export const getMinDate = (): string => {
  return getTodayClinic();
};

/**
 * Calculate the number of weeks between today and a scheduled date
 * @param scheduledDate - Date string in YYYY-MM-DD format
 * @returns Number of weeks (rounded) between today and the scheduled date
 */
export const getWeeksUntil = (scheduledDate: string, fromDate?: string): number => {
  try {
    const todayStr = fromDate || getTodayClinic();
    const today = new Date(todayStr + 'T00:00:00');
    const scheduled = new Date(scheduledDate + 'T00:00:00');

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
