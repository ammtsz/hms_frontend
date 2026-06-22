/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render, screen } from "@/utils/testUtils";
import { AttendanceHistoryItem } from "../AttendanceHistoryItem";
import { GroupedAttendance } from "@/utils/attendanceHistoryUtils";
import { ATTENDANCE_HISTORY_STATUS_LABELS } from "@/utils/attendanceStatusLabels";
import { getAttendanceTypeLabel } from "@/utils/apiTransformers";
import { getTreatmentTypeLabel } from "../utils";

// Helper function to create mock attendance with required fields
const createMockAttendance = (
  overrides: Partial<GroupedAttendance>,
): GroupedAttendance => ({
  date: "2026-02-10",
  attendanceId: "1",
  attendanceIds: ["1"],
  notes: "",
  createdDate: "2026-02-10",
  updatedDate: "2026-02-10",
  treatments: {},
  ...overrides,
});

describe("AttendanceHistoryItem", () => {
  const mockTreatments: any[] = [];

  describe("Cancelled Appointments", () => {
    it("displays cancelled appointment with orange styling and Ban icon", () => {
      const cancelledAttendance = createMockAttendance({
        date: "2026-02-10",
        status: "cancelled",
        absenceNotes: "Patient had an unavoidable conflict",
        absenceJustified: true,
        treatments: {
          assessment: {
            notes: "Initial consultation",
          },
        },
      });

      render(
        <AttendanceHistoryItem
          groupedAttendance={cancelledAttendance}
          treatments={mockTreatments}
        />,
      );

      // Check orange background (use getAllByText since date appears multiple times)
      const dateElements = screen.getAllByText("02/10/2026");
      const container = dateElements[0].closest("div.p-4");
      expect(container).toHaveClass("bg-orange-50", "border-orange-300");

      // Check strike-through text
      const allDateElements = screen.getAllByText(/02\/10\/2026/);
      // Find the date element with the strike-through styling (first occurrence)
      const dateElement = allDateElements[0];
      expect(dateElement.closest("div")).toHaveClass(
        "text-gray-500",
        "line-through",
      );

      // Check CANCELLED label
      expect(screen.getByText("(CANCELLED)")).toBeInTheDocument();
      expect(screen.getByText("(CANCELLED)")).toHaveClass("text-orange-600");

      // Check status badge
      expect(
        screen.getByText(ATTENDANCE_HISTORY_STATUS_LABELS.cancelled),
      ).toBeInTheDocument();
      const badge = screen.getByText(
        ATTENDANCE_HISTORY_STATUS_LABELS.cancelled,
      );
      expect(badge).toHaveClass(
        "bg-orange-200",
        "text-orange-900",
        "border-orange-400",
      );

      // Check absence reason box (cancelled status shows "Reason:" even when justified)
      expect(
        screen.getByText("Patient had an unavoidable conflict"),
      ).toBeInTheDocument();
      const reasonBox = screen.getByText("Reason:").closest("div.p-3");
      expect(reasonBox).toHaveClass(
        "bg-orange-100",
        "border-l-4",
        "border-orange-500",
      );
    });

    it("displays cancelled appointment without reason", () => {
      const cancelledAttendance = createMockAttendance({
        date: "2026-02-10",
        status: "cancelled",
        absenceNotes: undefined,
        absenceJustified: false,
        treatments: {
          physiotherapy: {
            bodyLocationsWithColors: [{ bodyLocation: "Head", color: "Blue" }],
            color: "Blue",
            duration: 15,
            sessionNumber: "10",
          },
        },
      });

      render(
        <AttendanceHistoryItem
          groupedAttendance={cancelledAttendance}
          treatments={mockTreatments}
        />,
      );

      // AbsenceReasonBox shows "Not justified" when absenceNotes is undefined but status is cancelled
      expect(screen.getByText("Reason:")).toBeInTheDocument();
      expect(screen.getByText("Not justified")).toBeInTheDocument();
    });

    it("displays cancelled attendance with fallback label when treatments are empty", () => {
      const cancelledAttendance = createMockAttendance({
        date: "2026-02-10",
        status: "cancelled",
        absenceNotes: "Try to reschedule",
        treatments: {},
      });

      render(
        <AttendanceHistoryItem
          groupedAttendance={cancelledAttendance}
          treatments={mockTreatments}
        />,
      );

      // When treatments are empty, getTreatmentTypeLabel returns "not specified"
      expect(screen.getByText("Not specified")).toBeInTheDocument();
    });
  });

  describe("Missed Appointments", () => {
    it("displays missed appointment with red styling and AlertTriangle icon", () => {
      const missedAttendance = createMockAttendance({
        date: "2026-02-05",
        status: "missed",
        absenceNotes: "Patient did not show up",
        absenceJustified: false,
        treatments: {
          tens: {
            bodyLocations: ["Right Foot"],
            sessionNumber: "5",
          },
        },
      });

      render(
        <AttendanceHistoryItem
          groupedAttendance={missedAttendance}
          treatments={mockTreatments}
        />,
      );

      // Check red background (use getAllByText since date appears multiple times)
      const dateElements = screen.getAllByText("02/05/2026");
      const container = dateElements[0].closest("div.p-4");
      expect(container).toHaveClass("bg-red-50", "border-red-300");

      // Check strike-through text
      const allDateElements = screen.getAllByText(/02\/05\/2026/);
      const dateElement = allDateElements[0];
      expect(dateElement.closest("div")).toHaveClass(
        "text-gray-500",
        "line-through",
      );

      // Check MISSED label
      expect(screen.getByText("(MISSED)")).toBeInTheDocument();
      expect(screen.getByText("(MISSED)")).toHaveClass("text-red-600");

      // Check status badge
      expect(
        screen.getByText(ATTENDANCE_HISTORY_STATUS_LABELS.missed),
      ).toBeInTheDocument();
      const badge = screen.getByText(ATTENDANCE_HISTORY_STATUS_LABELS.missed);
      expect(badge).toHaveClass("bg-red-200", "text-red-900", "border-red-400");

      // Check absence reason box
      expect(screen.getByText("Patient did not show up")).toBeInTheDocument();
      const reasonBox = screen.getByText("Reason:").closest("div.p-3");
      expect(reasonBox).toHaveClass(
        "bg-red-100",
        "border-l-4",
        "border-red-500",
      );
    });

    it("displays justified missed appointment", () => {
      const missedAttendance = createMockAttendance({
        date: "2026-02-05",
        status: "missed",
        absenceNotes: "Emergency familiar",
        absenceJustified: true,
        treatments: {
          assessment: {
            notes: "Return consultation",
          },
        },
      });

      render(
        <AttendanceHistoryItem
          groupedAttendance={missedAttendance}
          treatments={mockTreatments}
        />,
      );

      // Check "Justified absence:" label is shown
      expect(screen.getByText("Justified absence:")).toBeInTheDocument();
      expect(screen.getByText("Emergency familiar")).toBeInTheDocument();
    });
  });

  describe("Completed Appointments", () => {
    it("displays completed appointment with normal styling", () => {
      const completedAttendance = createMockAttendance({
        date: "2026-02-01",
        status: "completed",
        treatments: {
          assessment: {
            notes: "Consultation completed",
          },
        },
      });

      render(
        <AttendanceHistoryItem
          groupedAttendance={completedAttendance}
          treatments={mockTreatments}
        />,
      );

      // Check normal background (use getAllByText since date appears multiple times)
      const dateElements = screen.getAllByText("02/01/2026");
      const container = dateElements[0].closest("div.p-4");
      expect(container).toHaveClass("bg-gray-50", "border-gray-200");

      // Check normal text (no strike-through)
      const allDateElements = screen.getAllByText(/02\/01\/2026/);
      const dateElement = allDateElements[0];
      expect(dateElement.closest("div")).toHaveClass("text-gray-900");
      expect(dateElement.closest("div")).not.toHaveClass("line-through");

      // Check no CANCELLED or MISSED labels
      expect(screen.queryByText("(CANCELLED)")).not.toBeInTheDocument();
      expect(screen.queryByText("(MISSED)")).not.toBeInTheDocument();

      // Check completed badge
      expect(
        screen.getByText(ATTENDANCE_HISTORY_STATUS_LABELS.completed),
      ).toBeInTheDocument();
    });
  });

  describe("Treatment Type Labels", () => {
    it("displays correct label for assessment consultation", () => {
      const attendance = createMockAttendance({
        date: "2026-02-01",
        status: "cancelled",
        absenceNotes: "Test",
        treatments: {
          assessment: {
            notes: "Assessment visit",
          },
        },
      });

      render(
        <AttendanceHistoryItem
          groupedAttendance={attendance}
          treatments={mockTreatments}
        />,
      );

      expect(
        screen.getAllByText(getAttendanceTypeLabel("assessment")).length,
      ).toBeGreaterThan(0);
    });

    it("displays correct label for physiotherapy only", () => {
      const attendance = createMockAttendance({
        date: "2026-02-01",
        status: "cancelled",
        absenceNotes: "Test",
        treatments: {
          physiotherapy: {
            bodyLocationsWithColors: [{ bodyLocation: "Head", color: "Blue" }],
            color: "Blue",
            duration: 15,
            sessionNumber: "10",
          },
        },
      });

      render(
        <AttendanceHistoryItem
          groupedAttendance={attendance}
          treatments={mockTreatments}
        />,
      );

      expect(
        screen.getByText(getTreatmentTypeLabel(false, true, false)),
      ).toBeInTheDocument();
    });

    it("displays correct label for tens only", () => {
      const attendance = createMockAttendance({
        date: "2026-02-01",
        status: "missed",
        absenceNotes: "Test",
        treatments: {
          tens: {
            bodyLocations: ["Foot"],
            sessionNumber: "5",
          },
        },
      });

      render(
        <AttendanceHistoryItem
          groupedAttendance={attendance}
          treatments={mockTreatments}
        />,
      );

      expect(
        screen.getByText(getTreatmentTypeLabel(false, false, true)),
      ).toBeInTheDocument();
    });

    it("displays correct label for both physiotherapy and tens", () => {
      const attendance = createMockAttendance({
        date: "2026-02-01",
        status: "cancelled",
        absenceNotes: "Test",
        treatments: {
          physiotherapy: {
            bodyLocationsWithColors: [{ bodyLocation: "Head", color: "Blue" }],
            color: "Blue",
            duration: 15,
            sessionNumber: "10",
          },
          tens: {
            bodyLocations: ["Leg"],
            sessionNumber: "5",
          },
        },
      });

      render(
        <AttendanceHistoryItem
          groupedAttendance={attendance}
          treatments={mockTreatments}
        />,
      );

      expect(
        screen.getByText(getTreatmentTypeLabel(false, true, true)),
      ).toBeInTheDocument();
    });
  });

  describe("Reschedule button visibility (patientTreatmentStatus)", () => {
    const cancelledWithPhysiotherapy = createMockAttendance({
      date: "2026-02-10",
      status: "cancelled",
      absenceNotes: "Test",
      treatments: {
        physiotherapy: {
          bodyLocationsWithColors: [{ bodyLocation: "Head", color: "Blue" }],
          color: "Blue",
          duration: 15,
          sessionNumber: "10",
        },
      },
    });

    const missedWithTens = createMockAttendance({
      date: "2026-02-05",
      status: "missed",
      absenceNotes: "Test",
      treatments: {
        tens: {
          bodyLocations: ["Foot"],
          sessionNumber: "5",
        },
      },
    });

    it("should show Reschedule button when patient is in treatment (T) and cancelled", () => {
      render(
        <AttendanceHistoryItem
          groupedAttendance={cancelledWithPhysiotherapy}
          treatments={mockTreatments}
          patientTreatmentStatus="T"
        />,
      );

      expect(
        screen.getByRole("button", { name: /ReSchedule Attendance/i }),
      ).toBeInTheDocument();
    });

    it("should show Reschedule button when patient is in treatment (T) and missed", () => {
      render(
        <AttendanceHistoryItem
          groupedAttendance={missedWithTens}
          treatments={mockTreatments}
          patientTreatmentStatus="T"
        />,
      );

      expect(
        screen.getByRole("button", { name: /ReSchedule Attendance/i }),
      ).toBeInTheDocument();
    });

    it("should not show Reschedule button when patient is discharged (A)", () => {
      render(
        <AttendanceHistoryItem
          groupedAttendance={cancelledWithPhysiotherapy}
          treatments={mockTreatments}
          patientTreatmentStatus="A"
        />,
      );

      expect(
        screen.queryByRole("button", { name: /ReSchedule Attendance/i }),
      ).not.toBeInTheDocument();
    });

    it("should not show Reschedule button when patient has consecutive absences (F)", () => {
      render(
        <AttendanceHistoryItem
          groupedAttendance={cancelledWithPhysiotherapy}
          treatments={mockTreatments}
          patientTreatmentStatus="F"
        />,
      );

      expect(
        screen.queryByRole("button", { name: /ReSchedule Attendance/i }),
      ).not.toBeInTheDocument();
    });

    it("should not show Reschedule button when patientTreatmentStatus is undefined", () => {
      render(
        <AttendanceHistoryItem
          groupedAttendance={cancelledWithPhysiotherapy}
          treatments={mockTreatments}
        />,
      );

      expect(
        screen.queryByRole("button", { name: /ReSchedule Attendance/i }),
      ).not.toBeInTheDocument();
    });
  });
});
