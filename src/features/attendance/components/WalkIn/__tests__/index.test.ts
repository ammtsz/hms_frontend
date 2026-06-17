/**
 * WalkInForm index.ts Test
 * 
 * Test for the WalkInForm index.ts export file to ensure 100% coverage
 */

import { PatientWalkInForm, PatientWalkInPanel } from '../index';

describe('WalkInForm index exports', () => {
  it('should export PatientWalkInForm', () => {
    expect(PatientWalkInForm).toBeDefined();
    expect(typeof PatientWalkInForm).toBe('function');
  });

  it('should export PatientWalkInPanel', () => {
    expect(PatientWalkInPanel).toBeDefined();
    expect(typeof PatientWalkInPanel).toBe('function');
  });
});