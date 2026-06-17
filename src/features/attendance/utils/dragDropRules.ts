import type { AttendanceProgression, AttendanceType } from '@/types/types';
import type { IDraggedItem } from '../types';

export function isPhysiotherapyOrTens(type: AttendanceType): boolean {
  return type === 'physiotherapy' || type === 'tens';
}

/** Returns true if the drop target type is allowed for the current dragged item. */
export function isAllowedDropTarget(
  dragged: IDraggedItem,
  toType: AttendanceType,
): boolean {
  if (dragged.isCombinedTreatment) {
    const isPhysiotherapyTensMove =
      isPhysiotherapyOrTens(dragged.type) && isPhysiotherapyOrTens(toType);
    return isPhysiotherapyTensMove || dragged.type === toType;
  }
  return dragged.type === toType;
}

/** Returns true if this is a valid move (type allowed and status actually changes). */
export function isValidMove(
  dragged: IDraggedItem,
  toType: AttendanceType,
  toStatus: AttendanceProgression,
): boolean {
  if (dragged.status === toStatus) return false;
  if (dragged.type === toType) return true;
  const isCombinedPhysiotherapyTensMove =
    !!dragged.isCombinedTreatment &&
    isPhysiotherapyOrTens(dragged.type) &&
    isPhysiotherapyOrTens(toType);
  return isCombinedPhysiotherapyTensMove;
}

/** Treatment type columns to update when performing a drag move. */
export function resolveTreatmentTypesToMove(
  dragged: IDraggedItem,
  toType: AttendanceType,
): Set<AttendanceType> | AttendanceType[] {
  if (dragged.isCombinedTreatment && dragged.treatmentTypes) {
    const isPhysiotherapyTensCombined =
      dragged.treatmentTypes.includes('physiotherapy') &&
      dragged.treatmentTypes.includes('tens');
    const isDraggingPhysiotherapyTens =
      dragged.type === 'physiotherapy' || dragged.type === 'tens';
    const isTargetPhysiotherapyTens = toType === 'physiotherapy' || toType === 'tens';

    if (isPhysiotherapyTensCombined && isDraggingPhysiotherapyTens && isTargetPhysiotherapyTens) {
      return new Set<AttendanceType>(['physiotherapy', 'tens']);
    }
    return [dragged.type];
  }
  return [dragged.type];
}
