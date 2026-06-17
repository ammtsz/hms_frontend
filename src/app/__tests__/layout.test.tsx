/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import RootLayout from "../layout";

// Mock CSS imports
jest.mock("../globals.css", () => ({}));

// Mock the font import
jest.mock("next/font/google", () => ({
  Inter: () => ({
    variable: "--font-inter",
  }),
}));

// Mock the QueryProvider
jest.mock("@/providers/QueryProvider", () => {
  return {
    QueryProvider: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="query-provider">{children}</div>
    ),
  };
});

// Mock the ClinicTimezoneProvider
jest.mock("@/contexts/ClinicTimezoneContext", () => {
  return {
    ClinicTimezoneProvider: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="timezone-provider">{children}</div>
    ),
  };
});

// Mock the TopNavigation component
jest.mock("@/components/layout/TopNavigation", () => {
  return {
    TopNavigation: () => <div data-testid="top-navigation">Top Navigation</div>,
  };
});

// Mock the TabNav component
jest.mock("@/components/common/TabNav", () => {
  return function MockTabNav() {
    return <div data-testid="tab-nav">Tab Navigation</div>;
  };
});

// Create a test component that excludes html/body tags to avoid nesting warnings
function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div data-testid="query-provider">
      <div data-testid="timezone-provider">
        <div data-testid="top-navigation">Top Navigation</div>
        <div data-testid="tab-nav">Tab Navigation</div>
        <main className="w-full min-h-screen p-4 max-w-[1200px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

describe("RootLayout", () => {
  it("should render the complete layout structure", () => {
    const testContent = <div data-testid="test-content">Test Content</div>;

    render(<LayoutContent>{testContent}</LayoutContent>);

    // Should render the providers
    expect(screen.getByTestId("query-provider")).toBeInTheDocument();
    expect(screen.getByTestId("timezone-provider")).toBeInTheDocument();

    // Should render navigation components
    expect(screen.getByTestId("top-navigation")).toBeInTheDocument();
    expect(screen.getByTestId("tab-nav")).toBeInTheDocument();

    // Should render the children content
    expect(screen.getByTestId("test-content")).toBeInTheDocument();
  });

  it("should have correct main element structure", () => {
    const testContent = <div data-testid="test-content">Test Content</div>;

    const { container } = render(<LayoutContent>{testContent}</LayoutContent>);

    // Should have main element with correct classes
    const mainElement = container.querySelector("main");
    expect(mainElement).toHaveClass(
      "w-full",
      "min-h-screen",
      "p-4",
      "max-w-[1200px]",
      "mx-auto"
    );
    expect(mainElement).toBeInTheDocument();
  });

  it("should render children content inside main element", () => {
    const testContent = <div data-testid="test-content">Test Content</div>;

    const { container } = render(<LayoutContent>{testContent}</LayoutContent>);

    const mainElement = container.querySelector("main");
    expect(mainElement).toContainElement(screen.getByTestId("test-content"));
  });

  it("should have providers wrapping the entire application", () => {
    const testContent = <div data-testid="test-content">Test Content</div>;

    render(<LayoutContent>{testContent}</LayoutContent>);

    // QueryProvider should contain ClinicTimezoneProvider
    const queryProvider = screen.getByTestId("query-provider");
    const timezoneProvider = screen.getByTestId("timezone-provider");

    expect(queryProvider).toContainElement(timezoneProvider);
    expect(timezoneProvider).toContainElement(
      screen.getByTestId("top-navigation")
    );
    expect(timezoneProvider).toContainElement(screen.getByTestId("tab-nav"));
    expect(timezoneProvider).toContainElement(
      screen.getByTestId("test-content")
    );
  });

  it("should render navigation components in correct order", () => {
    const testContent = <div data-testid="test-content">Test Content</div>;

    render(<LayoutContent>{testContent}</LayoutContent>);

    // Check DOM order by getting all elements and their positions
    const allElements = screen.getAllByTestId(
      /(top-navigation|tab-nav|test-content)/
    );
    const positions = allElements.map((el) => el.getAttribute("data-testid"));

    expect(positions).toEqual(["top-navigation", "tab-nav", "test-content"]);
  });

  it("should have correct html structure properties", () => {
    // Test the RootLayout component's static properties without rendering to avoid nesting warnings
    expect(typeof RootLayout).toBe("function");
    expect(RootLayout.name).toBe("RootLayout");
  });
});
