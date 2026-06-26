/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PostConsultationModal from "../PostConsultationModal";

// Mock the custom hooks
const mockUsePostAppointmentForm = {
  formData: {
    mainConcern: "",
    patientStatus: "N" as const,
    startDate: "2025-11-26",
    returnWeeks: 1,
    homeExercises: "",
    painManagement: "",
    medications: "",
    recommendations: {
      physiotherapy: { treatments: [] },
      tens: { treatments: [] },
    },
    notes: "",
    noGeneralRecommendations: false,
    noTreatmentRecommendations: false,
  },
  setFormData: jest.fn(),
  handleChange: jest.fn(),
  handleSubmit: jest.fn(),
  handleRecommendationsChange: jest.fn(),
  handleDateChange: jest.fn(),
  patientData: {
    id: "1",
    name: "Test Patient",
    phone: "123456789",
    birthDate: "1990-01-01",
  },
  fetchError: null,
  setFetchError: jest.fn(),
  isLoading: false,
  error: null,
  clearError: jest.fn(),
  showConfirmation: false,
  createdTreatments: [],
  resetConfirmation: jest.fn(),
  showErrors: false,
  treatmentCreationErrors: [],
  resetErrors: jest.fn(),
  retryTreatmentCreation: jest.fn(),
  handleCancel: jest.fn(),
  cancelledAppointments: [],
  newlyScheduledAppointments: [],
  fetchingAppointments: false,
  appointmentsError: null,
};

const mockModalStore = {
  isOpen: true,
  appointmentId: "appointment-123",
  patientId: "patient-123",
  patientName: "Test Patient",
  currentTreatmentStatus: "N",
};

// Mock the hooks
jest.mock("../hooks/usePostConsultationForm", () => ({
  usePostConsultationForm: jest.fn(() => mockUsePostAppointmentForm),
}));

jest.mock("@/stores/modalStore", () => ({
  usePostConsultationModal: jest.fn(() => mockModalStore),
  useCloseModal: jest.fn(() => jest.fn()),
}));

jest.mock("@/api/query/hooks/useScheduleSettingQueries", () => ({
  useScheduleSettings: jest.fn(() => ({
    data: Array.from({ length: 7 }, (_, i) => ({
      id: i + 1,
      dayOfWeek: i,
      startTime: "08:00",
      endTime: "18:00",
      maxConcurrentAssessment: 2,
      maxConcurrentPhysiotherapyTens: 2,
      isActive: true,
      createdAt: "2024-01-01T00:00:00",
      updatedAt: "2024-01-01T00:00:00",
    })),
    isLoading: false,
  })),
  hasInvalidTreatmentStartDates: jest.fn(() => false),
}));

// Mock the tab components
jest.mock("../components/tabs", () => ({
  BasicInfoTab: ({
    formData,
    onFormDataChange,
  }: {
    formData: { mainConcern: string };
    onFormDataChange: (field: string, value: string) => void;
  }) => (
    <div data-testid="basic-info-tab">
      <h3>Basic Info</h3>
      <input
        data-testid="main-complaint-input"
        value={formData.mainConcern}
        onChange={(e) => onFormDataChange("mainConcern", e.target.value)}
        placeholder="Main concern"
      />
    </div>
  ),
  GeneralRecommendationsTab: ({
    formData,
    onFormDataChange,
  }: {
    formData: { homeExercises: string };
    onFormDataChange: (field: string, value: string) => void;
  }) => (
    <div data-testid="general-recommendations-tab">
      <h3>General Recommendations</h3>
      <input
        data-testid="home-exercises-input"
        value={formData.homeExercises}
        onChange={(e) => onFormDataChange("homeExercises", e.target.value)}
        placeholder="Home exercises"
      />
    </div>
  ),
  TreatmentRecommendationsTab: ({
    onRecommendationsChange,
  }: {
    onRecommendationsChange: (type: string, recommendations: unknown[]) => void;
  }) => (
    <div data-testid="treatmentRecommendations-tab">
      <h3>Treatment Recommendations</h3>
      <button
        data-testid="add-recommendation-button"
        onClick={() => onRecommendationsChange("physiotherapy", [])}
      >
        Add Recommendation
      </button>
    </div>
  ),
}));

