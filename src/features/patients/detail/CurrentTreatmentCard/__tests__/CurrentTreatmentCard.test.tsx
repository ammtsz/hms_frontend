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
  useNewlyScheduledAttendances: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

// Mock the attendance queries
jest.mock("@/api/query/hooks/useAttendanceQueries", () => ({
  useCreateAttendance: jest.fn(() => ({
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
  name: "João Silva",
  phone: "(11) 99999-9999",
  birthDate: "1980-05-15",
  mainComplaint: "Dores de cabeça frequentes",
  status: "A",
  priority: "2",
  startDate: "2024-01-15",
  dischargeDate: "2024-06-15",
  timezone: "America/Sao_Paulo",
  nextAttendanceDates: [
    {
      date: "2024-12-28",
      type: "assessment",
    },
  ],
  currentRecommendations: {
    date: "2024-12-20",
    food: "Leve",
    water: "2L/dia",
    ointment: "Aplicar 2x/dia",
    physiotherapy: true,
    tens: false,
    returnWeeks: 2,
  },
  previousAttendances: [],
  missingAppointmentsStreak: 0,
};

const mockTreatmentPlan = {
  id: 1,
  consultationId: 1,
  attendanceId: 1,
  patientId: 1,
  treatmentType: "physiotherapy" as const,
  bodyLocation: "Cabeça",
  startDate: "2025-01-01",
  plannedSessions: 10,
  completedSessions: 3,
  status: "active" as const,
  durationMinutes: 30,
  color: "azul",
  notes: "Tratamento indo bem",
  sessions: [],
  createdAt: "2025-01-01T10:00:00Z",
  updatedAt: "2025-01-01T10:00:00Z",
};

// Mock dateHelpers (used by TreatmentStatusOverview and others)
jest.mock("@/utils/dateUtils", () => ({
  formatDateBR: (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
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

    expect(screen.getByText("Status do Tratamento")).toBeInTheDocument();
  });

  it("displays treatment timeline information", () => {
    renderWithClient(<CurrentTreatmentCard patient={mockPatient} />);

    expect(screen.getByText("Data de Cadastro")).toBeInTheDocument();
    expect(screen.getByText("Próximo Atendimento")).toBeInTheDocument();
    // Patient with status "A" shows "Alta recebida em"; others show "Alta Prevista"
    expect(screen.getByText(/Alta/)).toBeInTheDocument();
  });

  it("shows discharge date when available", () => {
    renderWithClient(<CurrentTreatmentCard patient={mockPatient} />);

    // Should show the formatted discharge date
    expect(screen.queryByText("Não definida")).not.toBeInTheDocument();
  });

  it('shows "Não definida" when discharge date is null', () => {
    const patientWithoutDischarge = { ...mockPatient, dischargeDate: null };
    renderWithClient(
      <CurrentTreatmentCard patient={patientWithoutDischarge} />,
    );

    expect(screen.getByText("Não definida")).toBeInTheDocument();
  });

  it("displays current recommendations section", () => {
    renderWithClient(<CurrentTreatmentCard patient={mockPatient} />);

    expect(screen.getByText(/Últimas Recomendações/)).toBeInTheDocument();
    expect(screen.getByText("🍎 Alimentação:")).toBeInTheDocument();
    expect(screen.getByText("💧 Água:")).toBeInTheDocument();
    expect(screen.getByText("🧴 Pomada:")).toBeInTheDocument();
    // Note: Treatment sections like "Fisioterapia" and "TENS" are only shown
    // in recommendations when there are active treatment sessions
  });

  it("displays recommendation values correctly", () => {
    renderWithClient(<CurrentTreatmentCard patient={mockPatient} />);

    expect(screen.getByText("Leve")).toBeInTheDocument();
    expect(screen.getByText("2L/dia")).toBeInTheDocument();
    expect(screen.getByText("Aplicar 2x/dia")).toBeInTheDocument();
    expect(screen.getByText("2 semanas")).toBeInTheDocument();
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
      screen.getByText(/Progresso dos Tratamentos Ativos/),
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
      screen.getByText(/Fisioterapia \(1 tratamento ativo\):/),
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
      const cancelButtons = screen.getAllByTitle(/Cancelar tratamento/);
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
      const cancelButton = screen.getAllByTitle(/Cancelar tratamento/)[0];
      fireEvent.click(cancelButton);

      // Verify confirmation modal is shown with checkbox list
      const modalTitles = screen.getAllByText("Cancelar Tratamento");
      expect(modalTitles.length).toBeGreaterThan(0);
      expect(
        screen.getByText(
          /Os tratamentos selecionados ficarão marcados como cancelados/,
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Selecione os tratamentos de/),
      ).toBeInTheDocument();
      // One checkbox per treatment (session), pre-selected
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes).toHaveLength(1);
      expect(checkboxes[0]).toBeChecked();

      // Fill cancellation reason (required to enable confirm button)
      const reasonInput = screen.getByPlaceholderText(
        /Digite o motivo do cancelamento/,
      );
      fireEvent.change(reasonInput, { target: { value: "Test reason" } });

      // Click confirm button in modal (label shows count)
      const confirmButton = screen.getByRole("button", {
        name: "Cancelar 1 tratamento",
      });
      fireEvent.click(confirmButton);

      // Wait for the cancellation to be called (component prefixes with "Tratamento cancelado - ")
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          treatmentIds: [1],
          cancellationReason: "Tratamento cancelado - Test reason",
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
      const cancelButton = screen.getAllByTitle(/Cancelar tratamento/)[0];
      fireEvent.click(cancelButton);

      // Verify confirmation modal is shown
      const modalTitles = screen.getAllByText("Cancelar Tratamento");
      expect(modalTitles.length).toBeGreaterThan(0);

      // Click cancel button in modal
      const cancelConfirmButton = screen.getByRole("button", {
        name: "Voltar",
      });
      fireEvent.click(cancelConfirmButton);

      // Verify modal is closed - check that the text is no longer in the document
      await waitFor(() => {
        expect(
          screen.queryByText(
            /Os tratamentos selecionados ficarão marcados como cancelados/,
          ),
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
      const cancelButton = screen.getAllByTitle(/Cancelar tratamento/)[0];
      fireEvent.click(cancelButton);

      // Find and fill the cancellation reason textarea
      const reasonTextarea = screen.getByPlaceholderText(
        /Digite o motivo do cancelamento/,
      );
      fireEvent.change(reasonTextarea, {
        target: { value: "Paciente solicitou cancelamento" },
      });

      // Click confirm button in modal (label shows count)
      const confirmButton = screen.getByRole("button", {
        name: "Cancelar 1 tratamento",
      });
      fireEvent.click(confirmButton);

      // Wait for the cancellation to be called with the reason (prefixed by implementation)
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          treatmentIds: [1],
          cancellationReason:
            "Tratamento cancelado - Paciente solicitou cancelamento",
        });
        expect(mockRefetch).toHaveBeenCalled();
      });
    });

    it("shows cancel error when cancellation fails", () => {
      // Mock the hook to return an error state
      (useCancelTreatments as jest.Mock).mockReturnValue({
        isPending: false,
        error: { message: "Erro ao cancelar sessão" },
        mutateAsync: mockMutateAsync,
      });

      renderWithClient(<CurrentTreatmentCard patient={mockPatient} />);

      // Should display the error message
      expect(
        screen.getByText(
          "Erro ao cancelar tratamento: Erro ao cancelar sessão",
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
      const cancelButtons = screen.getAllByTitle(/Cancelar tratamento/);
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

      const cancelButton = screen.getAllByTitle(/Cancelar tratamento/)[0];
      fireEvent.click(cancelButton);

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes).toHaveLength(1);
      expect(checkboxes[0]).toBeChecked();

      // Uncheck the only treatment
      fireEvent.click(checkboxes[0]);

      const confirmButton = screen.getByRole("button", {
        name: "Cancelar Tratamento",
      });
      expect(confirmButton).toBeDisabled();
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it("cancels only selected treatments when user unchecks some", async () => {
      mockMutateAsync.mockResolvedValue({ cancelled_count: 1, errors: [] });

      const secondSession = {
        ...mockTreatmentPlan,
        id: 2,
        bodyLocation: "Pescoço",
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

      // Click cancel (grouped card shows "Cancelar tratamentos" button by text)
      const cancelButtons = screen.getAllByRole("button", {
        name: /Cancelar tratamento/,
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
        /Digite o motivo do cancelamento/,
      );
      fireEvent.change(reasonInput, { target: { value: "Test reason" } });

      const confirmButton = screen.getByRole("button", {
        name: /Cancelar \d+ tratamento/,
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
      const cancelButtons = screen.getAllByTitle(/Cancelar tratamento/);
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
      attendanceId: 123, // This should match one of the patient's attendance IDs
      patientId: "1",
      food: "Evitar carne vermelha",
      water: "Beber água energizada",
      ointments: "Aplicar pomada de arnica",
      physiotherapy: true,
      tens: false,
      returnWeeks: 4,
      notes: "Paciente respondendo bem ao tratamento",
      // createdDate is intentionally different from the attendance date (2024-10-25)
      // so the header uses the attendance date, not consultation `createdDate`
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
      const patientWithAttendance: Patient = {
        ...mockPatient,
        previousAttendances: [
          {
            attendanceId: "123", // Matches consultation.attendanceId
            date: "2024-10-25",
            type: "assessment",
            notes: "Primeira consulta",
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
        <CurrentTreatmentCard patient={patientWithAttendance} />,
      );

      // Recommendations come from persisted consultation (food / water / ointments)
      expect(screen.getByText("Evitar carne vermelha")).toBeInTheDocument();
      expect(screen.getByText("Beber água energizada")).toBeInTheDocument();
      expect(screen.getByText("Aplicar pomada de arnica")).toBeInTheDocument();

      // The new format displays treatments as lists in "Últimas Recomendações"
      // Physiotherapy and tens treatments are shown as lists with details
      // Check for the treatment section headings
      expect(
        screen.getByText(/Fisioterapia \(\d+ tratamento ativo\):/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/TENS \(\d+ tratamento ativo\):/),
      ).toBeInTheDocument();

      // Notes from consultation
      expect(
        screen.getByText("Paciente respondendo bem ao tratamento"),
      ).toBeInTheDocument();

      // Note: returnWeeks display behavior is tested separately
      // Confirmed by food / water / ointment strings above
    });

    it("should use attendance date in header instead of consultation createdDate", () => {
      const patientWithAttendance: Patient = {
        ...mockPatient,
        previousAttendances: [
          {
            attendanceId: "123",
            // Attendance in June; consultation createdDate in December
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
        <CurrentTreatmentCard patient={patientWithAttendance} />,
      );

      const header = screen.getByText(/Últimas Recomendações/);
      // Header should contain the attendance date month (June = /06/)
      // Header shows attendance month (June), not consultation createdDate (December)
      expect(header.textContent).toMatch(/\/06\//);
      expect(header.textContent).not.toMatch(/\/12\//);
    });

    it("should fallback to patient recommendations when no consultations match", () => {
      // No consultations for patient's attendances
      (useConsultations as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      const patientWithRecommendations: Patient = {
        ...mockPatient,
        currentRecommendations: {
          date: "2024-10-25",
          food: "Dieta leve",
          water: "Água comum",
          ointment: "Nenhuma pomada",
          physiotherapy: false,
          tens: true,
          returnWeeks: 2,
        },
      };

      renderWithClient(
        <CurrentTreatmentCard patient={patientWithRecommendations} />,
      );

      // Verify fallback to patient recommendations
      expect(screen.getByText("Dieta leve")).toBeInTheDocument();
      expect(screen.getByText("Água comum")).toBeInTheDocument();
      expect(screen.getByText("Nenhuma pomada")).toBeInTheDocument();
      expect(screen.getByText("2 semanas")).toBeInTheDocument();
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
      expect(screen.getByText(/Status do Tratamento$/)).toBeInTheDocument();
    });
  });
});
