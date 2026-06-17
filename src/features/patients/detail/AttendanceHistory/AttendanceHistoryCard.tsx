import React, { useEffect, useState } from "react";
import { Patient } from "@/types/types";
import type { PatientPageSectionId } from "@/features/patients/detail/PatientPageSectionNav";
import { usePatientPageScrollTarget } from "@/features/patients/detail/PatientPageSectionNav";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { usePagination } from "@/features/patients/detail/shared/hooks/usePagination";
import { ShowMoreButton } from "@/features/patients/detail/shared/ShowMoreButton";
import {
  ErrorState,
  AttendanceHistoryEmpty,
} from "@/features/patients/detail/shared/CardStates";
import { AttendanceHistoryHeader } from "./AttendanceHistoryHeader";
import { StatusFilterButtons } from "./StatusFilterButtons";
import { AttendanceHistoryItem } from "./AttendanceHistoryItem";
import {
  useAttendanceHistory,
  StatusFilter,
} from "./hooks/useAttendanceHistory";
import { Card, CardBody } from "@/components/ui";

interface AttendanceHistoryCardProps {
  patient: Patient;
  sectionId?: PatientPageSectionId;
}

/**
 * Main component for displaying patient's attendance history
 * Features: collapsible card, status filtering, pagination, real-time updates
 */
export const AttendanceHistoryCard: React.FC<AttendanceHistoryCardProps> = ({
  patient,
  sectionId,
}) => {
  // UI state
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const { scrollTargetSectionId, setScrollTargetSectionId } =
    usePatientPageScrollTarget();

  useEffect(() => {
    if (sectionId && scrollTargetSectionId === sectionId) {
      setIsCollapsed(false);
      setScrollTargetSectionId(null);
    }
  }, [sectionId, scrollTargetSectionId, setScrollTargetSectionId]);

  // Data management via custom hook
  const {
    groupedAttendances,
    treatments,
    loading,
    error,
    isRefreshing,
    handleRefresh,
    refetchAttendances,
    refetchTreatments,
  } = useAttendanceHistory({ patient, statusFilter });

  // Implement pagination for better performance
  const {
    visibleItems: visibleGroupedAttendances,
    hasMoreItems,
    showMore,
    totalItems,
    visibleCount,
  } = usePagination({
    items: groupedAttendances,
    initialPageSize: 3,
    incrementSize: 10,
  });

  return (
    <Card>
      <CardBody>
        <AttendanceHistoryHeader
          totalItems={totalItems}
          isCollapsed={isCollapsed}
          loading={loading}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          onRefresh={handleRefresh}
        />

        {!isCollapsed && (
          <>
            {/* Status Filter Buttons */}
            {!loading && !error && (
              <StatusFilterButtons
                statusFilter={statusFilter}
                onFilterChange={setStatusFilter}
              />
            )}

            {/* Loading State */}
            {loading && (
              <LoadingSpinner
                size="medium"
                message="Carregando histórico de atendimentos..."
              />
            )}

            {/* Error State */}
            {error && (
              <ErrorState
                title="Erro ao carregar histórico"
                message={error}
                onRetry={() => {
                  refetchAttendances();
                  refetchTreatments();
                }}
              />
            )}

            {/* Attendance List */}
            {!loading && !error && (
              <div
                className={`space-y-4 transition-opacity duration-300 ${
                  isRefreshing ? "opacity-30" : "opacity-100"
                }`}
              >
                {visibleGroupedAttendances.map((groupedAttendance, index) => (
                  <AttendanceHistoryItem
                    key={`attendance-${groupedAttendance.date}-${index}`}
                    groupedAttendance={groupedAttendance}
                    treatments={treatments}
                    patientTreatmentStatus={patient.status}
                    onRescheduleSuccess={handleRefresh}
                  />
                ))}

                {/* Show More Button */}
                {hasMoreItems && (
                  <ShowMoreButton
                    onClick={showMore}
                    totalItems={totalItems}
                    visibleCount={visibleCount}
                    itemLabel="atendimentos"
                    disabled={loading}
                  />
                )}
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && totalItems === 0 && (
              <AttendanceHistoryEmpty
                patient={patient}
                statusFilter={statusFilter}
              />
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
};
