import React from "react";
import Link from "next/link";
import { formatDateBR } from "@/utils/dateUtils";
import { Button } from "@/components/ui";

// Base Empty State Component
interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  iconBgColor?: string;
  children?: React.ReactNode; // For custom action buttons or additional content
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  iconBgColor = "bg-gray-50",
  children,
}) => (
  <div className="text-center py-8">
    {icon && (
      <div
        className={`${iconBgColor} rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4`}
      >
        <div className="text-2xl">{icon}</div>
      </div>
    )}
    <div className="font-medium text-gray-900 mb-2">{title}</div>
    <div className="text-sm text-gray-600 mb-4 max-w-sm mx-auto">
      {description}
    </div>
    {children}
  </div>
);

// Error State Component
interface ErrorStateProps {
  title: string;
  message: string;
  onRetry: () => void;
  retryLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
  retryLabel = "Tentar novamente",
}) => (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="text-red-500 mr-3">⚠️</div>
        <div>
          <p className="text-red-800 font-medium">{title}</p>
          <p className="text-red-700 text-sm">{message}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="border-red-300 text-red-600 hover:border-red-400 hover:bg-red-50 hover:text-red-800"
      >
        {retryLabel}
      </Button>
    </div>
  </div>
);

// Specialized Empty States for specific cards

// Attendance History Empty State
interface AttendanceHistoryEmptyProps {
  patient: { nextAttendanceDates: Array<{ date: string }> };
  statusFilter?: "all" | "completed" | "missed" | "cancelled";
}

export const AttendanceHistoryEmpty: React.FC<AttendanceHistoryEmptyProps> = ({
  patient,
  statusFilter = "all",
}) => {
  // Define messages based on filter
  const getEmptyStateContent = () => {
    switch (statusFilter) {
      case "completed":
        return {
          title: "Nenhum atendimento concluído",
          description:
            "Este paciente ainda não possui atendimentos concluídos. O histórico será exibido aqui após a conclusão dos atendimentos.",
          iconBgColor: "bg-green-50",
        };
      case "missed":
        return {
          title: "Nenhuma falta registrada",
          description:
            "Este paciente não possui faltas registradas. As faltas aparecerão aqui quando o paciente não comparecer a um agendamento.",
          iconBgColor: "bg-yellow-50",
        };
      case "cancelled":
        return {
          title: "Nenhum atendimento cancelado",
          description:
            "Este paciente não possui atendimentos cancelados. Cancelamentos aparecerão aqui quando o paciente cancelar um agendamento.",
          iconBgColor: "bg-red-50",
        };
      default:
        return {
          title: "Nenhum atendimento registrado",
          description:
            "Este é um novo paciente ou ainda não possui atendimentos registrados. O histórico será exibido aqui após os atendimentos serem concluídos.",
          iconBgColor: "bg-green-50",
        };
    }
  };

  const { title, description, iconBgColor } = getEmptyStateContent();

  return (
    <EmptyState
      title={title}
      description={description}
      iconBgColor={iconBgColor}
    >
      {statusFilter === "all" || statusFilter === "completed" ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <div className="text-sm">
            <div className="font-medium text-blue-900 mb-1">
              💡 Próximos passos:
            </div>
            <div className="text-blue-800">
              {patient.nextAttendanceDates.length > 0
                ? `Próximo atendimento agendado para ${formatDateBR(
                    patient.nextAttendanceDates[0].date,
                  )}`
                : "Agendar primeiro atendimento para iniciar o tratamento"}
            </div>
          </div>
        </div>
      ) : null}
    </EmptyState>
  );
};

// Scheduled Attendances Empty State
interface ScheduledAttendancesEmptyProps {
  patientId: string;
}

export const ScheduledAttendancesEmpty: React.FC<
  ScheduledAttendancesEmptyProps
> = ({ patientId }) => (
  <EmptyState
    // icon="📅"
    title="Nenhum agendamento futuro"
    description="Este paciente não possui agendamentos futuros no momento. Novos agendamentos aparecerão aqui quando criados."
    iconBgColor="bg-blue-50"
  >
    <div className="flex flex-col sm:flex-row gap-2 justify-center">
      <Link
        href={`/agenda?patient=${patientId}&action=schedule`}
        className="inline-flex items-center justify-center px-4 py-2 bg-blue-700 text-white hover:bg-blue-800 rounded-md text-sm font-semibold transition-colors min-h-[44px] flex-1 sm:flex-none text-center"
      >
        📅 Agendar Consulta
      </Link>
      <Link
        href="/agenda"
        className="inline-flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm font-semibold transition-colors min-h-[44px] flex-1 sm:flex-none text-center"
      >
        Ver Agenda
      </Link>
    </div>
  </EmptyState>
);

// Treatment Recommendations Empty State
export const TreatmentRecommendationsEmpty: React.FC = () => (
  <EmptyState
    title="Recomendações não disponíveis"
    description="Este paciente ainda não possui recomendações de tratamento registradas."
    iconBgColor="bg-yellow-50"
  />
);

// Current Treatment Empty State (when no active treatments)
export const CurrentTreatmentEmpty: React.FC = () => (
  <EmptyState
    icon="🗂️"
    title="Nenhum tratamento ativo"
    description="Este paciente não possui tratamentos em andamento no momento. Tratamentos ativos aparecerão aqui quando iniciados."
    iconBgColor="bg-blue-50"
  />
);
