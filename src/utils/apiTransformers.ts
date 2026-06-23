import { 
  PatientResponseDto, 
  PatientPriority,
  PatientStatus,
  AppointmentResponseDto,
  AppointmentType as ApiAppointmentType,
  AppointmentStatus as ApiAppointmentStatus, 
  UpdateConsultationResponseDto
} from '@/api/types';
import { formatDateClinic } from '@/utils/timezoneDate';
import { 
  PatientBasic,
  Patient,
  PreviousAppointment, 
  Priority, 
  Status, 
  AppointmentType,
  AppointmentProgression,
  AppointmentStatusDetail,
  AppointmentByDate
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
      return "D";
    case PatientStatus.CONSECUTIVE_NO_SHOWS:
      return "C";
    default:
      return "T";
  }
};

// Transform API AppointmentType to local AppointmentType
export const transformAppointmentType = (apiType: ApiAppointmentType): AppointmentType => {
  switch (apiType) {
    case ApiAppointmentType.ASSESSMENT:
      return "assessment";
    case ApiAppointmentType.PHYSIOTHERAPY:
      return "physiotherapy";
    case ApiAppointmentType.TENS:
      return "tens";
    default:
      return "assessment";
  }
};

// Transform API AppointmentStatus to local AppointmentProgression
// Note: MISSED and CANCELLED statuses are shown in "scheduled" column with special flags
export const transformAppointmentProgression = (apiStatus: ApiAppointmentStatus): AppointmentProgression => {
  switch (apiStatus) {
    case ApiAppointmentStatus.SCHEDULED:
      return "scheduled";
    case ApiAppointmentStatus.CHECKED_IN:
      return "checkedIn";
    case ApiAppointmentStatus.IN_PROGRESS:
      return "onGoing";
    case ApiAppointmentStatus.COMPLETED:
      return "completed";
    case ApiAppointmentStatus.MISSED:
    case ApiAppointmentStatus.CANCELLED:
      // Show missed/cancelled appointments in scheduled column with disabled state
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
    mainConcern: apiPatient.mainConcern || '',
    startDate: apiPatient.startDate, // Keep as string: "YYYY-MM-DD"
    dischargeDate: apiPatient.dischargeDate || null, // Keep as string or null
    missingAppointmentsStreak: apiPatient.missingAppointmentsStreak ?? 0,
    nextAppointmentDates: [],
    currentRecommendations: {
      date: formatDateClinic(), // String: "YYYY-MM-DD"
      food: '',
      water: '',
      ointment: '',
      physiotherapy: false,
      tens: false,
      returnWeeks: 0
    },
    previousAppointments: []
  };
};

// Transform appointment API data to PreviousAppointment format
export const transformAppointmentToPrevious = (apiAppointment: AppointmentResponseDto): PreviousAppointment => {
  return {
    appointmentId: apiAppointment.id.toString(),
    date: apiAppointment.scheduledDate, // Keep as string: "YYYY-MM-DD"
    type: transformAppointmentType(apiAppointment.type),
    notes: apiAppointment.notes || '',
    recommendations: null, // TODO: We need to implement recommendations mapping when backend provides this data
    status: apiAppointment.status as 'completed' | 'missed' | 'cancelled',
    absenceNotes: apiAppointment.absenceNotes,
    absenceJustified: apiAppointment.absenceJustified,
    createdDate: apiAppointment.createdAt.split("T")[0],
    updatedDate: apiAppointment.updatedAt.split("T")[0],
    cancelledDate: apiAppointment.cancelledDate,
  };
};

// Transform appointment API data to next appointment format
export const transformAppointmentToNext = (apiAppointment: AppointmentResponseDto): {
  appointmentId: string;
  date: string;
  type: AppointmentType;
  parentAppointmentId?: number;
  status?: 'scheduled' | 'checked_in' | 'in_progress' | 'cancelled';
  absenceNotes?: string;
  notes?: string; // Appointment notes for assessment consultations
  createdDate: string;
  updatedDate: string;
  cancelledDate?: string;
} => {
  return {
    appointmentId: String(apiAppointment.id),
    date: apiAppointment.scheduledDate, // Keep as string: "YYYY-MM-DD"
    type: transformAppointmentType(apiAppointment.type),
    parentAppointmentId: apiAppointment.parentAppointmentId,
    status: apiAppointment.status as 'scheduled' | 'checked_in' | 'in_progress' | 'cancelled',
    absenceNotes: apiAppointment.absenceNotes,
    notes: apiAppointment.notes,
    createdDate: apiAppointment.createdAt.split("T")[0],
    updatedDate: apiAppointment.updatedAt.split("T")[0],
    cancelledDate: apiAppointment.cancelledDate,
  };
};

