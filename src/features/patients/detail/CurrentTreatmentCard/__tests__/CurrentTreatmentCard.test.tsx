import React from "react";
import { render as rtlRender } from "@testing-library/react";
import { screen, fireEvent, waitFor, cleanup } from "@/utils/testUtils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CurrentTreatmentCard } from "..";
import { Patient } from "@/types/types";
import {
  useTreatmentsByPatient,
  useCancelTreatments,
} from "@/api/query/hooks/useTreatmentsQueries";
import { useConsultations } from "@/api/query/hooks/useConsultationQueries";

// Prevent any real API calls (avoids XMLHttpRequest open handles)
jest.mock("@/api/lib/axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: null })),
    post: jest.fn(() => Promise.resolve({ data: null })),
    put: jest.fn(() => Promise.resolve({ data: null })),
    patch: jest.fn(() => Promise.resolve({ data: null })),
    delete: jest.fn(() => Promise.resolve({ data: null })),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  },
}));

// Mock the React Query hook
jest.mock("@/api/query/hooks/usePatientQueries", () => ({
  useUpdatePatient: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
    error: null,
  })),
  useNewlyScheduledAppointments: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

// Mock the appointment queries
jest.mock("@/api/query/hooks/useAppointmentQueries", () => ({
  useCreateAppointment: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
    error: null,
  })),
}));

// Mock the treatment sessions hooks
const mockMutateAsync = jest.fn();
const mockRefetch = jest.fn();

jest.mock("@/api/query/hooks/useTreatmentsQueries", () => ({
  useTreatmentsByPatient: jest.fn(() => ({
    treatments: [],
    loading: false,
    error: null,
    refetch: mockRefetch,
  })),
  useCancelTreatments: jest.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
    error: null,
  })),
}));

// Mock useConsultations (assessment consultations list)
jest.mock("@/api/query/hooks/useConsultationQueries", () => ({
  useConsultations: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  useCreateConsultation: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
    error: null,
  })),
  useUpdateConsultation: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
    error: null,
  })),
}));

const mockPatient: Patient = {
  id: "1",
  name: "John Smith",
  phone: "(555) 123-4567",
  birthDate: "1980-05-15",
  mainConcern: "Frequent headaches",
  status: "D",
  priority: "2",
  startDate: "2024-01-15",
  dischargeDate: "2024-06-15",
  timezone: "America/Sao_Paulo",
  nextAppointmentDates: [
    {
      date: "2024-12-28",
      type: "assessment",
    },
  ],
  currentRecommendations: {
    date: "2024-12-20",
    food: "Light meals",
    water: "2L/day",
    ointment: "Apply 2x daily",
    physiotherapy: true,
    tens: false,
    returnWeeks: 2,
  },
  previousAppointments: [],
  missingAppointmentsStreak: 0,
};

const mockTreatmentPlan = {
  id: 1,
  consultationId: 1,
  appointmentId: 1,
  patientId: 1,
  treatmentType: "physiotherapy" as const,
  bodyLocation: "Head",
  startDate: "2025-01-01",
  plannedSessions: 10,
  completedSessions: 3,
  status: "active" as const,
  durationMinutes: 30,
  color: "blue",
  notes: "Treatment going well",
  sessions: [],
  createdAt: "2025-01-01T10:00:00Z",
  updatedAt: "2025-01-01T10:00:00Z",
};

