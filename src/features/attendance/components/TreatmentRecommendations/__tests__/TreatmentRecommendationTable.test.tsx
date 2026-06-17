/**
 * TreatmentRecommendationTable Component Tests
 *
 * Tests the table-based treatment form with LocationChipInput,
 * add row via button/ref, and physiotherapy vs tens treatment types.
 */

import React from "react";
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import TreatmentRecommendationTable from "../TreatmentRecommendationTable";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockBodyLocationsData = {
  active: [
    { id: 1, value: "Head", isActive: true, usageCount: 5 },
    { id: 2, value: "Chest", isActive: true, usageCount: 3 },
  ],
  all: [
    { id: 1, value: "Head", isActive: true, usageCount: 5 },
    { id: 2, value: "Chest", isActive: true, usageCount: 3 },
  ],
};

jest.mock("@/api/query/hooks/useScheduleSettingQueries", () => {
  const actual = jest.requireActual<
    typeof import("@/api/query/hooks/useScheduleSettingQueries")
  >("@/api/query/hooks/useScheduleSettingQueries");
  return {
    ...actual,
    useScheduleSettings: jest.fn(() => ({
      data: Array.from({ length: 7 }, (_, i) => ({
        id: i + 1,
        dayOfWeek: i,
        startTime: "08:00",
        endTime: "18:00",
        maxConcurrentAssessment: 2,
        maxConcurrentPhysiotherapyTens: 2,
        isActive: true,
        createdAt: "2024-01-01T00:00:00",
        updatedAt: "2024-01-01T00:00:00",
      })),
      isLoading: false,
    })),
  };
});

jest.mock("@/api/query/hooks/useSystemOptionsQueries", () => ({
  useBodyLocations: jest.fn((includeInactive = false) => ({
    data: includeInactive
      ? mockBodyLocationsData.all
      : mockBodyLocationsData.active,
    isLoading: false,
  })),
  useColors: jest.fn(() => ({
    data: [
      { id: 1, value: "Red", isActive: true, usageCount: 3 },
      { id: 2, value: "Blue", isActive: true, usageCount: 1 },
    ],
    isLoading: false,
  })),
  useCreateBodyLocation: jest.fn(() => ({
    mutateAsync: jest.fn().mockResolvedValue({ value: "NewLocation" }),
    isPending: false,
  })),
}));

