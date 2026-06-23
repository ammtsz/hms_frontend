import React from "react";
import type { ScheduledAbsence, AbsenceJustification } from "../../types";
import type { AppointmentType } from "@/types/types";
import { useAbsenceJustification } from "../../hooks/useAbsenceJustification";
import { EmptyAbsencesState } from "../EmptyAbsencesState";
import { AbsencesSummary } from "../AbsencesSummary";
import { PatientAbsenceCard } from "../PatientAbsenceCard";
import { formatDisplayDate } from "@/utils/dateUtils";
import { Button } from "@/components/ui";

interface AbsenceJustificationStepProps {
  scheduledAbsences: ScheduledAbsence[];
  selectedDate: string;
  absenceJustifications: AbsenceJustification[];
  onJustificationChange: (
    patientId: number,
    appointmentType: AppointmentType,
    justified: boolean,
    justification?: string,
  ) => void;
  onNext: () => void;
  onBack: () => void;
}

const AbsenceJustificationStep: React.FC<AbsenceJustificationStepProps> = ({
  scheduledAbsences,
  selectedDate,
  absenceJustifications,
  onJustificationChange,
  onNext,
  onBack,
}) => {
  const {
    groupedAbsences,
    getApplyToAll,
    toggleApplyToAll,
    handleJustificationChange,
    getJustificationForType,
    formatAbsencesList,
    allJustified,
  } = useAbsenceJustification({
    scheduledAbsences,
    absenceJustifications,
    onJustificationChange,
  });

  return (
    <div className="flex flex-col justify-between min-h-96">
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Scheduled Absences - {formatDisplayDate(selectedDate)}
        </h3>

        {scheduledAbsences.length === 0 ? (
          <EmptyAbsencesState />
        ) : (
          <div className="space-y-4 mb-auto">
            <AbsencesSummary count={groupedAbsences.length} />

            {groupedAbsences.map((group) => (
              <PatientAbsenceCard
                key={group.patientId}
                group={group}
                applyToAll={getApplyToAll(group.patientId)}
                formatAbsencesList={formatAbsencesList}
                getJustificationForType={getJustificationForType}
                handleJustificationChange={handleJustificationChange}
                toggleApplyToAll={toggleApplyToAll}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse justify-between gap-3 mt-6 sm:flex-row">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          onClick={onNext}
          disabled={scheduledAbsences.length > 0 && !allJustified}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default AbsenceJustificationStep;
