import { addCalendarDaysToLocalYmd, getTodayClinic } from '@/utils/timezoneDate';
import { 
  transformPriority, 
  transformStatus, 
  transformAppointmentType, 
  transformAppointmentProgression,
  transformStatusToApi,
  transformPriorityToApi,
  transformPatientFromApi,
  transformSinglePatientFromApi,
  transformAppointmentToPrevious,
  transformAppointmentToNext,
  transformPatientWithAppointments,
  transformAppointmentTypeToApi,
  transformAppointmentProgressionToApi,
  transformProcessEndOfDayResponse,
  transformConsultationResponse
} from '../apiTransformers';
import { PatientPriority, PatientStatus, AppointmentType, AppointmentStatus, PatientResponseDto, AppointmentResponseDto } from '@/api/types';
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

    it('should transform DISCHARGED to "D"', () => {
      expect(transformStatus(PatientStatus.DISCHARGED)).toBe('D');
    });

    it('should transform CONSECUTIVE_NO_SHOWS to "C"', () => {
      expect(transformStatus(PatientStatus.CONSECUTIVE_NO_SHOWS)).toBe('C');
    });

    it('should default to "T" for unknown status', () => {
      expect(transformStatus('UNKNOWN' as PatientStatus)).toBe('T');
    });
  });

  describe('transformAppointmentType', () => {
    it('should transform ASSESSMENT to "assessment"', () => {
      expect(transformAppointmentType(AppointmentType.ASSESSMENT)).toBe('assessment');
    });

    it('should transform PHYSIOTHERAPY to "physiotherapy"', () => {
      expect(transformAppointmentType(AppointmentType.PHYSIOTHERAPY)).toBe('physiotherapy');
    });

    it('should transform TENS to "tens"', () => {
      expect(transformAppointmentType(AppointmentType.TENS)).toBe('tens');
    });

    it('should default to "assessment" for unknown type', () => {
      expect(transformAppointmentType('UNKNOWN' as AppointmentType)).toBe('assessment');
    });
  });

  describe('transformAppointmentProgression', () => {
    it('should transform SCHEDULED to "scheduled"', () => {
      expect(transformAppointmentProgression(AppointmentStatus.SCHEDULED)).toBe('scheduled');
    });

    it('should transform CHECKED_IN to "checkedIn"', () => {
      expect(transformAppointmentProgression(AppointmentStatus.CHECKED_IN)).toBe('checkedIn');
    });

    it('should transform IN_PROGRESS to "onGoing"', () => {
      expect(transformAppointmentProgression(AppointmentStatus.IN_PROGRESS)).toBe('onGoing');
    });

    it('should transform COMPLETED to "completed"', () => {
      expect(transformAppointmentProgression(AppointmentStatus.COMPLETED)).toBe('completed');
    });

    it('should transform MISSED to "scheduled" (shown in scheduled column with flag)', () => {
      expect(transformAppointmentProgression(AppointmentStatus.MISSED)).toBe('scheduled');
    });

    it('should transform CANCELLED to "scheduled" (shown in scheduled column with flag)', () => {
      expect(transformAppointmentProgression(AppointmentStatus.CANCELLED)).toBe('scheduled');
    });

    it('should default to "scheduled" for unknown status', () => {
      expect(transformAppointmentProgression('UNKNOWN' as AppointmentStatus)).toBe('scheduled');
    });
  });

  describe('transformStatusToApi', () => {
    it('should transform "N" to NEW_PATIENT', () => {
      expect(transformStatusToApi('N')).toBe(PatientStatus.NEW_PATIENT);
    });

    it('should transform "T" to IN_TREATMENT', () => {
      expect(transformStatusToApi('T')).toBe(PatientStatus.IN_TREATMENT);
    });

    it('should transform "D" to DISCHARGED', () => {
      expect(transformStatusToApi('D')).toBe(PatientStatus.DISCHARGED);
    });

    it('should transform "C" to CONSECUTIVE_NO_SHOWS', () => {
      expect(transformStatusToApi('C')).toBe(PatientStatus.CONSECUTIVE_NO_SHOWS);
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
      mainConcern: 'Test complaint',
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
      mainConcern: 'Test complaint',
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
      expect(result.mainConcern).toBe('Test complaint');
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

    it('should handle missing main concern', () => {
      const apiPatient = createMockPatient({ mainConcern: null });
      const result = transformSinglePatientFromApi(apiPatient);

      expect(result.mainConcern).toBe('');
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

  describe('transformAppointmentToPrevious', () => {
    const createMockAppointment = (overrides = {}): AppointmentResponseDto => ({
      id: 1,
      patientId: 1,
      scheduledDate: '2025-01-15',
      scheduledTime: '10:00',
      type: AppointmentType.ASSESSMENT,
      status: AppointmentStatus.COMPLETED,
      notes: 'Test notes',
      createdAt: '2025-01-15T00:00:00Z',
      updatedAt: '2025-01-15T00:00:00Z',
      ...overrides
    });

    it('should transform appointment to previous format', () => {
      const apiAppointment = createMockAppointment();
      const result = transformAppointmentToPrevious(apiAppointment);

      expect(result).toEqual({
        appointmentId: '1',
        date: '2025-01-15',
        type: 'assessment',
        notes: 'Test notes',
        recommendations: null,
        status: AppointmentStatus.COMPLETED,
        absenceNotes: undefined,
        absenceJustified: undefined,
        createdDate: '2025-01-15',
        updatedDate: '2025-01-15',
        cancelledDate: undefined
      });
    });

    it('should handle missing notes', () => {
      const apiAppointment = createMockAppointment({ notes: undefined });
      const result = transformAppointmentToPrevious(apiAppointment);

      expect(result.notes).toBe('');
    });

    it('should handle different appointment types', () => {
      const physiotherapyAppointment = createMockAppointment({ type: AppointmentType.PHYSIOTHERAPY });
      const tensAppointment = createMockAppointment({ type: AppointmentType.TENS });

      expect(transformAppointmentToPrevious(physiotherapyAppointment).type).toBe('physiotherapy');
      expect(transformAppointmentToPrevious(tensAppointment).type).toBe('tens');
    });
  });

  describe('transformAppointmentToNext', () => {
    const createMockAppointment = (overrides = {}): AppointmentResponseDto => ({
      id: 1,
      patientId: 1,
      scheduledDate: '2025-01-20',
      scheduledTime: '14:00',
      type: AppointmentType.ASSESSMENT,
      status: AppointmentStatus.SCHEDULED,
      notes: undefined,
      createdAt: '2025-01-15T00:00:00Z',
      updatedAt: '2025-01-15T00:00:00Z',
      ...overrides
    });

    it('should transform appointment to next format', () => {
      const apiAppointment = createMockAppointment();
      const result = transformAppointmentToNext(apiAppointment);

      expect(result).toMatchObject({
        appointmentId: '1',
        date: '2025-01-20',
        type: 'assessment',
        parentAppointmentId: undefined,
      });
      expect(result.createdDate).toBeDefined();
      expect(result.updatedDate).toBeDefined();
    });

    it('should handle different appointment types', () => {
      const physiotherapyAppointment = createMockAppointment({ type: AppointmentType.PHYSIOTHERAPY });
      const result = transformAppointmentToNext(physiotherapyAppointment);

      expect(result.type).toBe('physiotherapy');
    });

    it('should include parentAppointmentId when present', () => {
      const returnConsultation = createMockAppointment({ parentAppointmentId: 42 });
      const result = transformAppointmentToNext(returnConsultation);

      expect(result).toMatchObject({
        appointmentId: '1',
        date: '2025-01-20',
        type: 'assessment',
        parentAppointmentId: 42,
      });
    });
  });

  describe('transformPatientWithAppointments', () => {
    const createMockPatient = (): PatientResponseDto => ({
      id: 1,
      name: 'Test Patient',
      phone: '11999999999',
      priority: PatientPriority.LEVEL_3,
      patientStatus: PatientStatus.IN_TREATMENT,
      birthDate: '1990-01-01',
      mainConcern: 'Test complaint',
      startDate: '2025-01-01',
      dischargeDate: undefined,
      missingAppointmentsStreak: 0,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    });

    const createMockAppointment = (overrides = {}): AppointmentResponseDto => ({
      id: 1,
      patientId: 1,
      scheduledDate: '2025-01-15',
      scheduledTime: '10:00',
      type: AppointmentType.ASSESSMENT,
      status: AppointmentStatus.COMPLETED,
      notes: 'Test notes',
      createdAt: '2025-01-15T00:00:00Z',
      updatedAt: '2025-01-15T00:00:00Z',
      ...overrides
    });

    it('should transform patient with completed appointments', () => {
      const patient = createMockPatient();
      const appointments = [
        createMockAppointment({ id: 1, status: AppointmentStatus.COMPLETED, scheduledDate: '2025-01-10' }),
        createMockAppointment({ id: 2, status: AppointmentStatus.COMPLETED, scheduledDate: '2025-01-05' })
      ];

      const result = transformPatientWithAppointments(patient, appointments);

      expect(result.previousAppointments).toHaveLength(2);
      expect(result.previousAppointments[0].appointmentId).toBe('1'); // Most recent first
      expect(result.previousAppointments[1].appointmentId).toBe('2');
    });

    it('should filter out non-completed appointments from previous', () => {
      const patient = createMockPatient();
      const appointments = [
        createMockAppointment({ id: 1, status: AppointmentStatus.COMPLETED }),
        createMockAppointment({ id: 2, status: AppointmentStatus.SCHEDULED }),
        createMockAppointment({ id: 3, status: AppointmentStatus.IN_PROGRESS })
      ];

      const result = transformPatientWithAppointments(patient, appointments);

      expect(result.previousAppointments).toHaveLength(1);
      expect(result.previousAppointments[0].appointmentId).toBe('1');
      expect(result.openAppointmentsCount).toBe(2); // scheduled + in_progress
    });

    it('should include future appointments', () => {
      const patient = createMockPatient();
      const futureDateString = addCalendarDaysToLocalYmd(getTodayClinic(), 7);

      const appointments = [
        createMockAppointment({ 
          id: 1, 
          status: AppointmentStatus.SCHEDULED, 
          scheduledDate: futureDateString 
        }),
        createMockAppointment({ 
          id: 2, 
          status: AppointmentStatus.CHECKED_IN, 
          scheduledDate: futureDateString 
        })
      ];

      const result = transformPatientWithAppointments(patient, appointments);

      expect(result.nextAppointmentDates).toHaveLength(2);
    });

    it('should handle empty appointments array', () => {
      const patient = createMockPatient();
      const result = transformPatientWithAppointments(patient, []);

      expect(result.previousAppointments).toHaveLength(0);
      expect(result.nextAppointmentDates).toHaveLength(0);
      expect(result.openAppointmentsCount).toBe(0);
    });
  });

  describe('transformProcessEndOfDayResponse', () => {
    it('should convert physiotherapy to physiotherapy in rescheduled items', () => {
      const apiResponse = {
        rescheduled: [
          {
            appointmentId: 1,
            patientId: 1,
            patientName: 'John Doe',
            type: 'physiotherapy',
            oldDate: '2024-01-15',
            newDate: '2024-01-22',
          },
        ],
        statusChangedToC: [],
        cancelledForC: [],
        couldNotReschedule: [],
      };

      const result = transformProcessEndOfDayResponse(apiResponse);

      expect(result.rescheduled[0].type).toBe('physiotherapy');
    });

    it('should convert physiotherapy to physiotherapy in cancelledForC appointments', () => {
      const apiResponse = {
        rescheduled: [],
        statusChangedToC: [],
        cancelledForC: [
          {
            patientId: 1,
            patientName: 'Jane',
            appointments: [
              { id: 10, type: 'physiotherapy', scheduledDate: '2024-01-20' },
            ],
          },
        ],
        couldNotReschedule: [],
      };

      const result = transformProcessEndOfDayResponse(apiResponse);

      expect(result.cancelledForC[0].appointments[0].type).toBe('physiotherapy');
    });

    it('should leave assessment and tens types unchanged', () => {
      const apiResponse = {
        rescheduled: [
          {
            appointmentId: 1,
            patientId: 1,
            patientName: 'John',
            type: 'assessment',
            oldDate: '2024-01-15',
            newDate: '2024-01-22',
          },
          {
            appointmentId: 2,
            patientId: 2,
            patientName: 'Jane',
            type: 'tens',
            oldDate: '2024-01-15',
            newDate: '2024-01-22',
          },
        ],
        statusChangedToC: [],
        cancelledForC: [],
        couldNotReschedule: [],
      };

      const result = transformProcessEndOfDayResponse(apiResponse);

      expect(result.rescheduled[0].type).toBe('assessment');
      expect(result.rescheduled[1].type).toBe('tens');
    });

    it('should preserve all other response fields', () => {
      const apiResponse = {
        rescheduled: [],
        statusChangedToC: [{ patientId: 1, patientName: 'Bob' }],
        cancelledForC: [],
        couldNotReschedule: [
          {
            appointmentId: 5,
            patientId: 3,
            patientName: 'Alice',
            type: 'assessment',
            reason: 'No slots',
          },
        ],
      };

      const result = transformProcessEndOfDayResponse(apiResponse);

      expect(result.statusChangedToC).toEqual(apiResponse.statusChangedToC);
      expect(result.couldNotReschedule).toEqual(apiResponse.couldNotReschedule);
    });
  });

  describe('transformConsultationResponse', () => {
    const baseConsultation: UpdateConsultationResponseDto['consultation'] = {
      id: 1,
      appointmentId: 1,
      createdDate: '2024-01-15',
      createdTime: '10:00:00',
      updatedDate: '2024-01-15',
      updatedTime: '10:00:00',
      mainConcern: 'Test',
      food: '',
      water: '',
      ointments: '',
      physiotherapy: false,
      tens: false,
      returnWeeks: 2,
      notes: '',
    };

    it('should preserve consultation and other fields when cancelledAppointments is undefined', () => {
      const apiResponse: UpdateConsultationResponseDto = {
        consultation: baseConsultation,
      };
      const result = transformConsultationResponse(apiResponse);
      expect(result.consultation).toEqual(baseConsultation);
      expect(result.cancelledAppointments).toBeUndefined();
    });

    it('should preserve consultation when cancelledAppointments is empty array', () => {
      const apiResponse: UpdateConsultationResponseDto = {
        consultation: baseConsultation,
        cancelledAppointments: [],
      };
      const result = transformConsultationResponse(apiResponse);
      expect(result.consultation).toEqual(baseConsultation);
      expect(result.cancelledAppointments).toEqual([]);
    });

    it('should convert physiotherapy to physiotherapy in cancelledAppointments', () => {
      const apiResponse: UpdateConsultationResponseDto = {
        consultation: baseConsultation,
        cancelledAppointments: [
          { id: 10, type: 'physiotherapy', scheduledDate: '2026-01-20' },
        ],
      };
      const result = transformConsultationResponse(apiResponse);
      expect(result.cancelledAppointments).toHaveLength(1);
      expect(result.cancelledAppointments![0]).toMatchObject({
        id: 10,
        type: 'physiotherapy',
        scheduledDate: '2026-01-20',
      });
    });

    it('should leave assessment and tens types unchanged in cancelledAppointments', () => {
      const apiResponse: UpdateConsultationResponseDto = {
        consultation: baseConsultation,
        cancelledAppointments: [
          { id: 1, type: 'assessment', scheduledDate: '2026-01-15' },
          { id: 2, type: 'tens', scheduledDate: '2026-01-16' },
        ],
      };
      const result = transformConsultationResponse(apiResponse);
      expect(result.cancelledAppointments![0].type).toBe('assessment');
      expect(result.cancelledAppointments![1].type).toBe('tens');
    });

    it('should preserve all other fields when transforming cancelledAppointments', () => {
      const apiResponse: UpdateConsultationResponseDto = {
        consultation: baseConsultation,
        cancelledAppointments: [
          { id: 5, type: 'physiotherapy', scheduledDate: '2026-02-01' },
        ],
      };
      const result = transformConsultationResponse(apiResponse);
      expect(result.consultation).toEqual(baseConsultation);
      expect(result.cancelledAppointments![0].id).toBe(5);
      expect(result.cancelledAppointments![0].scheduledDate).toBe('2026-02-01');
    });
  });

  describe('reverse transformation functions', () => {
    describe('transformAppointmentTypeToApi', () => {
      it('should transform local to API format', () => {
        expect(transformAppointmentTypeToApi('assessment')).toBe(AppointmentType.ASSESSMENT);
        expect(transformAppointmentTypeToApi('physiotherapy')).toBe(AppointmentType.PHYSIOTHERAPY);
        expect(transformAppointmentTypeToApi('tens')).toBe(AppointmentType.TENS);
      });

      it('should default to ASSESSMENT for unknown type', () => {
        expect(transformAppointmentTypeToApi('unknown' as 'assessment')).toBe(AppointmentType.ASSESSMENT);
      });
    });

    describe('transformAppointmentProgressionToApi', () => {
      it('should transform local to API format', () => {
        expect(transformAppointmentProgressionToApi('scheduled')).toBe(AppointmentStatus.SCHEDULED);
        expect(transformAppointmentProgressionToApi('checkedIn')).toBe(AppointmentStatus.CHECKED_IN);
        expect(transformAppointmentProgressionToApi('onGoing')).toBe(AppointmentStatus.IN_PROGRESS);
        expect(transformAppointmentProgressionToApi('completed')).toBe(AppointmentStatus.COMPLETED);
      });

      it('should default to SCHEDULED for unknown status', () => {
        expect(transformAppointmentProgressionToApi('unknown' as 'scheduled')).toBe(AppointmentStatus.SCHEDULED);
      });
    });
  });
});
