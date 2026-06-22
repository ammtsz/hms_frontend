import React from "react";
import { render, screen } from "@testing-library/react";
import { AttendanceDateHeader } from "../AttendanceDateHeader";

// Mock dateHelpers
jest.mock("@/utils/dateUtils", () => ({
  formatDisplayDate: jest.fn((date: string) => {
    const [year, month, day] = date.split("-");
    return `${month}/${day}/${year}`;
  }),
}));

describe("AttendanceDateHeader", () => {
  it("renders normal attendance date without icons", () => {
    render(
      <AttendanceDateHeader
        date="2026-01-15"
        status="completed"
        treatmentTypeLabel="Assessment Consultation"
      />,
    );

    expect(screen.getByText("01/15/2026")).toBeInTheDocument();
    expect(screen.getByText("Assessment Consultation")).toBeInTheDocument();
  });

  it("renders cancelled attendance with Ban icon and label", () => {
    const { container } = render(
      <AttendanceDateHeader
        date="2026-01-20"
        status="cancelled"
        treatmentTypeLabel="Physiotherapy"
      />,
    );

    expect(screen.getByText("01/20/2026")).toBeInTheDocument();
    expect(screen.getByText("(CANCELLED)")).toBeInTheDocument();
    expect(screen.getByText("Physiotherapy")).toBeInTheDocument();

    // Check for Ban icon (lucide-react renders as svg)
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders missed attendance with AlertTriangle icon and label", () => {
    const { container } = render(
      <AttendanceDateHeader
        date="2026-01-25"
        status="missed"
        treatmentTypeLabel="TENS"
      />,
    );

    expect(screen.getByText("01/25/2026")).toBeInTheDocument();
    expect(screen.getByText("(MISSED)")).toBeInTheDocument();
    expect(screen.getByText("TENS")).toBeInTheDocument();

    // Check for AlertTriangle icon
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders days until text for non-absent scheduled appointments", () => {
    render(
      <AttendanceDateHeader
        date="2026-02-01"
        status="scheduled"
        treatmentTypeLabel="Assessment Consultation"
        daysUntilText="in 5 days"
      />,
    );

    expect(screen.getByText("02/01/2026")).toBeInTheDocument();
    expect(screen.getByText("(in 5 days)")).toBeInTheDocument();
  });

  it("does not render days until text for cancelled appointments", () => {
    render(
      <AttendanceDateHeader
        date="2026-02-05"
        status="cancelled"
        treatmentTypeLabel="Physiotherapy"
        daysUntilText="tomorrow"
      />,
    );

    expect(screen.queryByText("(tomorrow)")).not.toBeInTheDocument();
    expect(screen.getByText("(CANCELLED)")).toBeInTheDocument();
  });

  it("applies correct CSS classes for missed status", () => {
    render(
      <AttendanceDateHeader
        date="2026-01-10"
        status="missed"
        treatmentTypeLabel="Test Treatment"
      />,
    );

    const dateElement = screen.getByText("01/10/2026");
    expect(dateElement.className).toContain("line-through");
    expect(dateElement.className).toContain("text-gray-500");
  });

  it("applies correct CSS classes for cancelled status", () => {
    render(
      <AttendanceDateHeader
        date="2026-01-15"
        status="cancelled"
        treatmentTypeLabel="Test Treatment"
      />,
    );

    const dateElement = screen.getByText("01/15/2026");
    expect(dateElement.className).toContain("line-through");
    expect(dateElement.className).toContain("text-gray-500");
  });

  it("applies normal CSS classes for completed status", () => {
    render(
      <AttendanceDateHeader
        date="2026-01-20"
        status="completed"
        treatmentTypeLabel="Test Treatment"
      />,
    );

    const dateElement = screen.getByText("01/20/2026");
    expect(dateElement.className).toContain("text-gray-900");
    expect(dateElement.className).not.toContain("line-through");
  });
});
