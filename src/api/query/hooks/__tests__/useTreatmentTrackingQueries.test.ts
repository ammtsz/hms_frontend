import React, { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useCreateTreatment,
  useBulkCreateTreatments,
} from '../useTreatmentTrackingQueries';
import { treatmentTrackingKeys } from '@/api/query/keys/treatmentTrackingKeys';
import * as treatmentsApi from '@/api/treatments';

// Mock the API module
jest.mock('@/api/treatments');

const mockedTreatmentsApi = treatmentsApi as jest.Mocked<typeof treatmentsApi>;

import { createMockTreatmentResponse } from '@/testFixtures/physiotherapyContext';

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  return Wrapper;
};

describe('useTreatmentTrackingQueries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('treatmentTrackingKeys', () => {
    test('should generate correct query keys', () => {
      expect(treatmentTrackingKeys.all).toEqual(['treatmentTracking']);
      expect(treatmentTrackingKeys.treatments()).toEqual(['treatmentTracking', 'treatments']);
    });
  });

  describe('useCreateTreatment', () => {
    test('should create treatment session successfully', async () => {
      const mockSession = createMockTreatmentResponse(99);
      const sessionData = {
        consultationId: 1,
        appointmentId: 1,
        patientId: 1,
        treatmentType: 'physiotherapy' as const,
        bodyLocation: 'head',
        startDate: '2025-01-01',
        plannedSessions: 5,
      };

      mockedTreatmentsApi.createTreatment.mockResolvedValueOnce({
        success: true,
        value: mockSession,
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateTreatment(), { wrapper });

      await waitFor(() => {
        expect(result.current.mutate).toBeDefined();
      });

      result.current.mutate(sessionData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSession);
      expect(mockedTreatmentsApi.createTreatment).toHaveBeenCalledWith(sessionData);
    });

    test('should handle creation error', async () => {
      mockedTreatmentsApi.createTreatment.mockResolvedValueOnce({
        success: false,
        error: 'Creation failed',
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateTreatment(), { wrapper });

      const sessionData = {
        consultationId: 1,
        appointmentId: 1,
        patientId: 1,
        treatmentType: 'physiotherapy' as const,
        bodyLocation: 'head',
        startDate: '2025-01-01',
        plannedSessions: 5,
      };

      await waitFor(() => {
        expect(result.current.mutate).toBeDefined();
      });

      result.current.mutate(sessionData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Creation failed');
    });
  });

  describe('useBulkCreateTreatments', () => {
    test('should bulk create treatment sessions successfully', async () => {
      const mockSessions = [
        createMockTreatmentResponse(1),
        createMockTreatmentResponse(2),
      ];
      const bulkData = {
        consultationId: 1,
        treatments: [
          {
            consultationId: 1,
            appointmentId: 1,
            patientId: 1,
            treatmentType: 'physiotherapy' as const,
            bodyLocation: 'head',
            startDate: '2025-01-01',
            plannedSessions: 5,
          },
          {
            consultationId: 2,
            appointmentId: 2,
            patientId: 2,
            treatmentType: 'tens' as const,
            bodyLocation: 'back',
            startDate: '2025-01-01',
            plannedSessions: 3,
          },
        ],
      };

      mockedTreatmentsApi.bulkCreateTreatments.mockResolvedValueOnce({
        success: true,
        value: {
          createdTreatments: mockSessions,
          failedTreatments: [],
          returnScheduled: false,
        },
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useBulkCreateTreatments(), { wrapper });

      await waitFor(() => {
        expect(result.current.mutate).toBeDefined();
      });

      result.current.mutate(bulkData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        createdTreatments: mockSessions,
        failedTreatments: [],
        returnScheduled: false,
      });
      expect(mockedTreatmentsApi.bulkCreateTreatments).toHaveBeenCalledWith(bulkData);
    });

    test('should handle bulk creation error', async () => {
      mockedTreatmentsApi.bulkCreateTreatments.mockResolvedValueOnce({
        success: false,
        error: 'Bulk creation failed',
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useBulkCreateTreatments(), { wrapper });

      const bulkData = {
        consultationId: 1,
        treatments: [
          {
            consultationId: 1,
            appointmentId: 1,
            patientId: 1,
            treatmentType: 'physiotherapy' as const,
            bodyLocation: 'head',
            startDate: '2025-01-01',
            plannedSessions: 5,
          },
        ],
      };

      await waitFor(() => {
        expect(result.current.mutate).toBeDefined();
      });

      result.current.mutate(bulkData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Bulk creation failed');
    });
  });
});
