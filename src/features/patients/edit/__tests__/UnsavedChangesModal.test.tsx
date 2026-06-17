import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import UnsavedChangesModal from "../UnsavedChangesModal";

describe("UnsavedChangesModal", () => {
  const mockOnLeave = jest.fn();
  const mockOnStay = jest.fn();

  const defaultProps = {
    isOpen: true,
    onLeave: mockOnLeave,
    onStay: mockOnStay,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render modal when open", () => {
    render(<UnsavedChangesModal {...defaultProps} />);

    expect(screen.getByText("Alterações Não Salvas")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Se você sair agora, todas as alterações feitas serão perdidas. Tem certeza que deseja sair?",
      ),
    ).toBeInTheDocument();
  });

  it("should not render modal when closed", () => {
    render(<UnsavedChangesModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText("Alterações Não Salvas")).not.toBeInTheDocument();
  });

  it("should render modal content", () => {
    render(<UnsavedChangesModal {...defaultProps} />);

    expect(screen.getByText("Alterações Não Salvas")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continuar editando/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sair sem salvar/i }),
    ).toBeInTheDocument();
  });

  it("should call onStay when 'Continuar Editando' button clicked", () => {
    render(<UnsavedChangesModal {...defaultProps} />);

    const stayButton = screen.getByRole("button", {
      name: /continuar editando/i,
    });
    fireEvent.click(stayButton);

    expect(mockOnStay).toHaveBeenCalledTimes(1);
    expect(mockOnLeave).not.toHaveBeenCalled();
  });

  it("should call onLeave when 'Sair Sem Salvar' button clicked", () => {
    render(<UnsavedChangesModal {...defaultProps} />);

    const leaveButton = screen.getByRole("button", {
      name: /sair sem salvar/i,
    });
    fireEvent.click(leaveButton);

    expect(mockOnLeave).toHaveBeenCalledTimes(1);
    expect(mockOnStay).not.toHaveBeenCalled();
  });

  it("should autofocus on 'Continuar Editando' button", () => {
    render(<UnsavedChangesModal {...defaultProps} />);

    const stayButton = screen.getByRole("button", {
      name: /continuar editando/i,
    });
    expect(stayButton).toHaveFocus();
  });

  it("should render both action buttons", () => {
    render(<UnsavedChangesModal {...defaultProps} />);

    const buttons = screen.getAllByRole("button");

    // Should have exactly 2 buttons
    expect(buttons).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: /continuar editando/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sair sem salvar/i }),
    ).toBeInTheDocument();
  });

  it("should have primary styling on stay button", () => {
    render(<UnsavedChangesModal {...defaultProps} />);

    const stayButton = screen.getByRole("button", {
      name: /continuar editando/i,
    });
    expect(stayButton).toHaveClass("bg-blue-700", "text-white");
    expect(stayButton).not.toHaveClass("ds-button-primary");
  });

  it("should have outline styling on leave button", () => {
    render(<UnsavedChangesModal {...defaultProps} />);

    const leaveButton = screen.getByRole("button", {
      name: /sair sem salvar/i,
    });
    expect(leaveButton).toHaveClass("border", "border-gray-300", "bg-white");
    expect(leaveButton).not.toHaveClass("ds-button-outline");
  });

  it("should not show close button in modal header", () => {
    const { container } = render(<UnsavedChangesModal {...defaultProps} />);

    // BaseModal's close button should not be rendered (showCloseButton={false})
    const closeButtons = container.querySelectorAll(
      'button[aria-label="Fechar"]',
    );
    expect(closeButtons).toHaveLength(0);
  });
});
