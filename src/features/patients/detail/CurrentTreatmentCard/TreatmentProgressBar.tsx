import React from "react";

interface TreatmentProgressBarProps {
  /** Number of completed sessions */
  completed: number;
  /** Total number of planned sessions */
  total: number;
  /** Treatment type for appropriate coloring */
  treatmentType?: "physiotherapy" | "tens" | "assessment";
  /** Additional session details (optional) */
  sessionDetails?: {
    upcoming: number;
    missed?: number;
    cancelled?: number;
  };
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show detailed breakdown */
  showDetails?: boolean;
}

export const TreatmentProgressBar: React.FC<TreatmentProgressBarProps> = ({
  completed,
  total,
  treatmentType = "assessment",
  sessionDetails,
  size = "md",
  showDetails = false,
}) => {
  // Ensure non-negative values
  const safeCompleted = Math.max(0, completed);
  const safeTotal = Math.max(0, total);

  // Calculate progress percentage
  const progressPercentage =
    safeTotal > 0 ? Math.round((safeCompleted / safeTotal) * 100) : 0;

  // Determine colors based on treatment type
  const getColors = () => {
    switch (treatmentType) {
      case "physiotherapy":
        return {
          bg: "bg-gray-50",
          fill: "bg-yellow-600/50",
          fillBg: "bg-gray-100",
          text: "text-gray-700",
          border: "border-gray-200",
        };
      case "tens":
        return {
          bg: "bg-gray-50",
          fill: "bg-blue-600/50",
          fillBg: "bg-gray-100",
          text: "text-gray-700",
          border: "border-gray-200",
        };
      default: // assessment
        return {
          bg: "bg-gray-100",
          fill: "bg-gray-700",
          text: "text-gray-700",
          border: "border-gray-200",
        };
    }
  };

  const colors = getColors();

  // Size configurations
  const sizeConfig = {
    sm: {
      height: "h-2",
      text: "text-xs",
      padding: "px-2 py-1",
    },
    md: {
      height: "h-3",
      text: "text-sm",
      padding: "px-3 py-2",
    },
    lg: {
      height: "h-4",
      text: "text-base",
      padding: "px-4 py-3",
    },
  };

  const config = sizeConfig[size];

  // Status text based on progress
  const getStatusText = () => {
    if (safeCompleted === safeTotal && safeTotal > 0) {
      return "Tratamento Finalizado";
    }
    if (safeCompleted === 0) {
      return "Tratamento Agendado";
    }
    return `Sessão ${safeCompleted} de ${safeTotal}`;
  };

  return (
    <div
      className={`${colors.bg} ${colors.border} border rounded-lg ${config.padding}`}
    >
      {/* Header with status */}
      <div className="flex items-center justify-between mb-2">
        <div
          className={`font-medium ${colors.text} ${config.text} flex items-center gap-1`}
        >
          <span>{getStatusText()}</span>
        </div>
        <div className={`${colors.text} ${config.text} font-semibold`}>
          {progressPercentage}%
        </div>
      </div>

      {/* Progress bar */}
      <div
        className={`w-full ${colors.fillBg} rounded-full ${config.height} mb-2`}
      >
        <div
          className={`${colors.fill} ${config.height} rounded-full transition-all duration-300 ease-in-out`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Milestone indicators */}
      {safeTotal >= 1 && (
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span
            className={
              safeCompleted >= Math.ceil(safeTotal * 0)
                ? colors.text
                : "text-gray-400"
            }
          >
            0%
          </span>
          <span
            className={
              safeCompleted >= Math.ceil(safeTotal * 0.25)
                ? colors.text
                : "text-gray-400"
            }
          >
            25%
          </span>
          <span
            className={
              safeCompleted >= Math.ceil(safeTotal * 0.5)
                ? colors.text
                : "text-gray-400"
            }
          >
            50%
          </span>
          <span
            className={
              safeCompleted >= Math.ceil(safeTotal * 0.75)
                ? colors.text
                : "text-gray-400"
            }
          >
            75%
          </span>
          <span
            className={
              safeCompleted >= safeTotal ? colors.text : "text-gray-400"
            }
          >
            Concluído
          </span>
        </div>
      )}

      {/* Session details */}
      {showDetails && sessionDetails && (
        <div className="flex flex-wrap gap-2 mt-2">
          {sessionDetails.upcoming > 0 ? (
            <div
              className={`${config.text} text-gray-600 flex items-center gap-1`}
            >
              <span>📅</span>
              <span>
                {sessionDetails.upcoming}{" "}
                {sessionDetails.upcoming > 1 ? "agendadas" : "agendada"}
              </span>
            </div>
          ) : null}
          {sessionDetails.missed && sessionDetails.missed > 0 ? (
            <div
              className={`${config.text} text-orange-600 flex items-center gap-1`}
            >
              <span>⚠️</span>
              <span>
                {sessionDetails.missed}{" "}
                {sessionDetails.missed > 1 ? "perdidas" : "perdida"}
              </span>
            </div>
          ) : null}
          {sessionDetails.cancelled && sessionDetails.cancelled > 0 ? (
            <div
              className={`${config.text} text-red-600 flex items-center gap-1`}
            >
              <span>❌</span>
              <span>
                {sessionDetails.cancelled}{" "}
                {sessionDetails.cancelled > 1 ? "canceladas" : "cancelada"}
              </span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
