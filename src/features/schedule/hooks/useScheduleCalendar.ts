import { useEffect, useMemo, useState } from "react";
import { useSchedule, useRefreshSchedule } from "@/api/query/hooks/useScheduleQueries";
import { addCalendarDaysToLocalYmd, getTodayClinic, isValidDateString } from "@/utils/timezoneDate";
import {
  useSelectedDateString,
  useScheduleDayWindowDays,
  useScheduleStatusFilters,
  usePatientFilter,
  useShowNewAttendance,
  useOpenAssessmentIdx,
  useOpenPhysiotherapyIdx,
  useSetSelectedDateString,
  useSetScheduleDayWindowDays,
  useSetScheduleStatusFilters,
  useSetPatientFilter,
  useSetShowNewAttendance,
  useSetOpenAssessmentIdx,
  useSetOpenPhysiotherapyIdx,
} from "@/stores";
import { formatDisplayDate } from "@/utils/dateUtils";
import type { ScheduleItem } from "@/types/types";

export function useScheduleCalendar() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedDate = useSelectedDateString();
  const scheduleDayWindowDays = useScheduleDayWindowDays();
  const scheduleStatusFilters = useScheduleStatusFilters();
  const patientFilter = usePatientFilter();
  const showNewAttendance = useShowNewAttendance();
  const openAssessmentIdx = useOpenAssessmentIdx();
  const openPhysiotherapyIdx = useOpenPhysiotherapyIdx();

  const setSelectedDate = useSetSelectedDateString();
  const setScheduleDayWindowDays = useSetScheduleDayWindowDays();
  const setScheduleStatusFilters = useSetScheduleStatusFilters();
  const setPatientFilter = useSetPatientFilter();
  const setShowNewAttendance = useSetShowNewAttendance();
  const setOpenAssessmentIdx = useSetOpenAssessmentIdx();
  const setOpenPhysiotherapyIdx = useSetOpenPhysiotherapyIdx();

  const refreshScheduleQuery = useRefreshSchedule();

  const referenceDate = isValidDateString(selectedDate.trim())
    ? selectedDate.trim()
    : getTodayClinic();
  const rangeEndDate = useMemo(
    () => addCalendarDaysToLocalYmd(referenceDate, scheduleDayWindowDays - 1),
    [referenceDate, scheduleDayWindowDays],
  );

  const statusesForApi =
    scheduleStatusFilters.length > 0 ? scheduleStatusFilters : undefined;

  const { schedule, isLoading: loading, error } = useSchedule({
    fromDate: referenceDate,
    toDate: rangeEndDate,
    statuses: statusesForApi,
  });

  const scheduleStatusFiltersKey = scheduleStatusFilters.join(",");

  useEffect(() => {
    setOpenAssessmentIdx([]);
    setOpenPhysiotherapyIdx([]);
  }, [
    selectedDate,
    scheduleDayWindowDays,
    scheduleStatusFiltersKey,
    patientFilter,
    setOpenPhysiotherapyIdx,
    setOpenAssessmentIdx,
  ]);

  const filteredSchedule = useMemo(() => {
    const normalizeText = (value: string): string =>
      value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    const normalizedPatientFilter = normalizeText(patientFilter);
    const hasPatientFilter = normalizedPatientFilter.length > 0;

    const applyFilters = (scheduleItems: ScheduleItem[]): ScheduleItem[] =>
      scheduleItems
        .map((item) => ({
          ...item,
          patients: hasPatientFilter
            ? item.patients.filter((patient) =>
                normalizeText(patient.name).includes(normalizedPatientFilter),
              )
            : item.patients,
        }))
        .filter((item) => item.patients.length > 0);

    return {
      assessment: applyFilters(schedule.assessment),
      physiotherapy: applyFilters(schedule.physiotherapy),
    };
  }, [schedule.assessment, schedule.physiotherapy, patientFilter]);

  useEffect(() => {
    const validAssessmentIdx = openAssessmentIdx.filter(
      (idx) => idx < filteredSchedule.assessment.length,
    );
    if (validAssessmentIdx.length !== openAssessmentIdx.length) {
      setOpenAssessmentIdx(validAssessmentIdx);
    }

    const validPhysiotherapyIdx = openPhysiotherapyIdx.filter(
      (idx) => idx < filteredSchedule.physiotherapy.length,
    );
    if (validPhysiotherapyIdx.length !== openPhysiotherapyIdx.length) {
      setOpenPhysiotherapyIdx(validPhysiotherapyIdx);
    }
  }, [
    filteredSchedule.physiotherapy.length,
    filteredSchedule.assessment.length,
    openPhysiotherapyIdx,
    openAssessmentIdx,
    setOpenPhysiotherapyIdx,
    setOpenAssessmentIdx,
  ]);

  const handleRefreshSchedule = async () => {
    setIsRefreshing(true);
    try {
      await refreshScheduleQuery();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFormSuccess = () => {
    setShowNewAttendance(false);
    handleRefreshSchedule();
  };

  const rangeSummaryText = useMemo(() => {
    const fromLabel = formatDisplayDate(referenceDate);
    const toLabel = formatDisplayDate(rangeEndDate);
    return `Period: ${fromLabel} — ${toLabel} (${scheduleDayWindowDays} day${scheduleDayWindowDays !== 1 ? "s" : ""})`;
  }, [referenceDate, rangeEndDate, scheduleDayWindowDays]);

  return {
    selectedDate,
    setSelectedDate,
    scheduleDayWindowDays,
    setScheduleDayWindowDays,
    scheduleStatusFilters,
    setScheduleStatusFilters,
    patientFilter,
    setPatientFilter,
    showNewAttendance,
    setShowNewAttendance,
    openAssessmentIdx,
    setOpenAssessmentIdx,
    openPhysiotherapyIdx,
    setOpenPhysiotherapyIdx,
    filteredSchedule,
    handleFormSuccess,
    loading,
    error: error?.message || null,
    refreshSchedule: handleRefreshSchedule,
    isRefreshing,
    rangeSummaryText,
    referenceDate,
    rangeEndDate,
  };
}
