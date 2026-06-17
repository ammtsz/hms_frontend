import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { PatientSelector } from "../PatientSelector";

describe("PatientSelector", () => {
  const mockProps = {
    isNewPatient: false,
    name: "",
    showDropdown: false,
    filteredPatients: [
      { id: "1", name: "John Doe" },
      { id: "2", name: "Jane Smith" },
    ],
    isSubmitting: false,
    onNewPatientToggle: jest.fn(),
    onNameChange: jest.fn(),
    onPatientSelect: jest.fn(),
    onFocus: jest.fn(),
    setShowDropdown: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render patient search input when not new patient", () => {
    render(<PatientSelector {...mockProps} />);

    expect(
      screen.getByPlaceholderText("Buscar paciente pelo nome...")
    ).toBeInTheDocument();
  });

  it("should render new patient input when new patient is toggled", () => {
    render(<PatientSelector {...mockProps} isNewPatient={true} />);

    expect(
      screen.getByPlaceholderText("Nome do novo paciente...")
    ).toBeInTheDocument();
  });

  it("should call onNewPatientToggle when switch is toggled", () => {
    render(<PatientSelector {...mockProps} />);

    const switchInput = screen.getByLabelText("Novo paciente");
    fireEvent.click(switchInput);

    expect(mockProps.onNewPatientToggle).toHaveBeenCalledWith(true);
  });

  it("should call onNameChange when name input changes", () => {
    render(<PatientSelector {...mockProps} />);

    const input = screen.getByPlaceholderText("Buscar paciente pelo nome...");
    fireEvent.change(input, { target: { value: "John" } });

    expect(mockProps.onNameChange).toHaveBeenCalledWith("John");
  });

  it("should show dropdown when there are filtered patients", () => {
    render(<PatientSelector {...mockProps} showDropdown={true} name="John" />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("should call onPatientSelect when patient is clicked", () => {
    render(<PatientSelector {...mockProps} showDropdown={true} name="John" />);

    const patientOption = screen.getByText("John Doe");
    fireEvent.click(patientOption);

    expect(mockProps.onPatientSelect).toHaveBeenCalledWith("John Doe");
  });

  it("should not show dropdown when showDropdown is false", () => {
    render(<PatientSelector {...mockProps} showDropdown={false} name="John" />);

    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
  });

  it("should disable inputs when submitting", () => {
    render(<PatientSelector {...mockProps} isSubmitting={true} />);

    const input = screen.getByPlaceholderText("Buscar paciente pelo nome...");
    expect(input).toBeDisabled();
  });
});
