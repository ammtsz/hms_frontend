import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import TreatmentRecommendationTable from "../TreatmentRecommendationTable";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the hooks
const mockCreateBodyLocation = jest.fn();
const mockBodyLocationsData = {
  active: [
    { id: 1, value: "Head", isActive: true, usageCount: 5 },
    { id: 3, value: "Arm", isActive: true, usageCount: 2 },
  ],
  all: [
    { id: 1, value: "Head", isActive: true, usageCount: 5 },
    { id: 2, value: "Chest", isActive: false, usageCount: 10 },
    { id: 3, value: "Arm", isActive: true, usageCount: 2 },
    { id: 4, value: "Leg", isActive: false, usageCount: 0 },
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
    mutateAsync: mockCreateBodyLocation,
    isPending: false,
  })),
}));

// Mock LocationChipInput to simulate user interactions
jest.mock("../LocationChipInput", () => {
  return function LocationChipInput({
    selectedLocations,
    availableLocations,
    onChange,
    onCreateNew,
    disabled,
    isCreating,
  }: {
    selectedLocations: string[];
    availableLocations: string[];
    onChange: (locations: string[]) => void;
    onCreateNew: (value: string) => Promise<string>;
    disabled?: boolean;
    isCreating?: boolean;
  }) {
    const [inputValue, setInputValue] = React.useState("");

    return (
      <div data-testid="location-chip-input">
        <div data-testid="selected-locations">
          {selectedLocations.map((loc, idx) => (
            <span key={idx} data-testid={`location-chip-${idx}`}>
              {loc}
            </span>
          ))}
        </div>
        <input
          data-testid="location-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={disabled || isCreating}
          placeholder="Search or create..."
        />
        <div data-testid="available-locations">
          {availableLocations.map((loc) => (
            <button
              key={loc}
              data-testid={`select-${loc}`}
              onClick={() => onChange([...selectedLocations, loc])}
            >
              {loc}
            </button>
          ))}
        </div>
        <button
          data-testid="create-new-location"
          onClick={async () => {
            try {
              const newLocation = await onCreateNew(inputValue);
              onChange([...selectedLocations, newLocation]);
              setInputValue("");
            } catch (error) {
              // Error will be handled by parent
              console.error("Failed to create:", error);
            }
          }}
          disabled={!inputValue.trim() || disabled}
        >
          Create &quot{inputValue}&quot
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

describe("TreatmentRecommendationTable - Inactive Location Feedback", () => {
  const mockOnChange = jest.fn();

  const defaultProps = {
    treatmentType: "physiotherapy" as const,
    treatments: [],
    onChange: mockOnChange,
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateBodyLocation.mockReset();
  });

  it("should show error message when trying to create an inactive body location", async () => {
    const user = userEvent.setup();

    // Start with existing treatment to enable editing
    const existingTreatments = [
      {
        locations: [],
        color: "",
        duration: 1,
        quantity: 1,
        startDate: "2026-02-17",
      },
    ];

    render(
      <TreatmentRecommendationTable
        {...defaultProps}
        treatments={existingTreatments}
      />,
      {
        wrapper: TestWrapper,
      },
    );

    // Click on the table row to start editing
    const row = screen.getByText(/nenhum local selecionado/i).closest("tr");
    expect(row).toBeInTheDocument();
    await user.click(row!);

    // Wait for the row to be in editing mode
    await waitFor(() => {
      expect(screen.getByTestId("location-chip-input")).toBeInTheDocument();
    });

    // Try to create "Chest" which is inactive
    const input = screen.getByTestId("location-input");
    await user.type(input, "Chest");

    // Mock the API to reject with conflict error
    const error = new Error("Este nome já existe para este tipo de opção");
    mockCreateBodyLocation.mockRejectedValue(error);

    // Click create button
    const createButton = screen.getByTestId("create-new-location");
    await user.click(createButton);

    // Verify error message appears
    await waitFor(() => {
      expect(
        screen.getByText(
          /O local "Chest" já existe, mas está inativo\. Ative-o nas configurações de tratamentos para utilizá-lo\./i,
        ),
      ).toBeInTheDocument();
    });
  });

  it("should show specific message for inactive location with correct name", async () => {
    const user = userEvent.setup();

    const existingTreatments = [
      {
        locations: [],
        color: "",
        duration: 1,
        quantity: 1,
        startDate: "2026-02-17",
      },
    ];

    render(
      <TreatmentRecommendationTable
        {...defaultProps}
        treatments={existingTreatments}
      />,
      {
        wrapper: TestWrapper,
      },
    );

    const row = screen.getByText(/nenhum local selecionado/i).closest("tr");
    await user.click(row!);

    await waitFor(() => {
      expect(screen.getByTestId("location-chip-input")).toBeInTheDocument();
    });

    const input = screen.getByTestId("location-input");
    await user.type(input, "leg"); // Case insensitive match for "Leg"

    const error = new Error("Este nome já existe para este tipo de opção");
    mockCreateBodyLocation.mockRejectedValue(error);

    const createButton = screen.getByTestId("create-new-location");
    await user.click(createButton);

    // Should show error with the correctly capitalized name from the database
    await waitFor(() => {
      expect(
        screen.getByText(
          'O local "Leg" já existe, mas está inativo. Ative-o nas configurações de tratamentos para utilizá-lo.',
        ),
      ).toBeInTheDocument();
    });
  });

  it("should show generic error for other creation failures", async () => {
    const user = userEvent.setup();

    const existingTreatments = [
      {
        locations: [],
        color: "",
        duration: 1,
        quantity: 1,
        startDate: "2026-02-17",
      },
    ];

    render(
      <TreatmentRecommendationTable
        {...defaultProps}
        treatments={existingTreatments}
      />,
      {
        wrapper: TestWrapper,
      },
    );

    const row = screen.getByText(/nenhum local selecionado/i).closest("tr");
    await user.click(row!);

    await waitFor(() => {
      expect(screen.getByTestId("location-chip-input")).toBeInTheDocument();
    });

    const input = screen.getByTestId("location-input");
    await user.type(input, "NewLocation");

    // Mock a different error (network error, etc.)
    const error = new Error("Network error");
    mockCreateBodyLocation.mockRejectedValue(error);

    const createButton = screen.getByTestId("create-new-location");
    await user.click(createButton);

    // Should show generic error message
    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  it("should clear error message when user changes quantity field", async () => {
    const user = userEvent.setup();

    const existingTreatments = [
      {
        locations: [],
        color: "",
        duration: 1,
        quantity: 1,
        startDate: "2026-02-17",
      },
    ];

    render(
      <TreatmentRecommendationTable
        {...defaultProps}
        treatments={existingTreatments}
      />,
      { wrapper: TestWrapper },
    );

    // Click on the row to start editing
    const row = screen.getByText(/nenhum local selecionado/i).closest("tr");
    if (row) await user.click(row);

    await waitFor(() => {
      expect(screen.getByTestId("location-chip-input")).toBeInTheDocument();
    });

    // Simulate creation error
    const input = screen.getByTestId("location-input");
    await user.type(input, "Chest");

    const error = new Error("Este nome já existe para este tipo de opção");
    mockCreateBodyLocation.mockRejectedValue(error);

    const createButton = screen.getByTestId("create-new-location");
    await user.click(createButton);

    // Verify error appears
    await waitFor(() => {
      expect(
        screen.getByText(/O local "Chest" já existe, mas está inativo/i),
      ).toBeInTheDocument();
    });

    // Change quantity field
    const quantityInput = screen.getByDisplayValue("1");
    await user.clear(quantityInput);
    await user.type(quantityInput, "2");

    // Error should be cleared
    await waitFor(() => {
      expect(
        screen.queryByText(/O local "Chest" já existe, mas está inativo/i),
      ).not.toBeInTheDocument();
    });
  });

  it("should clear error when row is removed", async () => {
    const user = userEvent.setup();

    const existingTreatments = [
      {
        locations: [],
        color: "",
        duration: 1,
        quantity: 1,
        startDate: "2026-02-17",
      },
    ];

    render(
      <TreatmentRecommendationTable
        {...defaultProps}
        treatments={existingTreatments}
      />,
      {
        wrapper: TestWrapper,
      },
    );

    const row = screen.getByText(/nenhum local selecionado/i).closest("tr");
    await user.click(row!);

    await waitFor(() => {
      expect(screen.getByTestId("location-chip-input")).toBeInTheDocument();
    });

    // Trigger error
    const input = screen.getByTestId("location-input");
    await user.type(input, "Chest");

    const error = new Error("Este nome já existe para este tipo de opção");
    mockCreateBodyLocation.mockRejectedValue(error);

    const createButton = screen.getByTestId("create-new-location");
    await user.click(createButton);

    // Verify error appears
    await waitFor(() => {
      expect(
        screen.getByText(/O local "Chest" já existe, mas está inativo/i),
      ).toBeInTheDocument();
    });

    // Remove the row
    const removeButton = screen.getByTitle(/remover tratamento/i);
    await user.click(removeButton);

    // Error should be gone (row is removed)
    await waitFor(() => {
      expect(
        screen.queryByText(/O local "Chest" já existe, mas está inativo/i),
      ).not.toBeInTheDocument();
    });
  });

  it("should clear error when user clicks outside the table", async () => {
    const user = userEvent.setup();

    const existingTreatments = [
      {
        locations: [],
        color: "",
        duration: 1,
        quantity: 1,
        startDate: "2026-02-17",
      },
    ];

    render(
      <TreatmentRecommendationTable
        {...defaultProps}
        treatments={existingTreatments}
      />,
      { wrapper: TestWrapper },
    );

    // Click row to edit
    const row = screen.getByText(/nenhum local selecionado/i).closest("tr");
    if (row) await user.click(row);

    await waitFor(() => {
      expect(screen.getByTestId("location-chip-input")).toBeInTheDocument();
    });

    // Trigger error
    const input = screen.getByTestId("location-input");
    await user.type(input, "Chest");

    const error = new Error("Este nome já existe para este tipo de opção");
    mockCreateBodyLocation.mockRejectedValue(error);

    const createButton = screen.getByTestId("create-new-location");
    await user.click(createButton);

    // Verify error appears
    await waitFor(() => {
      expect(
        screen.getByText(/O local "Chest" já existe, mas está inativo/i),
      ).toBeInTheDocument();
    });

    // Click outside the table (closing edit mode clears the error)
    fireEvent.mouseDown(document.body);

    // Error should be cleared
    await waitFor(() => {
      expect(
        screen.queryByText(/O local "Chest" já existe, mas está inativo/i),
      ).not.toBeInTheDocument();
    });
  });

  it("should handle case-insensitive matching for inactive locations", async () => {
    const user = userEvent.setup();

    const existingTreatments = [
      {
        locations: [],
        color: "",
        duration: 1,
        quantity: 1,
        startDate: "2026-02-17",
      },
    ];

    render(
      <TreatmentRecommendationTable
        {...defaultProps}
        treatments={existingTreatments}
      />,
      {
        wrapper: TestWrapper,
      },
    );

    const row = screen.getByText(/nenhum local selecionado/i).closest("tr");
    await user.click(row!);

    await waitFor(() => {
      expect(screen.getByTestId("location-chip-input")).toBeInTheDocument();
    });

    // Try variations of "Chest" (which is inactive)
    const testCases = ["chest", "CHEST", "ChEsT", " chest ", "  CHEST  "];

    for (const testCase of testCases) {
      const input = screen.getByTestId("location-input");
      await user.clear(input);
      await user.type(input, testCase);

      const error = new Error("Este nome já existe para este tipo de opção");
      mockCreateBodyLocation.mockRejectedValue(error);

      const createButton = screen.getByTestId("create-new-location");
      await user.click(createButton);

      // Should always show the properly formatted name "Chest"
      await waitFor(() => {
        expect(
          screen.getByText(
            'O local "Chest" já existe, mas está inativo. Ative-o nas configurações de tratamentos para utilizá-lo.',
          ),
        ).toBeInTheDocument();
      });

      // Clear error for next iteration by clicking on a different field
      if (testCase !== testCases[testCases.length - 1]) {
        const startDateInput = screen.getByDisplayValue("2026-02-17");
        await user.click(startDateInput);
        await waitFor(() => {
          expect(
            screen.queryByText('O local "Chest" já existe, mas está inativo.'),
          ).not.toBeInTheDocument();
        });
      }
    }
  });

  it("should not show inactive location error for active locations that conflict", async () => {
    const user = userEvent.setup();

    const existingTreatments = [
      {
        locations: [],
        color: "",
        duration: 1,
        quantity: 1,
        startDate: "2026-02-17",
      },
    ];

    render(
      <TreatmentRecommendationTable
        {...defaultProps}
        treatments={existingTreatments}
      />,
      {
        wrapper: TestWrapper,
      },
    );

    const row = screen.getByText(/nenhum local selecionado/i).closest("tr");
    await user.click(row!);

    await waitFor(() => {
      expect(screen.getByTestId("location-chip-input")).toBeInTheDocument();
    });

    // Try to create "Head" which is active (should show generic error)
    const input = screen.getByTestId("location-input");
    await user.type(input, "Head");

    const error = new Error("Este nome já existe para este tipo de opção");
    mockCreateBodyLocation.mockRejectedValue(error);

    const createButton = screen.getByTestId("create-new-location");
    await user.click(createButton);

    // Should show generic error, not the inactive-specific message
    await waitFor(() => {
      const errorMessage = screen.queryByText(
        /O local ".*" já existe, mas está inativo/i,
      );
      expect(errorMessage).not.toBeInTheDocument();

      // Should show the generic error message
      expect(
        screen.getByText(/Este nome já existe para este tipo de opção/i),
      ).toBeInTheDocument();
    });
  });
});
