import {
  getTreatmentById,
  getTreatmentsByPatient,
  createTreatment,
  updateTreatment,
  completeTreatment,
  cancelTreatment,
  bulkCancelTreatments,
  deleteTreatment
} from '../index';

// Mock the api instance
jest.mock('@/api/lib/axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

import api from '@/api/lib/axios';
const mockApi = api as jest.Mocked<typeof api>;

describe('Treatments API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTreatment = {
    id: 1,
    consultationId: 1,
    appointmentId: 1,
    patientId: 1,
    treatmentType: 'physiotherapy' as const,
    bodyLocation: 'Head',
    startDate: '2025-01-15',
    plannedSessions: 10,
    completedSessions: 0,
    status: 'scheduled',
  durationMinutes: 45,
    notes: 'Test',
    createdDate: '2025-01-15',
    createdTime: '10:00:00',
    updatedDate: '2025-01-15',
    updatedTime: '10:00:00',
  };

  describe('getTreatmentById', () => {
    it('should fetch treatment session by ID successfully', async () => {
      const mockResponse = { data: mockTreatment };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getTreatmentById('1');

      expect(mockApi.get).toHaveBeenCalledWith('/treatments/1');
      expect(result).toEqual({
        success: true,
        value: mockTreatment
      });
    });

    it('should return error when treatment session not found', async () => {
      const mockError = { status: 404 };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getTreatmentById('999');

      expect(result).toEqual({
        success: false,
        error: 'Resource not found'
      });
    });
  });

  describe('getTreatmentsByPatient', () => {
    it('should fetch treatment sessions by patient ID successfully', async () => {
      const mockResponse = { data: [mockTreatment] };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getTreatmentsByPatient('1');

      expect(mockApi.get).toHaveBeenCalledWith('/treatments/patient/1');
      expect(result).toEqual({
        success: true,
        value: [mockTreatment]
      });
    });
  });

  describe('createTreatment', () => {
    it('should create treatment session successfully', async () => {
      const sessionData = {
        consultationId: 1,
        appointmentId: 1,
        patientId: 1,
        treatmentType: 'physiotherapy' as const,
        bodyLocation: 'chest',
        startDate: '2025-01-15',
        plannedSessions: 12,
        durationMinutes: 45,
        notes: 'Standard physiotherapy treatment series'
      };
      const mockResponse = { data: mockTreatment };
      mockApi.post.mockResolvedValue(mockResponse);

      const result = await createTreatment(sessionData);

      expect(mockApi.post).toHaveBeenCalledWith('/treatments', sessionData);
      expect(result).toEqual({
        success: true,
        value: mockTreatment
      });
    });

    it('should return error on validation failure', async () => {
      const sessionData = {
        consultationId: 0, // Invalid treatment_record_id
        appointmentId: 0, // Invalid appointment_id
        patientId: 0, // Invalid patient_id
        treatmentType: 'physiotherapy' as const,
        bodyLocation: '', // Invalid empty body_location
        startDate: 'invalid-date', // Invalid date format
        plannedSessions: 0 // Invalid sessions count
      };
      const mockError = { status: 400 };
      mockApi.post.mockRejectedValue(mockError);

      const result = await createTreatment(sessionData);

      expect(result).toEqual({
        success: false,
        error: 'Invalid request'
      });
    });
  });

  describe('updateTreatment', () => {
    it('should update treatment session successfully', async () => {
      const updateData = {
        totalSessionsRecommended: 15,
        endDate: '2025-05-15',
        notes: 'Extended treatment plan'
      };
      const updatedSession = {
        ...mockTreatment,
        ...updateData,
        updatedAt: '2025-01-16T10:00:00Z'
      };
      const mockResponse = { data: updatedSession };
      mockApi.put.mockResolvedValue(mockResponse);

      const result = await updateTreatment('1', updateData);

      expect(mockApi.put).toHaveBeenCalledWith('/treatments/1', updateData);
      expect(result).toEqual({
        success: true,
        value: updatedSession
      });
    });
  });

  describe('completeTreatment', () => {
    it('should complete treatment session successfully', async () => {
      const completionData = {
        completionNotes: 'Patient completed all sessions successfully'
      };
      const completedSession = {
        ...mockTreatment,
        status: 'completed' as const,
        completionDate: '2025-04-15T10:00:00Z'
      };
      const mockResponse = { data: completedSession };
      mockApi.put.mockResolvedValue(mockResponse);

      const result = await completeTreatment('1', completionData);

      expect(mockApi.put).toHaveBeenCalledWith('/treatments/1', {
        endDate: expect.any(String),
        notes: 'Patient completed all sessions successfully'
      });
      expect(result).toEqual({
        success: true,
        value: completedSession
      });
    });

    it('should use default notes when completion_notes not provided', async () => {
      const completionData = {};
      const completedSession = {
        ...mockTreatment,
        status: 'completed' as const,
        notes: 'Treatment session completed'
      };
      const mockResponse = { data: completedSession };
      mockApi.put.mockResolvedValue(mockResponse);

      const result = await completeTreatment('1', completionData);

      expect(mockApi.put).toHaveBeenCalledWith('/treatments/1', {
        endDate: expect.any(String),
        notes: 'Treatment plan completed'
      });
      expect(result).toEqual({
        success: true,
        value: completedSession
      });
    });

    it('should return error on completion failure', async () => {
      const completionData = {
        completionNotes: 'Failed completion'
      };
      const mockError = { status: 400 };
      mockApi.put.mockRejectedValue(mockError);

      const result = await completeTreatment('1', completionData);

      expect(result).toEqual({
        success: false,
        error: 'Invalid request'
      });
    });
  });

  describe('cancelTreatment', () => {
    it('should cancel treatment session successfully', async () => {
      const cancelledSession = {
        ...mockTreatment,
        status: 'cancelled' as const
      };
      const mockResponse = { data: cancelledSession };
      mockApi.put.mockResolvedValue(mockResponse);

      const result = await cancelTreatment('1');

      expect(mockApi.put).toHaveBeenCalledWith('/treatments/1/cancel');
      expect(result).toEqual({
        success: true,
        value: cancelledSession
      });
    });

    it('should return error when cancellation fails', async () => {
      const mockError = { status: 409 };
      mockApi.put.mockRejectedValue(mockError);

      const result = await cancelTreatment('1');

      expect(result).toEqual({
        success: false,
        error: 'Record already exists or there is a data conflict.',
      });
    });

    it('should return error when session not found', async () => {
      const mockError = { status: 404 };
      mockApi.put.mockRejectedValue(mockError);

      const result = await cancelTreatment('999');

      expect(result).toEqual({
        success: false,
        error: 'Resource not found'
      });
    });
  });

  describe('bulkCancelTreatments', () => {
    it('should bulk cancel treatment sessions successfully', async () => {
      const mockResponse = {
        cancelledCount: 3,
        errors: []
      };
      mockApi.post.mockResolvedValue({ data: mockResponse });

      const result = await bulkCancelTreatments([1, 2, 3]);

      expect(mockApi.post).toHaveBeenCalledWith('/treatments/bulk-cancel', {
        treatmentIds: [1, 2, 3],
        cancellationReason: undefined
      });
      expect(result).toEqual({
        success: true,
        value: mockResponse
      });
    });

    it('should bulk cancel treatment sessions with cancellation reason', async () => {
      const mockResponse = {
        cancelledCount: 2,
        errors: []
      };
      mockApi.post.mockResolvedValue({ data: mockResponse });

      const result = await bulkCancelTreatments([1, 2], 'Patient requested');

      expect(mockApi.post).toHaveBeenCalledWith('/treatments/bulk-cancel', {
        treatmentIds: [1, 2],
        cancellationReason: 'Patient requested'
      });
      expect(result).toEqual({
        success: true,
        value: mockResponse
      });
    });

    it('should return error when bulk cancel fails', async () => {
      const mockError = { status: 500 };
      mockApi.post.mockRejectedValue(mockError);

      const result = await bulkCancelTreatments([1, 2, 3]);

      expect(result).toEqual({
        success: false,
        error: 'Internal server error, please try again later'
      });
    });
  });

  describe('deleteTreatment', () => {
    it('should delete treatment session successfully', async () => {
      mockApi.delete.mockResolvedValue({});

      const result = await deleteTreatment('1');

      expect(mockApi.delete).toHaveBeenCalledWith('/treatments/1');
      expect(result).toEqual({
        success: true
      });
    });

    it('should return error when treatment session not found', async () => {
      const mockError = { status: 404 };
      mockApi.delete.mockRejectedValue(mockError);

      const result = await deleteTreatment('999');

      expect(result).toEqual({
        success: false,
        error: 'Resource not found'
      });
    });
  });
});
