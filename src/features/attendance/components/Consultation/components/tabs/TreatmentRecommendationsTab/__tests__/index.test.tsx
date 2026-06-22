/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import TreatmentRecommendationsTab from "../index";

import type { TreatmentRecommendation } from "../../../../types";

// Mock the TreatmentRecommendationsSection component
jest.mock("../TreatmentRecommendationsSection", () => {
  return function MockTreatmentRecommendationsSection({
    onChange,
    disabled,
  }: {
    recommendations: TreatmentRecommendation;
    onChange: (recommendations: TreatmentRecommendation) => void;
    disabled?: boolean;
  }) {
    return (
      <div
        data-testid="treatmentRecommendations-section"
        data-disabled={disabled ? "true" : "false"}
      >
        <button
          data-testid="change-recommendations"
          onClick={() =>
            onChange({
              returnWeeks: 4,
              returnWhenTreatmentComplete: false,
            })
          }
        >
          Change Recommendations
        </button>
      </div>
    );
  };
});

describe("TreatmentRecommendationsTab", () => {
  const mockFormData = {
    mainConcern: "Test complaint",
    patientStatus: "T" as const,
    startDate: "2024-01-01",
    returnWeeks: 4,
    food: "Test food",
    water: "Test water",
    ointments: "Test ointments",
    recommendations: {
      returnWeeks: 4,
      returnWhenTreatmentComplete: false,
    },
    notes: "Test notes",
    noGeneralRecommendations: false,
    noTreatmentRecommendations: false,
  };

  const mockOnFormDataChange = jest.fn();

  const mockFormDataWithTreatments = {
    ...mockFormData,
    recommendations: {
      returnWeeks: 4,
      returnWhenTreatmentComplete: false,
      physiotherapy: {
        startDate: "2024-01-01",
        treatments: [
          {
            locations: ["Head"],
            color: "blue",
            duration: 10,
            quantity: 3,
            startDate: "2024-01-01",
          },
        ],
      },
    },
  };

  const mockOnRecommendationsChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render without crashing", () => {
    render(
      <TreatmentRecommendationsTab
        treatmentStartDate="2024-01-15"
        formData={mockFormData}
        onRecommendationsChange={mockOnRecommendationsChange}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    expect(
      screen.getByTestId("treatmentRecommendations-section"),
    ).toBeInTheDocument();
  });

  it("should display treatment recommendations section", () => {
    render(
      <TreatmentRecommendationsTab
        treatmentStartDate="2024-01-15"
        formData={mockFormData}
        onRecommendationsChange={mockOnRecommendationsChange}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    expect(
      screen.getByTestId("treatmentRecommendations-section"),
    ).toBeInTheDocument();
  });

  it("should render TreatmentRecommendationsSection with correct props", () => {
    render(
      <TreatmentRecommendationsTab
        treatmentStartDate="2024-01-15"
        formData={mockFormData}
        onRecommendationsChange={mockOnRecommendationsChange}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    expect(
      screen.getByTestId("treatmentRecommendations-section"),
    ).toBeInTheDocument();
  });

  it("should pass onRecommendationsChange callback to TreatmentRecommendationsSection", () => {
    render(
      <TreatmentRecommendationsTab
        treatmentStartDate="2024-01-15"
        formData={mockFormData}
        onRecommendationsChange={mockOnRecommendationsChange}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    const changeButton = screen.getByTestId("change-recommendations");
    changeButton.click();

    expect(mockOnRecommendationsChange).toHaveBeenCalledWith({
      returnWeeks: 4,
      returnWhenTreatmentComplete: false,
    });
  });

  it("should render return consultation scheduling section", () => {
    render(
      <TreatmentRecommendationsTab
        treatmentStartDate="2024-01-15"
        formData={mockFormData}
        onRecommendationsChange={mockOnRecommendationsChange}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    expect(
      screen.getByText("Assessment Consultation Return"),
    ).toBeInTheDocument();
  });

  it("should show checkbox when active treatments exist", () => {
    render(
      <TreatmentRecommendationsTab
        treatmentStartDate="2024-01-15"
        formData={mockFormDataWithTreatments}
        onRecommendationsChange={mockOnRecommendationsChange}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /Schedule a return when the treatment ends/i,
    });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it("should toggle return when treatment complete checkbox", async () => {
    const user = userEvent.setup();
    render(
      <TreatmentRecommendationsTab
        treatmentStartDate="2024-01-15"
        formData={mockFormDataWithTreatments}
        onRecommendationsChange={mockOnRecommendationsChange}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /Schedule a return when the treatment ends/i,
    });

    await user.click(checkbox);

    expect(mockOnRecommendationsChange).toHaveBeenCalledWith({
      returnWeeks: 4,
      returnWhenTreatmentComplete: true,
      physiotherapy: {
        startDate: "2024-01-01",
        treatments: [
          {
            locations: ["Head"],
            color: "blue",
            duration: 10,
            quantity: 3,
            startDate: "2024-01-01",
          },
        ],
      },
    });
  });

  it("should update return weeks input", async () => {
    userEvent.setup();
    render(
      <TreatmentRecommendationsTab
        treatmentStartDate="2024-01-15"
        formData={mockFormData}
        onRecommendationsChange={mockOnRecommendationsChange}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    const input = screen.getByRole("spinbutton", {
      name: /weeks until return/i,
    }) as HTMLInputElement;

    // Change value directly instead of clear + type to avoid multiple onChange calls
    fireEvent.change(input, { target: { value: "6" } });

    // Should have called with final value of 6
    const calls = mockOnRecommendationsChange.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    expect(lastCall.returnWeeks).toBe(6);
    expect(lastCall.returnWhenTreatmentComplete).toBe(false);
  });

  it("should show warning for discharged patients", () => {
    const dischargedFormData = {
      ...mockFormData,
      patientStatus: "A" as const,
    };

    render(
      <TreatmentRecommendationsTab
        treatmentStartDate="2024-01-15"
        formData={dischargedFormData}
        onRecommendationsChange={mockOnRecommendationsChange}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    expect(
      screen.getByText(/When selecting "Discharged"/i),
    ).toBeInTheDocument();
  });

  it("should display correct label when return when treatment complete is checked", () => {
    const formDataWithAutoReturn = {
      ...mockFormDataWithTreatments,
      recommendations: {
        ...mockFormDataWithTreatments.recommendations,
        returnWhenTreatmentComplete: true,
      },
    };

    render(
      <TreatmentRecommendationsTab
        treatmentStartDate="2024-01-15"
        formData={formDataWithAutoReturn}
        onRecommendationsChange={mockOnRecommendationsChange}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    expect(
      screen.getByText(
        /return on the last day of treatment|after treatment ends/i,
      ),
    ).toBeInTheDocument();
  });

  it("should display correct helper text for return weeks", () => {
    render(
      <TreatmentRecommendationsTab
        treatmentStartDate="2024-01-15"
        formData={mockFormData}
        onRecommendationsChange={mockOnRecommendationsChange}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    expect(
      screen.getByText(
        /4 week(s) after this consultation|follow-up appointment will be scheduled for 4 week/i,
      ),
    ).toBeInTheDocument();
  });

  it("should have proper styling and structure", () => {
    render(
      <TreatmentRecommendationsTab
        treatmentStartDate="2024-01-15"
        formData={mockFormData}
        onRecommendationsChange={mockOnRecommendationsChange}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    const container = screen
      .getByText("Assessment Consultation Return")
      .closest("div")
      ?.closest("div")?.parentElement;
    expect(container).toHaveClass("space-y-6");
  });

  it("should render and toggle no treatment recommendations checkbox", () => {
    render(
      <TreatmentRecommendationsTab
        treatmentStartDate="2024-01-15"
        formData={mockFormData}
        onRecommendationsChange={mockOnRecommendationsChange}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    const checkbox = screen.getByTestId("no-treatmentRecommendations-checkbox");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);

    expect(mockOnFormDataChange).toHaveBeenCalledWith(
      "noTreatmentRecommendations",
      true,
    );
  });

  it("should pass disabled to TreatmentRecommendationsSection when noTreatmentRecommendations is true", () => {
    const formDataWithNoTreatmentRecommendations = {
      ...mockFormData,
      noTreatmentRecommendations: true,
    };

    render(
      <TreatmentRecommendationsTab
        treatmentStartDate="2024-01-15"
        formData={formDataWithNoTreatmentRecommendations}
        onRecommendationsChange={mockOnRecommendationsChange}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    const section = screen.getByTestId("treatmentRecommendations-section");
    expect(section).toHaveAttribute("data-disabled", "true");
  });

  it("should pass disabled false to TreatmentRecommendationsSection when noTreatmentRecommendations is false", () => {
    render(
      <TreatmentRecommendationsTab
        treatmentStartDate="2024-01-15"
        formData={mockFormData}
        onRecommendationsChange={mockOnRecommendationsChange}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    const section = screen.getByTestId("treatmentRecommendations-section");
    expect(section).toHaveAttribute("data-disabled", "false");
  });

  it("should handle different formData structures with treatments", () => {
    const alternativeFormData = {
      ...mockFormData,
      recommendations: {
        returnWeeks: 6,
        returnWhenTreatmentComplete: false,
        physiotherapy: {
          startDate: "2024-01-01",
          treatments: [
            {
              locations: ["test"],
              color: "blue",
              duration: 10,
              quantity: 5,
              startDate: "2024-01-01",
            },
          ],
        },
        tens: {
          startDate: "2024-01-01",
          treatments: [
            {
              locations: ["test"],
              quantity: 5,
              startDate: "2024-01-01",
            },
          ],
        },
      },
    };

    render(
      <TreatmentRecommendationsTab
        treatmentStartDate="2024-01-15"
        formData={alternativeFormData}
        onRecommendationsChange={mockOnRecommendationsChange}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    expect(
      screen.getByTestId("treatmentRecommendations-section"),
    ).toBeInTheDocument();
  });
});
