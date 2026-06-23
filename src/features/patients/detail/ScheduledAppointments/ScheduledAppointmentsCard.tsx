import React, { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Patient } from "@/types/types";
import type { PatientPageSectionId } from "@/features/patients/detail/PatientPageSectionNav";
import { usePatientPageScrollTarget } from "@/features/patients/detail/PatientPageSectionNav";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { usePatientAppointments } from "@/api/query/hooks/usePatientQueries";
import { useTreatmentsByPatient } from "@/api/query/hooks/useTreatmentsQueries";
import { transformAppointmentToNext } from "@/utils/apiTransformers";
import { usePagination } from "@/features/patients/detail/shared/hooks/usePagination";
import { ShowMoreButton } from "@/features/patients/detail/shared/ShowMoreButton";
import { groupScheduledAppointmentsByDate } from "@/utils/appointmentHistoryUtils";
import { ScheduledAppointmentItem } from "./ScheduledAppointmentItem";
import {
  ErrorState,
  ScheduledAppointmentsEmpty,
} from "@/features/patients/detail/shared/CardStates";
import { DetailCardCollapsibleHeader } from "@/features/patients/detail/shared/DetailCardCollapsibleHeader";
import { Button, Card, CardBody } from "@/components/ui";

interface ScheduledAppointmentsCardProps {
  patient: Patient;
  sectionId?: PatientPageSectionId;
}

export const ScheduledAppointmentsCard: React.FC<
  ScheduledAppointmentsCardProps
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

  // Use separate appointment query for real-time updates and better cache management
  const {
    data: appointmentsData,
    isLoading: appointmentsLoading,
    error: appointmentsError,
    refetch: refetchAppointments,
  } = usePatientAppointments(patient.id);

  // Fetch treatments (plans + session rows) for this patient
  const {
    treatments,
    loading: treatmentsLoading,
    error: treatmentsError,
    refetch: refetchTreatments,
  } = useTreatmentsByPatient(parseInt(patient.id));

  // Transform raw appointment data to scheduled appointments format
  const enhancedScheduledAppointments = React.useMemo(() => {
    if (!appointmentsData) return [];

    // Transform all appointments - groupScheduledAppointmentsByDate will filter appropriately
    const scheduledAppointments = appointmentsData
      .sort(
        (a, b) =>
          new Date(a.scheduledDate + "T00:00:00").getTime() -
          new Date(b.scheduledDate + "T00:00:00").getTime(),
      )
      .map(transformAppointmentToNext);

    return scheduledAppointments;
  }, [appointmentsData]);

  // Group scheduled appointments with treatment plan data
  const groupedScheduledAppointments = React.useMemo(() => {
    return groupScheduledAppointmentsByDate(
      enhancedScheduledAppointments,
      treatments,
    );
  }, [enhancedScheduledAppointments, treatments]);

  // Implement pagination for better performance
  const {
    visibleItems: visibleScheduledAppointments,
    hasMoreItems,
    showMore,
    totalItems,
    visibleCount,
  } = usePagination({
    items: groupedScheduledAppointments,
    initialPageSize: 3,
    incrementSize: 10,
  });

  // Use enhanced data if available, fallback to patient data
  const loading = appointmentsLoading || treatmentsLoading;
  const error = appointmentsError?.message || treatmentsError || null;

  // Handle refresh with visual feedback
  const handleRefresh = () => {
    setIsRefreshing(true);
    refetchAppointments();
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
                  refetchAppointments();
                  refetchTreatments();
                }}
              />
            )}

            {!loading && !error && (
              <div
                className={`space-y-3 transition-opacity duration-300 ${isRefreshing ? "opacity-30" : "opacity-100"}`}
              >
                {visibleScheduledAppointments.map((groupedScheduled, index) => (
                  <ScheduledAppointmentItem
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
              <ScheduledAppointmentsEmpty patientId={patient.id} />
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
};
