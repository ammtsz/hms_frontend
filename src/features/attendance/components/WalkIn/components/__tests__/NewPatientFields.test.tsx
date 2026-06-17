import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { NewPatientFields } from "../NewPatientFields";
import { useSelectablePrioritiesForForm } from "@/features/attendance/hooks/useSelectablePrioritiesForForm";
import { SystemOptionType } from "@/types/systemOptions";

jest.mock("@/features/attendance/hooks/useSelectablePrioritiesForForm", () => ({
  useSelectablePrioritiesForForm: jest.fn(),
}));

describe("NewPatientFields", () => {
  const mockPriorities = [
    {
      id: 1,
      type: SystemOptionType.PRIORITY,
      value: "3",
      label: "Padrão",
      isActive: true,
      sortOrder: 3,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: 2,
      type: SystemOptionType.PRIORITY,
      value: "2",
      label: "Idoso/crianças",
      isActive: true,
      sortOrder: 2,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: 3,
      type: SystemOptionType.PRIORITY,
      value: "1",
      label: "Exceção",
      isActive: true,
      sortOrder: 1,
      createdAt: "",
      updatedAt: "",
    },
  ];

  const mockProps = {
    phone: "",
    birthDate: "",
    priority: "3" as const,
    isSubmitting: false,
    onPhoneChange: jest.fn(),
    onBirthDateChange: jest.fn(),
    onPriorityChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSelectablePrioritiesForForm as jest.Mock).mockReturnValue({
      sortedPriorities: mockPriorities,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it("should render all new patient fields", () => {
    render(<NewPatientFields {...mockProps} />);

    expect(screen.getByLabelText("Telefone *")).toBeInTheDocument();
    expect(screen.getByLabelText("Data de Nascimento *")).toBeInTheDocument();
    expect(screen.getByLabelText("Prioridade")).toBeInTheDocument();
    // Note: mainComplaint removed - should be documented during consultation, not at check-in
  });

  it("should call onPhoneChange when phone input changes", () => {
    render(<NewPatientFields {...mockProps} />);

    const phoneInput = screen.getByLabelText("Telefone *");
    fireEvent.change(phoneInput, { target: { value: "1234567890" } });

    expect(mockProps.onPhoneChange).toHaveBeenCalled();
  });

  it("should call onBirthDateChange when date changes", () => {
    render(<NewPatientFields {...mockProps} />);

    const dateInput = screen.getByLabelText("Data de Nascimento *");
    fireEvent.change(dateInput, { target: { value: "2000-01-01" } });

    expect(mockProps.onBirthDateChange).toHaveBeenCalled();
  });

  it("should call onPriorityChange when priority changes", () => {
    render(<NewPatientFields {...mockProps} />);

    const select = screen.getByLabelText("Prioridade");
    fireEvent.change(select, { target: { value: "1" } });

    expect(mockProps.onPriorityChange).toHaveBeenCalledWith("1");
  });

  it("should display phone value correctly", () => {
    render(<NewPatientFields {...mockProps} phone="(11) 98765-4321" />);

    const phoneInput = screen.getByLabelText("Telefone *") as HTMLInputElement;
    expect(phoneInput.value).toBe("(11) 98765-4321");
  });

  it("should disable all inputs when submitting", () => {
    render(<NewPatientFields {...mockProps} isSubmitting={true} />);

    expect(screen.getByLabelText("Telefone *")).toBeDisabled();
    expect(screen.getByLabelText("Data de Nascimento *")).toBeDisabled();
    expect(screen.getByLabelText("Prioridade")).toBeDisabled();
  });

  it("should show all priority options", () => {
    render(<NewPatientFields {...mockProps} />);

    expect(screen.getByText("3 - Padrão")).toBeInTheDocument();
    expect(screen.getByText("2 - Idoso/crianças")).toBeInTheDocument();
    expect(screen.getByText("1 - Exceção")).toBeInTheDocument();
  });
});
