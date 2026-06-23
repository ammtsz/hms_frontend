import type { ScheduleSettingResponseDto } from "@/api/types";
import { getTodayClinic, addCalendarDaysToLocalYmd } from "@/utils/timezoneDate";
import { getNextDateWithTreatmentSlots } from "@/api/query/hooks/useScheduleSettingQueries";
import type {
  PhysiotherapyLocationTreatment,
  TensLocationTreatment,
} from "@/features/board/components/Consultation/types";

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
  treatments: Array<PhysiotherapyLocationTreatment | TensLocationTreatment>;
  scheduleSettings: ScheduleSettingResponseDto[] | null | undefined;
  /** When adding the first row of this type, use this start date (e.g. copied from other treatment type). */
  defaultStartDate?: string;
}): string {
  const { isEditMode, treatments, scheduleSettings, defaultStartDate } = params;

  if (treatments.length > 0) {
    if (isEditMode) {
      // In edit mode, keep start date consistent with the first existing session
      return treatments[0].startDate;
    }

    // In create mode, when adding new rows, reuse the previous row's start date
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
  treatments: Array<PhysiotherapyLocationTreatment | TensLocationTreatment>;
  defaultQuantity: number;
  isEditMode: boolean;
  scheduleSettings: ScheduleSettingResponseDto[] | null | undefined;
  defaultStartDate?: string;
}): PhysiotherapyLocationTreatment | TensLocationTreatment {
  const {
    treatmentType,
    treatments,
    defaultQuantity,
    isEditMode,
  } = params;

  const quantity = clampTreatmentQuantity(defaultQuantity, 1);
  const startDate = getDefaultTreatmentStartDate(params);

  if (treatmentType === "physiotherapy") {
    const firstPhysiotherapy = treatments[0] as PhysiotherapyLocationTreatment | undefined;
    return {
      locations: [],
      color: isEditMode && firstPhysiotherapy?.color ? firstPhysiotherapy.color : "",
      duration:
        isEditMode && firstPhysiotherapy?.duration ? firstPhysiotherapy.duration : 1,
      quantity,
      startDate,
    };
  }

  return {
    locations: [],
    quantity,
    startDate,
  };
}

export function getBlockedLocationsForRow(params: {
  treatmentType: TreatmentType;
  rowIndex: number;
  treatments: Array<PhysiotherapyLocationTreatment | TensLocationTreatment>;
}): Set<string> {
  const { treatmentType, rowIndex, treatments } = params;
  const blocked = new Set<string>();

  if (treatmentType === "tens") {
    treatments.forEach((t, i) => {
      if (i === rowIndex) return;
      t.locations.forEach((loc) => blocked.add(normalizeString(loc)));
    });
    return blocked;
  }

  const row = treatments[rowIndex] as PhysiotherapyLocationTreatment | undefined;
  const rowColor = normalizeString(row?.color ?? "");

  treatments.forEach((t, i) => {
    if (i === rowIndex) return;
    const other = t as PhysiotherapyLocationTreatment;
    const otherColor = normalizeString(other.color ?? "");
    if (otherColor !== rowColor) return;
    other.locations.forEach((loc) => blocked.add(normalizeString(loc)));
  });

  return blocked;
}

export function enforceUniqueLocationsForRow(params: {
  treatmentType: TreatmentType;
  rowIndex: number;
  treatments: Array<PhysiotherapyLocationTreatment | TensLocationTreatment>;
}): Array<PhysiotherapyLocationTreatment | TensLocationTreatment> {
  const { rowIndex, treatments } = params;
  const nextTreatments = [...treatments];
  const row = nextTreatments[rowIndex];
  if (!row) return nextTreatments;

  const blocked = getBlockedLocationsForRow({
    treatmentType: params.treatmentType,
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
  } as PhysiotherapyLocationTreatment | TensLocationTreatment;

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

