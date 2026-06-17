import React, { useEffect, useState } from "react";
import { Patient } from "@/types/types";
import type { PatientPageSectionId } from "@/features/patients/detail/PatientPageSectionNav";
import { usePatientPageScrollTarget } from "@/features/patients/detail/PatientPageSectionNav";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { usePagination } from "@/features/patients/detail/shared/hooks/usePagination";
import { useSessionBreakdown } from "./hooks/useSessionBreakdown";
import { SessionBreakdownHeader } from "./SessionBreakdownHeader";
import { SessionGroup } from "./SessionGroup";
import { Button, Card, CardBody } from "@/components/ui";

interface SessionBreakdownCardProps {
  patient: Patient;
  sectionId?: PatientPageSectionId;
}

export const SessionBreakdownCard: React.FC<SessionBreakdownCardProps> = ({
  patient,
  sectionId,
}) => {
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

  // Fetch and process session data using custom hook
  const { sessionGroups, stats, loading, error, refetch } = useSessionBreakdown(
    patient.id,
  );

  // Use pagination for better performance with many groups
  const {
    visibleItems: visibleGroups,
    hasMoreItems,
    showMore,
    totalItems,
    visibleCount,
  } = usePagination({
    items: sessionGroups,
    initialPageSize: 2,
    incrementSize: 5,
  });

  // Handle refresh with visual feedback
  const handleRefresh = () => {
    setIsRefreshing(true);
    refetch();
    // Reset animation after it completes
    setTimeout(() => setIsRefreshing(false), 200);
  };

  return (
    <Card>
      <CardBody>
        <SessionBreakdownHeader
          completedCount={stats.completedTreatmentGroups}
          totalCount={stats.totalTreatmentGroups}
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
          onRefresh={handleRefresh}
          loading={loading}
        />

        {!isCollapsed && (
          <>
            {/* Loading State */}
            {loading && (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="medium" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">
                  Erro ao carregar sessões: {error.message}
                </p>
              </div>
            )}

            {/* Empty State */}
            {stats.totalTreatmentGroups === 0 && (
              <p className="text-sm text-gray-600">
                Nenhum tratamento registrado até o momento.
              </p>
            )}

            {/* Sessions List */}
            {!loading && !error && stats.totalTreatmentGroups > 0 && (
              <div
                className={`space-y-4 transition-opacity duration-300 ${
                  isRefreshing ? "opacity-30" : "opacity-100"
                }`}
              >
                {visibleGroups.map((group, groupIndex) => (
                  <SessionGroup
                    key={groupIndex}
                    group={group}
                    groupIndex={groupIndex}
                  />
                ))}

                {/* Show More Button */}
                {hasMoreItems && (
                  <Button
                    variant="ghost"
                    onClick={showMore}
                    className="w-full text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                  >
                    Ver mais ({visibleCount} de {totalItems} tratamentos)
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
};

// Backward compatibility export
export const SessionBreakdown = SessionBreakdownCard;
