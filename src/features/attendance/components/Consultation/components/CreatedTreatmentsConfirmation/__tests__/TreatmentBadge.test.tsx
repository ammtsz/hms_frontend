import React from "react";
import { render, screen } from "@testing-library/react";
import { TreatmentBadge } from "../TreatmentBadge";

describe("TreatmentBadge", () => {
  describe("badge variant", () => {
    it("should render physiotherapy badge", () => {
      render(<TreatmentBadge type="physiotherapy" variant="badge" />);

      const badge = screen.getByText(/Fisioterapia/i);
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("bg-yellow-100", "text-yellow-800");
    });

    it("should render tens badge", () => {
      render(<TreatmentBadge type="tens" variant="badge" />);

      const badge = screen.getByText(/TENS/i);
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("bg-purple-100", "text-purple-800");
    });

    it("should default to badge variant", () => {
      render(<TreatmentBadge type="physiotherapy" />);

      const badge = screen.getByText(/Fisioterapia/i);
      expect(badge).toBeInTheDocument();
    });
  });

  describe("icon variant", () => {
    it("should render physiotherapy icon", () => {
      const { container } = render(
        <TreatmentBadge type="physiotherapy" variant="icon" />,
      );

      const icon = container.querySelector(".bg-yellow-50");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass("w-12", "h-12", "rounded-full");
    });

    it("should render tens icon", () => {
      const { container } = render(
        <TreatmentBadge type="tens" variant="icon" />,
      );

      const icon = container.querySelector(".bg-blue-50");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass("w-12", "h-12", "rounded-full");
    });
  });
});
