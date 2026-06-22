import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import NewAttendanceFormModal from "../components/NewAttendanceFormModal";

// Mock the NewAttendanceForm component
jest.mock(
  "@/features/attendance/components/Scheduling/NewAttendanceForm",
  () => {
    return function MockNewAttendanceForm({
      showDateField,
      validationDate,
      onFormSuccess,
      onCancel,
    }: {
      showDateField?: boolean;
      validationDate?: string;
      onFormSuccess: () => void;
      onCancel?: () => void;
    }) {
      return (
        <div data-testid="new-attendance-form">
          <p data-testid="show-date-field">
            {showDateField ? "date-field-visible" : "date-field-hidden"}
          </p>
          <p data-testid="validation-date">
            {validationDate || "no-validation-date"}
          </p>
          <button onClick={onFormSuccess} data-testid="form-success-button">
            Trigger Success
          </button>
          {onCancel && (
            <button onClick={onCancel} data-testid="cancel-button">
              Cancel
            </button>
          )}
        </div>
      );
    };
  },
);

describe("NewAttendanceFormModal", () => {
  const defaultProps = {
    onClose: jest.fn(),
    onSuccess: jest.fn(),
    title: "Test Modal Title",
    subtitle: "Test modal subtitle",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders without crashing", () => {
      render(<NewAttendanceFormModal {...defaultProps} />);

      expect(screen.getByText("Test Modal Title")).toBeInTheDocument();
      expect(screen.getByText("Test modal subtitle")).toBeInTheDocument();
    });

    it("displays the correct title and subtitle", () => {
      const customProps = {
        ...defaultProps,
        title: "Custom Title",
        subtitle: "Custom Subtitle",
      };

      render(<NewAttendanceFormModal {...customProps} />);

      expect(screen.getByText("Custom Title")).toBeInTheDocument();
      expect(screen.getByText("Custom Subtitle")).toBeInTheDocument();
    });

    it("renders the modal overlay and content", () => {
      const { container } = render(
        <NewAttendanceFormModal {...defaultProps} />,
      );

      // Check for modal overlay (backdrop) - updated to match actual class
      const modalOverlay = container.querySelector(".fixed.inset-0");
      expect(modalOverlay).toBeInTheDocument();

      // Check for modal content
      expect(screen.getByText("Test Modal Title")).toBeInTheDocument();
    });

    it("renders the NewAttendanceForm component", () => {
      render(<NewAttendanceFormModal {...defaultProps} />);

      expect(screen.getByTestId("new-attendance-form")).toBeInTheDocument();
    });
  });

  describe("Props Handling", () => {
    it("passes showDateField prop to NewAttendanceForm when true", () => {
      render(<NewAttendanceFormModal {...defaultProps} showDateField={true} />);

      expect(screen.getByTestId("show-date-field")).toHaveTextContent(
        "date-field-visible",
      );
    });

    it("passes showDateField prop to NewAttendanceForm when false", () => {
      render(
        <NewAttendanceFormModal {...defaultProps} showDateField={false} />,
      );

      expect(screen.getByTestId("show-date-field")).toHaveTextContent(
        "date-field-hidden",
      );
    });

    it("defaults showDateField to false when not provided", () => {
      render(<NewAttendanceFormModal {...defaultProps} />);

      expect(screen.getByTestId("show-date-field")).toHaveTextContent(
        "date-field-hidden",
      );
    });

    it("passes validationDate prop to NewAttendanceForm", () => {
      const validationDate = "2024-01-15";
      render(
        <NewAttendanceFormModal
          {...defaultProps}
          validationDate={validationDate}
        />,
      );

      expect(screen.getByTestId("validation-date")).toHaveTextContent(
        "2024-01-15",
      );
    });

    it("handles undefined validationDate prop", () => {
      render(<NewAttendanceFormModal {...defaultProps} />);

      expect(screen.getByTestId("validation-date")).toHaveTextContent(
        "no-validation-date",
      );
    });
  });

  describe("Event Handling", () => {
    it("calls onClose when cancel button is clicked", () => {
      const onCloseMock = jest.fn();
      render(
        <NewAttendanceFormModal {...defaultProps} onClose={onCloseMock} />,
      );

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it("calls onSuccess and onClose when form success is triggered", () => {
      const onCloseMock = jest.fn();
      const onSuccessMock = jest.fn();

      render(
        <NewAttendanceFormModal
          {...defaultProps}
          onClose={onCloseMock}
          onSuccess={onSuccessMock}
        />,
      );

      const formSuccessButton = screen.getByTestId("form-success-button");
      fireEvent.click(formSuccessButton);

      expect(onSuccessMock).toHaveBeenCalledTimes(1);
      expect(onSuccessMock).toHaveBeenCalledWith(true);
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it("calls callbacks in correct order on form success", () => {
      const callOrder: string[] = [];
      const onCloseMock = jest.fn(() => callOrder.push("onClose"));
      const onSuccessMock = jest.fn(() => callOrder.push("onSuccess"));

      render(
        <NewAttendanceFormModal
          {...defaultProps}
          onClose={onCloseMock}
          onSuccess={onSuccessMock}
        />,
      );

      const formSuccessButton = screen.getByTestId("form-success-button");
      fireEvent.click(formSuccessButton);

      expect(callOrder).toEqual(["onSuccess", "onClose"]);
    });
  });

  describe("Integration", () => {
    it("handles all props together correctly", () => {
      const props = {
        onClose: jest.fn(),
        onSuccess: jest.fn(),
        title: "Integration Test Title",
        subtitle: "Integration test subtitle",
        showDateField: true,
        validationDate: "2024-02-20",
      };

      render(<NewAttendanceFormModal {...props} />);

      // Check title and subtitle
      expect(screen.getByText("Integration Test Title")).toBeInTheDocument();
      expect(screen.getByText("Integration test subtitle")).toBeInTheDocument();

      // Check props passed to form
      expect(screen.getByTestId("show-date-field")).toHaveTextContent(
        "date-field-visible",
      );
      expect(screen.getByTestId("validation-date")).toHaveTextContent(
        "2024-02-20",
      );

      // Test interactions
      fireEvent.click(screen.getByTestId("form-success-button"));
      expect(props.onSuccess).toHaveBeenCalledWith(true);
      expect(props.onClose).toHaveBeenCalled();
    });

    it("maintains proper modal structure with all content", () => {
      render(<NewAttendanceFormModal {...defaultProps} />);

      // Check modal structure
      const title = screen.getByText("Test Modal Title");
      expect(title).toHaveClass("text-xl", "font-semibold");

      const subtitle = screen.getByText("Test modal subtitle");
      expect(subtitle).toHaveClass("text-gray-600");

      // Cancel button is now inside the form
      expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper heading structure", () => {
      render(<NewAttendanceFormModal {...defaultProps} />);

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent("Test Modal Title");
    });

    it("has clickable cancel button", () => {
      render(<NewAttendanceFormModal {...defaultProps} />);

      const cancelButton = screen.getByTestId("cancel-button");
      expect(cancelButton).toBeInTheDocument();
      expect(cancelButton).not.toBeDisabled();
    });
  });

  describe("Styling", () => {
    it("applies correct CSS classes to modal elements", () => {
      const { container } = render(
        <NewAttendanceFormModal {...defaultProps} />,
      );

      // Check backdrop classes - updated to match actual class
      const backdrop = container.querySelector(".fixed.inset-0");
      expect(backdrop).toBeInTheDocument();

      // Check modal content classes
      const modalContent = container.querySelector(
        ".bg-white.rounded-lg.shadow-xl.max-w-xl.w-full",
      );
      expect(modalContent).toBeInTheDocument();
      expect(modalContent).toHaveAttribute("role", "dialog");
    });
  });
});
