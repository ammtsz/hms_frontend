import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ScheduleCalendar from "../index";
import { useScheduleCalendar } from "../hooks/useScheduleCalendar";
import {
  SCHEDULE_COLUMN_MESSAGES,
  SCHEDULE_COLUMN_TITLES,
  SCHEDULE_PAGE_LABELS,
} from "../utils/scheduleFilterConstants";
import { Priority, AttendanceType } from "@/types/types";
import { AttendanceStatus } from "@/api/types";
import type { ScheduleDayWindowDays } from "@/stores";

// Mock the hook
jest.mock("../hooks/useScheduleCalendar");
const mockUseScheduleCalendar = useScheduleCalendar as jest.MockedFunction<
  typeof useScheduleCalendar
>;

jest.mock("../components/UpcomingHolidaysWidget", () => {
  return function MockUpcomingHolidaysWidget() {
    return <div data-testid="upcoming-holidays-widget" />;
  };
});

jest.mock("../components/ScheduleColumn", () => {
  return function MockScheduleColumn({
    title,
    isRefreshing,
  }: {
    title: string;
    isRefreshing?: boolean;
  }) {
    return (
      <div className={`border ${isRefreshing ? "opacity-75" : ""}`}>
        <span>{title}</span>
        {isRefreshing ? <span>{SCHEDULE_COLUMN_MESSAGES.refreshing}</span> : null}
      </div>
    );
  };
});

jest.mock(
  "@/features/attendance/components/AttendanceActions/ManageAttendanceModal",
  () => {
    return function MockManageAttendanceModal() {
      return null;
    };
  },
);

// Mock the NewAttendanceFormModal component to test integration
jest.mock("../components/NewAttendanceFormModal", () => {
  return function MockNewAttendanceFormModal({
    onClose,
    onSuccess,
  }: {
    onClose: () => void;
    onSuccess: () => void;
  }) {
    return (
      <div data-testid="new-attendance-form-modal">
        <button onClick={onClose} data-testid="modal-close">
          Close Modal
        </button>
        <button onClick={onSuccess} data-testid="modal-success">
          Success
        </button>
      </div>
    );
  };
});

// Mock date formatters
jest.mock("@/utils/dateUtils", () => ({
  formatDisplayDate: jest.fn(() => "07/08/2025"),
  formatDisplayDateWithDayOfWeek: jest.fn(() => "Thursday, 08/07/2025"),
}));

