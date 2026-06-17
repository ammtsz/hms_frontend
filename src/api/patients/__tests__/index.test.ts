import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientNotes,
  createPatientNote,
  updatePatientNote,
  deletePatientNote
} from '../index';
import { PatientPriority } from '../../types';

// Mock the api instance
jest.mock('@/api/lib/axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

import api from '@/api/lib/axios';
const mockApi = api as jest.Mocked<typeof api>;

describe('Patients API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPatient = {
    id: 1,
    name: 'John Doe',
    phone: '123456789',
    priority: PatientPriority.LEVEL_3,
    treatment_status: 'IN_TREATMENT',
    birthDate: '1990-01-01',
    mainComplaint: 'Regular checkup',
    startDate: '2024-01-01',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  describe('getPatients', () => {
    it('should return patients on success', async () => {
      const mockResponse = { data: [mockPatient] };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getPatients();

      expect(mockApi.get).toHaveBeenCalledWith('/patients');
      expect(result).toEqual({
        success: true,
        value: [mockPatient]
      });
    });

    it('should return error on failure', async () => {
      const mockError = { status: 500 };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getPatients();

      expect(result).toEqual({
        success: false,
        error: 'Erro interno do servidor, por favor tente novamente mais tarde'
      });
    });

    it('should handle 404 error', async () => {
      const mockError = { status: 404 };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getPatients();

      expect(result).toEqual({
        success: false,
        error: 'Recurso não encontrado'
      });
    });
  });

  describe('getPatientById', () => {
    it('should return patient on success', async () => {
      const mockResponse = { data: mockPatient };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getPatientById('1');

      expect(mockApi.get).toHaveBeenCalledWith('/patients/1');
      expect(result).toEqual({
        success: true,
        value: mockPatient
      });
    });

    it('should return specific error message for 404 (patient not found)', async () => {
      const mockError = { status: 404 };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getPatientById('non-existent-id');

      expect(result).toEqual({
        success: false,
        error: 'Paciente não encontrado'
      });
    });

    it('should return generic error on server error', async () => {
      const mockError = { status: 500 };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getPatientById('1');

      expect(result).toEqual({
        success: false,
        error: 'Erro interno do servidor, por favor tente novamente mais tarde'
      });
    });

    it('should return generic error on network error', async () => {
      const mockError = {}; // No status
      mockApi.get.mockRejectedValue(mockError);

      const result = await getPatientById('1');

      expect(result).toEqual({
        success: false,
        error: 'Erro interno do servidor, por favor tente novamente mais tarde'
      });
    });
  });

  describe('createPatient', () => {
    it('should create patient on success', async () => {
      const patientData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123456789',
        cpf: '12345678901',
        date_of_birth: '1990-01-01',
        address: '123 Main St',
        priority: PatientPriority.LEVEL_3
      };
      const mockResponse = { data: mockPatient };
      mockApi.post.mockResolvedValue(mockResponse);

      const result = await createPatient(patientData);

      expect(mockApi.post).toHaveBeenCalledWith('/patients', patientData);
      expect(result).toEqual({
        success: true,
        value: mockPatient
      });
    });

    it('should return error on validation failure', async () => {
      const patientData = {
        name: '',
        email: 'invalid-email',
        phone: '123456789',
        cpf: '12345678901',
        date_of_birth: '1990-01-01',
        address: '123 Main St',
        priority: PatientPriority.LEVEL_3
      };
      const mockError = { status: 400 };
      mockApi.post.mockRejectedValue(mockError);

      const result = await createPatient(patientData);

      expect(result).toEqual({
        success: false,
        error: 'Requisição inválida'
      });
    });
  });

  describe('updatePatient', () => {
    it('should update patient on success', async () => {
      const updateData = { name: 'John Updated' };
      const mockResponse = { data: { ...mockPatient, name: 'John Updated' } };
      mockApi.patch.mockResolvedValue(mockResponse);

      const result = await updatePatient('1', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/patients/1', updateData);
      expect(result).toEqual({
        success: true,
        value: { ...mockPatient, name: 'John Updated' }
      });
    });

    it('should return error when patient not found', async () => {
      const updateData = { name: 'John Updated' };
      const mockError = { status: 404 };
      mockApi.patch.mockRejectedValue(mockError);

      const result = await updatePatient('999', updateData);

      expect(result).toEqual({
        success: false,
        error: 'Recurso não encontrado'
      });
    });
  });

  describe('deletePatient', () => {
    it('should delete patient on success', async () => {
      mockApi.delete.mockResolvedValue({});

      const result = await deletePatient('1');

      expect(mockApi.delete).toHaveBeenCalledWith('/patients/1');
      expect(result).toEqual({
        success: true
      });
    });

    it('should return error when patient not found', async () => {
      const mockError = { status: 404 };
      mockApi.delete.mockRejectedValue(mockError);

      const result = await deletePatient('999');

      expect(result).toEqual({
        success: false,
        error: 'Recurso não encontrado'
      });
    });

    it('should return error on server error', async () => {
      const mockError = { status: 500 };
      mockApi.delete.mockRejectedValue(mockError);

      const result = await deletePatient('1');

      expect(result).toEqual({
        success: false,
        error: 'Erro interno do servidor, por favor tente novamente mais tarde'
      });
    });

    it('should return specific error message when patient has active attendances', async () => {
      const mockError = {
        status: 409,
        response: {
          data: {
            message: 'Cannot delete patient 1: Has 3 active attendances'
          }
        }
      };
      mockApi.delete.mockRejectedValue(mockError);

      const result = await deletePatient('1');

      expect(result).toEqual({
        success: false,
        error: 'Cannot delete patient 1: Has 3 active attendances'
      });
    });
  });

  describe('Patient Notes API', () => {
    const mockNote = {
      id: 1,
      patientId: 1,
      content: 'Patient has been improving well',
      created_by: 'Dr. Smith',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    describe('getPatientNotes', () => {
      it('should return patient notes on success', async () => {
        const mockResponse = { data: [mockNote] };
        mockApi.get.mockResolvedValue(mockResponse);

        const result = await getPatientNotes('1');

        expect(mockApi.get).toHaveBeenCalledWith('/patients/1/notes');
        expect(result).toEqual({
          success: true,
          value: [mockNote]
        });
      });

      it('should return specific error for patient not found', async () => {
        const mockError = { status: 404 };
        mockApi.get.mockRejectedValue(mockError);

        const result = await getPatientNotes('999');

        expect(result).toEqual({
          success: false,
          error: 'Paciente não encontrado'
        });
      });

      it('should return generic error on server error', async () => {
        const mockError = { status: 500 };
        mockApi.get.mockRejectedValue(mockError);

        const result = await getPatientNotes('1');

        expect(result).toEqual({
          success: false,
          error: 'Erro interno do servidor, por favor tente novamente mais tarde'
        });
      });
    });

    describe('createPatientNote', () => {
      it('should create patient note on success', async () => {
        const noteData = {
          noteContent: 'Patient has been improving well'
        };
        const mockResponse = { data: mockNote };
        mockApi.post.mockResolvedValue(mockResponse);

        const result = await createPatientNote('1', noteData);

        expect(mockApi.post).toHaveBeenCalledWith('/patients/1/notes', noteData);
        expect(result).toEqual({
          success: true,
          value: mockNote
        });
      });

      it('should return specific error for patient not found', async () => {
        const noteData = {
          noteContent: 'Patient has been improving well'
        };
        const mockError = { status: 404 };
        mockApi.post.mockRejectedValue(mockError);

        const result = await createPatientNote('999', noteData);

        expect(result).toEqual({
          success: false,
          error: 'Paciente não encontrado'
        });
      });

      it('should return error on validation failure', async () => {
        const noteData = {
          noteContent: '' // Empty content
        };
        const mockError = { status: 400 };
        mockApi.post.mockRejectedValue(mockError);

        const result = await createPatientNote('1', noteData);

        expect(result).toEqual({
          success: false,
          error: 'Requisição inválida'
        });
      });
    });

    describe('updatePatientNote', () => {
      it('should update patient note on success', async () => {
        const updateData = { noteContent: 'Updated note content' };
        const mockResponse = { data: { ...mockNote, content: 'Updated note content' } };
        mockApi.patch.mockResolvedValue(mockResponse);

        const result = await updatePatientNote('1', '1', updateData);

        expect(mockApi.patch).toHaveBeenCalledWith('/patients/1/notes/1', updateData);
        expect(result).toEqual({
          success: true,
          value: { ...mockNote, content: 'Updated note content' }
        });
      });

      it('should return specific error for note not found', async () => {
        const updateData = { noteContent: 'Updated note content' };
        const mockError = { status: 404 };
        mockApi.patch.mockRejectedValue(mockError);

        const result = await updatePatientNote('1', '999', updateData);

        expect(result).toEqual({
          success: false,
          error: 'Nota não encontrada'
        });
      });

      it('should return error on validation failure', async () => {
        const updateData = { noteContent: '' }; // Empty content
        const mockError = { status: 400 };
        mockApi.patch.mockRejectedValue(mockError);

        const result = await updatePatientNote('1', '1', updateData);

        expect(result).toEqual({
          success: false,
          error: 'Requisição inválida'
        });
      });
    });

    describe('deletePatientNote', () => {
      it('should delete patient note on success', async () => {
        mockApi.delete.mockResolvedValue({});

        const result = await deletePatientNote('1', '1');

        expect(mockApi.delete).toHaveBeenCalledWith('/patients/1/notes/1');
        expect(result).toEqual({
          success: true
        });
      });

      it('should return specific error for note not found', async () => {
        const mockError = { status: 404 };
        mockApi.delete.mockRejectedValue(mockError);

        const result = await deletePatientNote('1', '999');

        expect(result).toEqual({
          success: false,
          error: 'Nota não encontrada'
        });
      });

      it('should return error on server error', async () => {
        const mockError = { status: 500 };
        mockApi.delete.mockRejectedValue(mockError);

        const result = await deletePatientNote('1', '1');

        expect(result).toEqual({
          success: false,
          error: 'Erro interno do servidor, por favor tente novamente mais tarde'
        });
      });
    });
  });
});
