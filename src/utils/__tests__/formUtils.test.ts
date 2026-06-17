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
    it('should format phone numbers in Brazilian format', () => {
      expect(formatPhoneNumber('11999887766')).toBe('(11) 99988-7766');
      expect(formatPhoneNumber('21987654321')).toBe('(21) 98765-4321');
    });

    it('should handle partially entered numbers', () => {
      expect(formatPhoneNumber('11')).toBe('11');
      expect(formatPhoneNumber('119')).toBe('(11) 9');
      expect(formatPhoneNumber('1199988')).toBe('(11) 99988');
    });

    it('should handle numbers with existing formatting', () => {
      expect(formatPhoneNumber('(11) 99988-7766')).toBe('(11) 99988-7766');
      expect(formatPhoneNumber('11 99988-7766')).toBe('(11) 99988-7766');
    });

    it('should handle empty and invalid inputs', () => {
      expect(formatPhoneNumber('')).toBe('');
      expect(formatPhoneNumber('abc')).toBe('');
      expect(formatPhoneNumber('123')).toBe('(12) 3');
    });

    it('should handle numbers longer than expected', () => {
      expect(formatPhoneNumber('119998877661234')).toBe('(11) 99988-7766');
    });

    it('should remove all non-digit characters', () => {
      expect(formatPhoneNumber('11-99988.7766')).toBe('(11) 99988-7766');
      expect(formatPhoneNumber('+55 11 99988-7766')).toBe('(55) 11999-8877');
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
    it('should validate correct Brazilian phone format', () => {
      expect(validatePhoneFormat('(11) 99988-7766')).toBe(true);
      expect(validatePhoneFormat('(21) 98765-4321')).toBe(true);
      expect(validatePhoneFormat('(85) 12345-6789')).toBe(true);
    });

    it('should reject incorrect formats', () => {
      expect(validatePhoneFormat('11999887766')).toBe(false); // No formatting
      expect(validatePhoneFormat('(11) 9998-7766')).toBe(false); // Wrong digit count
      expect(validatePhoneFormat('11 99988-7766')).toBe(false); // Wrong separator
      expect(validatePhoneFormat('(111) 99988-7766')).toBe(false); // Too many area code digits
    });

    it('should return true for empty strings (optional field)', () => {
      expect(validatePhoneFormat('')).toBe(true);
    });

    it('should handle various invalid inputs', () => {
      expect(validatePhoneFormat('abc')).toBe(false);
      expect(validatePhoneFormat('(11) abc-def')).toBe(false);
      expect(validatePhoneFormat('11999887766123')).toBe(false);
    });
  });

  describe('validatePatientForm', () => {
    const validData = {
      name: 'João Silva',
      phone: '(11) 99988-7766',
      birthDate: '1990-05-15',
    };

    it('should validate complete valid data', () => {
      expect(validatePatientForm(validData)).toBe(null);
    });

    it('should require name', () => {
      expect(validatePatientForm({ ...validData, name: '' }))
        .toBe('Nome é obrigatório');
      expect(validatePatientForm({ ...validData, name: '   ' }))
        .toBe('Nome é obrigatório');
    });

    it('should validate phone when required', () => {
      const dataWithoutPhone = { ...validData, phone: '' };
      
      // Not required by default
      expect(validatePatientForm(dataWithoutPhone, false)).toBe(null);
      
      // Required
      expect(validatePatientForm(dataWithoutPhone, true))
        .toBe('Telefone é obrigatório');
    });

    it('should validate birth date when required', () => {
      const dataWithoutBirthDate = { ...validData, birthDate: null };
      
      // Not required by default
      expect(validatePatientForm(dataWithoutBirthDate, false, false)).toBe(null);
      
      // Required
      expect(validatePatientForm(dataWithoutBirthDate, false, true))
        .toBe('Data de nascimento é obrigatória');
    });

    it('should validate phone format when provided', () => {
      const dataWithBadPhone = { ...validData, phone: '11999887766' };
      expect(validatePatientForm(dataWithBadPhone))
        .toBe('Telefone deve estar no formato (XX) XXXXX-XXXX');
    });

    it('should handle combination of requirements', () => {
      const emptyData = { name: '', phone: '', birthDate: null };
      
      // Name is always required (first check)
      expect(validatePatientForm(emptyData, true, true))
        .toBe('Nome é obrigatório');
      
      // With name but missing required birth date
      expect(validatePatientForm({ ...emptyData, name: 'João' }, false, true))
        .toBe('Data de nascimento é obrigatória');
      
      // With name and birth date but missing required phone
      expect(validatePatientForm(
        { ...emptyData, name: 'João', birthDate: '1990-01-01' },
        true,
        false
      )).toBe('Telefone é obrigatório');
    });

    it('should allow optional empty phone when format is valid', () => {
      const dataWithEmptyPhone = { ...validData, phone: '' };
      expect(validatePatientForm(dataWithEmptyPhone)).toBe(null);
    });
  });
});