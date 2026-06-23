/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useEndOfDay } from "../hooks/useEndOfDay";
import { useAttendanceData } from "@/features/board/hooks/useAttendanceData";
import { useProcessEndOfDay } from "@/api/query/hooks/useDayFinalizationQueries";
import { useCloseModal } from "@/stores/modalStore";
import * as attendanceDataUtils from "../../../utils/attendanceDataUtils";
import type { AttendanceType } from "@/types/types";

// Mock dependencies
jest.mock("@/features/board/hooks/useAttendanceData");
jest.mock("@/api/query/hooks/useDayFinalizationQueries");
jest.mock("@/stores/modalStore");
jest.mock("../../../utils/attendanceDataUtils", () => ({
  getIncompleteAttendances: jest.fn(() => []),
  getCompletedAttendances: jest.fn(() => []),
  getScheduledAbsences: jest.fn(() => []),
}));

const mockUseAttendanceData = useAttendanceData as jest.MockedFunction<typeof useAttendanceData>;
const mockUseProcessEndOfDay = useProcessEndOfDay as jest.MockedFunction<typeof useProcessEndOfDay>;
const mockUseCloseModal = useCloseModal as jest.MockedFunction<typeof useCloseModal>;

describe("useEndOfDay", () => {
  const mockRefreshData = jest.fn();
  const mockProcessEndOfDayMutateAsync = jest.fn();
  const mockCloseModal = jest.fn();
  const selectedDate = "2026-01-15";

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAttendanceData.mockReturnValue({
      attendancesByDate: null,
      refreshData: mockRefreshData,
      isLoading: false,
      error: null,
      getIncompleteAttendances: jest.fn(),
      getCompletedAttendances: jest.fn(),
      getScheduledAbsences: jest.fn(),
    } as Partial<ReturnType<typeof useAttendanceData>> as ReturnType<typeof useAttendanceData>);

    mockUseProcessEndOfDay.mockReturnValue({
      mutateAsync: mockProcessEndOfDayMutateAsync,
      isPending: false,
      isError: false,
      error: null,
    } as Partial<ReturnType<typeof useProcessEndOfDay>> as ReturnType<typeof useProcessEndOfDay>);

    mockUseCloseModal.mockReturnValue(mockCloseModal);
  });

  it("should use attendanceId instead of patientId when submitting absences", async () => {
    const getScheduledAbsencesSpy = jest.spyOn(attendanceDataUtils, 'getScheduledAbsences');

    // Mock scheduled absences with both patientId and attendanceId
    const mockScheduledAbsences = [
      {
        name: "John Doe",
        patientId: 14, // This is the patient ID
        attendanceId: 33, // This is the attendance ID (should be used in API)
        attendanceType: "assessment" as AttendanceType,
        priority: "1" as const,
      },
      {
        name: "Jane Smith",
        patientId: 6,
        attendanceId: 32,
        attendanceType: "physiotherapy" as AttendanceType,
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

    // Verify processEndOfDay was called with correct attendanceIds (not patientIds)
    await waitFor(() => {
      expect(mockProcessEndOfDayMutateAsync).toHaveBeenCalledWith({
        date: selectedDate,
        absenceJustifications: [
          { attendanceId: 33, justified: true, notes: "Family emergency" },
          { attendanceId: 32, justified: false, notes: "" },
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

  it("should filter out absences without attendanceId", async () => {
    const getScheduledAbsencesSpy = jest.spyOn(attendanceDataUtils, 'getScheduledAbsences');

    // Mock scheduled absence without attendanceId - will be filtered out
    const mockScheduledAbsences = [
      {
        name: "John Doe",
        patientId: 14,
        // No attendanceId - filtered out by .filter(absence => absence.attendanceId)
        attendanceType: "assessment" as AttendanceType,
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

    // No attendances with attendanceId - empty payload
    await waitFor(() => {
      expect(mockProcessEndOfDayMutateAsync).toHaveBeenCalledWith({
        date: selectedDate,
        absenceJustifications: [],
      });
    });
  });

  it("should find correct attendanceId when multiple absences exist for same patient", async () => {
    const getScheduledAbsencesSpy = jest.spyOn(attendanceDataUtils, 'getScheduledAbsences');

    // Mock scenario: same patient has multiple absences (different types)
    const mockScheduledAbsences = [
      {
        name: "John Doe",
        patientId: 14,
        attendanceId: 33,
        attendanceType: "assessment" as AttendanceType,
        priority: "1" as const,
      },
      {
        name: "John Doe",
        patientId: 14,
        attendanceId: 34,
        attendanceType: "physiotherapy" as AttendanceType,
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
          { attendanceId: 33, justified: true, notes: "Assessment absence" },
          { attendanceId: 34, justified: false, notes: "" },
        ]),
      });
    });
  });
});
