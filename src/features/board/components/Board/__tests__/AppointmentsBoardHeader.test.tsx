import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { render } from "@/utils/testUtils";
import { AppointmentsBoardHeader } from "../AppointmentsBoardHeader";

jest.mock("@/api/query/hooks/useAppointmentQueries", () => ({
  useUnresolvedPastAppointments: () => ({
    data: { hasUnresolved: false, dates: [] },
    isLoading: false,
  }),
}));

jest.mock("@/utils/timezoneDate", () => ({
  ...jest.requireActual<typeof import("@/utils/timezoneDate")>(
    "@/utils/timezoneDate",
  ),
  getTodayClinic: () => "2025-01-15",
}));

// Mock the lucide-react icons
jest.mock("lucide-react", () => ({
  ChevronLeft: () => <div data-testid="chevron-left">Left</div>,
  ChevronRight: () => <div data-testid="chevron-right">Right</div>,
  ChevronsLeft: () => <div data-testid="chevrons-left">WeekPrev</div>,
  ChevronsRight: () => <div data-testid="chevrons-right">WeekNext</div>,
  RefreshCw: () => <div data-testid="refresh-icon">Refresh</div>,
}));

describe("AppointmentsBoardHeader", () => {
  const mockOnDateChange = jest.fn();
  const defaultProps = {
    selectedDate: "2025-01-15",
    onDateChange: mockOnDateChange,
    isDayFinalized: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date.now() to return a consistent date
    jest
      .spyOn(Date, "now")
      .mockImplementation(() => new Date("2025-01-15T12:00:00Z").getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders the component with correct title", () => {
      render(<AppointmentsBoardHeader {...defaultProps} />);

      expect(screen.getByText("Selected date:")).toBeInTheDocument();
    });

    it("renders date input with correct value", () => {
      render(<AppointmentsBoardHeader {...defaultProps} />);

      const dateInput = screen.getByDisplayValue("2025-01-15");
      expect(dateInput).toBeInTheDocument();
      expect(dateInput).toHaveAttribute("type", "date");
    });

    it("renders navigation buttons", () => {
      render(<AppointmentsBoardHeader {...defaultProps} />);

      expect(screen.getByTestId("chevron-left")).toBeInTheDocument();
      expect(screen.getByTestId("chevron-right")).toBeInTheDocument();
      expect(screen.getByText("Today")).toBeInTheDocument();
    });
  });

  describe("Date Input Interaction", () => {
    it("does not call onDateChange for draft-only input changes", () => {
      jest.useFakeTimers();
      render(<AppointmentsBoardHeader {...defaultProps} />);

      const dateInput = screen.getByDisplayValue("2025-01-15");
      fireEvent.change(dateInput, { target: { value: "2025-01-20" } });

      expect(mockOnDateChange).not.toHaveBeenCalled();
      jest.useRealTimers();
    });

    it("calls onDateChange when date is committed via blur after typing", () => {
      render(<AppointmentsBoardHeader {...defaultProps} />);

      const dateInput = screen.getByDisplayValue("2025-01-15");
      fireEvent.change(dateInput, { target: { value: "2025-01-20" } });
      fireEvent.keyDown(dateInput, { key: "0" });
      fireEvent.blur(dateInput);

      expect(mockOnDateChange).toHaveBeenCalledWith("2025-01-20");
    });

    it("calls onDateChange when native picker change is debounced", () => {
      jest.useFakeTimers();
      render(<AppointmentsBoardHeader {...defaultProps} />);

      const dateInput = screen.getByDisplayValue("2025-01-15");
      fireEvent.mouseDown(dateInput);
      fireEvent.change(dateInput, { target: { value: "2025-01-20" } });

      expect(mockOnDateChange).not.toHaveBeenCalled();

      jest.advanceTimersByTime(350);

      expect(mockOnDateChange).toHaveBeenCalledWith("2025-01-20");
      jest.useRealTimers();
    });

    it("has correct attributes on date input", () => {
      render(<AppointmentsBoardHeader {...defaultProps} />);

      const dateInput = screen.getByDisplayValue("2025-01-15");
      expect(dateInput).toHaveClass(
        "min-w-0",
        "max-sm:w-full",
        "max-sm:basis-full",
        "sm:min-w-[180px]",
        "sm:flex-1",
      );
      expect(dateInput).toHaveAttribute("lang", "en-US");
    });
  });

  describe("Navigation Buttons", () => {
    it("calls onDateChange with previous day when left chevron is clicked", () => {
      render(<AppointmentsBoardHeader {...defaultProps} />);

      const prevButton = screen.getByTestId("chevron-left").closest("button");
      if (prevButton) {
        fireEvent.click(prevButton);
        expect(mockOnDateChange).toHaveBeenCalledWith("2025-01-14");
      }
    });

    it("calls onDateChange with next day when right chevron is clicked", () => {
      render(<AppointmentsBoardHeader {...defaultProps} />);

      const nextButton = screen.getByTestId("chevron-right").closest("button");
      if (nextButton) {
        fireEvent.click(nextButton);
        expect(mockOnDateChange).toHaveBeenCalledWith("2025-01-16");
      }
    });

    it("calls onDateChange with today when Today button is clicked", () => {
      render(
        <AppointmentsBoardHeader {...defaultProps} selectedDate="2025-01-10" />,
      );

      const todayButton = screen.getByText("Today");
      fireEvent.click(todayButton);

      expect(mockOnDateChange).toHaveBeenCalledWith("2025-01-15");
    });

    it("navigation buttons have correct styling", () => {
      render(<AppointmentsBoardHeader {...defaultProps} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).not.toHaveClass("button", "card-shadow");
        expect(button).toHaveClass("inline-flex");
      });
    });
  });

  describe("Day Finalization Status", () => {
    it("shows finalization message when day is finalized", () => {
      render(<AppointmentsBoardHeader {...defaultProps} isDayFinalized={true} />);

      expect(screen.getByText("Day finalized")).toBeInTheDocument();
      expect(
        screen.getByText("Cards are disabled for editing")
      ).toBeInTheDocument();
    });

    it("does not show finalization message when day is not finalized", () => {
      render(<AppointmentsBoardHeader {...defaultProps} isDayFinalized={false} />);

      expect(screen.queryByText("Day finalized")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Cards are disabled for editing")
      ).not.toBeInTheDocument();
    });

    it("finalization message has correct styling", () => {
      render(<AppointmentsBoardHeader {...defaultProps} isDayFinalized={true} />);

      // Find the outer div container that has the styling classes
      const finalizationDiv = screen.getByText("📅").closest("div");
      expect(finalizationDiv).toHaveClass(
        "bg-green-100",
        "border",
        "border-green-400",
        "text-green-700",
        "px-4",
        "py-2",
        "rounded",
        "mb-4",
        "flex",
        "items-center",
        "gap-2"
      );
    });

    it("shows calendar emoji in finalization message", () => {
      render(<AppointmentsBoardHeader {...defaultProps} isDayFinalized={true} />);

      expect(screen.getByText("📅")).toBeInTheDocument();
    });
  });

  describe("Container Styling", () => {
    it("has correct container classes", () => {
      const { container } = render(<AppointmentsBoardHeader {...defaultProps} />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass("w-full", "pb-4");
    });

    it("title has correct styling", () => {
      render(<AppointmentsBoardHeader {...defaultProps} />);

      const title = screen.getByText("Selected date:");
      expect(title).toHaveClass(
        "text-lg",
        "mb-4",
        "flex",
        "items-center",
        "gap-2"
      );
    });

    it("button container has correct gap", () => {
      render(<AppointmentsBoardHeader {...defaultProps} />);

      const buttonContainer = screen.getByText("Today").parentElement;
      expect(buttonContainer).toHaveClass(
        "flex",
        "flex-wrap",
        "gap-2",
        "flex-1",
        "min-w-0",
        "items-center",
      );
    });
  });

  describe("Date Navigation Edge Cases", () => {
    it("handles month boundary when going to previous day", () => {
      render(<AppointmentsBoardHeader {...defaultProps} selectedDate="2025-02-01" />);

      const prevButton = screen.getByTestId("chevron-left").closest("button");
      if (prevButton) {
        fireEvent.click(prevButton);
        expect(mockOnDateChange).toHaveBeenCalledWith("2025-01-31");
      }
    });

    it("handles month boundary when going to next day", () => {
      render(<AppointmentsBoardHeader {...defaultProps} selectedDate="2025-01-31" />);

      const nextButton = screen.getByTestId("chevron-right").closest("button");
      if (nextButton) {
        fireEvent.click(nextButton);
        expect(mockOnDateChange).toHaveBeenCalledWith("2025-02-01");
      }
    });

    it("handles year boundary correctly", () => {
      render(<AppointmentsBoardHeader {...defaultProps} selectedDate="2024-12-31" />);

      const nextButton = screen.getByTestId("chevron-right").closest("button");
      if (nextButton) {
        fireEvent.click(nextButton);
        expect(mockOnDateChange).toHaveBeenCalledWith("2025-01-01");
      }
    });
  });

  describe("Timezone Handling", () => {
    it("handles timezone offset correctly in today button", () => {
      const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
      Date.prototype.getTimezoneOffset = jest.fn(() => -180);

      render(
        <AppointmentsBoardHeader {...defaultProps} selectedDate="2025-01-10" />,
      );

      const todayButton = screen.getByText("Today");
      fireEvent.click(todayButton);

      expect(mockOnDateChange).toHaveBeenCalledWith("2025-01-15");

      Date.prototype.getTimezoneOffset = originalGetTimezoneOffset;
    });
  });

  describe("Accessibility", () => {
    it("date input has proper attributes", () => {
      render(<AppointmentsBoardHeader {...defaultProps} />);

      const dateInput = screen.getByDisplayValue("2025-01-15");
      expect(dateInput).toHaveAttribute("lang", "en-US");
      expect(dateInput).toHaveAttribute("type", "date");
    });

    it("buttons are properly focusable", () => {
      render(<AppointmentsBoardHeader {...defaultProps} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("type", "button");
      });
    });
  });

  describe("Refresh Button", () => {
    it("does not render refresh button when onRefresh prop is not provided", () => {
      render(<AppointmentsBoardHeader {...defaultProps} />);

      expect(screen.queryByTestId("refresh-icon")).not.toBeInTheDocument();
    });

    it("renders refresh button when onRefresh prop is provided", () => {
      const mockOnRefresh = jest.fn();
      render(<AppointmentsBoardHeader {...defaultProps} onRefresh={mockOnRefresh} />);

      expect(screen.getByTestId("refresh-icon")).toBeInTheDocument();
    });

    it("calls onRefresh when refresh button is clicked", () => {
      const mockOnRefresh = jest.fn();
      render(<AppointmentsBoardHeader {...defaultProps} onRefresh={mockOnRefresh} />);

      const refreshButton = screen
        .getByTestId("refresh-icon")
        .closest("button");
      if (refreshButton) {
        fireEvent.click(refreshButton);
        expect(mockOnRefresh).toHaveBeenCalledTimes(1);
      }
    });

    it("refresh button has correct styling and title", () => {
      const mockOnRefresh = jest.fn();
      render(<AppointmentsBoardHeader {...defaultProps} onRefresh={mockOnRefresh} />);

      const refreshButton = screen
        .getByTestId("refresh-icon")
        .closest("button");
      expect(refreshButton).toHaveClass(
        "inline-flex",
        "items-center",
        "justify-center"
      );
      expect(refreshButton).not.toHaveClass("button", "card-shadow");
      expect(refreshButton).toHaveAttribute("title", "Refresh appointments");
    });

    it("refresh button can be clicked multiple times", () => {
      const mockOnRefresh = jest.fn();
      render(<AppointmentsBoardHeader {...defaultProps} onRefresh={mockOnRefresh} />);

      const refreshButton = screen
        .getByTestId("refresh-icon")
        .closest("button");
      if (refreshButton) {
        fireEvent.click(refreshButton);
        fireEvent.click(refreshButton);
        fireEvent.click(refreshButton);
        expect(mockOnRefresh).toHaveBeenCalledTimes(3);
      }
    });
  });
});
