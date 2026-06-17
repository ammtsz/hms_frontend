import { renderHook, act } from '@testing-library/react';
import { useAgendaCalendar } from "../hooks/useAgendaCalendar";
import { AttendanceStatus } from '@/api/types';

jest.mock('@/api/query/hooks/useAgendaQueries', () => ({
  useAgenda: jest.fn(),
  useRemovePatientFromAgenda: jest.fn(),
  useRefreshAgenda: jest.fn(),
}));

jest.mock('@/stores', () => ({
  useSelectedDateString: jest.fn(),
  useAgendaDayWindowDays: jest.fn(),
  useAgendaStatusFilters: jest.fn(),
  usePatientFilter: jest.fn(),
  useShowNewAttendance: jest.fn(),
  useOpenAssessmentIdx: jest.fn(),
  useOpenPhysiotherapyIdx: jest.fn(),
  useSetSelectedDateString: jest.fn(),
  useSetAgendaDayWindowDays: jest.fn(),
  useSetAgendaStatusFilters: jest.fn(),
  useSetPatientFilter: jest.fn(),
  useSetShowNewAttendance: jest.fn(),
  useSetOpenAssessmentIdx: jest.fn(),
  useSetOpenPhysiotherapyIdx: jest.fn(),
}));

import { useAgenda, useRefreshAgenda } from '@/api/query/hooks/useAgendaQueries';
import {
  useSelectedDateString,
  useAgendaDayWindowDays,
  useAgendaStatusFilters,
  usePatientFilter,
  useShowNewAttendance,
  useOpenAssessmentIdx,
  useOpenPhysiotherapyIdx,
  useSetSelectedDateString,
  useSetAgendaDayWindowDays,
  useSetAgendaStatusFilters,
  useSetPatientFilter,
  useSetShowNewAttendance,
  useSetOpenAssessmentIdx,
  useSetOpenPhysiotherapyIdx,
} from '@/stores';

describe('useAgendaCalendar', () => {
  let mockSetSelectedDate: jest.Mock;
  let mockSetAgendaDayWindowDays: jest.Mock;
  let mockSetAgendaStatusFilters: jest.Mock;
  let mockSetPatientFilter: jest.Mock;
  let mockSetShowNewAttendance: jest.Mock;
  let mockSetOpenAssessmentIdx: jest.Mock;
  let mockSetOpenPhysiotherapyIdx: jest.Mock;
  let mockRefreshAgenda: jest.Mock;

  const mockAgendaData = {
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
    mockSetAgendaDayWindowDays = jest.fn();
    mockSetAgendaStatusFilters = jest.fn();
    mockSetPatientFilter = jest.fn();
    mockSetShowNewAttendance = jest.fn();
    mockSetOpenAssessmentIdx = jest.fn();
    mockSetOpenPhysiotherapyIdx = jest.fn();
    mockRefreshAgenda = jest.fn();

    (useSelectedDateString as jest.Mock).mockReturnValue('2024-01-15');
    (useAgendaDayWindowDays as jest.Mock).mockReturnValue(30);
    (useAgendaStatusFilters as jest.Mock).mockReturnValue([
      AttendanceStatus.SCHEDULED,
    ]);
    (usePatientFilter as jest.Mock).mockReturnValue('');
    (useShowNewAttendance as jest.Mock).mockReturnValue(false);
    (useOpenAssessmentIdx as jest.Mock).mockReturnValue([]);
    (useOpenPhysiotherapyIdx as jest.Mock).mockReturnValue([]);

    (useSetSelectedDateString as jest.Mock).mockReturnValue(mockSetSelectedDate);
    (useSetAgendaDayWindowDays as jest.Mock).mockReturnValue(
      mockSetAgendaDayWindowDays,
    );
    (useSetAgendaStatusFilters as jest.Mock).mockReturnValue(
      mockSetAgendaStatusFilters,
    );
    (useSetPatientFilter as jest.Mock).mockReturnValue(mockSetPatientFilter);
    (useSetShowNewAttendance as jest.Mock).mockReturnValue(
      mockSetShowNewAttendance,
    );
    (useSetOpenAssessmentIdx as jest.Mock).mockReturnValue(mockSetOpenAssessmentIdx);
    (useSetOpenPhysiotherapyIdx as jest.Mock).mockReturnValue(mockSetOpenPhysiotherapyIdx);

    (useAgenda as jest.Mock).mockReturnValue({
      agenda: mockAgendaData,
      isLoading: false,
      error: null,
    });

    (useRefreshAgenda as jest.Mock).mockReturnValue(mockRefreshAgenda);
  });

  describe('Hook Initialization', () => {
    it('returns expected properties', () => {
      const { result } = renderHook(() => useAgendaCalendar());

      expect(result.current.selectedDate).toBe('2024-01-15');
      expect(result.current.agendaDayWindowDays).toBe(30);
      expect(result.current.agendaStatusFilters).toEqual([
        AttendanceStatus.SCHEDULED,
      ]);
      expect(result.current.filteredAgenda.assessment).toHaveLength(2);
      expect(result.current.rangeSummaryText).toContain('Período:');
    });

    it('calls useAgenda with date range and statuses', () => {
      renderHook(() => useAgendaCalendar());

      expect(useAgenda).toHaveBeenCalledWith({
        fromDate: '2024-01-15',
        toDate: '2024-02-13',
        statuses: [AttendanceStatus.SCHEDULED],
      });
    });

    it('omits statuses when filter list is empty (all statuses)', () => {
      (useAgendaStatusFilters as jest.Mock).mockReturnValue([]);

      renderHook(() => useAgendaCalendar());

      expect(useAgenda).toHaveBeenCalledWith({
        fromDate: '2024-01-15',
        toDate: '2024-02-13',
        statuses: undefined,
      });
    });
  });

  describe('Patient filter', () => {
    it('filters patients accent-insensitively', () => {
      (usePatientFilter as jest.Mock).mockReturnValue('joao');

      (useAgenda as jest.Mock).mockReturnValue({
        agenda: {
          assessment: [
            {
              date: '2024-01-15',
              patients: [
                {
                  id: '1',
                  name: 'João Silva',
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

      const { result } = renderHook(() => useAgendaCalendar());

      expect(result.current.filteredAgenda.assessment).toHaveLength(1);
      expect(
        result.current.filteredAgenda.assessment[0]?.patients[0]?.name,
      ).toBe('João Silva');
    });
  });

  describe('Form Success Handler', () => {
    it('closes new attendance modal and triggers refresh on form success', async () => {
      const { result } = renderHook(() => useAgendaCalendar());

      await act(async () => {
        result.current.handleFormSuccess();
      });

      expect(mockSetShowNewAttendance).toHaveBeenCalledWith(false);
      expect(mockRefreshAgenda).toHaveBeenCalled();
    });
  });

  describe('Refresh', () => {
    it('calls refresh query', async () => {
      const { result } = renderHook(() => useAgendaCalendar());

      await act(async () => {
        await result.current.refreshAgenda();
      });

      expect(mockRefreshAgenda).toHaveBeenCalled();
      expect(result.current.isRefreshing).toBe(false);
    });
  });
});
