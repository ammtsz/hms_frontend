import {
  getConsultations,
  createConsultation,
  updateConsultation,
  deleteConsultation,
  getConsultationByAttendance
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
    attendanceId: 1,
    food: 'Fruits and vegetables',
    water: 'Mineral water',
    ointments: 'Healing ointment',
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
        error: 'Erro interno do servidor, por favor tente novamente mais tarde'
      });
    });
  });

  describe('getConsultationByAttendance', () => {
    it('should return consultation by attendance ID on success', async () => {
      const mockResponse = { data: mockConsultation };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getConsultationByAttendance('1');

      expect(mockApi.get).toHaveBeenCalledWith('/consultations/attendance/1');
      expect(result).toEqual({
        success: true,
        value: mockConsultation
      });
    });

    it('should return error when not found', async () => {
      const mockError = { status: 404 };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getConsultationByAttendance('999');

      expect(result).toEqual({
        success: false,
        error: 'Recurso não encontrado'
      });
    });
  });

  describe('createConsultation', () => {
    it('should create consultation on success', async () => {
      const treatmentData = {
        attendanceId: 1,
        food: 'Fruits and vegetables',
        water: 'Mineral water',
        ointments: 'Healing ointment',
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
        attendanceId: 0, // Invalid attendance_id
        food: 'Fruits and vegetables',
        water: 'Mineral water',
        ointments: 'Healing ointment',
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
        error: 'Requisição inválida'
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
        error: 'Recurso não encontrado'
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
        error: 'Recurso não encontrado'
      });
    });

    it('should return error on server error', async () => {
      const mockError = { status: 500 };
      mockApi.delete.mockRejectedValue(mockError);

      const result = await deleteConsultation('1');

      expect(result).toEqual({
        success: false,
        error: 'Erro interno do servidor, por favor tente novamente mais tarde'
      });
    });
  });
});
