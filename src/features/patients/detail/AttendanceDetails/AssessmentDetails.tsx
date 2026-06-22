import React from "react";
import { DetailBox } from "./DetailBox";
import {
  formatActiveTreatmentRows,
  RecommendationItem,
  type ActiveTreatmentRow,
} from "./helpers/assessmentHelpers";
import { NotesBox } from "./helpers/treatmentHelpers";
import { ASSESSMENT_DETAILS_TITLE } from "@/utils/attendanceStatusLabels";

export interface AssessmentRecommendation {
  food?: string;
  water?: string;
  ointment?: string;
  physiotherapy?: boolean;
  tens?: boolean;
  returnWeeks?: number;
  returnWhenTreatmentComplete?: boolean;
}

interface AssessmentDetailsProps {
  description?: string;
  recommendations?: AssessmentRecommendation;
  title?: string;
  physiotherapySessions?: ActiveTreatmentRow[];
  tensSessions?: ActiveTreatmentRow[];
  /** Attendance notes (pre-consultation). */
  preConsultationNotes?: string;
  /** Notes from persisted consultation (`hms_consultation`). */
  consultationNotes?: string;
  isAbsent?: boolean;
  isFirstAttendance?: boolean;
}

export const AssessmentDetails: React.FC<AssessmentDetailsProps> = ({
  recommendations,
  title = ASSESSMENT_DETAILS_TITLE,
  physiotherapySessions = [],
  tensSessions = [],
  preConsultationNotes,
  consultationNotes,
  isAbsent,
  isFirstAttendance,
}) => {
  const hasPhysiotherapySessions = physiotherapySessions.length > 0;
  const hasTensSessions = tensSessions.length > 0;

  const hasRecommendations =
    recommendations?.food ||
    recommendations?.water ||
    recommendations?.ointment ||
    hasPhysiotherapySessions ||
    hasTensSessions ||
    (recommendations?.returnWeeks !== undefined &&
      recommendations.returnWeeks >= 0);

  // Format return text
  const getReturnText = () => {
    if (recommendations?.returnWeeks === undefined) return null;

    if (recommendations.returnWhenTreatmentComplete) {
      return recommendations.returnWeeks === 0
        ? "return on the last day of treatment"
        : `${recommendations.returnWeeks} ${
            recommendations.returnWeeks > 1 ? "weeks" : "week"
          } after treatment ends`;
    }

    return `${recommendations.returnWeeks} ${
      recommendations.returnWeeks > 1 ? "weeks" : "week"
    }`;
  };

  return (
    <DetailBox variant={isAbsent ? "disabled" : "assessment"}>
      {/* Header */}
      <div className="text-sm text-gray-700 font-medium mb-2">{title}</div>

      <div className="text-sm text-gray-600 mt-1">
        {isFirstAttendance === undefined
          ? "Appointment scheduled for assessment and medical guidance"
          : isFirstAttendance
            ? "Return appointment scheduled for assessment and medical guidance"
            : "First appointment scheduled for assessment and medical guidance"}
      </div>

      {/* Notes Section */}
      {(preConsultationNotes || consultationNotes) && (
        <div className="flex flex-col gap-1">
          {preConsultationNotes && (
            <NotesBox
              notes={preConsultationNotes}
              noteType="pre-consultation"
              borderColor={isAbsent ? "disabled" : "purple"}
            />
          )}
          {consultationNotes && (
            <NotesBox
              notes={consultationNotes}
              noteType="assessment"
              borderColor={isAbsent ? "disabled" : "purple"}
            />
          )}
        </div>
      )}

      {/* Recommendations Section */}
      {hasRecommendations && (
        <>
          <div className="text-xs font-semibold mb-2 mt-4">
            Recommendations:
          </div>
          <div className="flex flex-col gap-y-2 text-xs">
            {recommendations?.food && (
              <RecommendationItem
                icon="🍎"
                label="Food"
                value={recommendations.food}
              />
            )}

            {recommendations?.water && (
              <RecommendationItem
                icon="💧"
                label="Water"
                value={recommendations.water}
              />
            )}

            {recommendations?.ointment && (
              <RecommendationItem
                icon="🧴"
                label="Ointment"
                value={recommendations.ointment}
              />
            )}

            {hasPhysiotherapySessions && (
              <RecommendationItem
                icon="✨"
                label="Physiotherapy"
                value={
                  <ul className="text-gray-900">
                    {formatActiveTreatmentRows(physiotherapySessions).map(
                      (detail) => (
                        <li key={detail}>{detail}</li>
                      ),
                    )}
                  </ul>
                }
                fullWidth
              />
            )}

            {hasTensSessions && (
              <RecommendationItem
                icon="🪄"
                label="TENS"
                value={
                  <ul className="text-gray-900">
                    {formatActiveTreatmentRows(tensSessions).map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                }
                fullWidth
              />
            )}

            {recommendations?.returnWeeks !== undefined && (
              <RecommendationItem
                icon="📅"
                label="Return"
                value={<span className="font-medium">{getReturnText()}</span>}
                fullWidth
              />
            )}
          </div>
        </>
      )}
    </DetailBox>
  );
};
