import React, { useState, useMemo } from "react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ShowMoreButton } from "@/features/patients/detail/shared/ShowMoreButton";
import { TreatmentGroupCard, type TreatmentGroup } from "./TreatmentGroupCard";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui";

interface GroupedTreatmentRow extends Omit<
  TreatmentGroup,
  "bodyLocation" | "id"
> {
  bodyLocations: string[];
  sessionIds: number[];
}

const getStatusDates = (
  treatment: TreatmentGroup,
  status: "scheduled" | "cancelled" | "missed",
) =>
  treatment.sessions
    ?.filter((sessionRow) => sessionRow.status === status)
    .map((sessionRow) => sessionRow.scheduledDate?.split("T")[0])
    .filter((d): d is string => d !== undefined && d !== "")
    .sort((a, b) => b.localeCompare(a))
    .join("_");

// Group treatment plans by type, duration, and planned session count
const groupTreatments = (
  treatments: TreatmentGroup[],
): GroupedTreatmentRow[] => {
  const grouped = new Map<string, GroupedTreatmentRow>();

  treatments.forEach((treatment) => {
    const scheduledDates = getStatusDates(treatment, "scheduled");
    const cancelledDates = getStatusDates(treatment, "cancelled");
    const missedDates = getStatusDates(treatment, "missed");

    const key = `${treatment.treatmentType}-${treatment.plannedSessions}-${treatment.durationMinutes || "0"}-${treatment.completedSessions}-scheduled_${scheduledDates}-cancelled_${cancelledDates}-missed_${missedDates}`;

    if (grouped.has(key)) {
      const existing = grouped.get(key)!;
      existing.bodyLocations.push(treatment.bodyLocation ?? "");
      existing.sessionIds.push(treatment.id!);
      if (treatment.sessions) {
        existing.sessions = [
          ...(existing.sessions || []),
          ...treatment.sessions,
        ];
      }
    } else {
      grouped.set(key, {
        treatmentType: treatment.treatmentType,
        bodyLocations: [treatment.bodyLocation ?? ""],
        sessionIds: [treatment.id!],
        plannedSessions: treatment.plannedSessions,
        completedSessions: treatment.completedSessions,
        status: treatment.status,
        durationMinutes: treatment.durationMinutes,
        sessions: treatment.sessions ? [...treatment.sessions] : undefined,
      });
    }
  });

  return Array.from(grouped.values());
};

interface ActiveTreatmentsProps {
  physiotherapySessions: TreatmentGroup[];
  tensSessions: TreatmentGroup[];
  visiblePhysiotherapySessions: TreatmentGroup[];
  visibleTensSessions: TreatmentGroup[];
  hasMorePhysiotherapy: boolean;
  hasMoreTens: boolean;
  showMorePhysiotherapy: () => void;
  showMoreTens: () => void;
  totalPhysiotherapy: number;
  totalTens: number;
  visiblePhysiotherapyCount: number;
  visibleTensCount: number;
  treatmentsLoading: boolean;
  onDeleteSession: (sessionIds: number[], sessionType: string) => void;
  isDeleting: boolean;
  patientId?: number;
  patientName?: string;
  onOpenEditModal?: (
    treatmentPlans: TreatmentGroup[],
    treatmentType: "physiotherapy" | "tens",
  ) => void;
}

