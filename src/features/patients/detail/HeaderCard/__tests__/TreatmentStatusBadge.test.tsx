import React from "react";
import { render, screen } from "@testing-library/react";
import { TreatmentStatusBadge } from "../TreatmentStatusBadge";

describe("TreatmentStatusBadge", () => {
  it("renders Alta do tratamento for status A with purple styling", () => {
    render(<TreatmentStatusBadge status="A" />);

    const badge = screen.getByText("Alta do tratamento");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass(
      "bg-purple-50",
      "text-purple-700",
      "border-purple-500",
    );
  });

  it("renders Em Tratamento for status T with green styling", () => {
    render(<TreatmentStatusBadge status="T" />);

    const badge = screen.getByText("Em Tratamento");
    expect(badge).toHaveClass(
      "bg-green-50",
      "text-green-700",
      "border-green-500",
    );
  });

  it("handles unknown status gracefully", () => {
    render(<TreatmentStatusBadge status="X" />);

    expect(screen.getByText("X")).toHaveClass("bg-gray-50");
  });
});
