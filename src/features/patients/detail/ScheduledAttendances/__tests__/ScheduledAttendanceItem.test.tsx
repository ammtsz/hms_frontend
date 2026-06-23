import React from "react";
import { render, screen } from "@/utils/testUtils";
import { ScheduledAttendanceItem } from "../ScheduledAttendanceItem";
import { GroupedScheduledAttendance } from "@/utils/attendanceHistoryUtils";

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

describe("ScheduledAttendanceItem", () => {
  const baseAttendance: GroupedScheduledAttendance = {
    date: "2026-02-25",
    attendanceId: "1",
    attendanceIds: ["1"],
    status: "scheduled",
    treatments: {},
    createdDate: "2026-02-01",
    updatedDate: "2026-02-01",
  };

  it("should render scheduled date with days until text", () => {
    render(
      <ScheduledAttendanceItem
        groupedScheduled={baseAttendance}
        isFirstItem={false}
      />,
    );

    expect(screen.getByText("02/25/2026")).toBeInTheDocument();
    expect(screen.getByText("(in 7 days)")).toBeInTheDocument();
  });

  it("should display '(today)' for today's appointment", () => {
    const todayAttendance = {
      ...baseAttendance,
      date: "2026-02-18",
    };

    render(
      <ScheduledAttendanceItem
        groupedScheduled={todayAttendance}
        isFirstItem={false}
      />,
    );

    expect(screen.getByText("(today)")).toBeInTheDocument();
  });

  it("should display 'tomorrow' for tomorrow's appointment", () => {
    const tomorrowAttendance = {
      ...baseAttendance,
      date: "2026-02-19",
    };

    render(
      <ScheduledAttendanceItem
        groupedScheduled={tomorrowAttendance}
        isFirstItem={false}
      />,
    );

    expect(screen.getByText("(tomorrow)")).toBeInTheDocument();
  });

  it("should show 'Next' badge for first item when not cancelled", () => {
    render(
      <ScheduledAttendanceItem
        groupedScheduled={baseAttendance}
        isFirstItem={true}
      />,
    );

    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("should show 'Coming soon' badge for upcoming appointments", () => {
    render(
      <ScheduledAttendanceItem
        groupedScheduled={baseAttendance}
        isFirstItem={false}
      />,
    );

    expect(screen.getByText("Soon")).toBeInTheDocument();
  });

  it("should not show 'Coming soon' for appointments beyond 7 days", () => {
    const futureAttendance = {
      ...baseAttendance,
      date: "2026-03-05", // 15 days away
    };

    render(
      <ScheduledAttendanceItem
        groupedScheduled={futureAttendance}
        isFirstItem={false}
      />,
    );

    expect(screen.queryByText("Soon")).not.toBeInTheDocument();
  });

  it("should display assessment consultation treatment", () => {
    const assessmentAttendance = {
      ...baseAttendance,
      treatments: {
        assessment: {
          isScheduled: true,
          notes: "Return for assessment",
        },
      },
    };

    render(
      <ScheduledAttendanceItem
        groupedScheduled={assessmentAttendance}
        isFirstItem={false}
      />,
    );

    expect(
      screen.getAllByText(/Assessment Consultation/)[0],
    ).toBeInTheDocument();
    expect(screen.getByText("Return for assessment")).toBeInTheDocument();
  });

  it("should display physiotherapy treatment", () => {
    const physiotherapyAttendance = {
      ...baseAttendance,
      treatments: {
        physiotherapy: {
          bodyLocationsWithColors: [
            { bodyLocation: "Head", color: "Blue" },
            { bodyLocation: "Chest", color: "Blue" },
          ],
          color: "Blue",
          duration: 15,
          sessionNumber: "2/5",
          notes: undefined,
        },
      },
    };

    render(
      <ScheduledAttendanceItem
        groupedScheduled={physiotherapyAttendance}
        isFirstItem={false}
      />,
    );

    expect(screen.getAllByText(/Physiotherapy/)[0]).toBeInTheDocument();
    expect(screen.getByText(/Head, Chest/)).toBeInTheDocument();
    expect(screen.getByText("Blue")).toBeInTheDocument();
  });

  it("should display tens treatment", () => {
    const tensAttendance = {
      ...baseAttendance,
      treatments: {
        tens: {
          bodyLocations: ["Right Foot"],
          sessionNumber: "3/5",
          notes: undefined,
        },
      },
    };

    render(
      <ScheduledAttendanceItem
        groupedScheduled={tensAttendance}
        isFirstItem={false}
      />,
    );

    expect(screen.getAllByText(/TENS/)[0]).toBeInTheDocument();
    expect(screen.getByText(/Right Foot/)).toBeInTheDocument();
  });

  it("should display cancelled appointment with orange styling", () => {
    const cancelledAttendance = {
      ...baseAttendance,
      status: "cancelled" as const,
      absenceNotes: "Patient requested cancellation",
    };

    render(
      <ScheduledAttendanceItem
        groupedScheduled={cancelledAttendance}
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
    const cancelledAttendance = {
      ...baseAttendance,
      status: "cancelled" as const,
    };

    render(
      <ScheduledAttendanceItem
        groupedScheduled={cancelledAttendance}
        isFirstItem={true}
      />,
    );

    expect(screen.queryByText("Next")).not.toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });

  it("should display attendance metadata", () => {
    render(
      <ScheduledAttendanceItem
        groupedScheduled={baseAttendance}
        isFirstItem={false}
      />,
    );

    expect(screen.getByText(/Created on:/)).toBeInTheDocument();
    expect(screen.getByText("02/01/2026")).toBeInTheDocument();
  });

  it("should display cancelled date in metadata when present", () => {
    const cancelledAttendance = {
      ...baseAttendance,
      status: "cancelled" as const,
      cancelledDate: "2026-02-10",
    };

    render(
      <ScheduledAttendanceItem
        groupedScheduled={cancelledAttendance}
        isFirstItem={false}
      />,
    );

    expect(screen.getByText(/Cancelled on:/)).toBeInTheDocument();
    expect(screen.getByText("02/10/2026")).toBeInTheDocument();
  });

  it("should handle multiple treatments together", () => {
    const multiTreatmentAttendance = {
      ...baseAttendance,
      treatments: {
        physiotherapy: {
          bodyLocationsWithColors: [{ bodyLocation: "Head", color: "Blue" }],
          color: "Blue",
          duration: 10,
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
      <ScheduledAttendanceItem
        groupedScheduled={multiTreatmentAttendance}
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
      ...baseAttendance,
      status: "cancelled" as const,
      treatments: {
        physiotherapy: {
          bodyLocationsWithColors: [{ bodyLocation: "Head", color: "Blue" }],
          color: "Blue",
          duration: 15,
          sessionNumber: "1/3",
          notes: undefined,
        },
      },
    };

    it("should show Reschedule button when patient is in treatment (T)", () => {
      render(
        <ScheduledAttendanceItem
          groupedScheduled={cancelledWithPhysiotherapy}
          isFirstItem={false}
          patientTreatmentStatus="T"
        />,
      );

      expect(
        screen.getByRole("button", { name: /ReSchedule Attendance/i }),
      ).toBeInTheDocument();
    });

    it("should not show Reschedule button when patient is discharged (D)", () => {
      render(
        <ScheduledAttendanceItem
          groupedScheduled={cancelledWithPhysiotherapy}
          isFirstItem={false}
          patientTreatmentStatus="D"
        />,
      );

      expect(
        screen.queryByRole("button", { name: /ReSchedule Attendance/i }),
      ).not.toBeInTheDocument();
    });

    it("should not show Reschedule button when patient has consecutive no-shows (C)", () => {
      render(
        <ScheduledAttendanceItem
          groupedScheduled={cancelledWithPhysiotherapy}
          isFirstItem={false}
          patientTreatmentStatus="C"
        />,
      );

      expect(
        screen.queryByRole("button", { name: /ReSchedule Attendance/i }),
      ).not.toBeInTheDocument();
    });

    it("should not show Reschedule button when patientTreatmentStatus is undefined", () => {
      render(
        <ScheduledAttendanceItem
          groupedScheduled={cancelledWithPhysiotherapy}
          isFirstItem={false}
        />,
      );

      expect(
        screen.queryByRole("button", { name: /ReSchedule Attendance/i }),
      ).not.toBeInTheDocument();
    });
  });
});
