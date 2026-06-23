import React from "react";
import { render, screen } from "@testing-library/react";
import AppointmentTypeTag from "../AppointmentTypeTag";
import { AppointmentType } from "@/types/types";

describe("AppointmentTypeTag", () => {
  describe("renders correctly for all appointment types", () => {
    test.each([
      ["tens", "TENS", "bg-blue-100", "text-blue-700"],
      ["physiotherapy", "Physiotherapy", "bg-yellow-100", "text-yellow-700"],
      ["assessment", "Assessment Consultation", "bg-gray-100", "text-gray-700"],
    ])(
      "renders %s type correctly",
      (type, expectedLabel, expectedBg, expectedText) => {
        render(<AppointmentTypeTag type={type as AppointmentType} count={1} />);

        expect(screen.getByText("1")).toBeInTheDocument();
        const tag = screen.getByText("1");
        expect(tag).toHaveClass(expectedBg);
        expect(tag).toHaveClass(expectedText);
        expect(tag).toHaveAttribute(
          "title",
          expect.stringContaining(expectedLabel),
        );
      },
    );
  });

  describe("count and title", () => {
    it("shows count as visible text", () => {
      render(<AppointmentTypeTag type="physiotherapy" count={3} />);
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("appends locations to title when count is greater than 1", () => {
      render(<AppointmentTypeTag type="tens" count={2} />);
      expect(screen.getByText("2")).toHaveAttribute(
        "title",
        expect.stringMatching(/\(2 locations\)/),
      );
    });
  });

  describe("size variations", () => {
    it("renders small size by default", () => {
      render(<AppointmentTypeTag type="tens" count={1} />);

      const tag = screen.getByText("1");
      expect(tag).toHaveClass("px-2", "py-0.5", "text-xs");
    });

    it("renders medium size when specified", () => {
      render(<AppointmentTypeTag type="tens" count={1} size="md" />);

      const tag = screen.getByText("1");
      expect(tag).toHaveClass("px-3", "py-1", "text-sm");
    });
  });

  describe("styling consistency", () => {
    it("applies consistent base classes", () => {
      render(<AppointmentTypeTag type="assessment" count={1} />);

      const tag = screen.getByText("1");
      expect(tag).toHaveClass(
        "inline-flex",
        "items-center",
        "rounded-full",
        "border",
        "font-medium",
      );
    });
  });

  describe("edge cases", () => {
    it("handles unknown appointment type gracefully", () => {
      render(
        <AppointmentTypeTag type={"unknown" as AppointmentType} count={1} />,
      );

      expect(screen.getByText("1")).toBeInTheDocument();
      const tag = screen.getByText("1");
      expect(tag).toHaveClass("bg-gray-100", "text-gray-500");
      expect(tag).toHaveAttribute(
        "title",
        expect.stringContaining("Unknown"),
      );
    });
  });
});
