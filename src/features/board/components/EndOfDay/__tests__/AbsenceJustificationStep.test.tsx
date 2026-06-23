import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AbsenceJustificationStep from "../components/steps/AbsenceJustificationStep";
import { getAppointmentTypeLabel } from "@/utils/apiTransformers";
import type { AbsenceJustification, ScheduledAbsence } from "../types";

// Mock data factories
const createMockScheduledAbsence = (
  overrides: Partial<ScheduledAbsence> = {},
): ScheduledAbsence => ({
  patientId: 1,
  patientName: "John Doe",
  appointmentType: "assessment",
  ...overrides,
});

const createMockJustification = (
  overrides: Partial<AbsenceJustification> = {},
): AbsenceJustification => ({
  patientId: 1,
  patientName: "John Doe",
  appointmentType: "assessment",
  // justified is undefined initially
  ...overrides,
});

describe("AbsenceJustificationStep", () => {
  const defaultProps = {
    scheduledAbsences: [],
    selectedDate: "2024-01-15",
    absenceJustifications: [],
    onJustificationChange: jest.fn(),
    onNext: jest.fn(),
    onBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows success message when no scheduled absences", () => {
    render(<AbsenceJustificationStep {...defaultProps} />);

    expect(
      screen.getByText("All appointments confirmed!"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("There are no scheduled absences to justify."),
    ).toBeInTheDocument();
  });

  it("displays formatted date correctly", () => {
    render(<AbsenceJustificationStep {...defaultProps} />);

    expect(screen.getByText(/01\/15\/2024/)).toBeInTheDocument();
  });

  it("shows warning when there are scheduled absences", () => {
    const scheduledAbsences = [createMockScheduledAbsence()];

    render(
      <AbsenceJustificationStep
        {...defaultProps}
        scheduledAbsences={scheduledAbsences}
      />,
    );

    expect(screen.getByText("Absences")).toBeInTheDocument();
    expect(screen.getByText(/There is 1 patient/)).toBeInTheDocument();
  });

  it("renders absence details", () => {
    const scheduledAbsences = [
      createMockScheduledAbsence({ patientName: "Jane Doe", patientId: 123 }),
    ];
    const absenceJustifications = [
      createMockJustification({ patientId: 123, patientName: "Jane Doe" }),
    ];

    render(
      <AbsenceJustificationStep
        {...defaultProps}
        scheduledAbsences={scheduledAbsences}
        absenceJustifications={absenceJustifications}
      />,
    );

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(
      screen.getByText(getAppointmentTypeLabel("assessment")),
    ).toBeInTheDocument();
  });

  it("shows separate assessment section label when patient has multiple absence types", () => {
    const scheduledAbsences = [
      createMockScheduledAbsence({
        patientName: "Jane Doe",
        patientId: 123,
        appointmentType: "assessment",
      }),
      createMockScheduledAbsence({
        patientName: "Jane Doe",
        patientId: 123,
        appointmentType: "physiotherapy",
      }),
    ];
    const absenceJustifications = [
      createMockJustification({
        patientId: 123,
        patientName: "Jane Doe",
        appointmentType: "assessment",
      }),
      createMockJustification({
        patientId: 123,
        patientName: "Jane Doe",
        appointmentType: "physiotherapy",
      }),
    ];

    render(
      <AbsenceJustificationStep
        {...defaultProps}
        scheduledAbsences={scheduledAbsences}
        absenceJustifications={absenceJustifications}
      />,
    );

    fireEvent.click(
      screen.getByLabelText("Apply justification to all appointments"),
    );

    expect(
      screen.getByRole("heading", {
        name: getAppointmentTypeLabel("assessment"),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: getAppointmentTypeLabel("physiotherapy") }),
    ).toBeInTheDocument();
  });

  it("handles justified radio button selection", () => {
    const scheduledAbsences = [createMockScheduledAbsence({ patientId: 123 })];
    const absenceJustifications = [createMockJustification({ patientId: 123 })];

    render(
      <AbsenceJustificationStep
        {...defaultProps}
        scheduledAbsences={scheduledAbsences}
        absenceJustifications={absenceJustifications}
      />,
    );

    const justifiedRadio = screen.getByLabelText("Justified absence");
    fireEvent.click(justifiedRadio);

    expect(defaultProps.onJustificationChange).toHaveBeenCalledWith(
      123,
      "assessment",
      true,
      undefined,
    );
  });

  it("handles unjustified radio button selection", () => {
    const scheduledAbsences = [createMockScheduledAbsence({ patientId: 123 })];
    const absenceJustifications = [createMockJustification({ patientId: 123 })];

    render(
      <AbsenceJustificationStep
        {...defaultProps}
        scheduledAbsences={scheduledAbsences}
        absenceJustifications={absenceJustifications}
      />,
    );

    const unjustifiedRadio = screen.getByLabelText("Unjustified absence");
    fireEvent.click(unjustifiedRadio);

    expect(defaultProps.onJustificationChange).toHaveBeenCalledWith(
      123,
      "assessment",
      false,
      undefined,
    );
  });

  it("shows justification textarea when justified is selected", () => {
    const scheduledAbsences = [createMockScheduledAbsence({ patientId: 123 })];
    const absenceJustifications = [
      createMockJustification({ patientId: 123, justified: true }),
    ];

    render(
      <AbsenceJustificationStep
        {...defaultProps}
        scheduledAbsences={scheduledAbsences}
        absenceJustifications={absenceJustifications}
      />,
    );

    expect(screen.getByLabelText("Justification")).toBeInTheDocument();
  });

  it("handles justification text input", () => {
    const scheduledAbsences = [createMockScheduledAbsence({ patientId: 123 })];
    const absenceJustifications = [
      createMockJustification({ patientId: 123, justified: true }),
    ];

    render(
      <AbsenceJustificationStep
        {...defaultProps}
        scheduledAbsences={scheduledAbsences}
        absenceJustifications={absenceJustifications}
      />,
    );

    const textarea = screen.getByLabelText("Justification");
    fireEvent.change(textarea, { target: { value: "Patient was sick" } });

    expect(defaultProps.onJustificationChange).toHaveBeenCalledWith(
      123,
      "assessment",
      true,
      "Patient was sick",
    );
  });

  it("enables Next button when all absences are justified", () => {
    const scheduledAbsences = [createMockScheduledAbsence({ patientId: 123 })];
    const absenceJustifications = [
      createMockJustification({ patientId: 123, justified: true }),
    ];

    render(
      <AbsenceJustificationStep
        {...defaultProps}
        scheduledAbsences={scheduledAbsences}
        absenceJustifications={absenceJustifications}
      />,
    );

    const nextButton = screen.getByText("Next");
    expect(nextButton).not.toBeDisabled();
  });

  it("disables Next button when not all absences are justified", () => {
    const scheduledAbsences = [createMockScheduledAbsence({ patientId: 123 })];
    // Justification with undefined justified should disable the button
    const absenceJustifications: AbsenceJustification[] = [
      createMockJustification({ patientId: 123, justified: undefined }),
    ];

    render(
      <AbsenceJustificationStep
        {...defaultProps}
        scheduledAbsences={scheduledAbsences}
        absenceJustifications={absenceJustifications}
      />,
    );

    const nextButton = screen.getByText("Next");
    expect(nextButton).toBeDisabled();
  });

  it("calls onBack when Back button is clicked", () => {
    render(<AbsenceJustificationStep {...defaultProps} />);

    fireEvent.click(screen.getByText("Back"));

    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it("enables Next button when no scheduled absences", () => {
    render(<AbsenceJustificationStep {...defaultProps} />);

    const nextButton = screen.getByText("Next");
    expect(nextButton).not.toBeDisabled();

    fireEvent.click(nextButton);
    expect(defaultProps.onNext).toHaveBeenCalled();
  });
});
