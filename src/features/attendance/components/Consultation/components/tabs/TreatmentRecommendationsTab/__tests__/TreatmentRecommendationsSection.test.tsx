/**
 * TreatmentRecommendationsSection Component Tests
 *
 * Test suite for the TreatmentRecommendationsSection component covering:
 * - Component rendering and initialization
 * - Physiotherapy treatment management
 * - TENS treatment management
 * - TreatmentRecommendationTable integration
 * - Auto-initialization of treatment structures
 */

import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import TreatmentRecommendationsSection from "../TreatmentRecommendationsSection";
import type { TreatmentRecommendation } from "../../../../types";

// Mock TreatmentRecommendationTable component
jest.mock(
  "@/features/attendance/components/TreatmentRecommendations/TreatmentRecommendationTable",
  () => {
    const MockTreatmentRecommendationTable = ({
      treatmentType,
      treatments,
      onChange,
      disabled = false,
    }: {
      treatmentType: string;
      treatments: unknown[];
      onChange: (treatments: unknown[]) => void;
      disabled?: boolean;
    }) => (
      <div data-testid={`treatment-location-form-${treatmentType}`}>
        <div data-testid={`form-disabled-${treatmentType}`}>
          {disabled ? "disabled" : "enabled"}
        </div>
        <div>Treatment Type: {treatmentType}</div>
        <div>Treatments Count: {treatments.length}</div>
        <button
          data-testid={`add-treatment-${treatmentType}`}
          onClick={() => {
            if (disabled) return;
            const newTreatment =
              treatmentType === "physiotherapy"
                ? {
                    locations: ["test-location"],
                    color: "blue",
                    duration: 1,
                    quantity: 1,
                    startDate: "2024-01-22",
                  }
                : {
                    locations: ["test-location"],
                    quantity: 1,
                    startDate: "2024-01-22",
                  };
            onChange([...treatments, newTreatment]);
          }}
          disabled={disabled}
        >
          Add Treatment
        </button>
        <button
          data-testid={`remove-treatment-${treatmentType}`}
          onClick={() => onChange(treatments.slice(0, -1))}
          disabled={treatments.length === 0 || disabled}
        >
          Remove Last Treatment
        </button>
      </div>
    );
    MockTreatmentRecommendationTable.displayName =
      "MockTreatmentRecommendationTable";
    return MockTreatmentRecommendationTable;
  },
);

