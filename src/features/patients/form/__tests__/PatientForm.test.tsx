import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import PatientForm from "../index";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClinicTimezoneProvider } from "@/contexts/ClinicTimezoneContext";

// Mock the API
jest.mock("@/api/patients", () => ({
  createPatient: jest.fn(),
  getPatients: jest.fn().mockResolvedValue({
    success: true,
    value: [],
  }),
}));

jest.mock("@/api/appointments", () => ({
  getAppointmentsByDate: jest.fn().mockResolvedValue({
    success: true,
    value: [],
  }),
}));

jest.mock("@/api/query/hooks/usePriorityOptionsQueries", () => ({
  usePriorities: jest.fn(),
}));

// Mock the usePatientForm hook
jest.mock("../hooks/usePatientForm", () => ({
  usePatientForm: jest.fn(),
}));

import { usePatientForm } from "../hooks/usePatientForm";
import { usePriorities } from "@/api/query/hooks/usePriorityOptionsQueries";

const mockPriorities = [
  {
    id: 1,
    type: "priority",
    value: "1",
    label: "Priority",
    isActive: true,
    sortOrder: 1,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: 2,
    type: "priority",
    value: "2",
    label: "Standard",
    isActive: true,
    sortOrder: 2,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: 3,
    type: "priority",
    value: "3",
    label: "Priority 3",
    isActive: true,
    sortOrder: 3,
    createdAt: "",
    updatedAt: "",
  },
];

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ClinicTimezoneProvider>{component}</ClinicTimezoneProvider>
    </QueryClientProvider>,
  );
};

const mockPatient = {
  name: "",
  phone: "",
  priority: "3" as const,
  status: "T" as const,
  birthDate: new Date("1990-01-01"),
  mainConcern: "",
  dischargeDate: null,
  nextAppointmentDates: [],
  previousAppointments: [],
};

const defaultMockReturn = {
  patient: mockPatient,
  setPatient: jest.fn(),
  handleChange: jest.fn(),
  handleAssessmentConsultationChange: jest.fn(),
  handleSubmit: jest.fn(),
  handleKeyDown: jest.fn(),
  isLoading: false,
  validationErrors: {},
  isFormValid: jest.fn().mockReturnValue(true),
  showSuccessModal: false,
  scheduledAppointmentDate: null,
  appointmentCreationFailed: null,
  handleSuccessModalConfirm: jest.fn(),
};