jest.mock("../LocationChipInput", () => {
  return function MockLocationChipInput({
    selectedLocations,
    onChange,
    disabled,
  }: {
    selectedLocations: string[];
    onChange: (locations: string[]) => void;
    disabled?: boolean;
  }) {
    return (
      <div data-testid="location-chip-input">
        <span data-testid="selected-count">{selectedLocations.length}</span>
        <button
          data-testid="add-head"
          onClick={() => onChange([...selectedLocations, "Head"])}
          disabled={disabled}
        >
          Add Head
        </button>
        <button
          data-testid="add-chest"
          onClick={() => onChange([...selectedLocations, "Chest"])}
          disabled={disabled}
        >
          Add Chest
        </button>
      </div>
    );
  };
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("TreatmentRecommendationTable", () => {
  const mockOnChange = jest.fn();

  const defaultProps = {
    treatmentType: "physiotherapy" as const,
    treatments: [] as Array<{
      locations: string[];
      color?: string;
      duration?: number;
      quantity: number;
      startDate: string;
    }>,
    onChange: mockOnChange,
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render empty state with full-width add button when no treatments", () => {
      render(<TreatmentRecommendationTable {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      const addButton = screen.getByRole("button", {
        name: /Adicionar Tratamento/i,
      });
      expect(addButton).toBeInTheDocument();
      expect(addButton).toHaveClass("w-full");
    });

    it("should render table with treatments for physiotherapy", () => {
      const treatments = [
        {
          locations: ["Head"],
          color: "Blue",
          duration: 1,
          quantity: 2,
          startDate: "2024-01-22",
        },
      ];

      render(
        <TreatmentRecommendationTable
          {...defaultProps}
          treatments={treatments}
        />,
        { wrapper: TestWrapper },
      );

      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "Locais do Corpo" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "Cor" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "Tempo" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "Quantidade" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "Data Início" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Head")).toBeInTheDocument();
      expect(screen.getByText("Blue")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Adicionar Tratamento/i }),
      ).toBeInTheDocument();
    });

    it("should render table for tens treatment without color and duration columns", () => {
      const treatments = [
        {
          locations: ["Chest"],
          quantity: 1,
          startDate: "2024-01-22",
        },
      ];

      render(
        <TreatmentRecommendationTable
          {...defaultProps}
          treatmentType="tens"
          treatments={treatments}
        />,
        { wrapper: TestWrapper },
      );

      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.queryByText("Cor")).not.toBeInTheDocument();
      expect(screen.queryByText("Tempo")).not.toBeInTheDocument();
      expect(screen.getByText("Chest")).toBeInTheDocument();
    });
  });

  describe("Add Row", () => {
    it("should add physiotherapy row when add button is clicked", async () => {
      const user = userEvent.setup();

      render(<TreatmentRecommendationTable {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      await user.click(
        screen.getByRole("button", { name: /Adicionar Tratamento/i }),
      );

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([
          expect.objectContaining({
            locations: [],
            color: "",
            duration: 1,
            quantity: 1,
            startDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          }),
        ]);
      });
    });

    it("should not render add button in edit mode", () => {
      render(<TreatmentRecommendationTable {...defaultProps} mode="edit" />, {
        wrapper: TestWrapper,
      });

      expect(
        screen.queryByRole("button", { name: /Adicionar Tratamento/i }),
      ).not.toBeInTheDocument();
    });

    it("should disable add button when disabled", () => {
      render(
        <TreatmentRecommendationTable {...defaultProps} disabled={true} />,
        { wrapper: TestWrapper },
      );

      expect(
        screen.getByRole("button", { name: /Adicionar Tratamento/i }),
      ).toBeDisabled();
    });

    it("should add physiotherapy row when ref.addRow() is called", async () => {
      const ref = React.createRef<{ addRow: () => void }>();

      render(<TreatmentRecommendationTable {...defaultProps} ref={ref} />, {
        wrapper: TestWrapper,
      });

      act(() => {
        ref.current?.addRow();
      });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([
          expect.objectContaining({
            locations: [],
            color: "",
            duration: 1,
            quantity: 1,
            startDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          }),
        ]);
      });
    });

    it("should add tens row when ref.addRow() is called", async () => {
      const ref = React.createRef<{ addRow: () => void }>();

      render(
        <TreatmentRecommendationTable
          {...defaultProps}
          treatmentType="tens"
          ref={ref}
        />,
        { wrapper: TestWrapper },
      );

      act(() => {
        ref.current?.addRow();
      });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([
          expect.objectContaining({
            locations: [],
            quantity: 1,
            startDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          }),
        ]);
        const call = mockOnChange.mock.calls[0][0][0] as Record<
          string,
          unknown
        >;
        expect(call).not.toHaveProperty("color");
        expect(call).not.toHaveProperty("duration");
      });
    });

    it("should use defaultQuantity when provided", async () => {
      const ref = React.createRef<{ addRow: () => void }>();

      render(
        <TreatmentRecommendationTable
          {...defaultProps}
          ref={ref}
          defaultQuantity={5}
        />,
        { wrapper: TestWrapper },
      );

      act(() => {
        ref.current?.addRow();
      });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([
          expect.objectContaining({ quantity: 5 }),
        ]);
      });
    });
  });

  describe("Edit and Remove", () => {
    it("should call onChange when quantity is changed", async () => {
      const user = userEvent.setup();
      const treatments = [
        {
          locations: ["Head"],
          color: "Blue",
          duration: 1,
          quantity: 2,
          startDate: "2024-01-22",
        },
      ];

      render(
        <TreatmentRecommendationTable
          {...defaultProps}
          treatments={treatments}
        />,
        { wrapper: TestWrapper },
      );

      const row = screen.getByText("Head").closest("tr");
      await user.click(row!);

      const quantityInput = await screen.findByDisplayValue("2");
      fireEvent.change(quantityInput, { target: { value: "3" } });

      expect(mockOnChange).toHaveBeenLastCalledWith([
        expect.objectContaining({ quantity: 3 }),
      ]);
    });

    it("should remove row when remove button is clicked", async () => {
      const user = userEvent.setup();
      const treatments = [
        {
          locations: ["Head"],
          color: "Blue",
          duration: 1,
          quantity: 1,
          startDate: "2024-01-22",
        },
      ];

      render(
        <TreatmentRecommendationTable
          {...defaultProps}
          treatments={treatments}
        />,
        { wrapper: TestWrapper },
      );

      const removeButton = screen.getByTitle(/remover tratamento/i);
      await user.click(removeButton);

      expect(mockOnChange).toHaveBeenCalledWith([]);
    });
  });

  describe("Disabled State", () => {
    it("should not switch to edit mode when disabled", async () => {
      const user = userEvent.setup();
      const treatments = [
        {
          locations: ["Head"],
          color: "Blue",
          duration: 1,
          quantity: 1,
          startDate: "2024-01-22",
        },
      ];

      render(
        <TreatmentRecommendationTable
          {...defaultProps}
          treatments={treatments}
          disabled={true}
        />,
        { wrapper: TestWrapper },
      );

      const row = screen.getByText("Head").closest("tr");
      if (row) await user.click(row);

      expect(
        screen.queryByTestId("location-chip-input"),
      ).not.toBeInTheDocument();
    });
  });
});
