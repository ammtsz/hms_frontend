/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render, screen } from "@/utils/testUtils";
import { AttendanceHistoryItem } from "../AttendanceHistoryItem";
import { GroupedAttendance } from "@/utils/attendanceHistoryUtils";

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
        absenceNotes: "Paciente teve compromisso inadiável",
        absenceJustified: true,
        treatments: {
          assessment: {
            notes: "Consulta inicial",
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
      const dateElements = screen.getAllByText("10/02/2026");
      const container = dateElements[0].closest("div.p-4");
      expect(container).toHaveClass("bg-orange-50", "border-orange-300");

      // Check strike-through text
      const allDateElements = screen.getAllByText(/10\/02\/2026/);
      // Find the date element with the strike-through styling (first occurrence)
      const dateElement = allDateElements[0];
      expect(dateElement.closest("div")).toHaveClass(
        "text-gray-500",
        "line-through",
      );

      // Check CANCELADO label
      expect(screen.getByText("(CANCELADO)")).toBeInTheDocument();
      expect(screen.getByText("(CANCELADO)")).toHaveClass("text-orange-600");

      // Check status badge
      expect(screen.getByText("Cancelado")).toBeInTheDocument();
      const badge = screen.getByText("Cancelado");
      expect(badge).toHaveClass(
        "bg-orange-200",
        "text-orange-900",
        "border-orange-400",
      );

      // Check absence reason box (cancelled status shows "Motivo:" even when justified)
      expect(
        screen.getByText("Paciente teve compromisso inadiável"),
      ).toBeInTheDocument();
      const reasonBox = screen.getByText("Motivo:").closest("div.p-3");
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
            bodyLocationsWithColors: [
              { bodyLocation: "Cabeça", color: "Azul" },
            ],
            color: "Azul",
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

      // AbsenceReasonBox shows "Não justificado" when absenceNotes is undefined but status is cancelled
      expect(screen.getByText("Motivo:")).toBeInTheDocument();
      expect(screen.getByText("Não justificado")).toBeInTheDocument();
    });

    it("displays cancelled attendance with fallback label when treatments are empty", () => {
      const cancelledAttendance = createMockAttendance({
        date: "2026-02-10",
        status: "cancelled",
        absenceNotes: "tentar remarcar",
        treatments: {},
      });

      render(
        <AttendanceHistoryItem
          groupedAttendance={cancelledAttendance}
          treatments={mockTreatments}
        />,
      );

      // When treatments are empty, getTreatmentTypeLabel returns "Não especificado"
      expect(screen.getByText("Não especificado")).toBeInTheDocument();
    });
  });

  describe("Missed Appointments", () => {
    it("displays missed appointment with red styling and AlertTriangle icon", () => {
      const missedAttendance = createMockAttendance({
        date: "2026-02-05",
        status: "missed",
        absenceNotes: "Paciente não compareceu",
        absenceJustified: false,
        treatments: {
          tens: {
            bodyLocations: ["Pé direito"],
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
      const dateElements = screen.getAllByText("05/02/2026");
      const container = dateElements[0].closest("div.p-4");
      expect(container).toHaveClass("bg-red-50", "border-red-300");

      // Check strike-through text
      const allDateElements = screen.getAllByText(/05\/02\/2026/);
      const dateElement = allDateElements[0];
      expect(dateElement.closest("div")).toHaveClass(
        "text-gray-500",
        "line-through",
      );

      // Check FALTA label
      expect(screen.getByText("(FALTA)")).toBeInTheDocument();
      expect(screen.getByText("(FALTA)")).toHaveClass("text-red-600");

      // Check status badge
      expect(screen.getByText("Falta")).toBeInTheDocument();
      const badge = screen.getByText("Falta");
      expect(badge).toHaveClass("bg-red-200", "text-red-900", "border-red-400");

      // Check absence reason box
      expect(screen.getByText("Paciente não compareceu")).toBeInTheDocument();
      const reasonBox = screen.getByText("Motivo:").closest("div.p-3");
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
        absenceNotes: "Emergência familiar",
        absenceJustified: true,
        treatments: {
          assessment: {
            notes: "Consulta de retorno",
          },
        },
      });

      render(
        <AttendanceHistoryItem
          groupedAttendance={missedAttendance}
          treatments={mockTreatments}
        />,
      );

      // Check "Falta justificada:" label is shown
      expect(screen.getByText("Falta justificada:")).toBeInTheDocument();
      expect(screen.getByText("Emergência familiar")).toBeInTheDocument();
    });
  });

  describe("Completed Appointments", () => {
    it("displays completed appointment with normal styling", () => {
      const completedAttendance = createMockAttendance({
        date: "2026-02-01",
        status: "completed",
        treatments: {
          assessment: {
            notes: "Consulta realizada",
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
      const dateElements = screen.getAllByText("01/02/2026");
      const container = dateElements[0].closest("div.p-4");
      expect(container).toHaveClass("bg-gray-50", "border-gray-200");

      // Check normal text (no strike-through)
      const allDateElements = screen.getAllByText(/01\/02\/2026/);
      const dateElement = allDateElements[0];
      expect(dateElement.closest("div")).toHaveClass("text-gray-900");
      expect(dateElement.closest("div")).not.toHaveClass("line-through");

      // Check no CANCELADO or FALTA labels
      expect(screen.queryByText("(CANCELADO)")).not.toBeInTheDocument();
      expect(screen.queryByText("(FALTA)")).not.toBeInTheDocument();

      // Check completed badge
      expect(screen.getByText("Concluído")).toBeInTheDocument();
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
            notes: "Consulta",
          },
        },
      });

      render(
        <AttendanceHistoryItem
          groupedAttendance={attendance}
          treatments={mockTreatments}
        />,
      );

      expect(screen.getAllByText("Consulta").length).toBeGreaterThan(0);
    });

    it("displays correct label for physiotherapy only", () => {
      const attendance = createMockAttendance({
        date: "2026-02-01",
        status: "cancelled",
        absenceNotes: "Test",
        treatments: {
          physiotherapy: {
            bodyLocationsWithColors: [
              { bodyLocation: "Cabeça", color: "Azul" },
            ],
            color: "Azul",
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

      expect(screen.getByText("Fisioterapia")).toBeInTheDocument();
    });

    it("displays correct label for tens only", () => {
      const attendance = createMockAttendance({
        date: "2026-02-01",
        status: "missed",
        absenceNotes: "Test",
        treatments: {
          tens: {
            bodyLocations: ["Pé"],
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

      expect(screen.getByText("TENS")).toBeInTheDocument();
    });

    it("displays correct label for both physiotherapy and tens", () => {
      const attendance = createMockAttendance({
        date: "2026-02-01",
        status: "cancelled",
        absenceNotes: "Test",
        treatments: {
          physiotherapy: {
            bodyLocationsWithColors: [
              { bodyLocation: "Cabeça", color: "Azul" },
            ],
            color: "Azul",
            duration: 15,
            sessionNumber: "10",
          },
          tens: {
            bodyLocations: ["Perna"],
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

      expect(screen.getByText("Fisioterapia e TENS")).toBeInTheDocument();
    });
  });

  describe("Reschedule button visibility (patientTreatmentStatus)", () => {
    const cancelledWithPhysiotherapy = createMockAttendance({
      date: "2026-02-10",
      status: "cancelled",
      absenceNotes: "Test",
      treatments: {
        physiotherapy: {
          bodyLocationsWithColors: [{ bodyLocation: "Cabeça", color: "Azul" }],
          color: "Azul",
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
          bodyLocations: ["Pé"],
          sessionNumber: "5",
        },
      },
    });

    it("should show Reagendar button when patient is in treatment (T) and cancelled", () => {
      render(
        <AttendanceHistoryItem
          groupedAttendance={cancelledWithPhysiotherapy}
          treatments={mockTreatments}
          patientTreatmentStatus="T"
        />,
      );

      expect(
        screen.getByRole("button", { name: /Reagendar atendimento/i }),
      ).toBeInTheDocument();
    });

    it("should show Reagendar button when patient is in treatment (T) and missed", () => {
      render(
        <AttendanceHistoryItem
          groupedAttendance={missedWithTens}
          treatments={mockTreatments}
          patientTreatmentStatus="T"
        />,
      );

      expect(
        screen.getByRole("button", { name: /Reagendar atendimento/i }),
      ).toBeInTheDocument();
    });

    it("should not show Reagendar button when patient is discharged (A)", () => {
      render(
        <AttendanceHistoryItem
          groupedAttendance={cancelledWithPhysiotherapy}
          treatments={mockTreatments}
          patientTreatmentStatus="A"
        />,
      );

      expect(
        screen.queryByRole("button", { name: /Reagendar atendimento/i }),
      ).not.toBeInTheDocument();
    });

    it("should not show Reagendar button when patient has consecutive absences (F)", () => {
      render(
        <AttendanceHistoryItem
          groupedAttendance={cancelledWithPhysiotherapy}
          treatments={mockTreatments}
          patientTreatmentStatus="F"
        />,
      );

      expect(
        screen.queryByRole("button", { name: /Reagendar atendimento/i }),
      ).not.toBeInTheDocument();
    });

    it("should not show Reagendar button when patientTreatmentStatus is undefined", () => {
      render(
        <AttendanceHistoryItem
          groupedAttendance={cancelledWithPhysiotherapy}
          treatments={mockTreatments}
        />,
      );

      expect(
        screen.queryByRole("button", { name: /Reagendar atendimento/i }),
      ).not.toBeInTheDocument();
    });
  });
});
