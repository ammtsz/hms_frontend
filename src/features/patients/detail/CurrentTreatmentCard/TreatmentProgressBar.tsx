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
  const safeCompleted = Math.max(0, completed);
  const safeTotal = Math.max(0, total);
  const progressPercentage =
    safeTotal > 0 ? Math.round((safeCompleted / safeTotal) * 100) : 0;

  const colors = (() => {
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
      default:
        return {
          bg: "bg-gray-100",
          fill: "bg-gray-700",
          fillBg: "bg-gray-100",
          text: "text-gray-700",
          border: "border-gray-200",
        };
    }
  })();

  const sizeConfig = {
    sm: { height: "h-2", text: "text-xs", padding: "px-2 py-1" },
    md: { height: "h-3", text: "text-sm", padding: "px-3 py-2" },
    lg: { height: "h-4", text: "text-base", padding: "px-4 py-3" },
  } as const;

  const config = sizeConfig[size];

  const getStatusText = () => {
    if (safeCompleted === safeTotal && safeTotal > 0) {
      return "Treatment Completed";
    }
    if (safeCompleted === 0) {
      return "Treatment Scheduled";
    }
    return `Session ${safeCompleted} of ${safeTotal}`;
  };

  return (
    <div
      className={`${colors.bg} ${colors.border} border rounded-lg ${config.padding}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div
          className={`flex items-center gap-1 font-medium ${colors.text} ${config.text}`}
        >
          <span>{getStatusText()}</span>
        </div>
        <div className={`${colors.text} ${config.text} font-semibold`}>
          {progressPercentage}%
        </div>
      </div>

      <div
        className={`w-full ${colors.fillBg} ${config.height} mb-2 rounded-full`}
      >
        <div
          className={`${colors.fill} ${config.height} rounded-full transition-all duration-300 ease-in-out`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {safeTotal >= 1 && (
        <div className="mt-2 flex justify-between text-xs text-gray-500">
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
            Completed
          </span>
        </div>
      )}

      {showDetails && sessionDetails && (
        <div className="mt-2 flex flex-wrap gap-2">
          {sessionDetails.upcoming > 0 ? (
            <div
              className={`${config.text} flex items-center gap-1 text-gray-600`}
            >
              <span>📅</span>
              <span>
                {sessionDetails.upcoming}{" "}
                {sessionDetails.upcoming > 1 ? "scheduled" : "scheduled"}
              </span>
            </div>
          ) : null}

          {sessionDetails.missed && sessionDetails.missed > 0 ? (
            <div
              className={`${config.text} flex items-center gap-1 text-orange-600`}
            >
              <span>⚠️</span>
              <span>
                {sessionDetails.missed}{" "}
                {sessionDetails.missed > 1 ? "missed" : "missed"}
              </span>
            </div>
          ) : null}

          {sessionDetails.cancelled && sessionDetails.cancelled > 0 ? (
            <div
              className={`${config.text} flex items-center gap-1 text-red-600`}
            >
              <span>❌</span>
              <span>
                {sessionDetails.cancelled}{" "}
                {sessionDetails.cancelled > 1 ? "cancelled" : "cancelled"}
              </span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
