/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import GeneralRecommendationsTab from "../GeneralRecommendationsTab";
import type { PostConsultationFormData } from "../../../hooks/usePostConsultationForm";

describe("GeneralRecommendationsTab", () => {
  const mockFormData: PostConsultationFormData = {
    mainConcern: "Test complaint",
    patientStatus: "N",
    startDate: "2024-01-01",
    returnWeeks: 4,
    homeExercises: "Stretching daily",
    painManagement: "Ice after activity",
    medications: "Ibuprofen as needed",
    recommendations: {
      returnWeeks: 4,
      returnWhenTreatmentComplete: false,
    },
    notes: "Test notes",
    noGeneralRecommendations: false,
    noTreatmentRecommendations: false,
  };

  const mockOnFormDataChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render without crashing", () => {
    render(
      <GeneralRecommendationsTab
        formData={mockFormData}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    expect(screen.getByText("General Recommendations")).toBeInTheDocument();
  });

  it("should display the description text", () => {
    render(
      <GeneralRecommendationsTab
        formData={mockFormData}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    expect(
      screen.getByText(
        "Provide guidance on home exercises, pain management, and medications.",
      ),
    ).toBeInTheDocument();
  });

  it("should display all form fields with correct values", () => {
    render(
      <GeneralRecommendationsTab
        formData={mockFormData}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    expect(screen.getByLabelText("Home Exercises")).toHaveValue(
      "Stretching daily",
    );
    expect(screen.getByLabelText("Pain Management")).toHaveValue(
      "Ice after activity",
    );
    expect(screen.getByLabelText("Medications")).toHaveValue(
      "Ibuprofen as needed",
    );
  });

  it("should call onFormDataChange when home exercises textarea changes", () => {
    render(
      <GeneralRecommendationsTab
        formData={mockFormData}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    const textarea = screen.getByLabelText("Home Exercises");
    fireEvent.change(textarea, {
      target: { value: "New exercise recommendation" },
    });

    expect(mockOnFormDataChange).toHaveBeenCalledWith(
      "homeExercises",
      "New exercise recommendation",
    );
  });

  it("should call onFormDataChange when pain management textarea changes", () => {
    render(
      <GeneralRecommendationsTab
        formData={mockFormData}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    const textarea = screen.getByLabelText("Pain Management");
    fireEvent.change(textarea, { target: { value: "Rest and ice" } });

    expect(mockOnFormDataChange).toHaveBeenCalledWith(
      "painManagement",
      "Rest and ice",
    );
  });

  it("should call onFormDataChange when medications input changes", () => {
    render(
      <GeneralRecommendationsTab
        formData={mockFormData}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    const input = screen.getByLabelText("Medications");
    fireEvent.change(input, { target: { value: "New medication" } });

    expect(mockOnFormDataChange).toHaveBeenCalledWith(
      "medications",
      "New medication",
    );
  });

  it("should display placeholder texts correctly", () => {
    render(
      <GeneralRecommendationsTab
        formData={{
          ...mockFormData,
          homeExercises: "",
          painManagement: "",
          medications: "",
        }}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    expect(
      screen.getByPlaceholderText(
        "Home exercise recommendations (e.g. stretching, strengthening, etc.)",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        "Pain management guidance (e.g. ice/heat, rest, posture, etc.)",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Recommended medications or supplements..."),
    ).toBeInTheDocument();
  });

  it("should display helper texts for each field", () => {
    render(
      <GeneralRecommendationsTab
        formData={mockFormData}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    expect(
      screen.getByText("Exercises the patient should perform at home"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Strategies for managing pain between sessions"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Medication recommendations or reminders"),
    ).toBeInTheDocument();
  });

  it("should have proper form structure and styling", () => {
    const { container } = render(
      <GeneralRecommendationsTab
        formData={mockFormData}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass("space-y-6");

    const textInputs = container.querySelectorAll(
      "input[type='text'], textarea",
    );
    textInputs.forEach((input) => {
      expect(input).toHaveClass(
        "w-full",
        "px-3",
        "py-2",
        "border",
        "border-gray-300",
        "rounded-md",
      );
    });
  });

  it("should handle empty form data correctly", () => {
    const emptyFormData = {
      ...mockFormData,
      homeExercises: "",
      painManagement: "",
      medications: "",
    };

    render(
      <GeneralRecommendationsTab
        formData={emptyFormData}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    expect(screen.getByLabelText("Home Exercises")).toHaveValue("");
    expect(screen.getByLabelText("Pain Management")).toHaveValue("");
    expect(screen.getByLabelText("Medications")).toHaveValue("");
  });

  it("should call onFormDataChange with correct field names", () => {
    render(
      <GeneralRecommendationsTab
        formData={mockFormData}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    const homeExercises = screen.getByLabelText("Home Exercises");
    const painManagement = screen.getByLabelText("Pain Management");
    const medications = screen.getByLabelText("Medications");

    fireEvent.change(homeExercises, { target: { value: "test" } });
    fireEvent.change(painManagement, { target: { value: "test" } });
    fireEvent.change(medications, { target: { value: "test" } });

    expect(mockOnFormDataChange).toHaveBeenNthCalledWith(
      1,
      "homeExercises",
      "test",
    );
    expect(mockOnFormDataChange).toHaveBeenNthCalledWith(
      2,
      "painManagement",
      "test",
    );
    expect(mockOnFormDataChange).toHaveBeenNthCalledWith(3, "medications", "test");
  });

  it("should have correct input types and attributes", () => {
    render(
      <GeneralRecommendationsTab
        formData={mockFormData}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    const homeExercises = screen.getByLabelText("Home Exercises");
    const painManagement = screen.getByLabelText("Pain Management");
    const medications = screen.getByLabelText("Medications");

    expect(homeExercises.tagName.toLowerCase()).toBe("textarea");
    expect(homeExercises).toHaveAttribute("rows", "3");
    expect(painManagement.tagName.toLowerCase()).toBe("textarea");
    expect(painManagement).toHaveAttribute("rows", "3");
    expect(medications).toHaveAttribute("type", "text");
  });

  it("should maintain focus styles", () => {
    const { container } = render(
      <GeneralRecommendationsTab
        formData={mockFormData}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    const textInputs = container.querySelectorAll(
      "input[type='text'], textarea",
    );
    textInputs.forEach((input) => {
      expect(input).toHaveClass(
        "focus:outline-none",
        "focus:ring-2",
        "focus:ring-blue-500",
        "focus:border-blue-500",
      );
    });
  });

  it("should render and toggle no general recommendations checkbox", () => {
    render(
      <GeneralRecommendationsTab
        formData={mockFormData}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /No general recommendations apply/i,
    });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);

    expect(mockOnFormDataChange).toHaveBeenCalledWith(
      "noGeneralRecommendations",
      true,
    );
  });

  describe("disabled state when no general recommendations is checked", () => {
    it("should disable recommendation fields when noGeneralRecommendations is true", () => {
      const formDataWithNoRecommendations = {
        ...mockFormData,
        noGeneralRecommendations: true,
      };

      render(
        <GeneralRecommendationsTab
          formData={formDataWithNoRecommendations}
          onFormDataChange={mockOnFormDataChange}
        />,
      );

      expect(screen.getByLabelText("Home Exercises")).toBeDisabled();
      expect(screen.getByLabelText("Pain Management")).toBeDisabled();
      expect(screen.getByLabelText("Medications")).toBeDisabled();
    });

    it("should apply lighter label styling when noGeneralRecommendations is true", () => {
      const formDataWithNoRecommendations = {
        ...mockFormData,
        noGeneralRecommendations: true,
      };

      render(
        <GeneralRecommendationsTab
          formData={formDataWithNoRecommendations}
          onFormDataChange={mockOnFormDataChange}
        />,
      );

      const homeExercisesLabel = screen.getByText("Home Exercises");
      const painManagementLabel = screen.getByText("Pain Management");
      const medicationsLabel = screen.getByText("Medications");

      expect(homeExercisesLabel).toHaveClass("text-gray-400");
      expect(painManagementLabel).toHaveClass("text-gray-400");
      expect(medicationsLabel).toHaveClass("text-gray-400");
    });
  });
});