// Enhanced patient transformer that includes appointment history
export const transformPatientWithAppointments = (
  apiPatient: PatientResponseDto, 
  appointments: AppointmentResponseDto[]
): Patient => {
  const basePatient = transformSinglePatientFromApi(apiPatient);
  
  // Filter completed appointments and transform them
  const previousAppointments = appointments
    .filter(appointment => appointment.status === 'completed')
    .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate)) // String comparison
    .map(transformAppointmentToPrevious);
  
  // Filter future appointments (scheduled, checked_in, in_progress) and transform them
  const currentDate = formatDateClinic(); // Today as string: "YYYY-MM-DD"
  
  const nextAppointmentDates = appointments
    .filter(appointment => {
      const isNotCompleted = ['scheduled', 'checked_in', 'in_progress'].includes(appointment.status);
      const isFuture = appointment.scheduledDate >= currentDate; // String comparison
      return isNotCompleted && isFuture;
    })
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)) // String comparison
    .map(transformAppointmentToNext);

  const openAppointmentsCount = appointments.filter(appointment =>
    ['scheduled', 'checked_in', 'in_progress'].includes(appointment.status),
  ).length;
    
  return {
    ...basePatient,
    previousAppointments,
    nextAppointmentDates,
    openAppointmentsCount,
  };
};

// Transform array of appointments by date into AppointmentByDate format
export const transformAppointmentWithPatientByDate = (
  apiAppointments: AppointmentResponseDto[], 
  date: string
): AppointmentByDate => {
  // date is already in YYYY-MM-DD format - no conversion needed
  
  const result: AppointmentByDate = {
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

  // Group appointments by type and status
  apiAppointments.forEach(appointment => {
    const appointmentType = transformAppointmentType(appointment.type);
    const appointmentStatus = transformAppointmentProgression(appointment.status);
    const statusDetail = transformAppointmentStatusFromApi(appointment);

    // Add to the appropriate category
    result[appointmentType][appointmentStatus].push(statusDetail);
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
    case "D":
      return PatientStatus.DISCHARGED;
    case "C":
      return PatientStatus.CONSECUTIVE_NO_SHOWS;
    default:
      return PatientStatus.NEW_PATIENT; // Default to NEW_PATIENT for new patients
  }
};

// Transform local appointment type to API appointment type
export const transformAppointmentTypeToApi = (localType: AppointmentType): ApiAppointmentType => {
  switch (localType) {
    case "assessment":
      return ApiAppointmentType.ASSESSMENT;
    case "physiotherapy":
      return ApiAppointmentType.PHYSIOTHERAPY;
    case "tens":
      return ApiAppointmentType.TENS;
    default:
      return ApiAppointmentType.ASSESSMENT;
  }
};

// Transform local appointment progression to API appointment status
export const transformAppointmentProgressionToApi = (localProgression: AppointmentProgression): ApiAppointmentStatus => {
  switch (localProgression) {
    case "scheduled":
      return ApiAppointmentStatus.SCHEDULED;
    case "checkedIn":
      return ApiAppointmentStatus.CHECKED_IN;
    case "onGoing":
      return ApiAppointmentStatus.IN_PROGRESS;
    case "completed":
      return ApiAppointmentStatus.COMPLETED;
    default:
      return ApiAppointmentStatus.SCHEDULED;
  }
};

// Transform appointment status details from API
export const transformAppointmentStatusFromApi = (apiAppointment: AppointmentResponseDto): AppointmentStatusDetail => {
  const patientName = apiAppointment.patient?.name || `Patient ${apiAppointment.patientId}`;
  const patientPriority = apiAppointment.patient?.priority || PatientPriority.LEVEL_1;
  
  return {
    name: patientName,
    priority: transformPriority(patientPriority),
    checkedInTime: apiAppointment.checkedInTime,
    onGoingTime: apiAppointment.startedTime,
    completedTime: apiAppointment.completedTime,
    appointmentId: apiAppointment.id,
    patientId: apiAppointment.patientId,
    // Set metadata flags for missed/cancelled appointments
    isMissed: apiAppointment.status === ApiAppointmentStatus.MISSED,
    isCancelled: apiAppointment.status === ApiAppointmentStatus.CANCELLED,
  };
};

/** Convert types from physiotherapy to physiotherapy */
export const transformProcessEndOfDayResponse = (apiResponse: ProcessEndOfDayResponse): ProcessEndOfDayResponse => {
  return {
    ...apiResponse,
    rescheduled: apiResponse.rescheduled.map(appointment => ({
      ...appointment,
      type: appointment.type === 'physiotherapy' ? 'physiotherapy' : appointment.type,
    })),
    statusChangedToC: apiResponse.statusChangedToC,
    cancelledForC: apiResponse.cancelledForC.map(appointment => ({
      ...appointment,
      appointments: appointment.appointments.map(appointment => ({
        ...appointment,
        type: appointment.type === 'physiotherapy' ? 'physiotherapy' : appointment.type,
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
    cancelledAppointments: apiResponse.cancelledAppointments?.map(appointment => ({
      ...appointment,
      type: appointment.type === 'physiotherapy' ? 'physiotherapy' : appointment.type,
    })),
  };
};

/**
 * Transform appointment type label for display
 */
export const getAppointmentTypeLabel = (type: AppointmentType): string => {
  switch (type) {
    case "assessment":
      return "Assessment Consultation";
    case "physiotherapy":
      return "Physiotherapy";
    case "tens":
      return "TENS";
    default:
      return "Assessment Consultation";
  }
};

export const getAppointmentStatusLabel = (
  checkedInTime?: string | null,
  onGoingTime?: string | null,
  completedTime?: string | null
): string => {
  if (completedTime) return "Appointment completed";
  if (onGoingTime) return "Appointment not completed";
  if (checkedInTime) return "Checked in";
  return "Scheduled";
};

