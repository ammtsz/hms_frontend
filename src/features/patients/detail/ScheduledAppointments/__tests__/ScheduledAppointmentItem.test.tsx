import React from "react";
import { render, screen } from "@/utils/testUtils";
import { ScheduledAppointmentItem } from "../ScheduledAppointmentItem";
import { GroupedScheduledAppointment } from "@/utils/appointmentHistoryUtils";

// Mock date helpers to control "days until" calculations
jest.mock("@/utils/dateUtils", () => ({
  ...jest.requireActual("@/utils/dateUtils"),
  getDaysUntil: jest.fn((date: string) => {
    // Return different values based on test dates
    if (date === "2026-02-18") return 0; // today
    if (date === "2026-02-19") return 1; // tomorrow
    if (date === "2026-02-25") return 7; // in 7 days
    if (date === "2026-03-05") return 15; // in 15 days
    return 0;
  }),
  formatDisplayDate: jest.fn((date: string) => {
    const [year, month, day] = date.split("-");
    return `${month}/${day}/${year}`;
  }),
}));

describe("ScheduledAppointmentItem", () => {
  const baseAppointment: GroupedScheduledAppointment = {
    date: "2026-02-25",
    appointmentId: "1",
    appointmentIds: ["1"],
    status: "scheduled",
    treatments: {},
    createdDate: "2026-02-01",
    updatedDate: "2026-02-01",
  };

  it("should render scheduled date with days until text", () => {
    render(
      <ScheduledAppointmentItem
        groupedScheduled={baseAppointment}
        isFirstItem={false}
      />,
    );

    expect(screen.getByText("02/25/2026")).toBeInTheDocument();
    expect(screen.getByText("(in 7 days)")).toBeInTheDocument();
  });

  it("should display '(today)' for today's appointment", () => {
    const todayAppointment = {
      ...baseAppointment,
      date: "2026-02-18",
    };

    render(
      <ScheduledAppointmentItem
        groupedScheduled={todayAppointment}
        isFirstItem={false}
      />,
    );

    expect(screen.getByText("(today)")).toBeInTheDocument();
  });

  it("should display 'tomorrow' for tomorrow's appointment", () => {
    const tomorrowAppointment = {
      ...baseAppointment,
      date: "2026-02-19",
    };

    render(
      <ScheduledAppointmentItem
        groupedScheduled={tomorrowAppointment}
        isFirstItem={false}
      />,
    );

    expect(screen.getByText("(tomorrow)")).toBeInTheDocument();
  });

  it("should show 'Next' badge for first item when not cancelled", () => {
    render(
      <ScheduledAppointmentItem
        groupedScheduled={baseAppointment}
        isFirstItem={true}
      />,
    );

    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("should show 'Coming soon' badge for upcoming appointments", () => {
    render(
      <ScheduledAppointmentItem
        groupedScheduled={baseAppointment}
        isFirstItem={false}
      />,
    );

    expect(screen.getByText("Soon")).toBeInTheDocument();
  });

  it("should not show 'Coming soon' for appointments beyond 7 days", () => {
    const futureAppointment = {
      ...baseAppointment,
      date: "2026-03-05", // 15 days away
    };

    render(
      <ScheduledAppointmentItem
        groupedScheduled={futureAppointment}
        isFirstItem={false}
      />,
    );

    expect(screen.queryByText("Soon")).not.toBeInTheDocument();
  });

  it("should display assessment consultation treatment", () => {
    const assessmentAppointment = {
      ...baseAppointment,
      treatments: {
        assessment: {
          isScheduled: true,
          notes: "Return for assessment",
        },
      },
    };

    render(
      <ScheduledAppointmentItem
        groupedScheduled={assessmentAppointment}
        isFirstItem={false}
      />,
    );

    expect(
      screen.getAllByText(/Assessment Consultation/)[0],
    ).toBeInTheDocument();
    expect(screen.getByText("Return for assessment")).toBeInTheDocument();
  });

  it("should display physiotherapy treatment", () => {
    const physiotherapyAppointment = {
      ...baseAppointment,
      treatments: {
        physiotherapy: {
          bodyLocations: ["Head", "Chest"],
          durationMinutes: 45,
          sessionNumber: "2/5",
          notes: undefined,
        },
      },
    };

    render(
      <ScheduledAppointmentItem
        groupedScheduled={physiotherapyAppointment}
        isFirstItem={false}
      />,
    );

    expect(screen.getAllByText(/Physiotherapy/)[0]).toBeInTheDocument();
    expect(screen.getByText(/Head, Chest/)).toBeInTheDocument();
    expect(screen.getByText(/45 min/)).toBeInTheDocument();
  });

  it("should display tens treatment", () => {
    const tensAppointment = {
      ...baseAppointment,
      treatments: {
        tens: {
          bodyLocations: ["Right Foot"],
          sessionNumber: "3/5",
          notes: undefined,
        },
      },
    };

    render(
      <ScheduledAppointmentItem
        groupedScheduled={tensAppointment}
        isFirstItem={false}
      />,
    );

    expect(screen.getAllByText(/TENS/)[0]).toBeInTheDocument();
    expect(screen.getByText(/Right Foot/)).toBeInTheDocument();
  });

  it("should display cancelled appointment with orange styling", () => {
    const cancelledAppointment = {
      ...baseAppointment,
      status: "cancelled" as const,
      absenceNotes: "Patient requested cancellation",
    };

    render(
      <ScheduledAppointmentItem
        groupedScheduled={cancelledAppointment}
        isFirstItem={false}
      />,
    );

    expect(screen.getByText("(CANCELLED)")).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    expect(
      screen.getByText("Patient requested cancellation"),
    ).toBeInTheDocument();
  });

  it("should not show 'Next' badge for cancelled appointments", () => {
    const cancelledAppointment = {
      ...baseAppointment,
      status: "cancelled" as const,
    };

    render(
      <ScheduledAppointmentItem
        groupedScheduled={cancelledAppointment}
        isFirstItem={true}
      />,
    );

    expect(screen.queryByText("Next")).not.toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });

  it("should display appointment metadata", () => {
    render(
      <ScheduledAppointmentItem
        groupedScheduled={baseAppointment}
        isFirstItem={false}
      />,
    );

    expect(screen.getByText(/Created on:/)).toBeInTheDocument();
    expect(screen.getByText("02/01/2026")).toBeInTheDocument();
  });

  it("should display cancelled date in metadata when present", () => {
    const cancelledAppointment = {
      ...baseAppointment,
      status: "cancelled" as const,
      cancelledDate: "2026-02-10",
    };

    render(
      <ScheduledAppointmentItem
        groupedScheduled={cancelledAppointment}
        isFirstItem={false}
      />,
    );

    expect(screen.getByText(/Cancelled on:/)).toBeInTheDocument();
    expect(screen.getByText("02/10/2026")).toBeInTheDocument();
  });

  it("should handle multiple treatments together", () => {
    const multiTreatmentAppointment = {
      ...baseAppointment,
      treatments: {
        physiotherapy: {
          bodyLocations: ["Head"],
          durationMinutes: 45,
          sessionNumber: "1/3",
          notes: undefined,
        },
        tens: {
          bodyLocations: ["Foot"],
          sessionNumber: "2/4",
          notes: undefined,
        },
      },
    };

    render(
      <ScheduledAppointmentItem
        groupedScheduled={multiTreatmentAppointment}
        isFirstItem={false}
      />,
    );

    expect(screen.getAllByText(/Physiotherapy/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/TENS/)[0]).toBeInTheDocument();
    expect(screen.getByText(/Head/)).toBeInTheDocument();
    expect(screen.getByText(/Foot/)).toBeInTheDocument();
  });

  describe("Reschedule button visibility (patientTreatmentStatus)", () => {
    const cancelledWithPhysiotherapy = {
      ...baseAppointment,
      status: "cancelled" as const,
      treatments: {
        physiotherapy: {
          bodyLocations: ["Head"],
          durationMinutes: 45,
          sessionNumber: "1/3",
          notes: undefined,
        },
      },
    };

    it("should show Reschedule button when patient is in treatment (T)", () => {
      render(
        <ScheduledAppointmentItem
          groupedScheduled={cancelledWithPhysiotherapy}
          isFirstItem={false}
          patientTreatmentStatus="T"
        />,
      );

      expect(
        screen.getByRole("button", { name: /ReSchedule Appointment/i }),
      ).toBeInTheDocument();
    });

    it("should not show Reschedule button when patient is discharged (D)", () => {
      render(
        <ScheduledAppointmentItem
          groupedScheduled={cancelledWithPhysiotherapy}
          isFirstItem={false}
          patientTreatmentStatus="D"
        />,
      );

      expect(
        screen.queryByRole("button", { name: /ReSchedule Appointment/i }),
      ).not.toBeInTheDocument();
    });

    it("should not show Reschedule button when patient has consecutive no-shows (C)", () => {
      render(
        <ScheduledAppointmentItem
          groupedScheduled={cancelledWithPhysiotherapy}
          isFirstItem={false}
          patientTreatmentStatus="C"
        />,
      );

      expect(
        screen.queryByRole("button", { name: /ReSchedule Appointment/i }),
      ).not.toBeInTheDocument();
    });

    it("should not show Reschedule button when patientTreatmentStatus is undefined", () => {
      render(
        <ScheduledAppointmentItem
          groupedScheduled={cancelledWithPhysiotherapy}
          isFirstItem={false}
        />,
      );

      expect(
        screen.queryByRole("button", { name: /ReSchedule Appointment/i }),
      ).not.toBeInTheDocument();
    });
  });
});
