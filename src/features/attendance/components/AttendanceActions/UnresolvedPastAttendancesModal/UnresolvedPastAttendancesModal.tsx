"use client";

import React from "react";
import BaseModal from "@/components/common/BaseModal";
import { useUnresolvedPastModal, useCloseModal } from "@/stores/modalStore";
import { useAttendanceStore } from "@/stores";
import { AlertCircle, Calendar } from "lucide-react";
import { formatDateBR } from "@/utils/dateUtils";
import { Button } from "@/components/ui";

// Map status values to Portuguese labels
const statusLabelMap: Record<string, string> = {
  scheduled: "agendados",
  checked_in: "sala de espera",
  in_progress: "em atendimento",
  completed: "concluídos",
  cancelled: "cancelados",
  missed: "faltas",
};

const translateStatuses = (statuses: string[] | string): string => {
  if (Array.isArray(statuses)) {
    return statuses
      .map((status) => statusLabelMap[status] || status)
      .join(" / ");
  }
  // Handle PostgreSQL array format: {scheduled,checked_in}
  let statusStr = statuses;
  if (statusStr.startsWith("{") && statusStr.endsWith("}")) {
    statusStr = statusStr.slice(1, -1); // Remove curly braces
  }
  // Split by comma and translate
  return statusStr
    .split(",")
    .map((status) => statusLabelMap[status.trim()] || status.trim())
    .join(" / ");
};

const UnresolvedPastAttendancesModal: React.FC = () => {
  const { isOpen, dates } = useUnresolvedPastModal();
  const closeModal = useCloseModal();
  const setSelectedDate = useAttendanceStore((state) => state.setSelectedDate);

  const handleViewDate = (date: string) => {
    // Ensure date is in YYYY-MM-DD format by extracting the date part
    // This handles both "YYYY-MM-DD" and ISO strings like "YYYY-MM-DDTHH:mm:ss.sssZ"
    const dateStr = date.split("T")[0];
    setSelectedDate(dateStr);
    closeModal("unresolvedPast");
  };

  const handleClose = () => {
    closeModal("unresolvedPast");
  };

  if (!dates || dates.length === 0) return null;

  // Calculate totals
  const totalAttendances = dates.reduce((sum, d) => sum + d.count, 0);
  const totalDatesCount = dates.length;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Atendimentos Pendentes"
    >
      <div className="p-6">
        {/* Alert Icon */}
        <div className="flex items-center justify-center mb-4">
          <div className="rounded-full bg-yellow-100 p-3">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        {/* Summary */}
        <div className="text-center mb-6">
          <p className="text-lg font-semibold text-gray-800 mb-2">
            {totalAttendances === 1
              ? "1 atendimento não resolvido"
              : `${totalAttendances} atendimentos não resolvidos`}
          </p>
          <p className="text-sm text-gray-500">
            em {totalDatesCount}{" "}
            {totalDatesCount === 1 ? "data passada" : "datas passadas"}
          </p>
        </div>

        {/* List of dates */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-h-96 overflow-y-auto">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Datas com atendimentos pendentes:
          </p>
          <div className="space-y-2">
            {dates.map((dateInfo) => (
              <div
                key={dateInfo.date}
                className="bg-white rounded-lg p-3 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {formatDateBR(dateInfo.date)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {dateInfo.count}{" "}
                    {dateInfo.count === 1 ? "atendimento" : "atendimentos"}
                    {dateInfo.statuses && (
                      <span className="text-gray-500 ml-1">
                        ({translateStatuses(dateInfo.statuses)})
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleViewDate(dateInfo.date)}
                  className="gap-1.5 bg-blue-600 hover:bg-blue-700"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Ver
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Info message */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-700">
            {totalAttendances === 1
              ? "Este atendimento precisa ser finalizado, cancelado ou marcado como falta."
              : "Estes atendimentos precisam ser finalizados, cancelados ou marcados como falta."}
          </p>
        </div>

        {/* Close button */}
        <div>
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full rounded-lg text-gray-700"
          >
            Fechar
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default UnresolvedPastAttendancesModal;
