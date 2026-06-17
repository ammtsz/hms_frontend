import { 
  PatientResponseDto, 
  PatientPriority,
  PatientStatus,
  AttendanceResponseDto,
  AttendanceType as ApiAttendanceType,
  AttendanceStatus as ApiAttendanceStatus, 
  UpdateConsultationResponseDto
} from '@/api/types';
import { formatDateClinic } from '@/utils/timezoneDate';
import { 
  PatientBasic,
  Patient,
  PreviousAttendance, 
  Priority, 
  Status, 
  AttendanceType,
  AttendanceProgression,
  AttendanceStatusDetail,
  AttendanceByDate
} from '@/types/types';
import { ProcessEndOfDayResponse } from '@/api/day-finalization';

export const transformPriority = (apiPriority: PatientPriority): Priority => {
  switch (apiPriority) {
    case PatientPriority.LEVEL_1:
      return "1";
    case PatientPriority.LEVEL_2:
      return "2";
    case PatientPriority.LEVEL_3:
      return "3";
    case PatientPriority.LEVEL_4:
      return "4";
    case PatientPriority.LEVEL_5:
      return "5";
    default:
      return "1";
  }
};

export const transformStatus = (apiStatus: PatientStatus): Status => {
  switch (apiStatus) {
    case PatientStatus.NEW_PATIENT:
      return "N";
    case PatientStatus.IN_TREATMENT:
      return "T";
    case PatientStatus.DISCHARGED:
      return "A";
    case PatientStatus.ABSENT:
      return "F";
    default:
      return "T";
  }
};

// Transform API AttendanceType to local AttendanceType
export const transformAttendanceType = (apiType: ApiAttendanceType): AttendanceType => {
  switch (apiType) {
    case ApiAttendanceType.ASSESSMENT:
      return "assessment";
    case ApiAttendanceType.PHYSIOTHERAPY:
      return "physiotherapy";
    case ApiAttendanceType.TENS:
      return "tens";
    default:
      return "assessment";
  }
};

// Transform API AttendanceStatus to local AttendanceProgression
// Note: MISSED and CANCELLED statuses are shown in "scheduled" column with special flags
export const transformAttendanceProgression = (apiStatus: ApiAttendanceStatus): AttendanceProgression => {
  switch (apiStatus) {
    case ApiAttendanceStatus.SCHEDULED:
      return "scheduled";
    case ApiAttendanceStatus.CHECKED_IN:
      return "checkedIn";
    case ApiAttendanceStatus.IN_PROGRESS:
      return "onGoing";
    case ApiAttendanceStatus.COMPLETED:
      return "completed";
    case ApiAttendanceStatus.MISSED:
    case ApiAttendanceStatus.CANCELLED:
      // Show missed/cancelled attendances in scheduled column with disabled state
      return "scheduled";
    default:
      return "scheduled";
  }
};

// Transform Patient from API to local format
export const transformPatientFromApi = (apiPatient: PatientResponseDto): PatientBasic => {
  return {
    id: apiPatient.id.toString(),
    name: apiPatient.name,
    phone: apiPatient.phone || '',
    priority: transformPriority(apiPatient.priority),
    status: transformStatus(apiPatient.patientStatus),
    birthDate: apiPatient.birthDate || undefined,
  };
};

// Transform single patient to Patient format for editing
export const transformSinglePatientFromApi = (apiPatient: PatientResponseDto): Patient => {
  return {
    id: apiPatient.id.toString(),
    name: apiPatient.name,
    phone: apiPatient.phone || '',
    priority: transformPriority(apiPatient.priority),
    status: transformStatus(apiPatient.patientStatus),
    // Required Patient properties with default values
    birthDate: apiPatient.birthDate || formatDateClinic(), // Keep as string: "YYYY-MM-DD"
    mainComplaint: apiPatient.mainComplaint || '',
    startDate: apiPatient.startDate, // Keep as string: "YYYY-MM-DD"
    dischargeDate: apiPatient.dischargeDate || null, // Keep as string or null
    missingAppointmentsStreak: apiPatient.missingAppointmentsStreak ?? 0,
    nextAttendanceDates: [],
    currentRecommendations: {
      date: formatDateClinic(), // String: "YYYY-MM-DD"
      food: '',
      water: '',
      ointment: '',
      physiotherapy: false,
      tens: false,
      returnWeeks: 0
    },
    previousAttendances: []
  };
};

