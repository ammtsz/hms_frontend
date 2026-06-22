import { groupHolidaysByPeriod, isValidDateRange } from '../holidayGrouping';
import { Holiday } from '@/types/holiday';

describe('Holiday Grouping Utilities', () => {
  const mockHolidays: Holiday[] = [
    {
      id: 1,
      holidayDate: '2026-01-01',
      name: 'New Year',
      description: 'New Year Day',
      holidayGroupId: null,
      createdDate: '2026-01-01',
      updatedDate: '2026-01-01'
    },
    {
      id: 2,
      holidayDate: '2026-12-24',
      name: 'Christmas Period',
      description: 'Christmas celebration',
      holidayGroupId: 'group-123',
      createdDate: '2026-01-01',
      updatedDate: '2026-01-01'
    },
    {
      id: 3,
      holidayDate: '2026-12-25',
      name: 'Christmas Period',
      description: 'Christmas celebration',
      holidayGroupId: 'group-123',
      createdDate: '2026-01-01',
      updatedDate: '2026-01-01'
    },
    {
      id: 4,
      holidayDate: '2026-12-26',
      name: 'Christmas Period',
      description: 'Christmas celebration',
      holidayGroupId: 'group-123',
      createdDate: '2026-01-01',
      updatedDate: '2026-01-01'
    }
  ];

  describe('groupHolidaysByPeriod', () => {
    it('should group holidays correctly', () => {
      const groups = groupHolidaysByPeriod(mockHolidays);
      
      expect(groups).toHaveLength(2);
      
      // Individual holiday
      const individualGroup = groups.find(g => !g.isPeriod);
      expect(individualGroup).toBeDefined();
      expect(individualGroup?.holidays).toHaveLength(1);
      expect(individualGroup?.displayName).toBe('New Year');
      expect(individualGroup?.isPeriod).toBe(false);
      
      // Period group
      const periodGroup = groups.find(g => g.isPeriod);
      expect(periodGroup).toBeDefined();
      expect(periodGroup?.holidays).toHaveLength(3);
      expect(periodGroup?.displayName).toBe('Christmas Period');
      expect(periodGroup?.isPeriod).toBe(true);
      expect(periodGroup?.dateRange).toContain('12/24/2026 to 12/26/2026');
    });

    it('should handle empty array', () => {
      const groups = groupHolidaysByPeriod([]);
      expect(groups).toHaveLength(0);
    });

    it('should sort holidays by date within groups', () => {
      const unsortedHolidays = [mockHolidays[3], mockHolidays[1], mockHolidays[2]]; // Out of order
      const groups = groupHolidaysByPeriod(unsortedHolidays);
      
      const periodGroup = groups.find(g => g.groupId === 'group-123');
      expect(periodGroup?.holidays[0].holidayDate).toBe('2026-12-24');
      expect(periodGroup?.holidays[1].holidayDate).toBe('2026-12-25');
      expect(periodGroup?.holidays[2].holidayDate).toBe('2026-12-26');
    });
  });

  describe('isValidDateRange', () => {
    it('should validate correct date ranges', () => {
      expect(isValidDateRange('2026-01-01', '2026-01-03')).toBe(true);
      expect(isValidDateRange('2026-01-01', '2026-01-01')).toBe(true); // Same date
    });

    it('should reject invalid date ranges', () => {
      expect(isValidDateRange('2026-01-03', '2026-01-01')).toBe(false);
    });
  });

});