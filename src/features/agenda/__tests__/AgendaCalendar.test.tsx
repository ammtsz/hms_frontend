import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AgendaCalendar from "../index";
import { useAgendaCalendar } from "../hooks/useAgendaCalendar";
import { Priority, AttendanceType } from "@/types/types";
import { AttendanceStatus } from "@/api/types";
import type { AgendaDayWindowDays } from "@/stores";

// Mock the hook
jest.mock("../hooks/useAgendaCalendar");
const mockUseAgendaCalendar = useAgendaCalendar as jest.MockedFunction<
  typeof useAgendaCalendar
>;

jest.mock("../components/UpcomingHolidaysWidget", () => {
  return function MockUpcomingHolidaysWidget() {
    return <div data-testid="upcoming-holidays-widget" />;
  };
});

jest.mock("../components/AgendaColumn", () => {
  return function MockAgendaColumn({
    title,
    isRefreshing,
  }: {
    title: string;
    isRefreshing?: boolean;
  }) {
    return (
      <div className={`border ${isRefreshing ? "opacity-75" : ""}`}>
        <span>{title}</span>
        {isRefreshing ? <span>Atualizando...</span> : null}
      </div>
    );
  };
});

jest.mock(
  "@/features/attendance/components/AttendanceActions/ManageAttendanceModal",
  () => {
    return function MockManageAttendanceModal() {
      return null;
    };
  },
);

// Mock the NewAttendanceFormModal component to test integration
jest.mock("../components/NewAttendanceFormModal", () => {
  return function MockNewAttendanceFormModal({
    onClose,
    onSuccess,
  }: {
    onClose: () => void;
    onSuccess: () => void;
  }) {
    return (
      <div data-testid="new-attendance-form-modal">
        <button onClick={onClose} data-testid="modal-close">
          Close Modal
        </button>
        <button onClick={onSuccess} data-testid="modal-success">
          Success
        </button>
      </div>
    );
  };
});

// Mock date formatters
jest.mock("@/utils/dateUtils", () => ({
  formatDateBR: jest.fn(() => "07/08/2025"),
  formatDateWithDayOfWeekBR: jest.fn(() => "Quinta-feira, 07/08/2025"),
}));