// Transform attendance API data to PreviousAttendance format
export const transformAttendanceToPrevious = (apiAttendance: AttendanceResponseDto): PreviousAttendance => {
  return {
    attendanceId: apiAttendance.id.toString(),
    date: apiAttendance.scheduledDate, // Keep as string: "YYYY-MM-DD"
    type: transformAttendanceType(apiAttendance.type),
    notes: apiAttendance.notes || '',
    recommendations: null, // TODO: We need to implement recommendations mapping when backend provides this data
    status: apiAttendance.status as 'completed' | 'missed' | 'cancelled',
    absenceNotes: apiAttendance.absenceNotes,
    absenceJustified: apiAttendance.absenceJustified,
    createdDate: apiAttendance.createdAt.split("T")[0],
    updatedDate: apiAttendance.updatedAt.split("T")[0],
    cancelledDate: apiAttendance.cancelledDate,
  };
};

// Transform attendance API data to next attendance format
export const transformAttendanceToNext = (apiAttendance: AttendanceResponseDto): {
  attendanceId: string;
  date: string;
  type: AttendanceType;
  parentAttendanceId?: number;
  status?: 'scheduled' | 'checked_in' | 'in_progress' | 'cancelled';
  absenceNotes?: string;
  notes?: string; // Attendance notes for assessment consultations
  createdDate: string;
  updatedDate: string;
  cancelledDate?: string;
} => {
  return {
    attendanceId: String(apiAttendance.id),
    date: apiAttendance.scheduledDate, // Keep as string: "YYYY-MM-DD"
    type: transformAttendanceType(apiAttendance.type),
    parentAttendanceId: apiAttendance.parentAttendanceId,
    status: apiAttendance.status as 'scheduled' | 'checked_in' | 'in_progress' | 'cancelled',
    absenceNotes: apiAttendance.absenceNotes,
    notes: apiAttendance.notes,
    createdDate: apiAttendance.createdAt.split("T")[0],
    updatedDate: apiAttendance.updatedAt.split("T")[0],
    cancelledDate: apiAttendance.cancelledDate,
  };
};

// Enhanced patient transformer that includes attendance history
export const transformPatientWithAttendances = (
  apiPatient: PatientResponseDto, 
  attendances: AttendanceResponseDto[]
): Patient => {
  const basePatient = transformSinglePatientFromApi(apiPatient);
  
  // Filter completed attendances and transform them
  const previousAttendances = attendances
    .filter(attendance => attendance.status === 'completed')
    .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate)) // String comparison
    .map(transformAttendanceToPrevious);
  
  // Filter future attendances (scheduled, checked_in, in_progress) and transform them
  const currentDate = formatDateClinic(); // Today as string: "YYYY-MM-DD"
  
  const nextAttendanceDates = attendances
    .filter(attendance => {
      const isNotCompleted = ['scheduled', 'checked_in', 'in_progress'].includes(attendance.status);
      const isFuture = attendance.scheduledDate >= currentDate; // String comparison
      return isNotCompleted && isFuture;
    })
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)) // String comparison
    .map(transformAttendanceToNext);

  const openAttendancesCount = attendances.filter(attendance =>
    ['scheduled', 'checked_in', 'in_progress'].includes(attendance.status),
  ).length;
    
  return {
    ...basePatient,
    previousAttendances,
    nextAttendanceDates,
    openAttendancesCount,
  };
};

// Transform array of attendances by date into AttendanceByDate format
export const transformAttendanceWithPatientByDate = (
  apiAttendances: AttendanceResponseDto[], 
  date: string
): AttendanceByDate => {
  // date is already in YYYY-MM-DD format - no conversion needed
  
  const result: AttendanceByDate = {
    date: date, // Keep as YYYY-MM-DD string
    assessment: {
      scheduled: [],
      checkedIn: [],
      onGoing: [],
      completed: []
    },
    physiotherapy: {
      scheduled: [],
      checkedIn: [],
      onGoing: [],
      completed: []
    },
    tens: {
      scheduled: [],
      checkedIn: [],
      onGoing: [],
      completed: []
    },
    combined: {
      scheduled: [],
      checkedIn: [],
      onGoing: [],
      completed: []
    }
  };

  // Group attendances by type and status
  apiAttendances.forEach(attendance => {
    const attendanceType = transformAttendanceType(attendance.type);
    const attendanceStatus = transformAttendanceProgression(attendance.status);
    const statusDetail = transformAttendanceStatusFromApi(attendance);

    // Add to the appropriate category
    result[attendanceType][attendanceStatus].push(statusDetail);
  });

  return result;
};

// Transform array of patients from API to local format  
export const transformPatientsFromApi = (apiPatients: PatientResponseDto[]): PatientBasic[] => {
  return apiPatients.map(transformPatientFromApi);
};

// Transform local priority to API priority
export const transformPriorityToApi = (localPriority: Priority): PatientPriority => {
  switch (localPriority) {
    case "1":
      return PatientPriority.LEVEL_1;
    case "2":
      return PatientPriority.LEVEL_2;
    case "3":
      return PatientPriority.LEVEL_3;
    case "4":
      return PatientPriority.LEVEL_4;
    case "5":
      return PatientPriority.LEVEL_5;
    default:
      return PatientPriority.LEVEL_1;
  }
};

