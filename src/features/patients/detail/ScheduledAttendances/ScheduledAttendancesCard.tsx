import React, { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Patient } from "@/types/types";
import type { PatientPageSectionId } from "@/features/patients/detail/PatientPageSectionNav";
import { usePatientPageScrollTarget } from "@/features/patients/detail/PatientPageSectionNav";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { usePatientAttendances } from "@/api/query/hooks/usePatientQueries";
import { useTreatmentsByPatient } from "@/api/query/hooks/useTreatmentsQueries";
import { transformAttendanceToNext } from "@/utils/apiTransformers";
import { usePagination } from "@/features/patients/detail/shared/hooks/usePagination";
import { ShowMoreButton } from "@/features/patients/detail/shared/ShowMoreButton";
import { groupScheduledAttendancesByDate } from "@/utils/attendanceHistoryUtils";
import { ScheduledAttendanceItem } from "./ScheduledAttendanceItem";
import {
  ErrorState,
  ScheduledAttendancesEmpty,
} from "@/features/patients/detail/shared/CardStates";
import { DetailCardCollapsibleHeader } from "@/features/patients/detail/shared/DetailCardCollapsibleHeader";
import { Button, Card, CardBody } from "@/components/ui";

interface ScheduledAttendancesCardProps {
  patient: Patient;
  sectionId?: PatientPageSectionId;
}

export const ScheduledAttendancesCard: React.FC<
  ScheduledAttendancesCardProps
> = ({ patient, sectionId }) => {
  // State for collapsible card
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { scrollTargetSectionId, setScrollTargetSectionId } =
    usePatientPageScrollTarget();

  useEffect(() => {
    if (sectionId && scrollTargetSectionId === sectionId) {
      setIsCollapsed(false);
      setScrollTargetSectionId(null);
    }
  }, [sectionId, scrollTargetSectionId, setScrollTargetSectionId]);

  // Use separate attendance query for real-time updates and better cache management
  const {
    data: attendancesData,
    isLoading: attendancesLoading,
    error: attendancesError,
    refetch: refetchAttendances,
  } = usePatientAttendances(patient.id);

  // Fetch treatments (plans + session rows) for this patient
  const {
    treatments,
    loading: treatmentsLoading,
    error: treatmentsError,
    refetch: refetchTreatments,
  } = useTreatmentsByPatient(parseInt(patient.id));

  // Transform raw attendance data to scheduled attendances format
  const enhancedScheduledAttendances = React.useMemo(() => {
    if (!attendancesData) return [];

    // Transform all attendances - groupScheduledAttendancesByDate will filter appropriately
    const scheduledAttendances = attendancesData
      .sort(
        (a, b) =>
          new Date(a.scheduledDate + "T00:00:00").getTime() -
          new Date(b.scheduledDate + "T00:00:00").getTime(),
      )
      .map(transformAttendanceToNext);

    return scheduledAttendances;
  }, [attendancesData]);

  // Group scheduled attendances with treatment plan data
  const groupedScheduledAttendances = React.useMemo(() => {
    return groupScheduledAttendancesByDate(
      enhancedScheduledAttendances,
      treatments,
    );
  }, [enhancedScheduledAttendances, treatments]);

  // Implement pagination for better performance
  const {
    visibleItems: visibleScheduledAttendances,
    hasMoreItems,
    showMore,
    totalItems,
    visibleCount,
  } = usePagination({
    items: groupedScheduledAttendances,
    initialPageSize: 3,
    incrementSize: 10,
  });

  // Use enhanced data if available, fallback to patient data
  const loading = attendancesLoading || treatmentsLoading;
  const error = attendancesError?.message || treatmentsError || null;

  // Handle refresh with visual feedback
  const handleRefresh = () => {
    setIsRefreshing(true);
    refetchAttendances();
    refetchTreatments();
    // Reset animation after it completes
    setTimeout(() => setIsRefreshing(false), 200);
  };

  return (
    <Card id="upcoming-appointments">
      <CardBody>
        <DetailCardCollapsibleHeader
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
          title={
            <>
              <CalendarDays
                className="h-5 w-5 shrink-0 text-gray-600"
                aria-hidden
              />
              Upcoming Appointments
              <span className="text-sm font-normal text-gray-600">
                ({totalItems})
              </span>
            </>
          }
          actions={
            !loading && !isCollapsed ? (
              <Button
                variant="ghost"
                size="xs"
                onClick={handleRefresh}
                className="text-blue-600 hover:text-blue-800"
                title="Update appointments"
              >
                Refresh
              </Button>
            ) : null
          }
        />

        {!isCollapsed && (
          <>
            {loading && (
              <LoadingSpinner
                size="medium"
                message="Loading upcoming appointments..."
              />
            )}

            {error && (
              <ErrorState
                title="Error loading appointments"
                message={error}
                onRetry={() => {
                  refetchAttendances();
                  refetchTreatments();
                }}
              />
            )}

            {!loading && !error && (
              <div
                className={`space-y-3 transition-opacity duration-300 ${isRefreshing ? "opacity-30" : "opacity-100"}`}
              >
                {visibleScheduledAttendances.map((groupedScheduled, index) => (
                  <ScheduledAttendanceItem
                    key={`scheduled-${groupedScheduled.date}-${index}`}
                    groupedScheduled={groupedScheduled}
                    isFirstItem={index === 0}
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

            {!loading && !error && totalItems === 0 && (
              <ScheduledAttendancesEmpty patientId={patient.id} />
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
};
