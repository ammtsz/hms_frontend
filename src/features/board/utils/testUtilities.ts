import type { AppointmentStatusDetail, AppointmentByDate, AppointmentType, Priority } from "@/types/types";
import type { IAppointmentStatusDetailWithType } from "./appointmentDataUtils";
import type { IGroupedPatient } from "./patientGrouping";

/**
 * Factory function to create mock AppointmentStatusDetail objects
 */
export const createMockAppointmentStatusDetail = (
  overrides: Partial<AppointmentStatusDetail> = {}
): AppointmentStatusDetail => ({
  name: "John Doe",
  priority: "3" as Priority, // normal priority is "3"
  checkedInTime: null,
  onGoingTime: null,
  completedTime: null,
  appointmentId: 1,
  treatmentAppointmentIds: [1],
  patientId: 1,
  ...overrides,
});

/**
 * Factory function to create mock AppointmentStatusDetailWithType objects
 */
export const createMockAppointmentStatusDetailWithType = (
  appointmentType: AppointmentType = "assessment",
  overrides: Partial<AppointmentStatusDetail> = {}
): IAppointmentStatusDetailWithType => ({
  ...createMockAppointmentStatusDetail(overrides),
  appointmentType,
});

/**
 * Factory function to create mock GroupedPatient objects
 */
export const createMockGroupedPatient = (
  overrides: Partial<IGroupedPatient> = {}
): IGroupedPatient => ({
  ...createMockAppointmentStatusDetail(),
  originalType: "physiotherapy" as AppointmentType,
  treatmentTypes: ["physiotherapy"] as AppointmentType[],
  combinedType: "physiotherapy" as const,
  appointmentIds: [1], // Required field for IGroupedPatient
  ...overrides,
});

/**
 * Factory function to create mock AppointmentByDate objects
 */
export const createMockAppointmentsByDate = (
  overrides: Partial<AppointmentByDate> = {}
): AppointmentByDate => ({
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
 * Create sample appointment data with various statuses
 */
export const createSampleAppointmentData = (): AppointmentByDate => {
  const johnDoe = createMockAppointmentStatusDetail({
    name: "John Doe",
    patientId: 1,
    appointmentId: 1,
    priority: "3", // normal
  });

  const janeMith = createMockAppointmentStatusDetail({
    name: "Jane Smith",
    patientId: 2,
    appointmentId: 2,
    priority: "1", // emergency
    checkedInTime: "2024-01-15T10:00:00Z",
  });

  const bobJohnson = createMockAppointmentStatusDetail({
    name: "Bob Johnson",
    patientId: 3,
    appointmentId: 3,
    priority: "2", // intermediate
    onGoingTime: "2024-01-15T11:00:00Z",
  });

  const aliceWilson = createMockAppointmentStatusDetail({
    name: "Alice Wilson",
    patientId: 4,
    appointmentId: 4,
    priority: "3", // normal
    completedTime: "2024-01-15T12:00:00Z",
  });

  return createMockAppointmentsByDate({
    assessment: {
      scheduled: [johnDoe],
      checkedIn: [janeMith],
      onGoing: [bobJohnson],
      completed: [aliceWilson],
    },
    physiotherapy: {
      scheduled: [
        createMockAppointmentStatusDetail({
          name: "Physiotherapy Scheduled",
          patientId: 5,
          appointmentId: 5,
        }),
      ],
      checkedIn: [
        createMockAppointmentStatusDetail({
          name: "Physiotherapy Checked In",
          patientId: 6,
          appointmentId: 6,
          checkedInTime: "2024-01-15T09:30:00Z",
        }),
      ],
      onGoing: [
        createMockAppointmentStatusDetail({
          name: "Physiotherapy Ongoing",
          patientId: 7,
          appointmentId: 7,
          onGoingTime: "2024-01-15T10:30:00Z",
        }),
      ],
      completed: [
        createMockAppointmentStatusDetail({
          name: "Physiotherapy Completed",
          patientId: 8,
          appointmentId: 8,
          completedTime: "2024-01-15T11:30:00Z",
        }),
      ],
    },
    tens: {
      scheduled: [
        createMockAppointmentStatusDetail({
          name: "TENS Scheduled",
          patientId: 9,
          appointmentId: 9,
        }),
      ],
      checkedIn: [
        createMockAppointmentStatusDetail({
          name: "TENS Checked In",
          patientId: 10,
          appointmentId: 10,
          checkedInTime: "2024-01-15T09:45:00Z",
        }),
      ],
      onGoing: [
        createMockAppointmentStatusDetail({
          name: "TENS Ongoing",
          patientId: 11,
          appointmentId: 11,
          onGoingTime: "2024-01-15T10:45:00Z",
        }),
      ],
      completed: [
        createMockAppointmentStatusDetail({
          name: "TENS Completed",
          patientId: 12,
          appointmentId: 12,
          completedTime: "2024-01-15T11:45:00Z",
        }),
      ],
    },
  });
};

/**
 * Create empty appointment data for testing edge cases
 */
export const createEmptyAppointmentData = (): AppointmentByDate => {
  return createMockAppointmentsByDate();
};

/**
 * Create appointment data for patient grouping tests
 */
export const createGroupingTestData = () => {
  const physiotherapyPatients = [
    createMockAppointmentStatusDetail({
      name: "Patient One",
      patientId: 1,
      appointmentId: 1,
    }),
    createMockAppointmentStatusDetail({
      name: "Patient Two",
      patientId: 2,
      appointmentId: 2,
    }),
    createMockAppointmentStatusDetail({
      name: "Patient Three",
      patientId: 3,
      appointmentId: 3,
    }),
  ];

  const tensPatients = [
    createMockAppointmentStatusDetail({
      name: "Patient One", // Same patient as physiotherapy - should combine
      patientId: 1,
      appointmentId: 4,
    }),
    createMockAppointmentStatusDetail({
      name: "Patient Four",
      patientId: 4,
      appointmentId: 5,
    }),
  ];

  return { physiotherapyPatients, tensPatients };
};