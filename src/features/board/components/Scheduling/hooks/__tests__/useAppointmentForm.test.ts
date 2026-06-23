import { renderHook, act } from '@testing-library/react';
import { useAppointmentForm } from '../useAppointmentForm';
import { useBoardState } from '@/features/board/hooks/useBoardState';
import { usePatients, useCreatePatient } from '@/api/query/hooks/usePatientQueries';
import { useCreateAppointment, useEligibleParentOptions } from '@/api/query/hooks/useAppointmentQueries';
import { useQueryClient } from '@tanstack/react-query';
import { isPatientAlreadyScheduledForAssessment } from '@/utils/businessRules';
import { getDefaultSchedulingDate } from '@/utils/dateUtils';
import { transformPriorityToApi } from '@/utils/apiTransformers';
import type { PatientBasic, Priority } from '@/types/types';

// Helper function to create mock events
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockEvent = (): any => ({ preventDefault: jest.fn() });

// Mock dependencies
jest.mock('@/features/board/hooks/useBoardState');
jest.mock('@/api/query/hooks/usePatientQueries');
jest.mock('@/api/query/hooks/useAppointmentQueries');
jest.mock('@tanstack/react-query');
jest.mock('@/utils/businessRules');
jest.mock('@/utils/dateUtils');
jest.mock('@/utils/apiTransformers');
jest.mock('@/api/appointments', () => ({
  getAppointmentsByDate: jest.fn().mockResolvedValue({ success: true, value: [] }),
  getEligibleParentOptions: jest.fn().mockResolvedValue({ success: true, value: { options: [] } }),
}));
jest.mock('@/api/holidays', () => ({
  checkIfHolidayForTreatmentType: jest.fn().mockResolvedValue({ success: true, value: false }),
}));
jest.mock('@/api/day-finalization', () => ({
  getDayFinalizationStatus: jest.fn().mockResolvedValue({ success: true, value: null }),
}));
jest.mock('@/api/query/hooks/useScheduleSettingQueries', () => {
  const actual = jest.requireActual<typeof import('@/api/query/hooks/useScheduleSettingQueries')>('@/api/query/hooks/useScheduleSettingQueries');
  return {
    ...actual,
    useScheduleSettings: jest.fn().mockReturnValue({ data: [] }),
  };
});

import { useScheduleSettings } from '@/api/query/hooks/useScheduleSettingQueries';

const mockUseAppointmentsBoardState = useBoardState as jest.MockedFunction<typeof useBoardState>;
const mockUsePatients = usePatients as jest.MockedFunction<typeof usePatients>;
const mockUseCreatePatient = useCreatePatient as jest.MockedFunction<typeof useCreatePatient>;
const mockUseCreateAppointment = useCreateAppointment as jest.MockedFunction<typeof useCreateAppointment>;
const mockUseEligibleParentOptions = useEligibleParentOptions as jest.MockedFunction<typeof useEligibleParentOptions>;
const mockUseQueryClient = useQueryClient as jest.MockedFunction<typeof useQueryClient>;
const mockIsPatientAlreadyScheduledForAssessment =
  isPatientAlreadyScheduledForAssessment as jest.MockedFunction<
    typeof isPatientAlreadyScheduledForAssessment
  >;
const mockGetDefaultSchedulingDate = getDefaultSchedulingDate as jest.MockedFunction<typeof getDefaultSchedulingDate>;
const mockTransformPriorityToApi = transformPriorityToApi as jest.MockedFunction<typeof transformPriorityToApi>;

