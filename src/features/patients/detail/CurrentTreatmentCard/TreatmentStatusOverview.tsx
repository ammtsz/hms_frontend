import React, { useCallback } from "react";
import Link from "next/link";
import { Patient } from "@/types/types";
import { formatDateBR, getDaysOverdue } from "@/utils/dateUtils";
import {
  PATIENT_PAGE_SECTION_IDS,
  SCROLL_AFTER_EXPAND_DELAY_MS,
  usePatientPageScrollTarget,
} from "@/features/patients/detail/PatientPageSectionNav";
const OVERVIEW_CARD_CLASS =
  "block w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:border-blue-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2";

interface TreatmentStatusOverviewProps {
  patient: Patient;
}

export const TreatmentStatusOverview: React.FC<
  TreatmentStatusOverviewProps
> = ({ patient }) => {
  const { setScrollTargetSectionId } = usePatientPageScrollTarget();
  const isExpectedDischarge = patient.status !== "A";
  const daysOverdue = patient.dischargeDate
    ? getDaysOverdue(patient.dischargeDate)
    : 0;
  const isOverdue = isExpectedDischarge && daysOverdue > 0;

  const scrollToScheduledAttendances = useCallback(() => {
    setScrollTargetSectionId(PATIENT_PAGE_SECTION_IDS.scheduledAttendances);
    setTimeout(() => {
      const element = document.getElementById(
        PATIENT_PAGE_SECTION_IDS.scheduledAttendances,
      );
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, SCROLL_AFTER_EXPAND_DELAY_MS);
  }, [setScrollTargetSectionId]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="bg-white border border-gray-200 p-4 rounded-lg">
        <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
          Data de Cadastro
        </div>
        <div className="text-lg font-semibold text-gray-900">
          {formatDateBR(patient.startDate)}
        </div>
      </div>

      <button
        type="button"
        onClick={scrollToScheduledAttendances}
        className={OVERVIEW_CARD_CLASS}
      >
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
          Próximo Atendimento
        </div>
        <div className="text-lg font-semibold text-gray-900 break-words">
          {patient.nextAttendanceDates[0]?.date ? (
            formatDateBR(patient.nextAttendanceDates[0].date)
          ) : (
            <span className="font-medium text-gray-500">Não agendado</span>
          )}
        </div>
        <div className="mt-2 text-xs text-blue-600">
          Ver todos os agendamentos →
        </div>
      </button>

      {patient.status === "A" ? (
        <div className="bg-white border border-gray-200 p-4 rounded-lg block w-full text-left">
          <div className="flex items-center gap-1 text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
            Alta recebida em
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {patient.dischargeDate ? (
              formatDateBR(patient.dischargeDate)
            ) : (
              <span className="text-gray-500 font-medium">Não definida</span>
            )}
          </div>
        </div>
      ) : (
        <Link href={`/patients/${patient.id}/edit?focus=dischargeDate`} className={OVERVIEW_CARD_CLASS}>
          <div className="flex items-center gap-1 text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
            Alta Prevista
            {isOverdue && (
              <span className="">
                ({daysOverdue === 1 ? "1 dia" : `${daysOverdue} dias`} em
                atraso)
              </span>
            )}
          </div>
          <div
            className={`text-lg font-semibold ${
              isOverdue ? "text-red-600" : "text-gray-900"
            }`}
          >
            {patient.dischargeDate ? (
              formatDateBR(patient.dischargeDate)
            ) : (
              <span className="text-gray-500 font-medium">Não definida</span>
            )}
          </div>
          <div className="text-xs text-blue-600 mt-2">Atualizar data →</div>
        </Link>
      )}
    </div>
  );
};
