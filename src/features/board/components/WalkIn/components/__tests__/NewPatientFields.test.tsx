import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { NewPatientFields } from "../NewPatientFields";
import { useSelectablePrioritiesForForm } from "@/features/board/hooks/useSelectablePrioritiesForForm";
import { SystemOptionType } from "@/types/systemOptions";

jest.mock("@/features/board/hooks/useSelectablePrioritiesForForm", () => ({
  useSelectablePrioritiesForForm: jest.fn(),
}));

describe("NewPatientFields", () => {
  const mockPriorities = [
    {
      id: 1,
      type: SystemOptionType.PRIORITY,
      value: "3",
      label: "Priority 3",
      isActive: true,
      sortOrder: 3,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: 2,
      type: SystemOptionType.PRIORITY,
      value: "2",
      label: "Standard",
      isActive: true,
      sortOrder: 2,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: 3,
      type: SystemOptionType.PRIORITY,
      value: "1",
      label: "Priority",
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

    expect(screen.getByLabelText("Phone *")).toBeInTheDocument();
    expect(screen.getByLabelText("Date of Birth *")).toBeInTheDocument();
    expect(screen.getByLabelText("Priority")).toBeInTheDocument();
    // Note: mainConcern removed - should be documented during consultation, not at check-in
  });

  it("should call onPhoneChange when phone input changes", () => {
    render(<NewPatientFields {...mockProps} />);

    const phoneInput = screen.getByLabelText("Phone *");
    fireEvent.change(phoneInput, { target: { value: "1234567890" } });

    expect(mockProps.onPhoneChange).toHaveBeenCalled();
  });

  it("should call onBirthDateChange when date changes", () => {
    render(<NewPatientFields {...mockProps} />);

    const dateInput = screen.getByLabelText("Date of Birth *");
    fireEvent.change(dateInput, { target: { value: "2000-01-01" } });

    expect(mockProps.onBirthDateChange).toHaveBeenCalled();
  });

  it("should call onPriorityChange when priority changes", () => {
    render(<NewPatientFields {...mockProps} />);

    const select = screen.getByLabelText("Priority");
    fireEvent.change(select, { target: { value: "1" } });

    expect(mockProps.onPriorityChange).toHaveBeenCalledWith("1");
  });

  it("should display phone value correctly", () => {
    render(<NewPatientFields {...mockProps} phone="(11) 98765-4321" />);

    const phoneInput = screen.getByLabelText("Phone *") as HTMLInputElement;
    expect(phoneInput.value).toBe("(11) 98765-4321");
  });

  it("should disable all inputs when submitting", () => {
    render(<NewPatientFields {...mockProps} isSubmitting={true} />);

    expect(screen.getByLabelText("Phone *")).toBeDisabled();
    expect(screen.getByLabelText("Date of Birth *")).toBeDisabled();
    expect(screen.getByLabelText("Priority")).toBeDisabled();
  });

  it("should show all priority options", () => {
    render(<NewPatientFields {...mockProps} />);

    expect(screen.getByText("3 - Priority 3")).toBeInTheDocument();
    expect(screen.getByText("2 - Standard")).toBeInTheDocument();
    expect(screen.getByText("1 - Priority")).toBeInTheDocument();
  });
});
