import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TreatmentWorkflowButtons } from "../TreatmentWorkflowButtons";

// Mock the modal store hook
const mockOpenEndOfDayModal = jest.fn();

jest.mock("@/stores/modalStore", () => ({
  useOpenEndOfDay: () => mockOpenEndOfDayModal,
}));

describe("TreatmentWorkflowButtons", () => {
  const defaultProps = {
    isDayFinalized: false,
    selectedDate: "2024-01-15",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("When day is not finalized", () => {
    it("renders finalize day button", () => {
      render(<TreatmentWorkflowButtons {...defaultProps} />);

      const button = screen.getByText("End of Day");
      expect(button).toBeInTheDocument();
      expect(button).toBeEnabled();
    });

    it("calls openEndOfDayModal when finalize button is clicked", () => {
      render(<TreatmentWorkflowButtons {...defaultProps} />);

      const button = screen.getByText("End of Day");
      fireEvent.click(button);

      expect(mockOpenEndOfDayModal).toHaveBeenCalledTimes(1);
      expect(mockOpenEndOfDayModal).toHaveBeenCalledWith({
        selectedDate: "2024-01-15",
      });
    });

    it("has correct finalize button styling", () => {
      render(<TreatmentWorkflowButtons {...defaultProps} />);

      const button = screen.getByText("End of Day");
      expect(button).toHaveClass(
        "w-full",
        "inline-flex",
        "bg-blue-700"
      );
      expect(button).not.toHaveClass("button", "button-primary");
    });

    it("renders single button when not finalized", () => {
      const { container } = render(
        <TreatmentWorkflowButtons {...defaultProps} />
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toHaveTextContent("End of Day");

      const containerDiv = container.querySelector(
        ".mt-6.flex.gap-4.justify-center"
      );
      expect(containerDiv).toBeInTheDocument();
    });
  });

  describe("When day is finalized", () => {
    const finalizedProps = {
      ...defaultProps,
      isDayFinalized: true,
    };

    it("renders disabled finalized button", () => {
      render(<TreatmentWorkflowButtons {...finalizedProps} />);

      const button = screen.getByText("Day finalized");
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it("has correct disabled button styling", () => {
      render(<TreatmentWorkflowButtons {...finalizedProps} />);

      const button = screen.getByText("Day finalized");
      expect(button).toHaveClass(
        "w-full",
        "disabled:cursor-not-allowed",
        "disabled:opacity-60"
      );
      expect(button).not.toHaveClass("button");
    });

    it("does not call modal when disabled button is clicked", () => {
      render(<TreatmentWorkflowButtons {...finalizedProps} />);

      const button = screen.getByText("Day finalized");
      fireEvent.click(button);

      expect(mockOpenEndOfDayModal).not.toHaveBeenCalled();
    });

    it("renders single button in finalized state", () => {
      render(<TreatmentWorkflowButtons {...finalizedProps} />);

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toHaveTextContent("Day finalized");
    });
  });

  describe("Component Structure", () => {
    it("has correct container structure", () => {
      const { container } = render(
        <TreatmentWorkflowButtons {...defaultProps} />
      );

      const containerDiv = container.querySelector("div");
      expect(containerDiv).toHaveClass(
        "mt-6",
        "flex",
        "gap-4",
        "justify-center"
      );
    });

    it("renders different content based on isDayFinalized prop", () => {
      const { rerender } = render(
        <TreatmentWorkflowButtons {...defaultProps} />
      );

      // Not finalized state
      expect(screen.getAllByRole("button")).toHaveLength(1);
      const notFinalizedButton = screen.getByText("End of Day");
      expect(notFinalizedButton).toBeInTheDocument();
      expect(notFinalizedButton).toBeEnabled();

      // Finalized state
      rerender(
        <TreatmentWorkflowButtons {...defaultProps} isDayFinalized={true} />
      );
      expect(screen.getAllByRole("button")).toHaveLength(1);
      const finalizedButton = screen.getByText("Day finalized");
      expect(finalizedButton).toBeInTheDocument();
      expect(finalizedButton).toBeDisabled();
    });
  });

  describe("Props Handling", () => {
    it("passes correct parameters to openEndOfDayModal", () => {
      render(<TreatmentWorkflowButtons {...defaultProps} />);

      const button = screen.getByText("End of Day");
      fireEvent.click(button);

      expect(mockOpenEndOfDayModal).toHaveBeenCalledWith({
        selectedDate: "2024-01-15",
      });
    });

    it("handles different selectedDate values", () => {
      const propsWithDifferentDate = {
        ...defaultProps,
        selectedDate: "2024-02-20",
      };
      render(<TreatmentWorkflowButtons {...propsWithDifferentDate} />);

      const button = screen.getByText("End of Day");
      fireEvent.click(button);

      expect(mockOpenEndOfDayModal).toHaveBeenCalledWith({
        selectedDate: "2024-02-20",
      });
    });
  });

  describe("User Interaction", () => {
    it("finalize button responds to multiple clicks", () => {
      render(<TreatmentWorkflowButtons {...defaultProps} />);

      const button = screen.getByText("End of Day");
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockOpenEndOfDayModal).toHaveBeenCalledTimes(2);
    });

    it("disabled button does not respond to clicks", () => {
      const finalizedProps = { ...defaultProps, isDayFinalized: true };
      render(<TreatmentWorkflowButtons {...finalizedProps} />);

      const disabledButton = screen.getByText("Day finalized");
      fireEvent.click(disabledButton);

      expect(mockOpenEndOfDayModal).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("finalize button has proper accessibility attributes", () => {
      render(<TreatmentWorkflowButtons {...defaultProps} />);

      const button = screen.getByRole("button", { name: "End of Day" });
      expect(button).toBeEnabled();
      expect(button).toHaveAttribute("type", "button");
    });

    it("disabled button has proper disabled state", () => {
      const finalizedProps = { ...defaultProps, isDayFinalized: true };
      render(<TreatmentWorkflowButtons {...finalizedProps} />);

      const button = screen.getByRole("button", { name: "Day finalized" });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("type", "button");
    });
  });
});
