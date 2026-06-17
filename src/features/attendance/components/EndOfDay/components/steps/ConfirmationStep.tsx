import React, { useMemo } from "react";
import { AlertTriangle, Info } from "lucide-react";
import type { AbsenceJustification, ScheduledAbsence } from "../../types";
import { formatDateBR } from "@/utils/dateUtils";
import type { IAttendanceStatusDetailWithType } from "../../../../utils/attendanceDataUtils";
import {
  groupAbsenceJustificationsByCard,
  getAbsenceCardLabelParts,
  groupAttendancesForDisplayWithBodyLocation,
} from "../../utils/confirmationStepUtils";
import { Button } from "@/components/ui";

interface ConfirmationStepProps {
  selectedDate: string;
  completedAttendances: IAttendanceStatusDetailWithType[];
  scheduledAbsences: ScheduledAbsence[];
  absenceJustifications: AbsenceJustification[];
  isSubmitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  selectedDate,
  completedAttendances,
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

  // Group completed attendances with locais (body location) counts
  const groupedCompletedAttendances = useMemo(
    () => groupAttendancesForDisplayWithBodyLocation(completedAttendances),
    [completedAttendances],
  );

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">
        Confirmação - {formatDateBR(selectedDate)}
      </h3>

      <div className="space-y-6 mb-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {groupedCompletedAttendances.length}
              </div>
              <div className="text-sm text-green-800">
                Atendimentos Concluídos
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {justifiedCards.length}
              </div>
              <div className="text-sm text-yellow-800">Faltas Justificadas</div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {unjustifiedCards.length}
              </div>
              <div className="text-sm text-red-800">
                Faltas não Justificadas
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Lists */}
        {groupedCompletedAttendances.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Atendimentos Concluídos
            </h4>
            <ul className="space-y-2">
              {groupedCompletedAttendances.map((attendance, index) => (
                <li key={index} className="text-sm text-gray-600">
                  • {attendance.patientName} ({attendance.label})
                </li>
              ))}
            </ul>
          </div>
        )}

        {justifiedCards.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Faltas Justificadas
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
                      Justificativa: {card.justification}
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
              Faltas não Justificadas
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
                Finalizar o dia
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Clique em &quot;Finalizar Dia&quot; para confirmar e registrar
                  todas as informações acima.
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
              <h3 className="text-sm font-medium text-red-800">Atenção</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  Esta ação não pode ser desfeita. Certifique-se de que todas as
                  informações estão corretas antes de prosseguir.
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
            Voltar
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onSubmit}
            disabled={isSubmitting}
            isLoading={isSubmitting}
            loadingText="Finalizando..."
          >
            Finalizar Dia
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationStep;
