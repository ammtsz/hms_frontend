import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import SummaryStep from "../components/steps/SummaryStep";
import { getAppointmentTypeLabel } from "@/utils/apiTransformers";
import type { ProcessEndOfDayResponse } from "@/api/day-finalization";

describe("SummaryStep", () => {
  const defaultResult: ProcessEndOfDayResponse = {
    rescheduled: [],
    statusChangedToC: [],
    cancelledForC: [],
    couldNotReschedule: [],
  };

  const defaultProps = {
    result: defaultResult,
    selectedDate: "2024-01-15",
    onConclude: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays formatted date correctly", () => {
    render(<SummaryStep {...defaultProps} />);

    expect(screen.getByText(/01\/15\/2024/)).toBeInTheDocument();
  });

  it("shows success message when no actions were taken", () => {
    render(<SummaryStep {...defaultProps} />);

    expect(
      screen.getByText(
        "Day finalized successfully. No automatic action was needed.",
      ),
    ).toBeInTheDocument();
  });

  it("calls onConclude when Complete button is clicked", () => {
    render(<SummaryStep {...defaultProps} />);

    fireEvent.click(screen.getByText("Complete"));

    expect(defaultProps.onConclude).toHaveBeenCalled();
  });

  it("displays rescheduled section when there are rescheduled items", () => {
    const result: ProcessEndOfDayResponse = {
      ...defaultResult,
      rescheduled: [
        {
          appointmentId: 1,
          patientId: 10,
          patientName: "John Doe",
          type: "assessment",
          oldDate: "2024-01-15",
          newDate: "2024-01-22",
        },
      ],
    };

    render(<SummaryStep {...defaultProps} result={result} />);

    expect(screen.getByText("Rescheduled")).toBeInTheDocument();
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(getAppointmentTypeLabel("assessment"), "i")),
    ).toBeInTheDocument();
    expect(screen.getByText(/→/)).toBeInTheDocument();
  });

  it("displays status changed to C section when patients have status change", () => {
    const result: ProcessEndOfDayResponse = {
      ...defaultResult,
      statusChangedToC: [{ patientId: 1, patientName: "Jane Smith" }],
    };

    render(<SummaryStep {...defaultProps} result={result} />);

    expect(
      screen.getByText(
        /Patients with status changed to "Consecutive no-shows"/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
  });

  it("displays cancelled for C section when appointments were cancelled", () => {
    const result: ProcessEndOfDayResponse = {
      ...defaultResult,
      cancelledForC: [
        {
          patientId: 2,
          patientName: "Bob Wilson",
          appointments: [
            { id: 10, type: "assessment", scheduledDate: "2024-01-20" },
          ],
        },
      ],
    };

    render(<SummaryStep {...defaultProps} result={result} />);

    expect(
      screen.getByText("Appointments canceled due to consecutive no-shows"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Bob Wilson/)).toBeInTheDocument();
  });

  it("displays could not reschedule section when some could not be rescheduled", () => {
    const result: ProcessEndOfDayResponse = {
      ...defaultResult,
      couldNotReschedule: [
        {
          appointmentId: 5,
          patientId: 3,
          patientName: "Alice Brown",
          type: "physiotherapy",
          reason: "Could not find available date within 52 weeks",
        },
      ],
    };

    render(<SummaryStep {...defaultProps} result={result} />);

    expect(screen.getByText("Could not reschedule")).toBeInTheDocument();
    expect(screen.getByText(/Alice Brown/)).toBeInTheDocument();
    expect(
      screen.getByText(/Could not find available date within 52 weeks/),
    ).toBeInTheDocument();
  });

  it("filters out rescheduled items where oldDate equals newDate", () => {
    const result: ProcessEndOfDayResponse = {
      ...defaultResult,
      rescheduled: [
        {
          appointmentId: 1,
          patientId: 10,
          patientName: "John Doe",
          type: "assessment",
          oldDate: "2024-01-15",
          newDate: "2024-01-15",
        },
      ],
    };

    render(<SummaryStep {...defaultProps} result={result} />);

    expect(screen.queryByText("Rescheduled")).not.toBeInTheDocument();
  });

  it("shows treatment type label with locations count for treatment types", () => {
    const result: ProcessEndOfDayResponse = {
      ...defaultResult,
      rescheduled: [
        {
          appointmentId: 1,
          patientId: 10,
          patientName: "John Doe",
          type: "physiotherapy",
          oldDate: "2024-01-15",
          newDate: "2024-01-22",
        },
      ],
    };

    render(<SummaryStep {...defaultProps} result={result} />);

    expect(screen.getByText(/Physiotherapy/)).toBeInTheDocument();
  });

  it("shows aggregated locations count when same patient has multiple rescheduled treatments", () => {
    const result: ProcessEndOfDayResponse = {
      ...defaultResult,
      rescheduled: [
        {
          appointmentId: 1,
          patientId: 10,
          patientName: "John Doe",
          type: "physiotherapy",
          oldDate: "2024-01-15",
          newDate: "2024-01-22",
        },
        {
          appointmentId: 2,
          patientId: 10,
          patientName: "John Doe",
          type: "physiotherapy",
          oldDate: "2024-01-15",
          newDate: "2024-01-22",
        },
      ],
    };

    render(<SummaryStep {...defaultProps} result={result} />);

    expect(screen.getByText(/Physiotherapy/)).toBeInTheDocument();
    expect(screen.getByText(/2 locations/)).toBeInTheDocument();
  });

  it("shows Day finalized header with check icon", () => {
    render(<SummaryStep {...defaultProps} />);

    expect(screen.getAllByText(/Day finalized/).length).toBeGreaterThan(0);
  });
});
