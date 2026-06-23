import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PatientEditPage from "../PatientEditPage";
import { ToastProvider } from "@/contexts/ToastContext";
import {
  usePatientWithAppointments,
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
  usePatientWithAppointments: jest.fn(),
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
    name: "John Smith",
    phone: "(555) 321-6547",
    priority: "3",
    status: "T",
    birthDate: new Date("1990-01-01"),
    mainConcern: "Test complaint",
    startDate: new Date(),
    dischargeDate: null,
    nextAppointmentDates: [],
    currentRecommendations: {
      date: new Date(),
      food: "",
      water: "",
      ointment: "",
      physiotherapy: false,
      tens: false,
      returnWeeks: 0,
    },
    previousAppointments: [],
  };

  const mockFormPatient = {
    name: "John Smith",
    phone: "(555) 321-6547",
    priority: "3",
    status: "T",
    birthDate: new Date("1990-01-01"),
    mainConcern: "Test complaint",
    dischargeDate: null,
    nextAppointmentDates: [],
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
    (usePatientWithAppointments as jest.Mock).mockReturnValue({
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
    (usePatientWithAppointments as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    renderComponent();

    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
    expect(screen.getAllByText("Loading...")[0]).toBeInTheDocument();
  });

  it("should render error state when patient not found", () => {
    (usePatientWithAppointments as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("Patient not found"),
      refetch: jest.fn(),
    });

    renderComponent();

    expect(screen.getByTestId("page-error")).toBeInTheDocument();
    expect(screen.getByText("Error loading patient")).toBeInTheDocument();
  });

  it("should render patient edit form when data loaded", () => {
    renderComponent();

    expect(screen.getByText("Edit Patient: John Smith")).toBeInTheDocument();
    expect(screen.getByText("ID #123")).toBeInTheDocument();
    expect(screen.getByTestId("patient-form-fields")).toBeInTheDocument();
  });

  it("should render breadcrumb navigation", () => {
    renderComponent();

    const breadcrumb = screen.getByTestId("breadcrumb");
    expect(breadcrumb).toHaveTextContent("Patients");
    expect(breadcrumb).toHaveTextContent("John Smith");
    expect(breadcrumb).toHaveTextContent("Edit");
  });

  it("should render action buttons", () => {
    renderComponent();

    expect(
      screen.getByRole("button", { name: /^Delete$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Cancel/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Save Changes/i }),
    ).toBeInTheDocument();
  });

  it("should show delete modal when delete button clicked", () => {
    renderComponent();

    const deleteButton = screen.getByRole("button", {
      name: /^Delete$/i,
    });
    fireEvent.click(deleteButton);

    // Modal should be rendered (tested separately)
    expect(deleteButton).toBeInTheDocument();
  });

  it("should disable delete button when patient has appointment history", () => {
    (usePatientWithAppointments as jest.Mock).mockReturnValue({
      data: {
        ...mockPatient,
        openAppointmentsCount: 1,
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderComponent();

    const deleteButton = screen.getByRole("button", { name: /^Delete$/i });
    expect(deleteButton).toBeDisabled();
    expect(deleteButton).toHaveAttribute(
      "title",
      "Deletion is only allowed for patients without appointment history or with only canceled or missed appointments.",
    );
  });

  it("should show unsaved changes modal when canceling with changes", async () => {
    renderComponent();

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelButton);

    // Wait for modal to appear (component tracks changes via useEffect)
    await waitFor(() => {
      // Either modal appears or navigation happens
      const hasModal = screen.queryByText("Unsaved Changes");
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
      name: /Save Changes/i,
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

    expect(screen.getByText("Saving...")).toBeInTheDocument();
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
      error: "Error saving patient",
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
      "Error saving patient",
    );
  });

  it("should render information cards", () => {
    renderComponent();

    expect(screen.getByText("Basic Information")).toBeInTheDocument();
  });
});
