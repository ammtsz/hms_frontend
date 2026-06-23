/**
 * @jest-environment jsdom
 */

import * as ConsultationExports from '../index';

describe('Consultation Index Exports', () => {
  it('should export PostConsultationModal component', () => {
    expect(ConsultationExports.PostConsultationModal).toBeDefined();
    expect(typeof ConsultationExports.PostConsultationModal).toBe('function');
  });

  it('should export TreatmentRecommendationsSection component', () => {
    expect(ConsultationExports.TreatmentRecommendationsSection).toBeDefined();
    expect(typeof ConsultationExports.TreatmentRecommendationsSection).toBe('function');
  });

  it('should export usePostConsultationForm hook', () => {
    expect(ConsultationExports.usePostConsultationForm).toBeDefined();
    expect(typeof ConsultationExports.usePostConsultationForm).toBe('function');
  });

  it('should have correct export structure', () => {
    const exports = Object.keys(ConsultationExports);
    const expectedExports = [
      'PostConsultationModal',
      'TreatmentRecommendationsSection', 
      'usePostConsultationForm'
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