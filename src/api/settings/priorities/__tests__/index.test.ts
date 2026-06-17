import {
  bulkUpdatePatientsPriority,
  deactivatePriorityOption,
  getPriorities,
  updatePriorityOption,
} from "../index";

import api from "@/api/lib/axios";

jest.mock("@/api/lib/axios", () => ({
  get: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
}));

const mockApi = api as jest.Mocked<typeof api>;

describe("Settings priorities API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getPriorities", () => {
    it("returns priorities on success", async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            isActive: true,
            value: "1",
            label: "Exceção",
            sortOrder: 1,
            type: "priority",
            createdAt: "2026-01-01",
            updatedAt: "2026-01-01",
          },
        ],
      };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getPriorities(false);

      expect(mockApi.get).toHaveBeenCalledWith("/settings/priorities", {
        params: {},
      });
      expect(result).toEqual({ success: true, value: mockResponse.data });
    });

    it("includes inactive when includeInactive=true", async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      await getPriorities(true);

      expect(mockApi.get).toHaveBeenCalledWith("/settings/priorities", {
        params: { all: "true" },
      });
    });

    it("maps status codes to user messages", async () => {
      mockApi.get.mockRejectedValue({ response: { status: 404 } });

      const result = await getPriorities(false);

      expect(result).toEqual({ success: false, error: "Prioridade não encontrada" });
    });
  });

  describe("updatePriorityOption", () => {
    it("updates priority and returns success", async () => {
      const mockValue = {
        id: 1,
        isActive: true,
        value: "2",
        label: "Intermediária",
        sortOrder: 2,
        type: "priority",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      };

      mockApi.patch.mockResolvedValue({ data: mockValue });

      const result = await updatePriorityOption(1, {
        label: "Intermediária",
        isActive: true,
      });

      expect(mockApi.patch).toHaveBeenCalledWith("/settings/priorities/1", {
        label: "Intermediária",
        isActive: true,
      });
      expect(result).toEqual({ success: true, value: mockValue });
    });

    it("prefers response message when present", async () => {
      mockApi.patch.mockRejectedValue({
        response: { status: 400, data: { message: "Custom update error" } },
      });

      const result = await updatePriorityOption(1, { label: "X" });

      expect(result).toEqual({ success: false, error: "Custom update error" });
    });
  });

  describe("deactivatePriorityOption", () => {
    it("returns success on deactivate", async () => {
      const mockValue = {
        id: 1,
        isActive: false,
        value: "2",
        label: "Intermediária",
        sortOrder: 2,
        type: "priority",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      };

      mockApi.patch.mockResolvedValue({ data: mockValue });

      const result = await deactivatePriorityOption(1);

      expect(mockApi.patch).toHaveBeenCalledWith(
        "/settings/priorities/1/deactivate",
      );
      expect(result).toEqual({ success: true, value: mockValue });
    });

    it("returns blockingPatients on 409 conflict", async () => {
      mockApi.patch.mockRejectedValue({
        response: {
          status: 409,
          data: {
            message: "Prioridade em uso",
            blockingPatients: [{ id: 2, name: "Paciente 2", priority: "3" }],
          },
        },
      });

      const result = await deactivatePriorityOption(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Prioridade em uso");
      expect(result.blockingPatients).toEqual([
        { id: 2, name: "Paciente 2", priority: "3" },
      ]);
    });

    it("maps non-409 status codes to user messages", async () => {
      mockApi.patch.mockRejectedValue({ response: { status: 404 } });

      const result = await deactivatePriorityOption(999);

      expect(result).toEqual({
        success: false,
        error: "Prioridade não encontrada",
      });
    });
  });

  describe("bulkUpdatePatientsPriority", () => {
    it("returns success on bulk update", async () => {
      mockApi.patch.mockResolvedValue({ data: { updatedCount: 2 } });

      const result = await bulkUpdatePatientsPriority({
        patientIds: [1, 2],
        priority: "2",
      });

      expect(mockApi.patch).toHaveBeenCalledWith(
        "/settings/patients/bulk-priority",
        { patientIds: [1, 2], priority: "2" },
      );
      expect(result).toEqual({ success: true, value: { updatedCount: 2 } });
    });

    it("prefers response message when present", async () => {
      mockApi.patch.mockRejectedValue({
        response: { status: 400, data: { message: "Custom bulk error" } },
      });

      const result = await bulkUpdatePatientsPriority({
        patientIds: [1],
        priority: "2",
      });

      expect(result).toEqual({ success: false, error: "Custom bulk error" });
    });
  });
});

