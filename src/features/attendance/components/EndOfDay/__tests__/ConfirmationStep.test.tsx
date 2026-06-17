import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ConfirmationStep from "../components/steps/ConfirmationStep";
import type { AbsenceJustification } from "../types";
import type { IAttendanceStatusDetailWithType } from "../../../utils/attendanceDataUtils";

// Mock data factories
const createMockAttendance = (
  overrides: Partial<IAttendanceStatusDetailWithType> = {},
): IAttendanceStatusDetailWithType => ({
  name: "John Doe",
  priority: "3",
  patientId: 1,
  attendanceType: "assessment",
  ...overrides,
});

const createMockJustification = (
  overrides: Partial<AbsenceJustification> = {},
): AbsenceJustification => ({
  patientId: 1,
  patientName: "John Doe",
  attendanceType: "assessment",
  justified: true,
  justification: "Medical appointment",
  ...overrides,
});

describe("ConfirmationStep", () => {
  const defaultProps = {
    selectedDate: "2024-01-15",
    completedAttendances: [],
    scheduledAbsences: [],
    absenceJustifications: [],
    isSubmitting: false,
    onSubmit: jest.fn(),
    onBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays formatted date correctly", () => {
    render(<ConfirmationStep {...defaultProps} />);

    expect(screen.getByText(/15\/01\/2024/)).toBeInTheDocument();
  });

  it("shows summary cards with correct counts", () => {
    const completedAttendances = [
      createMockAttendance({
        name: "Patient 1",
        patientId: 1,
        attendanceType: "assessment",
      }),
      createMockAttendance({
        name: "Patient 2",
        patientId: 2,
        attendanceType: "assessment",
      }),
    ];
    const absenceJustifications = [
      createMockJustification({ justified: true }),
      createMockJustification({ patientId: 2, justified: true }),
      createMockJustification({ patientId: 3, justified: false }),
    ];

    const { container } = render(
      <ConfirmationStep
        {...defaultProps}
        completedAttendances={completedAttendances}
        absenceJustifications={absenceJustifications}
      />,
    );

    // Check the summary cards by their grid container class
    const summaryGrid = container.querySelector(
      ".grid.grid-cols-1.md\\:grid-cols-3",
    );
    expect(summaryGrid).toBeInTheDocument();

    // Look for the specific counts in summary cards (grouped count)
    const completedCard = container.querySelector(
      ".bg-green-50 .text-2xl.font-bold.text-green-600",
    );
    expect(completedCard).toHaveTextContent("2");

    const unjustifiedCard = container.querySelector(
      ".bg-red-50 .text-2xl.font-bold.text-red-600",
    );
    expect(unjustifiedCard).toHaveTextContent("1");
  });

  it("displays completed attendances list with labels", () => {
    const completedAttendances = [
      createMockAttendance({
        name: "Jane Doe",
        patientId: 1,
        attendanceType: "assessment",
      }),
      createMockAttendance({
        name: "Bob Smith",
        patientId: 2,
        attendanceType: "physiotherapy",
      }),
    ];

    const { container } = render(
      <ConfirmationStep
        {...defaultProps}
        completedAttendances={completedAttendances}
      />,
    );

    // Find the completed attendances section heading specifically (h4 element)
    const completedSection = container.querySelector(
      "h4.text-md.font-medium.text-gray-900",
    );
    expect(completedSection).toHaveTextContent("Atendimentos Concluídos");

    expect(
      screen.getByText("• Jane Doe (Consulta de Avaliação)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("• Bob Smith (Fisioterapia - 1 local)"),
    ).toBeInTheDocument();
  });

  it("displays justified absences with justifications", () => {
    const absenceJustifications = [
      createMockJustification({
        patientName: "John Doe",
        justified: true,
        justification: "Medical emergency",
      }),
    ];

    render(
      <ConfirmationStep
        {...defaultProps}
        absenceJustifications={absenceJustifications}
      />,
    );

    const sections = screen.getAllByText("Faltas Justificadas");
    expect(sections.length).toBeGreaterThan(0);
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    expect(
      screen.getByText("Justificativa: Medical emergency"),
    ).toBeInTheDocument();
  });

  it("displays unjustified absences", () => {
    const absenceJustifications = [
      createMockJustification({
        patientName: "Jane Doe",
        justified: false,
      }),
    ];

    render(
      <ConfirmationStep
        {...defaultProps}
        absenceJustifications={absenceJustifications}
      />,
    );

    const sections = screen.getAllByText("Faltas não Justificadas");
    expect(sections.length).toBeGreaterThan(0);
    expect(screen.getByText("• Jane Doe")).toBeInTheDocument();
  });

  it("shows final confirmation message", () => {
    render(<ConfirmationStep {...defaultProps} />);

    expect(screen.getByText("Finalizar o dia")).toBeInTheDocument();
    expect(
      screen.getByText(/Clique em.*Finalizar Dia.*para confirmar/),
    ).toBeInTheDocument();
  });

  it("calls onBack when Back button is clicked", () => {
    render(<ConfirmationStep {...defaultProps} />);

    fireEvent.click(screen.getByText("Voltar"));

    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it("calls onSubmit when Finalizar Dia button is clicked", () => {
    render(<ConfirmationStep {...defaultProps} />);

    fireEvent.click(screen.getByText("Finalizar Dia"));

    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });

  it("disables buttons when submitting", () => {
    render(<ConfirmationStep {...defaultProps} isSubmitting={true} />);

    const backButton = screen.getByText("Voltar");
    const submitButton = screen.getByText("Finalizando...");

    expect(backButton).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it("shows loading state when submitting", () => {
    render(<ConfirmationStep {...defaultProps} isSubmitting={true} />);

    expect(screen.getByText("Finalizando...")).toBeInTheDocument();
    expect(screen.queryByText("Finalizar Dia")).not.toBeInTheDocument();
  });

  it("handles attendances without names", () => {
    const completedAttendances = [
      createMockAttendance({
        name: "Unknown",
        patientId: undefined,
        attendanceType: "assessment",
      }),
    ];

    render(
      <ConfirmationStep
        {...defaultProps}
        completedAttendances={completedAttendances}
      />,
    );

    expect(
      screen.getByText("• Unknown (Consulta de Avaliação)"),
    ).toBeInTheDocument();
  });

  describe("Attendance Grouping Logic", () => {
    it("groups patient with assessment and treatments as two entries", () => {
      const completedAttendances = [
        createMockAttendance({
          name: "Paciente 10",
          patientId: 10,
          attendanceType: "assessment",
        }),
        createMockAttendance({
          name: "Paciente 10",
          patientId: 10,
          attendanceType: "physiotherapy",
        }),
        createMockAttendance({
          name: "Paciente 10",
          patientId: 10,
          attendanceType: "tens",
        }),
      ];

      render(
        <ConfirmationStep
          {...defaultProps}
          completedAttendances={completedAttendances}
        />,
      );

      // Should show 2 entries for the same patient
      expect(
        screen.getByText("• Paciente 10 (Consulta de Avaliação)"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "• Paciente 10 (Fisioterapia - 1 local e TENS - 1 local)",
        ),
      ).toBeInTheDocument();

      // Count should be 2 (grouped)
      const completedCard = screen.getByText("2");
      expect(completedCard).toBeInTheDocument();
    });

    it("groups patient with only assessment as one entry", () => {
      const completedAttendances = [
        createMockAttendance({
          name: "Patient A",
          patientId: 1,
          attendanceType: "assessment",
        }),
      ];

      render(
        <ConfirmationStep
          {...defaultProps}
          completedAttendances={completedAttendances}
        />,
      );

      expect(
        screen.getByText("• Patient A (Consulta de Avaliação)"),
      ).toBeInTheDocument();

      // Count should be 1
      const completedCard = screen.getByText("1");
      expect(completedCard).toBeInTheDocument();
    });

    it("groups patient with only physiotherapy as one entry", () => {
      const completedAttendances = [
        createMockAttendance({
          name: "Teste Manual 2",
          patientId: 2,
          attendanceType: "physiotherapy",
        }),
      ];

      render(
        <ConfirmationStep
          {...defaultProps}
          completedAttendances={completedAttendances}
        />,
      );

      expect(
        screen.getByText("• Teste Manual 2 (Fisioterapia - 1 local)"),
      ).toBeInTheDocument();

      // Count should be 1
      const completedCard = screen.getByText("1");
      expect(completedCard).toBeInTheDocument();
    });

    it("groups patient with only tens as one entry", () => {
      const completedAttendances = [
        createMockAttendance({
          name: "Patient C",
          patientId: 3,
          attendanceType: "tens",
        }),
      ];

      render(
        <ConfirmationStep
          {...defaultProps}
          completedAttendances={completedAttendances}
        />,
      );

      expect(
        screen.getByText("• Patient C (TENS - 1 local)"),
      ).toBeInTheDocument();

      // Count should be 1
      const completedCard = screen.getByText("1");
      expect(completedCard).toBeInTheDocument();
    });

    it("groups patient with both physiotherapy and tens as one entry", () => {
      const completedAttendances = [
        createMockAttendance({
          name: "Patient D",
          patientId: 4,
          attendanceType: "physiotherapy",
        }),
        createMockAttendance({
          name: "Patient D",
          patientId: 4,
          attendanceType: "tens",
        }),
      ];

      render(
        <ConfirmationStep
          {...defaultProps}
          completedAttendances={completedAttendances}
        />,
      );

      expect(
        screen.getByText(
          "• Patient D (Fisioterapia - 1 local e TENS - 1 local)",
        ),
      ).toBeInTheDocument();

      // Count should be 1 (grouped)
      const completedCard = screen.getByText("1");
      expect(completedCard).toBeInTheDocument();
    });

    it("handles multiple different patients with different attendance types", () => {
      const completedAttendances = [
        // Patient 1: assessment + treatments
        createMockAttendance({
          name: "Paciente 10",
          patientId: 10,
          attendanceType: "assessment",
        }),
        createMockAttendance({
          name: "Paciente 10",
          patientId: 10,
          attendanceType: "physiotherapy",
        }),
        createMockAttendance({
          name: "Paciente 10",
          patientId: 10,
          attendanceType: "tens",
        }),
        // Patient 2: only physiotherapy
        createMockAttendance({
          name: "Teste Manual 2",
          patientId: 2,
          attendanceType: "physiotherapy",
        }),
        // Patient 3: only assessment
        createMockAttendance({
          name: "Patient X",
          patientId: 3,
          attendanceType: "assessment",
        }),
      ];

      render(
        <ConfirmationStep
          {...defaultProps}
          completedAttendances={completedAttendances}
        />,
      );

      // Patient 1: 2 entries
      expect(
        screen.getByText("• Paciente 10 (Consulta de Avaliação)"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "• Paciente 10 (Fisioterapia - 1 local e TENS - 1 local)",
        ),
      ).toBeInTheDocument();

      // Patient 2: 1 entry
      expect(
        screen.getByText("• Teste Manual 2 (Fisioterapia - 1 local)"),
      ).toBeInTheDocument();

      // Patient 3: 1 entry
      expect(
        screen.getByText("• Patient X (Consulta de Avaliação)"),
      ).toBeInTheDocument();

      // Total count should be 4 (2 + 1 + 1)
      const completedCard = screen.getByText("4");
      expect(completedCard).toBeInTheDocument();
    });
  });
});
