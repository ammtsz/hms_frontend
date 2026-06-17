import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CreatedTreatmentsConfirmation, {
  type CreatedTreatment,
} from "../CreatedTreatmentsConfirmation";
import type {
  AttendanceResponseDto,
  AttendanceStatus,
  AttendanceType,
} from "@/api/types";

// Mock date helpers (formatDateBR used by confirmation; getWeeksUntil by NextConsultationCard)
jest.mock("@/utils/dateUtils", () => ({
  formatDateBR: jest.fn((dateStr: string) => {
    if (!dateStr) return "";

    // Handle both ISO date strings and date objects - match real function
    let d: Date;
    if (dateStr.includes("T")) {
      // Full ISO string
      d = new Date(dateStr);
    } else {
      // Date-only string (YYYY-MM-DD) - parse as local time to avoid timezone issues
      d = new Date(dateStr + "T00:00:00");
    }

    if (isNaN(d.getTime())) return dateStr;

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }),
  getWeeksUntil: jest.fn((scheduledDate: string, fromDate?: string) => {
    const from = fromDate
      ? new Date(fromDate + "T00:00:00")
      : new Date("2025-09-16T00:00:00");
    const scheduled = new Date(scheduledDate.replace(/T.*/, "") + "T00:00:00");
    if (isNaN(scheduled.getTime())) return 0;
    const diffWeeks =
      (scheduled.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 7);
    return Math.round(diffWeeks);
  }),
}));

