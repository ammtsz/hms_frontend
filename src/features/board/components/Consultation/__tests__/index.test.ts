/**
 * @jest-environment jsdom
 */

import * as ConsultationExports from '../index';

describe('Consultation Index Exports', () => {
  it('should export PostAttendanceModal component', () => {
    expect(ConsultationExports.PostAttendanceModal).toBeDefined();
    expect(typeof ConsultationExports.PostAttendanceModal).toBe('function');
  });

  it('should export TreatmentRecommendationsSection component', () => {
    expect(ConsultationExports.TreatmentRecommendationsSection).toBeDefined();
    expect(typeof ConsultationExports.TreatmentRecommendationsSection).toBe('function');
  });

  it('should export usePostAttendanceForm hook', () => {
    expect(ConsultationExports.usePostAttendanceForm).toBeDefined();
    expect(typeof ConsultationExports.usePostAttendanceForm).toBe('function');
  });

  it('should have correct export structure', () => {
    const exports = Object.keys(ConsultationExports);
    const expectedExports = [
      'PostAttendanceModal',
      'TreatmentRecommendationsSection', 
      'usePostAttendanceForm'
    ];
    
    expectedExports.forEach(exportName => {
      expect(exports).toContain(exportName);
    });
  });

  it('should not export undefined values', () => {
    const exports = Object.values(ConsultationExports);
    exports.forEach(exportedValue => {
      expect(exportedValue).toBeDefined();
      expect(exportedValue).not.toBeNull();
    });
  });
});