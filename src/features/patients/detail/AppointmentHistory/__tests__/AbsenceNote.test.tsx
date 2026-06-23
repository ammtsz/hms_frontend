import React from "react";
import { render, screen } from "@testing-library/react";
import { AbsenceNote } from "../AbsenceNote";
import { getTreatmentTypeLabel } from "../utils";

describe("AbsenceNote", () => {
  const defaultProps = {
    status: "missed" as const,
    hasAssessmentTreatment: false,
    hasPhysiotherapyTreatment: true,
    hasTensTreatment: false,
  };

  it("should render appointment type for physiotherapy only", () => {
    render(<AbsenceNote {...defaultProps} />);

    expect(screen.getByText(/Appointment Type/i)).toBeInTheDocument();
    expect(screen.getByText(getTreatmentTypeLabel(false, true, false))).toBeInTheDocument();
  });

  it("should render appointment type for tens only", () => {
    render(
      <AbsenceNote
        {...defaultProps}
        hasPhysiotherapyTreatment={false}
        hasTensTreatment={true}
      />,
    );

    expect(screen.getByText(getTreatmentTypeLabel(false, false, true))).toBeInTheDocument();
  });

  it("should render appointment type for both treatments", () => {
    render(
      <AbsenceNote
        {...defaultProps}
        hasPhysiotherapyTreatment={true}
        hasTensTreatment={true}
      />,
    );

    expect(screen.getByText(getTreatmentTypeLabel(false, true, true))).toBeInTheDocument();
  });

  it("should render appointment type for assessment consultation", () => {
    render(
      <AbsenceNote
        {...defaultProps}
        hasAssessmentTreatment={true}
        hasPhysiotherapyTreatment={false}
      />,
    );

    expect(screen.getByText(getTreatmentTypeLabel(true, false, false))).toBeInTheDocument();
  });

  it("should render default message when no treatment specified", () => {
    render(
      <AbsenceNote
        {...defaultProps}
        hasPhysiotherapyTreatment={false}
        hasTensTreatment={false}
      />,
    );

    expect(screen.getByText("Not specified")).toBeInTheDocument();
  });

  it("should render default missed message when no notes provided", () => {
    render(<AbsenceNote {...defaultProps} status="missed" />);

    expect(screen.getByText("Unjustified absence")).toBeInTheDocument();
  });

  it("should render default cancelled message when no notes provided", () => {
    render(<AbsenceNote {...defaultProps} status="cancelled" />);

    expect(
      screen.getByText("Unjustified cancellation"),
    ).toBeInTheDocument();
  });

  it("should render absence notes when provided", () => {
    render(
      <AbsenceNote
        {...defaultProps}
        absenceNotes="Patient had a family commitment"
      />,
    );

    expect(
      screen.getByText("Patient had a family commitment"),
    ).toBeInTheDocument();
  });

  it("should show justified label when absence is justified", () => {
    render(
      <AbsenceNote
        {...defaultProps}
        absenceNotes="Medical reason"
        absenceJustified={true}
      />,
    );

    expect(screen.getByText(/Absence justified/i)).toBeInTheDocument();
    expect(screen.getByText("Medical reason")).toBeInTheDocument();
  });

  it("should show reason label when absence is not justified but has notes", () => {
    render(
      <AbsenceNote
        {...defaultProps}
        absenceNotes="Forgot the time"
        absenceJustified={false}
      />,
    );

    expect(screen.getByText(/Reason:/i)).toBeInTheDocument();
    expect(screen.getByText("Forgot the time")).toBeInTheDocument();
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
