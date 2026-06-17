import {
  getScheduleSettings,
  getScheduleSettingById,
  getScheduleSettingByDay,
  createScheduleSetting,
  updateScheduleSetting,
  deleteScheduleSetting,
  getActiveScheduleSettings
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

describe('Schedule Settings API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockScheduleSetting = {
    id: 1,
    dayOfWeek: 1, // Monday
    startTime: '09:00',
    endTime: '17:00',
    maxConcurrentAssessment: 5,
    maxConcurrentPhysiotherapyTens: 3,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  describe('getScheduleSettings', () => {
    it('should return schedule settings on success', async () => {
      const mockResponse = { data: [mockScheduleSetting] };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getScheduleSettings();

      expect(mockApi.get).toHaveBeenCalledWith('/schedule-settings');
      expect(result).toEqual({
        success: true,
        value: [mockScheduleSetting]
      });
    });

    it('should return error on failure', async () => {
      const mockError = { status: 500 };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getScheduleSettings();

      expect(result).toEqual({
        success: false,
        error: 'Erro interno do servidor, por favor tente novamente mais tarde'
      });
    });
  });

  describe('getScheduleSettingById', () => {
    it('should return schedule setting on success', async () => {
      const mockResponse = { data: mockScheduleSetting };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getScheduleSettingById('1');

      expect(mockApi.get).toHaveBeenCalledWith('/schedule-settings/1');
      expect(result).toEqual({
        success: true,
        value: mockScheduleSetting
      });
    });

    it('should return error when not found', async () => {
      const mockError = { status: 404 };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getScheduleSettingById('999');

      expect(result).toEqual({
        success: false,
        error: 'Recurso não encontrado'
      });
    });
  });

  describe('getScheduleSettingByDay', () => {
    it('should return schedule setting on success', async () => {
      const mockResponse = { data: mockScheduleSetting };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getScheduleSettingByDay(1);

      expect(mockApi.get).toHaveBeenCalledWith('/schedule-settings/day/1');
      expect(result).toEqual({
        success: true,
        value: mockScheduleSetting
      });
    });

    it('should return success with null value when no setting for day (404)', async () => {
      const mockError = { response: { status: 404 } };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getScheduleSettingByDay(3);

      expect(mockApi.get).toHaveBeenCalledWith('/schedule-settings/day/3');
      expect(result).toEqual({
        success: true,
        value: null
      });
    });

    it('should return error on non-404 failure', async () => {
      const mockError = { response: { status: 500 } };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getScheduleSettingByDay(0);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getActiveScheduleSettings', () => {
    it('should return active schedule settings on success', async () => {
      const mockResponse = { data: [mockScheduleSetting, { ...mockScheduleSetting, id: 2, isActive: false }] };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getActiveScheduleSettings();

      expect(mockApi.get).toHaveBeenCalledWith('/schedule-settings');
      expect(result).toEqual({
        success: true,
        value: [mockScheduleSetting] // Only active settings
      });
    });

    it('should return error on failure', async () => {
      const mockError = { status: 500 };
      mockApi.get.mockRejectedValue(mockError);

      const result = await getActiveScheduleSettings();

      expect(result).toEqual({
        success: false,
        error: 'Erro interno do servidor, por favor tente novamente mais tarde'
      });
    });
  });

  describe('createScheduleSetting', () => {
    it('should create schedule setting on success', async () => {
      const settingData = {
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        maxConcurrentAssessment: 5,
        maxConcurrentPhysiotherapyTens: 3,
        isActive: true
      };
      const mockResponse = { data: mockScheduleSetting };
      mockApi.post.mockResolvedValue(mockResponse);

      const result = await createScheduleSetting(settingData);

      expect(mockApi.post).toHaveBeenCalledWith('/schedule-settings', settingData);
      expect(result).toEqual({
        success: true,
        value: mockScheduleSetting
      });
    });

    it('should return error on validation failure', async () => {
      const settingData = {
        dayOfWeek: 8, // Invalid day (0-6 valid)
        startTime: '25:00', // Invalid time
        endTime: '17:00',
        maxConcurrentAssessment: -1, // Invalid negative number
        maxConcurrentPhysiotherapyTens: 3,
        isActive: true
      };
      const mockError = { status: 400 };
      mockApi.post.mockRejectedValue(mockError);

      const result = await createScheduleSetting(settingData);

      expect(result).toEqual({
        success: false,
        error: 'Requisição inválida'
      });
    });
  });

  describe('updateScheduleSetting', () => {
    it('should update schedule setting on success', async () => {
      const updateData = { maxConcurrentAssessment: 8 };
      const mockResponse = { data: { ...mockScheduleSetting, maxConcurrentAssessment: 8 } };
      mockApi.patch.mockResolvedValue(mockResponse);

      const result = await updateScheduleSetting('1', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/schedule-settings/1', updateData);
      expect(result).toEqual({
        success: true,
        value: { ...mockScheduleSetting, maxConcurrentAssessment: 8 }
      });
    });

    it('should return error when not found', async () => {
      const updateData = { maxConcurrentAssessment: 8 };
      const mockError = { status: 404 };
      mockApi.patch.mockRejectedValue(mockError);

      const result = await updateScheduleSetting('999', updateData);

      expect(result).toEqual({
        success: false,
        error: 'Recurso não encontrado'
      });
    });

    it('should handle deactivating schedule setting', async () => {
      const updateData = { isActive: false };
      const mockResponse = {
        data: {
          ...mockScheduleSetting,
          isActive: false
        }
      };
      mockApi.patch.mockResolvedValue(mockResponse);

      const result = await updateScheduleSetting('1', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/schedule-settings/1', updateData);
      expect(result).toEqual({
        success: true,
        value: {
          ...mockScheduleSetting,
          isActive: false
        }
      });
    });
  });

  describe('deleteScheduleSetting', () => {
    it('should delete schedule setting on success', async () => {
      mockApi.delete.mockResolvedValue({});

      const result = await deleteScheduleSetting('1');

      expect(mockApi.delete).toHaveBeenCalledWith('/schedule-settings/1');
      expect(result).toEqual({
        success: true
      });
    });

    it('should return error when not found', async () => {
      const mockError = { status: 404 };
      mockApi.delete.mockRejectedValue(mockError);

      const result = await deleteScheduleSetting('999');

      expect(result).toEqual({
        success: false,
        error: 'Recurso não encontrado'
      });
    });

    it('should return error on server error', async () => {
      const mockError = { status: 500 };
      mockApi.delete.mockRejectedValue(mockError);

      const result = await deleteScheduleSetting('1');

      expect(result).toEqual({
        success: false,
        error: 'Erro interno do servidor, por favor tente novamente mais tarde'
      });
    });
  });
});