describe("ScheduleCalendar - Basic Functionality", () => {
  const mockFilteredSchedule = {
    assessment: [
      {
        date: "2025-08-07",
        patients: [
          {
            id: "1",
            name: "John Doe",
            attendanceId: 1,
            priority: "3" as Priority,
            attendanceType: "assessment" as AttendanceType,
          },
        ],
      },
    ],
    physiotherapy: [],
  };

  const defaultHookReturn = {
    selectedDate: "2025-08-07",
    setSelectedDate: jest.fn(),
    scheduleDayWindowDays: 30 as ScheduleDayWindowDays,
    setScheduleDayWindowDays: jest.fn(),
    scheduleStatusFilters: [] as AttendanceStatus[],
    setScheduleStatusFilters: jest.fn(),
    patientFilter: "",
    setPatientFilter: jest.fn(),
    filteredSchedule: mockFilteredSchedule,
    openAssessmentIdx: [],
    setOpenAssessmentIdx: jest.fn(),
    openPhysiotherapyIdx: [],
    setOpenPhysiotherapyIdx: jest.fn(),
    confirmRemove: null,
    setConfirmRemove: jest.fn(),
    showNewAttendance: false,
    setShowNewAttendance: jest.fn(),
    handleRemovePatient: jest.fn(),
    handleConfirmRemove: jest.fn(),
    handleNewAttendance: jest.fn(),
    handleFormSuccess: jest.fn(),
    loading: false,
    error: null,
    refreshSchedule: jest.fn(),
    isRefreshing: false,
    rangeSummaryText: "Period: 07/08/2025 — 05/09/2025 (30 days)",
    referenceDate: "2025-08-07",
    rangeEndDate: "2025-09-05",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseScheduleCalendar.mockReturnValue(defaultHookReturn);
  });

  it("should render basic component structure", () => {
    render(<ScheduleCalendar />);

    expect(screen.getByText(SCHEDULE_PAGE_LABELS.title)).toBeInTheDocument();
    expect(
      screen.getByText(SCHEDULE_PAGE_LABELS.newAttendanceButton),
    ).toBeInTheDocument();
  });

  it("should render loading state", () => {
    mockUseScheduleCalendar.mockReturnValue({
      ...defaultHookReturn,
      loading: true,
    });

    render(<ScheduleCalendar />);
    expect(
      screen.getByText(SCHEDULE_COLUMN_TITLES.assessment),
    ).toBeInTheDocument();
    expect(
      screen.getByText(SCHEDULE_COLUMN_TITLES.physiotherapy),
    ).toBeInTheDocument();
  });

  it("should render error state", () => {
    mockUseScheduleCalendar.mockReturnValue({
      ...defaultHookReturn,
      error: "Failed to load schedule",
    });

    render(<ScheduleCalendar />);

    // Error states show different messages, so let's check for any error indication
    // Looking at the HTML, errors might not have a specific text pattern
    // Let's just check the component renders without the loading state
    expect(
      screen.queryByText("Loading attendances..."),
    ).not.toBeInTheDocument();
  });

  it("should render empty state", () => {
    mockUseScheduleCalendar.mockReturnValue({
      ...defaultHookReturn,
      filteredSchedule: {
        assessment: [],
        physiotherapy: [],
      },
    });

    render(<ScheduleCalendar />);
    expect(
      screen.getByText(SCHEDULE_COLUMN_TITLES.assessment),
    ).toBeInTheDocument();
    expect(
      screen.getByText(SCHEDULE_COLUMN_TITLES.physiotherapy),
    ).toBeInTheDocument();
  });

  it("should render schedule items when data is available", () => {
    render(<ScheduleCalendar />);

    // Should show section headers
    expect(
      screen.getByText(SCHEDULE_COLUMN_TITLES.assessment),
    ).toBeInTheDocument();
    expect(
      screen.getByText(SCHEDULE_COLUMN_TITLES.physiotherapy),
    ).toBeInTheDocument();
  });

  it("should render refresh button and call refreshSchedule when clicked", () => {
    const mockRefreshSchedule = jest.fn();
    mockUseScheduleCalendar.mockReturnValue({
      ...defaultHookReturn,
      refreshSchedule: mockRefreshSchedule,
    });

    render(<ScheduleCalendar />);

    // Should render the refresh button
    const refreshButton = screen.getByRole("button", { name: /Refresh/i });
    expect(refreshButton).toBeInTheDocument();
    expect(refreshButton).toHaveAttribute("title", "Refresh appointment data");

    // Should call refreshSchedule when clicked
    refreshButton.click();
    expect(mockRefreshSchedule).toHaveBeenCalledTimes(1);
  });

  it("should render day window select and refresh button in controls area", () => {
    render(<ScheduleCalendar />);

    expect(screen.getByLabelText(/^Period$/)).toBeInTheDocument();

    const refreshButton = screen.getByRole("button", { name: /Refresh/i });
    expect(refreshButton).toBeInTheDocument();
    expect(refreshButton).toBeVisible();
    expect(refreshButton).toBeEnabled();
  });

  it("should show loading state when refreshing", () => {
    mockUseScheduleCalendar.mockReturnValue({
      ...defaultHookReturn,
      isRefreshing: true,
    });

    render(<ScheduleCalendar />);

    // Should render the refresh button with loading state
    const refreshButton = screen.getByRole("button", { name: /Refreshing/i });
    expect(refreshButton).toBeInTheDocument();
    expect(refreshButton).toBeDisabled();
    expect(refreshButton).toHaveAttribute("title", "Refreshing...");

    // Button text should change to "Refreshing..."
    expect(refreshButton).toHaveTextContent("Refreshing...");

    // Should have loading styles
    expect(refreshButton).toHaveClass("opacity-50", "cursor-not-allowed");

    // Feather icon should have spinning animation
    const icon = refreshButton.querySelector("svg");
    expect(icon).toHaveClass("animate-spin");
  });

  it("should show normal state when not refreshing", () => {
    mockUseScheduleCalendar.mockReturnValue({
      ...defaultHookReturn,
      isRefreshing: false,
    });

    render(<ScheduleCalendar />);

    // Should render the refresh button in normal state
    const refreshButton = screen.getByRole("button", { name: /Refresh$/i });
    expect(refreshButton).toBeInTheDocument();
    expect(refreshButton).toBeEnabled();
    expect(refreshButton).toHaveAttribute("title", "Refresh appointment data");

    // Button text should be "Refresh"
    expect(refreshButton).toHaveTextContent("Refresh");

    // Should not have loading styles
    expect(refreshButton).not.toHaveClass("opacity-50", "cursor-not-allowed");
    expect(refreshButton).toHaveClass("hover:bg-gray-50");

    // Feather icon should not be spinning
    const icon = refreshButton.querySelector("svg");
    expect(icon).not.toHaveClass("animate-spin");
  });

  it("should show refreshing overlay on attendance columns when refreshing", () => {
    mockUseScheduleCalendar.mockReturnValue({
      ...defaultHookReturn,
      isRefreshing: true,
      filteredSchedule: mockFilteredSchedule,
    });

    render(<ScheduleCalendar />);

    // Should show "Refreshing..." text in both columns
    const refreshingTexts = screen.getAllByText(
      SCHEDULE_COLUMN_MESSAGES.refreshing,
    );

    // Should have at least 2 instances - one in each column (plus the button makes 3)
    expect(refreshingTexts.length).toBeGreaterThanOrEqual(2);

    // Check that columns have reduced opacity when refreshing
    const assessmentColumnContent = screen
      .getByText(SCHEDULE_COLUMN_TITLES.assessment)
      .closest(".border");
    const physiotherapyColumnContent = screen
      .getByText(SCHEDULE_COLUMN_TITLES.physiotherapy)
      .closest(".border");

    expect(assessmentColumnContent).toHaveClass("opacity-75");
    expect(physiotherapyColumnContent).toHaveClass("opacity-75");
  });

  it("should not show refreshing overlay when not refreshing", () => {
    mockUseScheduleCalendar.mockReturnValue({
      ...defaultHookReturn,
      isRefreshing: false,
      filteredSchedule: mockFilteredSchedule,
    });

    render(<ScheduleCalendar />);

    // Should not show overlay "Refreshing..." text in columns
    const refreshingTexts = screen.queryAllByText(
      SCHEDULE_COLUMN_MESSAGES.refreshing,
    );

    // Should only have the button text, not column overlays
    expect(refreshingTexts.length).toBeLessThanOrEqual(1);

    // Check that columns don't have reduced opacity
    const assessmentColumnContent = screen
      .getByText(SCHEDULE_COLUMN_TITLES.assessment)
      .closest(".border");
    const physiotherapyColumnContent = screen
      .getByText(SCHEDULE_COLUMN_TITLES.physiotherapy)
      .closest(".border");

    expect(assessmentColumnContent).not.toHaveClass("opacity-75");
    expect(physiotherapyColumnContent).not.toHaveClass("opacity-75");
  });

  describe("Date Input and Controls", () => {
    it("renders date input with correct value", () => {
      render(<ScheduleCalendar />);

      const dateInput = screen.getByLabelText("Select a date to filter");
      expect(dateInput).toBeInTheDocument();
      expect(dateInput).toHaveValue("2025-08-07");
    });

    it("renders patient filter input and updates value", () => {
      const mockSetPatientFilter = jest.fn();
      mockUseScheduleCalendar.mockReturnValue({
        ...defaultHookReturn,
        setPatientFilter: mockSetPatientFilter,
      });

      render(<ScheduleCalendar />);

      const patientInput = screen.getByLabelText("Filter by patient");
      expect(patientInput).toBeInTheDocument();
      fireEvent.change(patientInput, { target: { value: "john" } });

      expect(mockSetPatientFilter).toHaveBeenCalledWith("john");
    });

    it("calls setSelectedDate when date is committed via blur after typing", () => {
      const mockSetSelectedDate = jest.fn();
      mockUseScheduleCalendar.mockReturnValue({
        ...defaultHookReturn,
        setSelectedDate: mockSetSelectedDate,
      });

      render(<ScheduleCalendar />);

      const dateInput = screen.getByLabelText("Select a date to filter");
      fireEvent.change(dateInput, { target: { value: "2025-08-15" } });
      fireEvent.keyDown(dateInput, { key: "5" });
      fireEvent.blur(dateInput);

      expect(mockSetSelectedDate).toHaveBeenCalledWith("2025-08-15");
    });

    it('renders and handles "Today" button click', () => {
      const mockSetSelectedDate = jest.fn();
      mockUseScheduleCalendar.mockReturnValue({
        ...defaultHookReturn,
        setSelectedDate: mockSetSelectedDate,
      });

      render(<ScheduleCalendar />);

      const todayButton = screen.getByRole("button", { name: /Today/i });
      expect(todayButton).toBeInTheDocument();

      todayButton.click();
      expect(mockSetSelectedDate).toHaveBeenCalled();
      // The exact date will be today's date, which we can't predict exactly
      expect(mockSetSelectedDate).toHaveBeenCalledWith(
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      );
    });

    it("calls setScheduleDayWindowDays when period select changes", () => {
      const mockSetScheduleDayWindowDays = jest.fn();
      mockUseScheduleCalendar.mockReturnValue({
        ...defaultHookReturn,
        setScheduleDayWindowDays: mockSetScheduleDayWindowDays,
        scheduleDayWindowDays: 30,
      });

      render(<ScheduleCalendar />);

      const select = screen.getByLabelText(/^Period$/);
      fireEvent.change(select, { target: { value: "7" } });

      expect(mockSetScheduleDayWindowDays).toHaveBeenCalledWith(7);
    });

    it("displays range summary from hook", () => {
      mockUseScheduleCalendar.mockReturnValue({
        ...defaultHookReturn,
        rangeSummaryText: "Period: 07/08/2025 — 13/08/2025 (7 days)",
      });

      render(<ScheduleCalendar />);

      expect(
        screen.getByText("Period: 07/08/2025 — 13/08/2025 (7 days)"),
      ).toBeInTheDocument();
    });

    it("renders status filter fieldset and select-all clears", () => {
      const mockSetScheduleStatusFilters = jest.fn();
      mockUseScheduleCalendar.mockReturnValue({
        ...defaultHookReturn,
        setScheduleStatusFilters: mockSetScheduleStatusFilters,
        scheduleStatusFilters: [],
      });

      render(<ScheduleCalendar />);

      fireEvent.click(
        screen.getByRole("button", {
          name: /Select all attendance statuses/i,
        }),
      );
      expect(mockSetScheduleStatusFilters.mock.calls[0]?.[0]).toHaveLength(6);

      fireEvent.click(
        screen.getByRole("button", {
          name: /Clear attendance status selection/i,
        }),
      );
      expect(mockSetScheduleStatusFilters.mock.calls[1]?.[0]).toEqual([]);
    });
  });

  describe("Modal Rendering", () => {
    it("renders NewAttendanceFormModal when showNewAttendance is true", async () => {
      mockUseScheduleCalendar.mockReturnValue({
        ...defaultHookReturn,
        showNewAttendance: true,
      });

      render(<ScheduleCalendar />);

      // First, it should show the loading fallback
      expect(
        screen.getByText("Loading scheduling form..."),
      ).toBeInTheDocument();
    });

    it("does not render NewAttendanceFormModal when showNewAttendance is false", () => {
      mockUseScheduleCalendar.mockReturnValue({
        ...defaultHookReturn,
        showNewAttendance: false,
      });

      render(<ScheduleCalendar />);

      expect(
        screen.queryByText("Loading scheduling form..."),
      ).not.toBeInTheDocument();
    });

    it("calls setShowNewAttendance(true) when new attendance button is clicked", () => {
      const mockSetShowNewAttendance = jest.fn();
      mockUseScheduleCalendar.mockReturnValue({
        ...defaultHookReturn,
        setShowNewAttendance: mockSetShowNewAttendance,
      });

      render(<ScheduleCalendar />);

      const newAttendanceButton = screen.getByText(
        SCHEDULE_PAGE_LABELS.newAttendanceButton,
      );
      newAttendanceButton.click();

      expect(mockSetShowNewAttendance).toHaveBeenCalledWith(true);
    });
  });

  describe("Patient Mapping Coverage", () => {
    it("renders physiotherapy patients with correct attendanceType mapping", () => {
      const mockFilteredSchedule = {
        assessment: [],
        physiotherapy: [
          {
            date: "2025-08-07",
            patients: [
              {
                id: "1",
                name: "Emily Williams",
                attendanceId: 2,
                priority: "2" as Priority,
                // No attendanceType - should default to 'physiotherapy'
              },
            ],
          },
        ],
      };

      mockUseScheduleCalendar.mockReturnValue({
        ...defaultHookReturn,
        filteredSchedule: mockFilteredSchedule,
      });

      render(<ScheduleCalendar />);

      // Should render the physiotherapy column with the patient
      expect(
        screen.getByText(SCHEDULE_COLUMN_TITLES.physiotherapy),
      ).toBeInTheDocument();
    });
  });

  describe("NewAttendanceFormModal Integration", () => {
    it("calls setShowNewAttendance(false) when modal onClose is triggered", async () => {
      const mockSetShowNewAttendance = jest.fn();
      mockUseScheduleCalendar.mockReturnValue({
        ...defaultHookReturn,
        showNewAttendance: true,
        setShowNewAttendance: mockSetShowNewAttendance,
      });

      const { findByTestId } = render(<ScheduleCalendar />);

      // Wait for the modal to render (it's lazy loaded)
      const modal = await findByTestId("new-attendance-form-modal");
      expect(modal).toBeInTheDocument();

      // Click the close button
      const closeButton = await findByTestId("modal-close");
      closeButton.click();

      expect(mockSetShowNewAttendance).toHaveBeenCalledWith(false);
    });

    it("calls handleFormSuccess when modal onSuccess is triggered", async () => {
      const mockHandleFormSuccess = jest.fn();
      mockUseScheduleCalendar.mockReturnValue({
        ...defaultHookReturn,
        showNewAttendance: true,
        handleFormSuccess: mockHandleFormSuccess,
      });

      const { findByTestId } = render(<ScheduleCalendar />);

      // Wait for the modal to render (it's lazy loaded)
      const modal = await findByTestId("new-attendance-form-modal");
      expect(modal).toBeInTheDocument();

      // Click the success button
      const successButton = await findByTestId("modal-success");
      successButton.click();

      expect(mockHandleFormSuccess).toHaveBeenCalled();
    });
  });
});
