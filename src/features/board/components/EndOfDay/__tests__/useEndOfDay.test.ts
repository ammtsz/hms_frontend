/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useEndOfDay } from "../hooks/useEndOfDay";
import { useBoardData } from "@/features/board/hooks/useBoardData";
import { useProcessEndOfDay } from "@/api/query/hooks/useDayFinalizationQueries";
import { useCloseModal } from "@/stores/modalStore";
import * as appointmentDataUtils from "../../../utils/appointmentDataUtils";
import type { AppointmentType } from "@/types/types";

// Mock dependencies
jest.mock("@/features/board/hooks/useBoardData");
jest.mock("@/api/query/hooks/useDayFinalizationQueries");
jest.mock("@/stores/modalStore");
jest.mock("../../../utils/appointmentDataUtils", () => ({
  getIncompleteAppointments: jest.fn(() => []),
  getCompletedAppointments: jest.fn(() => []),
  getScheduledAbsences: jest.fn(() => []),
}));

const mockUseAppointmentData = useBoardData as jest.MockedFunction<typeof useBoardData>;
const mockUseProcessEndOfDay = useProcessEndOfDay as jest.MockedFunction<typeof useProcessEndOfDay>;
const mockUseCloseModal = useCloseModal as jest.MockedFunction<typeof useCloseModal>;

describe("useEndOfDay", () => {
  const mockRefreshData = jest.fn();
  const mockProcessEndOfDayMutateAsync = jest.fn();
  const mockCloseModal = jest.fn();
  const selectedDate = "2026-01-15";

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAppointmentData.mockReturnValue({
      appointmentsByDate: null,
      refreshData: mockRefreshData,
      isLoading: false,
      error: null,
      getIncompleteAppointments: jest.fn(),
      getCompletedAppointments: jest.fn(),
      getScheduledAbsences: jest.fn(),
    } as Partial<ReturnType<typeof useBoardData>> as ReturnType<typeof useBoardData>);

    mockUseProcessEndOfDay.mockReturnValue({
      mutateAsync: mockProcessEndOfDayMutateAsync,
      isPending: false,
      isError: false,
      error: null,
    } as Partial<ReturnType<typeof useProcessEndOfDay>> as ReturnType<typeof useProcessEndOfDay>);

    mockUseCloseModal.mockReturnValue(mockCloseModal);
  });

  it("should use appointmentId instead of patientId when submitting absences", async () => {
    const getScheduledAbsencesSpy = jest.spyOn(appointmentDataUtils, 'getScheduledAbsences');

    // Mock scheduled absences with both patientId and appointmentId
    const mockScheduledAbsences = [
      {
        name: "John Doe",
        patientId: 14, // This is the patient ID
        appointmentId: 33, // This is the appointment ID (should be used in API)
        appointmentType: "assessment" as AppointmentType,
        priority: "1" as const,
      },
      {
        name: "Jane Smith",
        patientId: 6,
        appointmentId: 32,
        appointmentType: "physiotherapy" as AppointmentType,
        priority: "2" as const,
      },
    ];

    getScheduledAbsencesSpy.mockReturnValue(mockScheduledAbsences);

    const { result } = renderHook(() =>
      useEndOfDay({
        selectedDate,
      })
    );

    mockProcessEndOfDayMutateAsync.mockResolvedValue({
      rescheduled: [],
      statusChangedToC: [],
      cancelledForC: [],
      couldNotReschedule: [],
    });

    // Set justifications for the absences
    act(() => {
      result.current.handleJustificationChange(14, "assessment", true, "Family emergency");
      result.current.handleJustificationChange(6, "physiotherapy", false);
    });

    // Submit the form
    await act(async () => {
      await result.current.handleSubmit();
    });

    // Verify processEndOfDay was called with correct appointmentIds (not patientIds)
    await waitFor(() => {
      expect(mockProcessEndOfDayMutateAsync).toHaveBeenCalledWith({
        date: selectedDate,
        absenceJustifications: [
          { appointmentId: 33, justified: true, notes: "Family emergency" },
          { appointmentId: 32, justified: false, notes: "" },
        ],
      });
    });

    // After success, should transition to summary step (not close immediately)
    await waitFor(() => {
      expect(result.current.currentStep).toBe("summary");
      expect(result.current.processResult).toBeDefined();
    });

    // Call handleConclude to close and refresh
    act(() => {
      result.current.handleConclude();
    });
    expect(mockCloseModal).toHaveBeenCalledWith("endOfDay");
    expect(mockRefreshData).toHaveBeenCalled();
  });

  it("should filter out absences without appointmentId", async () => {
    const getScheduledAbsencesSpy = jest.spyOn(appointmentDataUtils, 'getScheduledAbsences');

    // Mock scheduled absence without appointmentId - will be filtered out
    const mockScheduledAbsences = [
      {
        name: "John Doe",
        patientId: 14,
        // No appointmentId - filtered out by .filter(absence => absence.appointmentId)
        appointmentType: "assessment" as AppointmentType,
        priority: "1" as const,
      },
    ];

    getScheduledAbsencesSpy.mockReturnValue(mockScheduledAbsences);

    const { result } = renderHook(() =>
      useEndOfDay({
        selectedDate,
      })
    );

    mockProcessEndOfDayMutateAsync.mockResolvedValue({
      rescheduled: [],
      statusChangedToC: [],
      cancelledForC: [],
      couldNotReschedule: [],
    });

    act(() => {
      result.current.handleJustificationChange(14, "assessment", true, "Test note");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    // No appointments with appointmentId - empty payload
    await waitFor(() => {
      expect(mockProcessEndOfDayMutateAsync).toHaveBeenCalledWith({
        date: selectedDate,
        absenceJustifications: [],
      });
    });
  });

  it("should find correct appointmentId when multiple absences exist for same patient", async () => {
    const getScheduledAbsencesSpy = jest.spyOn(appointmentDataUtils, 'getScheduledAbsences');

    // Mock scenario: same patient has multiple absences (different types)
    const mockScheduledAbsences = [
      {
        name: "John Doe",
        patientId: 14,
        appointmentId: 33,
        appointmentType: "assessment" as AppointmentType,
        priority: "1" as const,
      },
      {
        name: "John Doe",
        patientId: 14,
        appointmentId: 34,
        appointmentType: "physiotherapy" as AppointmentType,
        priority: "1" as const,
      },
    ];

    getScheduledAbsencesSpy.mockReturnValue(mockScheduledAbsences);

    const { result } = renderHook(() =>
      useEndOfDay({
        selectedDate,
      })
    );

    mockProcessEndOfDayMutateAsync.mockResolvedValue({
      rescheduled: [],
      statusChangedToC: [],
      cancelledForC: [],
      couldNotReschedule: [],
    });

    act(() => {
      result.current.handleJustificationChange(14, "assessment", true, "Assessment absence");
      result.current.handleJustificationChange(14, "physiotherapy", false);
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(mockProcessEndOfDayMutateAsync).toHaveBeenCalledWith({
        date: selectedDate,
        absenceJustifications: expect.arrayContaining([
          { appointmentId: 33, justified: true, notes: "Assessment absence" },
          { appointmentId: 34, justified: false, notes: "" },
        ]),
      });
    });
  });
});
