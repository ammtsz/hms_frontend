import { renderHook, act } from "@testing-library/react";
import { usePatientWalkInForm } from "../usePatientWalkInForm";
import { usePatients, useCreatePatient } from "@/api/query/hooks/usePatientQueries";
import {
  useAttendancesByDate,
  useCreateAttendance,
  useCheckInAttendance,
  useEligibleParentOptions,
} from "@/api/query/hooks/useAttendanceQueries";
import { useSelectablePrioritiesForForm } from "@/features/attendance/hooks/useSelectablePrioritiesForForm";
import { SystemOptionType } from "@/types/systemOptions";

// Mock the hooks
jest.mock("@/api/query/hooks/usePatientQueries");
jest.mock("@/api/query/hooks/useAttendanceQueries");
jest.mock("@/features/attendance/hooks/useSelectablePrioritiesForForm", () => ({
  useSelectablePrioritiesForForm: jest.fn(),
}));
jest.mock("@/features/attendance/hooks/useAttendanceHolidayForDate", () => ({
  useAttendanceHolidayForDate: jest.fn().mockReturnValue({
    isLoading: false,
    hasError: false,
    blockedLabels: [],
    isHolidayForAll: false,
    holidayMessage: null,
  }),
}));
jest.mock("@/api/attendances");
jest.mock("@/api/consultations");

const mockUsePatients = usePatients as jest.MockedFunction<typeof usePatients>;
const mockUseCreatePatient = useCreatePatient as jest.MockedFunction<
  typeof useCreatePatient
>;
const mockUseAttendancesByDate = useAttendancesByDate as jest.MockedFunction<
  typeof useAttendancesByDate
>;
const mockUseCreateAttendance = useCreateAttendance as jest.MockedFunction<
  typeof useCreateAttendance
>;
const mockUseCheckInAttendance = useCheckInAttendance as jest.MockedFunction<
  typeof useCheckInAttendance
>;
const mockUseEligibleParentOptions = useEligibleParentOptions as jest.MockedFunction<
  typeof useEligibleParentOptions
>;

describe("usePatientWalkInForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useSelectablePrioritiesForForm as jest.Mock).mockReturnValue({
      sortedPriorities: [
        {
          id: 1,
          type: SystemOptionType.PRIORITY,
          value: "1",
          label: "Exceção",
          isActive: true,
          sortOrder: 1,
          createdAt: "",
          updatedAt: "",
        },
        {
          id: 2,
          type: SystemOptionType.PRIORITY,
          value: "2",
          label: "Idoso/crianças",
          isActive: true,
          sortOrder: 2,
          createdAt: "",
          updatedAt: "",
        },
        {
          id: 3,
          type: SystemOptionType.PRIORITY,
          value: "3",
          label: "Padrão",
          isActive: true,
          sortOrder: 3,
          createdAt: "",
          updatedAt: "",
        },
      ],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Default mock implementations
    mockUsePatients.mockReturnValue({
      data: [
        { id: "1", name: "John Doe", priority: "3", phone: "1234567890", status: "active" },
        { id: "2", name: "Jane Smith", priority: "2", phone: "0987654321", status: "active" },
      ],
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof usePatients>);

    mockUseCreatePatient.mockReturnValue({
      mutateAsync: jest.fn(),
    } as unknown as ReturnType<typeof useCreatePatient>);

    mockUseAttendancesByDate.mockReturnValue({
      data: null,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useAttendancesByDate>);

    mockUseCreateAttendance.mockReturnValue({
      mutateAsync: jest.fn(),
    } as unknown as ReturnType<typeof useCreateAttendance>);

    mockUseCheckInAttendance.mockReturnValue({
      mutateAsync: jest.fn(),
    } as unknown as ReturnType<typeof useCheckInAttendance>);

    mockUseEligibleParentOptions.mockReturnValue({
      data: { options: [] },
      isLoading: false,
    } as unknown as ReturnType<typeof useEligibleParentOptions>);
  });

  it("should initialize with default form data", () => {
    const { result } = renderHook(() => usePatientWalkInForm());

    expect(result.current.formData).toEqual({
      name: "",
      phone: "",
      birthDate: "",
      priority: "5",
      isNewPatient: false,
      selectedPatient: "",
      selectedParentAttendance: "",
    });
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBeNull();
  });

  it("should filter patients based on name input", () => {
    const { result } = renderHook(() => usePatientWalkInForm());

    act(() => {
      result.current.setFormData((prev) => ({ ...prev, name: "John" }));
    });

    expect(result.current.filteredPatients).toHaveLength(1);
    expect(result.current.filteredPatients[0].name).toBe("John Doe");
  });

  it("should reset form correctly", () => {
    const { result } = renderHook(() => usePatientWalkInForm());

    // Set some form data
    act(() => {
      result.current.setFormData((prev) => ({
        ...prev,
        name: "Test",
        phone: "1234567890",
        isNewPatient: true,
      }));
      result.current.setError("Test error");
    });

    // Reset form
    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formData.name).toBe("");
    expect(result.current.formData.phone).toBe("");
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBeNull();
  });

  it("should validate form data correctly", async () => {
    const { result } = renderHook(() => usePatientWalkInForm());

    // Submit with empty form should fail
    const submitEvent = { preventDefault: jest.fn() } as unknown as React.FormEvent<HTMLFormElement>;

    await act(async () => {
      await result.current.handleSubmit(submitEvent);
    });

    expect(result.current.error).toBeTruthy();
  });
});
