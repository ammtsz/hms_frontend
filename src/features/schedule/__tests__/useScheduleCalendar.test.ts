import { renderHook, act } from '@testing-library/react';
import { useScheduleCalendar } from "../hooks/useScheduleCalendar";
import { AttendanceStatus } from '@/api/types';

jest.mock('@/api/query/hooks/useScheduleQueries', () => ({
  useSchedule: jest.fn(),
  useRemovePatientFromSchedule: jest.fn(),
  useRefreshSchedule: jest.fn(),
}));

jest.mock('@/stores', () => ({
  useSelectedDateString: jest.fn(),
  useScheduleDayWindowDays: jest.fn(),
  useScheduleStatusFilters: jest.fn(),
  usePatientFilter: jest.fn(),
  useShowNewAttendance: jest.fn(),
  useOpenAssessmentIdx: jest.fn(),
  useOpenPhysiotherapyIdx: jest.fn(),
  useSetSelectedDateString: jest.fn(),
  useSetScheduleDayWindowDays: jest.fn(),
  useSetScheduleStatusFilters: jest.fn(),
  useSetPatientFilter: jest.fn(),
  useSetShowNewAttendance: jest.fn(),
  useSetOpenAssessmentIdx: jest.fn(),
  useSetOpenPhysiotherapyIdx: jest.fn(),
}));

import { useSchedule, useRefreshSchedule } from '@/api/query/hooks/useScheduleQueries';
import {
  useSelectedDateString,
  useScheduleDayWindowDays,
  useScheduleStatusFilters,
  usePatientFilter,
  useShowNewAttendance,
  useOpenAssessmentIdx,
  useOpenPhysiotherapyIdx,
  useSetSelectedDateString,
  useSetScheduleDayWindowDays,
  useSetScheduleStatusFilters,
  useSetPatientFilter,
  useSetShowNewAttendance,
  useSetOpenAssessmentIdx,
  useSetOpenPhysiotherapyIdx,
} from '@/stores';