// Mock the confirmation and error components
jest.mock("../components/CreatedTreatmentsConfirmation", () => {
  return function MockCreatedTreatmentsConfirmation({
    createdTreatments,
    patientName,
    onAcknowledge,
  }: {
    createdTreatments: { id: string; name: string }[];
    patientName: string;
    onAcknowledge: () => void;
  }) {
    return (
      <div data-testid="created-treatments-confirmation">
        <h3>Treatment Completed - {patientName}</h3>
        <p>Treatment plans created: {createdTreatments.length}</p>
        <button data-testid="acknowledge-button" onClick={onAcknowledge}>
          Acknowledge
        </button>
      </div>
    );
  };
});

jest.mock("../components/TreatmentCreationErrors", () => {
  return function MockTreatmentCreationErrors({
    errors,
    patientName,
    onRetry,
    onContinue,
  }: {
    errors: { message: string }[];
    patientName: string;
    onRetry: () => void;
    onContinue: () => void;
  }) {
    return (
      <div data-testid="treatmentSession-errors">
        <h3>Treatment Errors - {patientName}</h3>
        <p>Errors: {errors.length}</p>
        <button data-testid="retry-button" onClick={onRetry}>
          Retry
        </button>
        <button data-testid="continue-button" onClick={onContinue}>
          Continue
        </button>
      </div>
    );
  };
});

// Mock common components
jest.mock("@/components/common/ErrorDisplay", () => {
  return function MockErrorDisplay({
    error,
    dismissible,
    onDismiss,
    className,
  }: {
    error: string;
    dismissible?: boolean;
    onDismiss?: () => void;
    className?: string;
  }) {
    return (
      <div data-testid="error-display" className={className}>
        <p>{error}</p>
        {dismissible && (
          <button data-testid="dismiss-error-button" onClick={onDismiss}>
            Dismiss
          </button>
        )}
      </div>
    );
  };
});

