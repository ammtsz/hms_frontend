/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AttendancePage from "../page";

// Mock the PatientWalkInPanel component
jest.mock("@/features/board/components/WalkIn", () => ({
  PatientWalkInPanel: ({
    onRegisterNewAttendance,
  }: {
    onRegisterNewAttendance: (
      name: string,
      types: string[],
      isNew: boolean,
      priority: string,
    ) => void;
  }) => (
    <div data-testid="patient-walk-in-panel">
      <button
        data-testid="register-attendance-btn"
        onClick={() =>
          onRegisterNewAttendance("Test Patient", ["assessment"], true, "2")
        }
      >
        Register New Attendance
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
jest.mock("@/features/board/AttendanceBoard", () => ({
  __esModule: true,
  default: function MockAttendanceBoard({
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
      <div data-testid="attendance-board">
        <div>Attendance Board Component</div>
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

describe("AttendancePage", () => {
  it("should render all main components", () => {
    render(<AttendancePage />);

    expect(screen.getByTestId("patient-walk-in-panel")).toBeInTheDocument();
    expect(screen.getByText("Attendance Board")).toBeInTheDocument();

    // Should render either loading fallback or the actual component
    const hasLoadingFallback = screen.queryByTestId("loading-fallback");
    const hasAttendanceBoard = screen.queryByTestId("attendance-board");
    expect(hasLoadingFallback || hasAttendanceBoard).toBeTruthy();
  });

  it("should display the correct heading and description", () => {
    render(<AttendancePage />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Attendance Board",
    );

    const description = screen.getByText(/Manage attendance flow/);
    expect(description).toBeInTheDocument();
    expect(description).toHaveTextContent(/dragging and dropping/);
    expect(description).toHaveTextContent(/settings button/);
  });

  it("should have proper layout structure", () => {
    const { container } = render(<AttendancePage />);

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
    render(<AttendancePage />);

    // Initially no unscheduled check-in
    expect(
      screen.queryByTestId("unscheduled-check-in"),
    ).not.toBeInTheDocument();

    // Trigger new attendance registration
    const registerButton = screen.getByTestId("register-attendance-btn");
    fireEvent.click(registerButton);

    // Should show unscheduled check-in
    expect(screen.getByTestId("unscheduled-check-in")).toBeInTheDocument();
    expect(screen.getByText("Patient: Test Patient")).toBeInTheDocument();
  });

  it("should clear unscheduled check-in when processed", () => {
    render(<AttendancePage />);

    // Register new attendance
    const registerButton = screen.getByTestId("register-attendance-btn");
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

  it("should pass correct props to AttendanceBoard", () => {
    render(<AttendancePage />);

    // Register new attendance to trigger state change
    const registerButton = screen.getByTestId("register-attendance-btn");
    fireEvent.click(registerButton);

    // AttendanceBoard should receive the unscheduled check-in data
    expect(screen.getByTestId("unscheduled-check-in")).toBeInTheDocument();
    expect(screen.getByText("Patient: Test Patient")).toBeInTheDocument();
  });

  it("should use Suspense for lazy loading AttendanceBoard", () => {
    render(<AttendancePage />);

    // Should render either loading fallback or the actual component
    const hasLoadingFallback = screen.queryByTestId("loading-fallback");
    const hasAttendanceBoard = screen.queryByTestId("attendance-board");

    expect(hasLoadingFallback || hasAttendanceBoard).toBeTruthy();
  });

  it("should be a client component", () => {
    // Test that it renders without server-side issues
    expect(() => render(<AttendancePage />)).not.toThrow();
  });
});
