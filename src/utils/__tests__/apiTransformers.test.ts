import { addCalendarDaysToLocalYmd, getTodayClinic } from '@/utils/timezoneDate';
import { 
  transformPriority, 
  transformStatus, 
  transformAttendanceType, 
  transformAttendanceProgression,
  transformStatusToApi,
  transformPriorityToApi,
  transformPatientFromApi,
  transformSinglePatientFromApi,
  transformAttendanceToPrevious,
  transformAttendanceToNext,
  transformPatientWithAttendances,
  transformAttendanceTypeToApi,
  transformAttendanceProgressionToApi,
  transformProcessEndOfDayResponse,
  transformConsultationResponse
} from '../apiTransformers';
import { PatientPriority, PatientStatus, AttendanceType, AttendanceStatus, PatientResponseDto, AttendanceResponseDto } from '@/api/types';
import type { UpdateConsultationResponseDto } from '@/api/types';

describe('API Transformers', () => {
  describe('transformPriority', () => {
    it('should transform LEVEL_1 to "1"', () => {
      expect(transformPriority(PatientPriority.LEVEL_1)).toBe('1');
    });

    it('should transform LEVEL_2 to "2"', () => {
      expect(transformPriority(PatientPriority.LEVEL_2)).toBe('2');
    });

    it('should transform LEVEL_3 to "3"', () => {
      expect(transformPriority(PatientPriority.LEVEL_3)).toBe('3');
    });

    it('should transform LEVEL_4 to "4"', () => {
      expect(transformPriority(PatientPriority.LEVEL_4)).toBe('4');
    });

    it('should transform LEVEL_5 to "5"', () => {
      expect(transformPriority(PatientPriority.LEVEL_5)).toBe('5');
    });

    it('should default to "1" for unknown priority', () => {
      expect(transformPriority('UNKNOWN' as PatientPriority)).toBe('1');
    });
  });

  describe('transformStatus', () => {
    it('should transform NEW_PATIENT to "N"', () => {
      expect(transformStatus(PatientStatus.NEW_PATIENT)).toBe('N');
    });

    it('should transform IN_TREATMENT to "T"', () => {
      expect(transformStatus(PatientStatus.IN_TREATMENT)).toBe('T');
    });

    it('should transform DISCHARGED to "A"', () => {
      expect(transformStatus(PatientStatus.DISCHARGED)).toBe('A');
    });

    it('should transform ABSENT to "F"', () => {
      expect(transformStatus(PatientStatus.ABSENT)).toBe('F');
    });

    it('should default to "T" for unknown status', () => {
      expect(transformStatus('UNKNOWN' as PatientStatus)).toBe('T');
    });
  });

  describe('transformAttendanceType', () => {
    it('should transform ASSESSMENT to "assessment"', () => {
      expect(transformAttendanceType(AttendanceType.ASSESSMENT)).toBe('assessment');
    });

    it('should transform PHYSIOTHERAPY to "physiotherapy"', () => {
      expect(transformAttendanceType(AttendanceType.PHYSIOTHERAPY)).toBe('physiotherapy');
    });

    it('should transform TENS to "tens"', () => {
      expect(transformAttendanceType(AttendanceType.TENS)).toBe('tens');
    });

    it('should default to "assessment" for unknown type', () => {
      expect(transformAttendanceType('UNKNOWN' as AttendanceType)).toBe('assessment');
    });
  });

  describe('transformAttendanceProgression', () => {
    it('should transform SCHEDULED to "scheduled"', () => {
      expect(transformAttendanceProgression(AttendanceStatus.SCHEDULED)).toBe('scheduled');
    });

    it('should transform CHECKED_IN to "checkedIn"', () => {
      expect(transformAttendanceProgression(AttendanceStatus.CHECKED_IN)).toBe('checkedIn');
    });

    it('should transform IN_PROGRESS to "onGoing"', () => {
      expect(transformAttendanceProgression(AttendanceStatus.IN_PROGRESS)).toBe('onGoing');
    });

    it('should transform COMPLETED to "completed"', () => {
      expect(transformAttendanceProgression(AttendanceStatus.COMPLETED)).toBe('completed');
    });

    it('should transform MISSED to "scheduled" (shown in scheduled column with flag)', () => {
      expect(transformAttendanceProgression(AttendanceStatus.MISSED)).toBe('scheduled');
    });

    it('should transform CANCELLED to "scheduled" (shown in scheduled column with flag)', () => {
      expect(transformAttendanceProgression(AttendanceStatus.CANCELLED)).toBe('scheduled');
    });

    it('should default to "scheduled" for unknown status', () => {
      expect(transformAttendanceProgression('UNKNOWN' as AttendanceStatus)).toBe('scheduled');
    });
  });

  describe('transformStatusToApi', () => {
    it('should transform "N" to NEW_PATIENT', () => {
      expect(transformStatusToApi('N')).toBe(PatientStatus.NEW_PATIENT);
    });

    it('should transform "T" to IN_TREATMENT', () => {
      expect(transformStatusToApi('T')).toBe(PatientStatus.IN_TREATMENT);
    });

    it('should transform "A" to DISCHARGED', () => {
      expect(transformStatusToApi('A')).toBe(PatientStatus.DISCHARGED);
    });

    it('should transform "F" to ABSENT', () => {
      expect(transformStatusToApi('F')).toBe(PatientStatus.ABSENT);
    });

    it('should default to NEW_PATIENT for unknown status', () => {
      expect(transformStatusToApi('X' as 'N')).toBe(PatientStatus.NEW_PATIENT);
    });
  });

  describe('transformPriorityToApi', () => {
    it('should transform "1" to LEVEL_1', () => {
      expect(transformPriorityToApi('1')).toBe(PatientPriority.LEVEL_1);
    });

    it('should transform "2" to LEVEL_2', () => {
      expect(transformPriorityToApi('2')).toBe(PatientPriority.LEVEL_2);
    });

    it('should transform "3" to LEVEL_3', () => {
      expect(transformPriorityToApi('3')).toBe(PatientPriority.LEVEL_3);
    });

    it('should transform "4" to LEVEL_4', () => {
      expect(transformPriorityToApi('4')).toBe(PatientPriority.LEVEL_4);
    });

    it('should transform "5" to LEVEL_5', () => {
      expect(transformPriorityToApi('5')).toBe(PatientPriority.LEVEL_5);
    });

    it('should default to LEVEL_1 for unknown priority', () => {
      expect(transformPriorityToApi('9' as '1')).toBe(PatientPriority.LEVEL_1);
    });
  });

  describe('transformPatientFromApi', () => {
    const createMockPatient = (overrides = {}): PatientResponseDto => ({
      id: 1,
      name: 'Test Patient',
      phone: '11999999999',
      priority: PatientPriority.LEVEL_3,
      patientStatus: PatientStatus.IN_TREATMENT,
      birthDate: '1990-01-01',
      mainComplaint: 'Test complaint',
      startDate: '2025-01-01',
      dischargeDate: undefined,
      missingAppointmentsStreak: 0,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      ...overrides
    });

    it('should transform basic patient data', () => {
      const apiPatient = createMockPatient();
      const result = transformPatientFromApi(apiPatient);

      expect(result).toEqual({
        id: '1',
        name: 'Test Patient',
        phone: '11999999999',
        priority: '3',
        status: 'T',
        birthDate: '1990-01-01'
      });
    });

    it('should handle missing phone number', () => {
      const apiPatient = createMockPatient({ phone: null });
      const result = transformPatientFromApi(apiPatient);

      expect(result.phone).toBe('');
    });

    it('should handle undefined phone number', () => {
      const apiPatient = createMockPatient({ phone: undefined });
      const result = transformPatientFromApi(apiPatient);

      expect(result.phone).toBe('');
    });
  });

  describe('transformSinglePatientFromApi', () => {
    const createMockPatient = (overrides = {}): PatientResponseDto => ({
      id: 1,
      name: 'Test Patient',
      phone: '11999999999',
      priority: PatientPriority.LEVEL_3,
      patientStatus: PatientStatus.IN_TREATMENT,
      birthDate: '1990-01-01',
      mainComplaint: 'Test complaint',
      startDate: '2025-01-01',
      dischargeDate: undefined,
      missingAppointmentsStreak: 0,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      ...overrides
    });

    it('should transform complete patient data', () => {
      const apiPatient = createMockPatient();
      const result = transformSinglePatientFromApi(apiPatient);

      expect(result.id).toBe('1');
      expect(result.name).toBe('Test Patient');
      expect(result.phone).toBe('11999999999');
      expect(result.priority).toBe('3');
      expect(result.status).toBe('T');
      expect(result.birthDate).toBe('1990-01-01');
      expect(result.mainComplaint).toBe('Test complaint');
      expect(result.startDate).toBe('2025-01-01');
      expect(result.dischargeDate).toBeNull();
      expect(result.missingAppointmentsStreak).toBe(0);
    });

    it('should map missing appointments streak from API', () => {
      const apiPatient = createMockPatient({ missingAppointmentsStreak: 3 });
      const result = transformSinglePatientFromApi(apiPatient);

      expect(result.missingAppointmentsStreak).toBe(3);
    });

    it('should handle missing birth date', () => {
      const apiPatient = createMockPatient({ birthDate: null });
      const result = transformSinglePatientFromApi(apiPatient);

      expect(typeof result.birthDate).toBe('string');
      expect(result.birthDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle missing main complaint', () => {
      const apiPatient = createMockPatient({ mainComplaint: null });
      const result = transformSinglePatientFromApi(apiPatient);

      expect(result.mainComplaint).toBe('');
    });

    it('should handle discharge date when provided', () => {
      const apiPatient = createMockPatient({ dischargeDate: '2025-12-31' });
      const result = transformSinglePatientFromApi(apiPatient);

      expect(result.dischargeDate).toBe('2025-12-31');
    });

    it('should have default recommendations structure', () => {
      const apiPatient = createMockPatient();
      const result = transformSinglePatientFromApi(apiPatient);

      expect(result.currentRecommendations).toEqual({
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        food: '',
        water: '',
        ointment: '',
        physiotherapy: false,
        tens: false,
        returnWeeks: 0
      });
    });
  });

  describe('transformAttendanceToPrevious', () => {
    const createMockAttendance = (overrides = {}): AttendanceResponseDto => ({
      id: 1,
      patientId: 1,
      scheduledDate: '2025-01-15',
      scheduledTime: '10:00',
      type: AttendanceType.ASSESSMENT,
      status: AttendanceStatus.COMPLETED,
      notes: 'Test notes',
      createdAt: '2025-01-15T00:00:00Z',
      updatedAt: '2025-01-15T00:00:00Z',
      ...overrides
    });

    it('should transform attendance to previous format', () => {
      const apiAttendance = createMockAttendance();
      const result = transformAttendanceToPrevious(apiAttendance);

      expect(result).toEqual({
        attendanceId: '1',
        date: '2025-01-15',
        type: 'assessment',
        notes: 'Test notes',
        recommendations: null,
        status: AttendanceStatus.COMPLETED,
        absenceNotes: undefined,
        absenceJustified: undefined,
        createdDate: '2025-01-15',
        updatedDate: '2025-01-15',
        cancelledDate: undefined
      });
    });

    it('should handle missing notes', () => {
      const apiAttendance = createMockAttendance({ notes: undefined });
      const result = transformAttendanceToPrevious(apiAttendance);

      expect(result.notes).toBe('');
    });

    it('should handle different attendance types', () => {
      const physiotherapyAttendance = createMockAttendance({ type: AttendanceType.PHYSIOTHERAPY });
      const tensAttendance = createMockAttendance({ type: AttendanceType.TENS });

      expect(transformAttendanceToPrevious(physiotherapyAttendance).type).toBe('physiotherapy');
      expect(transformAttendanceToPrevious(tensAttendance).type).toBe('tens');
    });
  });

  describe('transformAttendanceToNext', () => {
    const createMockAttendance = (overrides = {}): AttendanceResponseDto => ({
      id: 1,
      patientId: 1,
      scheduledDate: '2025-01-20',
      scheduledTime: '14:00',
      type: AttendanceType.ASSESSMENT,
      status: AttendanceStatus.SCHEDULED,
      notes: undefined,
      createdAt: '2025-01-15T00:00:00Z',
      updatedAt: '2025-01-15T00:00:00Z',
      ...overrides
    });

    it('should transform attendance to next format', () => {
      const apiAttendance = createMockAttendance();
      const result = transformAttendanceToNext(apiAttendance);

      expect(result).toMatchObject({
        attendanceId: '1',
        date: '2025-01-20',
        type: 'assessment',
        parentAttendanceId: undefined,
      });
      expect(result.createdDate).toBeDefined();
      expect(result.updatedDate).toBeDefined();
    });

    it('should handle different attendance types', () => {
      const physiotherapyAttendance = createMockAttendance({ type: AttendanceType.PHYSIOTHERAPY });
      const result = transformAttendanceToNext(physiotherapyAttendance);

      expect(result.type).toBe('physiotherapy');
    });

    it('should include parentAttendanceId when present', () => {
      const returnConsultation = createMockAttendance({ parentAttendanceId: 42 });
      const result = transformAttendanceToNext(returnConsultation);

      expect(result).toMatchObject({
        attendanceId: '1',
        date: '2025-01-20',
        type: 'assessment',
        parentAttendanceId: 42,
      });
    });
  });

  describe('transformPatientWithAttendances', () => {
    const createMockPatient = (): PatientResponseDto => ({
      id: 1,
      name: 'Test Patient',
      phone: '11999999999',
      priority: PatientPriority.LEVEL_3,
      patientStatus: PatientStatus.IN_TREATMENT,
      birthDate: '1990-01-01',
      mainComplaint: 'Test complaint',
      startDate: '2025-01-01',
      dischargeDate: undefined,
      missingAppointmentsStreak: 0,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    });

    const createMockAttendance = (overrides = {}): AttendanceResponseDto => ({
      id: 1,
      patientId: 1,
      scheduledDate: '2025-01-15',
      scheduledTime: '10:00',
      type: AttendanceType.ASSESSMENT,
      status: AttendanceStatus.COMPLETED,
      notes: 'Test notes',
      createdAt: '2025-01-15T00:00:00Z',
      updatedAt: '2025-01-15T00:00:00Z',
      ...overrides
    });

    it('should transform patient with completed attendances', () => {
      const patient = createMockPatient();
      const attendances = [
        createMockAttendance({ id: 1, status: AttendanceStatus.COMPLETED, scheduledDate: '2025-01-10' }),
        createMockAttendance({ id: 2, status: AttendanceStatus.COMPLETED, scheduledDate: '2025-01-05' })
      ];

      const result = transformPatientWithAttendances(patient, attendances);

      expect(result.previousAttendances).toHaveLength(2);
      expect(result.previousAttendances[0].attendanceId).toBe('1'); // Most recent first
      expect(result.previousAttendances[1].attendanceId).toBe('2');
    });

    it('should filter out non-completed attendances from previous', () => {
      const patient = createMockPatient();
      const attendances = [
        createMockAttendance({ id: 1, status: AttendanceStatus.COMPLETED }),
        createMockAttendance({ id: 2, status: AttendanceStatus.SCHEDULED }),
        createMockAttendance({ id: 3, status: AttendanceStatus.IN_PROGRESS })
      ];

      const result = transformPatientWithAttendances(patient, attendances);

      expect(result.previousAttendances).toHaveLength(1);
      expect(result.previousAttendances[0].attendanceId).toBe('1');
      expect(result.openAttendancesCount).toBe(2); // scheduled + in_progress
    });

    it('should include future attendances', () => {
      const patient = createMockPatient();
      const futureDateString = addCalendarDaysToLocalYmd(getTodayClinic(), 7);

      const attendances = [
        createMockAttendance({ 
          id: 1, 
          status: AttendanceStatus.SCHEDULED, 
          scheduledDate: futureDateString 
        }),
        createMockAttendance({ 
          id: 2, 
          status: AttendanceStatus.CHECKED_IN, 
          scheduledDate: futureDateString 
        })
      ];

      const result = transformPatientWithAttendances(patient, attendances);

      expect(result.nextAttendanceDates).toHaveLength(2);
    });

    it('should handle empty attendances array', () => {
      const patient = createMockPatient();
      const result = transformPatientWithAttendances(patient, []);

      expect(result.previousAttendances).toHaveLength(0);
      expect(result.nextAttendanceDates).toHaveLength(0);
      expect(result.openAttendancesCount).toBe(0);
    });
  });

  describe('transformProcessEndOfDayResponse', () => {
    it('should convert physiotherapy to physiotherapy in rescheduled items', () => {
      const apiResponse = {
        rescheduled: [
          {
            attendanceId: 1,
            patientId: 1,
            patientName: 'John Doe',
            type: 'physiotherapy',
            oldDate: '2024-01-15',
            newDate: '2024-01-22',
          },
        ],
        statusChangedToF: [],
        cancelledForF: [],
        couldNotReschedule: [],
      };

      const result = transformProcessEndOfDayResponse(apiResponse);

      expect(result.rescheduled[0].type).toBe('physiotherapy');
    });

    it('should convert physiotherapy to physiotherapy in cancelledForF attendances', () => {
      const apiResponse = {
        rescheduled: [],
        statusChangedToF: [],
        cancelledForF: [
          {
            patientId: 1,
            patientName: 'Jane',
            attendances: [
              { id: 10, type: 'physiotherapy', scheduledDate: '2024-01-20' },
            ],
          },
        ],
        couldNotReschedule: [],
      };

      const result = transformProcessEndOfDayResponse(apiResponse);

      expect(result.cancelledForF[0].attendances[0].type).toBe('physiotherapy');
    });

    it('should leave assessment and tens types unchanged', () => {
      const apiResponse = {
        rescheduled: [
          {
            attendanceId: 1,
            patientId: 1,
            patientName: 'John',
            type: 'assessment',
            oldDate: '2024-01-15',
            newDate: '2024-01-22',
          },
          {
            attendanceId: 2,
            patientId: 2,
            patientName: 'Jane',
            type: 'tens',
            oldDate: '2024-01-15',
            newDate: '2024-01-22',
          },
        ],
        statusChangedToF: [],
        cancelledForF: [],
        couldNotReschedule: [],
      };

      const result = transformProcessEndOfDayResponse(apiResponse);

      expect(result.rescheduled[0].type).toBe('assessment');
      expect(result.rescheduled[1].type).toBe('tens');
    });

    it('should preserve all other response fields', () => {
      const apiResponse = {
        rescheduled: [],
        statusChangedToF: [{ patientId: 1, patientName: 'Bob' }],
        cancelledForF: [],
        couldNotReschedule: [
          {
            attendanceId: 5,
            patientId: 3,
            patientName: 'Alice',
            type: 'assessment',
            reason: 'No slots',
          },
        ],
      };

      const result = transformProcessEndOfDayResponse(apiResponse);

      expect(result.statusChangedToF).toEqual(apiResponse.statusChangedToF);
      expect(result.couldNotReschedule).toEqual(apiResponse.couldNotReschedule);
    });
  });

  describe('transformConsultationResponse', () => {
    const baseConsultation: UpdateConsultationResponseDto['consultation'] = {
      id: 1,
      attendanceId: 1,
      createdDate: '2024-01-15',
      createdTime: '10:00:00',
      updatedDate: '2024-01-15',
      updatedTime: '10:00:00',
      mainComplaint: 'Test',
      food: '',
      water: '',
      ointments: '',
      physiotherapy: false,
      tens: false,
      returnWeeks: 2,
      notes: '',
    };

    it('should preserve consultation and other fields when cancelledAttendances is undefined', () => {
      const apiResponse: UpdateConsultationResponseDto = {
        consultation: baseConsultation,
      };
      const result = transformConsultationResponse(apiResponse);
      expect(result.consultation).toEqual(baseConsultation);
      expect(result.cancelledAttendances).toBeUndefined();
    });

    it('should preserve consultation when cancelledAttendances is empty array', () => {
      const apiResponse: UpdateConsultationResponseDto = {
        consultation: baseConsultation,
        cancelledAttendances: [],
      };
      const result = transformConsultationResponse(apiResponse);
      expect(result.consultation).toEqual(baseConsultation);
      expect(result.cancelledAttendances).toEqual([]);
    });

    it('should convert physiotherapy to physiotherapy in cancelledAttendances', () => {
      const apiResponse: UpdateConsultationResponseDto = {
        consultation: baseConsultation,
        cancelledAttendances: [
          { id: 10, type: 'physiotherapy', scheduledDate: '2026-01-20' },
        ],
      };
      const result = transformConsultationResponse(apiResponse);
      expect(result.cancelledAttendances).toHaveLength(1);
      expect(result.cancelledAttendances![0]).toMatchObject({
        id: 10,
        type: 'physiotherapy',
        scheduledDate: '2026-01-20',
      });
    });

    it('should leave assessment and tens types unchanged in cancelledAttendances', () => {
      const apiResponse: UpdateConsultationResponseDto = {
        consultation: baseConsultation,
        cancelledAttendances: [
          { id: 1, type: 'assessment', scheduledDate: '2026-01-15' },
          { id: 2, type: 'tens', scheduledDate: '2026-01-16' },
        ],
      };
      const result = transformConsultationResponse(apiResponse);
      expect(result.cancelledAttendances![0].type).toBe('assessment');
      expect(result.cancelledAttendances![1].type).toBe('tens');
    });

    it('should preserve all other fields when transforming cancelledAttendances', () => {
      const apiResponse: UpdateConsultationResponseDto = {
        consultation: baseConsultation,
        cancelledAttendances: [
          { id: 5, type: 'physiotherapy', scheduledDate: '2026-02-01' },
        ],
      };
      const result = transformConsultationResponse(apiResponse);
      expect(result.consultation).toEqual(baseConsultation);
      expect(result.cancelledAttendances![0].id).toBe(5);
      expect(result.cancelledAttendances![0].scheduledDate).toBe('2026-02-01');
    });
  });

  describe('reverse transformation functions', () => {
    describe('transformAttendanceTypeToApi', () => {
      it('should transform local to API format', () => {
        expect(transformAttendanceTypeToApi('assessment')).toBe(AttendanceType.ASSESSMENT);
        expect(transformAttendanceTypeToApi('physiotherapy')).toBe(AttendanceType.PHYSIOTHERAPY);
        expect(transformAttendanceTypeToApi('tens')).toBe(AttendanceType.TENS);
      });

      it('should default to ASSESSMENT for unknown type', () => {
        expect(transformAttendanceTypeToApi('unknown' as 'assessment')).toBe(AttendanceType.ASSESSMENT);
      });
    });

    describe('transformAttendanceProgressionToApi', () => {
      it('should transform local to API format', () => {
        expect(transformAttendanceProgressionToApi('scheduled')).toBe(AttendanceStatus.SCHEDULED);
        expect(transformAttendanceProgressionToApi('checkedIn')).toBe(AttendanceStatus.CHECKED_IN);
        expect(transformAttendanceProgressionToApi('onGoing')).toBe(AttendanceStatus.IN_PROGRESS);
        expect(transformAttendanceProgressionToApi('completed')).toBe(AttendanceStatus.COMPLETED);
      });

      it('should default to SCHEDULED for unknown status', () => {
        expect(transformAttendanceProgressionToApi('unknown' as 'scheduled')).toBe(AttendanceStatus.SCHEDULED);
      });
    });
  });
});
