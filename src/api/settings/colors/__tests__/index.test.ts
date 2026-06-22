import {
  checkSimilarColors,
  createColor,
  deleteColor,
  getColors,
  updateColor,
} from "../index";

import api from "@/api/lib/axios";

jest.mock("@/api/lib/axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

const mockApi = api as jest.Mocked<typeof api>;

describe("Settings colors API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getColors", () => {
    it("returns colors on success", async () => {
      const mockResponse = { data: [{ id: 1, isActive: true, value: "r", label: "Red", type: "color", createdAt: "2026-01-01", updatedAt: "2026-01-01" }] };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getColors(false);

      expect(mockApi.get).toHaveBeenCalledWith("/settings/colors", {
        params: {},
      });
      expect(result).toEqual({ success: true, value: mockResponse.data });
    });

    it("returns status-mapped error on failure", async () => {
      mockApi.get.mockRejectedValue({ response: { status: 404 } });

      const result = await getColors(true);

      expect(mockApi.get).toHaveBeenCalledWith("/settings/colors", {
        params: { all: "true" },
      });
      expect(result).toEqual({ success: false, error: "Option not found" });
    });
  });

  describe("checkSimilarColors", () => {
    it("returns similar options on success", async () => {
      const mockResponse = {
        data: [{ id: 1, value: "blue", similarity: 0.9 }],
      };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await checkSimilarColors("blu");

      expect(mockApi.get).toHaveBeenCalledWith(
        "/settings/colors/check-similar",
        { params: { value: "blu" } },
      );
      expect(result).toEqual({ success: true, value: mockResponse.data });
    });

    it("returns status-mapped error on failure", async () => {
      mockApi.get.mockRejectedValue({ response: { status: 409 } });

      const result = await checkSimilarColors("blu");

      expect(result).toEqual({ success: false, error: "This name already exists" });
    });
  });

  describe("createColor", () => {
    it("creates color and returns success", async () => {
      const mockColor = {
        id: 1,
        isActive: true,
        value: "red",
        label: "Red",
        type: "color",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      };

      mockApi.post.mockResolvedValue({ data: mockColor });

      const result = await createColor("red");

      expect(mockApi.post).toHaveBeenCalledWith("/settings/colors", { value: "red" });
      expect(result).toEqual({ success: true, value: mockColor });
    });

    it("prefers response message when present", async () => {
      mockApi.post.mockRejectedValue({
        response: { status: 400, data: { message: "Custom message" } },
      });

      const result = await createColor("red");

      expect(result).toEqual({ success: false, error: "Custom message" });
    });
  });

  describe("updateColor", () => {
    it("updates color and returns success", async () => {
      const mockColor = {
        id: 1,
        isActive: true,
        value: "green",
        label: "Green",
        type: "color",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      };

      mockApi.put.mockResolvedValue({ data: mockColor });

      const result = await updateColor(1, { label: "Green", isActive: true });

      expect(mockApi.put).toHaveBeenCalledWith(
        "/settings/colors/1",
        { label: "Green", isActive: true },
      );
      expect(result).toEqual({ success: true, value: mockColor });
    });

    it("returns status-mapped error on failure", async () => {
      mockApi.put.mockRejectedValue({ response: { status: 404 } });

      const result = await updateColor(999, { label: "X" });

      expect(result).toEqual({ success: false, error: "Option not found" });
    });
  });

  describe("deleteColor", () => {
    it("deletes color and returns success", async () => {
      mockApi.delete.mockResolvedValue({});

      const result = await deleteColor(1);

      expect(mockApi.delete).toHaveBeenCalledWith("/settings/colors/1");
      expect(result).toEqual({ success: true });
    });

    it("returns status-mapped error on failure", async () => {
      mockApi.delete.mockRejectedValue({ response: { status: 404 } });

      const result = await deleteColor(999);

      expect(result).toEqual({ success: false, error: "Option not found" });
    });
  });
});

