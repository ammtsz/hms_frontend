import type { CreatedTreatment } from "../CreatedTreatmentsConfirmation";

/**
 * Created treatments that differ only by body location are grouped together.
 * Group key: color, duration, plannedSessions, startDate.
 */
function getGroupKey(session: CreatedTreatment): string {
  const color = session.color ?? "none";
  const duration = session.durationMinutes ?? "none";
  return `${color}-${duration}-${session.plannedSessions}-${session.startDate}`;
}

/** Created treatments that share grouping attributes (e.g. differ only by body location). */
export interface GroupedCreatedTreatment {
  /** First row in group; shared props (color, duration, plannedSessions, startDate) apply to the whole group */
  representativeSession: CreatedTreatment;
  /** All body locations in this group, sorted and unique */
  bodyLocations: string[];
  /** All created treatments in the group (for merging scheduled dates) */
  treatments: CreatedTreatment[];
}

/**
 * Groups created treatments so rows differing only by body location are shown together.
 * Each group shares: color, duration (when applicable), planned sessions, and start date.
 */
export function groupCreatedTreatmentsForDisplay(
  sessions: CreatedTreatment[],
): GroupedCreatedTreatment[] {
  const byKey = new Map<string, CreatedTreatment[]>();

  for (const session of sessions) {
    const key = getGroupKey(session);
    const list = byKey.get(key) ?? [];
    list.push(session);
    byKey.set(key, list);
  }

  return Array.from(byKey.entries()).map(([, groupTreatments]) => {
    const bodyLocations = Array.from(
      new Set(groupTreatments.map((s) => s.bodyLocation)),
    ).sort((a, b) => a.localeCompare(b, "en-US"));
    return {
      representativeSession: groupTreatments[0],
      bodyLocations,
      treatments: groupTreatments,
    };
  });
}
