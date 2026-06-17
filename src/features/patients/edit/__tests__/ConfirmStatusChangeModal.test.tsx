import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ConfirmStatusChangeModal from "../ConfirmStatusChangeModal";
import type { PendingStatusChange } from "@/features/patients/form/hooks/useEditPatientForm";

jest.mock("@/components/common/BaseModal", () => {
  return function MockBaseModal({
    children,
    isOpen,
    title,
  }: {
    children: React.ReactNode;
    isOpen: boolean;
    title: string;
  }) {
    if (!isOpen) return null;
    return (
      <div data-testid="base-modal">
        <h2>{title}</h2>
        {children}
      </div>
    );
  };
});

describe("ConfirmStatusChangeModal", () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  const pendingAlta: PendingStatusChange = {
    newStatus: "A",
    openCount: 2,
  };

  const pendingFaltas: PendingStatusChange = {
    newStatus: "F",
    openCount: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when pendingStatusChange is null", () => {
    const { container } = render(
      <ConfirmStatusChangeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        pendingStatusChange={null}
        isSaving={false}
      />,
    );

    expect(screen.queryByTestId("base-modal")).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  it("renders modal with Alta do tratamento title and content when newStatus is A", () => {
    render(
      <ConfirmStatusChangeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        pendingStatusChange={pendingAlta}
        isSaving={false}
      />,
    );

    expect(
      screen.getByText("Confirmar alteração para Alta do tratamento"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, el) =>
          el?.textContent ===
          "Ao alterar para Alta do tratamento, todos os atendimentos em aberto (agendados, check-in ou em andamento) serão cancelados.",
      ),
    ).toBeInTheDocument();
    const countParagraph = screen
      .getByText((_, el) => {
        if (el?.tagName !== "P") return false;
        const text = el.textContent ?? "";
        return (
          text.includes("Este paciente possui") &&
          text.includes("2") &&
          text.includes("atendimentos")
        );
      })
      .closest("p");
    expect(countParagraph).toBeInTheDocument();
    expect(
      screen.getByText("Deseja continuar com esta ação?"),
    ).toBeInTheDocument();
  });

  it("renders modal with Faltas Consecutivas title when newStatus is F", () => {
    render(
      <ConfirmStatusChangeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        pendingStatusChange={pendingFaltas}
        isSaving={false}
      />,
    );

    expect(
      screen.getByText("Confirmar alteração para Faltas Consecutivas"),
    ).toBeInTheDocument();
    const countParagraph = screen
      .getByText((_, el) => {
        if (el?.tagName !== "P") return false;
        const text = el.textContent ?? "";
        return (
          text.includes("Este paciente possui") &&
          text.includes("1") &&
          text.includes("será cancelado")
        );
      })
      .closest("p");
    expect(countParagraph).toBeInTheDocument();
  });

  it("uses singular 'atendimento' and 'será cancelado' when openCount is 1", () => {
    render(
      <ConfirmStatusChangeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        pendingStatusChange={pendingFaltas}
        isSaving={false}
      />,
    );

    const paragraph = screen.getByText((_, el) => {
      if (el?.tagName !== "P") return false;
      const text = el.textContent ?? "";
      return (
        text.includes("Este paciente possui") &&
        text.includes("1") &&
        text.includes("atendimento") &&
        text.includes("será cancelado")
      );
    });
    expect(paragraph.closest("p")).toBeInTheDocument();
  });

  it("calls onClose when Cancelar button is clicked", () => {
    render(
      <ConfirmStatusChangeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        pendingStatusChange={pendingAlta}
        isSaving={false}
      />,
    );

    const cancelButton = screen.getByRole("button", { name: /cancelar/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it("calls onConfirm when Sim, alterar status button is clicked", () => {
    render(
      <ConfirmStatusChangeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        pendingStatusChange={pendingAlta}
        isSaving={false}
      />,
    );

    const confirmButton = screen.getByRole("button", {
      name: /sim, alterar status/i,
    });
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("disables buttons when isSaving is true", () => {
    render(
      <ConfirmStatusChangeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        pendingStatusChange={pendingAlta}
        isSaving={true}
      />,
    );

    expect(screen.getByRole("button", { name: /cancelar/i })).toBeDisabled();
    const confirmButton = screen.getByRole("button", {
      name: /salvando/i,
    });
    expect(confirmButton).toBeDisabled();
    expect(confirmButton).toHaveTextContent("Salvando...");
  });
});
