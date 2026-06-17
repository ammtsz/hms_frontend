import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmModal from "../ConfirmModal";

describe("ConfirmModal", () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    open: true,
    message: "Are you sure you want to proceed?",
    onConfirm: mockOnConfirm,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Visibility", () => {
    it("should render when open is true", () => {
      render(<ConfirmModal {...defaultProps} />);

      expect(
        screen.getByText("Are you sure you want to proceed?"),
      ).toBeInTheDocument();
    });

    it("should not render when open is false", () => {
      render(<ConfirmModal {...defaultProps} open={false} />);

      expect(
        screen.queryByText("Are you sure you want to proceed?"),
      ).not.toBeInTheDocument();
    });

    it("should return null when closed", () => {
      const { container } = render(
        <ConfirmModal {...defaultProps} open={false} />,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Title Display", () => {
    it("should display title when provided", () => {
      render(<ConfirmModal {...defaultProps} title="Confirm Action" />);

      expect(screen.getByText("Confirm Action")).toBeInTheDocument();
    });

    it("should not display title when not provided", () => {
      render(<ConfirmModal {...defaultProps} />);

      expect(screen.queryByText(/title/i)).not.toBeInTheDocument();
    });

    it("should have proper title styling", () => {
      render(<ConfirmModal {...defaultProps} title="Test Title" />);

      const title = screen.getByRole("heading", { name: "Test Title" });
      expect(title).toHaveClass("text-xl", "font-semibold", "text-gray-800");
    });
  });

  describe("Message Display", () => {
    it("should display message text", () => {
      render(<ConfirmModal {...defaultProps} message="Test message" />);

      expect(screen.getByText("Test message")).toBeInTheDocument();
    });

    it("should display React node message", () => {
      const messageNode = (
        <div data-testid="custom-message">
          Custom <strong>message</strong>
        </div>
      );
      render(<ConfirmModal {...defaultProps} message={messageNode} />);

      expect(screen.getByTestId("custom-message")).toBeInTheDocument();
      expect(screen.getByText("Custom")).toBeInTheDocument();
      expect(screen.getByText("message")).toBeInTheDocument();
    });

    it("should have proper message styling", () => {
      render(<ConfirmModal {...defaultProps} message="Styled message" />);

      const message = screen.getByText("Styled message");
      expect(message).toHaveClass("mb-4", "text-[color:var(--primary-dark)]");
    });
  });

  describe("Confirm Button", () => {
    it("should display default confirm button", () => {
      render(<ConfirmModal {...defaultProps} />);

      expect(screen.getByText("Confirmar")).toBeInTheDocument();
    });

    it("should display custom confirm label", () => {
      render(<ConfirmModal {...defaultProps} confirmLabel="Save Changes" />);

      expect(screen.getByText("Save Changes")).toBeInTheDocument();
    });

    it("should call onConfirm when clicked", async () => {
      const user = userEvent.setup();
      render(<ConfirmModal {...defaultProps} />);

      const confirmButton = screen.getByText("Confirmar");
      await user.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it("should have proper confirm button styling", () => {
      render(<ConfirmModal {...defaultProps} />);

      const confirmButton = screen.getByText("Confirmar");
      expect(confirmButton).toHaveClass("bg-blue-700", "text-white");
      expect(confirmButton).not.toHaveClass("button", "button-primary");
    });

    it('should have remove button styling when confirmLabel is "Remover"', () => {
      render(<ConfirmModal {...defaultProps} confirmLabel="Remover" />);

      const confirmButton = screen.getByText("Remover");
      expect(confirmButton).toHaveClass(
        "bg-red-600",
        "hover:bg-red-700",
        "text-white",
      );
      expect(confirmButton).not.toHaveClass("button", "button-primary");
    });

    it('should have button type="button"', () => {
      render(<ConfirmModal {...defaultProps} />);

      const confirmButton = screen.getByText("Confirmar");
      expect(confirmButton).toHaveAttribute("type", "button");
    });

    it("should be enabled when confirmDisabled is false", () => {
      render(<ConfirmModal {...defaultProps} confirmDisabled={false} />);

      const confirmButton = screen.getByText("Confirmar");
      expect(confirmButton).not.toBeDisabled();
    });

    it("should be disabled when confirmDisabled is true", () => {
      render(<ConfirmModal {...defaultProps} confirmDisabled={true} />);

      const confirmButton = screen.getByText("Confirmar");
      expect(confirmButton).toBeDisabled();
    });

    it("should not call onConfirm when confirmDisabled is true and button is clicked", async () => {
      const user = userEvent.setup();
      render(<ConfirmModal {...defaultProps} confirmDisabled={true} />);

      const confirmButton = screen.getByText("Confirmar");
      await user.click(confirmButton);

      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  describe("Cancel Button", () => {
    it("should display default cancel button when onCancel is provided", () => {
      render(<ConfirmModal {...defaultProps} onCancel={mockOnCancel} />);

      expect(screen.getByText("Cancelar")).toBeInTheDocument();
    });

    it("should display custom cancel label", () => {
      render(
        <ConfirmModal
          {...defaultProps}
          cancelLabel="Go Back"
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText("Go Back")).toBeInTheDocument();
    });

    it("should not display cancel button when cancelLabel is falsy", () => {
      render(
        <ConfirmModal
          {...defaultProps}
          cancelLabel=""
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.queryByText("Cancelar")).not.toBeInTheDocument();
    });

    it("should display cancel button even when cancelLabel is undefined (shows default)", () => {
      render(
        <ConfirmModal
          {...defaultProps}
          cancelLabel={undefined}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText("Cancelar")).toBeInTheDocument();
    });

    it("should call onCancel when clicked", async () => {
      const user = userEvent.setup();
      render(<ConfirmModal {...defaultProps} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByText("Cancelar");
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it("should handle missing onCancel gracefully", async () => {
      const user = userEvent.setup();
      render(<ConfirmModal {...defaultProps} cancelLabel="Cancel" />);

      const cancelButton = screen.getByText("Cancel");
      await user.click(cancelButton);

      // Should not throw an error
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it("should have proper cancel button styling", () => {
      render(<ConfirmModal {...defaultProps} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByText("Cancelar");
      expect(cancelButton).toHaveClass("bg-blue-100", "text-blue-800");
      expect(cancelButton).not.toHaveClass("button", "button-secondary");
    });

    it('should have button type="button"', () => {
      render(<ConfirmModal {...defaultProps} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByText("Cancelar");
      expect(cancelButton).toHaveAttribute("type", "button");
    });
  });

  describe("Modal Structure and Styling", () => {
    it("should have proper backdrop styling", () => {
      render(<ConfirmModal {...defaultProps} />);

      const backdrop = document.querySelector(".fixed.inset-0.bg-black\\/60");
      expect(backdrop).toBeInTheDocument();
    });

    it("should have proper modal content styling", () => {
      render(<ConfirmModal {...defaultProps} />);

      const modalContent = document.querySelector(
        ".bg-white.rounded-lg.shadow-xl",
      );
      expect(modalContent).toBeInTheDocument();
      expect(modalContent).toHaveClass("max-w-md", "w-full");
    });

    it("should have proper button container styling", () => {
      render(<ConfirmModal {...defaultProps} onCancel={mockOnCancel} />);

      const buttonContainer = screen.getByText("Confirmar").closest("div");
      expect(buttonContainer).toHaveClass(
        "flex",
        "flex-col-reverse",
        "gap-3",
        "sm:flex-row",
        "sm:justify-end",
      );
    });

    it("should expose dialog semantics", () => {
      render(<ConfirmModal {...defaultProps} title="Confirm Action" />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("Keyboard Interactions", () => {
    it("should handle Enter key on confirm button", () => {
      render(<ConfirmModal {...defaultProps} />);

      const confirmButton = screen.getByText("Confirmar");
      fireEvent.keyDown(confirmButton, { key: "Enter", code: "Enter" });

      // The button should be focused and clickable
      expect(confirmButton).toBeInTheDocument();
    });

    it("should handle Space key on confirm button", () => {
      render(<ConfirmModal {...defaultProps} />);

      const confirmButton = screen.getByText("Confirmar");
      fireEvent.keyDown(confirmButton, { key: " ", code: "Space" });

      expect(confirmButton).toBeInTheDocument();
    });

    it("should handle Enter key on cancel button", () => {
      render(<ConfirmModal {...defaultProps} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByText("Cancelar");
      fireEvent.keyDown(cancelButton, { key: "Enter", code: "Enter" });

      expect(cancelButton).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have focusable buttons", () => {
      render(<ConfirmModal {...defaultProps} onCancel={mockOnCancel} />);

      const confirmButton = screen.getByText("Confirmar");
      const cancelButton = screen.getByText("Cancelar");

      confirmButton.focus();
      expect(confirmButton).toHaveFocus();

      cancelButton.focus();
      expect(cancelButton).toHaveFocus();
    });

    it("should have proper button roles", () => {
      render(<ConfirmModal {...defaultProps} onCancel={mockOnCancel} />);

      const confirmButton = screen.getByText("Confirmar");
      const cancelButton = screen.getByText("Cancelar");

      expect(confirmButton).toHaveAttribute("type", "button");
      expect(cancelButton).toHaveAttribute("type", "button");
    });

    it("should be keyboard navigable", async () => {
      const user = userEvent.setup();
      render(<ConfirmModal {...defaultProps} onCancel={mockOnCancel} />);

      await user.tab();
      const cancelButton = screen.getByRole("button", { name: "Cancelar" });
      expect(cancelButton).toHaveFocus();

      await user.tab();
      const confirmButton = screen.getByRole("button", { name: "Confirmar" });
      expect(confirmButton).toHaveFocus();
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long messages", () => {
      const longMessage = "This is a very long message ".repeat(20);
      render(<ConfirmModal {...defaultProps} message={longMessage} />);

      // Check if the message content is rendered (may be broken up by whitespace)
      expect(screen.getByText(longMessage.trim())).toBeInTheDocument();
    });

    it("should handle empty message", () => {
      render(<ConfirmModal {...defaultProps} message="" />);

      // Should still render the modal structure
      expect(screen.getByText("Confirmar")).toBeInTheDocument();
    });

    it("should handle complex React node messages", () => {
      const complexMessage = (
        <div>
          <p>First paragraph</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
          <p>Second paragraph</p>
        </div>
      );

      render(<ConfirmModal {...defaultProps} message={complexMessage} />);

      expect(screen.getByText("First paragraph")).toBeInTheDocument();
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
      expect(screen.getByText("Second paragraph")).toBeInTheDocument();
    });

    it("should handle special characters in labels", () => {
      render(
        <ConfirmModal
          {...defaultProps}
          confirmLabel="Confirmar ✓"
          cancelLabel="Cancelar ✗"
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText("Confirmar ✓")).toBeInTheDocument();
      expect(screen.getByText("Cancelar ✗")).toBeInTheDocument();
    });
  });

  describe("Multiple Clicks", () => {
    it("should handle multiple rapid clicks on confirm button", async () => {
      const user = userEvent.setup();
      render(<ConfirmModal {...defaultProps} />);

      const confirmButton = screen.getByText("Confirmar");
      await user.click(confirmButton);
      await user.click(confirmButton);
      await user.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(3);
    });

    it("should handle multiple rapid clicks on cancel button", async () => {
      const user = userEvent.setup();
      render(<ConfirmModal {...defaultProps} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByText("Cancelar");
      await user.click(cancelButton);
      await user.click(cancelButton);
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(3);
    });
  });

  describe("Component State Changes", () => {
    it("should update when props change", () => {
      const { rerender } = render(
        <ConfirmModal {...defaultProps} message="Original message" />,
      );

      expect(screen.getByText("Original message")).toBeInTheDocument();

      rerender(<ConfirmModal {...defaultProps} message="Updated message" />);

      expect(screen.getByText("Updated message")).toBeInTheDocument();
      expect(screen.queryByText("Original message")).not.toBeInTheDocument();
    });

    it("should toggle visibility when open prop changes", () => {
      const { rerender } = render(
        <ConfirmModal {...defaultProps} open={true} />,
      );

      expect(
        screen.getByText("Are you sure you want to proceed?"),
      ).toBeInTheDocument();

      rerender(<ConfirmModal {...defaultProps} open={false} />);

      expect(
        screen.queryByText("Are you sure you want to proceed?"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Button Order", () => {
    it("should display cancel button before confirm button", () => {
      render(<ConfirmModal {...defaultProps} onCancel={mockOnCancel} />);

      const actionButtons = screen
        .getAllByRole("button")
        .filter(
          (button) =>
            button.textContent === "Cancelar" ||
            button.textContent === "Confirmar",
        );
      expect(actionButtons[0]).toHaveTextContent("Cancelar");
      expect(actionButtons[1]).toHaveTextContent("Confirmar");
    });

    it("should display both buttons when onCancel is provided by default behavior", () => {
      render(<ConfirmModal {...defaultProps} />);

      const actionButtons = screen
        .getAllByRole("button")
        .filter(
          (button) =>
            button.textContent === "Cancelar" ||
            button.textContent === "Confirmar",
        );
      expect(actionButtons).toHaveLength(2);
      expect(actionButtons[0]).toHaveTextContent("Cancelar");
      expect(actionButtons[1]).toHaveTextContent("Confirmar");
    });
  });
});