describe("CreatedTreatmentsConfirmation", () => {
  const mockOnAcknowledge = jest.fn();
  const patientName = ""; // Not used in component anymore but kept for backward compatibility in tests

  const mockPhysiotherapySession: CreatedTreatment = {
    id: 1,
    consultationId: 1,
    attendanceId: 1,
    patientId: 1,
    treatmentType: "physiotherapy",
    bodyLocation: "Cabeça",
    startDate: "2025-09-16",
    plannedSessions: 5,
    completedSessions: 0,
    status: "scheduled",
    durationMinutes: 3, // 3 units = 21 minutes
    color: "Azul",
    notes: "Fisioterapia - Azul - 21 minutos",
    createdDate: "2025-09-16",
    createdTime: "10:00:00",
    updatedDate: "2025-09-16",
    updatedTime: "10:00:00",
  };

  const mockTensSession: CreatedTreatment = {
    id: 2,
    consultationId: 1,
    attendanceId: 1,
    patientId: 1,
    treatmentType: "tens",
    bodyLocation: "Coluna",
    startDate: "2025-09-16",
    plannedSessions: 3,
    completedSessions: 0,
    status: "scheduled",
    notes: "Tratamento com TENS",
    createdDate: "2025-09-16",
    createdTime: "10:00:00",
    updatedDate: "2025-09-16",
    updatedTime: "10:00:00",
  };

  const mockScheduledAttendances: AttendanceResponseDto[] = [
    {
      id: 101,
      patientId: 1,
      type: "assessment" as AttendanceType,
      status: "scheduled" as AttendanceStatus,
      scheduledDate: "2025-10-14",
      scheduledTime: "09:00:00",
      createdAt: "2025-09-16T10:00:00Z",
      updatedAt: "2025-09-16T10:00:00Z",
    },
    {
      id: 102,
      patientId: 1,
      type: "physiotherapy" as AttendanceType,
      status: "scheduled" as AttendanceStatus,
      scheduledDate: "2025-09-23",
      scheduledTime: "10:00:00",
      createdAt: "2025-09-16T10:00:00Z",
      updatedAt: "2025-09-16T10:00:00Z",
    },
    {
      id: 103,
      patientId: 1,
      type: "physiotherapy" as AttendanceType,
      status: "scheduled" as AttendanceStatus,
      scheduledDate: "2025-09-30",
      scheduledTime: "10:00:00",
      createdAt: "2025-09-16T10:00:00Z",
      updatedAt: "2025-09-16T10:00:00Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render success confirmation", () => {
    render(
      <CreatedTreatmentsConfirmation
        createdTreatments={[mockPhysiotherapySession]}
        patientName=""
        onAcknowledge={mockOnAcknowledge}
      />,
    );

    expect(
      screen.getByText("Tratamento registrado com sucesso!"),
    ).toBeInTheDocument();
  });

  it("should display treatment session details correctly", () => {
    render(
      <CreatedTreatmentsConfirmation
        createdTreatments={[mockPhysiotherapySession]}
        patientName={patientName}
        onAcknowledge={mockOnAcknowledge}
      />,
    );

    // Check treatment type group title
    expect(screen.getByText("Physiotherapy")).toBeInTheDocument();

    // Check body location (grouped card shows location label)
    expect(screen.getByText("Cabeça")).toBeInTheDocument();

    // Check color and duration
    expect(screen.getByText("Azul")).toBeInTheDocument();
    expect(screen.getByText("21 min")).toBeInTheDocument();

    // Check session count
    expect(screen.getByText("5 sessões")).toBeInTheDocument();
  });

  it("should display tens treatment sessions correctly", () => {
    render(
      <CreatedTreatmentsConfirmation
        createdTreatments={[mockTensSession]}
        patientName={patientName}
        onAcknowledge={mockOnAcknowledge}
      />,
    );

    // Check treatment type group title (TENS, no emoji in group header)
    expect(screen.getByText("TENS")).toBeInTheDocument();

    // Check body location
    expect(screen.getByText("Coluna")).toBeInTheDocument();

    // Check session count
    expect(screen.getByText("3 sessões")).toBeInTheDocument();
  });

  it("should show both treatment groups with session counts", () => {
    render(
      <CreatedTreatmentsConfirmation
        createdTreatments={[mockPhysiotherapySession, mockTensSession]}
        patientName={patientName}
        onAcknowledge={mockOnAcknowledge}
      />,
    );

    expect(screen.getByText("Physiotherapy")).toBeInTheDocument();
    expect(screen.getByText("TENS")).toBeInTheDocument();
    expect(screen.getByText("5 sessões")).toBeInTheDocument();
    expect(screen.getByText("3 sessões")).toBeInTheDocument();
  });

  it("should group sessions by treatment type", () => {
    render(
      <CreatedTreatmentsConfirmation
        createdTreatments={[mockPhysiotherapySession, mockTensSession]}
        patientName={patientName}
        onAcknowledge={mockOnAcknowledge}
      />,
    );

    // Check group headers
    expect(screen.getByText("Physiotherapy")).toBeInTheDocument();
    expect(screen.getByText("TENS")).toBeInTheDocument();

    // Check location count per group (sessions that differ only by body location are grouped)
    const locationTexts = screen.getAllByText("(1 local)");
    expect(locationTexts).toHaveLength(2); // One for each treatment type
  });

  it("should show automatic scheduling information", () => {
    render(
      <CreatedTreatmentsConfirmation
        createdTreatments={[mockPhysiotherapySession]}
        patientName={patientName}
        onAcknowledge={mockOnAcknowledge}
        newlyScheduledAttendances={mockScheduledAttendances}
      />,
    );

    expect(
      screen.getByText("Os Agendamentos abaixo foram criados automaticamente:"),
    ).toBeInTheDocument();
  });

  it("should call onAcknowledge when acknowledge button is clicked", () => {
    render(
      <CreatedTreatmentsConfirmation
        createdTreatments={[mockPhysiotherapySession]}
        patientName={patientName}
        onAcknowledge={mockOnAcknowledge}
      />,
    );

    const acknowledgeButton = screen.getByText("Entendi");
    fireEvent.click(acknowledgeButton);

    expect(mockOnAcknowledge).toHaveBeenCalledTimes(1);
  });

  it("should display custom message when provided", () => {
    const customMessage = "Mensagem personalizada de teste";

    render(
      <CreatedTreatmentsConfirmation
        createdTreatments={[mockPhysiotherapySession]}
        patientName={patientName}
        onAcknowledge={mockOnAcknowledge}
        customMessage={customMessage}
      />,
    );

    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it("should handle empty sessions array gracefully", () => {
    render(
      <CreatedTreatmentsConfirmation
        createdTreatments={[]}
        patientName={patientName}
        onAcknowledge={mockOnAcknowledge}
      />,
    );

    // Should still show success header
    expect(
      screen.getByText("Tratamento registrado com sucesso!"),
    ).toBeInTheDocument();

    // When there are no sessions, no treatment groups or stats block
    expect(screen.queryByText("Physiotherapy")).not.toBeInTheDocument();
    expect(screen.queryByText("TENS")).not.toBeInTheDocument();
  });

  it("should handle single session correctly", () => {
    const singleSession = { ...mockPhysiotherapySession, plannedSessions: 1 };

    render(
      <CreatedTreatmentsConfirmation
        createdTreatments={[singleSession]}
        patientName={patientName}
        onAcknowledge={mockOnAcknowledge}
      />,
    );

    expect(screen.getByText("Physiotherapy")).toBeInTheDocument();
    expect(screen.getByText("1 sessão")).toBeInTheDocument();
  });

  describe("Next Assessment Consultation", () => {
    it("should display next consultation date when scheduled attendances are provided", () => {
      const returnWeeks = 4;

      render(
        <CreatedTreatmentsConfirmation
          createdTreatments={[mockPhysiotherapySession]}
          patientName={patientName}
          onAcknowledge={mockOnAcknowledge}
          returnWeeks={returnWeeks}
          newlyScheduledAttendances={mockScheduledAttendances}
        />,
      );

      // Should show the next consultation section (NextConsultationCard)
      expect(
        screen.getByText("Retorno da Consulta de Avaliação"),
      ).toBeInTheDocument();

      // Should show the date from the scheduled attendance (14/10/2025)
      expect(screen.getByText("14/10/2025")).toBeInTheDocument();
    });

    it("should not display next consultation section when newlyScheduledAttendances is empty", () => {
      render(
        <CreatedTreatmentsConfirmation
          createdTreatments={[mockPhysiotherapySession]}
          patientName={patientName}
          onAcknowledge={mockOnAcknowledge}
          returnWeeks={4}
          newlyScheduledAttendances={[]}
        />,
      );

      expect(
        screen.queryByText("Retorno da Consulta de Avaliação"),
      ).not.toBeInTheDocument();
    });

    it("should not display next consultation section when newlyScheduledAttendances is not provided", () => {
      render(
        <CreatedTreatmentsConfirmation
          createdTreatments={[mockPhysiotherapySession]}
          patientName={patientName}
          onAcknowledge={mockOnAcknowledge}
          returnWeeks={4}
        />,
      );

      expect(
        screen.queryByText("Retorno da Consulta de Avaliação"),
      ).not.toBeInTheDocument();
    });

    it("should filter out non-scheduled assessment attendances (completed/in_progress)", () => {
      const attendancesWithCompleted: AttendanceResponseDto[] = [
        {
          id: 100,
          patientId: 1,
          type: "assessment" as AttendanceType,
          status: "completed" as AttendanceStatus,
          scheduledDate: "2025-09-16",
          scheduledTime: "09:00:00",
          createdAt: "2025-09-16T10:00:00Z",
          updatedAt: "2025-09-16T10:00:00Z",
        },
        ...mockScheduledAttendances,
      ];

      render(
        <CreatedTreatmentsConfirmation
          createdTreatments={[mockPhysiotherapySession]}
          patientName={patientName}
          onAcknowledge={mockOnAcknowledge}
          returnWeeks={4}
          newlyScheduledAttendances={attendancesWithCompleted}
        />,
      );

      // Should show the next scheduled (not completed) consultation
      expect(screen.getByText("14/10/2025")).toBeInTheDocument();
      expect(screen.queryByText("16/09/2025")).not.toBeInTheDocument();
    });

    it("should display singular form for 1 week return", () => {
      const oneWeekLaterAttendances: AttendanceResponseDto[] = [
        {
          id: 99,
          patientId: 1,
          type: "assessment" as AttendanceType,
          status: "scheduled" as AttendanceStatus,
          scheduledDate: "2025-09-23",
          scheduledTime: "09:00:00",
          createdAt: "2025-09-16T10:00:00Z",
          updatedAt: "2025-09-16T10:00:00Z",
        },
      ];
      render(
        <CreatedTreatmentsConfirmation
          createdTreatments={[mockPhysiotherapySession]}
          patientName={patientName}
          onAcknowledge={mockOnAcknowledge}
          returnWeeks={1}
          newlyScheduledAttendances={oneWeekLaterAttendances}
        />,
      );

      // getWeeksUntil mock: 2025-09-23 - 2025-09-16 = 1 week
      expect(screen.getByText("1 semana")).toBeInTheDocument();
    });

    it("should display plural form for multiple weeks return", () => {
      render(
        <CreatedTreatmentsConfirmation
          createdTreatments={[mockPhysiotherapySession]}
          patientName={patientName}
          onAcknowledge={mockOnAcknowledge}
          returnWeeks={8}
          newlyScheduledAttendances={mockScheduledAttendances}
        />,
      );

      // getWeeksUntil mock: 2025-10-14 - 2025-09-16 ≈ 4 weeks
      expect(screen.getByText("4 semanas")).toBeInTheDocument();
    });

    it("should show next consultation date when next consultation is shown", () => {
      render(
        <CreatedTreatmentsConfirmation
          createdTreatments={[mockPhysiotherapySession]}
          patientName={patientName}
          onAcknowledge={mockOnAcknowledge}
          returnWeeks={4}
          newlyScheduledAttendances={mockScheduledAttendances}
        />,
      );

      expect(
        screen.getByText("Retorno da Consulta de Avaliação"),
      ).toBeInTheDocument();
      expect(screen.getByText("14/10/2025")).toBeInTheDocument();
    });

    it("should show next consultation even when no treatment sessions are created", () => {
      render(
        <CreatedTreatmentsConfirmation
          createdTreatments={[]}
          patientName={patientName}
          onAcknowledge={mockOnAcknowledge}
          returnWeeks={2}
          newlyScheduledAttendances={mockScheduledAttendances}
        />,
      );

      // Should still show next consultation section
      expect(
        screen.getByText("Retorno da Consulta de Avaliação"),
      ).toBeInTheDocument();
      expect(screen.getByText("14/10/2025")).toBeInTheDocument();
    });

    it("should show loading state when fetchingAttendances is true", () => {
      render(
        <CreatedTreatmentsConfirmation
          createdTreatments={[mockPhysiotherapySession]}
          patientName={patientName}
          onAcknowledge={mockOnAcknowledge}
          fetchingAttendances={true}
        />,
      );

      expect(
        screen.getByText("Buscando agendamentos criados..."),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Verificando os próximos atendimentos agendados automaticamente",
        ),
      ).toBeInTheDocument();
    });

    it("should show error state when attendancesError is provided", () => {
      const errorMessage = "Erro ao buscar agendamentos";

      render(
        <CreatedTreatmentsConfirmation
          createdTreatments={[mockPhysiotherapySession]}
          patientName={patientName}
          onAcknowledge={mockOnAcknowledge}
          attendancesError={errorMessage}
        />,
      );

      expect(
        screen.getByText("Não foi possível carregar os agendamentos"),
      ).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});
