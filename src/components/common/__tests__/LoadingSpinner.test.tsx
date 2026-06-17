import React from "react";
import { render, screen } from "@testing-library/react";
import { LoadingSpinner } from "../LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders with default props", () => {
    render(<LoadingSpinner />);

    expect(screen.getByText("Carregando...")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders with custom message", () => {
    render(<LoadingSpinner message="Carregando dados do paciente..." />);

    expect(
      screen.getByText("Carregando dados do paciente...")
    ).toBeInTheDocument();
  });

  it("renders different sizes correctly", () => {
    const { rerender, container } = render(<LoadingSpinner size="small" />);
    expect(container.querySelector(".w-4.h-4")).toBeInTheDocument();

    rerender(<LoadingSpinner size="medium" />);
    expect(container.querySelector(".w-8.h-8")).toBeInTheDocument();

    rerender(<LoadingSpinner size="large" />);
    expect(container.querySelector(".w-12.h-12")).toBeInTheDocument();
  });

  it("hides spinner when showSpinner is false", () => {
    render(<LoadingSpinner showSpinner={false} />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByRole("status");
    expect(spinner).toHaveAttribute("aria-label", "Carregando");
  });
});
