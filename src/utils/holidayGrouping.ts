import { Holiday } from '@/types/holiday';

/**
 * Simple date formatter - converts YYYY-MM-DD to DD/MM/YYYY
 */
function formatDateToDDMMYYYY(dateString: string): string {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

export interface HolidayGroup {
  groupId: string | null;
  holidays: Holiday[];
  displayName: string;
  dateRange: string;
  description?: string;
  isPeriod: boolean;
}

/**
 * Groups holidays by their group_id to display periods as single items
 * Individual holidays (group_id = null) are displayed separately
 * 
 * @param holidays Array of holidays to group
 * @returns Array of grouped holidays for display
 */
export function groupHolidaysByPeriod(holidays: Holiday[]): HolidayGroup[] {
  if (!holidays || holidays.length === 0) return [];

  // Group holidays by their group_id
  const grouped = holidays.reduce((acc, holiday) => {
    // Use group_id as key for grouped holidays, or unique key for individual holidays
    const key = holiday.holidayGroupId || `individual_${holiday.id}`;
    
    if (!acc[key]) {
      acc[key] = {
        groupId: holiday.holidayGroupId || null,
        holidays: [],
        displayName: holiday.name,
        description: holiday.description,
      };
    }
    
    acc[key].holidays.push(holiday);
    return acc;
  }, {} as Record<string, Omit<HolidayGroup, 'dateRange' | 'isPeriod'>>);

  // Generate date ranges and determine if it's a period
  return Object.values(grouped).map(group => {
    // Sort holidays by date
    const sortedHolidays = group.holidays.sort((a, b) => 
      new Date(a.holidayDate).getTime() - new Date(b.holidayDate).getTime()
    );
    
    const firstDate = sortedHolidays[0].holidayDate;
    const lastDate = sortedHolidays[sortedHolidays.length - 1].holidayDate;
    const isPeriod = sortedHolidays.length > 1;
    
    const dateRange = isPeriod 
      ? `${formatDateToDDMMYYYY(firstDate)} a ${formatDateToDDMMYYYY(lastDate)}`
      : formatDateToDDMMYYYY(firstDate);
      
    return {
      ...group,
      holidays: sortedHolidays,
      dateRange,
      isPeriod,
    };
  });
}

/**
 * Validate that end date is after or equal to start date
 * @param startDate Start date in YYYY-MM-DD format
 * @param endDate End date in YYYY-MM-DD format
 * @returns true if valid, false otherwise
 */
export function isValidDateRange(startDate: string, endDate: string): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return end >= start;
}