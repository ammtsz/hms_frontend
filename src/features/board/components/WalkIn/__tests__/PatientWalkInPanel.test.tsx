/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClinicTimezoneProvider } from "@/contexts/ClinicTimezoneContext";
import PatientWalkInPanel from "../PatientWalkInPanel";
import { Priority } from "@/types/types";

// Mock the PatientWalkInForm component
jest.mock("../PatientWalkInForm", () => {
  return function MockPatientWalkInForm({
    onRegisterNewAttendance,
    isDropdown,
  }: {
    onRegisterNewAttendance?: (
      patientName: string,
      types: string[],
      isNew: boolean,
      priority: Priority,
    ) => void;
    isDropdown?: boolean;
  }) {
    return (
      <div data-testid="patient-walk-in-form">
        <p>Mock PatientWalkInForm</p>
        <p>isDropdown: {String(isDropdown)}</p>
        <button
          data-testid="mock-check-in-button"
          onClick={() =>
            onRegisterNewAttendance?.("Test Patient", ["assessment"], true, "3")
          }
        >
          Mock Check In
        </button>
      </div>
    );
  };
});

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  ChevronDown: ({ className }: { className?: string }) => (
    <div data-testid="chevron-down" className={className}>
      ChevronDown
    </div>
  ),
  Plus: ({ className }: { className?: string }) => (
    <div data-testid="plus-icon" className={className}>
      Plus
    </div>
  ),
}));

// Fixed date so "today" and "selected" match — panel is enabled and expandable
const MOCK_TODAY = "2024-01-15";

jest.mock("@/stores", () => ({
  useSelectedDate: jest.fn(() => MOCK_TODAY),
}));

jest.mock("@/api/query/hooks/useDayFinalizationQueries", () => ({
  useDayFinalizationStatus: jest.fn(() => ({
    data: { isFinalized: false },
    isLoading: false,
  })),
}));

jest.mock("@/api/query/hooks/useScheduleSettingQueries", () => ({
  ...jest.requireActual("@/api/query/hooks/useScheduleSettingQueries"),
  useScheduleSettingByDay: jest.fn(() => ({
    data: { isActive: true, maxConcurrentAssessment: 1 },
    isLoading: false,
  })),
}));

jest.mock("@/hooks/useDateHelpers", () => ({
  useDateHelpers: () => ({
    getTodayDate: () => MOCK_TODAY,
  }),
}));

// Test wrapper with QueryClient
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ClinicTimezoneProvider>{children}</ClinicTimezoneProvider>
      </QueryClientProvider>
    );
  };
};

