import { renderHook, act } from '@testing-library/react';
import { useAttendanceForm } from '../useAttendanceForm';
import { useAttendanceBoardState } from '@/features/attendance/hooks/useAttendanceBoardState';
import { usePatients, useCreatePatient } from '@/api/query/hooks/usePatientQueries';
import { useCreateAttendance, useEligibleParentOptions } from '@/api/query/hooks/useAttendanceQueries';
import { useQueryClient } from '@tanstack/react-query';
import { isPatientAlreadyScheduledForAssessment } from '@/utils/businessRules';
import { getDefaultSchedulingDate } from '@/utils/dateUtils';
import { transformPriorityToApi } from '@/utils/apiTransformers';
import type { PatientBasic, Priority } from '@/types/types';

// Helper function to create mock events
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockEvent = (): any => ({ preventDefault: jest.fn() });

// Mock dependencies
jest.mock('@/features/attendance/hooks/useAttendanceBoardState');
jest.mock('@/api/query/hooks/usePatientQueries');
jest.mock('@/api/query/hooks/useAttendanceQueries');
jest.mock('@tanstack/react-query');
jest.mock('@/utils/businessRules');
jest.mock('@/utils/dateUtils');
jest.mock('@/utils/apiTransformers');
jest.mock('@/api/attendances', () => ({
  getAttendancesByDate: jest.fn().mockResolvedValue({ success: true, value: [] }),
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

const mockUseAttendanceBoardState = useAttendanceBoardState as jest.MockedFunction<typeof useAttendanceBoardState>;
const mockUsePatients = usePatients as jest.MockedFunction<typeof usePatients>;
const mockUseCreatePatient = useCreatePatient as jest.MockedFunction<typeof useCreatePatient>;
const mockUseCreateAttendance = useCreateAttendance as jest.MockedFunction<typeof useCreateAttendance>;
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

describe('useAttendanceForm', () => {
  /** Eligible parent attendance id — required in tests for IN_TREATMENT (T) + assessment (matches backend rules). */
  const ELIGIBLE_PARENT_ATTENDANCE_ID = '99';

  const mockPatients: PatientBasic[] = [
    { id: '1', name: 'John Smith', phone: '11999999999', priority: '2', status: 'T' },
    { id: '2', name: 'Emily Williams', phone: '11888888888', priority: '1', status: 'N' },
    { id: '3', name: 'Michael Miller', phone: '11777777777', priority: '3', status: 'A' }
  ];

  const mockQueryClient = {
    invalidateQueries: jest.fn()
  };

  const mockCreatePatientMutation = {
    mutateAsync: jest.fn(),
    isLoading: false,
    error: null
  };

  const mockCreateAttendanceMutation = {
    mutateAsync: jest.fn(),
    isLoading: false,
    error: null
  };

  const defaultMockContext = {
    attendancesByDate: null,
    refreshCurrentDate: jest.fn().mockResolvedValue(undefined)
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAttendanceBoardState.mockReturnValue(defaultMockContext as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUsePatients.mockReturnValue({ data: mockPatients, isLoading: false, error: null } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseQueryClient.mockReturnValue(mockQueryClient as any);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseCreatePatient.mockReturnValue(mockCreatePatientMutation as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseCreateAttendance.mockReturnValue(mockCreateAttendanceMutation as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseEligibleParentOptions.mockReturnValue({ data: { options: [] }, isLoading: false } as any);
    
    // Set up default return values for mutations
    mockCreatePatientMutation.mutateAsync.mockResolvedValue({ id: 'new-patient-1', name: 'New Patient' });
    mockCreateAttendanceMutation.mutateAsync.mockResolvedValue({ id: 123 });
    
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
      const { result } = renderHook(() => useAttendanceForm());

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
        useAttendanceForm({ defaultNotes: 'Custom default notes' })
      );

      expect(result.current.notes).toBe('Custom default notes');
    });

    it('should provide all expected interface methods', () => {
      const { result } = renderHook(() => useAttendanceForm());

      expect(typeof result.current.setSearch).toBe('function');
      expect(typeof result.current.setSelectedPatient).toBe('function');
      expect(typeof result.current.setIsNewPatient).toBe('function');
      expect(typeof result.current.setSelectedTypes).toBe('function');
      expect(typeof result.current.setPriority).toBe('function');
      expect(typeof result.current.setNotes).toBe('function');
      expect(typeof result.current.resetForm).toBe('function');
      expect(typeof result.current.handleRegisterNewAttendance).toBe('function');
      expect(Array.isArray(result.current.filteredPatients)).toBe(true);
    });
  });

  describe('Form state management', () => {
    it('should update search state correctly', () => {
      const { result } = renderHook(() => useAttendanceForm());

      act(() => {
        result.current.setSearch('John');
      });

      expect(result.current.search).toBe('John');
    });

    it('should filter patients based on search', () => {
      const { result } = renderHook(() => useAttendanceForm());

      act(() => {
        result.current.setSearch('John');
      });

      expect(result.current.filteredPatients).toEqual([
        expect.objectContaining({ name: 'John Smith' })
      ]);
    });

    it('should handle case-insensitive filtering', () => {
      const { result } = renderHook(() => useAttendanceForm());

      act(() => {
        result.current.setSearch('EMILY');
      });

      expect(result.current.filteredPatients).toEqual([
        expect.objectContaining({ name: 'Emily Williams' })
      ]);
    });

    it('should update selected patient correctly', () => {
      const { result } = renderHook(() => useAttendanceForm());

      act(() => {
        result.current.setSelectedPatient('John Smith');
      });

      expect(result.current.selectedPatient).toBe('John Smith');
    });

    it('should toggle new patient state', () => {
      const { result } = renderHook(() => useAttendanceForm());

      act(() => {
        result.current.setIsNewPatient(true);
      });

      expect(result.current.isNewPatient).toBe(true);
    });

    it('should manage selected types array', () => {
      const { result } = renderHook(() => useAttendanceForm());

      act(() => {
        result.current.setSelectedTypes(['assessment', 'physiotherapy']);
      });

      expect(result.current.selectedTypes).toEqual(['assessment', 'physiotherapy']);
    });

    it('should update priority correctly', () => {
      const { result } = renderHook(() => useAttendanceForm());

      act(() => {
        result.current.setPriority('1');
      });

      expect(result.current.priority).toBe('1');
    });

    it('should reset form to default state', () => {
      const { result } = renderHook(() => useAttendanceForm());

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
      const { result } = renderHook(() => useAttendanceForm());

      act(() => {
        result.current.setSelectedTypes(['assessment']);
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        const success = await result.current.handleRegisterNewAttendance(mockEvent);
        expect(success).toBe(false);
      });

      expect(result.current.error).toContain('Please enter the patient name');
    });

    it('should validate required fields - missing types', async () => {
      const { result } = renderHook(() => useAttendanceForm());

      act(() => {
        result.current.setSearch('Test Patient');
        result.current.setIsNewPatient(true);
        result.current.setSelectedTypes([]); // Explicitly clear types to test validation
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        const success = await result.current.handleRegisterNewAttendance(mockEvent);
        expect(success).toBe(false);
      });

      expect(result.current.error).toContain('select at least one attendance type');
    });

    it('should validate duplicate patient scheduling', async () => {
      mockIsPatientAlreadyScheduledForAssessment.mockReturnValue(true);

      const { result } = renderHook(() => useAttendanceForm());

      act(() => {
        result.current.setSelectedPatient('John Smith');
        result.current.setSelectedTypes(['assessment']);
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        const success = await result.current.handleRegisterNewAttendance(mockEvent);
        expect(success).toBe(false);
      });

      expect(result.current.error).toContain('already has a scheduled consultation');
    });

    it('should prevent creating existing patient as new', async () => {
      const { result } = renderHook(() => useAttendanceForm());

      act(() => {
        result.current.setSearch('John Smith'); // Existing patient name
        result.current.setIsNewPatient(true);
        result.current.setSelectedTypes(['assessment']);
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        const success = await result.current.handleRegisterNewAttendance(mockEvent);
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
        useAttendanceForm({ showDateField: true, selectedDate: '2024-01-06' })
      );

      expect(result.current.dateSlotError).toContain('assessment consultation');

      (useScheduleSettings as jest.Mock).mockReturnValue({ data: [] });
    });
  });

  describe('Attendance creation workflow', () => {
    it('should create attendance for existing patient successfully', async () => {
      mockCreateAttendanceMutation.mutateAsync.mockResolvedValue({ id: 123 });

      const { result } = renderHook(() => useAttendanceForm());

      act(() => {
        result.current.setSelectedPatient('John Smith');
        result.current.setSelectedTypes(['assessment']);
        result.current.setSelectedParentAttendance(ELIGIBLE_PARENT_ATTENDANCE_ID);
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        const success = await result.current.handleRegisterNewAttendance(mockEvent);
        expect(success).toBe(true);
      });

      expect(mockCreateAttendanceMutation.mutateAsync).toHaveBeenCalledWith({
        patientId: 1,
        attendanceType: 'assessment',
        scheduledDate: '2024-01-15',
        parentAttendanceId: parseInt(ELIGIBLE_PARENT_ATTENDANCE_ID, 10),
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

    it('should create assessment for NEW_PATIENT without parentAttendanceId (first consultation)', async () => {
      mockCreateAttendanceMutation.mutateAsync.mockResolvedValue({ id: 200 });

      const { result } = renderHook(() => useAttendanceForm());

      act(() => {
        result.current.setSelectedPatient('Emily Williams');
        result.current.setSelectedTypes(['assessment']);
      });

      const mockEvent = createMockEvent();

      await act(async () => {
        const success = await result.current.handleRegisterNewAttendance(mockEvent);
        expect(success).toBe(true);
      });

      expect(mockCreateAttendanceMutation.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: 2,
          attendanceType: 'assessment',
          scheduledDate: '2024-01-15',
        }),
      );
      const payload = mockCreateAttendanceMutation.mutateAsync.mock.calls[0][0] as {
        parentAttendanceId?: number;
      };
      expect(payload.parentAttendanceId).toBeUndefined();
    });

    it('should create assessment for DISCHARGED patient without parentAttendanceId (New Complaint)', async () => {
      mockCreateAttendanceMutation.mutateAsync.mockResolvedValue({ id: 201 });

      const { result } = renderHook(() => useAttendanceForm());

      act(() => {
        result.current.setSelectedPatient('Michael Miller');
        result.current.setSelectedTypes(['assessment']);
        result.current.setSelectedParentAttendance('new');
      });

      const mockEvent = createMockEvent();

      await act(async () => {
        const success = await result.current.handleRegisterNewAttendance(mockEvent);
        expect(success).toBe(true);
      });

      expect(mockCreateAttendanceMutation.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: 3,
          attendanceType: 'assessment',
          scheduledDate: '2024-01-15',
        }),
      );
      const payload = mockCreateAttendanceMutation.mutateAsync.mock.calls[0][0] as {
        parentAttendanceId?: number;
      };
      expect(payload.parentAttendanceId).toBeUndefined();
    });

    it('should create new patient and attendance successfully', async () => {
      mockCreatePatientMutation.mutateAsync.mockResolvedValue({ id: 999 });
      mockCreateAttendanceMutation.mutateAsync.mockResolvedValue({ id: 456 });

      const { result } = renderHook(() => useAttendanceForm());

      act(() => {
        result.current.setSearch('New Patient Name');
        result.current.setIsNewPatient(true);
        result.current.setSelectedTypes(['physiotherapy']);
        result.current.setPriority('2');
        result.current.setNotes('Test complaint');
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        const success = await result.current.handleRegisterNewAttendance(mockEvent);
        expect(success).toBe(true);
      });

      expect(mockCreatePatientMutation.mutateAsync).toHaveBeenCalledWith({
        name: 'New Patient Name',
        priority: '2',
        mainConcern: 'Test complaint'
      });

      expect(mockCreateAttendanceMutation.mutateAsync).toHaveBeenCalledWith({
        patientId: 999,
        attendanceType: 'physiotherapy',
        scheduledDate: '2024-01-15'
      });
    });

    it('should handle multiple attendance types', async () => {
      mockCreateAttendanceMutation.mutateAsync.mockResolvedValue({ id: 123 });

      const { result } = renderHook(() => useAttendanceForm());

      act(() => {
        result.current.setSelectedPatient('John Smith');
        result.current.setSelectedTypes(['assessment', 'physiotherapy', 'tens']);
        result.current.setSelectedParentAttendance(ELIGIBLE_PARENT_ATTENDANCE_ID);
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        const success = await result.current.handleRegisterNewAttendance(mockEvent);
        expect(success).toBe(true);
      });

      expect(mockCreateAttendanceMutation.mutateAsync).toHaveBeenCalledTimes(3);
      const parentId = parseInt(ELIGIBLE_PARENT_ATTENDANCE_ID, 10);
      expect(mockCreateAttendanceMutation.mutateAsync).toHaveBeenNthCalledWith(1, {
        patientId: 1,
        attendanceType: 'assessment',
        scheduledDate: '2024-01-15',
        parentAttendanceId: parentId,
      });
      expect(mockCreateAttendanceMutation.mutateAsync).toHaveBeenNthCalledWith(2, {
        patientId: 1,
        attendanceType: 'physiotherapy',
        scheduledDate: '2024-01-15',
        parentAttendanceId: parentId,
      });
      expect(mockCreateAttendanceMutation.mutateAsync).toHaveBeenNthCalledWith(3, {
        patientId: 1,
        attendanceType: 'tens',
        scheduledDate: '2024-01-15',
        parentAttendanceId: parentId,
      });
    });

  });

  describe('Error handling', () => {
    it('should handle patient creation failure', async () => {
      mockCreatePatientMutation.mutateAsync.mockRejectedValue(new Error('Patient creation failed'));

      const { result } = renderHook(() => useAttendanceForm());

      act(() => {
        result.current.setSearch('New Patient');
        result.current.setIsNewPatient(true);
        result.current.setSelectedTypes(['assessment']);
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        const success = await result.current.handleRegisterNewAttendance(mockEvent);
        expect(success).toBe(false);
      });

      expect(result.current.error).toContain('Unexpected error occurred');
    });

    it('should handle attendance creation failure', async () => {
      mockCreateAttendanceMutation.mutateAsync.mockRejectedValue(new Error('Attendance creation failed'));

      const { result } = renderHook(() => useAttendanceForm());

      act(() => {
        result.current.setSelectedPatient('John Smith');
        result.current.setSelectedTypes(['assessment']);
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        const success = await result.current.handleRegisterNewAttendance(mockEvent);
        expect(success).toBe(false);
      });

      expect(result.current.error).toContain('Attendance creation failed');
    });

    it('should display backend validation message when creation fails (e.g. parent attendance required)', async () => {
      const backendMessage =
        'Select the main complaint (previous consultation) related to this appointment. If the list does not appear, refresh the page and try again.';
      mockCreateAttendanceMutation.mutateAsync.mockRejectedValue(new Error(backendMessage));

      const { result } = renderHook(() => useAttendanceForm());

      act(() => {
        result.current.setSelectedPatient('John Smith');
        result.current.setSelectedTypes(['assessment']);
      });

      const mockEvent = createMockEvent();

      await act(async () => {
        const success = await result.current.handleRegisterNewAttendance(mockEvent);
        expect(success).toBe(false);
      });

      expect(result.current.error).toContain('Select the main complaint');
    });

    it('should handle conflict errors specifically', async () => {
      mockCreateAttendanceMutation.mutateAsync.mockRejectedValue(new Error('409 Conflict: Time slot unavailable'));

      const { result } = renderHook(() => useAttendanceForm());

      act(() => {
        result.current.setSelectedPatient('John Smith');
        result.current.setSelectedTypes(['assessment']);
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        const success = await result.current.handleRegisterNewAttendance(mockEvent);
        expect(success).toBe(false);
      });

      expect(result.current.error).toContain('Scheduling conflict detected');
    });
  });

  describe('Callback integration', () => {
    it('should call onRegisterNewAttendance callback on success', async () => {
      const mockCallback = jest.fn();
      mockCreateAttendanceMutation.mutateAsync.mockResolvedValue({ id: 123 });

      const { result } = renderHook(() => 
        useAttendanceForm({ onRegisterNewAttendance: mockCallback })
      );

      act(() => {
        result.current.setSelectedPatient('John Smith');
        result.current.setSelectedTypes(['assessment']);
        result.current.setPriority('1');
        result.current.setSelectedParentAttendance(ELIGIBLE_PARENT_ATTENDANCE_ID);
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        await result.current.handleRegisterNewAttendance(mockEvent);
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
      mockCreateAttendanceMutation.mutateAsync.mockResolvedValue({ id: 123 });

      const { result } = renderHook(() => 
        useAttendanceForm({ onFormSuccess: mockSuccessCallback })
      );

      act(() => {
        result.current.setSelectedPatient('John Smith');
        result.current.setSelectedTypes(['assessment']);
        result.current.setSelectedParentAttendance(ELIGIBLE_PARENT_ATTENDANCE_ID);
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        await result.current.handleRegisterNewAttendance(mockEvent);
      });

      expect(mockSuccessCallback).toHaveBeenCalled();
    });

    it('should not call callbacks on failure', async () => {
      const mockCallback = jest.fn();
      const mockSuccessCallback = jest.fn();
      mockCreateAttendanceMutation.mutateAsync.mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => 
        useAttendanceForm({ 
          onRegisterNewAttendance: mockCallback,
          onFormSuccess: mockSuccessCallback
        })
      );

      act(() => {
        result.current.setSelectedPatient('John Smith');
        result.current.setSelectedTypes(['assessment']);
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        await result.current.handleRegisterNewAttendance(mockEvent);
      });

      expect(mockCallback).not.toHaveBeenCalled();
      expect(mockSuccessCallback).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases and integration', () => {
    it('should handle custom selected date', async () => {
      mockCreateAttendanceMutation.mutateAsync.mockResolvedValue({ id: 123 });

      const { result } = renderHook(() => useAttendanceForm());

      act(() => {
        result.current.setSelectedPatient('John Smith');
        result.current.setSelectedTypes(['assessment']);
        result.current.setSelectedParentAttendance(ELIGIBLE_PARENT_ATTENDANCE_ID);
      });

      const mockEvent = createMockEvent();
      
      await act(async () => {
        const success = await result.current.handleRegisterNewAttendance(mockEvent, '2024-02-01');
        expect(success).toBe(true);
      });

      expect(mockCreateAttendanceMutation.mutateAsync).toHaveBeenCalledWith({
        patientId: 1,
        attendanceType: 'assessment',
        scheduledDate: '2024-02-01',
        parentAttendanceId: parseInt(ELIGIBLE_PARENT_ATTENDANCE_ID, 10),
      });
    });

    it('should handle form submission with isSubmitting state', async () => {
      mockCreateAttendanceMutation.mutateAsync.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ id: 123 }), 100))
      );

      const { result } = renderHook(() => useAttendanceForm());

      act(() => {
        result.current.setSelectedPatient('John Smith');
        result.current.setSelectedTypes(['assessment']);
        result.current.setSelectedParentAttendance(ELIGIBLE_PARENT_ATTENDANCE_ID);
      });

      const mockEvent = createMockEvent();
      
      // Start submission (don't wrap in act to capture intermediate state)
      const submitPromise = result.current.handleRegisterNewAttendance(mockEvent);

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