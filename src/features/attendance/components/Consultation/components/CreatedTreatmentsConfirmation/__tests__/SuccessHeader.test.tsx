import React from "react";
import { render, screen } from "@testing-library/react";
import { SuccessHeader } from "../SuccessHeader";

describe("SuccessHeader", () => {
  it("should render success message", () => {
    render(<SuccessHeader />);

    expect(
      screen.getByText(/Tratamento registrado com sucesso!/i),
    ).toBeInTheDocument();
  });

  it("should render custom message when provided", () => {
    const customMessage = "Custom success message";
    render(<SuccessHeader customMessage={customMessage} />);

    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it("should display success icon", () => {
    const { container } = render(<SuccessHeader />);

    const icon = container.querySelector(".bg-green-100");
    expect(icon).toBeInTheDocument();
  });

  it("should not render additional text without custom message", () => {
    const { container } = render(<SuccessHeader />);

    // Should only have the heading, no additional paragraph
    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs).toHaveLength(0);
  });
});
