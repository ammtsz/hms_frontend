/**
 * useBoardData Hook Tests
 * 
 * Comprehensive test suite for the consolidated appointment data management hook covering:
 * - Appointment and patient data loading
 * - CRUD operations (create appointment, check-in, delete)
 * - Patient creation with validation
 * - Error handling and edge cases
 * - Utility functions for data filtering and sorting
 */

import { act, cleanup, renderHook } from '@testing-library/react';
import { useBoardData } from '../useBoardData';
import { PatientPriority, AppointmentType } from '@/api/types';
import { useBoardState } from '@/features/board/hooks/useBoardState';
import { usePatients, useCreatePatient } from '@/api/query/hooks/usePatientQueries';
import { useCreateAppointment, useCheckInAppointment, useDeleteAppointment } from '@/api/query/hooks/useAppointmentQueries';
import { validatePatientData, calculateAge } from '@/utils/patientUtils';
import { transformPriorityToApi } from '@/utils/apiTransformers';
import { sortPatientsByPriority } from '@/utils/businessRules';

// Mock all dependencies
jest.mock('@/features/board/hooks/useBoardState');
jest.mock('@/api/query/hooks/usePatientQueries');
jest.mock('@/api/query/hooks/useAppointmentQueries');
jest.mock('@/utils/patientUtils');
jest.mock('@/utils/apiTransformers');
jest.mock('@/utils/businessRules');

// createAppointment calls getDayFinalizationStatus → real axios uses a 24h timeout; leaves Jest open.
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

