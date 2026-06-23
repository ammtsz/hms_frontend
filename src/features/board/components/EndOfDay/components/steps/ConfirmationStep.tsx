import React, { useMemo } from "react";
import { AlertTriangle, Info } from "lucide-react";
import type { AbsenceJustification, ScheduledAbsence } from "../../types";
import { formatDisplayDate } from "@/utils/dateUtils";
import type { IAppointmentStatusDetailWithType } from "../../../../utils/appointmentDataUtils";
import {
  groupAbsenceJustificationsByCard,
  getAbsenceCardLabelParts,
  groupAppointmentsForDisplayWithBodyLocation,
} from "../../utils/confirmationStepUtils";
import { Button } from "@/components/ui";

interface ConfirmationStepProps {
  selectedDate: string;
  completedAppointments: IAppointmentStatusDetailWithType[];
  scheduledAbsences: ScheduledAbsence[];
  absenceJustifications: AbsenceJustification[];
  isSubmitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  selectedDate,
  completedAppointments,
  scheduledAbsences,
  absenceJustifications,
  isSubmitting,
  onSubmit,
  onBack,
}) => {
  // Group absences by card (one per Kanban card) for correct counts
  const absenceCards = useMemo(
    () =>
      groupAbsenceJustificationsByCard(
        scheduledAbsences,
        absenceJustifications,
      ),
    [scheduledAbsences, absenceJustifications],
  );

  const justifiedCards = absenceCards.filter((c) => c.justified);
  const unjustifiedCards = absenceCards.filter((c) => !c.justified);

  // Group completed appointments with body location counts
  const groupedCompletedAppointments = useMemo(
    () => groupAppointmentsForDisplayWithBodyLocation(completedAppointments),
    [completedAppointments],
  );

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">
        Confirmation - {formatDisplayDate(selectedDate)}
      </h3>

      <div className="space-y-6 mb-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {groupedCompletedAppointments.length}
              </div>
              <div className="text-sm text-green-800">
                Completed Appointments
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {justifiedCards.length}
              </div>
              <div className="text-sm text-yellow-800">Justified Absences</div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {unjustifiedCards.length}
              </div>
              <div className="text-sm text-red-800">Unjustified Absences</div>
            </div>
          </div>
        </div>

        {/* Detailed Lists */}
        {groupedCompletedAppointments.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Completed Appointments
            </h4>
            <ul className="space-y-2">
              {groupedCompletedAppointments.map((appointment, index) => (
                <li key={index} className="text-sm text-gray-600">
                  • {appointment.patientName} ({appointment.label})
                </li>
              ))}
            </ul>
          </div>
        )}

        {justifiedCards.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Justified Absences
            </h4>
            <ul className="space-y-3">
              {justifiedCards.map((card, index) => (
                <li
                  key={`${card.patientId}-${card.hasAssessment ? "assessment" : "treatments"}-${index}`}
                  className="text-sm"
                >
                  <div className="font-medium text-gray-700">
                    • {card.patientName}
                  </div>
                  <div className="text-xs text-blue-600 font-medium mt-1 space-y-0.5">
                    {getAbsenceCardLabelParts(card).map((part) => (
                      <div key={part}>{part}</div>
                    ))}
                  </div>
                  {card.justification && (
                    <div className="text-gray-600 mt-1">
                      Justification: {card.justification}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {unjustifiedCards.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Unjustified Absences
            </h4>
            <ul className="space-y-3">
              {unjustifiedCards.map((card, index) => (
                <li
                  key={`${card.patientId}-${card.hasAssessment ? "assessment" : "treatments"}-${index}`}
                  className="text-sm text-gray-600"
                >
                  <div className="font-medium">• {card.patientName}</div>
                  <div className="text-xs text-blue-600 font-medium mt-1 space-y-0.5">
                    {getAbsenceCardLabelParts(card).map((part) => (
                      <div key={part}>{part}</div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Final Confirmation */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Finalize the day
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Click &quot;Finalize Day&quot; to confirm and record all the
                  information above.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cannot be undone message */}
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Attention</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  This action cannot be undone. Make sure all information is
                  correct before proceeding.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onSubmit}
            disabled={isSubmitting}
            isLoading={isSubmitting}
            loadingText="Finalizing..."
          >
            Finalize Day
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationStep;
