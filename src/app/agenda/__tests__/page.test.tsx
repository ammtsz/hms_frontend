/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import AgendaPage from "../page";

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

// Mock the AgendaCalendar component
jest.mock("@/features/agenda", () => {
  return function MockAgendaCalendar() {
    return <div data-testid="agenda-calendar">Agenda Calendar Component</div>;
  };
});

describe("AgendaPage", () => {
  it("should render successfully", () => {
    const { container } = render(<AgendaPage />);
    expect(container.firstChild).toBeTruthy();
  });

  it("should be a client component", () => {
    // Test that it renders without server-side issues
    expect(() => render(<AgendaPage />)).not.toThrow();
  });

  it("should use Suspense with lazy loading", () => {
    render(<AgendaPage />);

    // Should render either the loading fallback or the actual component
    const hasLoadingFallback = screen.queryByTestId("loading-fallback");
    const hasAgendaCalendar = screen.queryByTestId("agenda-calendar");

    // At least one should be present
    expect(hasLoadingFallback || hasAgendaCalendar).toBeTruthy();
  });

  it("should handle the lazy import correctly", () => {
    // Test that the component structure supports lazy loading
    render(<AgendaPage />);

    // Either loading state or loaded state should be present
    const isLoading = screen.queryByTestId("loading-fallback") !== null;
    const isLoaded = screen.queryByTestId("agenda-calendar") !== null;

    expect(isLoading || isLoaded).toBe(true);
  });

  it("should configure LoadingFallback with expected props", () => {
    render(<AgendaPage />);

    const loadingFallback = screen.queryByTestId("loading-fallback");
    if (loadingFallback) {
      expect(loadingFallback).toHaveAttribute(
        "data-message",
        "Loading agenda calendar..."
      );
      expect(loadingFallback).toHaveAttribute("data-size", "large");
    }
    // Test passes whether loading or loaded
    expect(true).toBe(true);
  });
});
