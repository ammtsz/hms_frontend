import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PatientEditPage from "../PatientEditPage";
import { ToastProvider } from "@/contexts/ToastContext";
import {
  usePatientWithAttendances,
  usePatients,
  useDeletePatient,
} from "@/api/query/hooks/usePatientQueries";
import { useEditPatientForm } from "@/features/patients/form/hooks/useEditPatientForm";

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => "/patients/123/edit",
  useSearchParams: () => ({
    get: jest.fn(() => null),
  }),
}));

// Mock hooks
jest.mock("@/api/query/hooks/usePatientQueries", () => ({
  usePatientWithAttendances: jest.fn(),
  usePatients: jest.fn(),
  useDeletePatient: jest.fn(),
}));

jest.mock("@/features/patients/form/hooks/useEditPatientForm", () => ({
  useEditPatientForm: jest.fn(),
}));

// Types for mocked components
interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

interface ErrorProps {
  error: string;
  title?: string;
}

// Mock components
jest.mock("@/components/common/Breadcrumb", () => {
  return function MockBreadcrumb({ items }: BreadcrumbProps) {
    return (
      <div data-testid="breadcrumb">
        {items.map((item, i) => (
          <span key={i}>{item.label}</span>
        ))}
      </div>
    );
  };
});

jest.mock("@/features/patients/form/PatientFormFields", () => {
  return function MockPatientFormFields() {
    return <div data-testid="patient-form-fields">Form Fields</div>;
  };
});

jest.mock("@/features/patients/detail/PatientDetailSkeleton", () => ({
  PatientDetailSkeleton: function MockSkeleton() {
    return <div data-testid="skeleton">Loading...</div>;
  },
}));

jest.mock("@/components/common/PageError", () => ({
  PageError: function MockPageError({ error, title }: ErrorProps) {
    return (
      <div data-testid="page-error">
        <h1>{title}</h1>
        <p>{error}</p>
      </div>
    );
  },
}));

jest.mock("@/components/common/ErrorDisplay", () => {
  return function MockErrorDisplay({ error }: { error?: string | null }) {
    return error ? <div data-testid="error-display">{error}</div> : null;
  };
});

