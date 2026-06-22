/**
 * useAttendanceData Hook Tests
 * 
 * Comprehensive test suite for the consolidated attendance data management hook covering:
 * - Attendance and patient data loading
 * - CRUD operations (create attendance, check-in, delete)
 * - Patient creation with validation
 * - Error handling and edge cases
 * - Utility functions for data filtering and sorting
 */

import { act, cleanup, renderHook } from '@testing-library/react';
import { useAttendanceData } from '../useAttendanceData';
import { PatientPriority, AttendanceType } from '@/api/types';
import { useAttendanceBoardState } from '@/features/attendance/hooks/useAttendanceBoardState';
import { usePatients, useCreatePatient } from '@/api/query/hooks/usePatientQueries';
import { useCreateAttendance, useCheckInAttendance, useDeleteAttendance } from '@/api/query/hooks/useAttendanceQueries';
import { validatePatientData, calculateAge } from '@/utils/patientUtils';
import { transformPriorityToApi } from '@/utils/apiTransformers';
import { sortPatientsByPriority } from '@/utils/businessRules';

// Mock all dependencies
jest.mock('@/features/attendance/hooks/useAttendanceBoardState');
jest.mock('@/api/query/hooks/usePatientQueries');
jest.mock('@/api/query/hooks/useAttendanceQueries');
jest.mock('@/utils/patientUtils');
jest.mock('@/utils/apiTransformers');
jest.mock('@/utils/businessRules');

// createAttendance calls getDayFinalizationStatus → real axios uses a 24h timeout; leaves Jest open.
jest.mock('@/api/day-finalization', () => ({
  getDayFinalizationStatus: jest.fn().mockResolvedValue({
    success: true,
    value: { isFinalized: false },
  }),
}));

jest.mock('@/api/query/hooks/useDayFinalizationQueries', () => ({
  useFetchDayFinalizationStatus: jest.fn().mockReturnValue(
    jest.fn().mockResolvedValue({ isFinalized: false })
  ),
}));

