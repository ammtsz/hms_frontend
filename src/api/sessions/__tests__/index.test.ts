import api from '@/api/lib/axios';
import { getErrorMessage } from '../../utils/functions';
import {
  getSessionById,
  getSessionsByTreatment,
  getSessionsByPatient,
  createSession,
  updateSession,
  completeSession,
  deleteSession,
} from '../index';

// Mock the axios instance and utils
jest.mock('@/api/lib/axios');
jest.mock('../../utils/functions');

const mockApi = api as jest.Mocked<typeof api>;
const mockGetErrorMessage = getErrorMessage as jest.MockedFunction<typeof getErrorMessage>;

describe('sessions API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSessionById', () => {
    it('should return specific treatment session record', async () => {
      const mockData = { id: 1, treatmentId: 1, patientId: 1 };
      mockApi.get.mockResolvedValue({ data: mockData });

      const result = await getSessionById('1');

      expect(mockApi.get).toHaveBeenCalledWith('/sessions/1');
      expect(result).toEqual({ success: true, value: mockData });
    });

    it('should handle record not found', async () => {
      const errorMessage = 'Record not found';
      mockApi.get.mockRejectedValue({ status: 404 });
      mockGetErrorMessage.mockReturnValue(errorMessage);

      const result = await getSessionById('999');

      expect(result).toEqual({ success: false, error: errorMessage });
      expect(mockGetErrorMessage).toHaveBeenCalledWith(404);
    });
  });

  describe('getSessionsByTreatment', () => {
    it('should return records for specific session', async () => {
      const mockData = [
        { id: 1, treatmentId: 123, patientId: 1 },
        { id: 2, treatmentId: 123, patientId: 2 },
      ];
      mockApi.get.mockResolvedValue({ data: mockData });

      const result = await getSessionsByTreatment('123');

      expect(mockApi.get).toHaveBeenCalledWith('/sessions/treatment/123');
      expect(result).toEqual({ success: true, value: mockData });
    });

    it('should handle empty session records', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      const result = await getSessionsByTreatment('456');

      expect(result).toEqual({ success: true, value: [] });
    });
  });

  describe('getSessionsByPatient', () => {
    it('should return records for specific patient', async () => {
      const mockData = [
        { id: 1, treatmentId: 1, patientId: 789 },
        { id: 2, treatmentId: 2, patientId: 789 },
      ];
      mockApi.get.mockResolvedValue({ data: mockData });

      const result = await getSessionsByPatient('789');

      expect(mockApi.get).toHaveBeenCalledWith('/sessions/patient/789');
      expect(result).toEqual({ success: true, value: mockData });
    });
  });

  describe('createSession', () => {
    it('should create new treatment session record', async () => {
      const recordData = {
        treatmentId: 1,
        sessionNumber: 1,
        scheduledDate: '2025-11-26',
        scheduledTime: '10:00',
        notes: 'Initial session',
      };
      const mockResponse = { id: 1, ...recordData };
      mockApi.post.mockResolvedValue({ data: mockResponse });

      const result = await createSession(recordData);

      expect(mockApi.post).toHaveBeenCalledWith('/sessions', recordData);
      expect(result).toEqual({ success: true, value: mockResponse });
    });

    it('should handle validation error', async () => {
      const recordData = {
        treatmentId: 1,
        sessionNumber: 1,
        scheduledDate: 'invalid-date',
        scheduledTime: '10:00',
      };
      const errorMessage = 'Validation failed';
      mockApi.post.mockRejectedValue({ status: 400 });
      mockGetErrorMessage.mockReturnValue(errorMessage);

      const result = await createSession(recordData);

      expect(result).toEqual({ success: false, error: errorMessage });
    });
  });

  describe('updateSession', () => {
    it('should update treatment session record', async () => {
      const updateData = { scheduledDate: '2025-11-27', scheduledTime: '14:00', notes: 'Updated session' };
      const mockResponse = { id: 1, ...updateData };
      mockApi.put.mockResolvedValue({ data: mockResponse });

      const result = await updateSession('1', updateData);

      expect(mockApi.put).toHaveBeenCalledWith('/sessions/1', updateData);
      expect(result).toEqual({ success: true, value: mockResponse });
    });

    it('should handle update failure', async () => {
      const updateData = { notes: 'Updated notes' };
      const errorMessage = 'Update failed';
      mockApi.put.mockRejectedValue({ status: 422 });
      mockGetErrorMessage.mockReturnValue(errorMessage);

      const result = await updateSession('1', updateData);

      expect(result).toEqual({ success: false, error: errorMessage });
    });
  });

  describe('completeSession', () => {
    it('should complete treatment session record', async () => {
      const completionData = {
        notes: 'Session completed successfully',
        appointmentId: 123,
      };
      const mockResponse = { id: 1, status: 'completed', ...completionData };
      mockApi.post.mockResolvedValue({ data: mockResponse });

      const result = await completeSession('1', completionData);

      expect(mockApi.post).toHaveBeenCalledWith('/sessions/1/complete', completionData);
      expect(result).toEqual({ success: true, value: mockResponse });
    });

    it('should handle completion error', async () => {
      const completionData = { notes: 'Test completion' };
      const errorMessage = 'Already completed';
      mockApi.post.mockRejectedValue({ status: 409 });
      mockGetErrorMessage.mockReturnValue(errorMessage);

      const result = await completeSession('1', completionData);

      expect(result).toEqual({ success: false, error: errorMessage });
    });
  });

  describe('deleteSession', () => {
    it('should delete treatment session record', async () => {
      mockApi.delete.mockResolvedValue({});

      const result = await deleteSession('1');

      expect(mockApi.delete).toHaveBeenCalledWith('/sessions/1');
      expect(result).toEqual({ success: true });
    });

    it('should handle delete error', async () => {
      const errorMessage = 'Cannot delete';
      mockApi.delete.mockRejectedValue({ status: 403 });
      mockGetErrorMessage.mockReturnValue(errorMessage);

      const result = await deleteSession('1');

      expect(result).toEqual({ success: false, error: errorMessage });
    });

    it('should handle record not found on delete', async () => {
      const errorMessage = 'Record not found';
      mockApi.delete.mockRejectedValue({ status: 404 });
      mockGetErrorMessage.mockReturnValue(errorMessage);

      const result = await deleteSession('999');

      expect(result).toEqual({ success: false, error: errorMessage });
    });
  });

  describe('edge cases and error scenarios', () => {
    it('should handle empty string parameters', async () => {
      await getSessionById('');

      expect(mockApi.get).toHaveBeenCalledWith('/sessions/');
    });

    it('should handle special characters in IDs', async () => {
      const specialId = 'test-id-123';
      mockApi.get.mockResolvedValue({ data: {} });

      await getSessionById(specialId);

      expect(mockApi.get).toHaveBeenCalledWith(`/sessions/${specialId}`);
    });

    it('should handle concurrent requests', async () => {
      const mockData1 = [{ id: 1 }];
      const mockData2 = [{ id: 2 }];
      
      mockApi.get
        .mockResolvedValueOnce({ data: mockData1 })
        .mockResolvedValueOnce({ data: mockData2 });

      const [result1, result2] = await Promise.all([
        getSessionById('1'),
        getSessionsByPatient('123'),
      ]);

      expect(result1).toEqual({ success: true, value: mockData1 });
      expect(result2).toEqual({ success: true, value: mockData2 });
    });
  });
});