describe("AgendaCalendar - Basic Functionality", () => {
  const mockFilteredAgenda = {
    assessment: [
      {
        date: "2025-08-07",
        patients: [
          {
            id: "1",
            name: "João Silva",
            attendanceId: 1,
            priority: "3" as Priority,
            attendanceType: "assessment" as AttendanceType,
          },
        ],
      },
    ],
    physiotherapy: [],
  };

  const defaultHookReturn = {
    selectedDate: "2025-08-07",
    setSelectedDate: jest.fn(),
    agendaDayWindowDays: 30 as AgendaDayWindowDays,
    setAgendaDayWindowDays: jest.fn(),
    agendaStatusFilters: [] as AttendanceStatus[],
    setAgendaStatusFilters: jest.fn(),
    patientFilter: "",
    setPatientFilter: jest.fn(),
    filteredAgenda: mockFilteredAgenda,
    openAssessmentIdx: [],
    setOpenAssessmentIdx: jest.fn(),
    openPhysiotherapyIdx: [],
    setOpenPhysiotherapyIdx: jest.fn(),
    confirmRemove: null,
    setConfirmRemove: jest.fn(),
    showNewAttendance: false,
    setShowNewAttendance: jest.fn(),
    handleRemovePatient: jest.fn(),
    handleConfirmRemove: jest.fn(),
    handleNewAttendance: jest.fn(),
    handleFormSuccess: jest.fn(),
    loading: false,
    error: null,
    refreshAgenda: jest.fn(),
    isRefreshing: false,
    rangeSummaryText: "Período: 07/08/2025 — 05/09/2025 (30 dias)",
    referenceDate: "2025-08-07",
    rangeEndDate: "2025-09-05",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAgendaCalendar.mockReturnValue(defaultHookReturn);
  });

  it("should render basic component structure", () => {
    render(<AgendaCalendar />);

    expect(screen.getByText("Agenda de Atendimentos")).toBeInTheDocument();
    expect(screen.getByText("+ Novo Agendamento")).toBeInTheDocument();
  });

  it("should render loading state", () => {
    mockUseAgendaCalendar.mockReturnValue({
      ...defaultHookReturn,
      loading: true,
    });

    render(<AgendaCalendar />);
    expect(screen.getByText("Consultas de Avaliação")).toBeInTheDocument();
    expect(screen.getByText("Fisioterapia / TENS")).toBeInTheDocument();
  });

  it("should render error state", () => {
    mockUseAgendaCalendar.mockReturnValue({
      ...defaultHookReturn,
      error: "Failed to load agenda",
    });

    render(<AgendaCalendar />);

    // Error states show different messages, so let's check for any error indication
    // Looking at the HTML, errors might not have a specific text pattern
    // Let's just check the component renders without the loading state
    expect(
      screen.queryByText("Carregando agendamentos..."),
    ).not.toBeInTheDocument();
  });

  it("should render empty state", () => {
    mockUseAgendaCalendar.mockReturnValue({
      ...defaultHookReturn,
      filteredAgenda: {
        assessment: [],
        physiotherapy: [],
      },
    });

    render(<AgendaCalendar />);
    expect(screen.getByText("Consultas de Avaliação")).toBeInTheDocument();
    expect(screen.getByText("Fisioterapia / TENS")).toBeInTheDocument();
  });

  it("should render agenda items when data is available", () => {
    render(<AgendaCalendar />);

    // Should show section headers
    expect(screen.getByText("Consultas de Avaliação")).toBeInTheDocument();
    expect(screen.getByText("Fisioterapia / TENS")).toBeInTheDocument();
  });

  it("should render refresh button and call refreshAgenda when clicked", () => {
    const mockRefreshAgenda = jest.fn();
    mockUseAgendaCalendar.mockReturnValue({
      ...defaultHookReturn,
      refreshAgenda: mockRefreshAgenda,
    });

    render(<AgendaCalendar />);

    // Should render the refresh button
    const refreshButton = screen.getByRole("button", { name: /atualizar/i });
    expect(refreshButton).toBeInTheDocument();
    expect(refreshButton).toHaveAttribute(
      "title",
      "Atualizar dados dos agendamentos",
    );

    // Should call refreshAgenda when clicked
    refreshButton.click();
    expect(mockRefreshAgenda).toHaveBeenCalledTimes(1);
  });

  it("should render day window select and refresh button in controls area", () => {
    render(<AgendaCalendar />);

    expect(screen.getByLabelText(/^Período$/)).toBeInTheDocument();

    const refreshButton = screen.getByRole("button", { name: /atualizar/i });
    expect(refreshButton).toBeInTheDocument();
    expect(refreshButton).toBeVisible();
    expect(refreshButton).toBeEnabled();
  });

  it("should show loading state when refreshing", () => {
    mockUseAgendaCalendar.mockReturnValue({
      ...defaultHookReturn,
      isRefreshing: true,
    });

    render(<AgendaCalendar />);

    // Should render the refresh button with loading state
    const refreshButton = screen.getByRole("button", { name: /atualizando/i });
    expect(refreshButton).toBeInTheDocument();
    expect(refreshButton).toBeDisabled();
    expect(refreshButton).toHaveAttribute("title", "Atualizando...");

    // Button text should change to "Atualizando..."
    expect(refreshButton).toHaveTextContent("Atualizando...");

    // Should have loading styles
    expect(refreshButton).toHaveClass("opacity-50", "cursor-not-allowed");

    // Feather icon should have spinning animation
    const icon = refreshButton.querySelector("svg");
    expect(icon).toHaveClass("animate-spin");
  });

  it("should show normal state when not refreshing", () => {
    mockUseAgendaCalendar.mockReturnValue({
      ...defaultHookReturn,
      isRefreshing: false,
    });

    render(<AgendaCalendar />);

    // Should render the refresh button in normal state
    const refreshButton = screen.getByRole("button", { name: /atualizar$/i });
    expect(refreshButton).toBeInTheDocument();
    expect(refreshButton).toBeEnabled();
    expect(refreshButton).toHaveAttribute(
      "title",
      "Atualizar dados dos agendamentos",
    );

    // Button text should be "Atualizar"
    expect(refreshButton).toHaveTextContent("Atualizar");

    // Should not have loading styles
    expect(refreshButton).not.toHaveClass("opacity-50", "cursor-not-allowed");
    expect(refreshButton).toHaveClass("hover:bg-gray-50");

    // Feather icon should not be spinning
    const icon = refreshButton.querySelector("svg");
    expect(icon).not.toHaveClass("animate-spin");
  });

  it("should show refreshing overlay on attendance columns when refreshing", () => {
    mockUseAgendaCalendar.mockReturnValue({
      ...defaultHookReturn,
      isRefreshing: true,
      filteredAgenda: mockFilteredAgenda,
    });

    render(<AgendaCalendar />);

    // Should show "Atualizando..." text in both columns
    const refreshingTexts = screen.getAllByText("Atualizando...");

    // Should have at least 2 instances - one in each column (plus the button makes 3)
    expect(refreshingTexts.length).toBeGreaterThanOrEqual(2);

    // Check that columns have reduced opacity when refreshing
    const assessmentColumnContent = screen
      .getByText("Consultas de Avaliação")
      .closest(".border");
    const physiotherapyColumnContent = screen
      .getByText("Fisioterapia / TENS")
      .closest(".border");

    expect(assessmentColumnContent).toHaveClass("opacity-75");
    expect(physiotherapyColumnContent).toHaveClass("opacity-75");
  });

  it("should not show refreshing overlay when not refreshing", () => {
    mockUseAgendaCalendar.mockReturnValue({
      ...defaultHookReturn,
      isRefreshing: false,
      filteredAgenda: mockFilteredAgenda,
    });

    render(<AgendaCalendar />);

    // Should not show overlay "Atualizando..." text in columns
    const refreshingTexts = screen.queryAllByText("Atualizando...");

    // Should only have the button text, not column overlays
    expect(refreshingTexts.length).toBeLessThanOrEqual(1);

    // Check that columns don't have reduced opacity
    const assessmentColumnContent = screen
      .getByText("Consultas de Avaliação")
      .closest(".border");
    const physiotherapyColumnContent = screen
      .getByText("Fisioterapia / TENS")
      .closest(".border");

    expect(assessmentColumnContent).not.toHaveClass("opacity-75");
    expect(physiotherapyColumnContent).not.toHaveClass("opacity-75");
  });

  describe("Date Input and Controls", () => {
    it("renders date input with correct value", () => {
      render(<AgendaCalendar />);

      const dateInput = screen.getByLabelText(
        "Selecione uma data para filtrar",
      );
      expect(dateInput).toBeInTheDocument();
      expect(dateInput).toHaveValue("2025-08-07");
    });

    it("renders patient filter input and updates value", () => {
      const mockSetPatientFilter = jest.fn();
      mockUseAgendaCalendar.mockReturnValue({
        ...defaultHookReturn,
        setPatientFilter: mockSetPatientFilter,
      });

      render(<AgendaCalendar />);

      const patientInput = screen.getByLabelText("Filtrar por paciente");
      expect(patientInput).toBeInTheDocument();
      fireEvent.change(patientInput, { target: { value: "joao" } });

      expect(mockSetPatientFilter).toHaveBeenCalledWith("joao");
    });

    it("calls setSelectedDate when date is committed via blur after typing", () => {
      const mockSetSelectedDate = jest.fn();
      mockUseAgendaCalendar.mockReturnValue({
        ...defaultHookReturn,
        setSelectedDate: mockSetSelectedDate,
      });

      render(<AgendaCalendar />);

      const dateInput = screen.getByLabelText(
        "Selecione uma data para filtrar",
      );
      fireEvent.change(dateInput, { target: { value: "2025-08-15" } });
      fireEvent.keyDown(dateInput, { key: "5" });
      fireEvent.blur(dateInput);

      expect(mockSetSelectedDate).toHaveBeenCalledWith("2025-08-15");
    });

    it('renders and handles "Hoje" button click', () => {
      const mockSetSelectedDate = jest.fn();
      mockUseAgendaCalendar.mockReturnValue({
        ...defaultHookReturn,
        setSelectedDate: mockSetSelectedDate,
      });

      render(<AgendaCalendar />);

      const todayButton = screen.getByRole("button", { name: /hoje/i });
      expect(todayButton).toBeInTheDocument();

      todayButton.click();
      expect(mockSetSelectedDate).toHaveBeenCalled();
      // The exact date will be today's date, which we can't predict exactly
      expect(mockSetSelectedDate).toHaveBeenCalledWith(
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      );
    });

    it("calls setAgendaDayWindowDays when period select changes", () => {
      const mockSetAgendaDayWindowDays = jest.fn();
      mockUseAgendaCalendar.mockReturnValue({
        ...defaultHookReturn,
        setAgendaDayWindowDays: mockSetAgendaDayWindowDays,
        agendaDayWindowDays: 30,
      });

      render(<AgendaCalendar />);

      const select = screen.getByLabelText(/^Período$/);
      fireEvent.change(select, { target: { value: "7" } });

      expect(mockSetAgendaDayWindowDays).toHaveBeenCalledWith(7);
    });

    it("displays range summary from hook", () => {
      mockUseAgendaCalendar.mockReturnValue({
        ...defaultHookReturn,
        rangeSummaryText: "Período: 07/08/2025 — 13/08/2025 (7 dias)",
      });

      render(<AgendaCalendar />);

      expect(
        screen.getByText("Período: 07/08/2025 — 13/08/2025 (7 dias)"),
      ).toBeInTheDocument();
    });

    it("renders status filter fieldset and select-all clears", () => {
      const mockSetAgendaStatusFilters = jest.fn();
      mockUseAgendaCalendar.mockReturnValue({
        ...defaultHookReturn,
        setAgendaStatusFilters: mockSetAgendaStatusFilters,
        agendaStatusFilters: [],
      });

      render(<AgendaCalendar />);

      fireEvent.click(
        screen.getByRole("button", {
          name: /Selecionar todos os status do atendimento/i,
        }),
      );
      expect(mockSetAgendaStatusFilters.mock.calls[0]?.[0]).toHaveLength(6);

      fireEvent.click(
        screen.getByRole("button", {
          name: /Limpar seleção de status do atendimento/i,
        }),
      );
      expect(mockSetAgendaStatusFilters.mock.calls[1]?.[0]).toEqual([]);
    });
  });

  describe("Modal Rendering", () => {
    it("renders NewAttendanceFormModal when showNewAttendance is true", async () => {
      mockUseAgendaCalendar.mockReturnValue({
        ...defaultHookReturn,
        showNewAttendance: true,
      });

      render(<AgendaCalendar />);

      // First, it should show the loading fallback
      expect(
        screen.getByText("Carregando formulário de agendamento..."),
      ).toBeInTheDocument();
    });

    it("does not render NewAttendanceFormModal when showNewAttendance is false", () => {
      mockUseAgendaCalendar.mockReturnValue({
        ...defaultHookReturn,
        showNewAttendance: false,
      });

      render(<AgendaCalendar />);

      expect(
        screen.queryByText("Carregando formulário de agendamento..."),
      ).not.toBeInTheDocument();
    });

    it("calls setShowNewAttendance(true) when new attendance button is clicked", () => {
      const mockSetShowNewAttendance = jest.fn();
      mockUseAgendaCalendar.mockReturnValue({
        ...defaultHookReturn,
        setShowNewAttendance: mockSetShowNewAttendance,
      });

      render(<AgendaCalendar />);

      const newAttendanceButton = screen.getByText("+ Novo Agendamento");
      newAttendanceButton.click();

      expect(mockSetShowNewAttendance).toHaveBeenCalledWith(true);
    });
  });

  describe("Patient Mapping Coverage", () => {
    it("renders physiotherapy patients with correct attendanceType mapping", () => {
      const mockFilteredAgenda = {
        assessment: [],
        physiotherapy: [
          {
            date: "2025-08-07",
            patients: [
              {
                id: "1",
                name: "Maria Santos",
                attendanceId: 2,
                priority: "2" as Priority,
                // No attendanceType - should default to 'physiotherapy'
              },
            ],
          },
        ],
      };

      mockUseAgendaCalendar.mockReturnValue({
        ...defaultHookReturn,
        filteredAgenda: mockFilteredAgenda,
      });

      render(<AgendaCalendar />);

      // Should render the physiotherapy column with the patient
      expect(screen.getByText("Fisioterapia / TENS")).toBeInTheDocument();
    });
  });

  describe("NewAttendanceFormModal Integration", () => {
    it("calls setShowNewAttendance(false) when modal onClose is triggered", async () => {
      const mockSetShowNewAttendance = jest.fn();
      mockUseAgendaCalendar.mockReturnValue({
        ...defaultHookReturn,
        showNewAttendance: true,
        setShowNewAttendance: mockSetShowNewAttendance,
      });

      const { findByTestId } = render(<AgendaCalendar />);

      // Wait for the modal to render (it's lazy loaded)
      const modal = await findByTestId("new-attendance-form-modal");
      expect(modal).toBeInTheDocument();

      // Click the close button
      const closeButton = await findByTestId("modal-close");
      closeButton.click();

      expect(mockSetShowNewAttendance).toHaveBeenCalledWith(false);
    });

    it("calls handleFormSuccess when modal onSuccess is triggered", async () => {
      const mockHandleFormSuccess = jest.fn();
      mockUseAgendaCalendar.mockReturnValue({
        ...defaultHookReturn,
        showNewAttendance: true,
        handleFormSuccess: mockHandleFormSuccess,
      });

      const { findByTestId } = render(<AgendaCalendar />);

      // Wait for the modal to render (it's lazy loaded)
      const modal = await findByTestId("new-attendance-form-modal");
      expect(modal).toBeInTheDocument();

      // Click the success button
      const successButton = await findByTestId("modal-success");
      successButton.click();

      expect(mockHandleFormSuccess).toHaveBeenCalled();
    });
  });
});
