/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import AssessmentBeforeTreatmentConfirmModal from "../AssessmentBeforeTreatmentConfirmModal";
import * as modalStore from "@/stores/modalStore";

jest.mock("@/stores/modalStore");

const mockModalStore = modalStore as jest.Mocked<typeof modalStore>;

const mockModalState = {
  isOpen: true,
  onConfirm: jest.fn(),
  onCancel: jest.fn(),
};

const mockCloseModal = jest.fn();

describe("AssessmentBeforeTreatmentConfirmModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockModalStore.useAssessmentBeforeTreatmentConfirmModal.mockReturnValue(
      mockModalState,
    );
    mockModalStore.useCloseModal.mockReturnValue(mockCloseModal);
  });

  describe("Modal visibility", () => {
    it("renders when modal is open", () => {
      render(<AssessmentBeforeTreatmentConfirmModal />);
      expect(
        screen.getByText("Pending Physiotherapy/TENS Treatment"),
      ).toBeInTheDocument();
    });

    it("does not render when modal is closed", () => {
      mockModalStore.useAssessmentBeforeTreatmentConfirmModal.mockReturnValue({
        ...mockModalState,
        isOpen: false,
      });

      const { container } = render(<AssessmentBeforeTreatmentConfirmModal />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Modal content", () => {
    it("displays the correct title", () => {
      render(<AssessmentBeforeTreatmentConfirmModal />);
      expect(
        screen.getByText("Pending Physiotherapy/TENS Treatment"),
      ).toBeInTheDocument();
    });

    it("displays the confirmation message", () => {
      const { container } = render(<AssessmentBeforeTreatmentConfirmModal />);
      const paragraph = container.querySelector("p");
      expect(paragraph).toBeInTheDocument();
      expect(paragraph?.textContent).toMatch(/Physiotherapy/);
      expect(paragraph?.textContent).toMatch(/consultation/i);
      expect(paragraph?.textContent).toMatch(/In progress/);
    });

    it("renders Cancel and Continue buttons", () => {
      render(<AssessmentBeforeTreatmentConfirmModal />);
      expect(
        screen.getByRole("button", { name: "Cancel" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Continue" }),
      ).toBeInTheDocument();
    });

    it("renders close button with proper aria-label", () => {
      render(<AssessmentBeforeTreatmentConfirmModal />);
      expect(screen.getByLabelText("Close")).toBeInTheDocument();
    });
  });

  describe("Button interactions", () => {
    it("calls onConfirm and closeModal when Continue is clicked", async () => {
      const user = userEvent.setup();
      render(<AssessmentBeforeTreatmentConfirmModal />);

      const confirmButton = screen.getByRole("button", { name: "Continue" });
      await user.click(confirmButton);

      expect(mockModalState.onConfirm).toHaveBeenCalledTimes(1);
      expect(mockCloseModal).toHaveBeenCalledWith(
        "assessmentBeforeTreatmentConfirm",
      );
    });

    it("calls onCancel and closeModal when Cancel button is clicked", async () => {
      const user = userEvent.setup();
      render(<AssessmentBeforeTreatmentConfirmModal />);

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      await user.click(cancelButton);

      expect(mockModalState.onCancel).toHaveBeenCalledTimes(1);
      expect(mockCloseModal).toHaveBeenCalledWith(
        "assessmentBeforeTreatmentConfirm",
      );
    });

    it("calls onCancel and closeModal when close (X) button is clicked", async () => {
      const user = userEvent.setup();
      render(<AssessmentBeforeTreatmentConfirmModal />);

      const closeButton = screen.getByLabelText("Close");
      await user.click(closeButton);

      expect(mockModalState.onCancel).toHaveBeenCalledTimes(1);
      expect(mockCloseModal).toHaveBeenCalledWith(
        "assessmentBeforeTreatmentConfirm",
      );
    });
  });

  describe("Callback edge cases", () => {
    it("handles missing onConfirm callback gracefully", async () => {
      mockModalStore.useAssessmentBeforeTreatmentConfirmModal.mockReturnValue({
        ...mockModalState,
        onConfirm: undefined,
      });

      const user = userEvent.setup();
      render(<AssessmentBeforeTreatmentConfirmModal />);

      const confirmButton = screen.getByRole("button", { name: "Continue" });
      await user.click(confirmButton);

      expect(mockCloseModal).toHaveBeenCalledWith(
        "assessmentBeforeTreatmentConfirm",
      );
    });

    it("handles missing onCancel callback gracefully", async () => {
      mockModalStore.useAssessmentBeforeTreatmentConfirmModal.mockReturnValue({
        ...mockModalState,
        onCancel: undefined,
      });

      const user = userEvent.setup();
      render(<AssessmentBeforeTreatmentConfirmModal />);

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      await user.click(cancelButton);

      expect(mockCloseModal).toHaveBeenCalledWith(
        "assessmentBeforeTreatmentConfirm",
      );
    });
  });
});
