import React from "react";
import { render, screen } from "@/utils/testUtils";
import { ScheduledAttendanceItem } from "../ScheduledAttendanceItem";
import { GroupedScheduledAttendance } from "@/utils/attendanceHistoryUtils";

// Mock date helpers to control "days until" calculations
jest.mock("@/utils/dateUtils", () => ({
  ...jest.requireActual("@/utils/dateUtils"),
  getDaysUntil: jest.fn((date: string) => {
    // Return different values based on test dates
    if (date === "2026-02-18") return 0; // hoje
    if (date === "2026-02-19") return 1; // amanhã
    if (date === "2026-02-25") return 7; // em 7 dias
    if (date === "2026-03-05") return 15; // em 15 dias
    return 0;
  }),
  formatDateBR: jest.fn((date: string) => {
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
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

    expect(screen.getByText("25/02/2026")).toBeInTheDocument();
    expect(screen.getByText("(em 7 dias)")).toBeInTheDocument();
  });

  it("should display 'hoje' for today's appointment", () => {
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

    expect(screen.getByText("(hoje)")).toBeInTheDocument();
  });

  it("should display 'amanhã' for tomorrow's appointment", () => {
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

    expect(screen.getByText("(amanhã)")).toBeInTheDocument();
  });

  it("should show 'Próximo' badge for first item when not cancelled", () => {
    render(
      <ScheduledAttendanceItem
        groupedScheduled={baseAttendance}
        isFirstItem={true}
      />,
    );

    expect(screen.getByText("Próximo")).toBeInTheDocument();
  });

  it("should show 'Em breve' badge for upcoming appointments", () => {
    render(
      <ScheduledAttendanceItem
        groupedScheduled={baseAttendance}
        isFirstItem={false}
      />,
    );

    expect(screen.getByText("Em breve")).toBeInTheDocument();
  });

  it("should not show 'Em breve' for appointments beyond 7 days", () => {
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

    expect(screen.queryByText("Em breve")).not.toBeInTheDocument();
  });

  it("should display assessment consultation treatment", () => {
    const assessmentAttendance = {
      ...baseAttendance,
      treatments: {
        assessment: {
          isScheduled: true,
          notes: "Retorno para avaliação",
        },
      },
    };

    render(
      <ScheduledAttendanceItem
        groupedScheduled={assessmentAttendance}
        isFirstItem={false}
      />,
    );

    expect(screen.getAllByText(/Consulta/)[0]).toBeInTheDocument();
    expect(screen.getByText("Retorno para avaliação")).toBeInTheDocument();
  });

  it("should display physiotherapy treatment", () => {
    const physiotherapyAttendance = {
      ...baseAttendance,
      treatments: {
        physiotherapy: {
          bodyLocationsWithColors: [
            { bodyLocation: "Cabeça", color: "Azul" },
            { bodyLocation: "Peito", color: "Azul" },
          ],
          color: "Azul",
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

    expect(screen.getAllByText(/Fisioterapia/)[0]).toBeInTheDocument();
    expect(screen.getByText(/Cabeça, Peito/)).toBeInTheDocument();
    expect(screen.getByText("Azul")).toBeInTheDocument();
  });

  it("should display tens treatment", () => {
    const tensAttendance = {
      ...baseAttendance,
      treatments: {
        tens: {
          bodyLocations: ["Pé direito"],
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
    expect(screen.getByText(/Pé direito/)).toBeInTheDocument();
  });

  it("should display cancelled appointment with orange styling", () => {
    const cancelledAttendance = {
      ...baseAttendance,
      status: "cancelled" as const,
      absenceNotes: "Paciente solicitou cancelamento",
    };

    render(
      <ScheduledAttendanceItem
        groupedScheduled={cancelledAttendance}
        isFirstItem={false}
      />,
    );

    expect(screen.getByText("(CANCELADO)")).toBeInTheDocument();
    expect(screen.getByText("Cancelado")).toBeInTheDocument();
    expect(
      screen.getByText("Paciente solicitou cancelamento"),
    ).toBeInTheDocument();
  });

  it("should not show 'Próximo' badge for cancelled appointments", () => {
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

    expect(screen.queryByText("Próximo")).not.toBeInTheDocument();
    expect(screen.getByText("Cancelado")).toBeInTheDocument();
  });

  it("should display attendance metadata", () => {
    render(
      <ScheduledAttendanceItem
        groupedScheduled={baseAttendance}
        isFirstItem={false}
      />,
    );

    expect(screen.getByText(/Criado em:/)).toBeInTheDocument();
    expect(screen.getByText("01/02/2026")).toBeInTheDocument();
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

    expect(screen.getByText(/Cancelado em:/)).toBeInTheDocument();
    expect(screen.getByText("10/02/2026")).toBeInTheDocument();
  });

  it("should handle multiple treatments together", () => {
    const multiTreatmentAttendance = {
      ...baseAttendance,
      treatments: {
        physiotherapy: {
          bodyLocationsWithColors: [{ bodyLocation: "Cabeça", color: "Azul" }],
          color: "Azul",
          duration: 10,
          sessionNumber: "1/3",
          notes: undefined,
        },
        tens: {
          bodyLocations: ["Pé"],
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

    expect(screen.getAllByText(/Fisioterapia/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/TENS/)[0]).toBeInTheDocument();
    expect(screen.getByText(/Cabeça/)).toBeInTheDocument();
    expect(screen.getByText(/Pé/)).toBeInTheDocument();
  });

  describe("Reschedule button visibility (patientTreatmentStatus)", () => {
    const cancelledWithPhysiotherapy = {
      ...baseAttendance,
      status: "cancelled" as const,
      treatments: {
        physiotherapy: {
          bodyLocationsWithColors: [{ bodyLocation: "Cabeça", color: "Azul" }],
          color: "Azul",
          duration: 15,
          sessionNumber: "1/3",
          notes: undefined,
        },
      },
    };

    it("should show Reagendar button when patient is in treatment (T)", () => {
      render(
        <ScheduledAttendanceItem
          groupedScheduled={cancelledWithPhysiotherapy}
          isFirstItem={false}
          patientTreatmentStatus="T"
        />,
      );

      expect(
        screen.getByRole("button", { name: /Reagendar atendimento/i }),
      ).toBeInTheDocument();
    });

    it("should not show Reagendar button when patient is discharged (A)", () => {
      render(
        <ScheduledAttendanceItem
          groupedScheduled={cancelledWithPhysiotherapy}
          isFirstItem={false}
          patientTreatmentStatus="A"
        />,
      );

      expect(
        screen.queryByRole("button", { name: /Reagendar atendimento/i }),
      ).not.toBeInTheDocument();
    });

    it("should not show Reagendar button when patient has consecutive absences (F)", () => {
      render(
        <ScheduledAttendanceItem
          groupedScheduled={cancelledWithPhysiotherapy}
          isFirstItem={false}
          patientTreatmentStatus="F"
        />,
      );

      expect(
        screen.queryByRole("button", { name: /Reagendar atendimento/i }),
      ).not.toBeInTheDocument();
    });

    it("should not show Reagendar button when patientTreatmentStatus is undefined", () => {
      render(
        <ScheduledAttendanceItem
          groupedScheduled={cancelledWithPhysiotherapy}
          isFirstItem={false}
        />,
      );

      expect(
        screen.queryByRole("button", { name: /Reagendar atendimento/i }),
      ).not.toBeInTheDocument();
    });
  });
});
