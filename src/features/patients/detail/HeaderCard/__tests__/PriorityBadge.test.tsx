import React from "react";
import { render, screen } from "@testing-library/react";
import { PriorityBadge } from "../PriorityBadge";
import { usePriorities } from "@/api/query/hooks/usePriorityOptionsQueries";

jest.mock("@/api/query/hooks/usePriorityOptionsQueries", () => ({
  usePriorities: jest.fn(),
}));

const mockUsePriorities = usePriorities as jest.MockedFunction<typeof usePriorities>;

const mockPriorities = [
  { value: "1", label: "Exceção" },
  { value: "2", label: "Idoso/crianças" },
  { value: "3", label: "Padrão" },
] as Array<{ value: string; label: string }>;

describe("PriorityBadge", () => {
  beforeEach(() => {
    mockUsePriorities.mockReturnValue({
      data: mockPriorities,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof usePriorities>);
  });

  describe("Priority Level 1 (Exceção)", () => {
    it("should render with correct label and red styling", () => {
      render(<PriorityBadge priority="1" />);

      const badge = screen.getByText("P1 • Exceção");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("border-red-500", "text-red-700", "bg-red-50");
    });
  });

  describe("Priority Level 2 (Idoso/crianças)", () => {
    it("should render with correct label and yellow styling", () => {
      render(<PriorityBadge priority="2" />);

      const badge = screen.getByText("P2 • Idoso/crianças");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass(
        "border-yellow-500",
        "text-yellow-700",
        "bg-yellow-50",
      );
    });
  });

  describe("Priority Level 3 (Padrão)", () => {
    it("should render with correct label and blue styling", () => {
      render(<PriorityBadge priority="3" />);

      const badge = screen.getByText("P3 • Padrão");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass(
        "border-blue-500",
        "text-blue-700",
        "bg-blue-50",
      );
    });
  });

  describe("Unknown Priority Level", () => {
    it("should render priority value as label with default gray styling", () => {
      render(<PriorityBadge priority="999" />);

      const badge = screen.getByText("P999 • 999");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass(
        "border-gray-400",
        "text-gray-600",
        "bg-gray-50",
      );
    });
  });

  describe("Additional Styling", () => {
    it("should apply additional className when provided", () => {
      render(<PriorityBadge priority="1" className="custom-class" />);

      const badge = screen.getByText("P1 • Exceção");
      expect(badge).toHaveClass("custom-class");
    });

    it("should maintain base classes when custom className is provided", () => {
      render(<PriorityBadge priority="2" className="ml-4" />);

      const badge = screen.getByText("P2 • Idoso/crianças");
      expect(badge).toHaveClass(
        "inline-flex",
        "items-center",
        "px-3",
        "rounded",
        "text-sm",
        "font-medium",
        "border",
        "rounded-md",
        "h-8",
        "ml-4",
      );
    });
  });

  describe("Base Styling", () => {
    it("should always include base classes", () => {
      render(<PriorityBadge priority="1" />);

      const badge = screen.getByText("P1 • Exceção");
      expect(badge).toHaveClass(
        "inline-flex",
        "items-center",
        "px-3",
        "rounded",
        "text-sm",
        "font-medium",
        "border",
        "rounded-md",
        "h-8",
      );
    });
  });
});