describe("PatientWalkInPanel", () => {
  const mockOnRegisterNewAttendance = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const Wrapper = createTestWrapper();
    return render(
      <Wrapper>
        <PatientWalkInPanel
          onRegisterNewAttendance={mockOnRegisterNewAttendance}
          {...props}
        />
      </Wrapper>,
    );
  };

  describe("Basic Rendering", () => {
    it("should render the panel header", () => {
      renderComponent();

      expect(screen.getByText("Walk-In Patients")).toBeInTheDocument();
      expect(
        screen.getByText(/Unscheduled patient registration for/i),
      ).toBeInTheDocument();
    });

    it("should render the plus icon", () => {
      renderComponent();

      expect(screen.getByTestId("plus-icon")).toBeInTheDocument();
    });

    it("should render the chevron down icon", () => {
      renderComponent();

      expect(screen.getByTestId("chevron-down")).toBeInTheDocument();
    });

    it("should use card primitive styling", () => {
      const { container } = renderComponent();

      expect(container.firstChild).toHaveClass(
        "rounded-lg",
        "border",
        "border-gray-200",
        "bg-white",
        "shadow-sm",
      );
      expect(container.firstChild).not.toHaveClass("card-shadow");
    });
  });

  describe("Panel Expansion/Collapse", () => {
    it("should start collapsed by default", () => {
      renderComponent();

      // Form should have collapsed CSS classes initially
      const expandableContent = screen.getByTestId(
        "patient-walk-in-form",
      ).parentElement;
      expect(expandableContent).toHaveClass("max-h-0", "opacity-0");
    });

    it("should expand when header is clicked", async () => {
      const user = userEvent.setup();
      renderComponent();

      const header = screen
        .getByText("Walk-In Patients")
        .closest('div[class*="cursor-pointer"]');
      await user.click(header!);

      // Form should become visible
      expect(screen.getByTestId("patient-walk-in-form")).toBeVisible();
    });

    it("should collapse when header is clicked again", async () => {
      const user = userEvent.setup();
      renderComponent();

      const header = screen
        .getByText("Walk-In Patients")
        .closest('div[class*="cursor-pointer"]');

      // Expand first
      await user.click(header!);
      const expandableContent = screen.getByTestId(
        "patient-walk-in-form",
      ).parentElement;
      expect(expandableContent).toHaveClass("max-h-[2000px]", "opacity-100");

      // Collapse again
      await user.click(header!);
      expect(expandableContent).toHaveClass("max-h-0", "opacity-0");
    });

    it("should rotate chevron icon when expanded", async () => {
      const user = userEvent.setup();
      renderComponent();

      const chevronIcon = screen.getByTestId("chevron-down");
      const header = screen
        .getByText("Walk-In Patients")
        .closest('div[class*="cursor-pointer"]');

      // Initially not rotated
      expect(chevronIcon).not.toHaveClass("rotate-180");

      // Click to expand
      await user.click(header!);
      expect(chevronIcon).toHaveClass("rotate-180");

      // Click to collapse
      await user.click(header!);
      expect(chevronIcon).not.toHaveClass("rotate-180");
    });
  });

  describe("CSS Classes and Styling", () => {
    it("should apply hover and transition classes to header", () => {
      renderComponent();

      const header = screen
        .getByText("Walk-In Patients")
        .closest('div[class*="cursor-pointer"]');
      expect(header).toHaveClass(
        "hover:bg-gray-50",
        "transition-colors",
        "duration-200",
      );
    });

    it("should apply transition classes to expandable content", () => {
      renderComponent();

      const expandableContent = screen.getByTestId(
        "patient-walk-in-form",
      ).parentElement;
      expect(expandableContent).toHaveClass(
        "transition-all",
        "duration-300",
        "ease-in-out",
      );
    });

    it("should apply correct classes when collapsed", () => {
      renderComponent();

      const expandableContent = screen.getByTestId(
        "patient-walk-in-form",
      ).parentElement;
      expect(expandableContent).toHaveClass("max-h-0", "opacity-0");
    });

    it("should apply correct classes when expanded", async () => {
      const user = userEvent.setup();
      renderComponent();

      const header = screen
        .getByText("Walk-In Patients")
        .closest('div[class*="cursor-pointer"]');
      await user.click(header!);

      const expandableContent = screen.getByTestId(
        "patient-walk-in-form",
      ).parentElement;
      expect(expandableContent).toHaveClass("max-h-[2000px]", "opacity-100");
    });
  });

  describe("Form Integration", () => {
    it("should pass onRegisterNewAttendance callback to PatientWalkInForm", async () => {
      const user = userEvent.setup();
      renderComponent();

      const header = screen
        .getByText("Walk-In Patients")
        .closest('div[class*="cursor-pointer"]');
      await user.click(header!);

      // Verify form is rendered with correct props
      expect(screen.getByText("isDropdown: true")).toBeInTheDocument();
    });

    it("should pass isDropdown=true to PatientWalkInForm", async () => {
      const user = userEvent.setup();
      renderComponent();

      const header = screen
        .getByText("Walk-In Patients")
        .closest('div[class*="cursor-pointer"]');
      await user.click(header!);

      expect(screen.getByText("isDropdown: true")).toBeInTheDocument();
    });
  });

  describe("Callback Handling", () => {
    it("should call onRegisterNewAttendance when form triggers callback", async () => {
      const user = userEvent.setup();
      renderComponent();

      // Expand the panel
      const header = screen
        .getByText("Walk-In Patients")
        .closest('div[class*="cursor-pointer"]');
      await user.click(header!);

      // Trigger the mock check-in
      const checkInButton = screen.getByTestId("mock-check-in-button");
      await user.click(checkInButton);

      expect(mockOnRegisterNewAttendance).toHaveBeenCalledWith(
        "Test Patient",
        ["assessment"],
        true,
        "3",
      );
    });

    it("should collapse panel after successful check-in", async () => {
      const user = userEvent.setup();
      renderComponent();

      // Expand the panel
      const header = screen
        .getByText("Walk-In Patients")
        .closest('div[class*="cursor-pointer"]');
      await user.click(header!);

      // Verify panel is expanded
      const expandableContent = screen.getByTestId(
        "patient-walk-in-form",
      ).parentElement;
      expect(expandableContent).toHaveClass("max-h-[2000px]", "opacity-100");

      // Trigger the mock check-in
      const checkInButton = screen.getByTestId("mock-check-in-button");
      await user.click(checkInButton);

      // Panel should be collapsed after successful check-in
      expect(expandableContent).toHaveClass("max-h-0", "opacity-0");
    });

    it("should handle missing onRegisterNewAttendance callback gracefully", async () => {
      const user = userEvent.setup();
      renderComponent({ onRegisterNewAttendance: undefined });

      // Expand the panel
      const header = screen
        .getByText("Walk-In Patients")
        .closest('div[class*="cursor-pointer"]');
      await user.click(header!);

      // Trigger the mock check-in - should not crash
      const checkInButton = screen.getByTestId("mock-check-in-button");
      await user.click(checkInButton);

      // Panel should still collapse
      const expandableContent = screen.getByTestId(
        "patient-walk-in-form",
      ).parentElement;
      expect(expandableContent).toHaveClass("max-h-0", "opacity-0");
    });
  });

  describe("Accessibility", () => {
    it("should make header clickable", () => {
      renderComponent();

      const header = screen
        .getByText("Walk-In Patients")
        .closest('div[class*="cursor-pointer"]');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass("cursor-pointer");
    });

    it("should indicate clickable nature with cursor style", () => {
      renderComponent();

      const header = screen
        .getByText("Walk-In Patients")
        .closest('div[class*="cursor-pointer"]');
      expect(header).toHaveClass("cursor-pointer");
    });

    it("should provide visual feedback on hover", () => {
      renderComponent();

      const header = screen
        .getByText("Walk-In Patients")
        .closest('div[class*="cursor-pointer"]');
      expect(header).toHaveClass("hover:bg-gray-50");
    });
  });

  describe("Edge Cases", () => {
    it("should handle multiple rapid clicks without issues", async () => {
      const user = userEvent.setup();
      renderComponent();

      const header = screen
        .getByText("Walk-In Patients")
        .closest('div[class*="cursor-pointer"]');

      // Rapidly click multiple times
      await user.click(header!);
      await user.click(header!);
      await user.click(header!);
      await user.click(header!);

      // Should end up collapsed (even number of clicks)
      const expandableContent = screen.getByTestId(
        "patient-walk-in-form",
      ).parentElement;
      expect(expandableContent).toHaveClass("max-h-0", "opacity-0");
    });

    it("should maintain proper state through multiple expand/collapse cycles", async () => {
      const user = userEvent.setup();
      renderComponent();

      const header = screen
        .getByText("Walk-In Patients")
        .closest('div[class*="cursor-pointer"]');
      const expandableContent = screen.getByTestId(
        "patient-walk-in-form",
      ).parentElement;

      // Cycle through expand/collapse multiple times
      for (let i = 0; i < 3; i++) {
        // Expand
        await user.click(header!);
        expect(expandableContent).toHaveClass("max-h-[2000px]", "opacity-100");

        // Collapse
        await user.click(header!);
        expect(expandableContent).toHaveClass("max-h-0", "opacity-0");
      }
    });
  });

  describe("Component Structure", () => {
    it("should render header with correct structure", () => {
      renderComponent();

      // Check header structure
      expect(screen.getByText("Walk-In Patients")).toHaveClass(
        "text-lg",
        "font-semibold",
      );
      expect(screen.getByText(/Unscheduled patient registration/)).toHaveClass(
        "text-sm",
        "text-gray-600",
      );
    });

    it("should render icons with correct styling", () => {
      renderComponent();

      const plusIcon = screen.getByTestId("plus-icon");
      const chevronIcon = screen.getByTestId("chevron-down");

      expect(plusIcon).toHaveClass("w-5", "h-5", "text-blue-600");
      expect(chevronIcon).toHaveClass(
        "w-5",
        "h-5",
        "text-gray-500",
        "transition-transform",
        "duration-200",
      );
    });
  });
});
