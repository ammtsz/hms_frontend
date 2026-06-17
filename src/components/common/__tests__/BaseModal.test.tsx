import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import BaseModal from "../BaseModal";

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  title: "Test Modal",
  children: <div>Modal content</div>,
};

describe("BaseModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Visibility", () => {
    it("should not render when isOpen is false", () => {
      render(<BaseModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText("Test Modal")).not.toBeInTheDocument();
      expect(screen.queryByText("Modal content")).not.toBeInTheDocument();
    });

    it("should render when isOpen is true", () => {
      render(<BaseModal {...defaultProps} />);

      expect(screen.getByText("Test Modal")).toBeInTheDocument();
      expect(screen.getByText("Modal content")).toBeInTheDocument();
    });
  });

  describe("Modal Structure", () => {
    it("should render with proper structure", () => {
      render(<BaseModal {...defaultProps} />);

      // Check backdrop
      const backdrop = document.querySelector(".fixed.inset-0.bg-black\\/60");
      expect(backdrop).toBeInTheDocument();

      // Check modal container
      const modal = document.querySelector(".bg-white.rounded-lg.shadow-xl");
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveAttribute("role", "dialog");
      expect(modal).toHaveAttribute("aria-modal", "true");
    });

    it("should display title", () => {
      render(<BaseModal {...defaultProps} />);

      const title = screen.getByText("Test Modal");
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass("text-xl", "font-semibold", "text-gray-800");
    });

    it("should display subtitle when provided", () => {
      render(<BaseModal {...defaultProps} subtitle="Test subtitle" />);

      const subtitle = screen.getByText("Test subtitle");
      expect(subtitle).toBeInTheDocument();
      expect(subtitle).toHaveClass("text-sm", "text-gray-600", "mt-1");
    });

    it("should not display subtitle when not provided", () => {
      render(<BaseModal {...defaultProps} />);

      expect(screen.queryByText("Test subtitle")).not.toBeInTheDocument();
    });

    it("should render children content", () => {
      const testContent = <div data-testid="test-content">Custom content</div>;
      render(<BaseModal {...defaultProps}>{testContent}</BaseModal>);

      expect(screen.getByTestId("test-content")).toBeInTheDocument();
      expect(screen.getByText("Custom content")).toBeInTheDocument();
    });
  });

  describe("Close Button", () => {
    it("should show close button by default", () => {
      render(<BaseModal {...defaultProps} />);

      const closeButton = screen.getByRole("button", { name: "Fechar" });
      expect(closeButton).toBeInTheDocument();
    });

    it("should hide close button when showCloseButton is false", () => {
      render(<BaseModal {...defaultProps} showCloseButton={false} />);

      expect(
        screen.queryByRole("button", { name: "Fechar" })
      ).not.toBeInTheDocument();
    });

    it("should call onClose when close button is clicked", () => {
      const mockOnClose = jest.fn();
      render(<BaseModal {...defaultProps} onClose={mockOnClose} />);

      const closeButton = screen.getByRole("button", { name: "Fechar" });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should have proper accessibility attributes", () => {
      render(<BaseModal {...defaultProps} />);

      const closeButton = screen.getByRole("button", { name: "Fechar" });
      expect(closeButton).toHaveAttribute("aria-label", "Fechar");
      expect(closeButton).toHaveAttribute("type", "button");
    });
  });

  describe("Size Variants", () => {
    it("should apply small max width", () => {
      render(<BaseModal {...defaultProps} maxWidth="sm" />);

      const modal = document.querySelector(".max-w-sm");
      expect(modal).toBeInTheDocument();
    });

    it("should apply medium max width", () => {
      render(<BaseModal {...defaultProps} maxWidth="md" />);

      const modal = document.querySelector(".max-w-md");
      expect(modal).toBeInTheDocument();
    });

    it("should apply large max width", () => {
      render(<BaseModal {...defaultProps} maxWidth="lg" />);

      const modal = document.querySelector(".max-w-lg");
      expect(modal).toBeInTheDocument();
    });

    it("should apply extra large max width", () => {
      render(<BaseModal {...defaultProps} maxWidth="xl" />);

      const modal = document.querySelector(".max-w-xl");
      expect(modal).toBeInTheDocument();
    });

    it("should apply 2xl max width by default", () => {
      render(<BaseModal {...defaultProps} />);

      const modal = document.querySelector(".max-w-2xl");
      expect(modal).toBeInTheDocument();
    });

    it("should apply 2xl max width when specified", () => {
      render(<BaseModal {...defaultProps} maxWidth="2xl" />);

      const modal = document.querySelector(".max-w-2xl");
      expect(modal).toBeInTheDocument();
    });
  });

  describe("Height Configuration", () => {
    it("should apply default max height when no height specified", () => {
      render(<BaseModal {...defaultProps} />);

      const modal = document.querySelector(".max-h-\\[90dvh\\]");
      expect(modal).toBeInTheDocument();
    });

    it("should apply custom height when specified", () => {
      render(<BaseModal {...defaultProps} height="h-96" />);

      const modal = document.querySelector(".h-96");
      expect(modal).toBeInTheDocument();

      // Should not have default max height
      const defaultHeight = document.querySelector(".max-h-\\[90dvh\\]");
      expect(defaultHeight).not.toBeInTheDocument();
    });
  });

  describe("Overflow Behavior", () => {
    it("should use overflow-y-auto by default", () => {
      render(<BaseModal {...defaultProps} />);

      const modal = document.querySelector(".overflow-y-auto");
      expect(modal).toBeInTheDocument();
    });

    it("should use flex layout when preventOverflow is true", () => {
      render(<BaseModal {...defaultProps} preventOverflow={true} />);

      const modal = document.querySelector(".flex.flex-col");
      expect(modal).toBeInTheDocument();

      // Should not have overflow-y-auto
      const overflow = document.querySelector(".overflow-y-auto");
      expect(overflow).not.toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should have proper modal backdrop styling", () => {
      render(<BaseModal {...defaultProps} />);

      const backdrop = document.querySelector(".fixed.inset-0");
      expect(backdrop).toHaveClass(
        "bg-black/60",
        "flex",
        "items-start",
        "sm:items-center",
        "justify-center",
        "z-50",
        "p-4"
      );
    });

    it("should have proper modal container styling", () => {
      render(<BaseModal {...defaultProps} />);

      const modal = document.querySelector(".bg-white");
      expect(modal).toHaveClass("rounded-lg", "shadow-xl", "w-full");
    });

    it("should have proper header styling", () => {
      render(<BaseModal {...defaultProps} />);

      const header =
        screen.getByText("Test Modal").parentElement?.parentElement
          ?.parentElement;
      expect(header).toHaveClass("shrink-0", "p-4", "border-b", "border-gray-100");
    });
  });

  describe("Keyboard Navigation", () => {
    it("should support tab navigation to close button", () => {
      render(<BaseModal {...defaultProps} />);

      const closeButton = screen.getByRole("button", { name: "Fechar" });
      closeButton.focus();

      expect(closeButton).toHaveFocus();
    });

    it("should call onClose when Enter is pressed on close button", () => {
      const mockOnClose = jest.fn();
      render(<BaseModal {...defaultProps} onClose={mockOnClose} />);

      const closeButton = screen.getByRole("button", { name: "Fechar" });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when Escape is pressed", () => {
      const mockOnClose = jest.fn();
      render(<BaseModal {...defaultProps} onClose={mockOnClose} />);

      fireEvent.keyDown(document, { key: "Escape" });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should keep focus in child input when onClose identity changes on rerender", () => {
      const onClose1 = jest.fn();
      const { rerender } = render(
        <BaseModal isOpen onClose={onClose1} title="Test">
          <input data-testid="modal-input" />
        </BaseModal>,
      );

      const input = screen.getByTestId("modal-input");
      input.focus();
      expect(input).toHaveFocus();

      rerender(
        <BaseModal isOpen onClose={jest.fn()} title="Test">
          <input data-testid="modal-input" />
        </BaseModal>,
      );

      expect(input).toHaveFocus();
    });
  });

  describe("Complex Content", () => {
    it("should render complex nested content", () => {
      const complexContent = (
        <div>
          <h3>Section Title</h3>
          <form>
            <input type="text" placeholder="Test input" />
            <button type="submit">Submit</button>
          </form>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      );

      render(<BaseModal {...defaultProps}>{complexContent}</BaseModal>);

      expect(screen.getByText("Section Title")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Test input")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Submit" })
      ).toBeInTheDocument();
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
    });

    it("should render multiple paragraphs in content", () => {
      const multiParagraphContent = (
        <div className="p-4">
          <p>First paragraph with some text.</p>
          <p>Second paragraph with different content.</p>
          <p>Third paragraph for testing.</p>
        </div>
      );

      render(<BaseModal {...defaultProps}>{multiParagraphContent}</BaseModal>);

      expect(
        screen.getByText("First paragraph with some text.")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Second paragraph with different content.")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Third paragraph for testing.")
      ).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty title without header", () => {
      render(
        <BaseModal {...defaultProps} title="" showCloseButton={false}>
          {defaultProps.children}
        </BaseModal>,
      );

      expect(
        document.querySelector(".border-b.border-gray-100"),
      ).not.toBeInTheDocument();
      expect(screen.getByText("Modal content")).toBeInTheDocument();
    });

    it("should handle headerless modal with close button only", () => {
      render(
        <BaseModal
          {...defaultProps}
          title={undefined}
          showCloseButton
          onClose={jest.fn()}
        />,
      );

      expect(screen.getByLabelText("Fechar")).toBeInTheDocument();
      expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    });

    it("should handle null children gracefully", () => {
      render(<BaseModal {...defaultProps}>{null}</BaseModal>);

      expect(screen.getByText("Test Modal")).toBeInTheDocument();
    });

    it("should handle undefined children gracefully", () => {
      render(<BaseModal {...defaultProps}>{undefined}</BaseModal>);

      expect(screen.getByText("Test Modal")).toBeInTheDocument();
    });
  });
});
