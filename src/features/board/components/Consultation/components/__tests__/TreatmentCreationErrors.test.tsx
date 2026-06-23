import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import TreatmentCreationErrors from "../TreatmentCreationErrors";
import type { TreatmentCreationError } from "../TreatmentCreationErrors";

// Mock data for testing
const mockErrors: TreatmentCreationError[] = [
  {
    treatmentType: "physiotherapy",
    errors: [
      "Failed to create attendance: Patient already has appointment at this time",
      "Invalid schedule configuration for Tuesday sessions",
    ],
  },
  {
    treatmentType: "tens",
    errors: ["Unable to schedule tens session: No available time slots"],
  },
];

const mockPatientName = "John Smith";

describe("TreatmentCreationErrors", () => {
  it("should render error component with correct patient name", () => {
    const mockOnContinue = jest.fn();

    render(
      <TreatmentCreationErrors
        errors={mockErrors}
        patientName={mockPatientName}
        onContinue={mockOnContinue}
      />,
    );

    expect(screen.getByText(`Problems Creating Sessions`)).toBeInTheDocument();
    expect(screen.getByText(mockPatientName)).toBeInTheDocument();
  });

  it("should display error summary statistics correctly", () => {
    const mockOnContinue = jest.fn();

    render(
      <TreatmentCreationErrors
        errors={mockErrors}
        patientName={mockPatientName}
        onContinue={mockOnContinue}
      />,
    );

    // Should show total of 3 errors (2 + 1)
    expect(screen.getByText("3")).toBeInTheDocument();
    // Should show 2 affected treatments
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("should display treatment-specific errors with icons", () => {
    const mockOnContinue = jest.fn();

    render(
      <TreatmentCreationErrors
        errors={mockErrors}
        patientName={mockPatientName}
        onContinue={mockOnContinue}
      />,
    );

    // Check for physiotherapy treatment section by text content
    expect(screen.getByText("Physiotherapy")).toBeInTheDocument();
    expect(screen.getByText("2 errors")).toBeInTheDocument();

    // Check for tens treatment section by text content
    expect(screen.getByText("TENS")).toBeInTheDocument();
    expect(screen.getByText("1 error")).toBeInTheDocument();
  });

  it("should display specific error messages", () => {
    const mockOnContinue = jest.fn();

    render(
      <TreatmentCreationErrors
        errors={mockErrors}
        patientName={mockPatientName}
        onContinue={mockOnContinue}
      />,
    );

    expect(
      screen.getByText(
        "Failed to create attendance: Patient already has appointment at this time",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Invalid schedule configuration for Tuesday sessions"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Unable to schedule tens session: No available time slots",
      ),
    ).toBeInTheDocument();
  });

  it("should show continue button and call onContinue when clicked", () => {
    const mockOnContinue = jest.fn();

    render(
      <TreatmentCreationErrors
        errors={mockErrors}
        patientName={mockPatientName}
        onContinue={mockOnContinue}
      />,
    );

    const continueButton = screen.getByRole("button", {
      name: /Continue Anyway/i,
    });
    expect(continueButton).toBeInTheDocument();

    fireEvent.click(continueButton);
    expect(mockOnContinue).toHaveBeenCalledTimes(1);
  });

  it("should show retry button when onRetry is provided", () => {
    const mockOnContinue = jest.fn();
    const mockOnRetry = jest.fn();

    render(
      <TreatmentCreationErrors
        errors={mockErrors}
        patientName={mockPatientName}
        onRetry={mockOnRetry}
        onContinue={mockOnContinue}
      />,
    );

    const retryButton = screen.getByRole("button", {
      name: /Back/i,
    });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it("should not show retry button when onRetry is not provided", () => {
    const mockOnContinue = jest.fn();

    render(
      <TreatmentCreationErrors
        errors={mockErrors}
        patientName={mockPatientName}
        onContinue={mockOnContinue}
      />,
    );

    const retryButton = screen.queryByRole("button", {
      name: /Back/i,
    });
    expect(retryButton).not.toBeInTheDocument();
  });

  it("should display recommendations section", () => {
    const mockOnContinue = jest.fn();

    render(
      <TreatmentCreationErrors
        errors={mockErrors}
        patientName={mockPatientName}
        onContinue={mockOnContinue}
      />,
    );

    expect(screen.getByText("Recommendations")).toBeInTheDocument();
    expect(
      screen.getByText(/Check for conflicting appointments for this patient/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Confirm scheduling settings are correct/,
      ),
    ).toBeInTheDocument();
  });

  it("should display footer note about successful record saving", () => {
    const mockOnContinue = jest.fn();

    render(
      <TreatmentCreationErrors
        errors={mockErrors}
        patientName={mockPatientName}
        onContinue={mockOnContinue}
      />,
    );

    expect(
      screen.getByText(/The treatment record was saved successfully/),
    ).toBeInTheDocument();
  });

  it("should handle custom message when provided", () => {
    const mockOnContinue = jest.fn();
    const customMessage = "Custom error for test";

    render(
      <TreatmentCreationErrors
        errors={mockErrors}
        patientName={mockPatientName}
        onContinue={mockOnContinue}
        customMessage={customMessage}
      />,
    );

    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it("should handle single error correctly", () => {
    const singleError: TreatmentCreationError[] = [
      {
        treatmentType: "physiotherapy",
        errors: ["Single error message"],
      },
    ];
    const mockOnContinue = jest.fn();

    render(
      <TreatmentCreationErrors
        errors={singleError}
        patientName={mockPatientName}
        onContinue={mockOnContinue}
      />,
    );

    // Should show "1 error" (singular) for the specific treatment
    expect(screen.getByText("1 error")).toBeInTheDocument();
    // Should show single error message
    expect(screen.getByText("Single error message")).toBeInTheDocument();
  });
});
