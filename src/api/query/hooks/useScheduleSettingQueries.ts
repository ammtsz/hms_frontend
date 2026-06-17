import { useQuery } from '@tanstack/react-query';
import {
  getScheduleSettingByDay,
  getScheduleSettings,
} from '@/api/schedule-settings';
import type { ScheduleSettingResponseDto } from '@/api/types';
import {
  hasSlotsForTreatmentOnDate as hasSlotsForTreatmentOnDateUtil,
  hasSlotsForAssessmentOnDate as hasSlotsForAssessmentOnDateUtil,
  getNextDateWithTreatmentSlots as getNextDateWithTreatmentSlotsUtil,
  hasInvalidTreatmentStartDates as hasInvalidTreatmentStartDatesUtil,
} from '@/utils/scheduleTreatmentSlots';

import { scheduleSettingKeys } from '@/api/query/keys/scheduleSettingKeys';

/** Re-export shared messages for UI. */
export { TREATMENT_SLOTS_UNAVAILABLE_MESSAGE, ASSESSMENT_SLOTS_UNAVAILABLE_MESSAGE } from '@/utils/scheduleTreatmentSlots';

/**
 * Returns whether the given date has available slots for assessment consultation.
 * Use with data from useScheduleSettings().
 */
export function hasSlotsForAssessmentOnDate(
  dateString: string,
  slots: ScheduleSettingResponseDto[] | null | undefined,
): boolean {
  return hasSlotsForAssessmentOnDateUtil(dateString, slots);
}

/** Re-export for consumers that use schedule settings from this hook. */
export type { TreatmentWithStartDate } from '@/utils/scheduleTreatmentSlots';

/**
 * Returns whether the given date has available slots for treatments (physiotherapy/tens).
 * Use with data from useScheduleSettings().
 */
export function hasSlotsForTreatmentOnDate(
  dateString: string,
  slots: ScheduleSettingResponseDto[] | null | undefined,
): boolean {
  return hasSlotsForTreatmentOnDateUtil(dateString, slots);
}

/**
 * Returns the next date (YYYY-MM-DD) on or after the given date that has treatment slots.
 * If no slots found in the next 60 days, returns the original date.
 */
export function getNextDateWithTreatmentSlots(
  fromDateString: string,
  slots: ScheduleSettingResponseDto[] | null | undefined,
): string {
  return getNextDateWithTreatmentSlotsUtil(fromDateString, slots);
}

/**
 * Returns true if any treatment (physiotherapy or tens) has a startDate that has no available slots.
 * Use to block submit when scheduling treatments automatically.
 */
export function hasInvalidTreatmentStartDates(
  slots: ScheduleSettingResponseDto[] | null | undefined,
  physiotherapyTreatments: { startDate: string }[] | undefined,
  tensTreatments: { startDate: string }[] | undefined,
): boolean {
  return hasInvalidTreatmentStartDatesUtil(
    slots,
    physiotherapyTreatments,
    tensTreatments,
  );
}

/**
 * Fetches all schedule settings (one per day of week). Use when validating
 * arbitrary dates for treatment scheduling.
 */
export function useScheduleSettings() {
  return useQuery({
    queryKey: scheduleSettingKeys.all,
    queryFn: async (): Promise<ScheduleSettingResponseDto[]> => {
      const result = await getScheduleSettings();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch schedule settings');
      }
      return result.value ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetches schedule setting for a day of week (0 = Sunday, 6 = Saturday).
 * Used to determine if walkIn is allowed (e.g. day has slots and is active).
 */
export function useScheduleSettingByDay(dayOfWeek: number) {
  return useQuery({
    queryKey: scheduleSettingKeys.byDay(dayOfWeek),
    queryFn: async (): Promise<ScheduleSettingResponseDto | null> => {
      const result = await getScheduleSettingByDay(dayOfWeek);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch schedule setting');
      }
      return result.value ?? null;
    },
    enabled: dayOfWeek >= 0 && dayOfWeek <= 6,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Returns whether the given schedule setting allows walkIn (has at least one slot type and is active).
 */
export function hasSlotsForWalkIn(
  slots: ScheduleSettingResponseDto | null | undefined,
): boolean {
  if (!slots || !slots.isActive) return false;
  return (
    (slots.maxConcurrentAssessment ?? 0) > 0 ||
    (slots.maxConcurrentPhysiotherapyTens ?? 0) > 0
  );
}