describe("PatientForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePatientForm as jest.Mock).mockReturnValue(defaultMockReturn);
    (usePriorities as jest.Mock).mockReturnValue({
      data: mockPriorities,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  describe("Layout and Structure", () => {
    it("should use consistent card layout", () => {
      renderWithProviders(<PatientForm />);

      const cardContainer = document.querySelector(
        ".rounded-lg.border.border-gray-200.bg-white",
      );
      expect(cardContainer).toBeInTheDocument();
    });

    it("should display form header with title and description", () => {
      renderWithProviders(<PatientForm />);

      expect(screen.getByText("Patient Registration")).toBeInTheDocument();
      expect(
        screen.getByText("Fill in the new patient information"),
      ).toBeInTheDocument();
    });

    it("should display treatment section header", () => {
      renderWithProviders(<PatientForm />);

      expect(screen.getByText("Assessment Consultation")).toBeInTheDocument();
    });
  });

  describe("Form Fields", () => {
    it("should render all required personal information fields", () => {
      renderWithProviders(<PatientForm />);

      expect(screen.getByLabelText("Name *")).toBeInTheDocument();
      expect(screen.getByLabelText("Phone")).toBeInTheDocument();
      expect(screen.getByLabelText("Date of Birth *")).toBeInTheDocument();
      expect(screen.getByLabelText("Priority")).toBeInTheDocument();
      expect(screen.getByLabelText("Status")).toBeInTheDocument();
      expect(screen.getByLabelText("Main Concern")).toBeInTheDocument();
    });

    it("should render all treatment information fields", () => {
      renderWithProviders(<PatientForm />);

      expect(
        screen.getByLabelText("First Consultation (optional)"),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Expected Discharge (optional)"),
      ).toBeInTheDocument();
    });
  });

  describe("Priority Options", () => {
    it("should display correct priority options with new labels", () => {
      renderWithProviders(<PatientForm />);

      const prioritySelect = screen.getByLabelText("Priority");

      expect(prioritySelect).toBeInTheDocument();
      expect(screen.getByDisplayValue("3 - Priority 3")).toBeInTheDocument();

      const options = screen.getAllByRole("option");
      const priorityOptions = options.filter(
        (option) =>
          option.textContent?.includes("Standard") ||
          option.textContent?.includes("Standard") ||
          option.textContent?.includes("Priority"),
      );

      expect(priorityOptions).toHaveLength(3);
    });
  });

  describe("Status Options", () => {
    it("should display correct status options with new labels", () => {
      renderWithProviders(<PatientForm />);

      const statusSelect = screen.getByLabelText("Status");

      expect(statusSelect).toBeInTheDocument();
      expect(screen.getByDisplayValue("In Treatment")).toBeInTheDocument();

      const options = screen.getAllByRole("option");
      const statusOptions = options.filter(
        (option) =>
          option.textContent?.includes("In Treatment") ||
          option.textContent?.includes("Discharged") ||
          option.textContent?.includes("Consecutive no-shows"),
      );

      expect(statusOptions).toHaveLength(3);
    });
  });

  describe("Form Interactions", () => {
    it("should call handleChange when personal fields are modified", () => {
      const mockHandleChange = jest.fn();
      (usePatientForm as jest.Mock).mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithProviders(<PatientForm />);

      const nameInput = screen.getByLabelText("Name *");
      fireEvent.change(nameInput, { target: { value: "John Smith" } });

      expect(mockHandleChange).toHaveBeenCalled();
    });

    it("should call handleAssessmentConsultationChange for date fields", () => {
      const mockHandleAssessmentChange = jest.fn();
      (usePatientForm as jest.Mock).mockReturnValue({
        ...defaultMockReturn,
        handleAssessmentConsultationChange: mockHandleAssessmentChange,
      });

      renderWithProviders(<PatientForm />);

      const firstConsultationDateInput = screen.getByLabelText(
        "First Consultation (optional)",
      );
      fireEvent.change(firstConsultationDateInput, {
        target: { value: "2024-01-15" },
      });

      expect(mockHandleAssessmentChange).toHaveBeenCalled();
    });
  });

  describe("Form Submission", () => {
    it("should call handleSubmit when form is submitted", () => {
      const mockHandleSubmit = jest.fn((e) => e.preventDefault());
      (usePatientForm as jest.Mock).mockReturnValue({
        ...defaultMockReturn,
        handleSubmit: mockHandleSubmit,
      });

      renderWithProviders(<PatientForm />);

      const form = document.querySelector("form");
      expect(form).toBeInTheDocument();

      fireEvent.submit(form!);

      expect(mockHandleSubmit).toHaveBeenCalled();
    });

    it("should render submit button with correct text", () => {
      renderWithProviders(<PatientForm />);

      const submitButton = screen.getByText("Register Patient");
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute("type", "submit");
    });

    it("should show loading state when saving", () => {
      (usePatientForm as jest.Mock).mockReturnValue({
        ...defaultMockReturn,
        isLoading: true,
      });

      renderWithProviders(<PatientForm />);

      const submitButton = screen.getByText("Saving...");
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Data Display", () => {
    it("should display patient data correctly", () => {
      const patientWithData = {
        ...mockPatient,
        name: "John Smith",
        phone: "(555) 123-4567",
        mainConcern: "Headache",
      };

      (usePatientForm as jest.Mock).mockReturnValue({
        ...defaultMockReturn,
        patient: patientWithData,
      });

      renderWithProviders(<PatientForm />);

      expect(screen.getByDisplayValue("John Smith")).toBeInTheDocument();
      expect(screen.getByDisplayValue("(555) 123-4567")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Headache")).toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    it("should have responsive grid classes", () => {
      renderWithProviders(<PatientForm />);

      const gridContainers = document.querySelectorAll(
        ".grid.grid-cols-1.md\\:grid-cols-2, .grid.grid-cols-1.md\\:grid-cols-3",
      );
      expect(gridContainers.length).toBeGreaterThan(0);
    });

    it("should have full width inputs", () => {
      renderWithProviders(<PatientForm />);

      const inputs = document.querySelectorAll(
        "input.w-full, select.w-full, textarea.w-full",
      );
      expect(inputs.length).toBeGreaterThan(0);
    });
  });

  describe("Form Validation", () => {
    it("should disable submit button when form is invalid", () => {
      const mockIsFormValid = jest.fn().mockReturnValue(false);
      (usePatientForm as jest.Mock).mockReturnValue({
        ...defaultMockReturn,
        isFormValid: mockIsFormValid,
      });

      renderWithProviders(<PatientForm />);

      const submitButton = screen.getByText("Register Patient");
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button when form is valid", () => {
      const mockIsFormValid = jest.fn().mockReturnValue(true);
      (usePatientForm as jest.Mock).mockReturnValue({
        ...defaultMockReturn,
        isFormValid: mockIsFormValid,
      });

      renderWithProviders(<PatientForm />);

      const submitButton = screen.getByText("Register Patient");
      expect(submitButton).not.toBeDisabled();
    });

    it("should display validation errors for required fields", () => {
      (usePatientForm as jest.Mock).mockReturnValue({
        ...defaultMockReturn,
        validationErrors: {
          name: "Name is required",
          birthDate: "Date of birth is required",
          phone: "Phone must be in the format (XXX) XXX-XXXX",
        },
      });

      renderWithProviders(<PatientForm />);

      expect(screen.getByText("Name is required")).toBeInTheDocument();
      expect(screen.getByText("Date of birth is required")).toBeInTheDocument();
      expect(
        screen.getByText("Phone must be in the format (XXX) XXX-XXXX"),
      ).toBeInTheDocument();
    });

    it("should apply error styles to fields with validation errors", () => {
      (usePatientForm as jest.Mock).mockReturnValue({
        ...defaultMockReturn,
        validationErrors: {
          name: "Name is required",
          phone: "Invalid format",
        },
      });

      renderWithProviders(<PatientForm />);

      const nameInput = screen.getByLabelText("Name *");
      const phoneInput = screen.getByLabelText("Phone");

      expect(nameInput).toHaveClass("border-red-500");
      expect(phoneInput).toHaveClass("border-red-500");
    });
  });

  describe("Enter Key Prevention", () => {
    it("should attach keyDown handler to form", () => {
      const mockHandleKeyDown = jest.fn();
      (usePatientForm as jest.Mock).mockReturnValue({
        ...defaultMockReturn,
        handleKeyDown: mockHandleKeyDown,
      });

      renderWithProviders(<PatientForm />);

      const form = document.querySelector("form");
      expect(form).toBeInTheDocument();

      fireEvent.keyDown(form!, { key: "Enter" });
      expect(mockHandleKeyDown).toHaveBeenCalled();
    });

    it("should call handleKeyDown when Enter is pressed in form", () => {
      const mockHandleKeyDown = jest.fn();
      (usePatientForm as jest.Mock).mockReturnValue({
        ...defaultMockReturn,
        handleKeyDown: mockHandleKeyDown,
      });

      renderWithProviders(<PatientForm />);

      const nameInput = screen.getByLabelText("Name *");
      fireEvent.keyDown(nameInput, { key: "Enter" });

      // The keyDown event should bubble up to the form
      expect(mockHandleKeyDown).toHaveBeenCalled();
    });
  });

  describe("Success Modal", () => {
    it("should not show success modal by default", () => {
      renderWithProviders(<PatientForm />);

      expect(screen.queryByText("Patient registered!")).not.toBeInTheDocument();
    });

    it("should show success modal when showSuccessModal is true", () => {
      (usePatientForm as jest.Mock).mockReturnValue({
        ...defaultMockReturn,
        showSuccessModal: true,
      });

      renderWithProviders(<PatientForm />);

      expect(screen.getByText("Patient registered!")).toBeInTheDocument();
      expect(
        screen.getByText(
          "The patient was successfully registered in the system.",
        ),
      ).toBeInTheDocument();
    });

    it("should call handleSuccessModalConfirm when OK button is clicked", () => {
      const mockHandleConfirm = jest.fn();
      (usePatientForm as jest.Mock).mockReturnValue({
        ...defaultMockReturn,
        showSuccessModal: true,
        handleSuccessModalConfirm: mockHandleConfirm,
      });

      renderWithProviders(<PatientForm />);

      const okButton = screen.getByRole("button", { name: "OK" });
      fireEvent.click(okButton);

      expect(mockHandleConfirm).toHaveBeenCalledTimes(1);
    });

    it("should show appointment creation failure message when first appointment could not be created", () => {
      (usePatientForm as jest.Mock).mockReturnValue({
        ...defaultMockReturn,
        showSuccessModal: true,
        scheduledAppointmentDate: null,
        appointmentCreationFailed: {
          requested: true,
          message: "No time slot available for the selected date.",
        },
      });

      renderWithProviders(<PatientForm />);

      expect(screen.getByText("Patient registered!")).toBeInTheDocument();
      expect(
        screen.getByText("Unable to schedule the first consultation."),
      ).toBeInTheDocument();
      expect(
        screen.getByText("No time slot available for the selected date."),
      ).toBeInTheDocument();
      expect(
        screen.getByText("You can schedule it manually in the schedule."),
      ).toBeInTheDocument();
    });
  });
});
