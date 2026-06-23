export interface RescheduledItem {
  attendanceId: number;
  patientId: number;
  patientName: string;
  type: string;
  oldDate: string;
  newDate: string;
}

export interface AggregatedRescheduledItem {
  type: string;
  oldDate: string;
  newDate: string;
  count: number;
}

export interface CancelledForFItem {
  patientId: number;
  patientName: string;
  attendances: Array<{ id: number; type: string; scheduledDate: string }>;
}

export interface AggregatedCancelledAttendance {
  type: string;
  scheduledDate: string;
  count: number;
}

export interface CouldNotRescheduleItem {
  attendanceId: number;
  patientId: number;
  patientName: string;
  type: string;
  reason: string;
}

export interface AggregatedCouldNotRescheduleItem {
  type: string;
  reason: string;
  count: number;
}

/**
 * Aggregate items by a key; each group becomes one result with a count.
 * @param items - Source items
 * @param keyFn - Key to group by (same key => same group)
 * @param toResult - Build result from first item in group and final count
 * @param sortCompare - Optional comparator for the returned array
 */
export function aggregateByKey<T, R>(
  items: T[],
  keyFn: (item: T) => string,
  toResult: (item: T, count: number) => R,
  sortCompare?: (a: R, b: R) => number,
): R[] {
  const byKey = new Map<string, { item: T; count: number }>();
  for (const item of items) {
    const key = keyFn(item);
    const entry = byKey.get(key);
    if (entry) {
      entry.count += 1;
    } else {
      byKey.set(key, { item, count: 1 });
    }
  }
  const result = Array.from(byKey.values()).map(({ item, count }) =>
    toResult(item, count),
  );
  if (sortCompare) {
    result.sort(sortCompare);
  }
  return result;
}

/** Group rescheduled items by patient, sorted by date. Within each patient, aggregate by type+dates. */
export function groupRescheduledByPatient(items: RescheduledItem[]): Array<{
  patientName: string;
  patientId: number;
  attendances: AggregatedRescheduledItem[];
}> {
  const byPatient = new Map<number, RescheduledItem[]>();
  for (const item of items) {
    const list = byPatient.get(item.patientId) ?? [];
    list.push(item);
    byPatient.set(item.patientId, list);
  }
  const groups = Array.from(byPatient.entries()).map(
    ([patientId, attendances]) => {
      const patientName = attendances[0]?.patientName?.trim() || "Patient";
      const aggregated = aggregateByKey(
        attendances,
        (att) => `${att.type}|${att.oldDate}|${att.newDate}`,
        (att, count) => ({
          type: att.type,
          oldDate: att.oldDate,
          newDate: att.newDate,
          count,
        }),
        (a, b) =>
          a.oldDate.localeCompare(b.oldDate) || a.type.localeCompare(b.type),
      );
      return { patientName, patientId, attendances: aggregated };
    },
  );
  groups.sort((a, b) =>
    (a.attendances[0]?.oldDate ?? "").localeCompare(
      b.attendances[0]?.oldDate ?? "",
    ),
  );
  return groups;
}

/** Group cancelled-by-C by patient; within each patient aggregate by type + scheduledDate (with count for non-assessment). */
export function groupCancelledByPatient(items: CancelledForFItem[]): Array<{
  patientId: number;
  patientName: string;
  attendances: AggregatedCancelledAttendance[];
}> {
  return items
    .map((item) => {
      const aggregated = aggregateByKey(
        item.attendances,
        (att) => `${att.type}|${att.scheduledDate}`,
        (att, count) => ({
          type: att.type,
          scheduledDate: att.scheduledDate,
          count,
        }),
        (a, b) =>
          a.scheduledDate.localeCompare(b.scheduledDate) ||
          a.type.localeCompare(b.type),
      );
      return {
        patientId: item.patientId,
        patientName: item.patientName,
        attendances: aggregated,
      };
    })
    .sort((a, b) => a.patientName.localeCompare(b.patientName));
}

/** Group "could not reschedule" by patient; within each patient aggregate by type + reason. */
export function groupCouldNotRescheduleByPatient(
  items: CouldNotRescheduleItem[],
): Array<{
  patientId: number;
  patientName: string;
  attendances: AggregatedCouldNotRescheduleItem[];
}> {
  const byPatient = new Map<number, CouldNotRescheduleItem[]>();
  for (const item of items) {
    const list = byPatient.get(item.patientId) ?? [];
    list.push(item);
    byPatient.set(item.patientId, list);
  }
  const groups = Array.from(byPatient.entries()).map(
    ([patientId, attendances]) => {
      const patientName = attendances[0]?.patientName?.trim() || "Patient";
      const aggregated = aggregateByKey(
        attendances,
        (att) => `${att.type}|${att.reason}`,
        (att, count) => ({
          type: att.type,
          reason: att.reason,
          count,
        }),
        (a, b) =>
          a.type.localeCompare(b.type) || a.reason.localeCompare(b.reason),
      );
      return { patientId, patientName, attendances: aggregated };
    },
  );
  groups.sort((a, b) => a.patientName.localeCompare(b.patientName));
  return groups;
}
