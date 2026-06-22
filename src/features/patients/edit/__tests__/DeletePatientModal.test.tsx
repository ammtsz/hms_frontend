import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DeletePatientModal from "../DeletePatientModal";

describe("DeletePatientModal", () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onConfirm: mockOnConfirm,
    patientName: "John Smith",
    isDeleting: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render modal when open", () => {
    render(<DeletePatientModal {...defaultProps} />);

    expect(screen.getByText("Delete Patient")).toBeInTheDocument();
    expect(screen.getByText("John Smith")).toBeInTheDocument();
    expect(
      screen.getByText("This action cannot be undone!"),
    ).toBeInTheDocument();
  });

  it("should not render modal when closed", () => {
    render(<DeletePatientModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText("Delete Patient")).not.toBeInTheDocument();
  });

  it("should show warning messages", () => {
    render(<DeletePatientModal {...defaultProps} />);

    expect(
      screen.getByText(/All patient data will be deleted/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("This action cannot be undone"),
    ).toBeInTheDocument();
  });

  it("should require confirmation text to enable delete button", () => {
    render(<DeletePatientModal {...defaultProps} />);

    const deleteButton = screen.getByRole("button", {
      name: /Delete Permanently/i,
    });
    expect(deleteButton).toBeDisabled();

    const input = screen.getByPlaceholderText("Type DELETE");
    fireEvent.change(input, { target: { value: "DELETE" } });

    expect(deleteButton).toBeEnabled();
  });

  it("should accept lowercase confirmation text", () => {
    render(<DeletePatientModal {...defaultProps} />);

    const deleteButton = screen.getByRole("button", {
      name: /Delete Permanently/i,
    });
    const input = screen.getByPlaceholderText("Type DELETE");

    fireEvent.change(input, { target: { value: "DELETE" } });

    expect(deleteButton).toBeEnabled();
  });

  it("should not accept incorrect confirmation text", () => {
    render(<DeletePatientModal {...defaultProps} />);

    const deleteButton = screen.getByRole("button", {
      name: /Delete Permanently/i,
    });
    const input = screen.getByPlaceholderText("Type DELETE");

    fireEvent.change(input, { target: { value: "WRONG" } });

    expect(deleteButton).toBeDisabled();
  });

  it("should call onConfirm when delete button clicked with correct confirmation", () => {
    render(<DeletePatientModal {...defaultProps} />);

    const input = screen.getByPlaceholderText("Type DELETE");
    fireEvent.change(input, { target: { value: "DELETE" } });

    const deleteButton = screen.getByRole("button", {
      name: /Delete Permanently/i,
    });
    fireEvent.click(deleteButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when cancel button clicked", () => {
    render(<DeletePatientModal {...defaultProps} />);

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should reset confirmation text when modal closes", () => {
    const { rerender } = render(<DeletePatientModal {...defaultProps} />);

    const input = screen.getByPlaceholderText("Type DELETE");
    fireEvent.change(input, { target: { value: "DELETE" } });

    expect(input).toHaveValue("DELETE");

    // Close modal
    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelButton);

    // Reopen modal
    rerender(<DeletePatientModal {...defaultProps} />);

    const newInput = screen.getByPlaceholderText("Type DELETE");
    expect(newInput).toHaveValue("");
  });

  it("should show loading state when deleting", () => {
    render(<DeletePatientModal {...defaultProps} isDeleting={true} />);

    expect(screen.getByText("Deleting...")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Type DELETE")).toBeDisabled();
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeDisabled();
  });

  it("should disable inputs and buttons during deletion", () => {
    render(<DeletePatientModal {...defaultProps} isDeleting={true} />);

    const input = screen.getByPlaceholderText("Type DELETE");
    const cancelButton = screen.getByRole("button", { name: /Cancel/i });

    expect(input).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it("should autofocus confirmation input", () => {
    render(<DeletePatientModal {...defaultProps} />);

    const input = screen.getByPlaceholderText("Type DELETE");
    expect(input).toHaveFocus();
  });
});