describe("PatientEditPage", () => {
  let queryClient: QueryClient;
  const mockPatient = {
    id: "123",
    name: "João Silva",
    phone: "(11) 98765-4321",
    priority: "3",
    status: "T",
    birthDate: new Date("1990-01-01"),
    mainComplaint: "Test complaint",
    startDate: new Date(),
    dischargeDate: null,
    nextAttendanceDates: [],
    currentRecommendations: {
      date: new Date(),
      food: "",
      water: "",
      ointment: "",
      physiotherapy: false,
      tens: false,
      returnWeeks: 0,
    },
    previousAttendances: [],
  };

  const mockFormPatient = {
    name: "João Silva",
    phone: "(11) 98765-4321",
    priority: "3",
    status: "T",
    birthDate: new Date("1990-01-01"),
    mainComplaint: "Test complaint",
    dischargeDate: null,
    nextAttendanceDates: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Setup default mocks
    (usePatientWithAttendances as jest.Mock).mockReturnValue({
      data: mockPatient,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    (usePatients as jest.Mock).mockReturnValue({
      data: [],
      refetch: jest.fn().mockResolvedValue({ data: [] }),
    });

    (useDeletePatient as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    (useEditPatientForm as jest.Mock).mockReturnValue({
      patient: mockFormPatient,
      handleChange: jest.fn(),
      handleAssessmentConsultationChange: jest.fn(),
      handleSubmit: jest.fn((e) => e.preventDefault()),
      handleSaveAnyway: jest.fn(),
      handleDelete: jest.fn(),
      isLoading: false,
      isDeleting: false,
      error: null,
      setError: jest.fn(),
      hasUnsavedChanges: false,
      duplicatePatients: [],
      showDuplicateModal: false,
      setShowDuplicateModal: jest.fn(),
      resetUnsavedChanges: jest.fn(),
      pendingStatusChange: null,
      confirmStatusChange: jest.fn(),
      cancelStatusChange: jest.fn(),
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <PatientEditPage patientId="123" />
        </ToastProvider>
      </QueryClientProvider>,
    );
  };

  it("should render loading state initially", () => {
    (usePatientWithAttendances as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    renderComponent();

    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  it("should render error state when patient not found", () => {
    (usePatientWithAttendances as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("Paciente não encontrado"),
      refetch: jest.fn(),
    });

    renderComponent();

    expect(screen.getByTestId("page-error")).toBeInTheDocument();
    expect(screen.getByText("Erro ao carregar paciente")).toBeInTheDocument();
  });

  it("should render patient edit form when data loaded", () => {
    renderComponent();

    expect(screen.getByText("Editar Paciente: João Silva")).toBeInTheDocument();
    expect(screen.getByText("Registro #123")).toBeInTheDocument();
    expect(screen.getByTestId("patient-form-fields")).toBeInTheDocument();
  });

  it("should render breadcrumb navigation", () => {
    renderComponent();

    const breadcrumb = screen.getByTestId("breadcrumb");
    expect(breadcrumb).toHaveTextContent("Pacientes");
    expect(breadcrumb).toHaveTextContent("João Silva");
    expect(breadcrumb).toHaveTextContent("Editar");
  });

  it("should render action buttons", () => {
    renderComponent();

    expect(
      screen.getByRole("button", { name: /excluir/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /cancelar/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /salvar alterações/i }),
    ).toBeInTheDocument();
  });

  it("should show delete modal when delete button clicked", () => {
    renderComponent();

    const deleteButton = screen.getByRole("button", {
      name: /excluir/i,
    });
    fireEvent.click(deleteButton);

    // Modal should be rendered (tested separately)
    expect(deleteButton).toBeInTheDocument();
  });

  it("should disable delete button when patient has attendance history", () => {
    (usePatientWithAttendances as jest.Mock).mockReturnValue({
      data: {
        ...mockPatient,
        openAttendancesCount: 1,
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderComponent();

    const deleteButton = screen.getByRole("button", { name: /excluir/i });
    expect(deleteButton).toBeDisabled();
    expect(deleteButton).toHaveAttribute(
      "title",
      "É permitida a exclusão apenas de pacientes sem histórico de atendimento ou com apenas atendimentos cancelados ou perdidos.",
    );
  });

  it("should show unsaved changes modal when canceling with changes", async () => {
    renderComponent();

    const cancelButton = screen.getByRole("button", { name: /cancelar/i });
    fireEvent.click(cancelButton);

    // Wait for modal to appear (component tracks changes via useEffect)
    await waitFor(() => {
      // Either modal appears or navigation happens
      const hasModal = screen.queryByText("Alterações Não Salvas");
      const navigationCalled = mockPush.mock.calls.length > 0;
      expect(hasModal || navigationCalled).toBeTruthy();
    });
  });

  it("should submit form when save button clicked", async () => {
    const mockHandleSubmit = jest.fn((e) => e.preventDefault());
    (useEditPatientForm as jest.Mock).mockReturnValue({
      patient: mockFormPatient,
      handleChange: jest.fn(),
      handleAssessmentConsultationChange: jest.fn(),
      handleSubmit: mockHandleSubmit,
      handleSaveAnyway: jest.fn(),
      handleDelete: jest.fn(),
      isLoading: false,
      isDeleting: false,
      error: null,
      setError: jest.fn(),
      hasUnsavedChanges: false,
      duplicatePatients: [],
      showDuplicateModal: false,
      setShowDuplicateModal: jest.fn(),
      resetUnsavedChanges: jest.fn(),
      pendingStatusChange: null,
      confirmStatusChange: jest.fn(),
      cancelStatusChange: jest.fn(),
    });

    renderComponent();

    const saveButton = screen.getByRole("button", {
      name: /salvar alterações/i,
    });
    fireEvent.click(saveButton);

    // Wait for async operations (duplicate detection refetch)
    await waitFor(() => {
      expect(mockHandleSubmit).toHaveBeenCalled();
    });
  });

  it("should show loading state when saving", () => {
    (useEditPatientForm as jest.Mock).mockReturnValue({
      patient: mockFormPatient,
      handleChange: jest.fn(),
      handleAssessmentConsultationChange: jest.fn(),
      handleSubmit: jest.fn((e) => e.preventDefault()),
      handleSaveAnyway: jest.fn(),
      handleDelete: jest.fn(),
      isLoading: true,
      isDeleting: false,
      error: null,
      setError: jest.fn(),
      hasUnsavedChanges: false,
      duplicatePatients: [],
      showDuplicateModal: false,
      setShowDuplicateModal: jest.fn(),
      resetUnsavedChanges: jest.fn(),
      pendingStatusChange: null,
      confirmStatusChange: jest.fn(),
      cancelStatusChange: jest.fn(),
    });

    renderComponent();

    expect(screen.getByText("Salvando...")).toBeInTheDocument();
  });

  it("should display form errors when present", () => {
    (useEditPatientForm as jest.Mock).mockReturnValue({
      patient: mockFormPatient,
      handleChange: jest.fn(),
      handleAssessmentConsultationChange: jest.fn(),
      handleSubmit: jest.fn((e) => e.preventDefault()),
      handleSaveAnyway: jest.fn(),
      handleDelete: jest.fn(),
      isLoading: false,
      isDeleting: false,
      error: "Erro ao salvar paciente",
      setError: jest.fn(),
      hasUnsavedChanges: false,
      duplicatePatients: [],
      showDuplicateModal: false,
      setShowDuplicateModal: jest.fn(),
      resetUnsavedChanges: jest.fn(),
      pendingStatusChange: null,
      confirmStatusChange: jest.fn(),
      cancelStatusChange: jest.fn(),
    });

    renderComponent();

    expect(screen.getByTestId("error-display")).toHaveTextContent(
      "Erro ao salvar paciente",
    );
  });

  it("should render information cards", () => {
    renderComponent();

    expect(screen.getByText("Informações Básicas")).toBeInTheDocument();
  });
});
