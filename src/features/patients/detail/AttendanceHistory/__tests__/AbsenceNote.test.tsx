import React from "react";
import { render, screen } from "@testing-library/react";
import { AbsenceNote } from "../AbsenceNote";

describe("AbsenceNote", () => {
  const defaultProps = {
    status: "missed" as const,
    hasAssessmentTreatment: false,
    hasPhysiotherapyTreatment: true,
    hasTensTreatment: false,
  };

  it("should render attendance type for physiotherapy only", () => {
    render(<AbsenceNote {...defaultProps} />);

    expect(screen.getByText(/tipo de atendimento/i)).toBeInTheDocument();
    expect(screen.getByText("Fisioterapia")).toBeInTheDocument();
  });

  it("should render attendance type for tens only", () => {
    render(
      <AbsenceNote
        {...defaultProps}
        hasPhysiotherapyTreatment={false}
        hasTensTreatment={true}
      />,
    );

    expect(screen.getByText("TENS")).toBeInTheDocument();
  });

  it("should render attendance type for both treatments", () => {
    render(
      <AbsenceNote
        {...defaultProps}
        hasPhysiotherapyTreatment={true}
        hasTensTreatment={true}
      />,
    );

    expect(screen.getByText("Fisioterapia e TENS")).toBeInTheDocument();
  });

  it("should render attendance type for assessment consultation", () => {
    render(
      <AbsenceNote
        {...defaultProps}
        hasAssessmentTreatment={true}
        hasPhysiotherapyTreatment={false}
      />,
    );

    expect(screen.getByText("Consulta de Avaliação")).toBeInTheDocument();
  });

  it("should render default message when no treatment specified", () => {
    render(
      <AbsenceNote
        {...defaultProps}
        hasPhysiotherapyTreatment={false}
        hasTensTreatment={false}
      />,
    );

    expect(screen.getByText("Não especificado")).toBeInTheDocument();
  });

  it("should render default missed message when no notes provided", () => {
    render(<AbsenceNote {...defaultProps} status="missed" />);

    expect(screen.getByText("Falta não justificada")).toBeInTheDocument();
  });

  it("should render default cancelled message when no notes provided", () => {
    render(<AbsenceNote {...defaultProps} status="cancelled" />);

    expect(
      screen.getByText("Cancelamento sem justificativa"),
    ).toBeInTheDocument();
  });

  it("should render absence notes when provided", () => {
    render(
      <AbsenceNote
        {...defaultProps}
        absenceNotes="Paciente teve compromisso familiar"
      />,
    );

    expect(
      screen.getByText("Paciente teve compromisso familiar"),
    ).toBeInTheDocument();
  });

  it("should show justified label when absence is justified", () => {
    render(
      <AbsenceNote
        {...defaultProps}
        absenceNotes="Motivo médico"
        absenceJustified={true}
      />,
    );

    expect(screen.getByText(/falta justificada/i)).toBeInTheDocument();
    expect(screen.getByText("Motivo médico")).toBeInTheDocument();
  });

  it("should show motivo label when absence is not justified but has notes", () => {
    render(
      <AbsenceNote
        {...defaultProps}
        absenceNotes="Esqueceu o horário"
        absenceJustified={false}
      />,
    );

    expect(screen.getByText(/motivo/i)).toBeInTheDocument();
    expect(screen.getByText("Esqueceu o horário")).toBeInTheDocument();
  });

  it("should render with correct styling structure", () => {
    const { container } = render(<AbsenceNote {...defaultProps} />);

    const mainContainer = container.querySelector(".bg-red-100");
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass("border-l-4", "border-red-500");
  });

  it("should render alert icon", () => {
    const { container } = render(<AbsenceNote {...defaultProps} />);

    const icon = container.querySelector(".text-red-700");
    expect(icon).toBeInTheDocument();
  });
});
