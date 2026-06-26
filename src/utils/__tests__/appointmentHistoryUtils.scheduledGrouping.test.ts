import { groupScheduledAppointmentsByDate } from "../appointmentHistoryUtils";
import type { TreatmentResponseDto } from "@/api/types";

jest.mock("@/utils/timezoneDate", () => ({
  getTodayClinic: () => "2026-02-20",
}));

describe("groupScheduledAppointmentsByDate - Multiple Appointments Same Date", () => {
  const futureDate = "2026-03-15"; // Future date for scheduled appointments

  it("should merge assessment and treatment appointments on the same date", () => {
    // Simulate a assessment consultation and treatment sessions on the same date
    const scheduledAppointments = [
      {
        date: futureDate,
        type: "assessment" as const,
        parentAppointmentId: undefined,
        status: "scheduled" as const,
        notes: "Follow-up consultation",
        createdDate: "2026-02-20",
        updatedDate: "2026-02-20",
      },
      {
        date: futureDate,
        type: "physiotherapy" as const, // This appointment exists for the treatment session
        parentAppointmentId: undefined,
        status: "scheduled" as const,
        notes: "",
        createdDate: "2026-02-20",
        updatedDate: "2026-02-20",
      },
    ];

    const treatments: TreatmentResponseDto[] = [
      {
        id: 1,
        consultationId: 1,
        appointmentId: 100,
        treatmentType: "physiotherapy",
        bodyLocation: "Head",
        startDate: "2026-02-20",
        durationMinutes: 45,
        plannedSessions: 5,
        completedSessions: 0,
        status: "scheduled",
        notes: "Treatment notes",
        patientId: 1,
        createdDate: "2026-02-20",
        createdTime: "10:00:00",
        updatedDate: "2026-02-20",
        updatedTime: "10:00:00",
        sessions: [
          {
            id: 1,
            treatmentId: 1,
            sessionNumber: 1,
            scheduledDate: futureDate,
            status: "scheduled",
            createdDate: "2026-02-20",
            createdTime: "10:00:00",
            updatedDate: "2026-02-20",
            updatedTime: "10:00:00",
          },
        ],
      },
    ];

    const result = groupScheduledAppointmentsByDate(
      scheduledAppointments,
      treatments,
    );

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe(futureDate);

    // Should have BOTH assessment and physiotherapy treatments
    expect(result[0].treatments.assessment).toBeDefined();
    expect(result[0].treatments.assessment?.isScheduled).toBe(true);
    expect(result[0].treatments.assessment?.notes).toBe(
      "Follow-up consultation",
    );

    expect(result[0].treatments.physiotherapy).toBeDefined();
    expect(result[0].treatments.physiotherapy?.bodyLocations).toEqual(["Head"]);
    expect(result[0].treatments.physiotherapy?.durationMinutes).toBe(45);
    expect(result[0].treatments.physiotherapy?.sessionNumber).toBe("1/5");
  });

  it("should merge assessment, physiotherapy and tens appointments on the same date", () => {
    const scheduledAppointments = [
      {
        date: futureDate,
        type: "assessment" as const,
        status: "scheduled" as const,
        notes: "Assessment consultation",
        createdDate: "2026-02-20",
        updatedDate: "2026-02-20",
      },
      {
        date: futureDate,
        type: "physiotherapy" as const,
        status: "scheduled" as const,
        notes: "",
        createdDate: "2026-02-20",
        updatedDate: "2026-02-20",
      },
      {
        date: futureDate,
        type: "tens" as const,
        status: "scheduled" as const,
        notes: "",
        createdDate: "2026-02-20",
        updatedDate: "2026-02-20",
      },
    ];

    const treatments: TreatmentResponseDto[] = [
      {
        id: 1,
        consultationId: 1,
        appointmentId: 100,
        treatmentType: "physiotherapy",
        bodyLocation: "Left Arm",
        startDate: "2026-02-20",
        durationMinutes: 45,
        plannedSessions: 3,
        completedSessions: 0,
        status: "scheduled",
        notes: "",
        patientId: 1,
        createdDate: "2026-02-20",
        createdTime: "10:00:00",
        updatedDate: "2026-02-20",
        updatedTime: "10:00:00",
        sessions: [
          {
            id: 1,
            treatmentId: 1,
            sessionNumber: 1,
            scheduledDate: futureDate,
            status: "scheduled",
            createdDate: "2026-02-20",
            createdTime: "10:00:00",
            updatedDate: "2026-02-20",
            updatedTime: "10:00:00",
          },
        ],
      },
      {
        id: 2,
        consultationId: 1,
        appointmentId: 101,
        treatmentType: "tens",
        bodyLocation: "Right Leg",
        startDate: "2026-02-20",
        durationMinutes: 30,
        plannedSessions: 7,
        completedSessions: 0,
        status: "scheduled",
        notes: "TENS treatment",
        patientId: 1,
        createdDate: "2026-02-20",
        createdTime: "10:00:00",
        updatedDate: "2026-02-20",
        updatedTime: "10:00:00",
        sessions: [
          {
            id: 2,
            treatmentId: 2,
            sessionNumber: 1,
            scheduledDate: futureDate,
            status: "scheduled",
            createdDate: "2026-02-20",
            createdTime: "10:00:00",
            updatedDate: "2026-02-20",
            updatedTime: "10:00:00",
          },
        ],
      },
    ];

    const result = groupScheduledAppointmentsByDate(
      scheduledAppointments,
      treatments,
    );

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe(futureDate);

    // Should have ALL THREE treatment types
    expect(result[0].treatments.assessment).toBeDefined();
    expect(result[0].treatments.physiotherapy).toBeDefined();
    expect(result[0].treatments.tens).toBeDefined();

    expect(result[0].treatments.physiotherapy?.bodyLocations).toEqual(
      ["Left Arm"],
    );
    expect(result[0].treatments.tens?.bodyLocations).toEqual(["Right Leg"]);
  });

  it("should handle multiple body locations for same treatment type on same date", () => {
    const scheduledAppointments = [
      {
        date: futureDate,
        type: "physiotherapy" as const,
        status: "scheduled" as const,
        notes: "",
        createdDate: "2026-02-20",
        updatedDate: "2026-02-20",
      },
    ];

    const treatments: TreatmentResponseDto[] = [
      {
        id: 1,
        consultationId: 1,
        appointmentId: 100,
        treatmentType: "physiotherapy",
        bodyLocation: "Head",
        startDate: "2026-02-20",
        durationMinutes: 45,
        plannedSessions: 5,
        completedSessions: 1,
        status: "in_progress",
        notes: "",
        patientId: 1,
        createdDate: "2026-02-20",
        createdTime: "10:00:00",
        updatedDate: "2026-02-20",
        updatedTime: "10:00:00",
        sessions: [
          {
            id: 1,
            treatmentId: 1,
            sessionNumber: 2,
            scheduledDate: futureDate,
            status: "scheduled",
            createdDate: "2026-02-20",
            createdTime: "10:00:00",
            updatedDate: "2026-02-20",
            updatedTime: "10:00:00",
          },
        ],
      },
      {
        id: 2,
        consultationId: 1,
        appointmentId: 101,
        treatmentType: "physiotherapy",
        bodyLocation: "Right Arm",
        startDate: "2026-02-20",
        durationMinutes: 45,
        plannedSessions: 5,
        completedSessions: 1,
        status: "in_progress",
        notes: "",
        patientId: 1,
        createdDate: "2026-02-20",
        createdTime: "10:00:00",
        updatedDate: "2026-02-20",
        updatedTime: "10:00:00",
        sessions: [
          {
            id: 2,
            treatmentId: 2,
            sessionNumber: 2,
            scheduledDate: futureDate,
            status: "scheduled",
            createdDate: "2026-02-20",
            createdTime: "10:00:00",
            updatedDate: "2026-02-20",
            updatedTime: "10:00:00",
          },
        ],
      },
    ];

    const result = groupScheduledAppointmentsByDate(
      scheduledAppointments,
      treatments,
    );

    expect(result).toHaveLength(1);
    expect(result[0].treatments.physiotherapy).toBeDefined();
    expect(
      result[0].treatments.physiotherapy?.bodyLocations,
    ).toHaveLength(2);
    const lbLocs = result[0].treatments.physiotherapy?.bodyLocations ?? [];
    expect(lbLocs).toContain("Head");
    expect(lbLocs).toContain("Right Arm");
    expect(result[0].treatments.physiotherapy?.sessionNumber).toBe("2/5"); // Same session number
  });

  it("should preserve parentAppointmentId when merging appointments", () => {
    const scheduledAppointments = [
      {
        date: futureDate,
        type: "assessment" as const,
        parentAppointmentId: 50, // This is a follow-up
        status: "scheduled" as const,
        notes: "Follow-up",
        createdDate: "2026-02-20",
        updatedDate: "2026-02-20",
      },
      {
        date: futureDate,
        type: "physiotherapy" as const,
        parentAppointmentId: undefined, // Treatment has no parent
        status: "scheduled" as const,
        notes: "",
        createdDate: "2026-02-20",
        updatedDate: "2026-02-20",
      },
    ];

    const treatments: TreatmentResponseDto[] = [];

    const result = groupScheduledAppointmentsByDate(
      scheduledAppointments,
      treatments,
    );

    expect(result).toHaveLength(1);
    expect(result[0].parentAppointmentId).toBe(50); // Should preserve the parent link
  });

  it("should keep most recent status when merging multiple appointments", () => {
    const scheduledAppointments = [
      {
        date: futureDate,
        type: "assessment" as const,
        status: "scheduled" as const,
        notes: "First",
        createdDate: "2026-02-19",
        updatedDate: "2026-02-19",
      },
      {
        date: futureDate,
        type: "physiotherapy" as const,
        status: "checked_in" as const, // More recent and checked in
        notes: "Second",
        createdDate: "2026-02-20",
        updatedDate: "2026-02-20",
      },
    ];

    const treatments: TreatmentResponseDto[] = [];

    const result = groupScheduledAppointmentsByDate(
      scheduledAppointments,
      treatments,
    );

    // With date+status key, same date with different statuses yield separate entries
    expect(result).toHaveLength(2);
    const checkedInEntry = result.find((a) => a.status === "checked_in");
    expect(checkedInEntry).toBeDefined();
    expect(checkedInEntry?.status).toBe("checked_in");
  });

  it("should only show today's appointments with scheduled status", () => {
    const today = "2026-02-20"; // Current date

    const scheduledAppointments = [
      {
        date: today,
        type: "assessment" as const,
        status: "scheduled" as const,
        notes: "Scheduled for today",
        createdDate: "2026-02-19",
        updatedDate: "2026-02-19",
      },
      {
        date: today,
        type: "physiotherapy" as const,
        status: "cancelled" as const, // Cancelled - should be filtered out
        notes: "",
        createdDate: "2026-02-20",
        updatedDate: "2026-02-20",
      },
    ];

    const treatments: TreatmentResponseDto[] = [];

    const result = groupScheduledAppointmentsByDate(
      scheduledAppointments,
      treatments,
    );

    // With date+status key: scheduled and cancelled are separate entries; filter keeps only scheduled for today
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("scheduled");
  });

  it("should correctly group multiple sessions on different dates for same treatment", () => {
    // Simulates the issue: a treatment with session 1/2 on 2026-02-27 and session 2/2 on 2026-03-06
    const scheduledAppointments = [
      {
        date: "2026-02-27",
        type: "physiotherapy" as const,
        parentAppointmentId: 37,
        status: "scheduled" as const,
        notes: "",
        createdDate: "2026-02-20",
        updatedDate: "2026-02-20",
      },
      {
        date: "2026-03-06",
        type: "physiotherapy" as const,
        parentAppointmentId: 37,
        status: "scheduled" as const,
        notes: "",
        createdDate: "2026-02-20",
        updatedDate: "2026-02-20",
      },
    ];

    const treatments: TreatmentResponseDto[] = [
      {
        id: 1,
        consultationId: 1,
        appointmentId: 37,
        treatmentType: "physiotherapy",
        bodyLocation: "Abdomen",
        startDate: "2026-02-20",
        durationMinutes: 45,
        plannedSessions: 2,
        completedSessions: 0,
        status: "scheduled",
        notes: "Physiotherapy - Abdomen - 45 min",
        patientId: 1,
        createdDate: "2026-02-20",
        createdTime: "10:00:00",
        updatedDate: "2026-02-20",
        updatedTime: "10:00:00",
        sessions: [
          {
            id: 1,
            treatmentId: 1,
            sessionNumber: 1,
            scheduledDate: "2026-02-27T10:00:00Z", // First session
            status: "scheduled",
            notes: "",
            createdDate: "2026-02-20",
            createdTime: "10:00:00",
            updatedDate: "2026-02-20",
            updatedTime: "10:00:00",
          },
          {
            id: 2,
            treatmentId: 1,
            sessionNumber: 2,
            scheduledDate: "2026-03-06T10:00:00Z", // Second session
            status: "scheduled",
            notes: "",
            createdDate: "2026-02-20",
            createdTime: "10:00:00",
            updatedDate: "2026-02-20",
            updatedTime: "10:00:00",
          },
        ],
      },
    ];

    const result = groupScheduledAppointmentsByDate(
      scheduledAppointments,
      treatments,
    );

    // Should have 2 grouped appointments, one for each date
    expect(result).toHaveLength(2);

    // First date (2026-02-27) should have session 1/2
    const firstDate = result.find((a) => a.date === "2026-02-27");
    expect(firstDate).toBeDefined();
    expect(firstDate?.treatments.physiotherapy).toBeDefined();
    expect(firstDate?.treatments.physiotherapy?.sessionNumber).toBe("1/2");
    expect(
      firstDate?.treatments.physiotherapy?.bodyLocations,
    ).toEqual(["Abdomen"]);

    // Second date (2026-03-06) should have session 2/2
    const secondDate = result.find((a) => a.date === "2026-03-06");
    expect(secondDate).toBeDefined();
    expect(secondDate?.treatments.physiotherapy).toBeDefined();
    expect(secondDate?.treatments.physiotherapy?.sessionNumber).toBe("2/2");
    expect(
      secondDate?.treatments.physiotherapy?.bodyLocations,
    ).toEqual(["Abdomen"]);
  });
});
