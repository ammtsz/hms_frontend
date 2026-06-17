/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import GeneralRecommendationsTab from "../GeneralRecommendationsTab";
import type { PostConsultationFormData } from "../../../hooks/usePostAttendanceForm";

describe("GeneralRecommendationsTab", () => {
  const mockFormData: PostConsultationFormData = {
    mainComplaint: "Test complaint",
    patientStatus: "N",
    startDate: "2024-01-01",
    returnWeeks: 4,
    food: "Test food recommendations",
    water: "2L per day",
    ointments: "Test ointment",
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

    expect(screen.getByText("Recomendações Gerais")).toBeInTheDocument();
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
        "Forneça orientações gerais sobre alimentação, hidratação e cuidados complementares.",
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

    expect(screen.getByLabelText("Alimentação")).toHaveValue(
      "Test food recommendations",
    );
    expect(screen.getByLabelText("Água")).toHaveValue("2L per day");
    expect(screen.getByLabelText("Pomadas")).toHaveValue("Test ointment");
  });

  it("should call onFormDataChange when food textarea changes", () => {
    render(
      <GeneralRecommendationsTab
        formData={mockFormData}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    const foodTextarea = screen.getByLabelText("Alimentação");
    fireEvent.change(foodTextarea, {
      target: { value: "New food recommendation" },
    });

    expect(mockOnFormDataChange).toHaveBeenCalledWith(
      "food",
      "New food recommendation",
    );
  });

  it("should call onFormDataChange when water input changes", () => {
    render(
      <GeneralRecommendationsTab
        formData={mockFormData}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    const waterInput = screen.getByLabelText("Água");
    fireEvent.change(waterInput, { target: { value: "3L per day" } });

    expect(mockOnFormDataChange).toHaveBeenCalledWith("water", "3L per day");
  });

  it("should call onFormDataChange when ointments input changes", () => {
    render(
      <GeneralRecommendationsTab
        formData={mockFormData}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    const ointmentsInput = screen.getByLabelText("Pomadas");
    fireEvent.change(ointmentsInput, { target: { value: "New ointment" } });

    expect(mockOnFormDataChange).toHaveBeenCalledWith(
      "ointments",
      "New ointment",
    );
  });

  it("should display placeholder texts correctly", () => {
    render(
      <GeneralRecommendationsTab
        formData={{ ...mockFormData, food: "", water: "", ointments: "" }}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    expect(
      screen.getByPlaceholderText(
        "Recomendações alimentares (ex: evitar carnes vermelhas, priorizar vegetais, etc.)",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Ex: 2L de água por dia"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Pomadas recomendadas..."),
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
      screen.getByText(
        "Orientações específicas sobre dieta e alimentação durante o tratamento",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Quantidade e tipo de água recomendada"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Produtos tópicos para aplicação externa"),
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

    // Text inputs and textareas have full styling; checkbox has different styling
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
      food: "",
      water: "",
      ointments: "",
    };

    render(
      <GeneralRecommendationsTab
        formData={emptyFormData}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    expect(screen.getByLabelText("Alimentação")).toHaveValue("");
    expect(screen.getByLabelText("Água")).toHaveValue("");
    expect(screen.getByLabelText("Pomadas")).toHaveValue("");
  });

  it("should call onFormDataChange with correct field names", () => {
    render(
      <GeneralRecommendationsTab
        formData={mockFormData}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    const foodTextarea = screen.getByLabelText("Alimentação");
    const waterInput = screen.getByLabelText("Água");
    const ointmentsInput = screen.getByLabelText("Pomadas");

    fireEvent.change(foodTextarea, { target: { value: "test" } });
    fireEvent.change(waterInput, { target: { value: "test" } });
    fireEvent.change(ointmentsInput, { target: { value: "test" } });

    expect(mockOnFormDataChange).toHaveBeenNthCalledWith(1, "food", "test");
    expect(mockOnFormDataChange).toHaveBeenNthCalledWith(2, "water", "test");
    expect(mockOnFormDataChange).toHaveBeenNthCalledWith(
      3,
      "ointments",
      "test",
    );
  });

  it("should have correct input types and attributes", () => {
    render(
      <GeneralRecommendationsTab
        formData={mockFormData}
        onFormDataChange={mockOnFormDataChange}
      />,
    );

    const foodTextarea = screen.getByLabelText("Alimentação");
    const waterInput = screen.getByLabelText("Água");
    const ointmentsInput = screen.getByLabelText("Pomadas");

    expect(foodTextarea.tagName.toLowerCase()).toBe("textarea");
    expect(foodTextarea).toHaveAttribute("rows", "3");
    expect(waterInput).toHaveAttribute("type", "text");
    expect(ointmentsInput).toHaveAttribute("type", "text");
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
      name: /nenhuma recomendação geral se aplica/i,
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
    it("should disable food, water and ointments fields when noGeneralRecommendations is true", () => {
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

      expect(screen.getByLabelText("Alimentação")).toBeDisabled();
      expect(screen.getByLabelText("Água")).toBeDisabled();
      expect(screen.getByLabelText("Pomadas")).toBeDisabled();
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

      const foodLabel = screen.getByText("Alimentação");
      const waterLabel = screen.getByText("Água");
      const ointmentsLabel = screen.getByText("Pomadas");

      expect(foodLabel).toHaveClass("text-gray-400");
      expect(waterLabel).toHaveClass("text-gray-400");
      expect(ointmentsLabel).toHaveClass("text-gray-400");
    });
  });
});
