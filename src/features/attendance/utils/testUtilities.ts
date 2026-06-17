import type { AttendanceStatusDetail, AttendanceByDate, AttendanceType, Priority } from "@/types/types";
import type { IAttendanceStatusDetailWithType } from "./attendanceDataUtils";
import type { IGroupedPatient } from "./patientGrouping";

/**
 * Factory function to create mock AttendanceStatusDetail objects
 */
export const createMockAttendanceStatusDetail = (
  overrides: Partial<AttendanceStatusDetail> = {}
): AttendanceStatusDetail => ({
  name: "John Doe",
  priority: "3" as Priority, // normal priority is "3"
  checkedInTime: null,
  onGoingTime: null,
  completedTime: null,
  attendanceId: 1,
  treatmentAttendanceIds: [1],
  patientId: 1,
  ...overrides,
});

/**
 * Factory function to create mock AttendanceStatusDetailWithType objects
 */
export const createMockAttendanceStatusDetailWithType = (
  attendanceType: AttendanceType = "assessment",
  overrides: Partial<AttendanceStatusDetail> = {}
): IAttendanceStatusDetailWithType => ({
  ...createMockAttendanceStatusDetail(overrides),
  attendanceType,
});

/**
 * Factory function to create mock GroupedPatient objects
 */
export const createMockGroupedPatient = (
  overrides: Partial<IGroupedPatient> = {}
): IGroupedPatient => ({
  ...createMockAttendanceStatusDetail(),
  originalType: "physiotherapy" as AttendanceType,
  treatmentTypes: ["physiotherapy"] as AttendanceType[],
  combinedType: "physiotherapy" as const,
  attendanceIds: [1], // Required field for IGroupedPatient
  ...overrides,
});

/**
 * Factory function to create mock AttendanceByDate objects
 */
export const createMockAttendancesByDate = (
  overrides: Partial<AttendanceByDate> = {}
): AttendanceByDate => ({
  date: "2024-01-15", // YYYY-MM-DD string format
  assessment: {
    scheduled: [],
    checkedIn: [],
    onGoing: [],
    completed: [],
  },
  physiotherapy: {
    scheduled: [],
    checkedIn: [],
    onGoing: [],
    completed: [],
  },
  tens: {
    scheduled: [],
    checkedIn: [],
    onGoing: [],
    completed: [],
  },
  combined: {
    scheduled: [],
    checkedIn: [],
    onGoing: [],
    completed: [],
  },
  ...overrides,
});

/**
 * Create sample attendance data with various statuses
 */
export const createSampleAttendanceData = (): AttendanceByDate => {
  const johnDoe = createMockAttendanceStatusDetail({
    name: "John Doe",
    patientId: 1,
    attendanceId: 1,
    priority: "3", // normal
  });

  const janeMith = createMockAttendanceStatusDetail({
    name: "Jane Smith",
    patientId: 2,
    attendanceId: 2,
    priority: "1", // emergency
    checkedInTime: "2024-01-15T10:00:00Z",
  });

  const bobJohnson = createMockAttendanceStatusDetail({
    name: "Bob Johnson",
    patientId: 3,
    attendanceId: 3,
    priority: "2", // intermediate
    onGoingTime: "2024-01-15T11:00:00Z",
  });

  const aliceWilson = createMockAttendanceStatusDetail({
    name: "Alice Wilson",
    patientId: 4,
    attendanceId: 4,
    priority: "3", // normal
    completedTime: "2024-01-15T12:00:00Z",
  });

  return createMockAttendancesByDate({
    assessment: {
      scheduled: [johnDoe],
      checkedIn: [janeMith],
      onGoing: [bobJohnson],
      completed: [aliceWilson],
    },
    physiotherapy: {
      scheduled: [
        createMockAttendanceStatusDetail({
          name: "Physiotherapy Scheduled",
          patientId: 5,
          attendanceId: 5,
        }),
      ],
      checkedIn: [
        createMockAttendanceStatusDetail({
          name: "Physiotherapy Checked In",
          patientId: 6,
          attendanceId: 6,
          checkedInTime: "2024-01-15T09:30:00Z",
        }),
      ],
      onGoing: [
        createMockAttendanceStatusDetail({
          name: "Physiotherapy Ongoing",
          patientId: 7,
          attendanceId: 7,
          onGoingTime: "2024-01-15T10:30:00Z",
        }),
      ],
      completed: [
        createMockAttendanceStatusDetail({
          name: "Physiotherapy Completed",
          patientId: 8,
          attendanceId: 8,
          completedTime: "2024-01-15T11:30:00Z",
        }),
      ],
    },
    tens: {
      scheduled: [
        createMockAttendanceStatusDetail({
          name: "TENS Scheduled",
          patientId: 9,
          attendanceId: 9,
        }),
      ],
      checkedIn: [
        createMockAttendanceStatusDetail({
          name: "TENS Checked In",
          patientId: 10,
          attendanceId: 10,
          checkedInTime: "2024-01-15T09:45:00Z",
        }),
      ],
      onGoing: [
        createMockAttendanceStatusDetail({
          name: "TENS Ongoing",
          patientId: 11,
          attendanceId: 11,
          onGoingTime: "2024-01-15T10:45:00Z",
        }),
      ],
      completed: [
        createMockAttendanceStatusDetail({
          name: "TENS Completed",
          patientId: 12,
          attendanceId: 12,
          completedTime: "2024-01-15T11:45:00Z",
        }),
      ],
    },
  });
};

/**
 * Create empty attendance data for testing edge cases
 */
export const createEmptyAttendanceData = (): AttendanceByDate => {
  return createMockAttendancesByDate();
};

/**
 * Create attendance data for patient grouping tests
 */
export const createGroupingTestData = () => {
  const physiotherapyPatients = [
    createMockAttendanceStatusDetail({
      name: "Patient One",
      patientId: 1,
      attendanceId: 1,
    }),
    createMockAttendanceStatusDetail({
      name: "Patient Two",
      patientId: 2,
      attendanceId: 2,
    }),
    createMockAttendanceStatusDetail({
      name: "Patient Three",
      patientId: 3,
      attendanceId: 3,
    }),
  ];

  const tensPatients = [
    createMockAttendanceStatusDetail({
      name: "Patient One", // Same patient as physiotherapy - should combine
      patientId: 1,
      attendanceId: 4,
    }),
    createMockAttendanceStatusDetail({
      name: "Patient Four",
      patientId: 4,
      attendanceId: 5,
    }),
  ];

  return { physiotherapyPatients, tensPatients };
};