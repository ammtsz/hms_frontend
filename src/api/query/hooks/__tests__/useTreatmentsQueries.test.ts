import { renderHook, waitFor, act } from '@/utils/testUtils';
import { renderHook as rtlRenderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import {
  useTreatmentsByPatient,
  useDeleteTreatment,
  useInvalidateTreatments,
  useEditTreatments,
} from '../useTreatmentsQueries';
import {
  getTreatmentsByPatient,
  deleteTreatment,
  updateTreatment,
  createTreatment,
} from '@/api/treatments';

// Mock the API functions
jest.mock('@/api/treatments', () => ({
  getTreatmentsByPatient: jest.fn(),
  deleteTreatment: jest.fn(),
  updateTreatment: jest.fn(),
  createTreatment: jest.fn(),
}));

const mockGetTreatmentsByPatient = getTreatmentsByPatient as jest.MockedFunction<typeof getTreatmentsByPatient>;
const mockDeleteTreatment = deleteTreatment as jest.MockedFunction<typeof deleteTreatment>;
const mockUpdateTreatment = updateTreatment as jest.MockedFunction<typeof updateTreatment>;
const mockCreateTreatment = createTreatment as jest.MockedFunction<typeof createTreatment>;

describe('useTreatmentsByPatient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTreatmentPlan = {
    id: 1,
    consultationId: 1,
    appointmentId: 1,
    patientId: 1,
    treatmentType: 'physiotherapy' as const,
    bodyLocation: 'Head',
    startDate: '2025-01-01',
    plannedSessions: 10,
    completedSessions: 3,
    status: 'in_progress',
    durationMinutes: 30,
    color: 'blue',
    notes: 'Treatment going well',
    sessions: [],
    createdDate: '2025-01-01',
    createdTime: '10:00:00',
    updatedDate: '2025-01-01',
    updatedTime: '10:00:00',
  };

  describe('Successful API Response', () => {
    it('fetches treatment sessions successfully', async () => {
      mockGetTreatmentsByPatient.mockResolvedValue({
        success: true,
        value: [mockTreatmentPlan],
      });

      const { result } = renderHook(() => useTreatmentsByPatient(1));

      // Wait for the API call to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.treatments).toEqual([mockTreatmentPlan]);
      expect(result.current.error).toBe(null);
      expect(mockGetTreatmentsByPatient).toHaveBeenCalledWith('1');
    });

    it('handles empty treatment sessions list', async () => {
      mockGetTreatmentsByPatient.mockResolvedValue({
        success: true,
        value: [],
      });

      const { result } = renderHook(() => useTreatmentsByPatient(1));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.treatments).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('handles undefined value in successful response', async () => {
      mockGetTreatmentsByPatient.mockResolvedValue({
        success: true,
        value: undefined,
      });

      const { result } = renderHook(() => useTreatmentsByPatient(1));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.treatments).toEqual([]);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Error Handling', () => {
    it('handles API error response with message', async () => {
      mockGetTreatmentsByPatient.mockResolvedValue({
        success: false,
        error: 'Patient not found',
      });

      const { result } = renderHook(() => useTreatmentsByPatient(1));

      await waitFor(() => {
        expect(result.current.error).toBe('Patient not found');
      }, { timeout: 5000 });

      expect(result.current.treatments).toEqual([]);
    });

    it('handles API error response without message', async () => {
      mockGetTreatmentsByPatient.mockResolvedValue({
        success: false,
      });

      const { result } = renderHook(() => useTreatmentsByPatient(1));

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load treatments');
      }, { timeout: 5000 });

      expect(result.current.treatments).toEqual([]);
    });

    it('handles API rejection', async () => {
      mockGetTreatmentsByPatient.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useTreatmentsByPatient(1));

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      }, { timeout: 5000 });

      expect(result.current.treatments).toEqual([]);
    });
  });



  describe('Patient ID Handling', () => {
    it('does not fetch when patient ID is 0', () => {
      renderHook(() => useTreatmentsByPatient(0));

      expect(mockGetTreatmentsByPatient).not.toHaveBeenCalled();
    });

    it('fetches when patient ID changes', async () => {
      mockGetTreatmentsByPatient.mockResolvedValue({
        success: true,
        value: [mockTreatmentPlan],
      });

      const { rerender } = renderHook(
        ({ patientId }) => useTreatmentsByPatient(patientId),
        { 
          initialProps: { patientId: 1 },
        }
      );

      await waitFor(() => {
        expect(mockGetTreatmentsByPatient).toHaveBeenCalledWith('1');
      });

      // Change patient ID
      rerender({ patientId: 2 });

      await waitFor(() => {
        expect(mockGetTreatmentsByPatient).toHaveBeenCalledWith('2');
      });

      expect(mockGetTreatmentsByPatient).toHaveBeenCalledTimes(2);
    });
  });

  describe('Refetch Functionality', () => {
    it('refetches data when refetch is called', async () => {
      mockGetTreatmentsByPatient.mockResolvedValue({
        success: true,
        value: [mockTreatmentPlan],
      });

      const { result } = renderHook(() => useTreatmentsByPatient(1));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Call refetch
      await act(async () => {
        await result.current.refetch();
      });

      expect(mockGetTreatmentsByPatient).toHaveBeenCalledTimes(2);
      expect(mockGetTreatmentsByPatient).toHaveBeenCalledWith('1');
    });
  });
});

