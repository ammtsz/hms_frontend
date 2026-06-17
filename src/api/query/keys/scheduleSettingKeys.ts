export const scheduleSettingKeys = {
  all: ['scheduleSettings'] as const,
  byDay: (dayOfWeek: number) =>
    [...scheduleSettingKeys.all, 'day', dayOfWeek] as const,
};
