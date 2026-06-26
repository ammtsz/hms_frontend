import type { TreatmentResponseDto } from "@/api/types";
import type { TreatmentPlanWithSessionRow } from "@/api/query/hooks/useTreatmentsWithSessionRows";

export function getUniqueTreatmentPlans(
  treatmentsWithSessionRows: TreatmentPlanWithSessionRow[],
): TreatmentResponseDto[] {
  const byId = new Map<number, TreatmentResponseDto>();
  treatmentsWithSessionRows.forEach(({ treatment }) => byId.set(treatment.id, treatment));
  return Array.from(byId.values());
}

export function groupTreatmentPlansForEdit(
  treatmentPlans: TreatmentResponseDto[],
): TreatmentResponseDto[][] {
  const byKey = new Map<string, TreatmentResponseDto[]>();

  treatmentPlans.forEach((plan) => {
    const key = `${plan.treatmentType}-${plan.plannedSessions}-${plan.durationMinutes ?? "0"}`;
    const list = byKey.get(key) ?? [];
    list.push(plan);
    byKey.set(key, list);
  });

  return Array.from(byKey.values());
}

export interface DisplayGroup {
  treatmentType: "physiotherapy" | "tens";
  durationMinutes: number | undefined;
  bodyLocations: string[];
  sessionNumber: number;
  plannedSessions: number;
  notes: string | undefined;
  items: TreatmentPlanWithSessionRow[];
}

function displayGroupKey(item: TreatmentPlanWithSessionRow): string {
  const { treatment, sessionRow } = item;
  const duration = treatment.durationMinutes ?? "";

  return `${treatment.treatmentType}-${duration}-${sessionRow.sessionNumber}-${treatment.plannedSessions}`;
}

export function groupByTypeDuration(
  treatmentsWithSessionRows: TreatmentPlanWithSessionRow[],
): DisplayGroup[] {
  const byKey = new Map<string, TreatmentPlanWithSessionRow[]>();

  treatmentsWithSessionRows.forEach((item) => {
    const key = displayGroupKey(item);
    const list = byKey.get(key) ?? [];
    list.push(item);
    byKey.set(key, list);
  });

  return Array.from(byKey.entries()).map(([, items]) => {
    const treatment = items[0].treatment;
    const sessionRow = items[0].sessionRow;
    const bodyLocations = Array.from(
      new Set(items.map((i) => i.treatment.bodyLocation).filter(Boolean)),
    );

    return {
      treatmentType: treatment.treatmentType,
      durationMinutes: treatment.durationMinutes,
      bodyLocations,
      sessionNumber: sessionRow.sessionNumber,
      plannedSessions: treatment.plannedSessions,
      notes: treatment.notes,
      items,
    };
  });
}

function getEffectiveFirstScheduledDate(
  treatmentPlan: TreatmentResponseDto,
): string | undefined {
  const sessionRows = treatmentPlan.sessions;
  if (!sessionRows || sessionRows.length === 0) return undefined;

  const byDateThenNumber = [...sessionRows].sort((a, b) => {
    const dateCmp = a.scheduledDate.localeCompare(b.scheduledDate);
    if (dateCmp !== 0) return dateCmp;
    return a.sessionNumber - b.sessionNumber;
  });

  const effective = byDateThenNumber.find(
    (r) => r.status !== "missed" && r.status !== "cancelled",
  );

  return (effective ?? byDateThenNumber[0])?.scheduledDate;
}

export type EditDisabledReason =
  | "missingCurrentDate"
  | "hasCompletedSessions"
  | "notEffectiveFirstDay"
  | "unknown";

export function getEditEligibility(
  treatmentPlans: TreatmentResponseDto[],
  currentScheduledDate: string | undefined,
): { canEdit: boolean; reason?: EditDisabledReason } {
  if (!currentScheduledDate) {
    return { canEdit: false, reason: "missingCurrentDate" };
  }

  for (const plan of treatmentPlans) {
    if ((plan.completedSessions ?? 0) !== 0) {
      return { canEdit: false, reason: "hasCompletedSessions" };
    }

    const effectiveFirst = getEffectiveFirstScheduledDate(plan);
    if (!effectiveFirst) continue;

    if (effectiveFirst !== currentScheduledDate) {
      return { canEdit: false, reason: "notEffectiveFirstDay" };
    }
  }

  return { canEdit: true };
}

export function canAddNewTreatmentRow(
  treatmentPlans: TreatmentResponseDto[],
): boolean {
  return treatmentPlans.every((plan) => {
    const sessionRows = plan.sessions;
    if (!sessionRows || sessionRows.length === 0) return true;

    const active = sessionRows.filter(
      (r) => r.status !== "missed" && r.status !== "cancelled",
    );
    if (active.length <= 1) return true;

    const sorted = [...active].sort((a, b) => {
      const dateCmp = a.scheduledDate.localeCompare(b.scheduledDate);
      if (dateCmp !== 0) return dateCmp;
      return a.sessionNumber - b.sessionNumber;
    });

    const start = sorted[0].sessionNumber;
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].sessionNumber !== start + i) return false;
    }
    return true;
  });
}
