import api from '@/api/lib/axios';
import { createHolidayPeriod, updateHolidayGroup, checkIfHoliday, checkIfHolidayForTreatmentType } from '../holidays';
import { CreateHolidayPeriodRequest, UpdateHolidayGroupRequest } from '@/types/holiday';

type MockedApi = {
  get: jest.Mock;
  post: jest.Mock;
  patch: jest.Mock;
};

jest.mock('@/api/lib/axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('holidays API', () => {
  const request: CreateHolidayPeriodRequest = {
    startDate: '2026-02-08',
    endDate: '2026-02-14',
    name: 'Test week',
    description: 'Full period',
    blockedTreatmentTypes: ['assessment'],
  };

  beforeEach(() => {
    (api as unknown as MockedApi).get.mockReset();
    (api as unknown as MockedApi).post.mockReset();
    (api as unknown as MockedApi).patch.mockReset();
  });

  it('should create holiday period successfully', async () => {
    (api as unknown as MockedApi).post.mockResolvedValue({
      data: { successCount: 7, failureCount: 0, errors: [] },
    });

    const result = await createHolidayPeriod(request);

    expect(result).toEqual({
      success: true,
      value: { successCount: 7, failureCount: 0, errors: [] },
    });
  });

  it('should return appointment conflict message for period creation', async () => {
    (api as unknown as MockedApi).post.mockRejectedValue({
      response: {
        status: 409,
        data: { message: 'APPOINTMENT_CONFLICT:2' },
      },
    });

    const result = await createHolidayPeriod(request);

    expect(result).toEqual({
      success: false,
      error:
        'There are 2 appointment(s) scheduled in the requested period. Remove or reschedule them before creating the holiday.',
    });
  });

  it('should return duplicate holiday message for period creation', async () => {
    (api as unknown as MockedApi).post.mockRejectedValue({
      response: {
        status: 409,
        data: { message: 'DUPLICATE_HOLIDAY' },
      },
    });

    const result = await createHolidayPeriod(request);

    expect(result).toEqual({
      success: false,
      error: 'There is already a holiday in the requested period.',
    });
  });

  describe('Holiday Group Updates', () => {
    const updateRequest: UpdateHolidayGroupRequest = {
      name: 'Updated Holiday Name',
      description: 'Updated description',
      blockedTreatmentTypes: ['assessment', 'physiotherapy'],
    };

    const mockUpdatedHolidays = [
      {
        id: 1,
        holidayDate: '2026-02-08',
        name: 'Updated Holiday Name',
        description: 'Updated description',
        blockedTreatmentTypes: ['assessment', 'physiotherapy'],
        holidayGroupId: 'test-group-id-123',
        createdDate: '2026-02-01',
        updatedDate: '2026-02-02',
      },
      {
        id: 2,
        holidayDate: '2026-02-09',
        name: 'Updated Holiday Name',
        description: 'Updated description',
        blockedTreatmentTypes: ['assessment', 'physiotherapy'],
        holidayGroupId: 'test-group-id-123',
        createdDate: '2026-02-01',
        updatedDate: '2026-02-02',
      },
    ];

    it('should update holiday group successfully', async () => {
      (api as unknown as MockedApi).patch.mockResolvedValue({
        data: mockUpdatedHolidays,
      });

      const result = await updateHolidayGroup('test-group-id-123', updateRequest);

      expect((api as unknown as MockedApi).patch).toHaveBeenCalledWith(
        '/holidays/group/test-group-id-123',
        updateRequest
      );

      expect(result).toEqual({
        success: true,
        value: mockUpdatedHolidays,
      });
    });

    it('should handle error when updating holiday group', async () => {
      (api as unknown as MockedApi).patch.mockRejectedValue({
        response: { status: 404 },
      });

      const result = await updateHolidayGroup('nonexistent-group-id', updateRequest);

      expect(result).toEqual({
        success: false,
        error: 'Resource not found',
      });
    });

    it('should handle network errors when updating holiday group', async () => {
      (api as unknown as MockedApi).patch.mockRejectedValue(new Error('Network error'));

      const result = await updateHolidayGroup('test-group-id-123', updateRequest);

      expect(result).toEqual({
        success: false,
        error: 'Internal server error, please try again later',
      });
    });
  });

  describe('checkIfHoliday', () => {
    it('should return true when date is a holiday', async () => {
      (api as unknown as MockedApi).get.mockResolvedValue({
        data: { isHoliday: true }
      });

      const result = await checkIfHoliday('2026-12-25');

      expect(result).toEqual({ success: true, value: true });
      expect(api.get).toHaveBeenCalledWith('/holidays/check/2026-12-25');
    });

    it('should return false when date is not a holiday', async () => {
      (api as unknown as MockedApi).get.mockResolvedValue({
        data: { isHoliday: false }
      });

      const result = await checkIfHoliday('2026-12-26');

      expect(result).toEqual({ success: true, value: false });
      expect(api.get).toHaveBeenCalledWith('/holidays/check/2026-12-26');
    });
  });

  describe('checkIfHolidayForTreatment', () => {
    it('should return true when date is a holiday that blocks the treatment type', async () => {
      (api as unknown as MockedApi).get.mockResolvedValue({
        data: { isHoliday: true }
      });

      const result = await checkIfHolidayForTreatmentType('2026-12-25', 'assessment');

      expect(result).toEqual({ success: true, value: true });
      expect(api.get).toHaveBeenCalledWith('/holidays/check/2026-12-25', {
        params: { treatmentType: 'assessment' }
      });
    });

    it('should return false when date is a holiday that does not block the treatment type', async () => {
      (api as unknown as MockedApi).get.mockResolvedValue({
        data: { isHoliday: false }
      });

      const result = await checkIfHolidayForTreatmentType('2026-12-25', 'physiotherapy');

      expect(result).toEqual({ success: true, value: false });
      expect(api.get).toHaveBeenCalledWith('/holidays/check/2026-12-25', {
        params: { treatmentType: 'physiotherapy' }
      });
    });

    it('should handle all treatment types', async () => {
      (api as unknown as MockedApi).get
        .mockResolvedValueOnce({ data: { isHoliday: true } }) // assessment
        .mockResolvedValueOnce({ data: { isHoliday: false } }) // physiotherapy
        .mockResolvedValueOnce({ data: { isHoliday: true } }); // tens

      const assessmentResult = await checkIfHolidayForTreatmentType('2026-12-25', 'assessment');
      const physiotherapyResult = await checkIfHolidayForTreatmentType('2026-12-25', 'physiotherapy');
      const tensResult = await checkIfHolidayForTreatmentType('2026-12-25', 'tens');

      expect(assessmentResult.value).toBe(true);
      expect(physiotherapyResult.value).toBe(false);
      expect(tensResult.value).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      (api as unknown as MockedApi).get.mockRejectedValue(new Error('Network error'));

      const result = await checkIfHolidayForTreatmentType('2026-12-25', 'assessment');

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Internal server error, please try again later|Internal server error, please try again later/);
    });
  });
});
