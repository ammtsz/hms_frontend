import React from "react";
import { render, screen } from "@testing-library/react";
import { TreatmentStatusBadge } from "../TreatmentStatusBadge";

describe("TreatmentStatusBadge", () => {
  it("renders New patient for status N with blue styling", () => {
    render(<TreatmentStatusBadge status="N" />);

    const badge = screen.getByText("New patient");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-blue-50", "text-blue-700", "border-blue-500");
  });

  it("renders Discharged for status A with purple styling", () => {
    render(<TreatmentStatusBadge status="A" />);

    const badge = screen.getByText("Discharged");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass(
      "bg-purple-50",
      "text-purple-700",
      "border-purple-500",
    );
  });

  it("renders In Treatment for status T with green styling", () => {
    render(<TreatmentStatusBadge status="T" />);

    const badge = screen.getByText("In Treatment");
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