// Transform local status to API status
export const transformStatusToApi = (localStatus: Status): PatientStatus => {
  switch (localStatus) {
    case "N":
      return PatientStatus.NEW_PATIENT;
    case "T":
      return PatientStatus.IN_TREATMENT;
    case "A":
      return PatientStatus.DISCHARGED;
    case "F":
      return PatientStatus.ABSENT;
    default:
      return PatientStatus.NEW_PATIENT; // Default to NEW_PATIENT for new patients
  }
};

// Transform local attendance type to API attendance type
export const transformAttendanceTypeToApi = (localType: AttendanceType): ApiAttendanceType => {
  switch (localType) {
    case "assessment":
      return ApiAttendanceType.ASSESSMENT;
    case "physiotherapy":
      return ApiAttendanceType.PHYSIOTHERAPY;
    case "tens":
      return ApiAttendanceType.TENS;
    default:
      return ApiAttendanceType.ASSESSMENT;
  }
};

// Transform local attendance progression to API attendance status
export const transformAttendanceProgressionToApi = (localProgression: AttendanceProgression): ApiAttendanceStatus => {
  switch (localProgression) {
    case "scheduled":
      return ApiAttendanceStatus.SCHEDULED;
    case "checkedIn":
      return ApiAttendanceStatus.CHECKED_IN;
    case "onGoing":
      return ApiAttendanceStatus.IN_PROGRESS;
    case "completed":
      return ApiAttendanceStatus.COMPLETED;
    default:
      return ApiAttendanceStatus.SCHEDULED;
  }
};

// Transform attendance status details from API
export const transformAttendanceStatusFromApi = (apiAttendance: AttendanceResponseDto): AttendanceStatusDetail => {
  const patientName = apiAttendance.patient?.name || `Patient ${apiAttendance.patientId}`;
  const patientPriority = apiAttendance.patient?.priority || PatientPriority.LEVEL_1;
  
  return {
    name: patientName,
    priority: transformPriority(patientPriority),
    checkedInTime: apiAttendance.checkedInTime,
    onGoingTime: apiAttendance.startedTime,
    completedTime: apiAttendance.completedTime,
    attendanceId: apiAttendance.id,
    patientId: apiAttendance.patientId,
    // Set metadata flags for missed/cancelled attendances
    isMissed: apiAttendance.status === ApiAttendanceStatus.MISSED,
    isCancelled: apiAttendance.status === ApiAttendanceStatus.CANCELLED,
  };
};

/** Convert types from physiotherapy to physiotherapy */
export const transformProcessEndOfDayResponse = (apiResponse: ProcessEndOfDayResponse): ProcessEndOfDayResponse => {
  return {
    ...apiResponse,
    rescheduled: apiResponse.rescheduled.map(attendance => ({
      ...attendance,
      type: attendance.type === 'physiotherapy' ? 'physiotherapy' : attendance.type,
    })),
    statusChangedToF: apiResponse.statusChangedToF,
    cancelledForF: apiResponse.cancelledForF.map(attendance => ({
      ...attendance,
      attendances: attendance.attendances.map(attendance => ({
        ...attendance,
        type: attendance.type === 'physiotherapy' ? 'physiotherapy' : attendance.type,
      })),
    })),
    couldNotReschedule: apiResponse.couldNotReschedule,
  };
};

/** Convert types from physiotherapy to physiotherapy on consultation mutation responses */
export const transformConsultationResponse = (
  apiResponse: UpdateConsultationResponseDto,
): UpdateConsultationResponseDto => {
  return {
    ...apiResponse,
    cancelledAttendances: apiResponse.cancelledAttendances?.map(attendance => ({
      ...attendance,
      type: attendance.type === 'physiotherapy' ? 'physiotherapy' : attendance.type,
    })),
  };
};

/**
 * Transform attendance type label for display
 */
export const getAttendanceTypeLabel = (type: AttendanceType): string => {
  switch (type) {
    case "assessment":
      return "Consulta de Avaliação";
    case "physiotherapy":
      return "Fisioterapia";
    case "tens":
      return "TENS";
    default:
      return "Consulta de Avaliação";
  }
};

export const getAttendanceStatusLabel = (
  checkedInTime?: string | null,
  onGoingTime?: string | null,
  completedTime?: string | null
): string => {
  if (completedTime) return "Atendimento finalizado";
  if (onGoingTime) return "Atendimento não finalizado";
  if (checkedInTime) return "Check-in Realizado";
  return "Agendado";
};

