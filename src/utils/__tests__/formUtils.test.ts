import { formatDateForInput, isValidDateString } from '../timezoneDate';
import {
  formatPhoneNumber,
  createSafeDate,
  validatePhoneFormat,
  validatePatientForm
} from '../formUtils';

describe('formUtils', () => {
  describe('formatDateForInput (timezoneDate)', () => {
    it('should pass through valid YYYY-MM-DD strings', () => {
      expect(formatDateForInput('2025-08-12')).toBe('2025-08-12');
    });

    it('should handle edge case date strings', () => {
      expect(formatDateForInput('2025-01-01')).toBe('2025-01-01');
      expect(formatDateForInput('2025-12-31')).toBe('2025-12-31');
    });

    it('should return empty string for null, undefined, and invalid input', () => {
      expect(formatDateForInput(null)).toBe('');
      expect(formatDateForInput(undefined)).toBe('');
      expect(formatDateForInput('')).toBe('');
      expect(formatDateForInput('not-a-date')).toBe('');
    });
  });

  describe('isValidDateString (timezoneDate)', () => {
    it('returns true for valid YYYY-MM-DD dates', () => {
      expect(isValidDateString('2025-08-12')).toBe(true);
      expect(isValidDateString('2025-02-28')).toBe(true);
    });

    it('returns false for partial or invalid values', () => {
      expect(isValidDateString('2025-0')).toBe(false);
      expect(isValidDateString('2025-02-30')).toBe(false);
      expect(isValidDateString('')).toBe(false);
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format phone numbers in US format', () => {
      expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
      expect(formatPhoneNumber('7183216547')).toBe('(718) 321-6547');
    });

    it('should handle partially entered numbers', () => {
      expect(formatPhoneNumber('555')).toBe('555');
      expect(formatPhoneNumber('5551')).toBe('(555) 1');
      expect(formatPhoneNumber('555123')).toBe('(555) 123');
    });

    it('should handle numbers with existing formatting', () => {
      expect(formatPhoneNumber('(555) 123-4567')).toBe('(555) 123-4567');
      expect(formatPhoneNumber('555 123-4567')).toBe('(555) 123-4567');
    });

    it('should handle empty and invalid inputs', () => {
      expect(formatPhoneNumber('')).toBe('');
      expect(formatPhoneNumber('abc')).toBe('');
      expect(formatPhoneNumber('123')).toBe('123');
    });

    it('should handle numbers longer than expected', () => {
      expect(formatPhoneNumber('55512345678901')).toBe('(555) 123-4567');
    });

    it('should remove all non-digit characters', () => {
      expect(formatPhoneNumber('555-123.4567')).toBe('(555) 123-4567');
      expect(formatPhoneNumber('+1 555 123 4567')).toBe('(155) 512-3456');
    });
  });

  describe('createSafeDate', () => {
    it('should create valid dates from strings', () => {
      const result = createSafeDate('2025-08-12T12:00:00');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(7); // 0-indexed
      expect(result.getDate()).toBe(12);
    });

    it('should handle ISO datetime strings', () => {
      const result = createSafeDate('2025-08-12T14:30:00Z');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
    });

    it('should return current date for empty strings', () => {
      const result = createSafeDate('');
      expect(result).toBeInstanceOf(Date);
      // Should be close to now (within a second)
      expect(Math.abs(result.getTime() - Date.now())).toBeLessThan(1000);
    });

    it('should return current date for invalid strings', () => {
      const result = createSafeDate('invalid-date');
      expect(result).toBeInstanceOf(Date);
      // Should be close to now (within a second)
      expect(Math.abs(result.getTime() - Date.now())).toBeLessThan(1000);
    });
  });

  describe('validatePhoneFormat', () => {
    it('should validate correct US phone format', () => {
      expect(validatePhoneFormat('(555) 123-4567')).toBe(true);
      expect(validatePhoneFormat('(718) 321-6547')).toBe(true);
      expect(validatePhoneFormat('(850) 123-4567')).toBe(true);
    });

    it('should reject incorrect formats', () => {
      expect(validatePhoneFormat('5551234567')).toBe(false); // No formatting
      expect(validatePhoneFormat('(55) 123-4567')).toBe(false); // Wrong area code length
      expect(validatePhoneFormat('555 123-4567')).toBe(false); // Wrong separator
      expect(validatePhoneFormat('(5555) 123-4567')).toBe(false); // Too many area code digits
    });

    it('should return true for empty strings (optional field)', () => {
      expect(validatePhoneFormat('')).toBe(true);
    });

    it('should handle various invalid inputs', () => {
      expect(validatePhoneFormat('abc')).toBe(false);
      expect(validatePhoneFormat('(555) abc-defg')).toBe(false);
      expect(validatePhoneFormat('55512345678901')).toBe(false);
    });
  });

  describe('validatePatientForm', () => {
    const validData = {
      name: 'John Smith',
      phone: '(555) 123-4567',
      birthDate: '1990-05-15',
    };

    it('should validate complete valid data', () => {
      expect(validatePatientForm(validData)).toBe(null);
    });

    it('should require name', () => {
      expect(validatePatientForm({ ...validData, name: '' }))
        .toMatch(/Name is required|Name is required/);
      expect(validatePatientForm({ ...validData, name: '   ' }))
        .toMatch(/Name is required|Name is required/);
    });

    it('should validate phone when required', () => {
      const dataWithoutPhone = { ...validData, phone: '' };
      
      // Not required by default
      expect(validatePatientForm(dataWithoutPhone, false)).toBe(null);
      
      // Required
      expect(validatePatientForm(dataWithoutPhone, true))
        .toMatch(/Phone is required|Phone is required/);
    });

    it('should validate birth date when required', () => {
      const dataWithoutBirthDate = { ...validData, birthDate: null };
      
      // Not required by default
      expect(validatePatientForm(dataWithoutBirthDate, false, false)).toBe(null);
      
      // Required
      expect(validatePatientForm(dataWithoutBirthDate, false, true))
        .toMatch(/Date of birth is required|Date of birth is required/);
    });

    it('should validate phone format when provided', () => {
      const dataWithBadPhone = { ...validData, phone: '5551234567' };
      expect(validatePatientForm(dataWithBadPhone))
        .toMatch(/Phone must be in the format \(XXX\) XXX-XXXX/);
    });

    it('should handle combination of requirements', () => {
      const emptyData = { name: '', phone: '', birthDate: null };
      
      // Name is always required (first check)
      expect(validatePatientForm(emptyData, true, true))
        .toMatch(/Name is required|Name is required/);
      
      // With name but missing required birth date
      expect(validatePatientForm({ ...emptyData, name: 'John' }, false, true))
        .toMatch(/Date of birth is required|Date of birth is required/);
      
      // With name and birth date but missing required phone
      expect(validatePatientForm(
        { ...emptyData, name: 'John', birthDate: '1990-01-01' },
        true,
        false
      )).toMatch(/Phone is required|Phone is required/);
    });

    it('should allow optional empty phone when format is valid', () => {
      const dataWithEmptyPhone = { ...validData, phone: '' };
      expect(validatePatientForm(dataWithEmptyPhone)).toBe(null);
    });
  });
});