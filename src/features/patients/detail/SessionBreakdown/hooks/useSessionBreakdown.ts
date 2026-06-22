import { useMemo } from "react";
import { useSessionsByPatient } from "@/api/query/hooks/useSessionsQueries";
import { getStatusDates } from "@/utils/sessionBreakdownUtils";

export interface SessionGroup {
  treatmentType?: string;
  color?: string;
  plannedSessions?: number;
  treatmentNotes?: string;
  cancellationReason?: string;
  locations: string[];
  sessions: Array<{
    id: number;
    sessionNumber: number;
    scheduledDate: string;
    status: string;
    notes?: string;
    missedReason?: string;
    endTime?: string;
    bodyLocation?: string;
    treatmentType?: string;
    color?: string;
    plannedSessions?: number;
    durationMinutes?: number;
    completedSessions?: number;
    treatmentNotes?: string;
    cancellationReason?: string;
    treatmentStatus?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  }>;
  latestDate: string;
}

export const useSessionBreakdown = (patientId: string) => {
  const {
    data: sessions = [],
    isLoading: loading,
    error,
    refetch,
  } = useSessionsByPatient(patientId);

  const sessionGroups = useMemo(() => {
    // Group sessions by treatment type, color, and planned sessions
    const grouped = sessions.reduce(
      (acc, session) => {
        const scheduledDates = getStatusDates(sessions, session, "scheduled");
        const cancelledDates = getStatusDates(sessions, session, "cancelled");
        const missedDates = getStatusDates(sessions, session, "missed");

        const key = `${session.treatmentType}-${session.color || "none"}-${session.plannedSessions}-${session.durationMinutes || "0"}-${session.completedSessions}-scheduled_${scheduledDates}-cancelled_${cancelledDates}-missed_${missedDates}`;

        if (!acc[key]) {
          acc[key] = {
            treatmentType: session.treatmentType,
            color: session.color,
            plannedSessions: session.plannedSessions,
            treatmentNotes: session.treatmentNotes,
            cancellationReason: session.cancellationReason,
            sessions: [],
            locationSet: new Set<string>(),
          };
        }

        acc[key].sessions.push(session);
        if (session.bodyLocation) {
          acc[key].locationSet.add(session.bodyLocation);
        }

        return acc;
      },
      {} as Record<
        string,
        {
          treatmentType?: string;
          color?: string;
          plannedSessions?: number;
          treatmentNotes?: string;
          cancellationReason?: string;
          sessions: typeof sessions;
          locationSet: Set<string>;
        }
      >,
    );

    // Convert to array and sort by latest session date in each group
    return Object.values(grouped)
      .map((group) => {
        // Deduplicate sessions by sessionNumber + scheduledDate combination
        const uniqueSessions = Array.from(
          new Map(
            group.sessions.map((session) => [
              `${session.sessionNumber}-${session.scheduledDate}`,
              session,
            ]),
          ).values(),
        );

        const sortedSessions = uniqueSessions.sort((a, b) =>
          b.scheduledDate.localeCompare(a.scheduledDate),
        );

        const cancellationSources = [
          group.cancellationReason,
          ...group.sessions.map((s) => s.cancellationReason),
        ];
        const reasons = [...new Set(
          cancellationSources
            .map((r) => r?.trim())
            .filter((trimmed): trimmed is string =>
              !!trimmed && (trimmed.includes("Treatment cancelled") || trimmed.includes("Treatment canceled")),
            ),
        )];

        return {
          treatmentType: group.treatmentType,
          color: group.color,
          plannedSessions: group.plannedSessions,
          treatmentNotes: group.treatmentNotes,
          cancellationReason: reasons.length > 0 ? reasons.join(`, \n`) : undefined,
          locations: Array.from(group.locationSet),
          sessions: sortedSessions,
          latestDate: sortedSessions[0].scheduledDate,
        };
      })
      .sort((a, b) => b.latestDate.localeCompare(a.latestDate));
  }, [sessions]);

  // Count completed treatment groups
  const stats = useMemo(() => {
    const totalTreatmentGroups = sessionGroups.length;
    const completedTreatmentGroups = sessionGroups.filter((group) =>
      group.sessions.every((session) => session.status === "completed"),
    ).length;

    return { totalTreatmentGroups, completedTreatmentGroups };
  }, [sessionGroups]);

  return {
    sessionGroups,
    stats,
    loading,
    error,
    refetch,
  };
};