describe('useBoardData', () => {
  // Mock functions
  const mockRefreshCurrentDate = jest.fn();
  const mockOnNewPatientDetected = jest.fn();
  const mockOnCheckInProcessed = jest.fn();
  
  // Mock data
  const mockAppointmentsByDate = {
    date: new Date('2024-01-15'),
    assessment: {
      scheduled: [
        { 
          name: 'Patient 1', 
          priority: "2" as const,
          checkedInTime: null,
          onGoingTime: null,
          completedTime: null,
          appointmentId: 1,
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
          appointmentId: 2,
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
          appointmentId: 3,
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
    (useBoardState as jest.Mock).mockReturnValue({
      appointmentsByDate: mockAppointmentsByDate,
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

    (useCreateAppointment as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ id: 123 })
    });

    (useCheckInAppointment as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ id: 123 })
    });

    (useDeleteAppointment as jest.Mock).mockReturnValue({
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
      const { result } = renderHook(() => useBoardData());

      expect(result.current.appointmentsByDate).toEqual(mockAppointmentsByDate);
      expect(result.current.selectedDate).toBe('2024-01-15');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.patients).toEqual(mockPatients);
    });

    it('should provide all expected interface methods', () => {
      const { result } = renderHook(() => useBoardData());

      // Check all methods are functions
      expect(typeof result.current.createAppointment).toBe('function');
      expect(typeof result.current.checkInAppointment).toBe('function');
      expect(typeof result.current.createPatient).toBe('function');
      expect(typeof result.current.deleteAppointment).toBe('function');
      expect(typeof result.current.refreshData).toBe('function');
      expect(typeof result.current.getIncompleteAppointments).toBe('function');
      expect(typeof result.current.getScheduledAbsences).toBe('function');
      expect(typeof result.current.getSortedPatients).toBe('function');
    });

    it('should accept optional callback props', () => {
      const { result } = renderHook(() => useBoardData({
        onNewPatientDetected: mockOnNewPatientDetected,
        onCheckInProcessed: mockOnCheckInProcessed
      }));

      // Should initialize normally
      expect(result.current.appointmentsByDate).toEqual(mockAppointmentsByDate);
      expect(typeof result.current.createPatient).toBe('function');
    });
  });

  describe('Appointment Creation', () => {
    it('should create appointment successfully', async () => {
      const { result } = renderHook(() => useBoardData({
        onCheckInProcessed: mockOnCheckInProcessed
      }));

      let createResult: boolean | undefined;
      await act(async () => {
        createResult = await result.current.createAppointment({
          patientId: 101,
          appointmentType: AppointmentType.ASSESSMENT,
          scheduledDate: '2024-01-16'
        });
      });

      const mutateAsync = (useCreateAppointment as jest.Mock)().mutateAsync;
      expect(mutateAsync).toHaveBeenCalledWith({
        patientId: 101,
        appointmentType: 'assessment',
        scheduledDate: '2024-01-16'
      });
      expect(mockRefreshCurrentDate).toHaveBeenCalled();
      expect(mockOnCheckInProcessed).toHaveBeenCalled();
      expect(createResult).toBe(true);
    });

    it('should handle appointment creation failure', async () => {
      (useCreateAppointment as jest.Mock).mockReturnValue({
        mutateAsync: jest.fn().mockRejectedValue(new Error('API Error'))
      });

      const { result } = renderHook(() => useBoardData());

      let createResult: boolean | undefined;
      await act(async () => {
        createResult = await result.current.createAppointment({
          patientId: 101,
          appointmentType: AppointmentType.ASSESSMENT
        });
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error creating appointment:', expect.any(Error));
      expect(createResult).toBe(false);
    });

    it('should create appointment without optional parameters', async () => {
      const { result } = renderHook(() => useBoardData());

      await act(async () => {
        await result.current.createAppointment({
          patientId: 101,
          appointmentType: AppointmentType.PHYSIOTHERAPY
        });
      });

      const mutateAsync = (useCreateAppointment as jest.Mock)().mutateAsync;
      expect(mutateAsync).toHaveBeenCalledWith({
        patientId: 101,
        appointmentType: 'physiotherapy',
        scheduledDate: undefined
      });
    });
  });

  describe('Check-in Operations', () => {
    it('should check in appointment successfully', async () => {
      const { result } = renderHook(() => useBoardData());

      let checkInResult: boolean | undefined;
      await act(async () => {
        checkInResult = await result.current.checkInAppointment({
          appointmentId: 123,
          patientName: 'Test Patient'
        });
      });

      const mutateAsync = (useCheckInAppointment as jest.Mock)().mutateAsync;
      expect(mutateAsync).toHaveBeenCalledWith({
        appointmentId: 123,
        patientName: 'Test Patient'
      });
      expect(mockRefreshCurrentDate).toHaveBeenCalled();
      expect(checkInResult).toBe(true);
    });

    it('should handle check-in failure', async () => {
      (useCheckInAppointment as jest.Mock).mockReturnValue({
        mutateAsync: jest.fn().mockRejectedValue(new Error('Check-in failed'))
      });

      const { result } = renderHook(() => useBoardData());

      let checkInResult: boolean | undefined;
      await act(async () => {
        checkInResult = await result.current.checkInAppointment({
          appointmentId: 123,
          patientName: 'Test Patient'
        });
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error checking in:', expect.any(Error));
      expect(checkInResult).toBe(false);
    });
  });

  describe('Patient Creation', () => {
    it('should create patient successfully', async () => {
      const { result } = renderHook(() => useBoardData({
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

      const { result } = renderHook(() => useBoardData());

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

      const { result } = renderHook(() => useBoardData());

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

  describe('Appointment Deletion', () => {
    it('should delete appointment successfully', async () => {
      const { result } = renderHook(() => useBoardData());

      let deleteResult: boolean | undefined;
      await act(async () => {
        deleteResult = await result.current.deleteAppointment(123, 'Patient cancelled');
      });

      const mutateAsync = (useDeleteAppointment as jest.Mock)().mutateAsync;
      expect(mutateAsync).toHaveBeenCalledWith({
        appointmentId: 123,
        cancellationReason: 'Patient cancelled'
      });
      expect(mockRefreshCurrentDate).toHaveBeenCalled();
      expect(deleteResult).toBe(true);
    });

    it('should delete appointment without cancellation reason', async () => {
      const { result } = renderHook(() => useBoardData());

      await act(async () => {
        await result.current.deleteAppointment(123);
      });

      const mutateAsync = (useDeleteAppointment as jest.Mock)().mutateAsync;
      expect(mutateAsync).toHaveBeenCalledWith({
        appointmentId: 123,
        cancellationReason: undefined
      });
    });

    it('should handle deletion failure', async () => {
      (useDeleteAppointment as jest.Mock).mockReturnValue({
        mutateAsync: jest.fn().mockRejectedValue(new Error('Deletion failed'))
      });

      const { result } = renderHook(() => useBoardData());

      let deleteResult: boolean | undefined;
      await act(async () => {
        deleteResult = await result.current.deleteAppointment(123);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error deleting appointment:', expect.any(Error));
      expect(deleteResult).toBe(false);
    });
  });

  describe('Data Refresh', () => {
    it('should refresh data successfully', async () => {
      const { result } = renderHook(() => useBoardData());

      await act(async () => {
        await result.current.refreshData();
      });

      expect(mockRefreshCurrentDate).toHaveBeenCalled();
    });
  });

  describe('Utility Functions', () => {
    describe('getIncompleteAppointments', () => {
      it('should return incomplete appointments from all types and statuses', () => {
        const { result } = renderHook(() => useBoardData());

        const incompleteAppointments = result.current.getIncompleteAppointments();

        expect(incompleteAppointments).toHaveLength(2); // 1 checked-in assessment + 1 on-going physiotherapy
        expect(incompleteAppointments).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: 'Patient 2', checkedInTime: '10:00' }),
            expect.objectContaining({ name: 'Patient 3', onGoingTime: '10:30' })
          ])
        );
      });

      it('should return empty array when no appointment data', () => {
        (useBoardState as jest.Mock).mockReturnValue({
          appointmentsByDate: null,
          selectedDate: '2024-01-15',
          loading: false,
          error: null,
          refreshCurrentDate: mockRefreshCurrentDate
        });

        const { result } = renderHook(() => useBoardData());

        const incompleteAppointments = result.current.getIncompleteAppointments();

        expect(incompleteAppointments).toEqual([]);
      });
    });

    describe('getScheduledAbsences', () => {
      it('should return scheduled appointments from all types', () => {
        const { result } = renderHook(() => useBoardData());

        const scheduledAbsences = result.current.getScheduledAbsences();

        expect(scheduledAbsences).toHaveLength(1); // 1 scheduled assessment
        expect(scheduledAbsences).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: 'Patient 1', appointmentId: 1 })
          ])
        );
      });

      it('should return empty array when no appointment data', () => {
        (useBoardState as jest.Mock).mockReturnValue({
          appointmentsByDate: null,
          selectedDate: '2024-01-15',
          loading: false,
          error: null,
          refreshCurrentDate: mockRefreshCurrentDate
        });

        const { result } = renderHook(() => useBoardData());

        const scheduledAbsences = result.current.getScheduledAbsences();

        expect(scheduledAbsences).toEqual([]);
      });
    });

    describe('getSortedPatients', () => {
      it('should return patients sorted by priority', () => {
        const { result } = renderHook(() => useBoardData());

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

        const { result } = renderHook(() => useBoardData());

        const sortedPatients = result.current.getSortedPatients();

        expect(sortPatientsByPriority).toHaveBeenCalledWith([]);
        expect(sortedPatients).toEqual(mockPatients); // mocked return value
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should handle loading states correctly', () => {
      (useBoardState as jest.Mock).mockReturnValue({
        appointmentsByDate: null,
        selectedDate: '2024-01-15',
        loading: true,
        error: null,
        refreshCurrentDate: mockRefreshCurrentDate
      });

      const { result } = renderHook(() => useBoardData());

      expect(result.current.loading).toBe(true);
    });

    it('should handle error states from appointment management', () => {
      (useBoardState as jest.Mock).mockReturnValue({
        appointmentsByDate: null,
        selectedDate: '2024-01-15',
        loading: false,
        error: 'Appointment error',
        refreshCurrentDate: mockRefreshCurrentDate
      });

      const { result } = renderHook(() => useBoardData());

      expect(result.current.error).toBe('Appointment error');
    });

    it('should handle error states from patients', () => {
      const patientError = new Error('Patient fetch failed');
      (usePatients as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        error: patientError
      });

      const { result } = renderHook(() => useBoardData());

      expect(result.current.error).toBe('Patient fetch failed');
    });

    it('should prioritize appointment errors over patient errors', () => {
      const appointmentError = 'Appointment error';
      const patientError = new Error('Patient error');

      (useBoardState as jest.Mock).mockReturnValue({
        appointmentsByDate: null,
        selectedDate: '2024-01-15',
        loading: false,
        error: appointmentError,
        refreshCurrentDate: mockRefreshCurrentDate
      });

      (usePatients as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        error: patientError
      });

      const { result } = renderHook(() => useBoardData());

      expect(result.current.error).toBe(appointmentError);
    });
  });
});