import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ShowMoreButton from "../ShowMoreButton";

describe("ShowMoreButton", () => {
  const mockOnClick = jest.fn();

  const defaultProps = {
    onClick: mockOnClick,
    totalItems: 25,
    visibleCount: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Visibility", () => {
    it("should render when there are remaining items", () => {
      render(<ShowMoreButton {...defaultProps} />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should not render when no remaining items (equal counts)", () => {
      render(
        <ShowMoreButton {...defaultProps} totalItems={10} visibleCount={10} />
      );

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should not render when visibleCount exceeds totalItems", () => {
      render(
        <ShowMoreButton {...defaultProps} totalItems={5} visibleCount={10} />
      );

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should not render when remainingItems is negative", () => {
      render(
        <ShowMoreButton {...defaultProps} totalItems={8} visibleCount={15} />
      );

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should render when there is exactly 1 remaining item", () => {
      render(
        <ShowMoreButton {...defaultProps} totalItems={11} visibleCount={10} />
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Button Text and Content", () => {
    it("should display correct text with default item label", () => {
      render(<ShowMoreButton {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Show more 10 items");
      expect(button).toHaveTextContent("+15");
    });

    it("should display correct text with custom item label", () => {
      render(<ShowMoreButton {...defaultProps} itemLabel="records" />);

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Show more 10 records");
    });

    it("should limit display count to 10 when more than 10 remaining", () => {
      render(
        <ShowMoreButton {...defaultProps} totalItems={50} visibleCount={10} />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Show more 10 items");
      expect(button).toHaveTextContent("+40");
    });

    it("should show actual remaining count when less than 10", () => {
      render(
        <ShowMoreButton {...defaultProps} totalItems={15} visibleCount={10} />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Show more 5 items");
      expect(button).toHaveTextContent("+5");
    });

    it("should show correct count for 1 remaining item", () => {
      render(
        <ShowMoreButton {...defaultProps} totalItems={11} visibleCount={10} />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Show more 1 items");
      expect(button).toHaveTextContent("+1");
    });
  });

  describe("Icon Display", () => {
    it("should display document icon", () => {
      render(<ShowMoreButton {...defaultProps} />);

      const icon = screen.getByText("📄");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("Counter Badge", () => {
    it("should display remaining count badge with proper styling", () => {
      render(<ShowMoreButton {...defaultProps} />);

      const badge = screen.getByText("+15");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass(
        "text-xs",
        "text-blue-500",
        "bg-blue-200",
        "px-2",
        "py-0.5",
        "rounded-full"
      );
    });

    it("should display correct remaining count in badge", () => {
      render(
        <ShowMoreButton {...defaultProps} totalItems={30} visibleCount={8} />
      );

      const badge = screen.getByText("+22");
      expect(badge).toBeInTheDocument();
    });
  });

  describe("Button Styling", () => {
    it("should have proper default styling", () => {
      render(<ShowMoreButton {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass(
        "inline-flex",
        "items-center",
        "justify-center",
        "gap-2",
        "px-3",
        "py-1.5",
        "text-sm",
        "font-semibold",
        "text-blue-600",
        "bg-blue-50",
        "border",
        "border-blue-200",
        "rounded-lg",
        "hover:bg-blue-100",
        "transition-colors",
      );
    });

    it("should apply custom className to container", () => {
      render(<ShowMoreButton {...defaultProps} className="custom-class" />);

      const container = screen.getByRole("button").parentElement;
      expect(container).toHaveClass(
        "flex",
        "justify-center",
        "pt-4",
        "custom-class"
      );
    });

    it("should handle empty className", () => {
      render(<ShowMoreButton {...defaultProps} className="" />);

      const container = screen.getByRole("button").parentElement;
      expect(container).toHaveClass("flex", "justify-center", "pt-4");
    });
  });

  describe("Disabled State", () => {
    it("should be enabled by default", () => {
      render(<ShowMoreButton {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).not.toBeDisabled();
    });

    it("should be disabled when disabled prop is true", () => {
      render(<ShowMoreButton {...defaultProps} disabled={true} />);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("should have disabled styling classes when disabled", () => {
      render(<ShowMoreButton {...defaultProps} disabled={true} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass(
        "disabled:opacity-60",
        "disabled:cursor-not-allowed",
      );
    });
  });

  describe("Click Handling", () => {
    it("should call onClick when button is clicked", () => {
      render(<ShowMoreButton {...defaultProps} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("should not call onClick when disabled", () => {
      render(<ShowMoreButton {...defaultProps} disabled={true} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it("should handle multiple clicks", () => {
      render(<ShowMoreButton {...defaultProps} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(3);
    });
  });

  describe("Accessibility", () => {
    it("should be focusable when not disabled", () => {
      render(<ShowMoreButton {...defaultProps} />);

      const button = screen.getByRole("button");
      button.focus();

      expect(button).toHaveFocus();
    });

    it("should have proper focus styling", () => {
      render(<ShowMoreButton {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass(
        "focus-visible:outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-blue-500",
        "focus-visible:ring-offset-2",
      );
    });

    it("should be keyboard accessible", () => {
      render(<ShowMoreButton {...defaultProps} />);

      const button = screen.getByRole("button");
      button.focus();
      expect(button).toHaveFocus();

      // Test that the button can receive focus and is clickable
      expect(button).not.toBeDisabled();
    });

    it("should support click interaction", () => {
      render(<ShowMoreButton {...defaultProps} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Layout Structure", () => {
    it("should have proper container layout", () => {
      render(<ShowMoreButton {...defaultProps} />);

      const container = screen.getByRole("button").parentElement;
      expect(container).toHaveClass("flex", "justify-center", "pt-4");
    });

    it("should have proper button inner structure", () => {
      render(<ShowMoreButton {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();

      // Check for icon span
      const icon = screen.getByText("📄");
      expect(icon).toBeInTheDocument();

      // Check for text span
      const textSpan = screen.getByText("Show more 10 items");
      expect(textSpan).toBeInTheDocument();

      // Check for badge span
      const badge = screen.getByText("+15");
      expect(badge).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle very large numbers", () => {
      render(
        <ShowMoreButton
          {...defaultProps}
          totalItems={1000000}
          visibleCount={50}
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Show more 10 items");
      expect(button).toHaveTextContent("+999950");
    });

    it("should handle zero visible count", () => {
      render(<ShowMoreButton {...defaultProps} visibleCount={0} />);

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Show more 10 items");
      expect(button).toHaveTextContent("+25");
    });

    it("should handle single digit remaining items", () => {
      render(
        <ShowMoreButton {...defaultProps} totalItems={13} visibleCount={10} />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Show more 3 items");
      expect(button).toHaveTextContent("+3");
    });

    it("should handle exactly 10 remaining items", () => {
      render(
        <ShowMoreButton {...defaultProps} totalItems={20} visibleCount={10} />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Show more 10 items");
      expect(button).toHaveTextContent("+10");
    });
  });

  describe("Item Label Variations", () => {
    it("should work with single character label", () => {
      render(<ShowMoreButton {...defaultProps} itemLabel="x" />);

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Show more 10 x");
    });

    it("should work with long item label", () => {
      render(
        <ShowMoreButton {...defaultProps} itemLabel="very long elements" />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent(
        "Show more 10 very long elements"
      );
    });

    it("should work with empty item label", () => {
      render(<ShowMoreButton {...defaultProps} itemLabel="" />);

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Show more 10 ");
    });

    it("should work with numeric-like item label", () => {
      render(<ShowMoreButton {...defaultProps} itemLabel="123" />);

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Show more 10 123");
    });
  });

  describe("Math Edge Cases", () => {
    it("should handle decimal totalItems (should work with integer conversion)", () => {
      render(
        <ShowMoreButton
          {...defaultProps}
          totalItems={25.7 as number}
          visibleCount={10}
        />
      );

      // JavaScript will handle this as 25 in calculations
      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("+15");
    });

    it("should handle negative totalItems gracefully", () => {
      render(
        <ShowMoreButton {...defaultProps} totalItems={-5} visibleCount={10} />
      );

      // Should not render because remainingItems will be negative
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should handle negative visibleCount", () => {
      render(
        <ShowMoreButton {...defaultProps} totalItems={25} visibleCount={-5} />
      );

      const button = screen.getByRole("button");
      // remainingItems = 25 - (-5) = 30, so Math.min(10, 30) = 10
      expect(button).toHaveTextContent("Show more 10 items");
      expect(button).toHaveTextContent("+30");
    });
  });

  describe("Component Re-rendering", () => {
    it("should update display when props change", () => {
      const { rerender } = render(<ShowMoreButton {...defaultProps} />);

      let button = screen.getByRole("button");
      expect(button).toHaveTextContent("+15");

      rerender(
        <ShowMoreButton {...defaultProps} totalItems={50} visibleCount={20} />
      );

      button = screen.getByRole("button");
      expect(button).toHaveTextContent("+30");
    });

    it("should hide when updated to no remaining items", () => {
      const { rerender } = render(<ShowMoreButton {...defaultProps} />);

      expect(screen.getByRole("button")).toBeInTheDocument();

      rerender(
        <ShowMoreButton {...defaultProps} totalItems={10} visibleCount={10} />
      );

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should show when updated to have remaining items", () => {
      const { rerender } = render(
        <ShowMoreButton {...defaultProps} totalItems={10} visibleCount={10} />
      );

      expect(screen.queryByRole("button")).not.toBeInTheDocument();

      rerender(
        <ShowMoreButton {...defaultProps} totalItems={15} visibleCount={10} />
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
      expect(screen.getByText("+5")).toBeInTheDocument();
    });
  });
});
