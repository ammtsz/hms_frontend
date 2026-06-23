import { useCallback, useState, useEffect, useMemo } from "react";
import type { AppointmentType } from "@/types/types";
import type { AbsenceJustification, ScheduledAbsence } from "../types";
import { useCloseModal } from "@/stores/modalStore";
import { useBoardData } from "@/features/board/hooks/useBoardData";
import { useProcessEndOfDay } from "@/api/query/hooks/useDayFinalizationQueries";
import type { ProcessEndOfDayResponse } from "@/api/day-finalization";

import {
  getIncompleteAppointments,
  getCompletedAppointments,
  getScheduledAbsences,
} from "../../../utils/appointmentDataUtils";

interface UseEndOfDayProps {
  selectedDate: string;
}

export const useEndOfDay = ({
  selectedDate,
}: UseEndOfDayProps) => {
  const { appointmentsByDate, refreshData } = useBoardData();
  const processEndOfDayMutation = useProcessEndOfDay();

  // Memoize all appointment data calculations to prevent infinite loops
  const incompleteAppointments = useMemo(() => 
    getIncompleteAppointments(appointmentsByDate), 
    [appointmentsByDate]
  );
  
  const completedAppointments = useMemo(() => 
    getCompletedAppointments(appointmentsByDate), 
    [appointmentsByDate]
  );
  
  const scheduledAbsencesOriginal = useMemo(() => 
    getScheduledAbsences(appointmentsByDate), 
    [appointmentsByDate]
  );
    
  // Memoize the transformation to prevent infinite loops
  const scheduledAbsences: ScheduledAbsence[] = useMemo(() => {
    return scheduledAbsencesOriginal.map((absence) => ({
      patientId: absence.patientId ?? 0,
      patientName: absence.name,
      appointmentType: absence.appointmentType,
    }));
  }, [scheduledAbsencesOriginal]);

  // Memoize the initial state to prevent recreating on every render
  const initialAbsenceJustifications = useMemo(() => {
    return scheduledAbsences.map((absence) => ({
      patientId: absence.patientId,
      patientName: absence.patientName,
      appointmentType: absence.appointmentType,
      // justified is undefined until user selects
    }));
  }, [scheduledAbsences]);

  // Stable key so appointment refetches with the same absences do not reset user input
  const scheduledAbsencesKey = useMemo(
    () =>
      scheduledAbsences
        .map((a) => `${a.patientId}:${a.appointmentType}`)
        .join(","),
    [scheduledAbsences],
  );

  const [currentStep, setCurrentStep] = useState<
    "incomplete" | "absences" | "confirm" | "summary"
  >("incomplete");
  const [absenceJustifications, setAbsenceJustifications] = useState<
    AbsenceJustification[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processResult, setProcessResult] =
    useState<ProcessEndOfDayResponse | null>(null);


  const closeModal = useCloseModal();

  // Sync when the absence list actually changes (not on every appointments refetch)
  useEffect(() => {
    setAbsenceJustifications(initialAbsenceJustifications);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key tracks list content; initial rows match current scheduledAbsences
  }, [scheduledAbsencesKey]);

  const handleJustificationChange = useCallback(
    (patientId: number, appointmentType: AppointmentType, justified: boolean, justification?: string) => {
      setAbsenceJustifications((prev) => {
        return prev.map((item) =>
          item.patientId === patientId && item.appointmentType === appointmentType
            ? { ...item, justified, justification }
            : item
        );
      });
    },
    []
  );

  const handleNext = useCallback(() => {
    switch (currentStep) {
      case "incomplete":
        setCurrentStep("absences");
        break;
      case "absences":
        setCurrentStep("confirm");
        break;
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    switch (currentStep) {
      case "absences":
        setCurrentStep("incomplete");
        break;
      case "confirm":
        setCurrentStep("absences");
        break;
    }
  }, [currentStep]);

  const handleEndOfDaySubmit = useCallback(
    async () => {
      try {
        const absenceJustificationsPayload = scheduledAbsencesOriginal
          .filter((absence) => absence.appointmentId)
          .map((absence) => {
            const justification = absenceJustifications.find(
              (j) =>
                j.patientId === (absence.patientId ?? 0) &&
                j.appointmentType === absence.appointmentType
            );
            return {
              appointmentId: absence.appointmentId!,
              justified: justification?.justified ?? false,
              notes: justification?.justification ?? "",
            };
          });

        const result = await processEndOfDayMutation.mutateAsync({
          date: selectedDate,
          absenceJustifications: absenceJustificationsPayload,
        });

        setProcessResult(result);
        setCurrentStep("summary");
      } catch (error) {
        console.error("Error finalizing day:", error);
        throw error;
      }
    },
    [
      scheduledAbsencesOriginal,
      absenceJustifications,
      processEndOfDayMutation,
      selectedDate,
    ]
  );

  const handleConclude = useCallback(() => {
    closeModal("endOfDay");
    if (refreshData) {
      refreshData();
    }
  }, [closeModal, refreshData]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await handleEndOfDaySubmit();
    } finally {
      setIsSubmitting(false);
    }
  }, [handleEndOfDaySubmit]);

  const canProceedFromIncomplete = incompleteAppointments.length === 0;
  const canProceedFromAbsences = scheduledAbsences.length === 0 || 
    absenceJustifications.every((j) => j.justified !== undefined);

  return {
    currentStep,
    absenceJustifications,
    isSubmitting,
    processResult,
    canProceedFromIncomplete,
    canProceedFromAbsences,
    scheduledAbsences,
    completedAppointments,
    incompleteAppointments,
    handleJustificationChange,
    handleNext,
    handleBack,
    handleSubmit,
    handleConclude,
  };
};
