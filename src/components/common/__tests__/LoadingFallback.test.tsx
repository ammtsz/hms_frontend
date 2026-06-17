import React from "react";
import { render, screen } from "@testing-library/react";
import LoadingFallback from "../LoadingFallback";

describe("LoadingFallback", () => {
  it("renders with default props", () => {
    render(<LoadingFallback />);

    expect(screen.getByText("Carregando...")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders with custom message", () => {
    const customMessage = "Carregando dados específicos...";
    render(<LoadingFallback message={customMessage} />);

    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it("renders without spinner when showSpinner is false", () => {
    render(<LoadingFallback showSpinner={false} />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  it("applies correct size classes", () => {
    const { container: smallContainer } = render(
      <LoadingFallback size="small" />
    );
    expect(smallContainer.firstChild).toHaveClass("p-4", "text-sm");

    const { container: mediumContainer } = render(
      <LoadingFallback size="medium" />
    );
    expect(mediumContainer.firstChild).toHaveClass("p-8", "text-base");

    const { container: largeContainer } = render(
      <LoadingFallback size="large" />
    );
    expect(largeContainer.firstChild).toHaveClass("p-12", "text-lg");
  });

  it("applies custom className", () => {
    const customClass = "custom-loading-class";
    const { container } = render(<LoadingFallback className={customClass} />);

    expect(container.firstChild).toHaveClass(customClass);
  });

  it("renders spinner with correct size classes", () => {
    const { container: smallContainer } = render(
      <LoadingFallback size="small" />
    );
    const smallSpinner = smallContainer.querySelector('[role="status"]');
    expect(smallSpinner).toHaveClass("w-4", "h-4");

    const { container: mediumContainer } = render(
      <LoadingFallback size="medium" />
    );
    const mediumSpinner = mediumContainer.querySelector('[role="status"]');
    expect(mediumSpinner).toHaveClass("w-6", "h-6");

    const { container: largeContainer } = render(
      <LoadingFallback size="large" />
    );
    const largeSpinner = largeContainer.querySelector('[role="status"]');
    expect(largeSpinner).toHaveClass("w-8", "h-8");
  });
});
