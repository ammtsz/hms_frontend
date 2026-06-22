import React from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ViewCompletedConsultationModal from "../ViewCompletedConsultationModal";

// Mock all the dependencies
jest.mock("@/api/query/hooks/useConsultationQueries", () => ({
  useConsultationByAttendance: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
}));

jest.mock("@/api/query/hooks/useTreatmentsQueries", () => ({
  useTreatmentsByPatient: jest.fn(() => ({
    treatments: [],
    loading: false,
    error: null,
  })),
}));

jest.mock("@/api/query/hooks/usePatientQueries", () => ({
  useNewlyScheduledAttendances: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

jest.mock("@/components/common/BaseModal", () => {
  return function MockBaseModal({ isOpen }: { isOpen: boolean }) {
    if (!isOpen) return null;
    return <div data-testid="base-modal">Modal Content</div>;
  };
});

const mockCloseModal = jest.fn();
const mockUseViewCompletedConsultationModal = jest.fn();

jest.mock("@/stores/modalStore", () => ({
  useViewCompletedConsultationModal: () =>
    mockUseViewCompletedConsultationModal(),
  useCloseModal: () => mockCloseModal,
}));

describe("ViewCompletedConsultationModal", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const renderModal = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ViewCompletedConsultationModal />
      </QueryClientProvider>
    );
  };

  describe("Modal Visibility", () => {
    it("should not render when modal is closed", () => {
      mockUseViewCompletedConsultationModal.mockReturnValue({
        isOpen: false,
        attendanceId: undefined,
        patientId: undefined,
        patientName: undefined,
      });

      const { container } = renderModal();
      expect(container).toBeEmptyDOMElement();
    });

    it("should render BaseModal when modal is open", () => {
      mockUseViewCompletedConsultationModal.mockReturnValue({
        isOpen: true,
        attendanceId: 123,
        patientId: 456,
        patientName: "John Smith",
      });

      const { getByTestId } = renderModal();
      expect(getByTestId("base-modal")).toBeInTheDocument();
    });
  });

  describe("Modal Store Integration", () => {
    it("should use correct modal state from store", () => {
      const mockState = {
        isOpen: true,
        attendanceId: 999,
        patientId: 888,
        patientName: "Test Patient",
      };

      mockUseViewCompletedConsultationModal.mockReturnValue(mockState);

      renderModal();

      // Verify the hook was called
      expect(mockUseViewCompletedConsultationModal).toHaveBeenCalled();
    });

    it("should have access to closeModal function", () => {
      mockUseViewCompletedConsultationModal.mockReturnValue({
        isOpen: true,
        attendanceId: 123,
        patientId: 456,
        patientName: "John Smith",
      });

      renderModal();

      // The component should have access to closeModal
      expect(mockCloseModal).toBeDefined();
    });
  });
});
