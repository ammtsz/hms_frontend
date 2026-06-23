/**
 * Test file to verify bulk operations use camelCase field names correctly
 * after axios interceptor transformation.
 *
 * This test was created to prevent regression of the bug where:
 * - Backend returns snake_case (success_count, failure_count)
 * - Axios interceptor transforms to camelCase (successCount, failureCount)
 * - But code was checking snake_case fields, causing silent failures
 */

import {
  bulkCancelAppointments,
  bulkPostponeAppointments,
} from "@/api/appointments";
import api from "@/api/lib/axios";
import { AxiosError } from "axios";

// Mock the axios instance
jest.mock("@/api/lib/axios");
const mockApi = api as jest.Mocked<typeof api>;

describe("Bulk Operations - CamelCase Field Names", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("bulkCancelAppointments", () => {
    it("should return response with camelCase field names after axios transformation", async () => {
      // Mock axios response (after interceptor transformation to camelCase)
      const mockResponse = {
        data: {
          successCount: 2,
          failureCount: 1,
          successes: [
            { appointmentId: 1, message: "Successfully cancelled" },
            { appointmentId: 2, message: "Successfully cancelled" },
          ],
          failures: [{ appointmentId: 3, error: "Appointment not found" }],
        },
      };

      mockApi.post.mockResolvedValue(mockResponse);

      const result = await bulkCancelAppointments([1, 2, 3], "Test reason");

      expect(result.success).toBe(true);
      if (result.success) {
        const value = result.value;
        if (!value) {
          throw new Error("Expected bulkCancelAppointments to return a value");
        }
        // Verify all fields use camelCase
        expect(value.successCount).toBe(2);
        expect(value.failureCount).toBe(1);
        expect(value.successes).toHaveLength(2);
        expect(value.failures).toHaveLength(1);

        // Verify nested objects also use camelCase
        expect(value.successes[0].appointmentId).toBe(1);
        expect(value.failures[0].appointmentId).toBe(3);

        // Verify snake_case fields are undefined (would cause bugs)
        const rawValue = value as unknown as Record<string, unknown>;
        expect("success_count" in rawValue).toBe(false);
        expect("failure_count" in rawValue).toBe(false);
      }
    });

    it("should handle all failures correctly with camelCase field names", async () => {
      const mockResponse = {
        data: {
          successCount: 0,
          failureCount: 2,
          successes: [],
          failures: [
            { appointmentId: 1, error: "Holiday blocks this treatment type" },
            { appointmentId: 2, error: "Slot unavailable" },
          ],
        },
      };

      mockApi.post.mockResolvedValue(mockResponse);

      const result = await bulkCancelAppointments([1, 2]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value?.successCount).toBe(0);
        expect(result.value?.failureCount).toBe(2);
        expect(result.value?.failures).toHaveLength(2);
      }
    });
  });

  describe("bulkPostponeAppointments", () => {
    it("should return response with camelCase field names after axios transformation", async () => {
      // Mock axios response (after interceptor transformation to camelCase)
      const mockResponse = {
        data: {
          successCount: 2,
          failureCount: 1,
          successes: [
            {
              appointmentId: 1,
              message: "Successfully postponed",
              newDate: "2026-02-17",
            },
            {
              appointmentId: 2,
              message: "Successfully postponed",
              newDate: "2026-02-17",
            },
          ],
          failures: [
            {
              appointmentId: 3,
              error:
                "Data 2026-02-17 is a holiday and blocks treatments of type Physiotherapy.",
            },
          ],
        },
      };

      mockApi.post.mockResolvedValue(mockResponse);

      const result = await bulkPostponeAppointments([1, 2, 3], "2026-02-17");

      expect(result.success).toBe(true);
      if (result.success) {
        const value = result.value;
        if (!value) {
          throw new Error("Expected bulkPostponeAppointments to return a value");
        }
        // Verify all fields use camelCase
        expect(value.successCount).toBe(2);
        expect(value.failureCount).toBe(1);
        expect(value.successes).toHaveLength(2);
        expect(value.failures).toHaveLength(1);

        // Verify nested objects also use camelCase
        expect(value.successes[0].appointmentId).toBe(1);
        expect(value.successes[0].newDate).toBe("2026-02-17");
        expect(value.failures[0].appointmentId).toBe(3);

        // Verify snake_case fields are undefined (would cause bugs)
        const rawValue = value as unknown as Record<string, unknown>;
        expect("success_count" in rawValue).toBe(false);
        expect("failure_count" in rawValue).toBe(false);

        const rawSuccess0 = value.successes[0] as unknown as Record<
          string,
          unknown
        >;
        expect("appointment_id" in rawSuccess0).toBe(false);
        expect("new_date" in rawSuccess0).toBe(false);
      }
    });

    it("should handle holiday blocking errors with camelCase field names", async () => {
      const mockResponse = {
        data: {
          successCount: 0,
          failureCount: 2,
          successes: [],
          failures: [
            {
              appointmentId: 1,
              error:
                "Data 2026-12-25 is a holiday and blocks treatments of type Physiotherapy.",
            },
            {
              appointmentId: 2,
              error:
                "Data 2026-12-25 is a holiday and blocks treatments of type TENS.",
            },
          ],
        },
      };

      mockApi.post.mockResolvedValue(mockResponse);

      const result = await bulkPostponeAppointments([1, 2], "2026-12-25");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value?.successCount).toBe(0);
        expect(result.value?.failureCount).toBe(2);
        expect(result.value?.failures).toHaveLength(2);

        // Verify error messages contain holiday blocking info
        expect(result.value?.failures[0].error).toContain("holiday");
        expect(result.value?.failures[0].error).toContain("Physiotherapy");
      }
    });
  });

  describe("Error handling", () => {
    it("should handle network errors correctly", async () => {
      const mockError = {
        response: { status: 500, data: {} },
      } as AxiosError;

      mockApi.post.mockRejectedValue(mockError);

      const result = await bulkPostponeAppointments([1], "2026-02-17");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it("should handle 400/409 errors with custom message", async () => {
      const mockError = {
        response: { status: 409, data: {} },
      } as AxiosError;

      mockApi.post.mockRejectedValue(mockError);

      const result = await bulkPostponeAppointments([1], "2026-02-17");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          "Date not available for some appointments, try to reschedule for another date",
        );
      }
    });

    it("should send appointment_ids and new_date when rescheduling", async () => {
      const mockResponse = {
        data: {
          successCount: 2,
          failureCount: 0,
          successes: [
            {
              appointmentId: 1,
              message: "Successfully postponed",
              newDate: "2026-03-10",
            },
            {
              appointmentId: 2,
              message: "Successfully postponed",
              newDate: "2026-03-10",
            },
          ],
          failures: [],
        },
      };

      mockApi.post.mockResolvedValue(mockResponse);

      await bulkPostponeAppointments([1, 2], "2026-03-10");

      expect(mockApi.post).toHaveBeenCalledWith("/appointments/bulk/postpone", {
        appointment_ids: [1, 2],
        new_date: "2026-03-10",
        reschedule_return_assessment: false,
      });
    });
  });
});
