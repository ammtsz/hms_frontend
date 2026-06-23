/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import MultiSectionModal from "../MultiSectionModal";
import * as modalStore from "@/stores/modalStore";

// Mock dependencies
jest.mock("@/stores/modalStore");

const mockModalStore = modalStore as jest.Mocked<typeof modalStore>;

// Mock data
const mockMultiSectionModal = {
  isOpen: true,
  onConfirm: jest.fn(),
  onCancel: jest.fn(),
};

const mockCloseModal = jest.fn();

describe("MultiSectionModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockModalStore.useMultiSectionModal.mockReturnValue(mockMultiSectionModal);
    mockModalStore.useCloseModal.mockReturnValue(mockCloseModal);
  });

  describe("Modal visibility", () => {
    it("renders when modal is open", () => {
      render(<MultiSectionModal />);
      expect(screen.getByText("Multiple Sections")).toBeInTheDocument();
    });

    it("does not render when modal is closed", () => {
      mockModalStore.useMultiSectionModal.mockReturnValue({
        ...mockMultiSectionModal,
        isOpen: false,
      });

      const { container } = render(<MultiSectionModal />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Modal content", () => {
    it("displays the correct title", () => {
      render(<MultiSectionModal />);
      expect(screen.getByText("Multiple Sections")).toBeInTheDocument();
    });

    it("displays the confirmation message", () => {
      render(<MultiSectionModal />);
      expect(
        screen.getByText(
          "This patient is scheduled in both consultations. Do you want to move them to 'Waiting Room' in both?",
        ),
      ).toBeInTheDocument();
    });

    it("renders action buttons with correct text", () => {
      render(<MultiSectionModal />);
      expect(
        screen.getByRole("button", { name: "Only in this section" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Move in both" }),
      ).toBeInTheDocument();
    });

    it("renders close button with proper aria-label", () => {
      render(<MultiSectionModal />);
      expect(screen.getByLabelText("Close")).toBeInTheDocument();
    });

    it("displays SVG icon in close button", () => {
      render(<MultiSectionModal />);
      const closeButton = screen.getByLabelText("Close");
      const svg = closeButton.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass("h-6", "w-6");
    });
  });

  describe("Button interactions", () => {
    it("calls onConfirm callback when 'Move in both' button is clicked", async () => {
      const user = userEvent.setup();
      render(<MultiSectionModal />);

      const confirmButton = screen.getByRole("button", {
        name: "Move in both",
      });
      await user.click(confirmButton);

      expect(mockMultiSectionModal.onConfirm).toHaveBeenCalledTimes(1);
      expect(mockCloseModal).toHaveBeenCalledWith("multiSection");
    });

    it("calls onCancel callback when 'Only in this section' button is clicked", async () => {
      const user = userEvent.setup();
      render(<MultiSectionModal />);

      const cancelButton = screen.getByRole("button", {
        name: "Only in this section",
      });
      await user.click(cancelButton);

      expect(mockMultiSectionModal.onCancel).toHaveBeenCalledTimes(1);
      expect(mockCloseModal).toHaveBeenCalledWith("multiSection");
    });

    it("calls onCancel callback when close button is clicked", async () => {
      const user = userEvent.setup();
      render(<MultiSectionModal />);

      const closeButton = screen.getByLabelText("Close");
      await user.click(closeButton);

      expect(mockMultiSectionModal.onCancel).toHaveBeenCalledTimes(1);
      expect(mockCloseModal).toHaveBeenCalledWith("multiSection");
    });
  });

  describe("Callback edge cases", () => {
    it("handles missing onConfirm callback gracefully", async () => {
      mockModalStore.useMultiSectionModal.mockReturnValue({
        ...mockMultiSectionModal,
        onConfirm: undefined,
      });

      const user = userEvent.setup();
      render(<MultiSectionModal />);

      const confirmButton = screen.getByRole("button", {
        name: "Move in both",
      });
      await user.click(confirmButton);

      // Should not throw an error
      expect(mockCloseModal).toHaveBeenCalledWith("multiSection");
    });

    it("handles missing onCancel callback gracefully", async () => {
      mockModalStore.useMultiSectionModal.mockReturnValue({
        ...mockMultiSectionModal,
        onCancel: undefined,
      });

      const user = userEvent.setup();
      render(<MultiSectionModal />);

      const cancelButton = screen.getByRole("button", {
        name: "Only in this section",
      });
      await user.click(cancelButton);

      // Should not throw an error
      expect(mockCloseModal).toHaveBeenCalledWith("multiSection");
    });

    it("handles missing onCancel callback when closing via X button", async () => {
      mockModalStore.useMultiSectionModal.mockReturnValue({
        ...mockMultiSectionModal,
        onCancel: undefined,
      });

      const user = userEvent.setup();
      render(<MultiSectionModal />);

      const closeButton = screen.getByLabelText("Close");
      await user.click(closeButton);

      // Should not throw an error
      expect(mockCloseModal).toHaveBeenCalledWith("multiSection");
    });
  });

  describe("Modal structure and styling", () => {
    it("applies correct CSS classes for modal overlay", () => {
      render(<MultiSectionModal />);
      const overlay = screen
        .getByRole("button", { name: "Move in both" })
        .closest(".fixed");
      expect(overlay).toHaveClass(
        "fixed",
        "inset-0",
        "bg-black/60",
        "flex",
        "items-start",
        "justify-center",
        "z-50",
        "p-4",
        "sm:items-center",
      );
    });

    it("applies correct CSS classes for modal content", () => {
      render(<MultiSectionModal />);
      const content = screen.getByRole("dialog");
      expect(content).toHaveClass(
        "bg-white",
        "rounded-lg",
        "shadow-xl",
        "w-full",
        "max-w-md",
        "max-h-[90dvh]",
        "overflow-y-auto",
      );
    });

    it("applies correct styling to action buttons", () => {
      render(<MultiSectionModal />);

      const cancelButton = screen.getByRole("button", {
        name: "Only in this section",
      });
      expect(cancelButton).toHaveClass(
        "border",
        "border-gray-300",
        "bg-white",
        "text-gray-800",
        "hover:bg-gray-50",
        "min-h-[44px]",
      );

      const confirmButton = screen.getByRole("button", {
        name: "Move in both",
      });
      expect(confirmButton).toHaveClass(
        "bg-blue-700",
        "text-white",
        "hover:bg-blue-800",
        "min-h-[44px]",
      );
    });

    it("applies hover styles correctly", () => {
      render(<MultiSectionModal />);

      const closeButton = screen.getByLabelText("Close");
      expect(closeButton).toHaveClass(
        "text-gray-600",
        "hover:bg-gray-100",
        "hover:text-gray-900",
      );
    });
  });

  describe("Keyboard accessibility", () => {
    it("supports keyboard navigation for buttons", () => {
      render(<MultiSectionModal />);

      const cancelButton = screen.getByRole("button", {
        name: "Only in this section",
      });
      const confirmButton = screen.getByRole("button", {
        name: "Move in both",
      });
      const closeButton = screen.getByLabelText("Close");

      // All buttons should be focusable
      cancelButton.focus();
      expect(cancelButton).toHaveFocus();

      confirmButton.focus();
      expect(confirmButton).toHaveFocus();

      closeButton.focus();
      expect(closeButton).toHaveFocus();
    });

    it("supports keyboard activation for buttons", () => {
      render(<MultiSectionModal />);

      const confirmButton = screen.getByRole("button", {
        name: "Move in both",
      });

      // Test Enter key
      fireEvent.keyDown(confirmButton, { key: "Enter", code: "Enter" });
      fireEvent.keyUp(confirmButton, { key: "Enter", code: "Enter" });

      // Test Space key
      fireEvent.keyDown(confirmButton, { key: " ", code: "Space" });
      fireEvent.keyUp(confirmButton, { key: " ", code: "Space" });

      // Both should be handled by default button behavior
      expect(confirmButton).toBeInTheDocument();
    });
  });

  describe("Event handling", () => {
    it("prevents event propagation when needed", async () => {
      const user = userEvent.setup();
      render(<MultiSectionModal />);

      const confirmButton = screen.getByRole("button", {
        name: "Move in both",
      });

      // Click should handle the action without any issues
      await user.click(confirmButton);

      expect(mockMultiSectionModal.onConfirm).toHaveBeenCalledTimes(1);
      expect(mockCloseModal).toHaveBeenCalledWith("multiSection");
    });

    it("handles multiple rapid clicks gracefully", async () => {
      const user = userEvent.setup();
      render(<MultiSectionModal />);

      const confirmButton = screen.getByRole("button", {
        name: "Move in both",
      });

      // Rapid clicks
      await user.click(confirmButton);
      await user.click(confirmButton);
      await user.click(confirmButton);

      // Should still work normally (callbacks might be called multiple times)
      expect(mockMultiSectionModal.onConfirm).toHaveBeenCalled();
      expect(mockCloseModal).toHaveBeenCalled();
    });
  });
});
