import {
  isAllowedDropTarget,
  isPhysiotherapyOrTens,
  isValidMove,
  resolveTreatmentTypesToMove,
} from '../dragDropRules';
import type { IDraggedItem } from '../../types';

const baseDragged = (
  overrides: Partial<IDraggedItem> = {},
): IDraggedItem => ({
  type: 'assessment',
  status: 'scheduled',
  idx: 0,
  patientId: 1,
  isCombinedTreatment: false,
  treatmentTypes: ['assessment'],
  ...overrides,
});

describe('dragDropRules', () => {
  describe('isPhysiotherapyOrTens', () => {
    it('returns true for physiotherapy and tens', () => {
      expect(isPhysiotherapyOrTens('physiotherapy')).toBe(true);
      expect(isPhysiotherapyOrTens('tens')).toBe(true);
    });

    it('returns false for assessment', () => {
      expect(isPhysiotherapyOrTens('assessment')).toBe(false);
    });
  });

  describe('isAllowedDropTarget', () => {
    it('allows same type for single treatment', () => {
      const dragged = baseDragged({ type: 'assessment' });
      expect(isAllowedDropTarget(dragged, 'assessment')).toBe(true);
      expect(isAllowedDropTarget(dragged, 'physiotherapy')).toBe(false);
    });

    it('allows physiotherapy/tens cross-move for combined treatment', () => {
      const dragged = baseDragged({
        type: 'physiotherapy',
        isCombinedTreatment: true,
        treatmentTypes: ['physiotherapy', 'tens'],
      });
      expect(isAllowedDropTarget(dragged, 'tens')).toBe(true);
      expect(isAllowedDropTarget(dragged, 'physiotherapy')).toBe(true);
      expect(isAllowedDropTarget(dragged, 'assessment')).toBe(false);
    });
  });

  describe('isValidMove', () => {
    it('rejects no-op status change', () => {
      const dragged = baseDragged({ status: 'checkedIn' });
      expect(isValidMove(dragged, 'assessment', 'checkedIn')).toBe(false);
    });

    it('allows same-type status change', () => {
      const dragged = baseDragged({ status: 'scheduled' });
      expect(isValidMove(dragged, 'assessment', 'checkedIn')).toBe(true);
    });

    it('allows combined physiotherapy/tens cross-column move', () => {
      const dragged = baseDragged({
        type: 'physiotherapy',
        status: 'checkedIn',
        isCombinedTreatment: true,
        treatmentTypes: ['physiotherapy', 'tens'],
      });
      expect(isValidMove(dragged, 'tens', 'onGoing')).toBe(true);
    });
  });

  describe('resolveTreatmentTypesToMove', () => {
    it('moves only dragged type for single treatment', () => {
      const dragged = baseDragged({ type: 'assessment' });
      expect(resolveTreatmentTypesToMove(dragged, 'assessment')).toEqual([
        'assessment',
      ]);
    });

    it('moves both physiotherapy and tens for combined cross-column move', () => {
      const dragged = baseDragged({
        type: 'physiotherapy',
        isCombinedTreatment: true,
        treatmentTypes: ['physiotherapy', 'tens'],
      });
      const result = resolveTreatmentTypesToMove(dragged, 'tens');
      expect(result).toEqual(new Set(['physiotherapy', 'tens']));
    });

    it('moves only assessment when combined card dragged from assessment', () => {
      const dragged = baseDragged({
        type: 'assessment',
        isCombinedTreatment: true,
        treatmentTypes: ['assessment', 'physiotherapy', 'tens'],
      });
      expect(resolveTreatmentTypesToMove(dragged, 'assessment')).toEqual([
        'assessment',
      ]);
    });
  });
});