describe('useInvalidateTreatments', () => {
  it('invalidates patient sessions, refetches appointment sessions, and invalidates indicators', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const refetchSpy = jest.spyOn(queryClient, 'refetchQueries');
    const wrapper = ({ children }: { children: ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = rtlRenderHook(() => useInvalidateTreatments(), {
      wrapper,
    });

    act(() => {
      result.current();
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['treatments'],
    });
    expect(refetchSpy).toHaveBeenCalledWith({
      queryKey: ['treatmentsByAppointment'],
    });
  });
});

describe('useEditTreatments', () => {
  const firstSession = {
    id: 1,
    consultationId: 10,
    appointmentId: 20,
    patientId: 1,
    treatmentType: 'physiotherapy' as const,
    bodyLocation: 'Head',
    startDate: '2025-01-01',
    plannedSessions: 10,
    completedSessions: 0,
    status: 'in_progress',
    durationMinutes: 30,
    color: 'blue',
    notes: undefined,
    createdDate: '2025-01-01',
    createdTime: '10:00:00',
    updatedDate: '2025-01-01',
    updatedTime: '10:00:00',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateTreatment.mockResolvedValue({ success: true, value: firstSession });
    mockCreateTreatment.mockResolvedValue({ success: true, value: { ...firstSession, id: 2 } });
  });

  it('creates a new session linked to the current visit appointment', async () => {
    const onClose = jest.fn();
    const onSuccess = jest.fn();
    const setSubmitError = jest.fn();

    const { result } = renderHook(() =>
      useEditTreatments({
        treatmentType: 'physiotherapy',
        firstSession,
        patientId: 1,
        currentAppointmentId: 99,
        onSuccess,
        onClose,
        setSubmitError,
      }),
    );

    await act(async () => {
      await result.current.mutateAsync({
        treatments: [
          {
            locations: ['Neck'],
            color: 'blue',
            duration: 30,
            quantity: 10,
            startDate: '2025-01-01',
          },
        ],
        editSessionIds: [undefined],
      });
    });

    expect(mockCreateTreatment).toHaveBeenCalledWith(
      expect.objectContaining({
        consultationId: 10,
        appointmentId: 20,
        patientId: 1,
        treatmentType: 'physiotherapy',
        bodyLocation: 'Neck',
        reuseAppointmentForFirstSession: true,
        firstSessionAppointmentId: 99,
      }),
    );
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});

describe('useDeleteTreatment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Deletion', () => {
    it('deletes treatment session successfully', async () => {
      mockDeleteTreatment.mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useDeleteTreatment());

      // Initially not pending
      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toBe(null);

      await act(async () => {
        await result.current.mutateAsync('1');
      });

      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toBe(null);
      expect(mockDeleteTreatment).toHaveBeenCalledWith('1');
    });
  });

  describe('API Error Handling', () => {
    it('handles API error response with message', async () => {
      mockDeleteTreatment.mockResolvedValue({
        success: false,
        error: 'Session not found',
      });

      const { result } = renderHook(() => useDeleteTreatment());

      await expect(async () => {
        await act(async () => {
          await result.current.mutateAsync('1');
        });
      }).rejects.toThrow('Session not found');
    });

    it('handles API error response without message', async () => {
      mockDeleteTreatment.mockResolvedValue({
        success: false,
      });

      const { result } = renderHook(() => useDeleteTreatment());

      await expect(async () => {
        await act(async () => {
          await result.current.mutateAsync('1');
        });
      }).rejects.toThrow('Failed to remove treatment');
    });

    it('handles API rejection', async () => {
      mockDeleteTreatment.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useDeleteTreatment());

      await expect(async () => {
        await act(async () => {
          await result.current.mutateAsync('1');
        });
      }).rejects.toThrow('Network error');
    });
  });
});