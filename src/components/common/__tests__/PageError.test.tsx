import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { PageError } from "../PageError";

// Mock Next.js Link component
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

describe("PageError", () => {
  const defaultProps = {
    error: "Test error",
  };

  it("renders error message", () => {
    render(<PageError {...defaultProps} />);

    expect(screen.getByText("Test error")).toBeInTheDocument();
    expect(screen.getByText("Oops! Something went wrong")).toBeInTheDocument();
  });

  it("renders custom title", () => {
    render(<PageError {...defaultProps} title="Custom Title" />);

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
  });

  it("shows retry button when reset function is provided", () => {
    const mockReset = jest.fn();
    render(<PageError {...defaultProps} reset={mockReset} />);

    const retryButton = screen.getByText("Try Again");
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it("shows back button with default props", () => {
    render(<PageError {...defaultProps} />);

    const backButton = screen.getByText("Back to Patients");
    expect(backButton).toBeInTheDocument();
    expect(backButton.closest("a")).toHaveAttribute("href", "/patients");
  });

  it("shows custom back button", () => {
    render(
      <PageError
        {...defaultProps}
        backHref="/custom"
        backLabel="Custom go back"
      />,
    );

    const backButton = screen.getByText("Custom go back");
    expect(backButton).toBeInTheDocument();
    expect(backButton.closest("a")).toHaveAttribute("href", "/custom");
  });

  it("hides back button when showBackButton is false", () => {
    render(<PageError {...defaultProps} showBackButton={false} />);

    expect(screen.queryByText("Back to Patients")).not.toBeInTheDocument();
  });

  it("shows both retry and back buttons when both are enabled", () => {
    const mockReset = jest.fn();
    render(<PageError {...defaultProps} reset={mockReset} />);

    expect(screen.getByText("Try Again")).toBeInTheDocument();
    expect(screen.getByText("Back to Patients")).toBeInTheDocument();
  });
});
