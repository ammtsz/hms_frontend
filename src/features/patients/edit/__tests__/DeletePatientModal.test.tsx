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
    patientName: "João Silva",
    isDeleting: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render modal when open", () => {
    render(<DeletePatientModal {...defaultProps} />);

    expect(screen.getByText("Excluir Paciente")).toBeInTheDocument();
    expect(screen.getByText("João Silva")).toBeInTheDocument();
    expect(
      screen.getByText("Esta ação não pode ser desfeita!"),
    ).toBeInTheDocument();
  });

  it("should not render modal when closed", () => {
    render(<DeletePatientModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText("Excluir Paciente")).not.toBeInTheDocument();
  });

  it("should show warning messages", () => {
    render(<DeletePatientModal {...defaultProps} />);

    expect(
      screen.getByText(/Todos os dados do paciente serão excluídos/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Esta ação não poderá ser revertida"),
    ).toBeInTheDocument();
  });

  it("should require confirmation text to enable delete button", () => {
    render(<DeletePatientModal {...defaultProps} />);

    const deleteButton = screen.getByRole("button", {
      name: /excluir permanentemente/i,
    });
    expect(deleteButton).toBeDisabled();

    const input = screen.getByPlaceholderText("Digite EXCLUIR");
    fireEvent.change(input, { target: { value: "EXCLUIR" } });

    expect(deleteButton).toBeEnabled();
  });

  it("should accept lowercase confirmation text", () => {
    render(<DeletePatientModal {...defaultProps} />);

    const deleteButton = screen.getByRole("button", {
      name: /excluir permanentemente/i,
    });
    const input = screen.getByPlaceholderText("Digite EXCLUIR");

    fireEvent.change(input, { target: { value: "excluir" } });

    expect(deleteButton).toBeEnabled();
  });

  it("should not accept incorrect confirmation text", () => {
    render(<DeletePatientModal {...defaultProps} />);

    const deleteButton = screen.getByRole("button", {
      name: /excluir permanentemente/i,
    });
    const input = screen.getByPlaceholderText("Digite EXCLUIR");

    fireEvent.change(input, { target: { value: "DELETE" } });

    expect(deleteButton).toBeDisabled();
  });

  it("should call onConfirm when delete button clicked with correct confirmation", () => {
    render(<DeletePatientModal {...defaultProps} />);

    const input = screen.getByPlaceholderText("Digite EXCLUIR");
    fireEvent.change(input, { target: { value: "EXCLUIR" } });

    const deleteButton = screen.getByRole("button", {
      name: /excluir permanentemente/i,
    });
    fireEvent.click(deleteButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when cancel button clicked", () => {
    render(<DeletePatientModal {...defaultProps} />);

    const cancelButton = screen.getByRole("button", { name: /cancelar/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should reset confirmation text when modal closes", () => {
    const { rerender } = render(<DeletePatientModal {...defaultProps} />);

    const input = screen.getByPlaceholderText("Digite EXCLUIR");
    fireEvent.change(input, { target: { value: "EXCLUIR" } });

    expect(input).toHaveValue("EXCLUIR");

    // Close modal
    const cancelButton = screen.getByRole("button", { name: /cancelar/i });
    fireEvent.click(cancelButton);

    // Reopen modal
    rerender(<DeletePatientModal {...defaultProps} />);

    const newInput = screen.getByPlaceholderText("Digite EXCLUIR");
    expect(newInput).toHaveValue("");
  });

  it("should show loading state when deleting", () => {
    render(<DeletePatientModal {...defaultProps} isDeleting={true} />);

    expect(screen.getByText("Excluindo...")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Digite EXCLUIR")).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancelar/i })).toBeDisabled();
  });

  it("should disable inputs and buttons during deletion", () => {
    render(<DeletePatientModal {...defaultProps} isDeleting={true} />);

    const input = screen.getByPlaceholderText("Digite EXCLUIR");
    const cancelButton = screen.getByRole("button", { name: /cancelar/i });

    expect(input).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it("should autofocus confirmation input", () => {
    render(<DeletePatientModal {...defaultProps} />);

    const input = screen.getByPlaceholderText("Digite EXCLUIR");
    expect(input).toHaveFocus();
  });
});
