import { useEffect, useMemo, useState } from "react";
import { useAgenda, useRefreshAgenda } from "@/api/query/hooks/useAgendaQueries";
import { addCalendarDaysToLocalYmd, getTodayClinic, isValidDateString } from "@/utils/timezoneDate";
import {
  useSelectedDateString,
  useAgendaDayWindowDays,
  useAgendaStatusFilters,
  usePatientFilter,
  useShowNewAttendance,
  useOpenAssessmentIdx,
  useOpenPhysiotherapyIdx,
  useSetSelectedDateString,
  useSetAgendaDayWindowDays,
  useSetAgendaStatusFilters,
  useSetPatientFilter,
  useSetShowNewAttendance,
  useSetOpenAssessmentIdx,
  useSetOpenPhysiotherapyIdx,
} from "@/stores";
import { formatDisplayDate } from "@/utils/dateUtils";
import type { AgendaItem } from "@/types/types";

export function useAgendaCalendar() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedDate = useSelectedDateString();
  const agendaDayWindowDays = useAgendaDayWindowDays();
  const agendaStatusFilters = useAgendaStatusFilters();
  const patientFilter = usePatientFilter();
  const showNewAttendance = useShowNewAttendance();
  const openAssessmentIdx = useOpenAssessmentIdx();
  const openPhysiotherapyIdx = useOpenPhysiotherapyIdx();

  const setSelectedDate = useSetSelectedDateString();
  const setAgendaDayWindowDays = useSetAgendaDayWindowDays();
  const setAgendaStatusFilters = useSetAgendaStatusFilters();
  const setPatientFilter = useSetPatientFilter();
  const setShowNewAttendance = useSetShowNewAttendance();
  const setOpenAssessmentIdx = useSetOpenAssessmentIdx();
  const setOpenPhysiotherapyIdx = useSetOpenPhysiotherapyIdx();

  const refreshAgendaQuery = useRefreshAgenda();

  const referenceDate = isValidDateString(selectedDate.trim())
    ? selectedDate.trim()
    : getTodayClinic();
  const rangeEndDate = useMemo(
    () => addCalendarDaysToLocalYmd(referenceDate, agendaDayWindowDays - 1),
    [referenceDate, agendaDayWindowDays],
  );

  const statusesForApi =
    agendaStatusFilters.length > 0 ? agendaStatusFilters : undefined;

  const { agenda, isLoading: loading, error } = useAgenda({
    fromDate: referenceDate,
    toDate: rangeEndDate,
    statuses: statusesForApi,
  });

  const agendaStatusFiltersKey = agendaStatusFilters.join(",");

  useEffect(() => {
    setOpenAssessmentIdx([]);
    setOpenPhysiotherapyIdx([]);
  }, [
    selectedDate,
    agendaDayWindowDays,
    agendaStatusFiltersKey,
    patientFilter,
    setOpenPhysiotherapyIdx,
    setOpenAssessmentIdx,
  ]);

  const filteredAgenda = useMemo(() => {
    const normalizeText = (value: string): string =>
      value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    const normalizedPatientFilter = normalizeText(patientFilter);
    const hasPatientFilter = normalizedPatientFilter.length > 0;

    const applyFilters = (agendaItems: AgendaItem[]): AgendaItem[] =>
      agendaItems
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
      assessment: applyFilters(agenda.assessment),
      physiotherapy: applyFilters(agenda.physiotherapy),
    };
  }, [agenda.assessment, agenda.physiotherapy, patientFilter]);

  useEffect(() => {
    const validAssessmentIdx = openAssessmentIdx.filter(
      (idx) => idx < filteredAgenda.assessment.length,
    );
    if (validAssessmentIdx.length !== openAssessmentIdx.length) {
      setOpenAssessmentIdx(validAssessmentIdx);
    }

    const validPhysiotherapyIdx = openPhysiotherapyIdx.filter(
      (idx) => idx < filteredAgenda.physiotherapy.length,
    );
    if (validPhysiotherapyIdx.length !== openPhysiotherapyIdx.length) {
      setOpenPhysiotherapyIdx(validPhysiotherapyIdx);
    }
  }, [
    filteredAgenda.physiotherapy.length,
    filteredAgenda.assessment.length,
    openPhysiotherapyIdx,
    openAssessmentIdx,
    setOpenPhysiotherapyIdx,
    setOpenAssessmentIdx,
  ]);

  const handleRefreshAgenda = async () => {
    setIsRefreshing(true);
    try {
      await refreshAgendaQuery();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFormSuccess = () => {
    setShowNewAttendance(false);
    handleRefreshAgenda();
  };

  const rangeSummaryText = useMemo(() => {
    const fromLabel = formatDisplayDate(referenceDate);
    const toLabel = formatDisplayDate(rangeEndDate);
    return `Period: ${fromLabel} — ${toLabel} (${agendaDayWindowDays} day${agendaDayWindowDays !== 1 ? "s" : ""})`;
  }, [referenceDate, rangeEndDate, agendaDayWindowDays]);

  return {
    selectedDate,
    setSelectedDate,
    agendaDayWindowDays,
    setAgendaDayWindowDays,
    agendaStatusFilters,
    setAgendaStatusFilters,
    patientFilter,
    setPatientFilter,
    showNewAttendance,
    setShowNewAttendance,
    openAssessmentIdx,
    setOpenAssessmentIdx,
    openPhysiotherapyIdx,
    setOpenPhysiotherapyIdx,
    filteredAgenda,
    handleFormSuccess,
    loading,
    error: error?.message || null,
    refreshAgenda: handleRefreshAgenda,
    isRefreshing,
    rangeSummaryText,
    referenceDate,
    rangeEndDate,
  };
}
