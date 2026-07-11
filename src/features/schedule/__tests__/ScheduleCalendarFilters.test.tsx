import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ScheduleCalendarFilters from "../components/ScheduleCalendarFilters";
import { SCHEDULE_FILTER_LABELS } from "../utils/scheduleFilterConstants";
import { AppointmentStatus } from "@/api/types";
import type { ScheduleDayWindowDays } from "@/stores";

jest.mock("@/utils/timezoneDate", () => ({
  ...jest.requireActual<typeof import("@/utils/timezoneDate")>(
    "@/utils/timezoneDate",
  ),
  getTodayClinic: jest.fn(() => "2026-03-23"),
}));

describe("ScheduleCalendarFilters", () => {
  const defaultProps = {
    selectedDate: "2026-03-20",
    setSelectedDate: jest.fn(),
    scheduleDayWindowDays: 7 as ScheduleDayWindowDays,
    setScheduleDayWindowDays: jest.fn(),
    scheduleStatusFilters: [
      AppointmentStatus.SCHEDULED,
      AppointmentStatus.COMPLETED,
    ] as AppointmentStatus[],
    setScheduleStatusFilters: jest.fn(),
    patientFilter: "",
    setPatientFilter: jest.fn(),
    refreshSchedule: jest.fn(),
    isRefreshing: false,
    rangeSummaryText: "Period: 03/20/2026 — 03/26/2026 (7 days)",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders range summary and filter labels", () => {
    render(<ScheduleCalendarFilters {...defaultProps} />);

    expect(screen.getByText(defaultProps.rangeSummaryText)).toBeInTheDocument();
    expect(
      screen.getByLabelText("Select a date to filter"),
    ).toBeInTheDocument();
    expect(screen.getByText(SCHEDULE_FILTER_LABELS.appointmentStatus)).toBeInTheDocument();
    expect(screen.getByText(SCHEDULE_FILTER_LABELS.legend)).toBeInTheDocument();
  });

  it("calls setSelectedDate with today when Today is clicked", () => {
    render(
      <ScheduleCalendarFilters {...defaultProps} selectedDate="2026-03-01" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Today" }));

    expect(defaultProps.setSelectedDate).toHaveBeenCalledWith("2026-03-23");
  });

  it("does not call setSelectedDate for draft-only date input changes", () => {
    jest.useFakeTimers();
    try {
      render(<ScheduleCalendarFilters {...defaultProps} />);

      const dateInput = screen.getByLabelText("Select a date to filter");
      fireEvent.change(dateInput, { target: { value: "2026-03-25" } });

      expect(defaultProps.setSelectedDate).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it("calls setSelectedDate when date is committed via blur after typing", () => {
    render(<ScheduleCalendarFilters {...defaultProps} />);

    const dateInput = screen.getByLabelText("Select a date to filter");
    fireEvent.change(dateInput, { target: { value: "2026-03-25" } });
    fireEvent.keyDown(dateInput, { key: "5" });
    fireEvent.blur(dateInput);

    expect(defaultProps.setSelectedDate).toHaveBeenCalledWith("2026-03-25");
  });

  it("calls refreshSchedule when Refresh is clicked", () => {
    render(<ScheduleCalendarFilters {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    expect(defaultProps.refreshSchedule).toHaveBeenCalledTimes(1);
  });

  it("shows empty-status warning when no status filters are selected", () => {
    render(
      <ScheduleCalendarFilters {...defaultProps} scheduleStatusFilters={[]} />,
    );

    expect(screen.getByText(SCHEDULE_FILTER_LABELS.noStatusSelected)).toBeInTheDocument();
  });

  it("toggles a status checkbox and updates filters", () => {
    render(<ScheduleCalendarFilters {...defaultProps} />);

    const scheduledCheckbox = screen.getByRole("checkbox", {
      name: /Scheduled/i,
    });
    fireEvent.click(scheduledCheckbox);

    expect(defaultProps.setScheduleStatusFilters).toHaveBeenCalled();
  });
});
