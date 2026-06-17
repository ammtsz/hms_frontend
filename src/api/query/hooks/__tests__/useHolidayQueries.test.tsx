import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import {
  useHolidays,
  useUpcomingHolidays,
  useCheckHolidayConflicts,
  useCreateHoliday,
  useDeleteHoliday,
  useUpdateHoliday,
} from "@/api/query/hooks/useHolidayQueries";
import * as holidayApi from "@/api/holidays";

// Mock the API module
jest.mock("@/api/holidays");

const mockHolidays = [
  {
    id: 1,
    holidayDate: "2026-12-25",
    name: "Natal",
    description: "Feriado Nacional",
    createdDate: "2026-01-01",
    updatedDate: "2026-01-01",
  },
  {
    id: 2,
    holidayDate: "2026-01-01",
    name: "Ano Novo",
    description: "Feriado Nacional",
    createdDate: "2026-01-01",
    updatedDate: "2026-01-01",
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "QueryClientWrapper";
  return Wrapper;
};

describe("useHolidayQueries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useHolidays", () => {
    it("fetches all holidays successfully", async () => {
      (holidayApi.getAllHolidays as jest.Mock).mockResolvedValue({
        success: true,
        value: mockHolidays,
      });

      const { result } = renderHook(() => useHolidays(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockHolidays);
      expect(holidayApi.getAllHolidays).toHaveBeenCalledWith(undefined);
    });

    it("fetches holidays filtered by year", async () => {
      (holidayApi.getAllHolidays as jest.Mock).mockResolvedValue({
        success: true,
        value: mockHolidays,
      });

      const { result } = renderHook(() => useHolidays(2026), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(holidayApi.getAllHolidays).toHaveBeenCalledWith(2026);
    });

    it("handles fetch error", async () => {
      (holidayApi.getAllHolidays as jest.Mock).mockResolvedValue({
        success: false,
        error: "Failed to fetch holidays",
      });

      const { result } = renderHook(() => useHolidays(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe("useUpcomingHolidays", () => {
    it("fetches upcoming holidays with default limit", async () => {
      (holidayApi.getUpcomingHolidays as jest.Mock).mockResolvedValue({
        success: true,
        value: mockHolidays.slice(0, 1),
      });

      const { result } = renderHook(() => useUpcomingHolidays(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(holidayApi.getUpcomingHolidays).toHaveBeenCalledWith(5);
    });

    it("fetches upcoming holidays with custom limit", async () => {
      (holidayApi.getUpcomingHolidays as jest.Mock).mockResolvedValue({
        success: true,
        value: mockHolidays,
      });

      const { result } = renderHook(() => useUpcomingHolidays(3), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(holidayApi.getUpcomingHolidays).toHaveBeenCalledWith(3);
    });
  });

  describe("useCheckHolidayConflicts", () => {
    it("checks for conflicts on a date", async () => {
      const mockConflict = {
        hasConflict: true,
        attendanceCount: 2,
        attendances: [
          { id: 1, patientName: "John Doe", treatmentType: "assessment" },
        ],
      };

      (holidayApi.checkHolidayConflicts as jest.Mock).mockResolvedValue({
        success: true,
        value: mockConflict,
      });

      const { result } = renderHook(
        () => useCheckHolidayConflicts("2026-12-25"),
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockConflict);
      expect(holidayApi.checkHolidayConflicts).toHaveBeenCalledWith(
        "2026-12-25",
      );
    });

    it("does not fetch when date is empty", async () => {
      const { result } = renderHook(() => useCheckHolidayConflicts(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(holidayApi.checkHolidayConflicts).not.toHaveBeenCalled();
    });
  });

  describe("useCreateHoliday", () => {
    it("creates a holiday successfully", async () => {
      const newHoliday = {
        holidayDate: "2026-12-31",
        name: "Réveillon",
        description: "Feriado Nacional",
      };

      const createdHoliday = { ...newHoliday, id: 3 };

      (holidayApi.createHoliday as jest.Mock).mockResolvedValue({
        success: true,
        value: createdHoliday,
      });

      const { result } = renderHook(() => useCreateHoliday(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(newHoliday);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(holidayApi.createHoliday).toHaveBeenCalledWith(newHoliday);
    });

    it("handles create error", async () => {
      (holidayApi.createHoliday as jest.Mock).mockResolvedValue({
        success: false,
        error: "Holiday already exists",
      });

      const { result } = renderHook(() => useCreateHoliday(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        holidayDate: "2026-12-25",
        name: "Natal",
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe("useUpdateHoliday", () => {
    it("updates a holiday successfully", async () => {
      const updatedData = { name: "Natal - Updated" };
      const updatedHoliday = { ...mockHolidays[0], ...updatedData };

      (holidayApi.updateHoliday as jest.Mock).mockResolvedValue({
        success: true,
        value: updatedHoliday,
      });

      const { result } = renderHook(() => useUpdateHoliday(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: 1, data: updatedData });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(holidayApi.updateHoliday).toHaveBeenCalledWith(1, updatedData);
    });
  });

  describe("useDeleteHoliday", () => {
    it("deletes a holiday successfully", async () => {
      (holidayApi.deleteHoliday as jest.Mock).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useDeleteHoliday(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(1);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(holidayApi.deleteHoliday).toHaveBeenCalledWith(1);
    });
  });

});
