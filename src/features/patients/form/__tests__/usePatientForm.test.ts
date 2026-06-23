/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';
import { usePatientForm } from '../hooks/usePatientForm';
import { PatientPriority, PatientStatus } from '@/api/types';

// Create mock functions first
const mockPush = jest.fn();
const mockCreatePatientMutateAsync = jest.fn();
const mockAddPatientToScheduleMutateAsync = jest.fn();
const VALID_BIRTH_DATE = '1990-01-01';

// Mock modules
jest.mock('next/navigation');
jest.mock('@/api/query/hooks/usePatientQueries');
jest.mock('@/api/query/hooks/useScheduleQueries');
jest.mock('@/api/query/hooks/useScheduleSettingQueries');
jest.mock('@/utils/formUtils', () => {
  const actual = jest.requireActual<typeof import('@/utils/formUtils')>('@/utils/formUtils');
  return {
    ...actual,
    formatPhoneNumber: jest.fn(actual.formatPhoneNumber),
  };
});
jest.mock('@/utils/apiTransformers');
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

// Import the mocked modules
import { useRouter } from 'next/navigation';
import { useCreatePatient } from '@/api/query/hooks/usePatientQueries';
import { useAddPatientToSchedule } from '@/api/query/hooks/useScheduleQueries';
import { useScheduleSettings, hasSlotsForAssessmentOnDate } from '@/api/query/hooks/useScheduleSettingQueries';
import { formatPhoneNumber } from '@/utils/formUtils';
import { transformPriorityToApi, transformStatusToApi } from '@/utils/apiTransformers';

// Mock alert
global.alert = jest.fn();



// Cast mocked functions
const mockedFormatPhoneNumber = formatPhoneNumber as jest.MockedFunction<typeof formatPhoneNumber>;
const mockedTransformPriorityToApi = transformPriorityToApi as jest.MockedFunction<typeof transformPriorityToApi>;
const mockedTransformStatusToApi = transformStatusToApi as jest.MockedFunction<typeof transformStatusToApi>;

