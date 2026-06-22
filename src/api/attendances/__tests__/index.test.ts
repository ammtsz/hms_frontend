import {
  getAttendances,
  getAttendanceById,
  getAttendancesByDate,
  getAttendancesByPatient,
  getEligibleParentOptions,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  checkInAttendance,
  startAttendance,
  completeAttendance,
  cancelAttendance,
  markAttendanceAsMissed,
  getAttendancesForAgenda,
  getNextAttendanceDate,
  getAttendanceStats,
  updateAbsenceJustifications,
} from '../index';
import { AttendanceStatus, AttendanceType } from '../../types';

// Mock the api instance
jest.mock('@/api/lib/axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

import api from '@/api/lib/axios';
const mockApi = api as jest.Mocked<typeof api>;

describe('Attendances API', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01 12:00:00'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockAttendance = {
    id: 1,
    patientId: 1,
    type: AttendanceType.ASSESSMENT,
    status: AttendanceStatus.SCHEDULED,
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

  describe('getAttendances', () => {
    it('should return attendances on success', async () => {
      const mockResponse = { data: [mockAttendance] };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getAttendances();

      expect(mockApi.get).toHaveBeenCalledWith('/attendances');
      expect(result).toEqual({
        success: true,
        value: [mockAttendance]
      });
    });

    it('should return error on failure', async () => {
      const mockError = { status: 500 };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getAttendances();

      expect(result).toEqual({
        success: false,
        error: 'Internal server error, please try again later'
      });
    });
  });

  describe('getAttendanceById', () => {
    it('should return attendance on success', async () => {
      const mockResponse = { data: mockAttendance };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getAttendanceById('1');

      expect(mockApi.get).toHaveBeenCalledWith('/attendances/1');
      expect(result).toEqual({
        success: true,
        value: mockAttendance
      });
    });

    it('should return error when not found', async () => {
      const mockError = { status: 404 };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getAttendanceById('999');

      expect(result).toEqual({
        success: false,
        error: 'Resource not found'
      });
    });
  });

  describe('getAttendancesByDate', () => {
    it('should return attendances for specific date on success', async () => {
      const mockResponse = { data: [mockAttendance] };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getAttendancesByDate('2024-01-01');

      expect(mockApi.get).toHaveBeenCalledWith('/attendances/date/2024-01-01');
      expect(result).toEqual({
        success: true,
        value: [mockAttendance]
      });
    });

    it('should return empty array when no attendances found for date', async () => {
      const mockResponse = { data: [] };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getAttendancesByDate('2024-12-31');

      expect(mockApi.get).toHaveBeenCalledWith('/attendances/date/2024-12-31');
      expect(result).toEqual({
        success: true,
        value: []
      });
    });

    it('should return error on invalid date format', async () => {
      const mockError = { status: 400 };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getAttendancesByDate('invalid-date');

      expect(result).toEqual({
        success: false,
        error: 'Invalid request'
      });
    });
  });

  describe('createAttendance', () => {
    it('should create attendance on success', async () => {
      const attendanceData = {
        patientId: 1,
        type: AttendanceType.ASSESSMENT,
        scheduledDate: '2024-01-01',
        scheduledTime: '10:00',
        notes: 'Regular consultation'
      };
      const mockResponse = { data: mockAttendance };
      mockApi.post.mockResolvedValue(mockResponse);

      const result = await createAttendance(attendanceData);

      expect(mockApi.post).toHaveBeenCalledWith('/attendances', attendanceData);
      expect(result).toEqual({
        success: true,
        value: mockAttendance
      });
    });

    it('should return error on validation failure', async () => {
      const attendanceData = {
        patientId: 0,
        type: AttendanceType.ASSESSMENT,
        scheduledDate: 'invalid-date',
        scheduledTime: '10:00',
        notes: 'Regular consultation'
      };
      const mockError = { response: { status: 400 } };
      mockApi.post.mockRejectedValue(mockError);

      const result = await createAttendance(attendanceData);

      expect(result).toEqual({
        success: false,
        error: 'Invalid request'
      });
    });

    it('should return 400 response body message when present (e.g. parent attendance validation)', async () => {
      const attendanceData = {
        patientId: 1,
        type: AttendanceType.ASSESSMENT,
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

      const result = await createAttendance(attendanceData);

      expect(result).toEqual({
        success: false,
        error: backendMessage
      });
    });

    it('should send parentAttendanceId in POST body when provided', async () => {
      const attendanceData = {
        patientId: 1,
        type: AttendanceType.ASSESSMENT,
        scheduledDate: '2024-01-01',
        scheduledTime: '10:00',
        parentAttendanceId: 42,
      };
      mockApi.post.mockResolvedValue({ data: mockAttendance });

      const result = await createAttendance(attendanceData);

      expect(mockApi.post).toHaveBeenCalledWith('/attendances', attendanceData);
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

      const result = await createAttendance({
        patientId: 1,
        type: AttendanceType.ASSESSMENT,
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

      const result = await createAttendance({
        patientId: 1,
        type: AttendanceType.ASSESSMENT,
        scheduledDate: '2024-01-01',
        scheduledTime: '10:00'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(backendMessage);
    });
  });

  describe('updateAttendance', () => {
    it('should update attendance on success', async () => {
      const updateData = { notes: 'Updated notes' };
      const mockResponse = { data: { ...mockAttendance, notes: 'Updated notes' } };
      mockApi.patch.mockResolvedValue(mockResponse);

      const result = await updateAttendance('1', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/attendances/1', updateData);
      expect(result).toEqual({
        success: true,
        value: { ...mockAttendance, notes: 'Updated notes' }
      });
    });

    it('should return error when not found', async () => {
      const updateData = { notes: 'Updated notes' };
      const mockError = { status: 404 };
      mockApi.patch.mockRejectedValue(mockError);

      const result = await updateAttendance('999', updateData);

      expect(result).toEqual({
        success: false,
        error: 'Resource not found'
      });
    });
  });

  describe('deleteAttendance', () => {
    it('should delete attendance on success', async () => {
      mockApi.delete.mockResolvedValue({});

      const result = await deleteAttendance('1');

      expect(mockApi.delete).toHaveBeenCalledWith('/attendances/1', { data: undefined });
      expect(result).toEqual({
        success: true
      });
    });

    it('should delete attendance with cancellation reason', async () => {
      mockApi.delete.mockResolvedValue({});

      const result = await deleteAttendance('1', 'Patient requested cancellation');

      expect(mockApi.delete).toHaveBeenCalledWith('/attendances/1', { 
        data: { cancellationReason: 'Patient requested cancellation' }
      });
      expect(result).toEqual({
        success: true
      });
    });

    it('should return error when not found', async () => {
      const mockError = { status: 404 };
      mockApi.delete.mockRejectedValue(mockError);

      const result = await deleteAttendance('999');

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

    describe('checkInAttendance', () => {
      it('should check in attendance', async () => {
        const expectedUpdateData = {
          status: AttendanceStatus.CHECKED_IN,
          checkedInTime: '12:00:00'
        };
        const mockResponse = { 
          data: { 
            ...mockAttendance, 
            status: AttendanceStatus.CHECKED_IN,
            checkedInTime: '12:00:00'
          } 
        };
        mockApi.patch.mockResolvedValue(mockResponse);

        const result = await checkInAttendance('1');

        expect(mockApi.patch).toHaveBeenCalledWith('/attendances/1', expectedUpdateData);
        expect(result).toEqual({
          success: true,
          value: {
            ...mockAttendance,
            status: AttendanceStatus.CHECKED_IN,
            checkedInTime: '12:00:00'
          }
        });
      });
    });

    describe('startAttendance', () => {
      it('should start attendance', async () => {
        const expectedUpdateData = {
          status: AttendanceStatus.IN_PROGRESS,
          startedTime: '12:00:00'
        };
        const mockResponse = { 
          data: { 
            ...mockAttendance, 
            status: AttendanceStatus.IN_PROGRESS,
            startedTime: '12:00:00'
          } 
        };
        mockApi.patch.mockResolvedValue(mockResponse);

        const result = await startAttendance('1');

        expect(mockApi.patch).toHaveBeenCalledWith('/attendances/1', expectedUpdateData);
        expect(result).toEqual({
          success: true,
          value: {
            ...mockAttendance,
            status: AttendanceStatus.IN_PROGRESS,
            startedTime: '12:00:00'
          }
        });
      });
    });

    describe('completeAttendance', () => {
      it('should complete attendance', async () => {
        const expectedUpdateData = {
          status: AttendanceStatus.COMPLETED,
          completedTime: '12:00:00'
        };
        const mockResponse = { 
          data: { 
            ...mockAttendance, 
            status: AttendanceStatus.COMPLETED,
            completedTime: '12:00:00'
          } 
        };
        mockApi.patch.mockResolvedValue(mockResponse);

        const result = await completeAttendance('1');

        expect(mockApi.patch).toHaveBeenCalledWith('/attendances/1', expectedUpdateData);
        expect(result).toEqual({
          success: true,
          value: {
            ...mockAttendance,
            status: AttendanceStatus.COMPLETED,
            completedTime: '12:00:00'
          }
        });
      });
    });

    describe('cancelAttendance', () => {
      it('should cancel attendance', async () => {
        const expectedUpdateData = {
          status: AttendanceStatus.CANCELLED,
          cancelledDate: '2024-01-01'
        };
        const mockResponse = { 
          data: { 
            ...mockAttendance, 
            status: AttendanceStatus.CANCELLED,
            cancelledDate: '2024-01-01'
          } 
        };
        mockApi.patch.mockResolvedValue(mockResponse);

        const result = await cancelAttendance('1');

        expect(mockApi.patch).toHaveBeenCalledWith('/attendances/1', expectedUpdateData);
        expect(result).toEqual({
          success: true,
          value: {
            ...mockAttendance,
            status: AttendanceStatus.CANCELLED,
            cancelledDate: '2024-01-01'
          }
        });
      });
    });

    describe('markAttendanceAsMissed', () => {
      it('should mark attendance as missed without justification', async () => {
        const expectedUpdateData = {
          status: AttendanceStatus.MISSED,
          absenceJustified: false,
          absenceNotes: ""
        };
        const mockResponse = { 
          data: { 
            ...mockAttendance, 
            status: AttendanceStatus.MISSED,
            absenceJustified: false,
            absenceNotes: ""
          } 
        };
        mockApi.patch.mockResolvedValue(mockResponse);

        const result = await markAttendanceAsMissed('1');

        expect(mockApi.patch).toHaveBeenCalledWith('/attendances/1', expectedUpdateData);
        expect(result).toEqual({
          success: true,
          value: {
            ...mockAttendance,
            status: AttendanceStatus.MISSED,
            absenceJustified: false,
            absenceNotes: ""
          }
        });
      });

      it('should mark attendance as missed with justification', async () => {
        const expectedUpdateData = {
          status: AttendanceStatus.MISSED,
          absenceJustified: true,
          absenceNotes: "Emergency medical appointment"
        };
        const mockResponse = { 
          data: { 
            ...mockAttendance, 
            status: AttendanceStatus.MISSED,
            absenceJustified: true,
            absenceNotes: "Emergency medical appointment"
          } 
        };
        mockApi.patch.mockResolvedValue(mockResponse);

        const result = await markAttendanceAsMissed('1', true, "Emergency medical appointment");

        expect(mockApi.patch).toHaveBeenCalledWith('/attendances/1', expectedUpdateData);
        expect(result).toEqual({
          success: true,
          value: {
            ...mockAttendance,
            status: AttendanceStatus.MISSED,
            absenceJustified: true,
            absenceNotes: "Emergency medical appointment"
          }
        });
      });
    });
  });

  describe('getAttendancesByPatient', () => {
    it('should return attendances for specific patient on success', async () => {
      const mockResponse = { data: [mockAttendance] };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getAttendancesByPatient('1');

      expect(mockApi.get).toHaveBeenCalledWith('/attendances?patient_id=1');
      expect(result).toEqual({
        success: true,
        value: [mockAttendance]
      });
    });

    it('should return error on failure', async () => {
      const mockError = { status: 500 };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getAttendancesByPatient('1');

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

      expect(mockApi.get).toHaveBeenCalledWith('/attendances/eligible-parent-options?patient_id=1');
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

  describe('getAttendancesForAgenda', () => {
    it('should return agenda attendances without filters', async () => {
      const mockAgendaData = [{ id: 1, patientName: 'John', type: 'assessment', scheduledTime: '10:00' }];
      const mockResponse = { data: mockAgendaData };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getAttendancesForAgenda();

      expect(mockApi.get).toHaveBeenCalledWith('/attendances/agenda');
      expect(result).toEqual({
        success: true,
        value: mockAgendaData
      });
    });

    it('should return agenda attendances with filters', async () => {
      const mockAgendaData = [{ id: 1, patientName: 'John', type: 'assessment', scheduledTime: '10:00' }];
      const mockResponse = { data: mockAgendaData };
      mockApi.get.mockResolvedValue(mockResponse);

      const filters = {
        statuses: [AttendanceStatus.SCHEDULED, AttendanceStatus.COMPLETED],
        type: 'assessment',
        limit: 10,
        fromDate: '2025-01-01',
        toDate: '2025-01-31',
      };
      const result = await getAttendancesForAgenda(filters);

      expect(mockApi.get).toHaveBeenCalledWith(
        '/attendances/agenda?status=scheduled&status=completed&type=assessment&limit=10&from_date=2025-01-01&to_date=2025-01-31',
      );
      expect(result).toEqual({
        success: true,
        value: mockAgendaData
      });
    });

    it('should encode a single selected status as one status query param', async () => {
      const mockAgendaData = [{ id: 1, patientName: 'John', type: 'assessment' }];
      mockApi.get.mockResolvedValue({ data: mockAgendaData });

      await getAttendancesForAgenda({
        statuses: [AttendanceStatus.SCHEDULED],
        type: 'assessment',
      });

      expect(mockApi.get).toHaveBeenCalledWith(
        '/attendances/agenda?status=scheduled&type=assessment',
      );
    });

    it('should return error on failure', async () => {
      const mockError = { status: 500 };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getAttendancesForAgenda();

      expect(result).toEqual({
        success: false,
        error: 'Internal server error, please try again later'
      });
    });
  });

  describe('getNextAttendanceDate', () => {
    it('should return next attendance date on success', async () => {
      const mockNextDate = { next_date: '2024-01-15', available_times: ['10:00', '14:00'] };
      const mockResponse = { data: mockNextDate };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getNextAttendanceDate();

      expect(mockApi.get).toHaveBeenCalledWith('/attendances/next-date');
      expect(result).toEqual({
        success: true,
        value: mockNextDate
      });
    });

    it('should return error on failure', async () => {
      const mockError = { status: 500 };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getNextAttendanceDate();

      expect(result).toEqual({
        success: false,
        error: 'Internal server error, please try again later'
      });
    });
  });

  describe('getAttendanceStats', () => {
    it('should return attendance stats without date', async () => {
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

      const result = await getAttendanceStats();

      expect(mockApi.get).toHaveBeenCalledWith('/attendances/stats');
      expect(result).toEqual({
        success: true,
        value: mockStats
      });
    });

    it('should return attendance stats for specific date', async () => {
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

      const result = await getAttendanceStats('2024-01-15');

      expect(mockApi.get).toHaveBeenCalledWith('/attendances/stats?date=2024-01-15');
      expect(result).toEqual({
        success: true,
        value: mockStats
      });
    });

    it('should return error on failure', async () => {
      const mockError = { status: 500 };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getAttendanceStats();

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
        { attendanceId: 1, justified: true, justification: 'Medical emergency' },
        { attendanceId: 2, justified: false }
      ];
      
      const result = await updateAbsenceJustifications(justifications);

      expect(mockApi.post).toHaveBeenCalledWith('/attendances/absence-justifications', justifications);
      expect(result).toEqual({
        success: true
      });
    });

    it('should return error on failure', async () => {
      const mockError = { status: 400 };
      mockApi.post.mockRejectedValue(mockError);

      const justifications = [
        { attendanceId: 1, justified: true, justification: 'Medical emergency' }
      ];

      const result = await updateAbsenceJustifications(justifications);

      expect(result).toEqual({
        success: false,
        error: 'Invalid request'
      });
    });
  });
});