describe('useScheduleCalendar', () => {
  let mockSetSelectedDate: jest.Mock;
  let mockSetScheduleDayWindowDays: jest.Mock;
  let mockSetScheduleStatusFilters: jest.Mock;
  let mockSetPatientFilter: jest.Mock;
  let mockSetShowNewAttendance: jest.Mock;
  let mockSetOpenAssessmentIdx: jest.Mock;
  let mockSetOpenPhysiotherapyIdx: jest.Mock;
  let mockRefreshSchedule: jest.Mock;

  const mockScheduleData = {
    assessment: [
      {
        date: '2024-01-15',
        patients: [
          {
            id: '1',
            name: 'John Doe',
            attendanceId: 100,
            attendanceType: 'assessment' as const,
            priority: '1' as const,
            attendanceStatus: AttendanceStatus.SCHEDULED,
          },
        ],
      },
      {
        date: '2024-01-16',
        patients: [
          {
            id: '2',
            name: 'Jane Smith',
            attendanceId: 101,
            attendanceType: 'assessment' as const,
            priority: '2' as const,
            attendanceStatus: AttendanceStatus.SCHEDULED,
          },
        ],
      },
    ],
    physiotherapy: [
      {
        date: '2024-01-15',
        patients: [
          {
            id: '3',
            name: 'Bob Wilson',
            attendanceId: 102,
            attendanceType: 'physiotherapy' as const,
            priority: '3' as const,
            attendanceStatus: AttendanceStatus.SCHEDULED,
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockSetSelectedDate = jest.fn();
    mockSetScheduleDayWindowDays = jest.fn();
    mockSetScheduleStatusFilters = jest.fn();
    mockSetPatientFilter = jest.fn();
    mockSetShowNewAttendance = jest.fn();
    mockSetOpenAssessmentIdx = jest.fn();
    mockSetOpenPhysiotherapyIdx = jest.fn();
    mockRefreshSchedule = jest.fn();

    (useSelectedDateString as jest.Mock).mockReturnValue('2024-01-15');
    (useScheduleDayWindowDays as jest.Mock).mockReturnValue(30);
    (useScheduleStatusFilters as jest.Mock).mockReturnValue([
      AttendanceStatus.SCHEDULED,
    ]);
    (usePatientFilter as jest.Mock).mockReturnValue('');
    (useShowNewAttendance as jest.Mock).mockReturnValue(false);
    (useOpenAssessmentIdx as jest.Mock).mockReturnValue([]);
    (useOpenPhysiotherapyIdx as jest.Mock).mockReturnValue([]);

    (useSetSelectedDateString as jest.Mock).mockReturnValue(mockSetSelectedDate);
    (useSetScheduleDayWindowDays as jest.Mock).mockReturnValue(
      mockSetScheduleDayWindowDays,
    );
    (useSetScheduleStatusFilters as jest.Mock).mockReturnValue(
      mockSetScheduleStatusFilters,
    );
    (useSetPatientFilter as jest.Mock).mockReturnValue(mockSetPatientFilter);
    (useSetShowNewAttendance as jest.Mock).mockReturnValue(
      mockSetShowNewAttendance,
    );
    (useSetOpenAssessmentIdx as jest.Mock).mockReturnValue(mockSetOpenAssessmentIdx);
    (useSetOpenPhysiotherapyIdx as jest.Mock).mockReturnValue(mockSetOpenPhysiotherapyIdx);

    (useSchedule as jest.Mock).mockReturnValue({
      schedule: mockScheduleData,
      isLoading: false,
      error: null,
    });

    (useRefreshSchedule as jest.Mock).mockReturnValue(mockRefreshSchedule);
  });

  describe('Hook Initialization', () => {
    it('returns expected properties', () => {
      const { result } = renderHook(() => useScheduleCalendar());

      expect(result.current.selectedDate).toBe('2024-01-15');
      expect(result.current.scheduleDayWindowDays).toBe(30);
      expect(result.current.scheduleStatusFilters).toEqual([
        AttendanceStatus.SCHEDULED,
      ]);
      expect(result.current.filteredSchedule.assessment).toHaveLength(2);
      expect(result.current.rangeSummaryText).toContain('Period:');
    });

    it('calls useSchedule with date range and statuses', () => {
      renderHook(() => useScheduleCalendar());

      expect(useSchedule).toHaveBeenCalledWith({
        fromDate: '2024-01-15',
        toDate: '2024-02-13',
        statuses: [AttendanceStatus.SCHEDULED],
      });
    });

    it('omits statuses when filter list is empty (all statuses)', () => {
      (useScheduleStatusFilters as jest.Mock).mockReturnValue([]);

      renderHook(() => useScheduleCalendar());

      expect(useSchedule).toHaveBeenCalledWith({
        fromDate: '2024-01-15',
        toDate: '2024-02-13',
        statuses: undefined,
      });
    });
  });

  describe('Patient filter', () => {
    it('filters patients accent-insensitively', () => {
      (usePatientFilter as jest.Mock).mockReturnValue('john');

      (useSchedule as jest.Mock).mockReturnValue({
        schedule: {
          assessment: [
            {
              date: '2024-01-15',
              patients: [
                {
                  id: '1',
                  name: 'John Smith',
                  attendanceId: 100,
                  attendanceType: 'assessment' as const,
                  priority: '1' as const,
                  attendanceStatus: AttendanceStatus.SCHEDULED,
                },
              ],
            },
          ],
          physiotherapy: [],
        },
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useScheduleCalendar());

      expect(result.current.filteredSchedule.assessment).toHaveLength(1);
      expect(
        result.current.filteredSchedule.assessment[0]?.patients[0]?.name,
      ).toBe('John Smith');
    });
  });

  describe('Form Success Handler', () => {
    it('closes new attendance modal and triggers refresh on form success', async () => {
      const { result } = renderHook(() => useScheduleCalendar());

      await act(async () => {
        result.current.handleFormSuccess();
      });

      expect(mockSetShowNewAttendance).toHaveBeenCalledWith(false);
      expect(mockRefreshSchedule).toHaveBeenCalled();
    });
  });

  describe('Refresh', () => {
    it('calls refresh query', async () => {
      const { result } = renderHook(() => useScheduleCalendar());

      await act(async () => {
        await result.current.refreshSchedule();
      });

      expect(mockRefreshSchedule).toHaveBeenCalled();
      expect(result.current.isRefreshing).toBe(false);
    });
  });
});
