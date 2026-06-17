import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorDisplay from "../ErrorDisplay";

describe("ErrorDisplay", () => {
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Visibility", () => {
    it("should not render when error is null", () => {
      render(<ErrorDisplay error={null} />);

      expect(screen.queryByText("Test error")).not.toBeInTheDocument();
    });

    it("should not render when error is empty string", () => {
      render(<ErrorDisplay error="" />);

      expect(screen.queryByText("Test error")).not.toBeInTheDocument();
    });

    it("should render when error is provided", () => {
      render(<ErrorDisplay error="Test error message" />);

      expect(screen.getByText("Test error message")).toBeInTheDocument();
    });
  });

  describe("Error Message Display", () => {
    it("should display error text with proper styling", () => {
      render(<ErrorDisplay error="Something went wrong" />);

      const errorText = screen.getByText("Something went wrong");
      expect(errorText).toBeInTheDocument();
      expect(errorText).toHaveClass("text-sm", "text-red-700");
    });

    it("should display long error messages", () => {
      const longError =
        "This is a very long error message that should still be displayed correctly with proper formatting and styling applied to it.";
      render(<ErrorDisplay error={longError} />);

      expect(screen.getByText(longError)).toBeInTheDocument();
    });

    it("should handle special characters in error messages", () => {
      const specialError =
        "Error: Failed to load data! (Code: 404) - Please try again.";
      render(<ErrorDisplay error={specialError} />);

      expect(screen.getByText(specialError)).toBeInTheDocument();
    });
  });

  describe("Container Styling", () => {
    it("should have default error styling", () => {
      render(<ErrorDisplay error="Test error" />);

      const container =
        screen.getByText("Test error").parentElement?.parentElement
          ?.parentElement;
      expect(container).toHaveClass(
        "p-4",
        "bg-red-50",
        "border-l-4",
        "border-red-400"
      );
    });

    it("should apply custom className", () => {
      render(<ErrorDisplay error="Test error" className="mt-4 mb-2" />);

      const container =
        screen.getByText("Test error").parentElement?.parentElement
          ?.parentElement;
      expect(container).toHaveClass("mt-4", "mb-2");
    });

    it("should preserve default styling when custom className is applied", () => {
      render(<ErrorDisplay error="Test error" className="custom-class" />);

      const container =
        screen.getByText("Test error").parentElement?.parentElement
          ?.parentElement;
      expect(container).toHaveClass(
        "p-4",
        "bg-red-50",
        "border-l-4",
        "border-red-400",
        "custom-class"
      );
    });
  });

  describe("Error Icon", () => {
    it("should display error icon", () => {
      render(<ErrorDisplay error="Test error" />);

      const icon = document.querySelector(".text-red-400");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass("h-5", "w-5");
    });

    it("should have proper SVG structure for error icon", () => {
      render(<ErrorDisplay error="Test error" />);

      const svg = document.querySelector("svg.h-5.w-5.text-red-400");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
      expect(svg).toHaveAttribute("fill", "none");
      expect(svg).toHaveAttribute("stroke", "currentColor");
    });
  });

  describe("Dismissible Functionality", () => {
    it("should not show dismiss button by default", () => {
      render(<ErrorDisplay error="Test error" />);

      expect(screen.queryByText("Dismiss")).not.toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should not show dismiss button when dismissible is false", () => {
      render(
        <ErrorDisplay
          error="Test error"
          dismissible={false}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.queryByText("Dismiss")).not.toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should not show dismiss button when dismissible is true but no onDismiss provided", () => {
      render(<ErrorDisplay error="Test error" dismissible={true} />);

      expect(screen.queryByText("Dismiss")).not.toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should show dismiss button when dismissible is true and onDismiss is provided", () => {
      render(
        <ErrorDisplay
          error="Test error"
          dismissible={true}
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButton = screen.getByRole("button");
      expect(dismissButton).toBeInTheDocument();
    });

    it("should call onDismiss when dismiss button is clicked", () => {
      render(
        <ErrorDisplay
          error="Test error"
          dismissible={true}
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButton = screen.getByRole("button");
      fireEvent.click(dismissButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it("should have proper accessibility for dismiss button", () => {
      render(
        <ErrorDisplay
          error="Test error"
          dismissible={true}
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButton = screen.getByRole("button", { name: "Dismiss" });
      expect(dismissButton).toHaveAttribute("type", "button");
    });

    it("should have proper styling for dismiss button", () => {
      render(
        <ErrorDisplay
          error="Test error"
          dismissible={true}
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButton = screen.getByRole("button");
      expect(dismissButton).toHaveClass(
        "inline-flex",
        "bg-red-50",
        "rounded-md",
        "p-1.5",
        "text-red-500",
        "hover:bg-red-100"
      );
    });
  });

  describe("Layout Structure", () => {
    it("should have proper flex layout", () => {
      render(<ErrorDisplay error="Test error" />);

      const flexContainer =
        screen.getByText("Test error").parentElement?.parentElement;
      expect(flexContainer).toHaveClass("flex");
    });

    it("should have icon container with proper styling", () => {
      render(<ErrorDisplay error="Test error" />);

      const iconContainer = document.querySelector(".flex-shrink-0");
      expect(iconContainer).toBeInTheDocument();
    });

    it("should have message container with proper styling", () => {
      render(<ErrorDisplay error="Test error" />);

      const messageContainer = screen.getByText("Test error").parentElement;
      expect(messageContainer).toHaveClass("ml-3", "flex-1");
    });

    it("should have dismiss button container with proper styling when dismissible", () => {
      render(
        <ErrorDisplay
          error="Test error"
          dismissible={true}
          onDismiss={mockOnDismiss}
        />
      );

      const dismissContainer =
        screen.getByRole("button").parentElement?.parentElement;
      expect(dismissContainer).toHaveClass("ml-auto", "pl-3");
    });
  });

  describe("Dismiss Button Icon", () => {
    it("should display close icon in dismiss button", () => {
      render(
        <ErrorDisplay
          error="Test error"
          dismissible={true}
          onDismiss={mockOnDismiss}
        />
      );

      const dismissIcon = document.querySelector("button svg");
      expect(dismissIcon).toBeInTheDocument();
      expect(dismissIcon).toHaveClass("h-3", "w-3");
      expect(dismissIcon).toHaveAttribute("viewBox", "0 0 24 24");
      expect(dismissIcon).toHaveAttribute("fill", "none");
      expect(dismissIcon).toHaveAttribute("stroke", "currentColor");
    });
  });

  describe("Interaction", () => {
    it("should handle multiple clicks on dismiss button", () => {
      render(
        <ErrorDisplay
          error="Test error"
          dismissible={true}
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButton = screen.getByRole("button");
      fireEvent.click(dismissButton);
      fireEvent.click(dismissButton);
      fireEvent.click(dismissButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(3);
    });

    it("should support keyboard navigation to dismiss button", () => {
      render(
        <ErrorDisplay
          error="Test error"
          dismissible={true}
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButton = screen.getByRole("button");
      dismissButton.focus();

      expect(dismissButton).toHaveFocus();
    });

    it("should handle click interaction on dismiss button", () => {
      render(
        <ErrorDisplay
          error="Test error"
          dismissible={true}
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButton = screen.getByRole("button");
      fireEvent.click(dismissButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very short error messages", () => {
      render(<ErrorDisplay error="!" />);

      expect(screen.getByText("!")).toBeInTheDocument();
    });

    it("should handle error messages with line breaks", () => {
      const multiLineError = "Line 1\nLine 2\nLine 3";
      render(<ErrorDisplay error={multiLineError} />);

      // Check each line individually as they may be rendered separately
      expect(screen.getByText(/Line 1/)).toBeInTheDocument();
      expect(screen.getByText(/Line 2/)).toBeInTheDocument();
      expect(screen.getByText(/Line 3/)).toBeInTheDocument();
    });

    it("should handle HTML-like content in error messages", () => {
      const htmlLikeError = "<div>This looks like HTML but is just text</div>";
      render(<ErrorDisplay error={htmlLikeError} />);

      expect(screen.getByText(htmlLikeError)).toBeInTheDocument();
    });

    it("should handle empty className gracefully", () => {
      render(<ErrorDisplay error="Test error" className="" />);

      const container =
        screen.getByText("Test error").parentElement?.parentElement
          ?.parentElement;
      expect(container).toHaveClass(
        "p-4",
        "bg-red-50",
        "border-l-4",
        "border-red-400"
      );
    });
  });

  describe("Component Rendering Consistency", () => {
    it("should maintain consistent structure across different props combinations", () => {
      const { rerender } = render(<ErrorDisplay error="Test 1" />);

      let container =
        screen.getByText("Test 1").parentElement?.parentElement?.parentElement;
      expect(container).toHaveClass("p-4", "bg-red-50");

      rerender(
        <ErrorDisplay
          error="Test 2"
          className="custom"
          dismissible={true}
          onDismiss={mockOnDismiss}
        />
      );

      container =
        screen.getByText("Test 2").parentElement?.parentElement?.parentElement;
      expect(container).toHaveClass("p-4", "bg-red-50", "custom");
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });
});
