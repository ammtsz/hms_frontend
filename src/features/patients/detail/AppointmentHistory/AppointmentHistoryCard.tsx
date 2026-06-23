import React, { useEffect, useState } from "react";
import { Patient } from "@/types/types";
import type { PatientPageSectionId } from "@/features/patients/detail/PatientPageSectionNav";
import { usePatientPageScrollTarget } from "@/features/patients/detail/PatientPageSectionNav";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { usePagination } from "@/features/patients/detail/shared/hooks/usePagination";
import { ShowMoreButton } from "@/features/patients/detail/shared/ShowMoreButton";
import {
  ErrorState,
  AppointmentHistoryEmpty,
} from "@/features/patients/detail/shared/CardStates";
import { AppointmentHistoryHeader } from "./AppointmentHistoryHeader";
import { StatusFilterButtons } from "./StatusFilterButtons";
import { AppointmentHistoryItem } from "./AppointmentHistoryItem";
import {
  useAppointmentHistory,
  StatusFilter,
} from "./hooks/useAppointmentHistory";
import { Card, CardBody } from "@/components/ui";

interface AppointmentHistoryCardProps {
  patient: Patient;
  sectionId?: PatientPageSectionId;
}

/**
 * Main component for displaying patient's appointment history
 * Features: collapsible card, status filtering, pagination, real-time updates
 */
export const AppointmentHistoryCard: React.FC<AppointmentHistoryCardProps> = ({
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
    groupedAppointments,
    treatments,
    loading,
    error,
    isRefreshing,
    handleRefresh,
    refetchAppointments,
    refetchTreatments,
  } = useAppointmentHistory({ patient, statusFilter });

  // Implement pagination for better performance
  const {
    visibleItems: visibleGroupedAppointments,
    hasMoreItems,
    showMore,
    totalItems,
    visibleCount,
  } = usePagination({
    items: groupedAppointments,
    initialPageSize: 3,
    incrementSize: 10,
  });

  return (
    <Card>
      <CardBody>
        <AppointmentHistoryHeader
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
                message="Loading appointment history..."
              />
            )}

            {/* Error State */}
            {error && (
              <ErrorState
                title="Error loading history"
                message={error}
                onRetry={() => {
                  refetchAppointments();
                  refetchTreatments();
                }}
              />
            )}

            {/* Appointment List */}
            {!loading && !error && (
              <div
                className={`space-y-4 transition-opacity duration-300 ${
                  isRefreshing ? "opacity-30" : "opacity-100"
                }`}
              >
                {visibleGroupedAppointments.map((groupedAppointment, index) => (
                  <AppointmentHistoryItem
                    key={`appointment-${groupedAppointment.date}-${index}`}
                    groupedAppointment={groupedAppointment}
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
                    itemLabel="appointments"
                    disabled={loading}
                  />
                )}
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && totalItems === 0 && (
              <AppointmentHistoryEmpty
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
