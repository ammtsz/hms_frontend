import {
  sortPatientsByPriority,
  isPatientAlreadyScheduledForAssessment,
} from '../businessRules';
import type { AttendanceByDate, AttendanceStatus } from '../../types/types';

// Test patient interface with name property
interface TestPatient {
  name: string;
  priority: string;
  checkedInTime?: string | null;
}

describe('businessRules', () => {
  describe('sortPatientsByPriority', () => {
    it('should sort patients by priority first (1 > 2 > 3)', () => {
      const patients: TestPatient[] = [
        { name: 'Patient C', priority: '3', checkedInTime: '2025-01-15T09:00:00Z' },
        { name: 'Patient A', priority: '1', checkedInTime: '2025-01-15T10:00:00Z' },
        { name: 'Patient B', priority: '2', checkedInTime: '2025-01-15T08:00:00Z' },
      ];

      const sorted = sortPatientsByPriority(patients);

      expect(sorted[0].name).toBe('Patient A'); // Priority 1
      expect(sorted[1].name).toBe('Patient B'); // Priority 2
      expect(sorted[2].name).toBe('Patient C'); // Priority 3
    });

    it('should use check-in time as tiebreaker for same priority', () => {
      const patients: TestPatient[] = [
        { name: 'Patient B', priority: '1', checkedInTime: '2025-01-15T10:00:00Z' },
        { name: 'Patient A', priority: '1', checkedInTime: '2025-01-15T09:00:00Z' },
        { name: 'Patient C', priority: '1', checkedInTime: '2025-01-15T11:00:00Z' },
      ];

      const sorted = sortPatientsByPriority(patients);

      expect(sorted[0].name).toBe('Patient A'); // Same priority, earliest time
      expect(sorted[1].name).toBe('Patient B'); // Same priority, middle time
      expect(sorted[2].name).toBe('Patient C'); // Same priority, latest time
    });

    it('should handle mixed priority and time scenarios', () => {
      const patients: TestPatient[] = [
        { name: 'Priority 2 Late', priority: '2', checkedInTime: '2025-01-15T11:00:00Z' },
        { name: 'Priority 1 Late', priority: '1', checkedInTime: '2025-01-15T10:30:00Z' },
        { name: 'Priority 2 Early', priority: '2', checkedInTime: '2025-01-15T09:00:00Z' },
        { name: 'Priority 1 Early', priority: '1', checkedInTime: '2025-01-15T09:30:00Z' },
        { name: 'Priority 3', priority: '3', checkedInTime: '2025-01-15T08:00:00Z' },
      ];

      const sorted = sortPatientsByPriority(patients);

      expect(sorted[0].name).toBe('Priority 1 Early');  // Priority 1, earlier time
      expect(sorted[1].name).toBe('Priority 1 Late');   // Priority 1, later time
      expect(sorted[2].name).toBe('Priority 2 Early');  // Priority 2, earlier time
      expect(sorted[3].name).toBe('Priority 2 Late');   // Priority 2, later time
      expect(sorted[4].name).toBe('Priority 3');        // Priority 3
    });

    it('should handle patients without check-in time', () => {
      const patients: TestPatient[] = [
        { name: 'No Time', priority: '1', checkedInTime: null },
        { name: 'With Time', priority: '1', checkedInTime: '2025-01-15T09:00:00Z' },
        { name: 'No Time 2', priority: '1', checkedInTime: null },
      ];

      const sorted = sortPatientsByPriority(patients);

      expect(sorted[0].name).toBe('With Time');  // Has check-in time, comes first
      // Patients without time maintain relative order
    });
  });

  describe('isPatientAlreadyScheduledForAssessment', () => {
    const mockAttendancesByDate: AttendanceByDate = {
      date: '2025-01-15',
      assessment: {
        scheduled: [
          { name: 'João Silva', priority: '1' },
          { name: 'Maria Santos', priority: '2' }
        ],
        checkedIn: [
          { name: 'Pedro Oliveira', priority: '1' }
        ],
        onGoing: [
          { name: 'Ana Costa', priority: '2' }
        ],
        completed: [
          { name: 'Carlos Ferreira', priority: '3' }
        ]
      } as AttendanceStatus,
      physiotherapy: {
        scheduled: [
          { name: 'Lucia Pereira', priority: '2' }
        ],
        checkedIn: [],
        onGoing: [],
        completed: []
      } as AttendanceStatus,
      tens: {
        scheduled: [],
        checkedIn: [
          { name: 'Roberto Lima', priority: '1' }
        ],
        onGoing: [],
        completed: []
      } as AttendanceStatus,
      combined: {
        scheduled: [],
        checkedIn: [],
        onGoing: [],
        completed: []
      } as AttendanceStatus
    };

    it('should return true when patient is found in assessment scheduled', () => {
      const result = isPatientAlreadyScheduledForAssessment(
        'João Silva',
        mockAttendancesByDate,
      );
      expect(result).toBe(true);
    });

    it('should return true when patient is found in checkedIn status', () => {
      const result = isPatientAlreadyScheduledForAssessment(
        'Pedro Oliveira',
        mockAttendancesByDate,
      );
      expect(result).toBe(true);
    });

    it('should return true when patient is found in onGoing status', () => {
      const result = isPatientAlreadyScheduledForAssessment(
        'Ana Costa',
        mockAttendancesByDate,
      );
      expect(result).toBe(true);
    });

    it('should return true when patient is found in completed status', () => {
      const result = isPatientAlreadyScheduledForAssessment(
        'Carlos Ferreira',
        mockAttendancesByDate,
      );
      expect(result).toBe(true);
    });

    it('should return false when patient is only in physiotherapy or tens (BR-306)', () => {
      expect(
        isPatientAlreadyScheduledForAssessment(
          'Lucia Pereira',
          mockAttendancesByDate,
        ),
      ).toBe(false);
      expect(
        isPatientAlreadyScheduledForAssessment(
          'Roberto Lima',
          mockAttendancesByDate,
        ),
      ).toBe(false);
    });

    it('should return false when patient is not found', () => {
      const result = isPatientAlreadyScheduledForAssessment(
        'Nome Inexistente',
        mockAttendancesByDate,
      );
      expect(result).toBe(false);
    });

    it('should return false when attendancesByDate is null', () => {
      const result = isPatientAlreadyScheduledForAssessment('João Silva', null);
      expect(result).toBe(false);
    });

    it('should handle case-insensitive name matching', () => {
      const result = isPatientAlreadyScheduledForAssessment(
        'joão silva',
        mockAttendancesByDate,
      );
      expect(result).toBe(true);
    });

    it('should handle attendance type with empty status arrays', () => {
      const emptyAttendances: AttendanceByDate = {
        date: '2025-01-15',
        assessment: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: []
        } as AttendanceStatus,
        physiotherapy: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: []
        } as AttendanceStatus,
        tens: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: []
        } as AttendanceStatus,
        combined: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: []
        } as AttendanceStatus
      };

      const result = isPatientAlreadyScheduledForAssessment(
        'João Silva',
        emptyAttendances,
      );
      expect(result).toBe(false);
    });

    it('should handle partially defined attendance types', () => {
      const partialAttendances: AttendanceByDate = {
        date: '2025-01-15',
        assessment: {
          scheduled: [{ name: 'Test Patient', priority: '1' }],
          checkedIn: [],
          onGoing: [],
          completed: []
        } as AttendanceStatus,
        physiotherapy: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: []
        } as AttendanceStatus,
        tens: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: []
        } as AttendanceStatus,
        combined: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: []
        } as AttendanceStatus
      };

      const result = isPatientAlreadyScheduledForAssessment(
        'Test Patient',
        partialAttendances,
      );
      expect(result).toBe(true);
    });

    it('should handle attendance with undefined status arrays', () => {
      const attendancesWithNulls: AttendanceByDate = {
        date: '2025-01-15',
        assessment: {
          scheduled: undefined as unknown as [],
          checkedIn: [],
          onGoing: [],
          completed: []
        } as AttendanceStatus,
        physiotherapy: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: []
        } as AttendanceStatus,
        tens: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: []
        } as AttendanceStatus,
        combined: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: []
        } as AttendanceStatus
      };

      const result = isPatientAlreadyScheduledForAssessment(
        'Test Patient',
        attendancesWithNulls,
      );
      expect(result).toBe(false);
    });
  });
});
