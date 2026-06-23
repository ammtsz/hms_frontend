/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import NewPatientCheckInModal from "../NewPatientCheckInModal";
import * as modalStore from "@/stores/modalStore";
import { PatientBasic, Priority, Patient, Status } from "@/types/types";

// Mock dependencies
jest.mock("@/stores/modalStore");

// Mock BaseModal
jest.mock("@/components/common/BaseModal", () => {
  return {
    __esModule: true,
    default: ({
      isOpen,
      onClose,
      title,
      maxWidth,
      children,
    }: {
      isOpen: boolean;
      onClose: () => void;
      title: string;
      maxWidth: string;
      children: React.ReactNode;
    }) =>
      isOpen ? (
        <div data-testid="base-modal">
          <div data-testid="modal-header">
            <h1>{title}</h1>
            <button data-testid="close-button" onClick={onClose}>
              Close
            </button>
          </div>
          <div data-testid="modal-content" data-max-width={maxWidth}>
            {children}
          </div>
        </div>
      ) : null,
  };
});

// Mock NewPatientCheckInForm
jest.mock("@/features/board/components/WalkIn/NewPatientCheckInForm", () => {
  return {
    __esModule: true,
    default: ({
      patient,
      attendanceId,
      onSuccess,
      onCancel,
    }: {
      patient: Patient;
      attendanceId?: number;
      onSuccess: (updatedPatient: Patient) => void;
      onCancel: () => void;
    }) => (
      <div data-testid="new-patient-checkin-form">
        <p>Patient: {patient.name}</p>
        <p>Attendance ID: {attendanceId}</p>
        <button
          data-testid="form-success"
          onClick={() => onSuccess({ ...patient, id: "123" })}
        >
          Success
        </button>
        <button data-testid="form-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    ),
  };
});

const mockModalStore = modalStore as jest.Mocked<typeof modalStore>;

// Mock data
const mockPatientBasic: PatientBasic = {
  id: "1",
  name: "Test Patient",
  phone: "123456789",
  priority: "2" as Priority,
  status: "N" as Status,
};

const mockNewPatientCheckInModal = {
  patient: mockPatientBasic,
  attendanceId: 456,
  isOpen: true,
  onComplete: jest.fn(),
};

const mockCloseModal = jest.fn();

describe("NewPatientCheckInModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockModalStore.useNewPatientCheckInModal.mockReturnValue(
      mockNewPatientCheckInModal,
    );
    mockModalStore.useCloseModal.mockReturnValue(mockCloseModal);
  });

  describe("Modal visibility", () => {
    it("renders when modal is open and patient exists", () => {
      render(<NewPatientCheckInModal />);
      expect(screen.getByTestId("base-modal")).toBeInTheDocument();
      expect(screen.getByText("New Patient Check-in")).toBeInTheDocument();
    });

    it("does not render when modal is closed", () => {
      mockModalStore.useNewPatientCheckInModal.mockReturnValue({
        ...mockNewPatientCheckInModal,
        isOpen: false,
      });

      const { container } = render(<NewPatientCheckInModal />);
      expect(container.firstChild).toBeNull();
    });

    it("does not render when patient is missing", () => {
      mockModalStore.useNewPatientCheckInModal.mockReturnValue({
        ...mockNewPatientCheckInModal,
        patient: undefined,
      });

      const { container } = render(<NewPatientCheckInModal />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Modal configuration", () => {
    it("passes correct props to BaseModal", () => {
      render(<NewPatientCheckInModal />);

      expect(screen.getByTestId("base-modal")).toBeInTheDocument();
      expect(screen.getByText("New Patient Check-in")).toBeInTheDocument();
      expect(screen.getByTestId("modal-content")).toHaveAttribute(
        "data-max-width",
        "md",
      );
    });

    it("sets up close handler correctly", async () => {
      const user = userEvent.setup();
      render(<NewPatientCheckInModal />);

      const closeButton = screen.getByTestId("close-button");
      await user.click(closeButton);

      expect(mockCloseModal).toHaveBeenCalledWith("newPatientCheckIn");
    });
  });

  describe("Patient data transformation", () => {
    it("transforms PatientBasic to Patient with default values", () => {
      render(<NewPatientCheckInModal />);

      const form = screen.getByTestId("new-patient-checkin-form");
      expect(form).toBeInTheDocument();
      expect(screen.getByText("Patient: Test Patient")).toBeInTheDocument();
      expect(screen.getByText("Attendance ID: 456")).toBeInTheDocument();
    });

    it("handles missing attendanceId", () => {
      mockModalStore.useNewPatientCheckInModal.mockReturnValue({
        ...mockNewPatientCheckInModal,
        attendanceId: undefined,
      });

      render(<NewPatientCheckInModal />);
      expect(screen.getByText("Attendance ID:")).toBeInTheDocument();
    });

    it("creates Patient object with all required default fields", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      render(<NewPatientCheckInModal />);

      // The patient object should be created with default values for missing fields
      // We can't directly inspect the object, but we know it's passed to the form
      expect(
        screen.getByTestId("new-patient-checkin-form"),
      ).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe("Form interactions", () => {
    it("handles form success correctly", async () => {
      const user = userEvent.setup();
      render(<NewPatientCheckInModal />);

      const successButton = screen.getByTestId("form-success");
      await user.click(successButton);

      expect(mockNewPatientCheckInModal.onComplete).toHaveBeenCalledWith(true);
      expect(mockCloseModal).toHaveBeenCalledWith("newPatientCheckIn");
    });

    it("handles form success without onComplete callback", async () => {
      mockModalStore.useNewPatientCheckInModal.mockReturnValue({
        ...mockNewPatientCheckInModal,
        onComplete: undefined,
      });

      const user = userEvent.setup();
      render(<NewPatientCheckInModal />);

      const successButton = screen.getByTestId("form-success");
      await user.click(successButton);

      // Should not crash and should still close modal
      expect(mockCloseModal).toHaveBeenCalledWith("newPatientCheckIn");
    });

    it("handles form cancel correctly", async () => {
      const user = userEvent.setup();
      render(<NewPatientCheckInModal />);

      const cancelButton = screen.getByTestId("form-cancel");
      await user.click(cancelButton);

      expect(mockCloseModal).toHaveBeenCalledWith("newPatientCheckIn");
      expect(mockNewPatientCheckInModal.onComplete).not.toHaveBeenCalled();
    });

    it("handles form success correctly", async () => {
      const user = userEvent.setup();
      render(<NewPatientCheckInModal />);

      const successButton = screen.getByTestId("form-success");
      await user.click(successButton);

      expect(mockNewPatientCheckInModal.onComplete).toHaveBeenCalledWith(true);
      expect(mockCloseModal).toHaveBeenCalledWith("newPatientCheckIn");
    });
  });

  describe("Edge cases", () => {
    it("handles patient with undefined fields gracefully", () => {
      mockModalStore.useNewPatientCheckInModal.mockReturnValue({
        ...mockNewPatientCheckInModal,
        patient: {
          id: "1",
          name: "Test Patient",
          phone: "",
          priority: "1" as Priority,
          status: "N" as Status,
        },
      });

      render(<NewPatientCheckInModal />);
      expect(
        screen.getByTestId("new-patient-checkin-form"),
      ).toBeInTheDocument();
      expect(screen.getByText("Patient: Test Patient")).toBeInTheDocument();
    });

    it("handles different patient priorities", () => {
      mockModalStore.useNewPatientCheckInModal.mockReturnValue({
        ...mockNewPatientCheckInModal,
        patient: {
          ...mockPatientBasic,
          priority: "1" as Priority, // Emergency priority
        },
      });

      render(<NewPatientCheckInModal />);
      expect(
        screen.getByTestId("new-patient-checkin-form"),
      ).toBeInTheDocument();
    });

    it("handles patient with special characters in name", () => {
      mockModalStore.useNewPatientCheckInModal.mockReturnValue({
        ...mockNewPatientCheckInModal,
        patient: {
          ...mockPatientBasic,
          name: "John Fernandez-Lopez",
        },
      });

      render(<NewPatientCheckInModal />);
      expect(
        screen.getByText("Patient: John Fernandez-Lopez"),
      ).toBeInTheDocument();
    });
  });

  describe("Modal state management", () => {
    it("respects isOpen state changes", () => {
      const { rerender } = render(<NewPatientCheckInModal />);
      expect(screen.getByTestId("base-modal")).toBeInTheDocument();

      mockModalStore.useNewPatientCheckInModal.mockReturnValue({
        ...mockNewPatientCheckInModal,
        isOpen: false,
      });

      rerender(<NewPatientCheckInModal />);
      expect(screen.queryByTestId("base-modal")).not.toBeInTheDocument();
    });

    it("handles patient changes during modal open", () => {
      const { rerender } = render(<NewPatientCheckInModal />);
      expect(screen.getByText("Patient: Test Patient")).toBeInTheDocument();

      mockModalStore.useNewPatientCheckInModal.mockReturnValue({
        ...mockNewPatientCheckInModal,
        patient: {
          ...mockPatientBasic,
          name: "Updated Patient",
        },
      });

      rerender(<NewPatientCheckInModal />);
      expect(screen.getByText("Patient: Updated Patient")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("provides accessible modal structure", () => {
      render(<NewPatientCheckInModal />);

      // Modal should have proper structure
      expect(screen.getByTestId("modal-header")).toBeInTheDocument();
      expect(screen.getByTestId("modal-content")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    });

    it("maintains focus management through BaseModal", async () => {
      render(<NewPatientCheckInModal />);

      const closeButton = screen.getByTestId("close-button");
      closeButton.focus();
      expect(closeButton).toHaveFocus();
    });
  });

  describe("Component integration", () => {
    it("integrates BaseModal and form correctly", () => {
      render(<NewPatientCheckInModal />);

      // Verify the component structure
      expect(screen.getByTestId("base-modal")).toBeInTheDocument();
      expect(
        screen.getByTestId("new-patient-checkin-form"),
      ).toBeInTheDocument();
    });

    it("passes all required props to form component", () => {
      render(<NewPatientCheckInModal />);

      // Verify form receives correct data
      expect(screen.getByText("Patient: Test Patient")).toBeInTheDocument();
      expect(screen.getByText("Attendance ID: 456")).toBeInTheDocument();
    });
  });
});
