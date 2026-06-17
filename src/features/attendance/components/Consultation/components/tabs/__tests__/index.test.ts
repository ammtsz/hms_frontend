/**
 * @jest-environment jsdom
 */

import * as TabsExports from '../index';

describe('Tabs Index Exports', () => {
  it('should export BasicInfoTab component', () => {
    expect(TabsExports.BasicInfoTab).toBeDefined();
    expect(typeof TabsExports.BasicInfoTab).toBe('function');
  });

  it('should export GeneralRecommendationsTab component', () => {
    expect(TabsExports.GeneralRecommendationsTab).toBeDefined();
    expect(typeof TabsExports.GeneralRecommendationsTab).toBe('function');
  });

  it('should export TreatmentRecommendationsTab component', () => {
    expect(TabsExports.TreatmentRecommendationsTab).toBeDefined();
    expect(typeof TabsExports.TreatmentRecommendationsTab).toBe('function');
  });

  it('should have correct export structure', () => {
    const exports = Object.keys(TabsExports);
    const expectedExports = [
      'BasicInfoTab',
      'GeneralRecommendationsTab',
      'TreatmentRecommendationsTab'
    ];
    
    expectedExports.forEach(exportName => {
      expect(exports).toContain(exportName);
    });
    expect(exports).toHaveLength(expectedExports.length);
  });

  it('should not export undefined values', () => {
    const exports = Object.values(TabsExports);
    exports.forEach(exportedValue => {
      expect(exportedValue).toBeDefined();
      expect(exportedValue).not.toBeNull();
    });
  });
});