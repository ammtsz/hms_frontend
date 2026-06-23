/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render, screen } from "@/utils/testUtils";
import { AppointmentHistoryItem } from "../AppointmentHistoryItem";
import { GroupedAppointment } from "@/utils/appointmentHistoryUtils";
import { APPOINTMENT_HISTORY_STATUS_LABELS } from "@/utils/appointmentStatusLabels";
import { getAppointmentTypeLabel } from "@/utils/apiTransformers";
import { getTreatmentTypeLabel } from "../utils";

// Helper function to create mock appointment with required fields
const createMockAppointment = (
  overrides: Partial<GroupedAppointment>,
): GroupedAppointment => ({
  date: "2026-02-10",
  appointmentId: "1",
  appointmentIds: ["1"],
  notes: "",
  createdDate: "2026-02-10",
  updatedDate: "2026-02-10",
  treatments: {},
  ...overrides,
});

describe("AppointmentHistoryItem", () => {
  const mockTreatments: any[] = [];

  describe("Cancelled Appointments", () => {
    it("displays cancelled appointment with orange styling and Ban icon", () => {
      const cancelledAppointment = createMockAppointment({
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
        <AppointmentHistoryItem
          groupedAppointment={cancelledAppointment}
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
        screen.getByText(APPOINTMENT_HISTORY_STATUS_LABELS.cancelled),
      ).toBeInTheDocument();
      const badge = screen.getByText(
        APPOINTMENT_HISTORY_STATUS_LABELS.cancelled,
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
      const cancelledAppointment = createMockAppointment({
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
        <AppointmentHistoryItem
          groupedAppointment={cancelledAppointment}
          treatments={mockTreatments}
        />,
      );

      // AbsenceReasonBox shows "Not justified" when absenceNotes is undefined but status is cancelled
      expect(screen.getByText("Reason:")).toBeInTheDocument();
      expect(screen.getByText("Not justified")).toBeInTheDocument();
    });

    it("displays cancelled appointment with fallback label when treatments are empty", () => {
      const cancelledAppointment = createMockAppointment({
        date: "2026-02-10",
        status: "cancelled",
        absenceNotes: "Try to reschedule",
        treatments: {},
      });

      render(
        <AppointmentHistoryItem
          groupedAppointment={cancelledAppointment}
          treatments={mockTreatments}
        />,
      );

      // When treatments are empty, getTreatmentTypeLabel returns "not specified"
      expect(screen.getByText("Not specified")).toBeInTheDocument();
    });
  });

  describe("Missed Appointments", () => {
    it("displays missed appointment with red styling and AlertTriangle icon", () => {
      const missedAppointment = createMockAppointment({
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
        <AppointmentHistoryItem
          groupedAppointment={missedAppointment}
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
        screen.getByText(APPOINTMENT_HISTORY_STATUS_LABELS.missed),
      ).toBeInTheDocument();
      const badge = screen.getByText(APPOINTMENT_HISTORY_STATUS_LABELS.missed);
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
      const missedAppointment = createMockAppointment({
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
        <AppointmentHistoryItem
          groupedAppointment={missedAppointment}
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
      const completedAppointment = createMockAppointment({
        date: "2026-02-01",
        status: "completed",
        treatments: {
          assessment: {
            notes: "Consultation completed",
          },
        },
      });

      render(
        <AppointmentHistoryItem
          groupedAppointment={completedAppointment}
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
        screen.getByText(APPOINTMENT_HISTORY_STATUS_LABELS.completed),
      ).toBeInTheDocument();
    });
  });

  describe("Treatment Type Labels", () => {
    it("displays correct label for assessment consultation", () => {
      const appointment = createMockAppointment({
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
        <AppointmentHistoryItem
          groupedAppointment={appointment}
          treatments={mockTreatments}
        />,
      );

      expect(
        screen.getAllByText(getAppointmentTypeLabel("assessment")).length,
      ).toBeGreaterThan(0);
    });

    it("displays correct label for physiotherapy only", () => {
      const appointment = createMockAppointment({
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
        <AppointmentHistoryItem
          groupedAppointment={appointment}
          treatments={mockTreatments}
        />,
      );

      expect(
        screen.getByText(getTreatmentTypeLabel(false, true, false)),
      ).toBeInTheDocument();
    });

    it("displays correct label for tens only", () => {
      const appointment = createMockAppointment({
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
        <AppointmentHistoryItem
          groupedAppointment={appointment}
          treatments={mockTreatments}
        />,
      );

      expect(
        screen.getByText(getTreatmentTypeLabel(false, false, true)),
      ).toBeInTheDocument();
    });

    it("displays correct label for both physiotherapy and tens", () => {
      const appointment = createMockAppointment({
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
        <AppointmentHistoryItem
          groupedAppointment={appointment}
          treatments={mockTreatments}
        />,
      );

      expect(
        screen.getByText(getTreatmentTypeLabel(false, true, true)),
      ).toBeInTheDocument();
    });
  });

  describe("Reschedule button visibility (patientTreatmentStatus)", () => {
    const cancelledWithPhysiotherapy = createMockAppointment({
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

    const missedWithTens = createMockAppointment({
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
        <AppointmentHistoryItem
          groupedAppointment={cancelledWithPhysiotherapy}
          treatments={mockTreatments}
          patientTreatmentStatus="T"
        />,
      );

      expect(
        screen.getByRole("button", { name: /ReSchedule Appointment/i }),
      ).toBeInTheDocument();
    });

    it("should show Reschedule button when patient is in treatment (T) and missed", () => {
      render(
        <AppointmentHistoryItem
          groupedAppointment={missedWithTens}
          treatments={mockTreatments}
          patientTreatmentStatus="T"
        />,
      );

      expect(
        screen.getByRole("button", { name: /ReSchedule Appointment/i }),
      ).toBeInTheDocument();
    });

    it("should not show Reschedule button when patient is discharged (D)", () => {
      render(
        <AppointmentHistoryItem
          groupedAppointment={cancelledWithPhysiotherapy}
          treatments={mockTreatments}
          patientTreatmentStatus="D"
        />,
      );

      expect(
        screen.queryByRole("button", { name: /ReSchedule Appointment/i }),
      ).not.toBeInTheDocument();
    });

    it("should not show Reschedule button when patient has consecutive no-shows (C)", () => {
      render(
        <AppointmentHistoryItem
          groupedAppointment={cancelledWithPhysiotherapy}
          treatments={mockTreatments}
          patientTreatmentStatus="C"
        />,
      );

      expect(
        screen.queryByRole("button", { name: /ReSchedule Appointment/i }),
      ).not.toBeInTheDocument();
    });

    it("should not show Reschedule button when patientTreatmentStatus is undefined", () => {
      render(
        <AppointmentHistoryItem
          groupedAppointment={cancelledWithPhysiotherapy}
          treatments={mockTreatments}
        />,
      );

      expect(
        screen.queryByRole("button", { name: /ReSchedule Appointment/i }),
      ).not.toBeInTheDocument();
    });
  });
});