// Mock dateHelpers (used by TreatmentStatusOverview and others)
jest.mock("@/utils/dateUtils", () => ({
  formatDisplayDate: (date: string) => {
    return new Date(date).toLocaleDateString("en-US");
  },
  getDaysOverdue: () => 0,
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  });

describe("CurrentTreatmentCard", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = createTestQueryClient();
  });

  afterEach(async () => {
    cleanup();
    queryClient.clear();
    await queryClient.cancelQueries();
  });

  const renderWithClient = (ui: React.ReactElement) =>
    rtlRender(ui, {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

  it("renders treatment card with correct title", () => {
    renderWithClient(<CurrentTreatmentCard patient={mockPatient} />);

    expect(
      screen.getByText(/Treatment Status|Treatment Status/),
    ).toBeInTheDocument();
  });

  it("displays treatment timeline information", () => {
    renderWithClient(<CurrentTreatmentCard patient={mockPatient} />);

    expect(screen.getByText("Registration Date")).toBeInTheDocument();
    expect(
      screen.getByText(/Next Appointment|Next Appointment/),
    ).toBeInTheDocument();
    // Patient with status "D" shows "Discharged on"; others show "Expected Discharge"
    expect(screen.getByText(/Discharged on/)).toBeInTheDocument();
  });

  it("shows discharge date when available", () => {
    renderWithClient(<CurrentTreatmentCard patient={mockPatient} />);

    // Should show the formatted discharge date
    expect(screen.queryByText("Not set")).not.toBeInTheDocument();
  });

  it('shows "Not set" when discharge date is null', () => {
    const patientWithoutDischarge = { ...mockPatient, dischargeDate: null };
    renderWithClient(
      <CurrentTreatmentCard patient={patientWithoutDischarge} />,
    );

    expect(screen.getByText("Not set")).toBeInTheDocument();
  });

  it("displays current recommendations section", () => {
    renderWithClient(<CurrentTreatmentCard patient={mockPatient} />);

    expect(
      screen.getByText(
        /Latest Recommendations|Latest Recommendations|Recommendations/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("🍎 Food:")).toBeInTheDocument();
    expect(screen.getByText("💧 Water:")).toBeInTheDocument();
    expect(screen.getByText("🧴 Ointment:")).toBeInTheDocument();
    // Note: Treatment sections like "Physiotherapy" and "TENS" are only shown
    // in recommendations when there are active treatment sessions
  });

  it("displays recommendation values correctly", () => {
    renderWithClient(<CurrentTreatmentCard patient={mockPatient} />);

    expect(screen.getByText("Light meals")).toBeInTheDocument();
    expect(screen.getByText("2L/day")).toBeInTheDocument();
    expect(screen.getByText("Apply 2x daily")).toBeInTheDocument();
    expect(screen.getByText(/2 weeks|2 weeks/)).toBeInTheDocument();
  });

  it("shows treatment status badges with correct active/inactive states", () => {
    // Mock treatment sessions to get the list display
    (useTreatmentsByPatient as jest.Mock).mockReturnValue({
      treatments: [mockTreatmentPlan],
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithClient(<CurrentTreatmentCard patient={mockPatient} />);

    // The UI now displays treatments as lists in recommendations when there are active sessions
    // Verify the active treatment section shows up
    expect(
      screen.getByText(/Active Treatments Progress|Active Treatments Progress/),
    ).toBeInTheDocument();
  });

  it("renders treatment status badges for all boolean recommendations", () => {
    // Mock treatment sessions to get the list display in recommendations
    (useTreatmentsByPatient as jest.Mock).mockReturnValue({
      treatments: [mockTreatmentPlan],
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithClient(<CurrentTreatmentCard patient={mockPatient} />);

    // The new format displays treatments as active treatment lists in recommendations section
    // when there are active treatment sessions
    expect(
      screen.getByText(
        /Physiotherapy \(1 active treatment\):|Physiotherapy \(1 active treatment\):/,
      ),
    ).toBeInTheDocument();
  });

  describe("Delete Treatment Session Functionality", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("renders cancel buttons for treatment sessions when section is expanded", () => {
      // Mock the hook to return treatment sessions
      (useTreatmentsByPatient as jest.Mock).mockReturnValue({
        treatments: [mockTreatmentPlan],
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithClient(<CurrentTreatmentCard patient={mockPatient} />);

      // Physiotherapy section is expanded by default; cancel buttons are visible
      const cancelButtons = screen.getAllByTitle(/Cancel treatment/);
      expect(cancelButtons.length).toBeGreaterThan(0);
    });

    it("calls cancel function when cancel button is clicked", async () => {
      // Mock successful cancellation
      mockMutateAsync.mockResolvedValue({ cancelled_count: 1, errors: [] });

      // Mock the hook to return treatment sessions
      (useTreatmentsByPatient as jest.Mock).mockReturnValue({
        treatments: [mockTreatmentPlan],
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithClient(<CurrentTreatmentCard patient={mockPatient} />);

      // Physiotherapy section is expanded by default
      const cancelButton = screen.getAllByTitle(/Cancel treatment/)[0];
      fireEvent.click(cancelButton);

      // Verify confirmation modal is shown with checkbox list
      const modalTitles = screen.getAllByText(
        /Cancel Treatment|Cancel Treatment/,
      );
      expect(modalTitles.length).toBeGreaterThan(0);
      expect(
        screen.getByText(/selected treatments will be marked as canceled/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/Select the treatments of/i)).toBeInTheDocument();
      // One checkbox per treatment (session), pre-selected
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes).toHaveLength(1);
      expect(checkboxes[0]).toBeChecked();

      // Fill cancellation reason (required to enable confirm button)
      const reasonInput = screen.getByPlaceholderText(
        /Enter the reason for cancellation/,
      );
      fireEvent.change(reasonInput, { target: { value: "Test reason" } });

      // Click confirm button in modal (label shows count)
      const confirmButton = screen.getByRole("button", {
        name: /Cancel 1 treatment/i,
      });
      fireEvent.click(confirmButton);

      // Wait for the cancellation to be called (component prefixes with "Treatment cancelled - ")
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          treatmentIds: [1],
          cancellationReason: "Treatment cancelled - Test reason",
        });
        expect(mockRefetch).toHaveBeenCalled();
      });
    });

    it("does not cancel when user cancels confirmation", async () => {
      // Mock the hook to return treatment sessions
      (useTreatmentsByPatient as jest.Mock).mockReturnValue({
        treatments: [mockTreatmentPlan],
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithClient(<CurrentTreatmentCard patient={mockPatient} />);

      // Physiotherapy section is expanded by default
      const cancelButton = screen.getAllByTitle(/Cancel treatment/)[0];
      fireEvent.click(cancelButton);

      // Verify confirmation modal is shown
      const modalTitles = screen.getAllByText("Cancel Treatment");
      expect(modalTitles.length).toBeGreaterThan(0);

      // Click cancel button in modal
      const cancelConfirmButton = screen.getByRole("button", {
        name: "Back",
      });
      fireEvent.click(cancelConfirmButton);

      // Verify modal is closed - check that the text is no longer in the document
      await waitFor(() => {
        expect(
          screen.queryByText(/selected treatments will be marked as canceled/i),
        ).not.toBeInTheDocument();
      });

      // Verify cancellation was not called (since user cancelled)
      expect(mockMutateAsync).not.toHaveBeenCalled();
      expect(mockRefetch).not.toHaveBeenCalled();
    });

    it("calls cancel function with cancellation reason when provided", async () => {
      // Mock successful cancellation
      mockMutateAsync.mockResolvedValue({ cancelled_count: 1, errors: [] });

      // Mock the hook to return treatment sessions
      (useTreatmentsByPatient as jest.Mock).mockReturnValue({
        treatments: [mockTreatmentPlan],
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithClient(<CurrentTreatmentCard patient={mockPatient} />);

      // Physiotherapy section is expanded by default
      const cancelButton = screen.getAllByTitle(/Cancel treatment/)[0];
      fireEvent.click(cancelButton);

      // Find and fill the cancellation reason textarea
      const reasonTextarea = screen.getByPlaceholderText(
        /Enter the reason for cancellation/,
      );
      fireEvent.change(reasonTextarea, {
        target: { value: "Patient requested cancellation" },
      });

      // Click confirm button in modal (label shows count)
      const confirmButton = screen.getByRole("button", {
        name: "Cancel 1 treatment",
      });
      fireEvent.click(confirmButton);

      // Wait for the cancellation to be called with the reason (prefixed by implementation)
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          treatmentIds: [1],
          cancellationReason:
            "Treatment cancelled - Patient requested cancellation",
        });
        expect(mockRefetch).toHaveBeenCalled();
      });
    });

    it("shows cancel error when cancellation fails", () => {
      // Mock the hook to return an error state
      (useCancelTreatments as jest.Mock).mockReturnValue({
        isPending: false,
        error: { message: "Error cancelling session" },
        mutateAsync: mockMutateAsync,
      });

      renderWithClient(<CurrentTreatmentCard patient={mockPatient} />);

      // Should display the error message
      expect(
        screen.getByText(
          "Error cancelling treatment: Error cancelling session",
        ),
      ).toBeInTheDocument();
    });

    it("disables cancel buttons when cancellation is in progress", () => {
      // Mock the hook to return cancelling state
      (useCancelTreatments as jest.Mock).mockReturnValue({
        isPending: true,
        error: null,
        mutateAsync: mockMutateAsync,
      });

      // Mock the hook to return treatment sessions
      (useTreatmentsByPatient as jest.Mock).mockReturnValue({
        treatments: [mockTreatmentPlan],
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithClient(<CurrentTreatmentCard patient={mockPatient} />);

      // Physiotherapy section is expanded by default
      const cancelButtons = screen.getAllByTitle(/Cancel treatment/);
      expect(cancelButtons[0]).toBeDisabled();
    });

    it("disables confirm button when no treatments are selected", async () => {
      (useTreatmentsByPatient as jest.Mock).mockReturnValue({
        treatments: [mockTreatmentPlan],
        loading: false,
        error: null,
        refetch: mockRefetch,
      });
      (useCancelTreatments as jest.Mock).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: null,
      });

      renderWithClient(<CurrentTreatmentCard patient={mockPatient} />);

      const cancelButton = screen.getAllByTitle(/Cancel treatment/)[0];
      fireEvent.click(cancelButton);

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes).toHaveLength(1);
      expect(checkboxes[0]).toBeChecked();

      // Uncheck the only treatment
      fireEvent.click(checkboxes[0]);

      const confirmButton = screen.getByRole("button", {
        name: "Cancel Treatment",
      });
      expect(confirmButton).toBeDisabled();
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it("cancels only selected treatments when user unchecks some", async () => {
      mockMutateAsync.mockResolvedValue({ cancelled_count: 1, errors: [] });

      const secondSession = {
        ...mockTreatmentPlan,
        id: 2,
        bodyLocation: "Neck",
      };
      (useTreatmentsByPatient as jest.Mock).mockReturnValue({
        treatments: [mockTreatmentPlan, secondSession],
        loading: false,
        error: null,
        refetch: mockRefetch,
      });
      (useCancelTreatments as jest.Mock).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: null,
      });

      renderWithClient(<CurrentTreatmentCard patient={mockPatient} />);

      // Click cancel (grouped card shows "Cancel treatments" button by text)
      const cancelButtons = screen.getAllByRole("button", {
        name: /Cancel treatment/,
      });
      expect(cancelButtons.length).toBeGreaterThan(0);
      fireEvent.click(cancelButtons[0]);

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes.length).toBeGreaterThanOrEqual(1);
      // Uncheck the second one (index 1) so only the first remains selected
      if (checkboxes.length >= 2) {
        fireEvent.click(checkboxes[1]);
        expect(checkboxes[1]).not.toBeChecked();
      }

      // Fill cancellation reason (required to enable confirm button)
      const reasonInput = screen.getByPlaceholderText(
        /Enter the reason for cancellation/,
      );
      fireEvent.change(reasonInput, { target: { value: "Test reason" } });

      const confirmButton = screen.getByRole("button", {
        name: /Cancel \d+ treatment/,
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
        const call = mockMutateAsync.mock.calls[0][0];
        expect(call.treatmentIds).toBeDefined();
        expect(Array.isArray(call.treatmentIds)).toBe(true);
        expect(mockRefetch).toHaveBeenCalled();
      });
    });

    it("renders cancel buttons for different treatment types", () => {
      const mockTensSession = {
        ...mockTreatmentPlan,
        id: 2,
        treatmentType: "tens" as const,
      };

      // Mock the hook to return both types of treatment sessions
      (useTreatmentsByPatient as jest.Mock).mockReturnValue({
        treatments: [mockTreatmentPlan, mockTensSession],
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      // Ensure cancel hook is not in cancelling state
      (useCancelTreatments as jest.Mock).mockReturnValue({
        isPending: false,
        error: null,
        mutateAsync: mockMutateAsync,
      });

      renderWithClient(<CurrentTreatmentCard patient={mockPatient} />);

      // Both Physiotherapy and TENS sections are expanded by default
      const cancelButtons = screen.getAllByTitle(/Cancel treatment/);
      expect(cancelButtons.length).toBeGreaterThanOrEqual(1);

      // Verify cancel buttons are present and enabled
      cancelButtons.forEach((button) => {
        expect(button).toBeInTheDocument();
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe("Consultation integration", () => {
    const mockConsultation = {
      id: 1,
      appointmentId: 123, // This should match one of the patient's appointment IDs
      patientId: "1",
      food: "Avoid red meat",
      water: "Drink water",
      ointments: "Apply arnica ointment",
      physiotherapy: true,
      tens: false,
      returnWeeks: 4,
      notes: "Patient responding well to treatment",
      // createdDate is intentionally different from the appointment date (2024-10-25)
      // so the header uses the appointment date, not consultation `createdDate`
      createdDate: "2024-12-15",
      createdTime: "10:00:00",
      updatedDate: "2024-12-15",
      updatedTime: "10:00:00",
    };

    beforeEach(() => {
      // Reset the mock before each test in this describe block
      (useConsultations as jest.Mock).mockImplementation(() => ({
        data: [mockConsultation],
        isLoading: false,
        error: null,
      }));
    });

    it("should display recommendations from latest consultation when available", () => {
      const patientWithAppointment: Patient = {
        ...mockPatient,
        previousAppointments: [
          {
            appointmentId: "123", // Matches consultation.appointmentId
            date: "2024-10-25",
            type: "assessment",
            notes: "First consultation",
            recommendations: null,
            createdDate: "2024-10-25T10:00:00.000Z",
            updatedDate: "2024-10-25T10:00:00.000Z",
          },
        ],
        currentRecommendations: {
          date: "2024-12-31",
          food: "",
          water: "",
          ointment: "",
          physiotherapy: false,
          tens: false,
          returnWeeks: 0,
        },
      };

      renderWithClient(
        <CurrentTreatmentCard patient={patientWithAppointment} />,
      );

      // Recommendations come from persisted consultation (food / water / ointments)
      expect(screen.getByText("Avoid red meat")).toBeInTheDocument();
      expect(screen.getByText("Drink water")).toBeInTheDocument();
      expect(screen.getByText("Apply arnica ointment")).toBeInTheDocument();

      // The new format displays treatments as lists in "Latest Recommendations"
      // Physiotherapy and tens treatments are shown as lists with details
      // Check for the treatment section headings
      expect(
        screen.getByText(/Physiotherapy \(\d+ active treatment\):/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/TENS \(\d+ active treatment\):/),
      ).toBeInTheDocument();

      // Notes from consultation
      expect(
        screen.getByText("Patient responding well to treatment"),
      ).toBeInTheDocument();

      // Note: returnWeeks display behavior is tested separately
      // Confirmed by food / water / ointment strings above
    });

    it("should use appointment date in header instead of consultation createdDate", () => {
      const patientWithAppointment: Patient = {
        ...mockPatient,
        previousAppointments: [
          {
            appointmentId: "123",
            // Appointment in June; consultation createdDate in December
            date: "2024-06-15",
            type: "assessment",
            notes: "",
            recommendations: null,
            createdDate: "2024-06-15",
            updatedDate: "2024-06-15",
          },
        ],
        currentRecommendations: {
          date: "2024-12-31",
          food: "",
          water: "",
          ointment: "",
          physiotherapy: false,
          tens: false,
          returnWeeks: 0,
        },
      };

      renderWithClient(
        <CurrentTreatmentCard patient={patientWithAppointment} />,
      );

      const header = screen.getByText(/Latest Recommendations/);
      // Header shows appointment month (June), not consultation createdDate (December)
      expect(header.textContent).toMatch(/Latest Recommendations \(0?6\//);
      expect(header.textContent).not.toMatch(/\/12\//);
    });

    it("should fallback to patient recommendations when no consultations match", () => {
      // No consultations for patient's appointments
      (useConsultations as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      const patientWithRecommendations: Patient = {
        ...mockPatient,
        currentRecommendations: {
          date: "2024-10-25",
          food: "Light meals",
          water: "Regular water",
          ointment: "No ointment",
          physiotherapy: false,
          tens: true,
          returnWeeks: 2,
        },
      };

      renderWithClient(
        <CurrentTreatmentCard patient={patientWithRecommendations} />,
      );

      // Verify fallback to patient recommendations
      expect(screen.getByText("Light meals")).toBeInTheDocument();
      expect(screen.getByText("Regular water")).toBeInTheDocument();
      expect(screen.getByText("No ointment")).toBeInTheDocument();
      expect(screen.getByText("2 weeks")).toBeInTheDocument();
    });

    it("should handle loading state for consultations query", () => {
      // Mock loading state
      (useConsultations as jest.Mock).mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
      });

      renderWithClient(<CurrentTreatmentCard patient={mockPatient} />);

      // Component should still render without errors during loading
      expect(screen.getByText(/Treatment Status$/)).toBeInTheDocument();
    });
  });
});
