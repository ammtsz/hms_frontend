import {
  checkSimilarBodyLocations,
  createBodyLocation,
  deleteBodyLocation,
  getBodyLocations,
  updateBodyLocation,
} from "../index";

import api from "@/api/lib/axios";

jest.mock("@/api/lib/axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

const mockApi = api as jest.Mocked<typeof api>;

describe("Settings body locations API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getBodyLocations", () => {
    it("returns body locations on success", async () => {
      const mockResponse = {
        data: [{ id: 1, isActive: true, value: "Arm", createdAt: "2026-01-01", updatedAt: "2026-01-01", type: "body_location" }],
      };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getBodyLocations(false);

      expect(mockApi.get).toHaveBeenCalledWith("/settings/body-locations", {
        params: {},
      });
      expect(result).toEqual({ success: true, value: mockResponse.data });
    });

    it("includes inactive when includeInactive=true", async () => {
      const mockResponse = { data: [] as unknown[] };
      mockApi.get.mockResolvedValue(mockResponse);

      await getBodyLocations(true);

      expect(mockApi.get).toHaveBeenCalledWith("/settings/body-locations", {
        params: { all: "true" },
      });
    });

    it("maps status codes to user messages", async () => {
      mockApi.get.mockRejectedValue({ response: { status: 404 } });

      const result = await getBodyLocations(false);

      expect(result).toEqual({ success: false, error: "Opção não encontrada" });
    });
  });

  describe("checkSimilarBodyLocations", () => {
    it("returns similar options on success", async () => {
      const mockResponse = { data: [{ id: 1, value: "Leg", similarity: 0.8 }] };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await checkSimilarBodyLocations("Leg");

      expect(mockApi.get).toHaveBeenCalledWith(
        "/settings/body-locations/check-similar",
        { params: { value: "Leg" } },
      );
      expect(result).toEqual({ success: true, value: mockResponse.data });
    });

    it("maps status codes to user messages", async () => {
      mockApi.get.mockRejectedValue({ response: { status: 409 } });

      const result = await checkSimilarBodyLocations("X");

      expect(result).toEqual({ success: false, error: "Este nome já existe" });
    });
  });

  describe("createBodyLocation", () => {
    it("creates body location and returns success", async () => {
      const mockValue = {
        id: 1,
        isActive: true,
        value: "Arm",
        label: "Arm",
        type: "body_location",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      };

      mockApi.post.mockResolvedValue({ data: mockValue });

      const result = await createBodyLocation("Arm");

      expect(mockApi.post).toHaveBeenCalledWith("/settings/body-locations", {
        value: "Arm",
      });
      expect(result).toEqual({ success: true, value: mockValue });
    });

    it("prefers response message when present", async () => {
      mockApi.post.mockRejectedValue({
        response: { status: 409, data: { message: "Custom conflict" } },
      });

      const result = await createBodyLocation("Arm");

      expect(result).toEqual({ success: false, error: "Custom conflict" });
    });
  });

  describe("updateBodyLocation", () => {
    it("updates body location and returns success", async () => {
      const mockValue = {
        id: 1,
        isActive: true,
        value: "Arm2",
        type: "body_location",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      };

      mockApi.put.mockResolvedValue({ data: mockValue });

      const result = await updateBodyLocation(1, {
        label: "Arm2",
        isActive: true,
      });

      expect(mockApi.put).toHaveBeenCalledWith("/settings/body-locations/1", {
        label: "Arm2",
        isActive: true,
      });
      expect(result).toEqual({ success: true, value: mockValue });
    });

    it("maps status codes to user messages", async () => {
      mockApi.put.mockRejectedValue({ response: { status: 404 } });

      const result = await updateBodyLocation(999, { label: "X" });

      expect(result).toEqual({ success: false, error: "Opção não encontrada" });
    });
  });

  describe("deleteBodyLocation", () => {
    it("deletes body location and returns success", async () => {
      mockApi.delete.mockResolvedValue({});

      const result = await deleteBodyLocation(1);

      expect(mockApi.delete).toHaveBeenCalledWith("/settings/body-locations/1");
      expect(result).toEqual({ success: true });
    });

    it("maps status codes to user messages", async () => {
      mockApi.delete.mockRejectedValue({ response: { status: 400 } });

      const result = await deleteBodyLocation(999);

      expect(result).toEqual({ success: false, error: "Requisição inválida" });
    });
  });
});

