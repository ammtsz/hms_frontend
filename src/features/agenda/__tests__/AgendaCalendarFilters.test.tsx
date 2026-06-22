import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AgendaCalendarFilters from "../components/AgendaCalendarFilters";
import { AGENDA_FILTER_LABELS } from "../utils/agendaFilterConstants";
import { AttendanceStatus } from "@/api/types";
import type { AgendaDayWindowDays } from "@/stores";

jest.mock("@/utils/timezoneDate", () => ({
  ...jest.requireActual<typeof import("@/utils/timezoneDate")>(
    "@/utils/timezoneDate",
  ),
  getTodayClinic: jest.fn(() => "2026-03-23"),
}));

describe("AgendaCalendarFilters", () => {
  const defaultProps = {
    selectedDate: "2026-03-20",
    setSelectedDate: jest.fn(),
    agendaDayWindowDays: 7 as AgendaDayWindowDays,
    setAgendaDayWindowDays: jest.fn(),
    agendaStatusFilters: [
      AttendanceStatus.SCHEDULED,
      AttendanceStatus.COMPLETED,
    ] as AttendanceStatus[],
    setAgendaStatusFilters: jest.fn(),
    patientFilter: "",
    setPatientFilter: jest.fn(),
    refreshAgenda: jest.fn(),
    isRefreshing: false,
    rangeSummaryText: "Period: 03/20/2026 — 03/26/2026 (7 days)",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders range summary and filter labels", () => {
    render(<AgendaCalendarFilters {...defaultProps} />);

    expect(screen.getByText(defaultProps.rangeSummaryText)).toBeInTheDocument();
    expect(
      screen.getByLabelText("Select a date to filter"),
    ).toBeInTheDocument();
    expect(screen.getByText(AGENDA_FILTER_LABELS.attendanceStatus)).toBeInTheDocument();
    expect(screen.getByText(AGENDA_FILTER_LABELS.legend)).toBeInTheDocument();
  });

  it("calls setSelectedDate with today when Today is clicked", () => {
    render(
      <AgendaCalendarFilters {...defaultProps} selectedDate="2026-03-01" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Today" }));

    expect(defaultProps.setSelectedDate).toHaveBeenCalledWith("2026-03-23");
  });

  it("does not call setSelectedDate for draft-only date input changes", () => {
    jest.useFakeTimers();
    render(<AgendaCalendarFilters {...defaultProps} />);

    const dateInput = screen.getByLabelText("Select a date to filter");
    fireEvent.change(dateInput, { target: { value: "2026-03-25" } });

    expect(defaultProps.setSelectedDate).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("calls setSelectedDate when date is committed via blur after typing", () => {
    render(<AgendaCalendarFilters {...defaultProps} />);

    const dateInput = screen.getByLabelText("Select a date to filter");
    fireEvent.change(dateInput, { target: { value: "2026-03-25" } });
    fireEvent.keyDown(dateInput, { key: "5" });
    fireEvent.blur(dateInput);

    expect(defaultProps.setSelectedDate).toHaveBeenCalledWith("2026-03-25");
  });

  it("calls refreshAgenda when Refresh is clicked", () => {
    render(<AgendaCalendarFilters {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    expect(defaultProps.refreshAgenda).toHaveBeenCalledTimes(1);
  });

  it("shows empty-status warning when no status filters are selected", () => {
    render(
      <AgendaCalendarFilters {...defaultProps} agendaStatusFilters={[]} />,
    );

    expect(screen.getByText(AGENDA_FILTER_LABELS.noStatusSelected)).toBeInTheDocument();
  });

  it("toggles a status checkbox and updates filters", () => {
    render(<AgendaCalendarFilters {...defaultProps} />);

    const scheduledCheckbox = screen.getByRole("checkbox", {
      name: /Scheduled/i,
    });
    fireEvent.click(scheduledCheckbox);

    expect(defaultProps.setAgendaStatusFilters).toHaveBeenCalled();
  });
});
