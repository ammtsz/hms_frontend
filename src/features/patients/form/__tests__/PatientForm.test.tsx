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

jest.mock("@/api/attendances", () => ({
  getAttendancesByDate: jest.fn().mockResolvedValue({
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
    label: "Exceção",
    isActive: true,
    sortOrder: 1,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: 2,
    type: "priority",
    value: "2",
    label: "Idoso/crianças",
    isActive: true,
    sortOrder: 2,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: 3,
    type: "priority",
    value: "3",
    label: "Padrão",
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
  mainComplaint: "",
  dischargeDate: null,
  nextAttendanceDates: [],
  previousAttendances: [],
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
  scheduledAttendanceDate: null,
  attendanceCreationFailed: null,
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

      expect(screen.getByText("Cadastro de Paciente")).toBeInTheDocument();
      expect(
        screen.getByText("Preencha as informações do novo paciente"),
      ).toBeInTheDocument();
    });

    it("should display treatment section header", () => {
      renderWithProviders(<PatientForm />);

      expect(screen.getByText("Consulta de Avaliação")).toBeInTheDocument();
    });
  });

  describe("Form Fields", () => {
    it("should render all required personal information fields", () => {
      renderWithProviders(<PatientForm />);

      expect(screen.getByLabelText("Nome *")).toBeInTheDocument();
      expect(screen.getByLabelText("Telefone")).toBeInTheDocument();
      expect(screen.getByLabelText("Data de Nascimento *")).toBeInTheDocument();
      expect(screen.getByLabelText("Prioridade")).toBeInTheDocument();
      expect(screen.getByLabelText("Status")).toBeInTheDocument();
      expect(screen.getByLabelText("Principal Queixa")).toBeInTheDocument();
    });

    it("should render all treatment information fields", () => {
      renderWithProviders(<PatientForm />);

      expect(
        screen.getByLabelText("Primeira Consulta (opcional)"),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Alta Prevista (opcional)"),
      ).toBeInTheDocument();
    });
  });

  describe("Priority Options", () => {
    it("should display correct priority options with new labels", () => {
      renderWithProviders(<PatientForm />);

      const prioritySelect = screen.getByLabelText("Prioridade");

      expect(prioritySelect).toBeInTheDocument();
      expect(screen.getByDisplayValue("3 - Padrão")).toBeInTheDocument();

      const options = screen.getAllByRole("option");
      const priorityOptions = options.filter(
        (option) =>
          option.textContent?.includes("Padrão") ||
          option.textContent?.includes("Idoso/crianças") ||
          option.textContent?.includes("Exceção"),
      );

      expect(priorityOptions).toHaveLength(3);
    });
  });

  describe("Status Options", () => {
    it("should display correct status options with new labels", () => {
      renderWithProviders(<PatientForm />);

      const statusSelect = screen.getByLabelText("Status");

      expect(statusSelect).toBeInTheDocument();
      expect(screen.getByDisplayValue("Em Tratamento")).toBeInTheDocument();

      const options = screen.getAllByRole("option");
      const statusOptions = options.filter(
        (option) =>
          option.textContent?.includes("Em Tratamento") ||
          option.textContent?.includes("Alta do tratamento") ||
          option.textContent?.includes("Faltas Consecutivas"),
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

      const nameInput = screen.getByLabelText("Nome *");
      fireEvent.change(nameInput, { target: { value: "João Silva" } });

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
        "Primeira Consulta (opcional)",
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

      const submitButton = screen.getByText("Cadastrar Paciente");
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute("type", "submit");
    });

    it("should show loading state when saving", () => {
      (usePatientForm as jest.Mock).mockReturnValue({
        ...defaultMockReturn,
        isLoading: true,
      });

      renderWithProviders(<PatientForm />);

      const submitButton = screen.getByText("Salvando...");
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Data Display", () => {
    it("should display patient data correctly", () => {
      const patientWithData = {
        ...mockPatient,
        name: "João Silva",
        phone: "(11) 99999-9999",
        mainComplaint: "Dor de cabeça",
      };

      (usePatientForm as jest.Mock).mockReturnValue({
        ...defaultMockReturn,
        patient: patientWithData,
      });

      renderWithProviders(<PatientForm />);

      expect(screen.getByDisplayValue("João Silva")).toBeInTheDocument();
      expect(screen.getByDisplayValue("(11) 99999-9999")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Dor de cabeça")).toBeInTheDocument();
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

      const submitButton = screen.getByText("Cadastrar Paciente");
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button when form is valid", () => {
      const mockIsFormValid = jest.fn().mockReturnValue(true);
      (usePatientForm as jest.Mock).mockReturnValue({
        ...defaultMockReturn,
        isFormValid: mockIsFormValid,
      });

      renderWithProviders(<PatientForm />);

      const submitButton = screen.getByText("Cadastrar Paciente");
      expect(submitButton).not.toBeDisabled();
    });

    it("should display validation errors for required fields", () => {
      (usePatientForm as jest.Mock).mockReturnValue({
        ...defaultMockReturn,
        validationErrors: {
          name: "Nome é obrigatório",
          birthDate: "Data de nascimento é obrigatória",
          phone: "Telefone deve estar no formato (XX) XXXXX-XXXX",
        },
      });

      renderWithProviders(<PatientForm />);

      expect(screen.getByText("Nome é obrigatório")).toBeInTheDocument();
      expect(
        screen.getByText("Data de nascimento é obrigatória"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Telefone deve estar no formato (XX) XXXXX-XXXX"),
      ).toBeInTheDocument();
    });

    it("should apply error styles to fields with validation errors", () => {
      (usePatientForm as jest.Mock).mockReturnValue({
        ...defaultMockReturn,
        validationErrors: {
          name: "Nome é obrigatório",
          phone: "Formato inválido",
        },
      });

      renderWithProviders(<PatientForm />);

      const nameInput = screen.getByLabelText("Nome *");
      const phoneInput = screen.getByLabelText("Telefone");

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

      const nameInput = screen.getByLabelText("Nome *");
      fireEvent.keyDown(nameInput, { key: "Enter" });

      // The keyDown event should bubble up to the form
      expect(mockHandleKeyDown).toHaveBeenCalled();
    });
  });

  describe("Success Modal", () => {
    it("should not show success modal by default", () => {
      renderWithProviders(<PatientForm />);

      expect(
        screen.queryByText("Paciente cadastrado!"),
      ).not.toBeInTheDocument();
    });

    it("should show success modal when showSuccessModal is true", () => {
      (usePatientForm as jest.Mock).mockReturnValue({
        ...defaultMockReturn,
        showSuccessModal: true,
      });

      renderWithProviders(<PatientForm />);

      expect(screen.getByText("Paciente cadastrado!")).toBeInTheDocument();
      expect(
        screen.getByText("O paciente foi cadastrado com sucesso no sistema."),
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

    it("should show attendance creation failure message when first attendance could not be created", () => {
      (usePatientForm as jest.Mock).mockReturnValue({
        ...defaultMockReturn,
        showSuccessModal: true,
        scheduledAttendanceDate: null,
        attendanceCreationFailed: {
          requested: true,
          message: "Nenhum horário disponível para a data selecionada.",
        },
      });

      renderWithProviders(<PatientForm />);

      expect(screen.getByText("Paciente cadastrado!")).toBeInTheDocument();
      expect(
        screen.getByText("Não foi possível agendar a primeira consulta."),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Nenhum horário disponível para a data selecionada."),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Você pode agendar manualmente na agenda."),
      ).toBeInTheDocument();
    });
  });
});