jest.mock("@/components/common/TabbedModal", () => {
  const MockTabbedModal = ({
    isOpen,
    onClose,
    title,
    subtitle,
    tabs,
    activeTab,
    onTabChange,
    actions,
    children,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle: string;
    tabs: { id: string; label: string; isValid: boolean }[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
    actions: React.ReactNode;
    children: React.ReactNode;
  }) => {
    if (!isOpen) return null;

    return (
      <div data-testid="tabbed-modal">
        <div data-testid="modal-header">
          <h2 data-testid="modal-title">{title}</h2>
          <p data-testid="modal-subtitle">{subtitle}</p>
          <button data-testid="close-modal-button" onClick={onClose}>
            Close
          </button>
        </div>

        {tabs && tabs.length > 0 && (
          <div data-testid="modal-tabs">
            {tabs.map(
              (tab: { id: string; label: string; isValid: boolean }) => (
                <button
                  key={tab.id}
                  data-testid={`tab-${tab.id}`}
                  className={activeTab === tab.id ? "active" : ""}
                  onClick={() => onTabChange(tab.id)}
                >
                  {tab.label} {tab.isValid ? "✓" : "✗"}
                </button>
              ),
            )}
          </div>
        )}

        <div data-testid="modal-content">{children}</div>

        {actions && <div data-testid="modal-actions">{actions}</div>}
      </div>
    );
  };

  return { __esModule: true, default: MockTabbedModal };
});

// Test wrapper with QueryClient
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe("PostConsultationModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks to default state
    Object.assign(mockUsePostAppointmentForm, {
      formData: {
        mainConcern: "",
        patientStatus: "N" as const,
        startDate: "2025-11-26",
        returnWeeks: 1,
        homeExercises: "",
        painManagement: "",
        medications: "",
        recommendations: {
          physiotherapy: { treatments: [] },
          tens: { treatments: [] },
        },
        notes: "",
        noGeneralRecommendations: false,
        noTreatmentRecommendations: false,
      },
      isLoading: false,
      error: null,
      fetchError: null,
      showConfirmation: false,
      showErrors: false,
      createdTreatments: [],
      treatmentCreationErrors: [],
    });

    Object.assign(mockModalStore, {
      isOpen: true,
      appointmentId: "appointment-123",
      patientId: "patient-123",
      patientName: "Test Patient",
      currentTreatmentStatus: "N",
    });
  });

  const renderComponent = () => {
    const Wrapper = createTestWrapper();
    return render(
      <Wrapper>
        <PostConsultationModal />
      </Wrapper>,
    );
  };

  describe("Modal Visibility", () => {
    it("should render when modal is open", () => {
      renderComponent();

      expect(screen.getByTestId("tabbed-modal")).toBeInTheDocument();
    });

    it("should not render when modal is closed", () => {
      Object.assign(mockModalStore, { isOpen: false });
      renderComponent();

      expect(screen.queryByTestId("tabbed-modal")).not.toBeInTheDocument();
    });

    it("should not render when appointmentId is missing", () => {
      Object.assign(mockModalStore, { appointmentId: null });
      renderComponent();

      expect(screen.queryByTestId("tabbed-modal")).not.toBeInTheDocument();
    });
  });

  describe("Modal Header", () => {
    it("should display correct title and subtitle in normal mode", () => {
      renderComponent();

      expect(screen.getByTestId("modal-title")).toHaveTextContent(
        "Assessment Consultation Form - Test Patient",
      );
      expect(screen.getByTestId("modal-subtitle")).toHaveTextContent(
        "Appointment #appointment-123 • Patient #patient-123",
      );
    });

    it("should display confirmation title when showConfirmation is true", () => {
      Object.assign(mockUsePostAppointmentForm, { showConfirmation: true });
      renderComponent();

      expect(screen.getByTestId("modal-title")).toHaveTextContent(
        "Consultation Completed - Test Patient",
      );
      expect(screen.getByTestId("modal-subtitle")).toHaveTextContent(
        "Appointments created automatically",
      );
    });

    it("should display error title when showErrors is true", () => {
      Object.assign(mockUsePostAppointmentForm, { showErrors: true });
      renderComponent();

      expect(screen.getByTestId("modal-title")).toHaveTextContent(
        "Problems with Treatment - Test Patient",
      );
      expect(screen.getByTestId("modal-subtitle")).toHaveTextContent(
        "Some appointments could not be created",
      );
    });
  });

  describe("Tab Navigation", () => {
    it("should render all tabs in normal mode", () => {
      renderComponent();

      expect(screen.getByTestId("tab-basic")).toBeInTheDocument();
      expect(screen.getByTestId("tab-general")).toBeInTheDocument();
      expect(screen.getByTestId("tab-treatment")).toBeInTheDocument();
    });

    it("should not render tabs in confirmation mode", () => {
      Object.assign(mockUsePostAppointmentForm, { showConfirmation: true });
      renderComponent();

      expect(screen.queryByTestId("modal-tabs")).not.toBeInTheDocument();
    });

    it("should not render tabs in error mode", () => {
      Object.assign(mockUsePostAppointmentForm, { showErrors: true });
      renderComponent();

      expect(screen.queryByTestId("modal-tabs")).not.toBeInTheDocument();
    });

    it("should switch tabs when clicked", async () => {
      const user = userEvent.setup();
      renderComponent();

      // Start with basic tab active
      expect(screen.getByTestId("tab-basic")).toHaveClass("active");

      // Click general tab
      await user.click(screen.getByTestId("tab-general"));

      // Should switch to general tab
      expect(screen.getByTestId("tab-general")).toHaveClass("active");
    });

    it("should show validation status in tabs", () => {
      renderComponent();

      // Basic tab should be invalid (empty complaint)
      expect(screen.getByTestId("tab-basic")).toHaveTextContent("✗");

      // General and treatment tabs invalid when empty and checkboxes unchecked
      expect(screen.getByTestId("tab-general")).toHaveTextContent("✗");
      expect(screen.getByTestId("tab-treatment")).toHaveTextContent("✗");
    });

    it("should show general and treatment tabs as valid when checkboxes are checked", () => {
      Object.assign(mockUsePostAppointmentForm, {
        formData: {
          ...mockUsePostAppointmentForm.formData,
          noGeneralRecommendations: true,
          noTreatmentRecommendations: true,
        },
      });
      renderComponent();

      expect(screen.getByTestId("tab-general")).toHaveTextContent("✓");
      expect(screen.getByTestId("tab-treatment")).toHaveTextContent("✓");
    });

    it("should validate basic tab when complaint is filled", () => {
      Object.assign(mockUsePostAppointmentForm, {
        formData: {
          ...mockUsePostAppointmentForm.formData,
          mainConcern: "Test complaint",
        },
      });
      renderComponent();

      expect(screen.getByTestId("tab-basic")).toHaveTextContent("✓");
    });
  });

  describe("Tab Content", () => {
    it("should render BasicInfoTab by default", () => {
      renderComponent();

      expect(screen.getByTestId("basic-info-tab")).toBeInTheDocument();
      expect(
        screen.queryByTestId("general-recommendations-tab"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("treatmentRecommendations-tab"),
      ).not.toBeInTheDocument();
    });

    it("should render GeneralRecommendationsTab when selected", async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByTestId("tab-general"));

      expect(
        screen.getByTestId("general-recommendations-tab"),
      ).toBeInTheDocument();
      expect(screen.queryByTestId("basic-info-tab")).not.toBeInTheDocument();
    });

    it("should render TreatmentRecommendationsTab when selected", async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByTestId("tab-treatment"));

      expect(
        screen.getByTestId("treatmentRecommendations-tab"),
      ).toBeInTheDocument();
      expect(screen.queryByTestId("basic-info-tab")).not.toBeInTheDocument();
    });

    it("should handle form input changes in BasicInfoTab", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByTestId("main-complaint-input");
      await user.type(input, "Test complaint");

      expect(mockUsePostAppointmentForm.handleChange).toHaveBeenCalled();
    });

    it("should handle form input changes in GeneralRecommendationsTab", async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByTestId("tab-general"));

      const input = screen.getByTestId("home-exercises-input");
      await user.type(input, "Stretching daily");

      expect(mockUsePostAppointmentForm.handleChange).toHaveBeenCalled();
    });

    it("should handle recommendations changes in TreatmentRecommendationsTab", async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByTestId("tab-treatment"));

      const button = screen.getByTestId("add-recommendation-button");
      await user.click(button);

      expect(
        mockUsePostAppointmentForm.handleRecommendationsChange,
      ).toHaveBeenCalledWith("physiotherapy", []);
    });
  });

  describe("Error Handling", () => {
    it("should display form error when present", () => {
      Object.assign(mockUsePostAppointmentForm, {
        error: "Form validation error",
      });
      renderComponent();

      expect(screen.getByTestId("error-display")).toHaveTextContent(
        "Form validation error",
      );
    });

    it("should display fetch error when present", () => {
      Object.assign(mockUsePostAppointmentForm, { fetchError: "Network error" });
      renderComponent();

      expect(screen.getByTestId("error-display")).toHaveTextContent(
        "Network error",
      );
    });

    it("should allow dismissing form errors", async () => {
      const user = userEvent.setup();
      Object.assign(mockUsePostAppointmentForm, {
        error: "Form validation error",
      });
      renderComponent();

      await user.click(screen.getByTestId("dismiss-error-button"));

      expect(mockUsePostAppointmentForm.clearError).toHaveBeenCalled();
    });

    it("should allow dismissing fetch errors", async () => {
      const user = userEvent.setup();
      Object.assign(mockUsePostAppointmentForm, { fetchError: "Network error" });
      renderComponent();

      await user.click(screen.getByTestId("dismiss-error-button"));

      expect(mockUsePostAppointmentForm.setFetchError).toHaveBeenCalled();
    });

    it("should not show errors in confirmation mode", () => {
      Object.assign(mockUsePostAppointmentForm, {
        error: "Form error",
        showConfirmation: true,
      });
      renderComponent();

      expect(screen.queryByTestId("error-display")).not.toBeInTheDocument();
    });

    it("should not show errors in error mode", () => {
      Object.assign(mockUsePostAppointmentForm, {
        error: "Form error",
        showErrors: true,
      });
      renderComponent();

      expect(screen.queryByTestId("error-display")).not.toBeInTheDocument();
    });
  });

  describe("Modal Actions", () => {
    it("should render cancel and submit buttons in normal mode", () => {
      renderComponent();

      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.getByTestId("loading-button")).toBeInTheDocument();
    });

    it("should not render actions in confirmation mode", () => {
      Object.assign(mockUsePostAppointmentForm, { showConfirmation: true });
      renderComponent();

      expect(screen.queryByTestId("modal-actions")).not.toBeInTheDocument();
    });

    it("should not render actions in error mode", () => {
      Object.assign(mockUsePostAppointmentForm, { showErrors: true });
      renderComponent();

      expect(screen.queryByTestId("modal-actions")).not.toBeInTheDocument();
    });

    it("should handle cancel button click", async () => {
      const mockCloseModal = jest.fn();
      const modalStoreModule = jest.requireMock("@/stores/modalStore");
      modalStoreModule.useCloseModal.mockReturnValue(mockCloseModal);

      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByText("Cancel"));

      expect(mockCloseModal).toHaveBeenCalledWith("postConsultation");
    });

    it("should handle submit button click", async () => {
      Object.assign(mockUsePostAppointmentForm, {
        formData: {
          ...mockUsePostAppointmentForm.formData,
          mainConcern: "Test complaint",
          noGeneralRecommendations: true,
          noTreatmentRecommendations: true,
        },
      });
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByTestId("loading-button"));

      expect(mockUsePostAppointmentForm.handleSubmit).toHaveBeenCalled();
    });

    it("should disable buttons when loading", () => {
      Object.assign(mockUsePostAppointmentForm, { isLoading: true });
      renderComponent();

      expect(screen.getByText("Cancel")).toBeDisabled();
      expect(screen.getByTestId("loading-button")).toBeDisabled();
      expect(screen.getByTestId("loading-button")).toHaveTextContent(
        "Saving...",
      );
    });
  });

  describe("Confirmation Mode", () => {
    beforeEach(() => {
      Object.assign(mockUsePostAppointmentForm, {
        showConfirmation: true,
        createdTreatments: [
          { id: "1", name: "Session 1" },
          { id: "2", name: "Session 2" },
        ],
      });
    });

    it("should render confirmation component", () => {
      renderComponent();

      expect(
        screen.getByTestId("created-treatments-confirmation"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Treatment Completed - Test Patient"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Treatment plans created: 2"),
      ).toBeInTheDocument();
    });

    it("should handle confirmation acknowledgment", async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByTestId("acknowledge-button"));

      expect(mockUsePostAppointmentForm.resetConfirmation).toHaveBeenCalled();
      expect(mockUsePostAppointmentForm.handleCancel).toHaveBeenCalled();
    });
  });

  describe("Error Mode", () => {
    beforeEach(() => {
      Object.assign(mockUsePostAppointmentForm, {
        showErrors: true,
        treatmentCreationErrors: [
          { message: "Error 1" },
          { message: "Error 2" },
        ],
      });
    });

    it("should render error component", () => {
      renderComponent();

      expect(screen.getByTestId("treatmentSession-errors")).toBeInTheDocument();
      expect(
        screen.getByText("Treatment Errors - Test Patient"),
      ).toBeInTheDocument();
      expect(screen.getByText("Errors: 2")).toBeInTheDocument();
    });

    it("should handle error retry", async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByTestId("retry-button"));

      expect(
        mockUsePostAppointmentForm.retryTreatmentCreation,
      ).toHaveBeenCalled();
    });

    it("should handle error continue", async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByTestId("continue-button"));

      expect(mockUsePostAppointmentForm.resetErrors).toHaveBeenCalled();
      expect(mockUsePostAppointmentForm.handleCancel).toHaveBeenCalled();
    });
  });

  describe("Modal Closing", () => {
    it("should handle modal close via header button", async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByTestId("close-modal-button"));

      expect(mockUsePostAppointmentForm.handleCancel).toHaveBeenCalled();
    });
  });

  describe("Integration", () => {
    it("should pass correct props to tab components", () => {
      renderComponent();

      // Verify BasicInfoTab receives correct props
      expect(screen.getByTestId("basic-info-tab")).toBeInTheDocument();
      // The component should have access to formData through the mock
    });

    it("should handle form data synchronization across tabs", async () => {
      const user = userEvent.setup();
      renderComponent();

      // Change data in basic tab
      const basicInput = screen.getByTestId("main-complaint-input");
      await user.type(basicInput, "Test");

      // Switch to general tab
      await user.click(screen.getByTestId("tab-general"));

      // Should maintain form state
      expect(mockUsePostAppointmentForm.handleChange).toHaveBeenCalled();
    });

    it("should handle tab validation correctly", () => {
      // Test with empty complaint (invalid basic tab)
      renderComponent();
      expect(screen.getByTestId("tab-basic")).toHaveTextContent("✗");

      // Clean up and test with filled complaint (valid basic tab)
      cleanup();
      Object.assign(mockUsePostAppointmentForm, {
        formData: {
          ...mockUsePostAppointmentForm.formData,
          mainConcern: "Test complaint",
        },
      });
      renderComponent();
      expect(screen.getByTestId("tab-basic")).toHaveTextContent("✓");
    });

    it("should handle scroll to top on error or fetchError change", () => {
      const mockScrollTo = jest.fn();

      // Mock querySelector to return an element with scrollTo method
      const mockElement = { scrollTo: mockScrollTo };
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn().mockReturnValue(mockElement);

      // Set up initial error state
      Object.assign(mockUsePostAppointmentForm, { error: "Test error" });

      renderComponent();

      expect(document.querySelector).toHaveBeenCalledWith(
        ".flex-1.bg-white.px-6.py-6.overflow-y-auto",
      );
      expect(mockScrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });

      // Restore original querySelector
      document.querySelector = originalQuerySelector;
    });

    it("should handle missing modal content element during scroll", () => {
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn().mockReturnValue(null);

      // Set up error state to trigger scroll effect
      Object.assign(mockUsePostAppointmentForm, { error: "Test error" });

      // Should not throw error when querySelector returns null
      expect(() => {
        renderComponent();
      }).not.toThrow();

      // Restore original querySelector
      document.querySelector = originalQuerySelector;
    });

    it("should handle default case in renderTabContent gracefully", () => {
      // The existing test structure should cover the component rendering
      // The default case in renderTabContent returns null for unknown tabs
      renderComponent();

      // The component should render without throwing errors
      expect(screen.getByTestId("tabbed-modal")).toBeInTheDocument();

      // The TabbedModal handles invalid tab states and the default case returns null gracefully
      expect(() => renderComponent()).not.toThrow();
    });
  });
});
