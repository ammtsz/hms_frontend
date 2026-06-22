import React, { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useAppointmentsThreshold,
  useUpdateAppointmentsThreshold,
} from '../useAppointmentsThresholdQueries';
import { appointmentsThresholdKeys } from '@/api/query/keys/appointmentsThresholdKeys';
import * as appointmentsThresholdApi from '@/api/appointments-threshold';

jest.mock('@/api/appointments-threshold');

const mockedApi = appointmentsThresholdApi as jest.Mocked<typeof appointmentsThresholdApi>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  return Wrapper;
};

describe('useAppointmentsThresholdQueries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('appointmentsThresholdKeys', () => {
    it('should expose all query key', () => {
      expect(appointmentsThresholdKeys.all).toEqual(['appointmentsThreshold']);
    });
  });

  describe('useAppointmentsThreshold', () => {
    it('should return threshold data on success', async () => {
      mockedApi.getAppointmentsThreshold.mockResolvedValue({
        success: true,
        value: { missingAppointmentsThreshold: 5 },
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAppointmentsThreshold(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ missingAppointmentsThreshold: 5 });
      expect(mockedApi.getAppointmentsThreshold).toHaveBeenCalled();
    });

    it('should throw when API returns success: false', async () => {
      mockedApi.getAppointmentsThreshold.mockResolvedValue({
        success: false,
        error: 'Failed to load',
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAppointmentsThreshold(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Failed to load'));
    });
  });

  describe('useUpdateAppointmentsThreshold', () => {
    it('should update threshold and invalidate query on success', async () => {
      mockedApi.updateAppointmentsThreshold.mockResolvedValue({
        success: true,
        value: { missingAppointmentsThreshold: 7 },
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateAppointmentsThreshold(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.mutate).toBeDefined();
      });

      result.current.mutate(7);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ missingAppointmentsThreshold: 7 });
      expect(mockedApi.updateAppointmentsThreshold).toHaveBeenCalledWith(7);
    });

    it('should set error when API returns success: false', async () => {
      mockedApi.updateAppointmentsThreshold.mockResolvedValue({
        success: false,
        error: 'Only administrators can change this value',
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateAppointmentsThreshold(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.mutate).toBeDefined();
      });

      result.current.mutate(3);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(
        new Error('Only administrators can change this value'),
      );
    });
  });
});