// Mock console methods to prevent test noise
const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('useAppointmentForm', () => {
  /** Eligible parent appointment id — required in tests for IN_TREATMENT (T) + assessment (matches backend rules). */
  const ELIGIBLE_PARENT_APPOINTMENT_ID = '99';

  const mockPatients: PatientBasic[] = [
    { id: '1', name: 'John Smith', phone: '11999999999', priority: '2', status: 'T' },
    { id: '2', name: 'Emily Williams', phone: '11888888888', priority: '1', status: 'N' },
    { id: '3', name: 'Michael Miller', phone: '11777777777', priority: '3', status: 'D' }
  ];

  const mockQueryClient = {
    invalidateQueries: jest.fn()
  };

  const mockCreatePatientMutation = {
    mutateAsync: jest.fn(),
    isLoading: false,
    error: null
  };

  const mockCreateAppointmentMutation = {
    mutateAsync: jest.fn(),
    isLoading: false,
    error: null
  };

  const defaultMockContext = {
    appointmentsByDate: null,
    refreshCurrentDate: jest.fn().mockResolvedValue(undefined)
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAppointmentsBoardState.mockReturnValue(defaultMockContext as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUsePatients.mockReturnValue({ data: mockPatients, isLoading: false, error: null } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseQueryClient.mockReturnValue(mockQueryClient as any);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseCreatePatient.mockReturnValue(mockCreatePatientMutation as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseCreateAppointment.mockReturnValue(mockCreateAppointmentMutation as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseEligibleParentOptions.mockReturnValue({ data: { options: [] }, isLoading: false } as any);
    
    // Set up default return values for mutations
    mockCreatePatientMutation.mutateAsync.mockResolvedValue({ id: 'new-patient-1', name: 'New Patient' });
    mockCreateAppointmentMutation.mutateAsync.mockResolvedValue({ id: 123 });
    
    mockIsPatientAlreadyScheduledForAssessment.mockReturnValue(false);
    mockGetDefaultSchedulingDate.mockResolvedValue('2024-01-15');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockTransformPriorityToApi.mockImplementation((priority: Priority) => priority as any);
    
    consoleSpy.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  describe('Initial state and configuration', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useAppointmentForm());

      expect(result.current.search).toBe('');
      expect(result.current.selectedPatient).toBe('');
      expect(result.current.isNewPatient).toBe(false);
      expect(result.current.selectedTypes).toEqual(['assessment']);
      expect(result.current.priority).toBe('3');
      expect(result.current.notes).toBe('');
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.success).toBeNull();
      expect(result.current.dateSlotError).toBeNull();
    });

    it('should accept custom default notes', () => {
      const { result } = renderHook(() => 
        useAppointmentForm({ defaultNotes: 'Custom default notes' })
      );

      expect(result.current.notes).toBe('Custom default notes');
    });

    it('should provide all expected interface methods', () => {
      const { result } = renderHook(() => useAppointmentForm());

      expect(typeof result.current.setSearch).toBe('function');
      expect(typeof result.current.setSelectedPatient).toBe('function');
      expect(typeof result.current.setIsNewPatient).toBe('function');
      expect(typeof result.current.setSelectedTypes).toBe('function');
      expect(typeof result.current.setPriority).toBe('function');
      expect(typeof result.current.setNotes).toBe('function');
      expect(typeof result.current.resetForm).toBe('function');
      expect(typeof result.current.handleRegisterNewAppointment).toBe('function');
      expect(Array.isArray(result.current.filteredPatients)).toBe(true);
    });
  });

  describe('Form state management', () => {
    it('should update search state correctly', () => {
      const { result } = renderHook(() => useAppointmentForm());

      act(() => {
        result.current.setSearch('John');
      });

      expect(result.current.search).toBe('John');
    });

    it('should filter patients based on search', () => {
      const { result } = renderHook(() => useAppointmentForm());

      act(() => {
        result.current.setSearch('John');
      });

      expect(result.current.filteredPatients).toEqual([
        expect.objectContaining({ name: 'John Smith' })
      ]);
    });

    it('should handle case-insensitive filtering', () => {
      const { result } = renderHook(() => useAppointmentForm());

      act(() => {
        result.current.setSearch('EMILY');
      });

      expect(result.current.filteredPatients).toEqual([
        expect.objectContaining({ name: 'Emily Williams' })
      ]);
    });

    it('should update selected patient correctly', () => {
      const { result } = renderHook(() => useAppointmentForm());

      act(() => {
        result.current.setSelectedPatient('John Smith');
      });

      expect(result.current.selectedPatient).toBe('John Smith');
    });

    it('should toggle new patient state', () => {
      const { result } = renderHook(() => useAppointmentForm());

      act(() => {
        result.current.setIsNewPatient(true);
      });

      expect(result.current.isNewPatient).toBe(true);
    });

    it('should manage selected types array', () => {
      const { result } = renderHook(() => useAppointmentForm());

      act(() => {
        result.current.setSelectedTypes(['assessment', 'physiotherapy']);
      });

      expect(result.current.selectedTypes).toEqual(['assessment', 'physiotherapy']);
    });

    it('should update priority correctly', () => {
      const { result } = renderHook(() => useAppointmentForm());

      act(() => {
        result.current.setPriority('1');
      });

      expect(result.current.priority).toBe('1');
    });

    it('should reset form to default state', () => {
      const { result } = renderHook(() => useAppointmentForm());

      // Set some form values
      act(() => {
        result.current.setSearch('Test Search');
        result.current.setSelectedPatient('Test Patient');
        result.current.setSelectedTypes(['assessment']);
        result.current.setIsNewPatient(true);
        result.current.setNotes('Test Notes');
      });

      // Reset form
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.search).toBe('');
      expect(result.current.selectedPatient).toBe('');
      expect(result.current.selectedTypes).toEqual(['assessment']);
      expect(result.current.isNewPatient).toBe(false);
      expect(result.current.notes).toBe('');
      expect(result.current.error).toBeNull();
      expect(result.current.success).toBeNull();
    });
  });

  describe('Form validation', () => {
    it('should validate required fields - missing name', async () => {
      const { result } = renderHook(() => useAppointmentForm());

      act(() => {
        result.current.setSelectedTypes(['assessment']);
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        const success = await result.current.handleRegisterNewAppointment(mockEvent);
        expect(success).toBe(false);
      });

      expect(result.current.error).toContain('Please enter the patient name');
    });

    it('should validate required fields - missing types', async () => {
      const { result } = renderHook(() => useAppointmentForm());

      act(() => {
        result.current.setSearch('Test Patient');
        result.current.setIsNewPatient(true);
        result.current.setSelectedTypes([]); // Explicitly clear types to test validation
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        const success = await result.current.handleRegisterNewAppointment(mockEvent);
        expect(success).toBe(false);
      });

      expect(result.current.error).toContain('select at least one appointment type');
    });

    it('should validate duplicate patient scheduling', async () => {
      mockIsPatientAlreadyScheduledForAssessment.mockReturnValue(true);

      const { result } = renderHook(() => useAppointmentForm());

      act(() => {
        result.current.setSelectedPatient('John Smith');
        result.current.setSelectedTypes(['assessment']);
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        const success = await result.current.handleRegisterNewAppointment(mockEvent);
        expect(success).toBe(false);
      });

      expect(result.current.error).toContain('already has a scheduled consultation');
    });

    it('should prevent creating existing patient as new', async () => {
      const { result } = renderHook(() => useAppointmentForm());

      act(() => {
        result.current.setSearch('John Smith'); // Existing patient name
        result.current.setIsNewPatient(true);
        result.current.setSelectedTypes(['assessment']);
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        const success = await result.current.handleRegisterNewAppointment(mockEvent);
        expect(success).toBe(false);
      });

      expect(result.current.error).toContain('Patient already registered');
    });

    it('should set dateSlotError when selected date has no slots for selected types', () => {
      const saturdayNoSlots = [
        { dayOfWeek: 6, isActive: true, maxConcurrentAssessment: 0, maxConcurrentPhysiotherapyTens: 0 },
      ];
      (useScheduleSettings as jest.Mock).mockReturnValue({ data: saturdayNoSlots });

      const { result } = renderHook(() =>
        useAppointmentForm({ showDateField: true, selectedDate: '2024-01-06' })
      );

      expect(result.current.dateSlotError).toContain('assessment consultation');

      (useScheduleSettings as jest.Mock).mockReturnValue({ data: [] });
    });
  });

  describe('Appointment creation workflow', () => {
    it('should create appointment for existing patient successfully', async () => {
      mockCreateAppointmentMutation.mutateAsync.mockResolvedValue({ id: 123 });

      const { result } = renderHook(() => useAppointmentForm());

      act(() => {
        result.current.setSelectedPatient('John Smith');
        result.current.setSelectedTypes(['assessment']);
        result.current.setSelectedParentAppointment(ELIGIBLE_PARENT_APPOINTMENT_ID);
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        const success = await result.current.handleRegisterNewAppointment(mockEvent);
        expect(success).toBe(true);
      });

      expect(mockCreateAppointmentMutation.mutateAsync).toHaveBeenCalledWith({
        patientId: 1,
        appointmentType: 'assessment',
        scheduledDate: '2024-01-15',
        parentAppointmentId: parseInt(ELIGIBLE_PARENT_APPOINTMENT_ID, 10),
      });

      // Add delay to check if success is set asynchronously
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      
      // Success state is reset after form submission, so we verify through other means
      // The function should return true and make the expected calls
      expect(defaultMockContext.refreshCurrentDate).toHaveBeenCalled();
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['schedule']
      });
    });

    it('should create assessment for NEW_PATIENT without parentAppointmentId (first consultation)', async () => {
      mockCreateAppointmentMutation.mutateAsync.mockResolvedValue({ id: 200 });

      const { result } = renderHook(() => useAppointmentForm());

      act(() => {
        result.current.setSelectedPatient('Emily Williams');
        result.current.setSelectedTypes(['assessment']);
      });

      const mockEvent = createMockEvent();

      await act(async () => {
        const success = await result.current.handleRegisterNewAppointment(mockEvent);
        expect(success).toBe(true);
      });

      expect(mockCreateAppointmentMutation.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: 2,
          appointmentType: 'assessment',
          scheduledDate: '2024-01-15',
        }),
      );
      const payload = mockCreateAppointmentMutation.mutateAsync.mock.calls[0][0] as {
        parentAppointmentId?: number;
      };
      expect(payload.parentAppointmentId).toBeUndefined();
    });

    it('should create assessment for DISCHARGED patient without parentAppointmentId (New Complaint)', async () => {
      mockCreateAppointmentMutation.mutateAsync.mockResolvedValue({ id: 201 });

      const { result } = renderHook(() => useAppointmentForm());

      act(() => {
        result.current.setSelectedPatient('Michael Miller');
        result.current.setSelectedTypes(['assessment']);
        result.current.setSelectedParentAppointment('new');
      });

      const mockEvent = createMockEvent();

      await act(async () => {
        const success = await result.current.handleRegisterNewAppointment(mockEvent);
        expect(success).toBe(true);
      });

      expect(mockCreateAppointmentMutation.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: 3,
          appointmentType: 'assessment',
          scheduledDate: '2024-01-15',
        }),
      );
      const payload = mockCreateAppointmentMutation.mutateAsync.mock.calls[0][0] as {
        parentAppointmentId?: number;
      };
      expect(payload.parentAppointmentId).toBeUndefined();
    });

    it('should create new patient and appointment successfully', async () => {
      mockCreatePatientMutation.mutateAsync.mockResolvedValue({ id: 999 });
      mockCreateAppointmentMutation.mutateAsync.mockResolvedValue({ id: 456 });

      const { result } = renderHook(() => useAppointmentForm());

      act(() => {
        result.current.setSearch('New Patient Name');
        result.current.setIsNewPatient(true);
        result.current.setSelectedTypes(['physiotherapy']);
        result.current.setPriority('2');
        result.current.setNotes('Test complaint');
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        const success = await result.current.handleRegisterNewAppointment(mockEvent);
        expect(success).toBe(true);
      });

      expect(mockCreatePatientMutation.mutateAsync).toHaveBeenCalledWith({
        name: 'New Patient Name',
        priority: '2',
        mainConcern: 'Test complaint'
      });

      expect(mockCreateAppointmentMutation.mutateAsync).toHaveBeenCalledWith({
        patientId: 999,
        appointmentType: 'physiotherapy',
        scheduledDate: '2024-01-15'
      });
    });

    it('should handle multiple appointment types', async () => {
      mockCreateAppointmentMutation.mutateAsync.mockResolvedValue({ id: 123 });

      const { result } = renderHook(() => useAppointmentForm());

      act(() => {
        result.current.setSelectedPatient('John Smith');
        result.current.setSelectedTypes(['assessment', 'physiotherapy', 'tens']);
        result.current.setSelectedParentAppointment(ELIGIBLE_PARENT_APPOINTMENT_ID);
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        const success = await result.current.handleRegisterNewAppointment(mockEvent);
        expect(success).toBe(true);
      });

      expect(mockCreateAppointmentMutation.mutateAsync).toHaveBeenCalledTimes(3);
      const parentId = parseInt(ELIGIBLE_PARENT_APPOINTMENT_ID, 10);
      expect(mockCreateAppointmentMutation.mutateAsync).toHaveBeenNthCalledWith(1, {
        patientId: 1,
        appointmentType: 'assessment',
        scheduledDate: '2024-01-15',
        parentAppointmentId: parentId,
      });
      expect(mockCreateAppointmentMutation.mutateAsync).toHaveBeenNthCalledWith(2, {
        patientId: 1,
        appointmentType: 'physiotherapy',
        scheduledDate: '2024-01-15',
        parentAppointmentId: parentId,
      });
      expect(mockCreateAppointmentMutation.mutateAsync).toHaveBeenNthCalledWith(3, {
        patientId: 1,
        appointmentType: 'tens',
        scheduledDate: '2024-01-15',
        parentAppointmentId: parentId,
      });
    });

  });

  describe('Error handling', () => {
    it('should handle patient creation failure', async () => {
      mockCreatePatientMutation.mutateAsync.mockRejectedValue(new Error('Patient creation failed'));

      const { result } = renderHook(() => useAppointmentForm());

      act(() => {
        result.current.setSearch('New Patient');
        result.current.setIsNewPatient(true);
        result.current.setSelectedTypes(['assessment']);
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        const success = await result.current.handleRegisterNewAppointment(mockEvent);
        expect(success).toBe(false);
      });

      expect(result.current.error).toContain('Unexpected error occurred');
    });

    it('should handle appointment creation failure', async () => {
      mockCreateAppointmentMutation.mutateAsync.mockRejectedValue(new Error('Appointment creation failed'));

      const { result } = renderHook(() => useAppointmentForm());

      act(() => {
        result.current.setSelectedPatient('John Smith');
        result.current.setSelectedTypes(['assessment']);
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        const success = await result.current.handleRegisterNewAppointment(mockEvent);
        expect(success).toBe(false);
      });

      expect(result.current.error).toContain('Appointment creation failed');
    });

    it('should display backend validation message when creation fails (e.g. parent appointment required)', async () => {
      const backendMessage =
        'Select the main complaint (previous consultation) related to this appointment. If the list does not appear, refresh the page and try again.';
      mockCreateAppointmentMutation.mutateAsync.mockRejectedValue(new Error(backendMessage));

      const { result } = renderHook(() => useAppointmentForm());

      act(() => {
        result.current.setSelectedPatient('John Smith');
        result.current.setSelectedTypes(['assessment']);
      });

      const mockEvent = createMockEvent();

      await act(async () => {
        const success = await result.current.handleRegisterNewAppointment(mockEvent);
        expect(success).toBe(false);
      });

      expect(result.current.error).toContain('Select the main complaint');
    });

    it('should handle conflict errors specifically', async () => {
      mockCreateAppointmentMutation.mutateAsync.mockRejectedValue(new Error('409 Conflict: Time slot unavailable'));

      const { result } = renderHook(() => useAppointmentForm());

      act(() => {
        result.current.setSelectedPatient('John Smith');
        result.current.setSelectedTypes(['assessment']);
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        const success = await result.current.handleRegisterNewAppointment(mockEvent);
        expect(success).toBe(false);
      });

      expect(result.current.error).toContain('Scheduling conflict detected');
    });
  });

  describe('Callback integration', () => {
    it('should call onRegisterNewAppointment callback on success', async () => {
      const mockCallback = jest.fn();
      mockCreateAppointmentMutation.mutateAsync.mockResolvedValue({ id: 123 });

      const { result } = renderHook(() => 
        useAppointmentForm({ onRegisterNewAppointment: mockCallback })
      );

      act(() => {
        result.current.setSelectedPatient('John Smith');
        result.current.setSelectedTypes(['assessment']);
        result.current.setPriority('1');
        result.current.setSelectedParentAppointment(ELIGIBLE_PARENT_APPOINTMENT_ID);
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        await result.current.handleRegisterNewAppointment(mockEvent);
      });

      expect(mockCallback).toHaveBeenCalledWith(
        'John Smith',
        ['assessment'],
        false, // isNew
        '1', // priority
        '2024-01-15' // date
      );
    });

    it('should call onFormSuccess callback on success', async () => {
      const mockSuccessCallback = jest.fn();
      mockCreateAppointmentMutation.mutateAsync.mockResolvedValue({ id: 123 });

      const { result } = renderHook(() => 
        useAppointmentForm({ onFormSuccess: mockSuccessCallback })
      );

      act(() => {
        result.current.setSelectedPatient('John Smith');
        result.current.setSelectedTypes(['assessment']);
        result.current.setSelectedParentAppointment(ELIGIBLE_PARENT_APPOINTMENT_ID);
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        await result.current.handleRegisterNewAppointment(mockEvent);
      });

      expect(mockSuccessCallback).toHaveBeenCalled();
    });

    it('should not call callbacks on failure', async () => {
      const mockCallback = jest.fn();
      const mockSuccessCallback = jest.fn();
      mockCreateAppointmentMutation.mutateAsync.mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => 
        useAppointmentForm({ 
          onRegisterNewAppointment: mockCallback,
          onFormSuccess: mockSuccessCallback
        })
      );

      act(() => {
        result.current.setSelectedPatient('John Smith');
        result.current.setSelectedTypes(['assessment']);
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        await result.current.handleRegisterNewAppointment(mockEvent);
      });

      expect(mockCallback).not.toHaveBeenCalled();
      expect(mockSuccessCallback).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases and integration', () => {
    it('should handle custom selected date', async () => {
      mockCreateAppointmentMutation.mutateAsync.mockResolvedValue({ id: 123 });

      const { result } = renderHook(() => useAppointmentForm());

      act(() => {
        result.current.setSelectedPatient('John Smith');
        result.current.setSelectedTypes(['assessment']);
        result.current.setSelectedParentAppointment(ELIGIBLE_PARENT_APPOINTMENT_ID);
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        const success = await result.current.handleRegisterNewAppointment(mockEvent, '2024-02-01');
        expect(success).toBe(true);
      });

      expect(mockCreateAppointmentMutation.mutateAsync).toHaveBeenCalledWith({
        patientId: 1,
        appointmentType: 'assessment',
        scheduledDate: '2024-02-01',
        parentAppointmentId: parseInt(ELIGIBLE_PARENT_APPOINTMENT_ID, 10),
      });
    });

    it('should handle form submission with isSubmitting state', async () => {
      mockCreateAppointmentMutation.mutateAsync.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ id: 123 }), 100))
      );

      const { result } = renderHook(() => useAppointmentForm());

      act(() => {
        result.current.setSelectedPatient('John Smith');
        result.current.setSelectedTypes(['assessment']);
        result.current.setSelectedParentAppointment(ELIGIBLE_PARENT_APPOINTMENT_ID);
      });

      const mockEvent = createMockEvent();
      
      // Start submission (don't wrap in act to capture intermediate state)
      const submitPromise = result.current.handleRegisterNewAppointment(mockEvent);

      // Wait a moment for isSubmitting to be set to true
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      // Check that isSubmitting is true during submission
      expect(result.current.isSubmitting).toBe(true);

      // Wait for completion
      await act(async () => {
        await submitPromise;
      });

      // Check that isSubmitting is false after completion
      expect(result.current.isSubmitting).toBe(false);
    });
  });
});