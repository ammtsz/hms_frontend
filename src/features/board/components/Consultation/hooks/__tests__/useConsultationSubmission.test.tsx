import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { useConsultationSubmission } from "../useConsultationSubmission";
import {
  useCreateConsultation,
  useUpdateConsultation,
  useFetchConsultationByAppointment,
} from "@/api/query/hooks/useConsultationQueries";
import type { PostConsultationFormData } from "../..";
import { AxiosError } from "axios";
import {
  createMockConsultationResponse,
  createMockPostConsultationFormData,
  EXAMPLE_HOME_EXERCISES,
  EXAMPLE_PAIN_MANAGEMENT,
  EXAMPLE_MEDICATIONS,
} from "@/testFixtures/physiotherapyContext";

// Mock the React Query hooks
jest.mock("@/api/query/hooks/useConsultationQueries");
const mockUseCreateConsultation = useCreateConsultation as jest.MockedFunction<
  typeof useCreateConsultation
>;
const mockUseUpdateConsultation = useUpdateConsultation as jest.MockedFunction<
  typeof useUpdateConsultation
>;
const mockUseFetchConsultationByAppointment =
  useFetchConsultationByAppointment as jest.MockedFunction<
    typeof useFetchConsultationByAppointment
  >;

// Mock getConsultationByAppointment for 409 retry flow
jest.mock("@/api/consultations", () => ({
  ...jest.requireActual("@/api/consultations"),
  getConsultationByAppointment: jest.fn(),
}));
import { getConsultationByAppointment } from "@/api/consultations";
const mockGetConsultationByAppointment =
  getConsultationByAppointment as jest.MockedFunction<
    typeof getConsultationByAppointment
  >;

