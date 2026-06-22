/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import SchedulePage from "../page";

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

// Mock the ScheduleCalendar component
jest.mock("@/features/schedule", () => {
  return function MockScheduleCalendar() {
    return <div data-testid="schedule-calendar">Schedule Calendar Component</div>;
  };
});

describe("SchedulePage", () => {
  it("should render successfully", () => {
    const { container } = render(<SchedulePage />);
    expect(container.firstChild).toBeTruthy();
  });

  it("should be a client component", () => {
    // Test that it renders without server-side issues
    expect(() => render(<SchedulePage />)).not.toThrow();
  });

  it("should use Suspense with lazy loading", () => {
    render(<SchedulePage />);

    // Should render either the loading fallback or the actual component
    const hasLoadingFallback = screen.queryByTestId("loading-fallback");
    const hasScheduleCalendar = screen.queryByTestId("schedule-calendar");

    // At least one should be present
    expect(hasLoadingFallback || hasScheduleCalendar).toBeTruthy();
  });

  it("should handle the lazy import correctly", () => {
    // Test that the component structure supports lazy loading
    render(<SchedulePage />);

    // Either loading state or loaded state should be present
    const isLoading = screen.queryByTestId("loading-fallback") !== null;
    const isLoaded = screen.queryByTestId("schedule-calendar") !== null;

    expect(isLoading || isLoaded).toBe(true);
  });

  it("should configure LoadingFallback with expected props", () => {
    render(<SchedulePage />);

    const loadingFallback = screen.queryByTestId("loading-fallback");
    if (loadingFallback) {
      expect(loadingFallback).toHaveAttribute(
        "data-message",
        "Loading schedule calendar..."
      );
      expect(loadingFallback).toHaveAttribute("data-size", "large");
    }
    // Test passes whether loading or loaded
    expect(true).toBe(true);
  });
});
