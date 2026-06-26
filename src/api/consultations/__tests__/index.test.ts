import {
  getConsultations,
  createConsultation,
  updateConsultation,
  deleteConsultation,
  getConsultationByAppointment
} from '../index';

// Mock the api instance
jest.mock('@/api/lib/axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

import api from '@/api/lib/axios';
const mockApi = api as jest.Mocked<typeof api>;

describe('Consultations API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockConsultation = {
    id: 1,
    appointmentId: 1,
    homeExercises: '3x daily: cat-camel, pelvic tilt',
    painManagement: 'Ice 15 min after sessions',
    medications: 'Diclofenac gel twice daily',
    physiotherapy: true,
    tens: false,
    returnWeeks: 2,
    notes: 'Patient is improving',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  describe('getConsultations', () => {
    it('should return consultations on success', async () => {
      const mockResponse = { data: [mockConsultation] };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getConsultations();

      expect(mockApi.get).toHaveBeenCalledWith('/consultations');
      expect(result).toEqual({
        success: true,
        value: [mockConsultation]
      });
    });

    it('should return error on failure', async () => {
      const mockError = { status: 500 };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getConsultations();

      expect(result).toEqual({
        success: false,
        error: expect.stringMatching(/Internal server error, please try again later|Internal server error, please try again later/)
      });
    });
  });

  describe('getConsultationByAppointment', () => {
    it('should return consultation by appointment ID on success', async () => {
      const mockResponse = { data: mockConsultation };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getConsultationByAppointment('1');

      expect(mockApi.get).toHaveBeenCalledWith('/consultations/appointment/1');
      expect(result).toEqual({
        success: true,
        value: mockConsultation
      });
    });

    it('should return error when not found', async () => {
      const mockError = { status: 404 };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getConsultationByAppointment('999');

      expect(result).toEqual({
        success: false,
        error: expect.stringMatching(/Resource not found|Resource not found/)
      });
    });
  });

  describe('createConsultation', () => {
    it('should create consultation on success', async () => {
      const treatmentData = {
        appointmentId: 1,
        homeExercises: '3x daily: cat-camel, pelvic tilt',
        painManagement: 'Ice 15 min after sessions',
        medications: 'Diclofenac gel twice daily',
        physiotherapy: true,
        tens: false,
        returnWeeks: 2,
        notes: 'Patient is improving'
      };
      const mockResponse = { data: mockConsultation };
      mockApi.post.mockResolvedValue(mockResponse);

      const result = await createConsultation(treatmentData);

      expect(mockApi.post).toHaveBeenCalledWith('/consultations', treatmentData);
      expect(result).toEqual({
        success: true,
        value: mockConsultation
      });
    });

    it('should return error on validation failure', async () => {
      const treatmentData = {
        appointmentId: 0, // Invalid appointment_id
        homeExercises: '3x daily: cat-camel, pelvic tilt',
        painManagement: 'Ice 15 min after sessions',
        medications: 'Diclofenac gel twice daily',
        physiotherapy: true,
        tens: false,
        returnWeeks: 60, // Invalid returnWeeks (> 52)
        notes: 'Patient is improving'
      };
      const mockError = { status: 400 };
      mockApi.post.mockRejectedValue(mockError);

      const result = await createConsultation(treatmentData);

      expect(result).toEqual({
        success: false,
        error: 'Invalid request'
      });
    });
  });

  describe('updateConsultation', () => {
    it('should update consultation on success', async () => {
      const updateData = { notes: 'Patient is fully recovered' };
      const mockResponse = { data: { ...mockConsultation, notes: 'Patient is fully recovered' } };
      mockApi.patch.mockResolvedValue(mockResponse);

      const result = await updateConsultation('1', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/consultations/1', updateData);
      expect(result).toEqual({
        success: true,
        value: { ...mockConsultation, notes: 'Patient is fully recovered' }
      });
    });

    it('should return error when not found', async () => {
      const updateData = { notes: 'Updated notes' };
      const mockError = { status: 404 };
      mockApi.patch.mockRejectedValue(mockError);

      const result = await updateConsultation('999', updateData);

      expect(result).toEqual({
        success: false,
        error: expect.stringMatching(/Resource not found|Resource not found/)
      });
    });

    it('should handle partial updates', async () => {
      const updateData = { physiotherapy: false, returnWeeks: 4 };
      const mockResponse = { 
        data: { 
          ...mockConsultation, 
          physiotherapy: false, 
          returnWeeks: 4 
        } 
      };
      mockApi.patch.mockResolvedValue(mockResponse);

      const result = await updateConsultation('1', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/consultations/1', updateData);
      expect(result).toEqual({
        success: true,
        value: {
          ...mockConsultation,
          physiotherapy: false,
          returnWeeks: 4
        }
      });
    });
  });

  describe('deleteConsultation', () => {
    it('should delete consultation on success', async () => {
      mockApi.delete.mockResolvedValue({});

      const result = await deleteConsultation('1');

      expect(mockApi.delete).toHaveBeenCalledWith('/consultations/1');
      expect(result).toEqual({
        success: true
      });
    });

    it('should return error when not found', async () => {
      const mockError = { status: 404 };
      mockApi.delete.mockRejectedValue(mockError);

      const result = await deleteConsultation('999');

      expect(result).toEqual({
        success: false,
        error: expect.stringMatching(/Resource not found|Resource not found/)
      });
    });

    it('should return error on server error', async () => {
      const mockError = { status: 500 };
      mockApi.delete.mockRejectedValue(mockError);

      const result = await deleteConsultation('1');

      expect(result).toEqual({
        success: false,
        error: expect.stringMatching(/Internal server error, please try again later|Internal server error, please try again later/)
      });
    });
  });
});