describe("TreatmentRecommendationsSection", () => {
  const mockOnChange = jest.fn();

  const mockEmptyRecommendations: TreatmentRecommendation = {
    returnWeeks: 1,
    returnWhenTreatmentComplete: false,
  };

  const mockRecommendationsWithPhysiotherapy: TreatmentRecommendation = {
    returnWeeks: 1,
    returnWhenTreatmentComplete: false,
    physiotherapy: {
      startDate: "2024-01-15",
      treatments: [
        {
          locations: ["chest", "back"],
          color: "blue",
          duration: 2,
          quantity: 3,
          startDate: "2024-01-22",
        },
      ],
    },
  };

  const mockRecommendationsWithTens: TreatmentRecommendation = {
    returnWeeks: 1,
    returnWhenTreatmentComplete: false,
    tens: {
      startDate: "2024-01-15",
      treatments: [
        {
          locations: ["left-arm"],
          quantity: 2,
          startDate: "2024-01-22",
        },
      ],
    },
  };

  const mockRecommendationsWithBoth: TreatmentRecommendation = {
    returnWeeks: 1,
    returnWhenTreatmentComplete: false,
    physiotherapy: {
      startDate: "2024-01-15",
      treatments: [
        {
          locations: ["chest"],
          color: "red",
          duration: 1,
          quantity: 1,
          startDate: "2024-01-22",
        },
      ],
    },
    tens: {
      startDate: "2024-01-15",
      treatments: [
        {
          locations: ["right-leg"],
          quantity: 1,
          startDate: "2024-01-22",
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-15T10:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Component Rendering", () => {
    it("should render both treatment section headers with borders", () => {
      render(
        <TreatmentRecommendationsSection
          recommendations={mockEmptyRecommendations}
          onChange={mockOnChange}
          treatmentStartDate="2024-01-15"
        />,
      );

      expect(
        screen.getByText("Recomendações de Tratamento"),
      ).toBeInTheDocument();
      expect(screen.getByText("Fisioterapia")).toBeInTheDocument();
      expect(screen.getByText("TENS")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Adicionar Tratamento/i }),
      ).not.toBeInTheDocument();

      // Forms are initially not rendered until structures are initialized
      // The useEffect will call onChange to initialize them
      expect(mockOnChange).toHaveBeenCalled();
    });

    it("should describe add button below the table in physiotherapy instructions", () => {
      render(
        <TreatmentRecommendationsSection
          recommendations={mockRecommendationsWithPhysiotherapy}
          onChange={mockOnChange}
          treatmentStartDate="2024-01-15"
        />,
      );

      const physiotherapySection = screen
        .getByText("Fisioterapia")
        .closest("div.border-2");
      expect(physiotherapySection).not.toBeNull();

      fireEvent.click(
        within(physiotherapySection as HTMLElement).getByRole("button", {
          name: /Como configurar/i,
        }),
      );

      expect(
        screen.getByText(/abaixo para criar uma nova linha/i),
      ).toBeInTheDocument();
    });

    it("should render with physiotherapy recommendations", () => {
      render(
        <TreatmentRecommendationsSection
          recommendations={mockRecommendationsWithPhysiotherapy}
          onChange={mockOnChange}
          treatmentStartDate="2024-01-15"
        />,
      );

      expect(
        screen.getByTestId("treatment-location-form-physiotherapy"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Treatment Type: physiotherapy"),
      ).toBeInTheDocument();
      expect(screen.getByText("Treatments Count: 1")).toBeInTheDocument();
    });

    it("should render with tens recommendations", () => {
      render(
        <TreatmentRecommendationsSection
          recommendations={mockRecommendationsWithTens}
          onChange={mockOnChange}
          treatmentStartDate="2024-01-15"
        />,
      );

      expect(
        screen.getByTestId("treatment-location-form-tens"),
      ).toBeInTheDocument();
      expect(screen.getByText("Treatment Type: tens")).toBeInTheDocument();
      expect(screen.getByText("Treatments Count: 1")).toBeInTheDocument();
    });

    it("should render with both treatment types with treatments", () => {
      render(
        <TreatmentRecommendationsSection
          recommendations={mockRecommendationsWithBoth}
          onChange={mockOnChange}
          treatmentStartDate="2024-01-15"
        />,
      );

      expect(
        screen.getByTestId("treatment-location-form-physiotherapy"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("treatment-location-form-tens"),
      ).toBeInTheDocument();
    });
  });

  describe("Physiotherapy Treatment Management", () => {
    it("should auto-initialize physiotherapy treatment structure on mount", () => {
      render(
        <TreatmentRecommendationsSection
          recommendations={mockEmptyRecommendations}
          onChange={mockOnChange}
          treatmentStartDate="2024-01-15"
        />,
      );

      // Should call onChange to initialize empty structures
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          physiotherapy: expect.objectContaining({
            startDate: expect.any(String),
            treatments: [],
          }),
          tens: expect.objectContaining({
            startDate: expect.any(String),
            treatments: [],
          }),
        }),
      );
    });

    it("should update physiotherapy treatments through TreatmentRecommendationTable", () => {
      render(
        <TreatmentRecommendationsSection
          recommendations={mockRecommendationsWithPhysiotherapy}
          onChange={mockOnChange}
          treatmentStartDate="2024-01-15"
        />,
      );

      const addButton = screen.getByTestId("add-treatment-physiotherapy");
      fireEvent.click(addButton);

      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockRecommendationsWithPhysiotherapy,
        physiotherapy: {
          ...mockRecommendationsWithPhysiotherapy.physiotherapy!,
          treatments: [
            ...mockRecommendationsWithPhysiotherapy.physiotherapy!.treatments,
            {
              locations: ["test-location"],
              color: "blue",
              duration: 1,
              quantity: 1,
              startDate: "2024-01-22",
            },
          ],
        },
      });
    });
  });

  describe("TENS Treatment Management", () => {
    it("should update tens treatments through TreatmentRecommendationTable", () => {
      render(
        <TreatmentRecommendationsSection
          recommendations={mockRecommendationsWithTens}
          onChange={mockOnChange}
          treatmentStartDate="2024-01-15"
        />,
      );

      const addButton = screen.getByTestId("add-treatment-tens");
      fireEvent.click(addButton);

      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockRecommendationsWithTens,
        tens: {
          ...mockRecommendationsWithTens.tens!,
          treatments: [
            ...mockRecommendationsWithTens.tens!.treatments,
            {
              locations: ["test-location"],
              quantity: 1,
              startDate: "2024-01-22",
            },
          ],
        },
      });
    });
  });

  describe("Disabled state", () => {
    it("should pass disabled to TreatmentRecommendationTable when disabled prop is true", () => {
      render(
        <TreatmentRecommendationsSection
          recommendations={mockRecommendationsWithPhysiotherapy}
          onChange={mockOnChange}
          treatmentStartDate="2024-01-15"
          disabled={true}
        />,
      );

      expect(
        screen.getByTestId("form-disabled-physiotherapy"),
      ).toHaveTextContent("disabled");
    });

    it("should disable add treatment buttons when disabled prop is true", () => {
      render(
        <TreatmentRecommendationsSection
          recommendations={mockRecommendationsWithPhysiotherapy}
          onChange={mockOnChange}
          treatmentStartDate="2024-01-15"
          disabled={true}
        />,
      );

      const addButton = screen.getByTestId("add-treatment-physiotherapy");
      expect(addButton).toBeDisabled();
    });

    it("should not call onChange when add treatment is clicked while disabled", () => {
      render(
        <TreatmentRecommendationsSection
          recommendations={mockRecommendationsWithPhysiotherapy}
          onChange={mockOnChange}
          treatmentStartDate="2024-01-15"
          disabled={true}
        />,
      );

      mockOnChange.mockClear();
      const addButton = screen.getByTestId("add-treatment-physiotherapy");
      fireEvent.click(addButton);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("should apply lighter title styling when disabled", () => {
      render(
        <TreatmentRecommendationsSection
          recommendations={mockRecommendationsWithPhysiotherapy}
          onChange={mockOnChange}
          treatmentStartDate="2024-01-15"
          disabled={true}
        />,
      );

      const mainTitle = screen.getByText("Recomendações de Tratamento");
      const physiotherapyTitle = screen.getByText("Fisioterapia");

      expect(mainTitle).toHaveClass("text-gray-400");
      expect(physiotherapyTitle).toHaveClass("text-gray-400");
    });

    it("should disable notes textarea when disabled and has active treatments", () => {
      render(
        <TreatmentRecommendationsSection
          recommendations={mockRecommendationsWithBoth}
          onChange={mockOnChange}
          treatmentStartDate="2024-01-15"
          disabled={true}
        />,
      );

      const notesTextarea = screen.getByPlaceholderText(
        /observações sobre as sessões de fisioterapia e TENS/i,
      );
      expect(notesTextarea).toBeDisabled();
    });
  });

  describe("Integration Tests", () => {
    it("should manage both treatment types independently", () => {
      render(
        <TreatmentRecommendationsSection
          recommendations={mockRecommendationsWithBoth}
          onChange={mockOnChange}
          treatmentStartDate="2024-01-15"
        />,
      );

      // Both forms should be visible
      expect(
        screen.getByTestId("treatment-location-form-physiotherapy"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("treatment-location-form-tens"),
      ).toBeInTheDocument();

      // Add treatment to physiotherapy
      const physiotherapyAddButton = screen.getByTestId(
        "add-treatment-physiotherapy",
      );
      fireEvent.click(physiotherapyAddButton);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          physiotherapy: expect.objectContaining({
            treatments: expect.arrayContaining([
              expect.objectContaining({ locations: ["chest"] }),
              expect.objectContaining({ locations: ["test-location"] }),
            ]),
          }),
        }),
      );
    });
  });
});
