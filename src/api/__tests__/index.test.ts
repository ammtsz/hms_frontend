import * as patientApi from '../patients';
import * as attendanceApi from '../attendances';
import * as consultationApi from '../consultations';
import * as scheduleSettingApi from '../schedule-settings';
import * as types from '../types';
import * as utils from '../utils/functions';

// Test that all API modules are properly exported
describe('API Index Exports', () => {
  it('should export all patient API functions', () => {
    expect(patientApi.getPatients).toBeDefined();
    expect(patientApi.getPatientById).toBeDefined();
    expect(patientApi.createPatient).toBeDefined();
    expect(patientApi.updatePatient).toBeDefined();
    expect(patientApi.deletePatient).toBeDefined();
  });

  it('should export all attendance API functions', () => {
    expect(attendanceApi.getAttendances).toBeDefined();
    expect(attendanceApi.getAttendanceById).toBeDefined();
    expect(attendanceApi.createAttendance).toBeDefined();
    expect(attendanceApi.updateAttendance).toBeDefined();
    expect(attendanceApi.deleteAttendance).toBeDefined();
    expect(attendanceApi.checkInAttendance).toBeDefined();
    expect(attendanceApi.startAttendance).toBeDefined();
    expect(attendanceApi.completeAttendance).toBeDefined();
    expect(attendanceApi.cancelAttendance).toBeDefined();
  });

  it('should export all consultation API functions', () => {
    expect(consultationApi.getConsultations).toBeDefined();
    expect(consultationApi.createConsultation).toBeDefined();
    expect(consultationApi.updateConsultation).toBeDefined();
    expect(consultationApi.deleteConsultation).toBeDefined();
    expect(consultationApi.getConsultationByAttendance).toBeDefined();
  });

  it('should export all schedule setting API functions', () => {
    expect(scheduleSettingApi.getScheduleSettings).toBeDefined();
    expect(scheduleSettingApi.getScheduleSettingById).toBeDefined();
    expect(scheduleSettingApi.getScheduleSettingByDay).toBeDefined();
    expect(scheduleSettingApi.createScheduleSetting).toBeDefined();
    expect(scheduleSettingApi.updateScheduleSetting).toBeDefined();
    expect(scheduleSettingApi.deleteScheduleSetting).toBeDefined();
    expect(scheduleSettingApi.getActiveScheduleSettings).toBeDefined();
  });

  it('should export types', () => {
    expect(types.PatientPriority).toBeDefined();
    expect(types.PatientStatus).toBeDefined();
    expect(types.AttendanceType).toBeDefined();
    expect(types.AttendanceStatus).toBeDefined();
  });

  it('should export utility functions', () => {
    expect(utils.getErrorMessage).toBeDefined();
  });
});
