import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TemplateFormModal } from "../components/TemplateFormModal";
import "@testing-library/jest-dom";

describe("TemplateFormModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not render when isOpen is false", () => {
    render(
      <TemplateFormModal
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />,
    );

    expect(screen.queryByText("Novo Modelo")).not.toBeInTheDocument();
  });

  it("should render when isOpen is true", () => {
    render(
      <TemplateFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />,
    );

    expect(screen.getByText("Novo Modelo")).toBeInTheDocument();
  });

  it("should show edit mode title when template is provided", () => {
    const mockTemplate = {
      id: 1,
      name: "Feriados Nacionais",
      description: "Feriados nacionais brasileiros",
      holidays: [],
      createdDate: "2024-01-01",
    };

    render(
      <TemplateFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        template={mockTemplate}
      />,
    );

    expect(screen.getByText("Editar Modelo")).toBeInTheDocument();
  });

  it("should call onClose when close button is clicked", () => {
    render(
      <TemplateFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />,
    );

    const closeButton = screen.getAllByRole("button")[0];
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should add a holiday when "Adicionar Feriado" is clicked', () => {
    render(
      <TemplateFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />,
    );

    const addButton = screen.getByText("Adicionar Feriado");
    fireEvent.click(addButton);

    expect(screen.getByText("Mês")).toBeInTheDocument();
    expect(screen.getByText("Dia")).toBeInTheDocument();
  });

  it("should submit form with correct data", () => {
    render(
      <TemplateFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />,
    );

    // Fill in template name
    const nameInput = screen.getByPlaceholderText(
      "Ex: Feriados Nacionais Brasileiros",
    );
    fireEvent.change(nameInput, { target: { value: "Test Template" } });

    // Add a holiday
    const addButton = screen.getByText("Adicionar Feriado");
    fireEvent.click(addButton);

    // Fill in holiday name
    const holidayNameInput = screen.getByPlaceholderText("Ex: Natal");
    fireEvent.change(holidayNameInput, { target: { value: "Natal" } });

    // Submit form
    const submitButton = screen.getByText("Criar Modelo");
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: "Test Template",
      description: undefined,
      holidays: expect.arrayContaining([
        expect.objectContaining({
          month: 1,
          day: 1,
          name: "Natal",
        }),
      ]),
    });
  });
});