export const ActiveTreatments: React.FC<ActiveTreatmentsProps> = ({
  physiotherapySessions,
  tensSessions,
  visiblePhysiotherapySessions,
  visibleTensSessions,
  hasMorePhysiotherapy,
  hasMoreTens,
  showMorePhysiotherapy,
  showMoreTens,
  totalPhysiotherapy,
  totalTens,
  visiblePhysiotherapyCount,
  visibleTensCount,
  treatmentsLoading,
  onDeleteSession,
  isDeleting,
  patientId,
  patientName,
  onOpenEditModal,
}) => {
  // Collapsible state - default to expanded
  const [isPhysiotherapyExpanded, setIsPhysiotherapyExpanded] = useState(true);
  const [isTensExpanded, setIsTensExpanded] = useState(true);

  // Group sessions by treatment type, duration, and planned sessions
  const groupedPhysiotherapy = useMemo(
    () => groupTreatments(physiotherapySessions),
    [physiotherapySessions],
  );
  const groupedTens = useMemo(
    () => groupTreatments(tensSessions),
    [tensSessions],
  );
  const groupedVisiblePhysiotherapy = useMemo(
    () => groupTreatments(visiblePhysiotherapySessions),
    [visiblePhysiotherapySessions],
  );
  const groupedVisibleTens = useMemo(
    () => groupTreatments(visibleTensSessions),
    [visibleTensSessions],
  );

  const canEditGroup = (treatments: TreatmentGroup[]) =>
    treatments.every((t) => (t.completedSessions ?? 0) === 0);

  // Don't render if no active sessions
  if (
    !treatmentsLoading &&
    physiotherapySessions.length === 0 &&
    tensSessions.length === 0
  ) {
    return null;
  }

  return (
    <div className="mb-6 mt-10">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        Active Treatments Progress
        {treatmentsLoading && <LoadingSpinner size="small" />}
      </h3>

      {/* Physiotherapy Treatments */}
      {groupedPhysiotherapy.length > 0 && (
        <div className="mb-4">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setIsPhysiotherapyExpanded(!isPhysiotherapyExpanded)}
            className="mb-2 w-full justify-start text-yellow-700 hover:bg-yellow-50 hover:text-yellow-800"
            aria-expanded={isPhysiotherapyExpanded}
            aria-controls="physiotherapy-sessions"
          >
            {isPhysiotherapyExpanded ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            )}
            Physiotherapy
            <span className="text-xs text-gray-500">
              ({groupedPhysiotherapy.length})
            </span>
          </Button>

          {isPhysiotherapyExpanded && (
            <div id="physiotherapy-sessions" className="space-y-2">
              {groupedVisiblePhysiotherapy.map((row) => {
                const editTreatmentPlans = visiblePhysiotherapySessions.filter(
                  (t) => t.id != null && row.sessionIds.includes(t.id),
                );
                const canEdit =
                  !!onOpenEditModal &&
                  !!patientId &&
                  !!patientName &&
                  canEditGroup(editTreatmentPlans);
                return (
                  <TreatmentGroupCard
                    key={row.sessionIds.join("-")}
                    group={row}
                    onDelete={onDeleteSession}
                    isDeleting={isDeleting}
                    canEdit={canEdit}
                    onEdit={() =>
                      onOpenEditModal?.(editTreatmentPlans, "physiotherapy")
                    }
                  />
                );
              })}

              {/* Show More Button for Physiotherapy */}
              {hasMorePhysiotherapy && (
                <ShowMoreButton
                  onClick={showMorePhysiotherapy}
                  totalItems={totalPhysiotherapy}
                  visibleCount={visiblePhysiotherapyCount}
                  itemLabel="sessions"
                  disabled={treatmentsLoading}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* TENS Treatments */}
      {groupedTens.length > 0 && (
        <div className="mb-4">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setIsTensExpanded(!isTensExpanded)}
            className="mb-2 w-full justify-start text-blue-700 hover:bg-blue-50 hover:text-blue-800"
            aria-expanded={isTensExpanded}
            aria-controls="tens-sessions"
          >
            {isTensExpanded ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            )}
            TENS
            <span className="text-xs text-gray-500">
              ({groupedTens.length})
            </span>
          </Button>

          {isTensExpanded && (
            <div id="tens-sessions" className="space-y-2">
              {groupedVisibleTens.map((row) => {
                const editTreatmentPlans = visibleTensSessions.filter(
                  (t) => t.id != null && row.sessionIds.includes(t.id),
                );
                const canEdit =
                  !!onOpenEditModal &&
                  !!patientId &&
                  !!patientName &&
                  canEditGroup(editTreatmentPlans);
                return (
                  <TreatmentGroupCard
                    key={row.sessionIds.join("-")}
                    group={row}
                    onDelete={onDeleteSession}
                    isDeleting={isDeleting}
                    canEdit={canEdit}
                    onEdit={() => onOpenEditModal?.(editTreatmentPlans, "tens")}
                  />
                );
              })}

              {/* Show More Button for TENS */}
              {hasMoreTens && (
                <ShowMoreButton
                  onClick={showMoreTens}
                  totalItems={totalTens}
                  visibleCount={visibleTensCount}
                  itemLabel="sessions"
                  disabled={treatmentsLoading}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
