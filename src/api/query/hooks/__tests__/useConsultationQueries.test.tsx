import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import {
  useConsultations,
  useConsultationByAttendance,
  useCreateConsultation,
  useUpdateConsultation,
  useDeleteConsultation,
  useConsultationsCompat,
} from "../useConsultationQueries";
import { consultationKeys } from "@/api/query/keys/consultationKeys";
import * as consultationsApi from "@/api/consultations";
import type {
  ConsultationResponseDto,
  CreateConsultationRequest,
  UpdateConsultationRequest,
} from "@/api/types";

// Mock the API module
jest.mock("@/api/consultations");

const mockedAPI = consultationsApi as jest.Mocked<typeof consultationsApi>;

describe("useConsultationQueries hooks", () => {
  let queryClient: QueryClient;

  // Helper to create wrapper with QueryClient
  const createWrapper = () => {
    queryClient = new QueryClient({
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

    const TestWrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return TestWrapper;
  };

  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockConsultation: ConsultationResponseDto = {
    id: 1,
    attendanceId: 123,
    mainConcern: "Test complaint",
    food: "Light meals",
    water: "2L/day",
    ointments: "Healing ointments",
    physiotherapy: true,
    tens: false,
    returnWeeks: 2,
    notes: "Test notes",
    createdDate: "2025-11-26",
    createdTime: "10:00:00",
    updatedDate: "2025-11-26",
    updatedTime: "10:00:00",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: 0,
        },
        mutations: { retry: false },
      },
    });
  });

  describe("consultationKeys", () => {
    it("should generate correct query keys", () => {
      expect(consultationKeys.all).toEqual(["consultations"]);
      expect(consultationKeys.lists()).toEqual(["consultations", "list"]);
      expect(consultationKeys.details()).toEqual(["consultations", "detail"]);
      expect(consultationKeys.detail("123")).toEqual([
        "consultations",
        "detail",
        "123",
      ]);
      expect(consultationKeys.byAttendance("456")).toEqual([
        "consultations",
        "attendance",
        "456",
      ]);
    });
  });

  describe("useConsultations", () => {
    it("should fetch treatment records successfully", async () => {
      const mockRecords = [mockConsultation];
      mockedAPI.getConsultations.mockResolvedValue({
        success: true,
        value: mockRecords,
      });

      const { result } = renderHook(() => useConsultations(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockRecords);
      expect(mockedAPI.getConsultations).toHaveBeenCalledTimes(1);
    });

    it("should handle API error", async () => {
      const errorMessage = "Server error";
      mockedAPI.getConsultations.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useConsultations(), {
        wrapper: createWrapper(),
      });

      // Wait for the error state directly, with longer timeout
      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 3000 },
      );

      // Verify the API was called
      expect(mockedAPI.getConsultations).toHaveBeenCalledTimes(1);
      expect(result.current.error?.message).toBe(errorMessage);
    });

    it("should handle API success but no value", async () => {
      // The query function will throw when success is false or no value
      mockedAPI.getConsultations.mockResolvedValue({
        success: false,
      });

      const { result } = renderHook(() => useConsultations(), {
        wrapper: createWrapper(),
      });

      // Wait for the error state directly, with longer timeout
      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 3000 },
      );

      // Verify the API was called
      expect(mockedAPI.getConsultations).toHaveBeenCalledTimes(1);
      expect(result.current.error?.message).toBe(
        "Failed to load consultations",
      );
    });

    it("should use correct query options", async () => {
      mockedAPI.getConsultations.mockResolvedValue({
        success: true,
        value: [mockConsultation],
      });

      const { result } = renderHook(() => useConsultations(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify the hook uses the correct query key
      const queryData = queryClient.getQueryData(consultationKeys.lists());
      expect(queryData).toEqual([mockConsultation]);
    });
  });

  describe("useConsultationByAttendance", () => {
    it("should fetch treatment record by attendance ID", async () => {
      mockedAPI.getConsultationByAttendance.mockResolvedValue({
        success: true,
        value: mockConsultation,
      });

      const { result } = renderHook(() => useConsultationByAttendance("123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockConsultation);
      expect(mockedAPI.getConsultationByAttendance).toHaveBeenCalledWith("123");
    });

    it("should return null for not found record", async () => {
      mockedAPI.getConsultationByAttendance.mockResolvedValue({
        success: false,
        error: "Record not found",
      });

      const { result } = renderHook(() => useConsultationByAttendance("999"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(null);
    });

    it("should handle 404 errors gracefully", async () => {
      mockedAPI.getConsultationByAttendance.mockResolvedValue({
        success: false,
        error: "404 not found",
      });

      const { result } = renderHook(() => useConsultationByAttendance("404"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(null);
    });

    it("should throw error for other failures", async () => {
      // The query function will throw when success is false and error is not about 'not found'
      mockedAPI.getConsultationByAttendance.mockResolvedValue({
        success: false,
        error: "Server error",
      });

      const { result } = renderHook(() => useConsultationByAttendance("123"), {
        wrapper: createWrapper(),
      });

      // Wait for the error state directly, with longer timeout
      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 3000 },
      );

      // Verify the API was called
      expect(mockedAPI.getConsultationByAttendance).toHaveBeenCalledTimes(1);
      expect(result.current.error?.message).toBe("Server error");
    });

    it("should handle numeric attendance ID", async () => {
      mockedAPI.getConsultationByAttendance.mockResolvedValue({
        success: true,
        value: mockConsultation,
      });

      const { result } = renderHook(() => useConsultationByAttendance(456), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedAPI.getConsultationByAttendance).toHaveBeenCalledWith("456");
    });

    it("should not run query when attendanceId is falsy", () => {
      const { result } = renderHook(() => useConsultationByAttendance(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockedAPI.getConsultationByAttendance).not.toHaveBeenCalled();
    });

    it("should handle success response with no value", async () => {
      mockedAPI.getConsultationByAttendance.mockResolvedValue({
        success: true,
        value: undefined,
      });

      const { result } = renderHook(() => useConsultationByAttendance("123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(null);
    });
  });

  describe("useCreateConsultation", () => {
    it("should create treatment record successfully", async () => {
      const createData: CreateConsultationRequest = {
        attendanceId: 123,
        mainConcern: "Test complaint",
        food: "Light meals",
        water: "2L/day",
        physiotherapy: true,
        returnWeeks: 2,
      };

      mockedAPI.createConsultation.mockResolvedValue({
        success: true,
        value: { consultation: mockConsultation },
      });

      const { result } = renderHook(() => useCreateConsultation(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync(createData);

      expect(mockedAPI.createConsultation).toHaveBeenCalledWith(createData);
    });

    it("should handle create error", async () => {
      const createData: CreateConsultationRequest = {
        attendanceId: 123,
        mainConcern: "Test complaint",
        physiotherapy: false,
        returnWeeks: 1,
      };

      mockedAPI.createConsultation.mockResolvedValue({
        success: false,
        error: "Validation failed",
      });

      const { result } = renderHook(() => useCreateConsultation(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.mutateAsync(createData)).rejects.toThrow(
        "Validation failed",
      );
    });

    it("should handle create success but no value", async () => {
      const createData: CreateConsultationRequest = {
        attendanceId: 123,
        mainConcern: "Test complaint",
        notes: "Test notes",
      };

      mockedAPI.createConsultation.mockResolvedValue({
        success: true,
        value: undefined,
      });

      const { result } = renderHook(() => useCreateConsultation(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.mutateAsync(createData)).rejects.toThrow(
        "Failed to create consultation",
      );
    });

    it("should invalidate queries on success", async () => {
      const createData: CreateConsultationRequest = {
        attendanceId: 123,
        mainConcern: "Test complaint",
        physiotherapy: true,
        returnWeeks: 3,
      };

      mockedAPI.createConsultation.mockResolvedValue({
        success: true,
        value: { consultation: mockConsultation },
      });

      const { result } = renderHook(() => useCreateConsultation(), {
        wrapper: createWrapper(),
      });

      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      await result.current.mutateAsync(createData);

      // Wait a bit for the onSuccess callback to execute
      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: consultationKeys.lists(),
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: consultationKeys.byAttendance("123"),
      });
    });
  });

  describe("useUpdateConsultation", () => {
    it("should update treatment record successfully", async () => {
      const updateData: UpdateConsultationRequest = {
        returnWeeks: 10,
        notes: "Updated notes",
      };

      const updatedRecord = { ...mockConsultation, ...updateData };

      mockedAPI.updateConsultation.mockResolvedValue({
        success: true,
        value: { consultation: updatedRecord },
      });

      const { result } = renderHook(() => useUpdateConsultation(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ id: "1", data: updateData });

      expect(mockedAPI.updateConsultation).toHaveBeenCalledWith(
        "1",
        updateData,
      );
    });

    it("should handle update error", async () => {
      const updateData: UpdateConsultationRequest = { returnWeeks: 10 };

      mockedAPI.updateConsultation.mockResolvedValue({
        success: false,
        error: "Update failed",
      });

      const { result } = renderHook(() => useUpdateConsultation(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({ id: "1", data: updateData }),
      ).rejects.toThrow("Update failed");
    });

    it("should handle numeric ID", async () => {
      const updateData: UpdateConsultationRequest = { returnWeeks: 10 };
      const updatedRecord = { ...mockConsultation, ...updateData };

      mockedAPI.updateConsultation.mockResolvedValue({
        success: true,
        value: { consultation: updatedRecord },
      });

      const { result } = renderHook(() => useUpdateConsultation(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ id: 123, data: updateData });

      expect(mockedAPI.updateConsultation).toHaveBeenCalledWith(
        "123",
        updateData,
      );
    });
  });

  describe("useDeleteConsultation", () => {
    it("should delete treatment record successfully", async () => {
      mockedAPI.deleteConsultation.mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useDeleteConsultation(), {
        wrapper: createWrapper(),
      });

      const success = await result.current.mutateAsync("1");

      expect(success).toBe(true);
      expect(mockedAPI.deleteConsultation).toHaveBeenCalledWith("1");
    });

    it("should handle delete error", async () => {
      mockedAPI.deleteConsultation.mockResolvedValue({
        success: false,
        error: "Delete failed",
      });

      const { result } = renderHook(() => useDeleteConsultation(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.mutateAsync("1")).rejects.toThrow(
        "Delete failed",
      );
    });

    it("should handle numeric ID", async () => {
      mockedAPI.deleteConsultation.mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useDeleteConsultation(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync(123);

      expect(mockedAPI.deleteConsultation).toHaveBeenCalledWith("123");
    });

    it("should remove queries from cache on success", async () => {
      mockedAPI.deleteConsultation.mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useDeleteConsultation(), {
        wrapper: createWrapper(),
      });

      const removeQueriesSpy = jest.spyOn(queryClient, "removeQueries");

      await result.current.mutateAsync("1");

      // Wait for onSuccess callback to execute
      await waitFor(() => {
        expect(removeQueriesSpy).toHaveBeenCalledWith({
          queryKey: consultationKeys.detail("1"),
        });
      });
    });
  });

  describe("useConsultationsCompat", () => {
    beforeEach(() => {
      mockedAPI.getConsultations.mockResolvedValue({
        success: true,
        value: [mockConsultation],
      });
    });

    it("should provide compatibility interface", async () => {
      const { result } = renderHook(() => useConsultationsCompat(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.consultations).toEqual([mockConsultation]);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.refreshConsultations).toBe("function");
      expect(typeof result.current.getConsultationForAttendance).toBe(
        "function",
      );
      expect(typeof result.current.createConsultation).toBe("function");
      expect(typeof result.current.updateConsultation).toBe("function");
      expect(typeof result.current.deleteConsultation).toBe("function");
    });

    it("should handle error state correctly", async () => {
      // Make the API throw an error so it gets caught by React Query
      mockedAPI.getConsultations.mockRejectedValue(new Error("Server error"));

      const { result } = renderHook(() => useConsultationsCompat(), {
        wrapper: createWrapper(),
      });

      // Wait for the error state directly, with longer timeout
      await waitFor(
        () => {
          expect(result.current.error).toBe("Server error");
        },
        { timeout: 3000 },
      );

      // Verify the API was called
      expect(mockedAPI.getConsultations).toHaveBeenCalledTimes(1);
      expect(result.current.consultations).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it("should refresh treatment records", async () => {
      const { result } = renderHook(() => useConsultationsCompat(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      await result.current.refreshConsultations();

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: consultationKeys.lists(),
      });
    });

    it("should get treatment record for attendance", async () => {
      mockedAPI.getConsultationByAttendance.mockResolvedValue({
        success: true,
        value: mockConsultation,
      });

      const { result } = renderHook(() => useConsultationsCompat(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const record = await result.current.getConsultationForAttendance(123);

      expect(record).toEqual(mockConsultation);
    });

    it("should handle create record error", async () => {
      const createData: CreateConsultationRequest = {
        attendanceId: 123,
        mainConcern: "Test complaint",
        physiotherapy: true,
        returnWeeks: 5,
      };

      mockedAPI.createConsultation.mockResolvedValue({
        success: false,
        error: "Create failed",
      });

      const { result } = renderHook(() => useConsultationsCompat(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const record = await result.current.createConsultation(createData);

      expect(record).toBe(null);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error in createConsultation:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });

    it("should handle update record error", async () => {
      const updateData: UpdateConsultationRequest = { returnWeeks: 10 };

      mockedAPI.updateConsultation.mockResolvedValue({
        success: false,
        error: "Update failed",
      });

      const { result } = renderHook(() => useConsultationsCompat(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const record = await result.current.updateConsultation(1, updateData);

      expect(record).toBe(null);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error in updateConsultation:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });

    it("should handle delete record error", async () => {
      mockedAPI.deleteConsultation.mockResolvedValue({
        success: false,
        error: "Delete failed",
      });

      const { result } = renderHook(() => useConsultationsCompat(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const success = await result.current.deleteConsultation(1);

      expect(success).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error in deleteConsultation:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
