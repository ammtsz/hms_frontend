import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Spinner from "../Spinner";

describe("Spinner", () => {
  it("should render with default props", () => {
    render(<Spinner />);

    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("w-6", "h-6"); // Default md size
    expect(screen.getAllByText("Loading...")[0]).toBeInTheDocument();
  });

  it("should render small size when specified", () => {
    render(<Spinner size="sm" />);

    const spinner = screen.getByRole("status");
    expect(spinner).toHaveClass("w-4", "h-4");
  });

  it("should render large size when specified", () => {
    render(<Spinner size="lg" />);

    const spinner = screen.getByRole("status");
    expect(spinner).toHaveClass("w-8", "h-8");
  });

  it("should apply custom className", () => {
    render(<Spinner className="text-red-500" />);

    const spinner = screen.getByRole("status");
    expect(spinner).toHaveClass("text-red-500");
  });

  it("should have proper accessibility attributes", () => {
    render(<Spinner />);

    const spinner = screen.getByRole("status");
    expect(spinner).toHaveAttribute("role", "status");

    const srText = screen.getAllByText("Loading...")[0];
    expect(srText).toHaveClass("sr-only");
  });

  it("should have spinning animation classes", () => {
    render(<Spinner />);

    const spinner = screen.getByRole("status");
    expect(spinner).toHaveClass("animate-spin", "rounded-full", "border-2");
  });
});
