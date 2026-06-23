import {
  getAppointments,
  getAppointmentById,
  getAppointmentsByDate,
  getAppointmentsByPatient,
  getEligibleParentOptions,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  checkInAppointment,
  startAppointment,
  completeAppointment,
  cancelAppointment,
  markAppointmentAsMissed,
  getAppointmentsForSchedule,
  getNextAppointmentDate,
  getAppointmentStats,
  updateAbsenceJustifications,
} from '../index';
import { AppointmentStatus, AppointmentType } from '../../types';

// Mock the api instance
jest.mock('@/api/lib/axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

import api from '@/api/lib/axios';
const mockApi = api as jest.Mocked<typeof api>;

describe('Appointments API', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01 12:00:00'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockAppointment = {
    id: 1,
    patientId: 1,
    type: AppointmentType.ASSESSMENT,
    status: AppointmentStatus.SCHEDULED,
    scheduledDate: '2024-01-01',
    scheduledTime: '10:00',
    checkedInTime: undefined,
    startedTime: undefined,
    completedTime: undefined,
    cancelledDate: undefined,
    notes: 'Regular consultation',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  describe('getAppointments', () => {
    it('should return appointments on success', async () => {
      const mockResponse = { data: [mockAppointment] };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getAppointments();

      expect(mockApi.get).toHaveBeenCalledWith('/appointments');
      expect(result).toEqual({
        success: true,
        value: [mockAppointment]
      });
    });

    it('should return error on failure', async () => {
      const mockError = { status: 500 };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getAppointments();

      expect(result).toEqual({
        success: false,
        error: 'Internal server error, please try again later'
      });
    });
  });

  describe('getAppointmentById', () => {
    it('should return appointment on success', async () => {
      const mockResponse = { data: mockAppointment };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getAppointmentById('1');

      expect(mockApi.get).toHaveBeenCalledWith('/appointments/1');
      expect(result).toEqual({
        success: true,
        value: mockAppointment
      });
    });

    it('should return error when not found', async () => {
      const mockError = { status: 404 };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getAppointmentById('999');

      expect(result).toEqual({
        success: false,
        error: 'Resource not found'
      });
    });
  });

  describe('getAppointmentsByDate', () => {
    it('should return appointments for specific date on success', async () => {
      const mockResponse = { data: [mockAppointment] };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getAppointmentsByDate('2024-01-01');

      expect(mockApi.get).toHaveBeenCalledWith('/appointments/date/2024-01-01');
      expect(result).toEqual({
        success: true,
        value: [mockAppointment]
      });
    });

    it('should return empty array when no appointments found for date', async () => {
      const mockResponse = { data: [] };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getAppointmentsByDate('2024-12-31');

      expect(mockApi.get).toHaveBeenCalledWith('/appointments/date/2024-12-31');
      expect(result).toEqual({
        success: true,
        value: []
      });
    });

    it('should return error on invalid date format', async () => {
      const mockError = { status: 400 };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getAppointmentsByDate('invalid-date');

      expect(result).toEqual({
        success: false,
        error: 'Invalid request'
      });
    });
  });

  describe('createAppointment', () => {
    it('should create appointment on success', async () => {
      const appointmentData = {
        patientId: 1,
        type: AppointmentType.ASSESSMENT,
        scheduledDate: '2024-01-01',
        scheduledTime: '10:00',
        notes: 'Regular consultation'
      };
      const mockResponse = { data: mockAppointment };
      mockApi.post.mockResolvedValue(mockResponse);

      const result = await createAppointment(appointmentData);

      expect(mockApi.post).toHaveBeenCalledWith('/appointments', appointmentData);
      expect(result).toEqual({
        success: true,
        value: mockAppointment
      });
    });

    it('should return error on validation failure', async () => {
      const appointmentData = {
        patientId: 0,
        type: AppointmentType.ASSESSMENT,
        scheduledDate: 'invalid-date',
        scheduledTime: '10:00',
        notes: 'Regular consultation'
      };
      const mockError = { response: { status: 400 } };
      mockApi.post.mockRejectedValue(mockError);

      const result = await createAppointment(appointmentData);

      expect(result).toEqual({
        success: false,
        error: 'Invalid request'
      });
    });

    it('should return 400 response body message when present (e.g. parent appointment validation)', async () => {
      const appointmentData = {
        patientId: 1,
        type: AppointmentType.ASSESSMENT,
        scheduledDate: '2024-01-01',
        scheduledTime: '10:00'
      };
      const backendMessage =
        'Select the main complaint (previous consultation) related to this appointment. If the list does not appear, refresh the page and try again.';
      const mockError = {
        response: {
          status: 400,
          data: { message: backendMessage }
        }
      };
      mockApi.post.mockRejectedValue(mockError);

      const result = await createAppointment(appointmentData);

      expect(result).toEqual({
        success: false,
        error: backendMessage
      });
    });

    it('should send parentAppointmentId in POST body when provided', async () => {
      const appointmentData = {
        patientId: 1,
        type: AppointmentType.ASSESSMENT,
        scheduledDate: '2024-01-01',
        scheduledTime: '10:00',
        parentAppointmentId: 42,
      };
      mockApi.post.mockResolvedValue({ data: mockAppointment });

      const result = await createAppointment(appointmentData);

      expect(mockApi.post).toHaveBeenCalledWith('/appointments', appointmentData);
      expect(result.success).toBe(true);
    });

    it('should join array message when 400 response has message as array', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: ['First error', 'Second error'] }
        }
      };
      mockApi.post.mockRejectedValue(mockError);

      const result = await createAppointment({
        patientId: 1,
        type: AppointmentType.ASSESSMENT,
        scheduledDate: '2024-01-01',
        scheduledTime: '10:00'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('First error Second error');
    });

    it('should return 404 response body message when present (e.g. invalid date / no schedule)', async () => {
      const backendMessage = 'No schedule configuration for this date. Choose another day.';
      const mockError = {
        response: {
          status: 404,
          data: { message: backendMessage }
        }
      };
      mockApi.post.mockRejectedValue(mockError);

      const result = await createAppointment({
        patientId: 1,
        type: AppointmentType.ASSESSMENT,
        scheduledDate: '2024-01-01',
        scheduledTime: '10:00'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(backendMessage);
    });
  });

  describe('updateAppointment', () => {
    it('should update appointment on success', async () => {
      const updateData = { notes: 'Updated notes' };
      const mockResponse = { data: { ...mockAppointment, notes: 'Updated notes' } };
      mockApi.patch.mockResolvedValue(mockResponse);

      const result = await updateAppointment('1', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/appointments/1', updateData);
      expect(result).toEqual({
        success: true,
        value: { ...mockAppointment, notes: 'Updated notes' }
      });
    });

    it('should return error when not found', async () => {
      const updateData = { notes: 'Updated notes' };
      const mockError = { status: 404 };
      mockApi.patch.mockRejectedValue(mockError);

      const result = await updateAppointment('999', updateData);

      expect(result).toEqual({
        success: false,
        error: 'Resource not found'
      });
    });
  });

  describe('deleteAppointment', () => {
    it('should delete appointment on success', async () => {
      mockApi.delete.mockResolvedValue({});

      const result = await deleteAppointment('1');

      expect(mockApi.delete).toHaveBeenCalledWith('/appointments/1', { data: undefined });
      expect(result).toEqual({
        success: true
      });
    });

    it('should delete appointment with cancellation reason', async () => {
      mockApi.delete.mockResolvedValue({});

      const result = await deleteAppointment('1', 'Patient requested cancellation');

      expect(mockApi.delete).toHaveBeenCalledWith('/appointments/1', { 
        data: { cancellationReason: 'Patient requested cancellation' }
      });
      expect(result).toEqual({
        success: true
      });
    });

    it('should return error when not found', async () => {
      const mockError = { status: 404 };
      mockApi.delete.mockRejectedValue(mockError);

      const result = await deleteAppointment('999');

      expect(result).toEqual({
        success: false,
        error: 'Resource not found'
      });
    });
  });

  describe('convenience methods', () => {
    beforeEach(() => {
      // Mock Date.now to return a consistent timestamp
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-01T12:00:00.000Z');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('checkInAppointment', () => {
      it('should check in appointment', async () => {
        const expectedUpdateData = {
          status: AppointmentStatus.CHECKED_IN,
          checkedInTime: '12:00:00'
        };
        const mockResponse = { 
          data: { 
            ...mockAppointment, 
            status: AppointmentStatus.CHECKED_IN,
            checkedInTime: '12:00:00'
          } 
        };
        mockApi.patch.mockResolvedValue(mockResponse);

        const result = await checkInAppointment('1');

        expect(mockApi.patch).toHaveBeenCalledWith('/appointments/1', expectedUpdateData);
        expect(result).toEqual({
          success: true,
          value: {
            ...mockAppointment,
            status: AppointmentStatus.CHECKED_IN,
            checkedInTime: '12:00:00'
          }
        });
      });
    });

    describe('startAppointment', () => {
      it('should start appointment', async () => {
        const expectedUpdateData = {
          status: AppointmentStatus.IN_PROGRESS,
          startedTime: '12:00:00'
        };
        const mockResponse = { 
          data: { 
            ...mockAppointment, 
            status: AppointmentStatus.IN_PROGRESS,
            startedTime: '12:00:00'
          } 
        };
        mockApi.patch.mockResolvedValue(mockResponse);

        const result = await startAppointment('1');

        expect(mockApi.patch).toHaveBeenCalledWith('/appointments/1', expectedUpdateData);
        expect(result).toEqual({
          success: true,
          value: {
            ...mockAppointment,
            status: AppointmentStatus.IN_PROGRESS,
            startedTime: '12:00:00'
          }
        });
      });
    });

    describe('completeAppointment', () => {
      it('should complete appointment', async () => {
        const expectedUpdateData = {
          status: AppointmentStatus.COMPLETED,
          completedTime: '12:00:00'
        };
        const mockResponse = { 
          data: { 
            ...mockAppointment, 
            status: AppointmentStatus.COMPLETED,
            completedTime: '12:00:00'
          } 
        };
        mockApi.patch.mockResolvedValue(mockResponse);

        const result = await completeAppointment('1');

        expect(mockApi.patch).toHaveBeenCalledWith('/appointments/1', expectedUpdateData);
        expect(result).toEqual({
          success: true,
          value: {
            ...mockAppointment,
            status: AppointmentStatus.COMPLETED,
            completedTime: '12:00:00'
          }
        });
      });
    });

    describe('cancelAppointment', () => {
      it('should cancel appointment', async () => {
        const expectedUpdateData = {
          status: AppointmentStatus.CANCELLED,
          cancelledDate: '2024-01-01'
        };
        const mockResponse = { 
          data: { 
            ...mockAppointment, 
            status: AppointmentStatus.CANCELLED,
            cancelledDate: '2024-01-01'
          } 
        };
        mockApi.patch.mockResolvedValue(mockResponse);

        const result = await cancelAppointment('1');

        expect(mockApi.patch).toHaveBeenCalledWith('/appointments/1', expectedUpdateData);
        expect(result).toEqual({
          success: true,
          value: {
            ...mockAppointment,
            status: AppointmentStatus.CANCELLED,
            cancelledDate: '2024-01-01'
          }
        });
      });
    });

    describe('markAppointmentAsMissed', () => {
      it('should mark appointment as missed without justification', async () => {
        const expectedUpdateData = {
          status: AppointmentStatus.MISSED,
          absenceJustified: false,
          absenceNotes: ""
        };
        const mockResponse = { 
          data: { 
            ...mockAppointment, 
            status: AppointmentStatus.MISSED,
            absenceJustified: false,
            absenceNotes: ""
          } 
        };
        mockApi.patch.mockResolvedValue(mockResponse);

        const result = await markAppointmentAsMissed('1');

        expect(mockApi.patch).toHaveBeenCalledWith('/appointments/1', expectedUpdateData);
        expect(result).toEqual({
          success: true,
          value: {
            ...mockAppointment,
            status: AppointmentStatus.MISSED,
            absenceJustified: false,
            absenceNotes: ""
          }
        });
      });

      it('should mark appointment as missed with justification', async () => {
        const expectedUpdateData = {
          status: AppointmentStatus.MISSED,
          absenceJustified: true,
          absenceNotes: "Emergency medical appointment"
        };
        const mockResponse = { 
          data: { 
            ...mockAppointment, 
            status: AppointmentStatus.MISSED,
            absenceJustified: true,
            absenceNotes: "Emergency medical appointment"
          } 
        };
        mockApi.patch.mockResolvedValue(mockResponse);

        const result = await markAppointmentAsMissed('1', true, "Emergency medical appointment");

        expect(mockApi.patch).toHaveBeenCalledWith('/appointments/1', expectedUpdateData);
        expect(result).toEqual({
          success: true,
          value: {
            ...mockAppointment,
            status: AppointmentStatus.MISSED,
            absenceJustified: true,
            absenceNotes: "Emergency medical appointment"
          }
        });
      });
    });
  });

  describe('getAppointmentsByPatient', () => {
    it('should return appointments for specific patient on success', async () => {
      const mockResponse = { data: [mockAppointment] };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getAppointmentsByPatient('1');

      expect(mockApi.get).toHaveBeenCalledWith('/appointments?patient_id=1');
      expect(result).toEqual({
        success: true,
        value: [mockAppointment]
      });
    });

    it('should return error on failure', async () => {
      const mockError = { status: 500 };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getAppointmentsByPatient('1');

      expect(result).toEqual({
        success: false,
        error: 'Internal server error, please try again later'
      });
    });
  });

  describe('getEligibleParentOptions', () => {
    it('should return eligible parent options for patient on success', async () => {
      const mockOptions = {
        options: [
          { id: 1, date: '2024-01-01', mainConcern: 'Complaint A', label: '2024-01-01 - Complaint A' },
        ],
      };
      const mockResponse = { data: mockOptions };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getEligibleParentOptions('1');

      expect(mockApi.get).toHaveBeenCalledWith('/appointments/eligible-parent-options?patient_id=1');
      expect(result).toEqual({
        success: true,
        value: mockOptions
      });
    });

    it('should return error on failure', async () => {
      const mockError = { status: 500 };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getEligibleParentOptions('1');

      expect(result).toEqual({
        success: false,
        error: 'Internal server error, please try again later'
      });
    });
  });

  describe('getAppointmentsForSchedule', () => {
    it('should return schedule appointments without filters', async () => {
      const mockScheduleData = [{ id: 1, patientName: 'John', type: 'assessment', scheduledTime: '10:00' }];
      const mockResponse = { data: mockScheduleData };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getAppointmentsForSchedule();

      expect(mockApi.get).toHaveBeenCalledWith('/appointments/schedule');
      expect(result).toEqual({
        success: true,
        value: mockScheduleData
      });
    });

    it('should return schedule appointments with filters', async () => {
      const mockScheduleData = [{ id: 1, patientName: 'John', type: 'assessment', scheduledTime: '10:00' }];
      const mockResponse = { data: mockScheduleData };
      mockApi.get.mockResolvedValue(mockResponse);

      const filters = {
        statuses: [AppointmentStatus.SCHEDULED, AppointmentStatus.COMPLETED],
        type: 'assessment',
        limit: 10,
        fromDate: '2025-01-01',
        toDate: '2025-01-31',
      };
      const result = await getAppointmentsForSchedule(filters);

      expect(mockApi.get).toHaveBeenCalledWith(
        '/appointments/schedule?status=scheduled&status=completed&type=assessment&limit=10&from_date=2025-01-01&to_date=2025-01-31',
      );
      expect(result).toEqual({
        success: true,
        value: mockScheduleData
      });
    });

    it('should encode a single selected status as one status query param', async () => {
      const mockScheduleData = [{ id: 1, patientName: 'John', type: 'assessment' }];
      mockApi.get.mockResolvedValue({ data: mockScheduleData });

      await getAppointmentsForSchedule({
        statuses: [AppointmentStatus.SCHEDULED],
        type: 'assessment',
      });

      expect(mockApi.get).toHaveBeenCalledWith(
        '/appointments/schedule?status=scheduled&type=assessment',
      );
    });

    it('should return error on failure', async () => {
      const mockError = { status: 500 };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getAppointmentsForSchedule();

      expect(result).toEqual({
        success: false,
        error: 'Internal server error, please try again later'
      });
    });
  });

  describe('getNextAppointmentDate', () => {
    it('should return next appointment date on success', async () => {
      const mockNextDate = { next_date: '2024-01-15', available_times: ['10:00', '14:00'] };
      const mockResponse = { data: mockNextDate };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getNextAppointmentDate();

      expect(mockApi.get).toHaveBeenCalledWith('/appointments/next-date');
      expect(result).toEqual({
        success: true,
        value: mockNextDate
      });
    });

    it('should return error on failure', async () => {
      const mockError = { status: 500 };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getNextAppointmentDate();

      expect(result).toEqual({
        success: false,
        error: 'Internal server error, please try again later'
      });
    });
  });

  describe('getAppointmentStats', () => {
    it('should return appointment stats without date', async () => {
      const mockStats = {
        total: 10,
        scheduled: 5,
        checked_in: 2,
        in_progress: 1,
        completed: 2,
        cancelled: 0,
        by_type: { assessment: 7, physiotherapy: 3, tens: 0 }
      };
      const mockResponse = { data: mockStats };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getAppointmentStats();

      expect(mockApi.get).toHaveBeenCalledWith('/appointments/stats');
      expect(result).toEqual({
        success: true,
        value: mockStats
      });
    });

    it('should return appointment stats for specific date', async () => {
      const mockStats = {
        total: 5,
        scheduled: 3,
        checked_in: 1,
        in_progress: 0,
        completed: 1,
        cancelled: 0,
        by_type: { assessment: 3, physiotherapy: 2, tens: 0 }
      };
      const mockResponse = { data: mockStats };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getAppointmentStats('2024-01-15');

      expect(mockApi.get).toHaveBeenCalledWith('/appointments/stats?date=2024-01-15');
      expect(result).toEqual({
        success: true,
        value: mockStats
      });
    });

    it('should return error on failure', async () => {
      const mockError = { status: 500 };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getAppointmentStats();

      expect(result).toEqual({
        success: false,
        error: 'Internal server error, please try again later'
      });
    });
  });

  describe('updateAbsenceJustifications', () => {
    it('should update absence justifications on success', async () => {
      mockApi.post.mockResolvedValue({});

      const justifications = [
        { appointmentId: 1, justified: true, justification: 'Medical emergency' },
        { appointmentId: 2, justified: false }
      ];
      
      const result = await updateAbsenceJustifications(justifications);

      expect(mockApi.post).toHaveBeenCalledWith('/appointments/absence-justifications', justifications);
      expect(result).toEqual({
        success: true
      });
    });

    it('should return error on failure', async () => {
      const mockError = { status: 400 };
      mockApi.post.mockRejectedValue(mockError);

      const justifications = [
        { appointmentId: 1, justified: true, justification: 'Medical emergency' }
      ];

      const result = await updateAbsenceJustifications(justifications);

      expect(result).toEqual({
        success: false,
        error: 'Invalid request'
      });
    });
  });
});
