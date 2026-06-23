import { CONSULTATION_NOTES_HEADING } from "@/utils/appointmentStatusLabels";
import { formatDisplayDate } from "@/utils/dateUtils";
import type { ActiveTreatmentRow } from "@/features/patients/detail/AppointmentDetails/helpers/assessmentHelpers";

interface Recommendations {
  date?: string; // YYYY-MM-DD format
  food?: string;
  water?: string;
  ointment?: string;
  notes?: string;
  returnWeeks?: number;
  returnWhenTreatmentComplete?: boolean;
}

interface TreatmentRecommendationsDisplayProps {
  recommendations: { date: string } & Recommendations; // Include date field (YYYY-MM-DD format)
  physiotherapySessions?: ActiveTreatmentRow[];
  tensSessions?: ActiveTreatmentRow[];
}

export const TreatmentRecommendationsDisplay: React.FC<
  TreatmentRecommendationsDisplayProps
> = ({ recommendations, physiotherapySessions = [], tensSessions = [] }) => {
  /** Display strings for active treatment rows (colon separator for this card). */
  const formatTreatmentRecommendationDetails = (
    treatments: ActiveTreatmentRow[],
  ): string[] => {
    if (treatments.length === 0) return [];

    const details = treatments.map((treatment) => {
      const location = treatment.bodyLocation || "not specified";
      const color = treatment.color ? ` (color: ${treatment.color})` : "";
      const sessionsText =
        treatment.plannedSessions === 1
          ? "1 session"
          : `${treatment.plannedSessions} sessions`;
      return `${sessionsText}: ${location}${color}`;
    });

    return details;
  };

  // Check if there are any recommendations to show
  const hasPhysiotherapySessions = physiotherapySessions.length > 0;
  const hasTensSessions = tensSessions.length > 0;

  const hasRecommendations =
    recommendations.food ||
    recommendations.water ||
    recommendations.ointment ||
    recommendations.notes ||
    hasPhysiotherapySessions ||
    hasTensSessions ||
    recommendations.returnWeeks;

  if (!hasRecommendations) {
    return (
      <div className="text-gray-500 italic text-sm">
        No recommendations recorded
      </div>
    );
  }

  return (
    <>
      <h3 className="font-semibold text-gray-900 mb-3">
        Latest Recommendations (
        {recommendations.date
          ? formatDisplayDate(recommendations.date)
          : "Date not available"}
        )
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
        <div className="space-y-4">
          {recommendations.food && (
            <div className="flex items-start justify-start">
              <span className="text-gray-700 text-nowrap mr-2 font-semibold">
                🍎 Food:
              </span>
              <span className="text-gray-900 text-sm">
                {recommendations.food}
              </span>
            </div>
          )}
          {recommendations.water && (
            <div className="flex items-start justify-start">
              <span className="text-gray-700 text-nowrap mr-2 font-semibold">
                💧 Water:
              </span>
              <span className="text-gray-900 text-sm">
                {recommendations.water}
              </span>
            </div>
          )}
          {recommendations.ointment && (
            <div className="flex items-start justify-start">
              <span className="text-gray-700 text-nowrap mr-2 font-semibold">
                🧴 Ointment:
              </span>
              <span className="text-gray-900 text-sm">
                {recommendations.ointment}
              </span>
            </div>
          )}
          {hasPhysiotherapySessions && (
            <div className="flex flex-col items-start">
              <span className="text-gray-700 text-nowrap mr-2 mb-2 font-semibold">
                {`✨ Physiotherapy (${physiotherapySessions.length} ${physiotherapySessions.length > 1 ? "active treatments" : "active treatment"}):`}
              </span>
              <ul className="text-gray-900 text-sm ml-12 list-disc">
                {formatTreatmentRecommendationDetails(
                  physiotherapySessions,
                ).map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </div>
          )}
          {hasTensSessions && (
            <div className="flex flex-col items-start">
              <span className="text-gray-700 text-nowrap mr-2 mb-2 font-semibold">
                {`🪄 TENS (${tensSessions.length} ${tensSessions.length > 1 ? "active treatments" : "active treatment"}):`}
              </span>
              <ul className="text-gray-900 text-sm ml-12 list-disc">
                {formatTreatmentRecommendationDetails(tensSessions).map(
                  (detail) => (
                    <li key={detail}>{detail}</li>
                  ),
                )}
              </ul>
            </div>
          )}
          {recommendations.notes && (
            <div className="border-t border-gray-200 mt-3 pt-3">
              <span className="mb-1 mr-2 font-semibold text-gray-700">
                {CONSULTATION_NOTES_HEADING}
              </span>
              <span className="text-gray-900 text-sm ml-0">
                {recommendations.notes}
              </span>
            </div>
          )}
        </div>
      </div>
      {recommendations.returnWeeks !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
            <span className="font-semibold text-gray-600">📅 Return:</span>
            <span className="text-md sm:text-right">
              {recommendations.returnWhenTreatmentComplete
                ? recommendations.returnWeeks === 0
                  ? "return on the last day of treatment"
                  : `${recommendations.returnWeeks} ${
                      recommendations.returnWeeks > 1 ? "weeks" : "week"
                    } after treatment ends`
                : `${recommendations.returnWeeks} ${
                    recommendations.returnWeeks > 1 ? "weeks" : "week"
                  }`}
            </span>
          </div>
        </div>
      )}
    </>
  );
};