describe('usePatientForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.alert as jest.Mock).mockClear();
    
    // Setup mock implementations for hooks
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      refresh: jest.fn(),
    });
    
    (useCreatePatient as jest.Mock).mockReturnValue({
      mutateAsync: mockCreatePatientMutateAsync,
      isLoading: false,
    });
    
    (useAddPatientToSchedule as jest.Mock).mockReturnValue({
      mutateAsync: mockAddPatientToScheduleMutateAsync,
      isLoading: false,
    });

    // Schedule settings: by default all days have assessment slots so existing tests pass
    const defaultScheduleSettings = Array.from({ length: 7 }, (_, i) => ({
      id: i + 1,
      dayOfWeek: i,
      startTime: '08:00',
      endTime: '18:00',
      maxConcurrentAssessment: 2,
      maxConcurrentPhysiotherapyTens: 2,
      isActive: true,
      createdAt: '2024-01-01T00:00:00',
      updatedAt: '2024-01-01T00:00:00',
    }));
    (useScheduleSettings as jest.Mock).mockReturnValue({
      data: defaultScheduleSettings,
      isLoading: false,
    });
    (hasSlotsForAssessmentOnDate as jest.Mock).mockImplementation(
      (dateStr: string, settings: { dayOfWeek: number; maxConcurrentAssessment?: number }[] | null) => {
        if (!settings?.length) return true;
        const date = new Date(dateStr + 'T00:00:00');
        const dayOfWeek = date.getDay();
        const setting = settings.find((s) => s.dayOfWeek === dayOfWeek);
        return (setting?.maxConcurrentAssessment ?? 0) > 0;
      },
    );
    
    // Reset mock implementations
    mockCreatePatientMutateAsync.mockResolvedValue({ id: 1, name: 'Test' });
    mockAddPatientToScheduleMutateAsync.mockResolvedValue({});
    mockedFormatPhoneNumber.mockImplementation((phone: string) => phone);
    mockedTransformPriorityToApi.mockReturnValue('1' as any);
    mockedTransformStatusToApi.mockReturnValue('N' as any);
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => usePatientForm());

      expect(result.current.patient.name).toBe('');
      expect(result.current.patient.phone).toBe('');
      expect(result.current.patient.priority).toBe('3');
      expect(result.current.patient.status).toBe('N');
      expect(result.current.patient.mainConcern).toBe('');
      expect(result.current.patient.birthDate).toBe("");
      expect(result.current.patient.dischargeDate).toBeNull();
      expect(result.current.patient.nextAppointmentDates).toEqual([]);
      expect(result.current.patient.previousAppointments).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.validationErrors).toEqual({});
    });
  });

  describe('Form State Management', () => {
    it('should handle text field changes', () => {
      const { result } = renderHook(() => usePatientForm());

      act(() => {
        result.current.handleChange({
          target: { name: 'name', value: 'John Doe', type: 'text' }
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.patient.name).toBe('John Doe');
    });

    it('should handle phone number formatting', () => {
      mockedFormatPhoneNumber.mockReturnValue('(555) 123-4567');
      
      const { result } = renderHook(() => usePatientForm());

      act(() => {
        result.current.handleChange({
          target: { name: 'phone', value: '5551234567', type: 'text' }
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      expect(mockedFormatPhoneNumber).toHaveBeenCalledWith('5551234567');
      expect(result.current.patient.phone).toBe('(555) 123-4567');
    });

    it('should store birth date as entered without defaulting to today', () => {
      const { result } = renderHook(() => usePatientForm());

      act(() => {
        result.current.handleChange({
          target: { name: 'birthDate', value: '2000-02-02', type: 'date' },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.patient.birthDate).toBe('2000-02-02');
    });

    it('should clear birth date to empty string without resetting to today', () => {
      const { result } = renderHook(() => usePatientForm());

      act(() => {
        result.current.handleChange({
          target: { name: 'birthDate', value: '2000-02-02', type: 'date' },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      act(() => {
        result.current.handleChange({
          target: { name: 'birthDate', value: '', type: 'date' },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.patient.birthDate).toBe('');
    });

    it('should store raw birth date value from the date input', () => {
      const { result } = renderHook(() => usePatientForm());

      act(() => {
        result.current.handleChange({
          target: { name: 'birthDate', value: '2000-02-02', type: 'date' },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.patient.birthDate).toBe('2000-02-02');
    });
  });

  describe('Assessment Consultation Changes', () => {
    it('should handle discharge date changes', () => {
      const { result } = renderHook(() => usePatientForm());

      act(() => {
        result.current.handleAssessmentConsultationChange({
          target: { name: 'dischargeDate', value: '2024-12-31' }
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.patient.dischargeDate).toBe('2024-12-31');
    });

    it('should handle discharge date clearing', () => {
      const { result } = renderHook(() => usePatientForm());

      act(() => {
        result.current.handleAssessmentConsultationChange({
          target: { name: 'dischargeDate', value: '' }
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.patient.dischargeDate).toBeNull();
    });

    it('should handle next appointment date changes', () => {
      const { result } = renderHook(() => usePatientForm());

      act(() => {
        result.current.handleAssessmentConsultationChange({
          target: { name: 'firstConsultationDate', value: '2024-02-01' }
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.patient.nextAppointmentDates).toHaveLength(1);
      expect(result.current.patient.nextAppointmentDates[0].date).toBe('2024-02-01');
      expect(result.current.patient.nextAppointmentDates[0].type).toBe('assessment');
    });

    it('should clear next appointment dates when value is empty', () => {
      const { result } = renderHook(() => usePatientForm());

      // First set a date
      act(() => {
        result.current.handleAssessmentConsultationChange({
          target: { name: 'firstConsultationDate', value: '2024-02-01' }
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.patient.nextAppointmentDates).toHaveLength(1);

      // Then clear it
      act(() => {
        result.current.handleAssessmentConsultationChange({
          target: { name: 'firstConsultationDate', value: '' }
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.patient.nextAppointmentDates).toEqual([]);
    });

    it('should handle start date changes via handleChange', () => {
      const { result } = renderHook(() => usePatientForm());

      act(() => {
        result.current.handleChange({
          target: { name: 'startDate', value: '2024-01-15', type: 'date' },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.patient.startDate).toBe('2024-01-15');
    });
  });

  describe('Form Validation', () => {
    it('should validate required name field', () => {
      const { result } = renderHook(() => usePatientForm());

      // Empty name should be invalid
      act(() => {
        result.current.setPatient({
          ...result.current.patient,
          name: ''
        });
      });

      const isValid = result.current.isFormValid();
      expect(isValid).toBe(false);
    });

    it('should validate name field with valid input', () => {
      const { result } = renderHook(() => usePatientForm());

      act(() => {
        result.current.setPatient({
          ...result.current.patient,
          name: 'John Doe',
          birthDate: VALID_BIRTH_DATE,
        });
      });

      const isValid = result.current.isFormValid();
      expect(isValid).toBe(true);
    });

    it('should validate first consultation date has assessment slots', () => {
      (hasSlotsForAssessmentOnDate as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() => usePatientForm());

      act(() => {
        result.current.setPatient({
          ...result.current.patient,
          name: 'John Doe',
          birthDate: '1990-01-01',
          nextAppointmentDates: [{ date: '2024-02-01', type: 'assessment' }],
        });
      });

      const isValid = result.current.isFormValid();
      expect(isValid).toBe(false);
    });

    it('should validate birth date is not in the future', () => {
      const { result } = renderHook(() => usePatientForm());
      const futureDate = '2099-12-31';

      act(() => {
        result.current.setPatient({
          ...result.current.patient,
          name: 'John Doe',
          birthDate: futureDate
        });
      });

      const isValid = result.current.isFormValid();
      expect(isValid).toBe(false);
    });

    it('should validate phone number format when provided', () => {
      const { result } = renderHook(() => usePatientForm());

      // Invalid phone format
      act(() => {
        result.current.setPatient({
          ...result.current.patient,
          name: 'John Doe',
          birthDate: VALID_BIRTH_DATE,
          phone: '123'
        });
      });

      const isValid = result.current.isFormValid();
      expect(isValid).toBe(false);
    });

    it('should accept empty phone number', () => {
      const { result } = renderHook(() => usePatientForm());

      act(() => {
        result.current.setPatient({
          ...result.current.patient,
          name: 'John Doe',
          birthDate: VALID_BIRTH_DATE,
          phone: ''
        });
      });

      const isValid = result.current.isFormValid();
      expect(isValid).toBe(true);
    });

    it('should accept valid phone number format', () => {
      const { result } = renderHook(() => usePatientForm());

      act(() => {
        result.current.setPatient({
          ...result.current.patient,
          name: 'John Doe',
          birthDate: VALID_BIRTH_DATE,
          phone: '(555) 123-4567'
        });
      });

      const isValid = result.current.isFormValid();
      expect(isValid).toBe(true);
    });
  });

  describe('Form Submission', () => {
    it('should prevent submission with invalid form', async () => {
      const { result } = renderHook(() => usePatientForm());

      // Submit form with empty name (invalid)
      const mockEvent = { preventDefault: jest.fn() } as unknown as React.FormEvent<HTMLFormElement>;
      
      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Validation error'));
      expect(mockCreatePatientMutateAsync).not.toHaveBeenCalled();
    });

    it('should submit valid form successfully', async () => {
      const mockCreatedPatient = { id: 1, name: 'John Doe' };
      mockCreatePatientMutateAsync.mockResolvedValue(mockCreatedPatient);
      mockedTransformPriorityToApi.mockReturnValue(PatientPriority.LEVEL_2);
      mockedTransformStatusToApi.mockReturnValue(PatientStatus.NEW_PATIENT);

      const { result } = renderHook(() => usePatientForm());

      // Set valid form data
      act(() => {
        result.current.setPatient({
          ...result.current.patient,
          name: 'John Doe',
          birthDate: VALID_BIRTH_DATE,
          priority: '2',
          status: 'N'
        });
      });

      const mockEvent = { preventDefault: jest.fn() } as unknown as React.FormEvent<HTMLFormElement>;
      
      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockCreatePatientMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          priority: '2',
          patientStatus: 'N',
          birthDate: VALID_BIRTH_DATE,
        })
      );
      expect(result.current.showSuccessModal).toBe(true);
    });

    it('should include phone when provided', async () => {
      const mockCreatedPatient = { id: 1, name: 'John Doe' };
      mockCreatePatientMutateAsync.mockResolvedValue(mockCreatedPatient);
      mockedFormatPhoneNumber.mockReturnValue('(555) 123-4567');

      const { result } = renderHook(() => usePatientForm());

      act(() => {
        result.current.setPatient({
          ...result.current.patient,
          name: 'John Doe',
          birthDate: VALID_BIRTH_DATE,
          phone: '(555) 123-4567'
        });
      });

      const mockEvent = { preventDefault: jest.fn() } as unknown as React.FormEvent<HTMLFormElement>;
      
      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(mockCreatePatientMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '(555) 123-4567'
        })
      );
    });

    it('should include birth date when provided', async () => {
      const mockCreatedPatient = { id: 1, name: 'John Doe' };
      mockCreatePatientMutateAsync.mockResolvedValue(mockCreatedPatient);

      const { result } = renderHook(() => usePatientForm());
      const birthDate = '1990-01-01';

      act(() => {
        result.current.setPatient({
          ...result.current.patient,
          name: 'John Doe',
          birthDate: birthDate
        });
      });

      const mockEvent = { preventDefault: jest.fn() } as unknown as React.FormEvent<HTMLFormElement>;
      
      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(mockCreatePatientMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          birthDate: '1990-01-01'
        })
      );
    });

    it('should include main concern when provided', async () => {
      const mockCreatedPatient = { id: 1, name: 'John Doe' };
      mockCreatePatientMutateAsync.mockResolvedValue(mockCreatedPatient);

      const { result } = renderHook(() => usePatientForm());

      act(() => {
        result.current.setPatient({
          ...result.current.patient,
          name: 'John Doe',
          birthDate: VALID_BIRTH_DATE,
          mainConcern: 'Test complaint'
        });
      });

      const mockEvent = { preventDefault: jest.fn() } as unknown as React.FormEvent<HTMLFormElement>;
      
      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(mockCreatePatientMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          mainConcern: 'Test complaint'
        })
      );
    });

    it('should handle patient creation error', async () => {
      const error = new Error('Creation failed');
      mockCreatePatientMutateAsync.mockRejectedValue(error);

      const { result } = renderHook(() => usePatientForm());

      act(() => {
        result.current.setPatient({
          ...result.current.patient,
          name: 'John Doe',
          birthDate: VALID_BIRTH_DATE,
        });
      });

      const mockEvent = { preventDefault: jest.fn() } as unknown as React.FormEvent<HTMLFormElement>;
      
      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(global.alert).toHaveBeenCalledWith('Error creating patient: Creation failed');
      expect(result.current.isLoading).toBe(false);
    });

    it('should create appointment when next date is provided', async () => {
      const mockCreatedPatient = { id: 1, name: 'John Doe' };
      mockCreatePatientMutateAsync.mockResolvedValue(mockCreatedPatient);
      mockAddPatientToScheduleMutateAsync.mockResolvedValue({});

      const { result } = renderHook(() => usePatientForm());
      const nextDate = '2024-02-01';

      act(() => {
        result.current.setPatient({
          ...result.current.patient,
          name: 'John Doe',
          birthDate: VALID_BIRTH_DATE,
          nextAppointmentDates: [{ date: nextDate, type: 'assessment' }]
        });
      });

      const mockEvent = { preventDefault: jest.fn() } as unknown as React.FormEvent<HTMLFormElement>;
      
      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(mockAddPatientToScheduleMutateAsync).toHaveBeenCalledWith({
        patientId: 1,
        type: 'assessment',
        scheduledDate: '2024-02-01',
        scheduledTime: '20:00',
        notes: 'Appointment created during patient registration'
      });
    });

    it('should try multiple time slots if first one fails', async () => {
      const mockCreatedPatient = { id: 1, name: 'John Doe' };
      mockCreatePatientMutateAsync.mockResolvedValue(mockCreatedPatient);
      
      // First call fails, second succeeds
      mockAddPatientToScheduleMutateAsync
        .mockRejectedValueOnce(new Error('Time slot taken'))
        .mockResolvedValueOnce({});

      const { result } = renderHook(() => usePatientForm());
      const nextDate = '2024-02-01';

      act(() => {
        result.current.setPatient({
          ...result.current.patient,
          name: 'John Doe',
          birthDate: VALID_BIRTH_DATE,
          nextAppointmentDates: [{ date: nextDate, type: 'assessment' }]
        });
      });

      const mockEvent = { preventDefault: jest.fn() } as unknown as React.FormEvent<HTMLFormElement>;
      
      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(mockAddPatientToScheduleMutateAsync).toHaveBeenCalledTimes(2);
      expect(mockAddPatientToScheduleMutateAsync).toHaveBeenNthCalledWith(1, {
        patientId: 1,
        type: 'assessment',
        scheduledDate: '2024-02-01',
        scheduledTime: '20:00',
        notes: 'Appointment created during patient registration'
      });
      expect(mockAddPatientToScheduleMutateAsync).toHaveBeenNthCalledWith(2, {
        patientId: 1,
        type: 'assessment',
        scheduledDate: '2024-02-01',
        scheduledTime: '21:00',
        notes: 'Appointment created during patient registration'
      });
    });

    it('should set appointmentCreationFailed when no time slot succeeds', async () => {
      const mockCreatedPatient = { id: 1, name: 'John Doe' };
      mockCreatePatientMutateAsync.mockResolvedValue(mockCreatedPatient);
      mockAddPatientToScheduleMutateAsync.mockRejectedValue(
        new Error('No time slot available for the selected date.')
      );

      const { result } = renderHook(() => usePatientForm());
      const nextDate = '2024-02-01';

      act(() => {
        result.current.setPatient({
          ...result.current.patient,
          name: 'John Doe',
          birthDate: VALID_BIRTH_DATE,
          nextAppointmentDates: [{ date: nextDate, type: 'assessment' }]
        });
      });

      const mockEvent = { preventDefault: jest.fn() } as unknown as React.FormEvent<HTMLFormElement>;

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.showSuccessModal).toBe(true);
      expect(result.current.scheduledAppointmentDate).toBeNull();
      expect(result.current.appointmentCreationFailed).toEqual({
        requested: true,
        message: 'No time slot available for the selected date.',
      });
    });

    it('should reset form after successful submission', async () => {
      const mockCreatedPatient = { id: 1, name: 'John Doe' };
      mockCreatePatientMutateAsync.mockResolvedValue(mockCreatedPatient);

      const { result } = renderHook(() => usePatientForm());

      act(() => {
        result.current.setPatient({
          ...result.current.patient,
          name: 'John Doe',
          birthDate: VALID_BIRTH_DATE,
          phone: '(555) 123-4567'
        });
      });

      const mockEvent = { preventDefault: jest.fn() } as unknown as React.FormEvent<HTMLFormElement>;
      
      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      // Form should be reset to initial values
      expect(result.current.patient.name).toBe('');
      expect(result.current.patient.phone).toBe('');
      expect(result.current.patient.birthDate).toBe('');
    });

    it('should show success modal after successful submission', async () => {
      const mockCreatedPatient = { id: 1, name: 'John Doe' };
      mockCreatePatientMutateAsync.mockResolvedValue(mockCreatedPatient);

      const { result } = renderHook(() => usePatientForm());

      act(() => {
        result.current.setPatient({
          ...result.current.patient,
          name: 'John Doe',
          birthDate: VALID_BIRTH_DATE,
        });
      });

      expect(result.current.showSuccessModal).toBe(false);

      const mockEvent = { preventDefault: jest.fn() } as unknown as React.FormEvent<HTMLFormElement>;
      
      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.showSuccessModal).toBe(true);
    });

    it('should redirect to patients list when success modal is confirmed', () => {
      const { result } = renderHook(() => usePatientForm());

      act(() => {
        result.current.handleSuccessModalConfirm();
      });

      expect(mockPush).toHaveBeenCalledWith('/patients');
    });
  });

  describe('Key Down Handling', () => {
    it('should prevent Enter key on non-submit elements', () => {
      const { result } = renderHook(() => usePatientForm());
      
      const mockEvent = {
        key: 'Enter',
        target: { tagName: 'INPUT', getAttribute: jest.fn().mockReturnValue(null) },
        preventDefault: jest.fn()
      } as unknown as React.KeyboardEvent<HTMLFormElement>;

      result.current.handleKeyDown(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should allow Enter key on submit button with valid form', () => {
      const { result } = renderHook(() => usePatientForm());

      // Set valid form
      act(() => {
        result.current.setPatient({
          ...result.current.patient,
          name: 'John Doe',
          birthDate: VALID_BIRTH_DATE,
        });
      });

      const mockEvent = {
        key: 'Enter',
        target: { tagName: 'BUTTON', getAttribute: jest.fn().mockReturnValue('submit') },
        preventDefault: jest.fn()
      } as unknown as React.KeyboardEvent<HTMLFormElement>;

      result.current.handleKeyDown(mockEvent);

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent Enter key on submit button with invalid form', () => {
      const { result } = renderHook(() => usePatientForm());

      // Form is invalid (empty name)
      const mockEvent = {
        key: 'Enter',
        target: { tagName: 'BUTTON', getAttribute: jest.fn().mockReturnValue('submit') },
        preventDefault: jest.fn()
      } as unknown as React.KeyboardEvent<HTMLFormElement>;

      result.current.handleKeyDown(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should not interfere with other keys', () => {
      const { result } = renderHook(() => usePatientForm());
      
      const mockEvent = {
        key: 'Tab',
        target: { tagName: 'INPUT' },
        preventDefault: jest.fn()
      } as unknown as React.KeyboardEvent<HTMLFormElement>;

      result.current.handleKeyDown(mockEvent);

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should set loading state during submission', async () => {
      // Mock the mutation to return a resolved promise
      mockCreatePatientMutateAsync.mockResolvedValue({ id: 1, name: 'John Doe' });
      
      const { result } = renderHook(() => usePatientForm());

      act(() => {
        result.current.setPatient({
          ...result.current.patient,
          name: 'John Doe',
          birthDate: VALID_BIRTH_DATE,
        });
      });

      const mockEvent = { preventDefault: jest.fn() } as unknown as React.FormEvent;
      
      // Initial state should not be loading
      expect(result.current.isLoading).toBe(false);
      
      // Submit form and wait for completion
      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      // After successful submission, should not be loading
      expect(result.current.isLoading).toBe(false);
      expect(mockCreatePatientMutateAsync).toHaveBeenCalled();
    });
  });
});