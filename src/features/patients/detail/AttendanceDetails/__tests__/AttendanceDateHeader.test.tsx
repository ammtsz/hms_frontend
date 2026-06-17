import React from "react";
import { render, screen } from "@testing-library/react";
import { AttendanceDateHeader } from "../AttendanceDateHeader";

// Mock dateHelpers
jest.mock("@/utils/dateUtils", () => ({
  formatDateBR: jest.fn((date: string) => {
    // Simple mock implementation
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  }),
}));

describe("AttendanceDateHeader", () => {
  it("renders normal attendance date without icons", () => {
    render(
      <AttendanceDateHeader
        date="2026-01-15"
        status="completed"
        treatmentTypeLabel="Consulta"
      />,
    );

    expect(screen.getByText("15/01/2026")).toBeInTheDocument();
    expect(screen.getByText("Consulta")).toBeInTheDocument();
  });

  it("renders cancelled attendance with Ban icon and label", () => {
    const { container } = render(
      <AttendanceDateHeader
        date="2026-01-20"
        status="cancelled"
        treatmentTypeLabel="Fisioterapia"
      />,
    );

    expect(screen.getByText("20/01/2026")).toBeInTheDocument();
    expect(screen.getByText("(CANCELADO)")).toBeInTheDocument();
    expect(screen.getByText("Fisioterapia")).toBeInTheDocument();

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

    expect(screen.getByText("25/01/2026")).toBeInTheDocument();
    expect(screen.getByText("(FALTA)")).toBeInTheDocument();
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
        treatmentTypeLabel="Consulta"
        daysUntilText="em 5 dias"
      />,
    );

    expect(screen.getByText("01/02/2026")).toBeInTheDocument();
    expect(screen.getByText("(em 5 dias)")).toBeInTheDocument();
  });

  it("does not render days until text for cancelled appointments", () => {
    render(
      <AttendanceDateHeader
        date="2026-02-05"
        status="cancelled"
        treatmentTypeLabel="Fisioterapia"
        daysUntilText="amanhã"
      />,
    );

    expect(screen.queryByText("(amanhã)")).not.toBeInTheDocument();
    expect(screen.getByText("(CANCELADO)")).toBeInTheDocument();
  });

  it("applies correct CSS classes for missed status", () => {
    render(
      <AttendanceDateHeader
        date="2026-01-10"
        status="missed"
        treatmentTypeLabel="Test Treatment"
      />,
    );

    const dateElement = screen.getByText("10/01/2026");
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

    const dateElement = screen.getByText("15/01/2026");
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

    const dateElement = screen.getByText("20/01/2026");
    expect(dateElement.className).toContain("text-gray-900");
    expect(dateElement.className).not.toContain("line-through");
  });
});