describe("useConsultationSubmission", () => {
  const mockConsoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});
  let queryClient: QueryClient;
  let mockMutateAsync: jest.Mock;
  let mockUpdateMutateAsync: jest.Mock;

  const createWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleError.mockClear();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockMutateAsync = jest.fn();
    mockUpdateMutateAsync = jest.fn();
    mockUseCreateConsultation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      mutate: jest.fn(),
      isPending: false,
      isIdle: true,
      isError: false,
      isSuccess: false,
      data: undefined,
      error: null,
      reset: jest.fn(),
      status: "idle",
      variables: undefined,
      context: undefined,
      failureCount: 0,
      failureReason: null,
      isPaused: false,
      submittedAt: 0,
    });
    mockUseUpdateConsultation.mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      mutate: jest.fn(),
      isPending: false,
      isIdle: true,
      isError: false,
      isSuccess: false,
      data: undefined,
      error: null,
      reset: jest.fn(),
      status: "idle",
      variables: undefined,
      context: undefined,
      failureCount: 0,
      failureReason: null,
      isPaused: false,
      submittedAt: 0,
    });
    mockGetConsultationByAppointment.mockReset();
    mockUseFetchConsultationByAppointment.mockReturnValue(
      jest.fn().mockImplementation(async (appointmentId: string | number) => {
        return getConsultationByAppointment(appointmentId.toString());
      }),
    );
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe("Hook initialization", () => {
    it("should initialize correctly and provide submitConsultation function", () => {
      const { result } = renderHook(() => useConsultationSubmission(), {
        wrapper: createWrapper,
      });

      expect(result.current.submitConsultation).toBeDefined();
      expect(typeof result.current.submitConsultation).toBe("function");
    });

    it("should maintain stable function reference across rerenders", () => {
      const { result, rerender } = renderHook(
        () => useConsultationSubmission(),
        {
          wrapper: createWrapper,
        },
      );
      const firstFunction = result.current.submitConsultation;

      rerender();

      expect(result.current.submitConsultation).toBe(firstFunction);
    });
  });

  describe("submitConsultation - Success scenarios", () => {
    it("should submit consultation successfully with complete data", async () => {
      const mockConsultation = createMockConsultationResponse(123);
      mockMutateAsync.mockResolvedValue({ consultation: mockConsultation });

      const { result } = renderHook(() => useConsultationSubmission(), {
        wrapper: createWrapper,
      });
      const treatmentData = createMockPostConsultationFormData();
      const appointmentId = 456;

      let submitResult;
      await act(async () => {
        submitResult = await result.current.submitConsultation(
          treatmentData,
          appointmentId,
        );
      });

      expect(submitResult).toEqual({
        consultationId: 123,
        isUpdate: false,
        cancelledAppointments: undefined,
      });
      expect(mockMutateAsync).toHaveBeenCalledWith({
        appointmentId: 456,
        mainConcern: "Lower back pain",
        patientStatus: "T",
        homeExercises: EXAMPLE_HOME_EXERCISES,
        painManagement: EXAMPLE_PAIN_MANAGEMENT,
        medications: EXAMPLE_MEDICATIONS,
        returnWeeks: 4,
        returnWhenTreatmentComplete: false,
        notes: "Patient reports gradual improvement",
        physiotherapy: true,
        tens: true,
      });
    });

    it("should handle treatment data with only physiotherapy recommendation", async () => {
      const mockConsultation = createMockConsultationResponse(789, 100);
      mockMutateAsync.mockResolvedValue({ consultation: mockConsultation });

      const treatmentData = createMockPostConsultationFormData({
        recommendations: {
          physiotherapy: {
            startDate: "2024-01-15",
            treatments: [
              {
                locations: ["Head"],
                duration: 45,
          startDate: "2024-01-15",
                duration: 45,
                quantity: 3,
              },
            ],
          },
          tens: undefined,
          returnWeeks: 4,
          returnWhenTreatmentComplete: false,
        },
      });

      const { result } = renderHook(() => useConsultationSubmission(), {
        wrapper: createWrapper,
      });

      let submitResult;
      await act(async () => {
        submitResult = await result.current.submitConsultation(
          treatmentData,
          100,
        );
      });

      expect(submitResult).toMatchObject({ consultationId: 789 });
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          physiotherapy: true,
        }),
      );
    });

    it("should handle treatment data with only tens recommendation", async () => {
      const mockConsultation = createMockConsultationResponse(321, 200);
      mockMutateAsync.mockResolvedValue({ consultation: mockConsultation });

      const treatmentData = createMockPostConsultationFormData({
        recommendations: {
          physiotherapy: undefined,
          tens: {
            startDate: "2024-01-15",
            treatments: [
              {
                locations: ["Left leg"],
                startDate: "2024-01-15",
                quantity: 1,
              },
            ],
          },
          returnWeeks: 4,
          returnWhenTreatmentComplete: false,
        },
      });

      const { result } = renderHook(() => useConsultationSubmission(), {
        wrapper: createWrapper,
      });

      let submitResult;
      await act(async () => {
        submitResult = await result.current.submitConsultation(
          treatmentData,
          200,
        );
      });

      expect(submitResult).toMatchObject({ consultationId: 321 });
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          tens: true,
        }),
      );
    });

    it("should handle treatment data with no recommendations", async () => {
      const mockConsultation = createMockConsultationResponse(654, 300);
      mockMutateAsync.mockResolvedValue({ consultation: mockConsultation });

      const treatmentData = createMockPostConsultationFormData({
        recommendations: {
          physiotherapy: undefined,
          tens: undefined,
          returnWeeks: 4,
          returnWhenTreatmentComplete: false,
        },
      });

      const { result } = renderHook(() => useConsultationSubmission(), {
        wrapper: createWrapper,
      });

      let submitResult;
      await act(async () => {
        submitResult = await result.current.submitConsultation(
          treatmentData,
          300,
        );
      });

      expect(submitResult).toMatchObject({ consultationId: 654 });
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          mainConcern: "Lower back pain",
        }),
      );
    });

    it("should handle different treatment status values", async () => {
      const mockConsultation = createMockConsultationResponse(111, 400);
      mockMutateAsync.mockResolvedValue({ consultation: mockConsultation });

      const treatmentStatuses: PatientStatusValue[] = ["N", "T", "D", "C"];

      const { result } = renderHook(() => useConsultationSubmission(), {
        wrapper: createWrapper,
      });

      for (const status of treatmentStatuses) {
        const treatmentData = createMockPostConsultationFormData({
          patientStatus: status,
        });

        await act(async () => {
          await result.current.submitConsultation(treatmentData, 400);
        });

        expect(mockMutateAsync).toHaveBeenLastCalledWith(
          expect.objectContaining({
            patientStatus: status,
          }),
        );
      }
    });

    it("should handle empty strings and null values gracefully", async () => {
      const mockConsultation = createMockConsultationResponse(999, 500);
      mockMutateAsync.mockResolvedValue({ consultation: mockConsultation });

      const treatmentData = createMockPostConsultationFormData({
        mainConcern: "",
        homeExercises: "",
        painManagement: "",
        medications: "",
        notes: "",
      });

      const { result } = renderHook(() => useConsultationSubmission(), {
        wrapper: createWrapper,
      });

      let submitResult;
      await act(async () => {
        submitResult = await result.current.submitConsultation(
          treatmentData,
          500,
        );
      });

      expect(submitResult).toMatchObject({ consultationId: 999 });
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          mainConcern: "",
          homeExercises: "",
          painManagement: "",
          medications: "",
          notes: "",
        }),
      );
    });

    it("should return cancelledAppointments when create response includes them (Discharged/Consecutive no-shows)", async () => {
      const mockConsultation = createMockConsultationResponse(888, 700);
      const cancelledAppointments = [
        { id: 10, type: "assessment", scheduledDate: "2026-01-25" },
      ];
      mockMutateAsync.mockResolvedValue({
        consultation: mockConsultation,
        cancelledAppointments,
      });

      const treatmentData = createMockPostConsultationFormData({
        patientStatus: "D",
      });
      const { result } = renderHook(() => useConsultationSubmission(), {
        wrapper: createWrapper,
      });

      let submitResult;
      await act(async () => {
        submitResult = await result.current.submitConsultation(
          treatmentData,
          700,
        );
      });

      expect(submitResult).toMatchObject({
        consultationId: 888,
        isUpdate: false,
        cancelledAppointments,
      });
    });
  });

  describe("submitConsultation - Error scenarios", () => {
    it("should handle mutation failure with error message", async () => {
      const error = new Error("Failed to create consultation");
      mockMutateAsync.mockRejectedValue(error);

      const { result } = renderHook(() => useConsultationSubmission(), {
        wrapper: createWrapper,
      });
      const treatmentData = createMockPostConsultationFormData();

      await act(async () => {
        await expect(
          result.current.submitConsultation(treatmentData, 700),
        ).rejects.toThrow("Failed to create consultation");
      });

      expect(mockConsoleError).toHaveBeenCalledWith(
        "Error submitting consultation:",
        error,
      );
    });

    it("should handle mutation returning no ID", async () => {
      mockMutateAsync.mockResolvedValue({
        consultation: { id: null } as unknown as ConsultationResponseDto,
      });

      const { result } = renderHook(() => useConsultationSubmission(), {
        wrapper: createWrapper,
      });
      const treatmentData = createMockPostConsultationFormData();

      await act(async () => {
        await expect(
          result.current.submitConsultation(treatmentData, 800),
        ).rejects.toThrow("Failed to create consultation: ID not returned");
      });

      expect(mockConsoleError).toHaveBeenCalledWith(
        "Error submitting consultation:",
        expect.any(Error),
      );
    });

    it("should handle mutation returning undefined", async () => {
      mockMutateAsync.mockResolvedValue(undefined);

      const { result } = renderHook(() => useConsultationSubmission(), {
        wrapper: createWrapper,
      });
      const treatmentData = createMockPostConsultationFormData();

      await act(async () => {
        await expect(
          result.current.submitConsultation(treatmentData, 900),
        ).rejects.toThrow();
      });

      expect(mockConsoleError).toHaveBeenCalledWith(
        "Error submitting consultation:",
        expect.any(Error),
      );
    });

    it("should handle network/API exceptions", async () => {
      const networkError = new Error("Network connection failed");
      mockMutateAsync.mockRejectedValue(networkError);

      const { result } = renderHook(() => useConsultationSubmission(), {
        wrapper: createWrapper,
      });
      const treatmentData = createMockPostConsultationFormData();

      await act(async () => {
        await expect(
          result.current.submitConsultation(treatmentData, 1000),
        ).rejects.toThrow("Network connection failed");
      });

      expect(mockConsoleError).toHaveBeenCalledWith(
        "Error submitting consultation:",
        networkError,
      );
    });

    it("should handle mutation returning malformed data", async () => {
      mockMutateAsync.mockResolvedValue({});

      const { result } = renderHook(() => useConsultationSubmission(), {
        wrapper: createWrapper,
      });
      const treatmentData = createMockPostConsultationFormData();

      await act(async () => {
        await expect(
          result.current.submitConsultation(treatmentData, 1100),
        ).rejects.toThrow();
      });

      expect(mockConsoleError).toHaveBeenCalledWith(
        "Error submitting consultation:",
        expect.any(Error),
      );
    });
  });

  describe("submitConsultation - 409 Conflict retry", () => {
    const mockConsoleLog = jest
      .spyOn(console, "log")
      .mockImplementation(() => {});

    afterAll(() => {
      mockConsoleLog.mockRestore();
    });

    function create409Error(): AxiosError {
      return { response: { status: 409 } } as AxiosError;
    }

    function createWrapped409Error(): Error & { axiosError: AxiosError } {
      const err = new Error("Conflict") as Error & { axiosError: AxiosError };
      err.axiosError = create409Error();
      return err;
    }

    it("should fetch existing consultation and update on 409, then return isUpdate true", async () => {
      const existingConsultation = createMockConsultationResponse(99, 2000);
      mockMutateAsync.mockRejectedValueOnce(create409Error());
      mockGetConsultationByAppointment.mockResolvedValue({
        success: true,
        value: existingConsultation,
      });
      mockUpdateMutateAsync.mockResolvedValue({
        consultation: { ...existingConsultation, notes: "Updated" },
      });

      const treatmentData = createMockPostConsultationFormData();
      const { result } = renderHook(() => useConsultationSubmission(), {
        wrapper: createWrapper,
      });

      let submitResult;
      await act(async () => {
        submitResult = await result.current.submitConsultation(
          treatmentData,
          2000,
        );
      });

      expect(submitResult).toMatchObject({
        consultationId: 99,
        isUpdate: true,
      });
      expect(mockGetConsultationByAppointment).toHaveBeenCalledWith("2000");
      expect(mockUpdateMutateAsync).toHaveBeenCalledTimes(1);
      const updateCall = mockUpdateMutateAsync.mock.calls[0][0];
      expect(updateCall.id).toBe("99");
      expect(updateCall.data).toMatchObject({
        mainConcern: treatmentData.mainConcern,
        patientStatus: treatmentData.patientStatus,
        homeExercises: treatmentData.homeExercises,
        painManagement: treatmentData.painManagement,
        medications: treatmentData.medications,
      });
    });

    it("should handle 409 with wrapped axiosError property", async () => {
      const existingConsultation = createMockConsultationResponse(101, 2001);
      mockMutateAsync.mockRejectedValueOnce(createWrapped409Error());
      mockGetConsultationByAppointment.mockResolvedValue({
        success: true,
        value: existingConsultation,
      });
      mockUpdateMutateAsync.mockResolvedValue({
        consultation: existingConsultation,
      });

      const treatmentData = createMockPostConsultationFormData();
      const { result } = renderHook(() => useConsultationSubmission(), {
        wrapper: createWrapper,
      });

      let submitResult;
      await act(async () => {
        submitResult = await result.current.submitConsultation(
          treatmentData,
          2001,
        );
      });

      expect(submitResult).toMatchObject({
        consultationId: 101,
        isUpdate: true,
      });
      expect(mockGetConsultationByAppointment).toHaveBeenCalledWith("2001");
    });

    it("should return cancelledAppointments from update response on 409 retry", async () => {
      const existingConsultation = createMockConsultationResponse(102, 2002);
      const cancelledAppointments = [
        { id: 20, type: "assessment", scheduledDate: "2026-02-01" },
      ];
      mockMutateAsync.mockRejectedValueOnce(create409Error());
      mockGetConsultationByAppointment.mockResolvedValue({
        success: true,
        value: existingConsultation,
      });
      mockUpdateMutateAsync.mockResolvedValue({
        consultation: existingConsultation,
        cancelledAppointments,
      });

      const treatmentData = createMockPostConsultationFormData({
        patientStatus: "D",
      });
      const { result } = renderHook(() => useConsultationSubmission(), {
        wrapper: createWrapper,
      });

      let submitResult;
      await act(async () => {
        submitResult = await result.current.submitConsultation(
          treatmentData,
          2002,
        );
      });

      expect(submitResult).toMatchObject({
        consultationId: 102,
        isUpdate: true,
        cancelledAppointments,
      });
    });

    it("should throw when fetch of existing consultation fails after 409", async () => {
      mockMutateAsync.mockRejectedValueOnce(create409Error());
      mockGetConsultationByAppointment.mockResolvedValue({
        success: false,
        error: "Not found",
      });

      const treatmentData = createMockPostConsultationFormData();
      const { result } = renderHook(() => useConsultationSubmission(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await expect(
          result.current.submitConsultation(treatmentData, 2003),
        ).rejects.toThrow("Failed to fetch existing consultation for retry");
      });

      expect(mockGetConsultationByAppointment).toHaveBeenCalledWith("2003");
      expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
    });

    it("should throw when fetch returns no value after 409", async () => {
      mockMutateAsync.mockRejectedValueOnce(create409Error());
      mockGetConsultationByAppointment.mockResolvedValue({
        success: true,
        value: null,
      } as unknown as Awaited<ReturnType<typeof getConsultationByAppointment>>);

      const treatmentData = createMockPostConsultationFormData();
      const { result } = renderHook(() => useConsultationSubmission(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await expect(
          result.current.submitConsultation(treatmentData, 2004),
        ).rejects.toThrow("Failed to fetch existing consultation for retry");
      });

      expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
    });

    it("should re-throw when update fails after 409 fetch succeeds", async () => {
      const existingConsultation = createMockConsultationResponse(103, 2005);
      mockMutateAsync.mockRejectedValueOnce(create409Error());
      mockGetConsultationByAppointment.mockResolvedValue({
        success: true,
        value: existingConsultation,
      });
      const updateError = new Error("Update failed");
      mockUpdateMutateAsync.mockRejectedValueOnce(updateError);

      const treatmentData = createMockPostConsultationFormData();
      const { result } = renderHook(() => useConsultationSubmission(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await expect(
          result.current.submitConsultation(treatmentData, 2005),
        ).rejects.toThrow("Update failed");
      });

      expect(mockConsoleError).toHaveBeenCalledWith(
        "Error submitting consultation:",
        updateError,
      );
    });

    it("should re-throw non-409 errors without retry", async () => {
      const serverError = { response: { status: 500 } } as AxiosError;
      mockMutateAsync.mockRejectedValueOnce(serverError);

      const treatmentData = createMockPostConsultationFormData();
      const { result } = renderHook(() => useConsultationSubmission(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await expect(
          result.current.submitConsultation(treatmentData, 2006),
        ).rejects.toEqual(serverError);
      });

      expect(mockGetConsultationByAppointment).not.toHaveBeenCalled();
      expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe("Data transformation and mapping", () => {
    it("should correctly map form data to API request format", async () => {
      const mockConsultation = createMockConsultationResponse(555, 1200);
      mockMutateAsync.mockResolvedValue({ consultation: mockConsultation });

      const treatmentData = createMockPostConsultationFormData({
        mainConcern: "Custom complaint",
        patientStatus: "D",
        homeExercises: "Custom home exercise plan",
        painManagement: "Custom pain management plan",
        medications: "Custom medication plan",
        returnWeeks: 8,
        notes: "Custom notes",
      });

      const { result } = renderHook(() => useConsultationSubmission(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await result.current.submitConsultation(treatmentData, 1200);
      });

      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          appointmentId: 1200,
          mainConcern: "Custom complaint",
          patientStatus: "D",
          homeExercises: "Custom home exercise plan",
          painManagement: "Custom pain management plan",
          medications: "Custom medication plan",
          notes: "Custom notes",
          physiotherapy: true,
          tens: true,
        }),
      );
    });

    it("should handle empty treatments arrays", async () => {
      const mockConsultation = createMockConsultationResponse(333, 1400);
      mockMutateAsync.mockResolvedValue({ consultation: mockConsultation });

      const treatmentData = createMockPostConsultationFormData({
        recommendations: {
          physiotherapy: {
            startDate: "2024-01-15",
            treatments: [], // Empty treatments array
          },
          tens: {
            startDate: "2024-01-15",
            treatments: [], // Empty treatments array
          },
          returnWeeks: 4,
          returnWhenTreatmentComplete: false,
        },
      });

      const { result } = renderHook(() => useConsultationSubmission(), {
        wrapper: createWrapper,
      });

      await act(async () => {
        await result.current.submitConsultation(treatmentData, 1400);
      });

      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          physiotherapy: false, // false when treatments array is empty
          tens: false, // false when treatments array is empty
        }),
      );
    });
  });

  describe("Integration scenarios", () => {
    it("should handle sequential calls correctly", async () => {
      const mockConsultation1 = createMockConsultationResponse(1001, 1500);
      const mockConsultation2 = createMockConsultationResponse(1002, 1600);

      mockMutateAsync
        .mockResolvedValueOnce({ consultation: mockConsultation1 })
        .mockResolvedValueOnce({ consultation: mockConsultation2 });

      const { result } = renderHook(() => useConsultationSubmission(), {
        wrapper: createWrapper,
      });
      const treatmentData1 = createMockPostConsultationFormData({
        mainConcern: "First complaint",
      });
      const treatmentData2 = createMockPostConsultationFormData({
        mainConcern: "Second complaint",
      });

      let result1, result2;
      await act(async () => {
        result1 = await result.current.submitConsultation(treatmentData1, 1500);
        result2 = await result.current.submitConsultation(treatmentData2, 1600);
      });

      expect(result1).toMatchObject({ consultationId: 1001 });
      expect(result2).toMatchObject({ consultationId: 1002 });
      expect(mockMutateAsync).toHaveBeenCalledTimes(2);
    });

    it("should handle concurrent calls correctly", async () => {
      const mockConsultation1 = createMockConsultationResponse(2001, 1700);
      const mockConsultation2 = createMockConsultationResponse(2002, 1800);

      mockMutateAsync
        .mockResolvedValueOnce({ consultation: mockConsultation1 })
        .mockResolvedValueOnce({ consultation: mockConsultation2 });

      const { result } = renderHook(() => useConsultationSubmission(), {
        wrapper: createWrapper,
      });
      const treatmentData1 = createMockPostConsultationFormData({
        mainConcern: "Concurrent 1",
      });
      const treatmentData2 = createMockPostConsultationFormData({
        mainConcern: "Concurrent 2",
      });

      let results: Awaited<
        ReturnType<typeof result.current.submitConsultation>
      >[];
      await act(async () => {
        results = await Promise.all([
          result.current.submitConsultation(treatmentData1, 1700),
          result.current.submitConsultation(treatmentData2, 1800),
        ]);
      });

      expect(results!).toBeDefined();
      expect(results![0]).toMatchObject({ consultationId: 2001 });
      expect(results![1]).toMatchObject({ consultationId: 2002 });
      expect(mockMutateAsync).toHaveBeenCalledTimes(2);
    });
  });
});
