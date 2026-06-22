import {
  getAppointmentsThreshold,
  updateAppointmentsThreshold,
} from '../index';

jest.mock('@/api/lib/axios', () => ({
  get: jest.fn(),
  patch: jest.fn(),
}));

import api from '@/api/lib/axios';
const mockApi = api as jest.Mocked<typeof api>;

describe('Appointments threshold API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAppointmentsThreshold', () => {
    it('should return threshold on success', async () => {
      const mockResponse = { data: { missingAppointmentsThreshold: 3 } };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getAppointmentsThreshold();

      expect(mockApi.get).toHaveBeenCalledWith('/settings/appointments-threshold');
      expect(result).toEqual({
        success: true,
        value: { missingAppointmentsThreshold: 3 },
      });
    });

    it('should return error on 400', async () => {
      mockApi.get.mockRejectedValue({ response: { status: 400 } });

      const result = await getAppointmentsThreshold();

      expect(result).toEqual({
        success: false,
        error: 'Invalid value (use between 1 and 10)',
      });
    });

    it('should return error on 403', async () => {
      mockApi.get.mockRejectedValue({ response: { status: 403 } });

      const result = await getAppointmentsThreshold();

      expect(result).toEqual({
        success: false,
        error: 'Only administrators can change this value',
      });
    });

    it('should return generic error on other failure', async () => {
      mockApi.get.mockRejectedValue({ response: { status: 500 } });

      const result = await getAppointmentsThreshold();

      expect(result).toEqual({
        success: false,
        error: 'Error processing request',
      });
    });
  });

  describe('updateAppointmentsThreshold', () => {
    it('should update threshold on success', async () => {
      const mockResponse = { data: { missingAppointmentsThreshold: 5 } };
      mockApi.patch.mockResolvedValue(mockResponse);

      const result = await updateAppointmentsThreshold(5);

      expect(mockApi.patch).toHaveBeenCalledWith(
        '/settings/appointments-threshold',
        { missingAppointmentsThreshold: 5 },
      );
      expect(result).toEqual({
        success: true,
        value: { missingAppointmentsThreshold: 5 },
      });
    });

    it('should return error on 400', async () => {
      mockApi.patch.mockRejectedValue({ response: { status: 400 } });

      const result = await updateAppointmentsThreshold(0);

      expect(result).toEqual({
        success: false,
        error: 'Invalid value (use between 1 and 10)',
      });
    });

    it('should return error on 403', async () => {
      mockApi.patch.mockRejectedValue({ response: { status: 403 } });

      const result = await updateAppointmentsThreshold(3);

      expect(result).toEqual({
        success: false,
        error: 'Only administrators can change this value',
      });
    });

    it('should prefer response message when present', async () => {
      mockApi.patch.mockRejectedValue({
        response: { status: 400, data: { message: 'Custom validation message' } },
      });

      const result = await updateAppointmentsThreshold(3);

      expect(result).toEqual({
        success: false,
        error: 'Custom validation message',
      });
    });

    it('should return generic error on other failure', async () => {
      mockApi.patch.mockRejectedValue({ response: { status: 500 } });

      const result = await updateAppointmentsThreshold(3);

      expect(result).toEqual({
        success: false,
        error: 'Error processing request',
      });
    });
  });
});
