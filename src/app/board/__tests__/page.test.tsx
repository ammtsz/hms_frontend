/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AppointmentPage from "../page";

// Mock the PatientWalkInPanel component
jest.mock("@/features/board/components/WalkIn", () => ({
  PatientWalkInPanel: ({
    onRegisterNewAppointment,
  }: {
    onRegisterNewAppointment: (
      name: string,
      types: string[],
      isNew: boolean,
      priority: string,
    ) => void;
  }) => (
    <div data-testid="patient-walk-in-panel">
      <button
        data-testid="register-appointment-btn"
        onClick={() =>
          onRegisterNewAppointment("Test Patient", ["assessment"], true, "2")
        }
      >
        Register New Appointment
      </button>
    </div>
  ),
}));

// Mock the LoadingFallback component
jest.mock("@/components/common/LoadingFallback", () => {
  return function MockLoadingFallback({
    message,
    size,
  }: {
    message?: string;
    size?: string;
  }) {
    return (
      <div
        data-testid="loading-fallback"
        data-message={message}
        data-size={size}
      >
        {message}
      </div>
    );
  };
});

// Lazy import resolves to this module path
jest.mock("@/features/board/AppointmentsBoard", () => ({
  __esModule: true,
  default: function MockAppointmentsBoard({
    unscheduledCheckIn,
    onCheckInProcessed,
  }: {
    unscheduledCheckIn: {
      name: string;
      types: string[];
      isNew: boolean;
      priority: string;
    } | null;
    onCheckInProcessed: () => void;
  }) {
    return (
      <div data-testid="appointment-board">
        <div>Appointment Board Component</div>
        {unscheduledCheckIn && (
          <div data-testid="unscheduled-check-in">
            Patient: {unscheduledCheckIn.name}
            <button onClick={onCheckInProcessed} data-testid="process-check-in">
              Process Check-in
            </button>
          </div>
        )}
      </div>
    );
  },
}));

describe("AppointmentPage", () => {
  it("should render all main components", () => {
    render(<AppointmentPage />);

    expect(screen.getByTestId("patient-walk-in-panel")).toBeInTheDocument();
    expect(screen.getByText("Appointments Board")).toBeInTheDocument();

    // Should render either loading fallback or the actual component
    const hasLoadingFallback = screen.queryByTestId("loading-fallback");
    const hasAppointmentsBoard = screen.queryByTestId("appointment-board");
    expect(hasLoadingFallback || hasAppointmentsBoard).toBeTruthy();
  });

  it("should display the correct heading and description", () => {
    render(<AppointmentPage />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Appointments Board",
    );

    const description = screen.getByText(/Manage appointment flow/);
    expect(description).toBeInTheDocument();
    expect(description).toHaveTextContent(/dragging and dropping/);
    expect(description).toHaveTextContent(/settings button/);
  });

  it("should have proper layout structure", () => {
    const { container } = render(<AppointmentPage />);

    const mainContainer = container.firstChild as HTMLElement;
    expect(mainContainer).toHaveClass(
      "flex",
      "flex-col",
      "gap-8",
      "my-6",
      "sm:my-16",
    );

    // Board uses the shared Card primitive
    const cardElement = container.querySelector(
      ".rounded-lg.border.border-gray-200.bg-white",
    );
    expect(cardElement).toBeInTheDocument();
  });

  it("should handle unscheduled check-in state", () => {
    render(<AppointmentPage />);

    // Initially no unscheduled check-in
    expect(
      screen.queryByTestId("unscheduled-check-in"),
    ).not.toBeInTheDocument();

    // Trigger new appointment registration
    const registerButton = screen.getByTestId("register-appointment-btn");
    fireEvent.click(registerButton);

    // Should show unscheduled check-in
    expect(screen.getByTestId("unscheduled-check-in")).toBeInTheDocument();
    expect(screen.getByText("Patient: Test Patient")).toBeInTheDocument();
  });

  it("should clear unscheduled check-in when processed", () => {
    render(<AppointmentPage />);

    // Register new appointment
    const registerButton = screen.getByTestId("register-appointment-btn");
    fireEvent.click(registerButton);

    // Verify it's there
    expect(screen.getByTestId("unscheduled-check-in")).toBeInTheDocument();

    // Process the check-in
    const processButton = screen.getByTestId("process-check-in");
    fireEvent.click(processButton);

    // Should be cleared
    expect(
      screen.queryByTestId("unscheduled-check-in"),
    ).not.toBeInTheDocument();
  });

  it("should pass correct props to AppointmentsBoard", () => {
    render(<AppointmentPage />);

    // Register new appointment to trigger state change
    const registerButton = screen.getByTestId("register-appointment-btn");
    fireEvent.click(registerButton);

    // AppointmentsBoard should receive the unscheduled check-in data
    expect(screen.getByTestId("unscheduled-check-in")).toBeInTheDocument();
    expect(screen.getByText("Patient: Test Patient")).toBeInTheDocument();
  });

  it("should use Suspense for lazy loading AppointmentsBoard", () => {
    render(<AppointmentPage />);

    // Should render either loading fallback or the actual component
    const hasLoadingFallback = screen.queryByTestId("loading-fallback");
    const hasAppointmentsBoard = screen.queryByTestId("appointment-board");

    expect(hasLoadingFallback || hasAppointmentsBoard).toBeTruthy();
  });

  it("should be a client component", () => {
    // Test that it renders without server-side issues
    expect(() => render(<AppointmentPage />)).not.toThrow();
  });
});