// Mock console to prevent test noise
const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('useAttendanceData', () => {
  // Mock functions
  const mockRefreshCurrentDate = jest.fn();
  const mockOnNewPatientDetected = jest.fn();
  const mockOnCheckInProcessed = jest.fn();
  
  // Mock data
  const mockAttendancesByDate = {
    date: new Date('2024-01-15'),
    assessment: {
      scheduled: [
        { 
          name: 'Patient 1', 
          priority: "2" as const,
          checkedInTime: null,
          onGoingTime: null,
          completedTime: null,
          attendanceId: 1,
          patientId: 101
        }
      ],
      checkedIn: [
        { 
          name: 'Patient 2', 
          priority: "1" as const,
          checkedInTime: '10:00',
          onGoingTime: null,
          completedTime: null,
          attendanceId: 2,
          patientId: 102
        }
      ],
      onGoing: [],
      completed: []
    },
    physiotherapy: {
      scheduled: [],
      checkedIn: [],
      onGoing: [
        { 
          name: 'Patient 3', 
          priority: "1" as const,
          checkedInTime: '09:00',
          onGoingTime: '10:30',
          completedTime: null,
          attendanceId: 3,
          patientId: 103
        }
      ],
      completed: []
    },
    tens: {
      scheduled: [],
      checkedIn: [],
      onGoing: [],
      completed: []
    },
    combined: {
      scheduled: [],
      checkedIn: [],
      onGoing: [],
      completed: []
    }
  };

  const mockPatients = [
    {
      id: '101',
      name: 'Patient 1',
      phone: '11999999999',
      priority: "2" as const,
      status: 'T' as const
    },
    {
      id: '102',
      name: 'Patient 2', 
      phone: '11888888888',
      priority: "1" as const,
      status: 'T' as const
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup hook mocks dynamically
    (useAttendanceBoardState as jest.Mock).mockReturnValue({
      attendancesByDate: mockAttendancesByDate,
      selectedDate: '2024-01-15',
      loading: false,
      error: null,
      refreshCurrentDate: mockRefreshCurrentDate
    });

    (usePatients as jest.Mock).mockReturnValue({
      data: mockPatients,
      isLoading: false,
      error: null
    });

    (useCreateAttendance as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ id: 123 })
    });

    (useCheckInAttendance as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ id: 123 })
    });

    (useDeleteAttendance as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ success: true })
    });

    (useCreatePatient as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({
        id: 999,
        name: 'New Patient',
        phone: '11777777777'
      })
    });

    // Setup utility function mocks
    (validatePatientData as jest.Mock).mockReturnValue({ isValid: true, errors: [] });
    (calculateAge as jest.Mock).mockReturnValue(30);
    (transformPriorityToApi as jest.Mock).mockImplementation(
      (p: string) =>
        ({
          "1": PatientPriority.LEVEL_1,
          "2": PatientPriority.LEVEL_2,
          "3": PatientPriority.LEVEL_3,
          "4": PatientPriority.LEVEL_4,
          "5": PatientPriority.LEVEL_5,
        })[p] ?? PatientPriority.LEVEL_1
    );
    (sortPatientsByPriority as jest.Mock).mockReturnValue(mockPatients);

    mockRefreshCurrentDate.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('Hook Initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useAttendanceData());

      expect(result.current.attendancesByDate).toEqual(mockAttendancesByDate);
      expect(result.current.selectedDate).toBe('2024-01-15');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.patients).toEqual(mockPatients);
    });

    it('should provide all expected interface methods', () => {
      const { result } = renderHook(() => useAttendanceData());

      // Check all methods are functions
      expect(typeof result.current.createAttendance).toBe('function');
      expect(typeof result.current.checkInAttendance).toBe('function');
      expect(typeof result.current.createPatient).toBe('function');
      expect(typeof result.current.deleteAttendance).toBe('function');
      expect(typeof result.current.refreshData).toBe('function');
      expect(typeof result.current.getIncompleteAttendances).toBe('function');
      expect(typeof result.current.getScheduledAbsences).toBe('function');
      expect(typeof result.current.getSortedPatients).toBe('function');
    });

    it('should accept optional callback props', () => {
      const { result } = renderHook(() => useAttendanceData({
        onNewPatientDetected: mockOnNewPatientDetected,
        onCheckInProcessed: mockOnCheckInProcessed
      }));

      // Should initialize normally
      expect(result.current.attendancesByDate).toEqual(mockAttendancesByDate);
      expect(typeof result.current.createPatient).toBe('function');
    });
  });

  describe('Attendance Creation', () => {
    it('should create attendance successfully', async () => {
      const { result } = renderHook(() => useAttendanceData({
        onCheckInProcessed: mockOnCheckInProcessed
      }));

      let createResult: boolean | undefined;
      await act(async () => {
        createResult = await result.current.createAttendance({
          patientId: 101,
          attendanceType: AttendanceType.ASSESSMENT,
          scheduledDate: '2024-01-16'
        });
      });

      const mutateAsync = (useCreateAttendance as jest.Mock)().mutateAsync;
      expect(mutateAsync).toHaveBeenCalledWith({
        patientId: 101,
        attendanceType: 'assessment',
        scheduledDate: '2024-01-16'
      });
      expect(mockRefreshCurrentDate).toHaveBeenCalled();
      expect(mockOnCheckInProcessed).toHaveBeenCalled();
      expect(createResult).toBe(true);
    });

    it('should handle attendance creation failure', async () => {
      (useCreateAttendance as jest.Mock).mockReturnValue({
        mutateAsync: jest.fn().mockRejectedValue(new Error('API Error'))
      });

      const { result } = renderHook(() => useAttendanceData());

      let createResult: boolean | undefined;
      await act(async () => {
        createResult = await result.current.createAttendance({
          patientId: 101,
          attendanceType: AttendanceType.ASSESSMENT
        });
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error creating attendance:', expect.any(Error));
      expect(createResult).toBe(false);
    });

    it('should create attendance without optional parameters', async () => {
      const { result } = renderHook(() => useAttendanceData());

      await act(async () => {
        await result.current.createAttendance({
          patientId: 101,
          attendanceType: AttendanceType.PHYSIOTHERAPY
        });
      });

      const mutateAsync = (useCreateAttendance as jest.Mock)().mutateAsync;
      expect(mutateAsync).toHaveBeenCalledWith({
        patientId: 101,
        attendanceType: 'physiotherapy',
        scheduledDate: undefined
      });
    });
  });

  describe('Check-in Operations', () => {
    it('should check in attendance successfully', async () => {
      const { result } = renderHook(() => useAttendanceData());

      let checkInResult: boolean | undefined;
      await act(async () => {
        checkInResult = await result.current.checkInAttendance({
          attendanceId: 123,
          patientName: 'Test Patient'
        });
      });

      const mutateAsync = (useCheckInAttendance as jest.Mock)().mutateAsync;
      expect(mutateAsync).toHaveBeenCalledWith({
        attendanceId: 123,
        patientName: 'Test Patient'
      });
      expect(mockRefreshCurrentDate).toHaveBeenCalled();
      expect(checkInResult).toBe(true);
    });

    it('should handle check-in failure', async () => {
      (useCheckInAttendance as jest.Mock).mockReturnValue({
        mutateAsync: jest.fn().mockRejectedValue(new Error('Check-in failed'))
      });

      const { result } = renderHook(() => useAttendanceData());

      let checkInResult: boolean | undefined;
      await act(async () => {
        checkInResult = await result.current.checkInAttendance({
          attendanceId: 123,
          patientName: 'Test Patient'
        });
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error checking in:', expect.any(Error));
      expect(checkInResult).toBe(false);
    });
  });

  describe('Patient Creation', () => {
    it('should create patient successfully', async () => {
      const { result } = renderHook(() => useAttendanceData({
        onNewPatientDetected: mockOnNewPatientDetected
      }));

      let createResult!: { success: boolean; patient?: { id: string; name: string }; error?: string };

      await act(async () => {
        createResult = await result.current.createPatient({
          name: 'New Patient',
          phone: '11777777777',
          priority: "2",
          birthDate: '1990-01-15',
          mainConcern: 'Test complaint'
        });
      });

      expect(validatePatientData).toHaveBeenCalledWith({
        name: 'New Patient',
        phone: '11777777777',
        birthDate: '1990-01-15'
      });

      const mutateAsync = (useCreatePatient as jest.Mock)().mutateAsync;
      expect(mutateAsync).toHaveBeenCalledWith({
        name: 'New Patient',
        phone: '11777777777',
        priority: PatientPriority.LEVEL_2,
        birthDate: '1990-01-15',
        mainConcern: 'Test complaint'
      });

      expect(mockOnNewPatientDetected).toHaveBeenCalled();
      expect(createResult.success).toBe(true);
      expect(createResult.patient).toBeDefined();
    });

    it('should handle patient validation failure', async () => {
      (validatePatientData as jest.Mock).mockReturnValue({
        isValid: false,
        errors: ['Name is required', 'Phone is invalid']
      });

      const { result } = renderHook(() => useAttendanceData());

      let createResult!: { success: boolean; error?: string };
      await act(async () => {
        createResult = await result.current.createPatient({
          name: '',
          priority: "2",
          birthDate: '1990-01-15'
        });
      });

      expect(createResult.success).toBe(false);
      expect(createResult.error).toBe('Name is required, Phone is invalid');
      
      const mutateAsync = (useCreatePatient as jest.Mock)().mutateAsync;
      expect(mutateAsync).not.toHaveBeenCalled();
    });

    it('should handle patient creation API failure', async () => {
      (useCreatePatient as jest.Mock).mockReturnValue({
        mutateAsync: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const { result } = renderHook(() => useAttendanceData());

      let createResult!: { success: boolean; error?: string };
      await act(async () => {
        createResult = await result.current.createPatient({
          name: 'Test Patient',
          priority: "2",
          birthDate: '1990-01-15'
        });
      });

      expect(createResult.success).toBe(false);
      expect(createResult.error).toBe('An unexpected error occurred while creating the patient');
      expect(consoleSpy).toHaveBeenCalledWith('Error creating patient:', expect.any(Error));
    });
  });

  describe('Attendance Deletion', () => {
    it('should delete attendance successfully', async () => {
      const { result } = renderHook(() => useAttendanceData());

      let deleteResult: boolean | undefined;
      await act(async () => {
        deleteResult = await result.current.deleteAttendance(123, 'Patient cancelled');
      });

      const mutateAsync = (useDeleteAttendance as jest.Mock)().mutateAsync;
      expect(mutateAsync).toHaveBeenCalledWith({
        attendanceId: 123,
        cancellationReason: 'Patient cancelled'
      });
      expect(mockRefreshCurrentDate).toHaveBeenCalled();
      expect(deleteResult).toBe(true);
    });

    it('should delete attendance without cancellation reason', async () => {
      const { result } = renderHook(() => useAttendanceData());

      await act(async () => {
        await result.current.deleteAttendance(123);
      });

      const mutateAsync = (useDeleteAttendance as jest.Mock)().mutateAsync;
      expect(mutateAsync).toHaveBeenCalledWith({
        attendanceId: 123,
        cancellationReason: undefined
      });
    });

    it('should handle deletion failure', async () => {
      (useDeleteAttendance as jest.Mock).mockReturnValue({
        mutateAsync: jest.fn().mockRejectedValue(new Error('Deletion failed'))
      });

      const { result } = renderHook(() => useAttendanceData());

      let deleteResult: boolean | undefined;
      await act(async () => {
        deleteResult = await result.current.deleteAttendance(123);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error deleting attendance:', expect.any(Error));
      expect(deleteResult).toBe(false);
    });
  });

  describe('Data Refresh', () => {
    it('should refresh data successfully', async () => {
      const { result } = renderHook(() => useAttendanceData());

      await act(async () => {
        await result.current.refreshData();
      });

      expect(mockRefreshCurrentDate).toHaveBeenCalled();
    });
  });

  describe('Utility Functions', () => {
    describe('getIncompleteAttendances', () => {
      it('should return incomplete attendances from all types and statuses', () => {
        const { result } = renderHook(() => useAttendanceData());

        const incompleteAttendances = result.current.getIncompleteAttendances();

        expect(incompleteAttendances).toHaveLength(2); // 1 checked-in assessment + 1 on-going physiotherapy
        expect(incompleteAttendances).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: 'Patient 2', checkedInTime: '10:00' }),
            expect.objectContaining({ name: 'Patient 3', onGoingTime: '10:30' })
          ])
        );
      });

      it('should return empty array when no attendance data', () => {
        (useAttendanceBoardState as jest.Mock).mockReturnValue({
          attendancesByDate: null,
          selectedDate: '2024-01-15',
          loading: false,
          error: null,
          refreshCurrentDate: mockRefreshCurrentDate
        });

        const { result } = renderHook(() => useAttendanceData());

        const incompleteAttendances = result.current.getIncompleteAttendances();

        expect(incompleteAttendances).toEqual([]);
      });
    });

    describe('getScheduledAbsences', () => {
      it('should return scheduled attendances from all types', () => {
        const { result } = renderHook(() => useAttendanceData());

        const scheduledAbsences = result.current.getScheduledAbsences();

        expect(scheduledAbsences).toHaveLength(1); // 1 scheduled assessment
        expect(scheduledAbsences).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: 'Patient 1', attendanceId: 1 })
          ])
        );
      });

      it('should return empty array when no attendance data', () => {
        (useAttendanceBoardState as jest.Mock).mockReturnValue({
          attendancesByDate: null,
          selectedDate: '2024-01-15',
          loading: false,
          error: null,
          refreshCurrentDate: mockRefreshCurrentDate
        });

        const { result } = renderHook(() => useAttendanceData());

        const scheduledAbsences = result.current.getScheduledAbsences();

        expect(scheduledAbsences).toEqual([]);
      });
    });

    describe('getSortedPatients', () => {
      it('should return patients sorted by priority', () => {
        const { result } = renderHook(() => useAttendanceData());

        const sortedPatients = result.current.getSortedPatients();

        expect(sortPatientsByPriority).toHaveBeenCalledWith(mockPatients);
        expect(sortedPatients).toEqual(mockPatients);
      });

      it('should handle empty patient list', () => {
        (usePatients as jest.Mock).mockReturnValue({
          data: [],
          isLoading: false,
          error: null
        });

        const { result } = renderHook(() => useAttendanceData());

        const sortedPatients = result.current.getSortedPatients();

        expect(sortPatientsByPriority).toHaveBeenCalledWith([]);
        expect(sortedPatients).toEqual(mockPatients); // mocked return value
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should handle loading states correctly', () => {
      (useAttendanceBoardState as jest.Mock).mockReturnValue({
        attendancesByDate: null,
        selectedDate: '2024-01-15',
        loading: true,
        error: null,
        refreshCurrentDate: mockRefreshCurrentDate
      });

      const { result } = renderHook(() => useAttendanceData());

      expect(result.current.loading).toBe(true);
    });

    it('should handle error states from attendance management', () => {
      (useAttendanceBoardState as jest.Mock).mockReturnValue({
        attendancesByDate: null,
        selectedDate: '2024-01-15',
        loading: false,
        error: 'Attendance error',
        refreshCurrentDate: mockRefreshCurrentDate
      });

      const { result } = renderHook(() => useAttendanceData());

      expect(result.current.error).toBe('Attendance error');
    });

    it('should handle error states from patients', () => {
      const patientError = new Error('Patient fetch failed');
      (usePatients as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        error: patientError
      });

      const { result } = renderHook(() => useAttendanceData());

      expect(result.current.error).toBe('Patient fetch failed');
    });

    it('should prioritize attendance errors over patient errors', () => {
      const attendanceError = 'Attendance error';
      const patientError = new Error('Patient error');

      (useAttendanceBoardState as jest.Mock).mockReturnValue({
        attendancesByDate: null,
        selectedDate: '2024-01-15',
        loading: false,
        error: attendanceError,
        refreshCurrentDate: mockRefreshCurrentDate
      });

      (usePatients as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        error: patientError
      });

      const { result } = renderHook(() => useAttendanceData());

      expect(result.current.error).toBe(attendanceError);
    });
  });
});