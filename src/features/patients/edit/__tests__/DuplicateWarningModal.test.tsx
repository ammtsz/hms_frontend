import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DuplicateWarningModal from "../DuplicateWarningModal";

describe("DuplicateWarningModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSaveAnyway = jest.fn();
  const mockDuplicates = [
    {
      id: "1",
      name: "João Silva",
      phone: "(11) 98765-4321",
      priority: "3",
      status: "T",
    },
    {
      id: "2",
      name: "João da Silva",
      phone: "(11) 98765-4321",
      priority: "2",
      status: "N",
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSaveAnyway: mockOnSaveAnyway,
    duplicatePatients: mockDuplicates,
    isSaving: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render modal when open", () => {
    render(<DuplicateWarningModal {...defaultProps} />);

    expect(
      screen.getByText("Paciente com informações similares"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Verifique se já existe um cadastro para este paciente antes de salvar.",
      ),
    ).toBeInTheDocument();
  });

  it("should not render modal when closed", () => {
    render(<DuplicateWarningModal {...defaultProps} isOpen={false} />);

    expect(
      screen.queryByText("Paciente com informações similares"),
    ).not.toBeInTheDocument();
  });

  it("should display all duplicate patients", () => {
    render(<DuplicateWarningModal {...defaultProps} />);

    expect(screen.getByText("João Silva")).toBeInTheDocument();
    expect(screen.getByText("João da Silva")).toBeInTheDocument();
    expect(screen.getAllByText("(11) 98765-4321")).toHaveLength(2);
  });

  it("should show patient IDs", () => {
    render(<DuplicateWarningModal {...defaultProps} />);

    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
  });

  it("should show patient status labels", () => {
    render(<DuplicateWarningModal {...defaultProps} />);

    expect(screen.getByText("Em Tratamento")).toBeInTheDocument();
    expect(screen.getByText("Paciente Novo")).toBeInTheDocument();
  });

  it("should show 'Sem telefone' for patients without phone", () => {
    const duplicatesWithoutPhone = [
      {
        id: "3",
        name: "Maria Santos",
        phone: "",
        priority: "3",
        status: "T",
      },
    ];

    render(
      <DuplicateWarningModal
        {...defaultProps}
        duplicatePatients={duplicatesWithoutPhone}
      />,
    );

    expect(screen.getByText("Sem telefone")).toBeInTheDocument();
  });

  it("should render links to view patient profiles", () => {
    render(<DuplicateWarningModal {...defaultProps} />);

    const links = screen.getAllByText("Ver Perfil →");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/patients/1");
    expect(links[1]).toHaveAttribute("href", "/patients/2");
    expect(links[0]).toHaveAttribute("target", "_blank");
    expect(links[0]).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("should call onClose when cancel button clicked", () => {
    render(<DuplicateWarningModal {...defaultProps} />);

    const cancelButton = screen.getByRole("button", {
      name: /cancelar e revisar/i,
    });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should call onSaveAnyway when save anyway button clicked", () => {
    render(<DuplicateWarningModal {...defaultProps} />);

    const saveButton = screen.getByRole("button", {
      name: /salvar mesmo assim/i,
    });
    fireEvent.click(saveButton);

    expect(mockOnSaveAnyway).toHaveBeenCalledTimes(1);
  });

  it("should show loading state when saving", () => {
    render(<DuplicateWarningModal {...defaultProps} isSaving={true} />);

    expect(screen.getByText("Salvando...")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /cancelar e revisar/i }),
    ).toBeDisabled();
  });

  it("should handle empty duplicates array", () => {
    render(<DuplicateWarningModal {...defaultProps} duplicatePatients={[]} />);

    expect(screen.getByText("Pacientes Similares:")).toBeInTheDocument();
    // Should not crash with empty array
  });

  it("should display correct status text for all statuses", () => {
    const allStatuses = [
      { id: "1", name: "Test 1", phone: "", priority: "3", status: "N" },
      { id: "2", name: "Test 2", phone: "", priority: "3", status: "T" },
      { id: "3", name: "Test 3", phone: "", priority: "3", status: "A" },
      { id: "4", name: "Test 4", phone: "", priority: "3", status: "F" },
    ];

    render(
      <DuplicateWarningModal
        {...defaultProps}
        duplicatePatients={allStatuses}
      />,
    );

    expect(screen.getByText("Paciente Novo")).toBeInTheDocument();
    expect(screen.getByText("Em Tratamento")).toBeInTheDocument();
    expect(screen.getByText("Alta do tratamento")).toBeInTheDocument();
    expect(screen.getByText("Faltas Consecutivas")).toBeInTheDocument();
  });

  it("should scroll when many duplicates are present", () => {
    const manyDuplicates = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      name: `Patient ${i}`,
      phone: `(11) 9876${i}-4321`,
      priority: "3",
      status: "T",
    }));

    render(
      <DuplicateWarningModal
        {...defaultProps}
        duplicatePatients={manyDuplicates}
      />,
    );

    const scrollableContainer = screen
      .getByText("Pacientes Similares:")
      .closest("div");
    expect(scrollableContainer).toHaveClass("max-h-64", "overflow-y-auto");
  });
});
