import { transformKeys, toCamelCase, toSnakeCase } from '../caseConverters';

describe('caseConverters', () => {
  describe('toCamelCase', () => {
    it('should convert snake_case keys to camelCase', () => {
      const input = {
        patientId: 123,
        full_name: 'John Doe',
        birth_date: '1990-01-01',
        createdAt: '2023-01-01T10:00:00Z',
      };

      const expected = {
        patientId: 123,
        fullName: 'John Doe',
        birthDate: '1990-01-01',
        createdAt: '2023-01-01T10:00:00Z',
      };

      expect(toCamelCase(input)).toEqual(expected);
    });

    it('should handle nested objects', () => {
      const input = {
        patient_data: {
          patientId: 123,
          personal_info: {
            first_name: 'John',
            last_name: 'Doe',
          },
        },
      };

      const expected = {
        patientData: {
          patientId: 123,
          personalInfo: {
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      };

      expect(toCamelCase(input)).toEqual(expected);
    });

    it('should handle arrays', () => {
      const input = {
        patient_list: [
          { patientId: 1, full_name: 'John' },
          { patientId: 2, full_name: 'Jane' },
        ],
      };

      const expected = {
        patientList: [
          { patientId: 1, fullName: 'John' },
          { patientId: 2, fullName: 'Jane' },
        ],
      };

      expect(toCamelCase(input)).toEqual(expected);
    });

    it('should preserve Date objects', () => {
      const date = new Date('2023-01-01');
      const input = {
        created_date: date,
      };

      const result = toCamelCase(input) as { createdDate: Date };
      expect(result.createdDate).toBe(date);
      expect(result.createdDate instanceof Date).toBe(true);
    });

    it('should handle null and undefined values', () => {
      expect(toCamelCase(null)).toBeNull();
      expect(toCamelCase(undefined)).toBeUndefined();
      
      const input = {
        patientId: null,
        full_name: undefined,
        active: true,
      };

      const expected = {
        patientId: null,
        fullName: undefined,
        active: true,
      };

      expect(toCamelCase(input)).toEqual(expected);
    });
  });

  describe('toSnakeCase', () => {
    it('should convert camelCase keys to snake_case', () => {
      const input = {
        patientId: 123,
        fullName: 'John Doe',
        birthDate: '1990-01-01',
        createdAt: '2023-01-01T10:00:00Z',
      };

      const expected = {
        patient_id: 123,
        full_name: 'John Doe',
        birth_date: '1990-01-01',
        created_at: '2023-01-01T10:00:00Z',
      };

      expect(toSnakeCase(input)).toEqual(expected);
    });

    it('should handle nested objects', () => {
      const input = {
        patientData: {
          patientId: 123,
          personalInfo: {
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      };

      const expected = {
        patient_data: {
          patient_id: 123,
          personal_info: {
            first_name: 'John',
            last_name: 'Doe',
          },
        },
      };

      expect(toSnakeCase(input)).toEqual(expected);
    });

    it('should handle arrays', () => {
      const input = {
        patientList: [
          { patientId: 1, fullName: 'John' },
          { patientId: 2, fullName: 'Jane' },
        ],
      };

      const expected = {
        patient_list: [
          { patient_id: 1, full_name: 'John' },
          { patient_id: 2, full_name: 'Jane' },
        ],
      };

      expect(toSnakeCase(input)).toEqual(expected);
    });
  });

  describe('transformKeys', () => {
    it('should provide access to both conversion functions', () => {
      expect(typeof transformKeys.toCamelCase).toBe('function');
      expect(typeof transformKeys.toSnakeCase).toBe('function');
    });

    it('should be reversible', () => {
      const original = {
        patientId: 123,
        fullName: 'John Doe',
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      const snakeCase = transformKeys.toSnakeCase(original);
      const backToCamelCase = transformKeys.toCamelCase(snakeCase);

      expect(backToCamelCase).toEqual(original);
    });
  });
});