import type { ScheduleSettingResponseDto } from "@/api/types";
import { getTodayClinic, addCalendarDaysToLocalYmd } from "@/utils/timezoneDate";
import { getNextDateWithTreatmentSlots } from "@/api/query/hooks/useScheduleSettingQueries";
import type { LocationTreatment } from "@/types/treatment";
import { getDefaultDurationForTreatmentType } from "@/constants/treatment";

export type TreatmentType = "physiotherapy" | "tens";

export function normalizeString(value: string): string {
  return value.toLowerCase().trim();
}

export function clampTreatmentQuantity(
  value: number | undefined,
  fallback = 1,
): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  if (value < 1) return fallback;
  if (value > 50) return fallback;
  return value;
}

export function getDefaultTreatmentStartDate(params: {
  isEditMode: boolean;
  treatments: LocationTreatment[];
  scheduleSettings: ScheduleSettingResponseDto[] | null | undefined;
  /** When adding the first row of this type, use this start date (e.g. copied from other treatment type). */
  defaultStartDate?: string;
}): string {
  const { isEditMode, treatments, scheduleSettings, defaultStartDate } = params;

  if (treatments.length > 0) {
    if (isEditMode) {
      return treatments[0].startDate;
    }

    const lastTreatment = treatments[treatments.length - 1];
    if (lastTreatment.startDate) {
      return lastTreatment.startDate;
    }
  }

  if (defaultStartDate) {
    return defaultStartDate;
  }

  const today = getTodayClinic();
  const oneDayFromToday = addCalendarDaysToLocalYmd(today, 1);
  return getNextDateWithTreatmentSlots(oneDayFromToday, scheduleSettings);
}

export function createNewTreatmentRow(params: {
  treatmentType: TreatmentType;
  treatments: LocationTreatment[];
  defaultQuantity: number;
  isEditMode: boolean;
  scheduleSettings: ScheduleSettingResponseDto[] | null | undefined;
  defaultStartDate?: string;
}): LocationTreatment {
  const { treatmentType, treatments, defaultQuantity, isEditMode } = params;

  const quantity = clampTreatmentQuantity(defaultQuantity, 1);
  const startDate = getDefaultTreatmentStartDate(params);
  const firstRow = treatments[0];

  return {
    locations: [],
    duration:
      isEditMode && firstRow?.duration
        ? firstRow.duration
        : getDefaultDurationForTreatmentType(treatmentType),
    quantity,
    startDate,
  };
}

export function getBlockedLocationsForRow(params: {
  rowIndex: number;
  treatments: LocationTreatment[];
}): Set<string> {
  const { rowIndex, treatments } = params;
  const blocked = new Set<string>();

  treatments.forEach((t, i) => {
    if (i === rowIndex) return;
    t.locations.forEach((loc) => blocked.add(normalizeString(loc)));
  });

  return blocked;
}

export function enforceUniqueLocationsForRow(params: {
  rowIndex: number;
  treatments: LocationTreatment[];
}): LocationTreatment[] {
  const { rowIndex, treatments } = params;
  const nextTreatments = [...treatments];
  const row = nextTreatments[rowIndex];
  if (!row) return nextTreatments;

  const blocked = getBlockedLocationsForRow({
    rowIndex,
    treatments: nextTreatments,
  });

  const nextLocations = row.locations.filter(
    (loc) => !blocked.has(normalizeString(loc)),
  );

  if (nextLocations.length === row.locations.length) return nextTreatments;

  nextTreatments[rowIndex] = {
    ...row,
    locations: nextLocations,
  };

  return nextTreatments;
}

export function getAvailableLocationsForRow(params: {
  activeLocations: string[];
  blockedLocations: Set<string>;
}): string[] {
  const { activeLocations, blockedLocations } = params;
  return activeLocations.filter(
    (loc) => !blockedLocations.has(normalizeString(loc)),
  );
}

export type TreatmentOptionLike = {
  isActive: boolean;
  value: string;
};

export function findInactiveOptionByValue(
  options: TreatmentOptionLike[],
  value: string,
): TreatmentOptionLike | undefined {
  const normalized = normalizeString(value);
  return options.find(
    (opt) => !opt.isActive && normalizeString(opt.value) === normalized,
  );
}
