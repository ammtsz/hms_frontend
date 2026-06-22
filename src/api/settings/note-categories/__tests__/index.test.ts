import {
  createNoteCategory,
  deleteNoteCategory,
  getNoteCategories,
  updateNoteCategory,
} from "../index";

import api from "@/api/lib/axios";

jest.mock("@/api/lib/axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  put: jest.fn(),
}));

const mockApi = api as jest.Mocked<typeof api>;

describe("Settings note categories API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getNoteCategories", () => {
    it("returns note categories on success", async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            isActive: true,
            value: "general",
            label: "General",
            sortOrder: 1,
            type: "note_category",
            createdAt: "2026-01-01",
            updatedAt: "2026-01-01",
          },
        ],
      };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await getNoteCategories(false);

      expect(mockApi.get).toHaveBeenCalledWith("/settings/note-categories", {
        params: {},
      });
      expect(result).toEqual({ success: true, value: mockResponse.data });
    });

    it("includes inactive when includeInactive=true", async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      await getNoteCategories(true);

      expect(mockApi.get).toHaveBeenCalledWith("/settings/note-categories", {
        params: { all: "true" },
      });
    });

    it("uses fallback message when response message is missing", async () => {
      mockApi.get.mockRejectedValue({ response: { status: 500 } });

      const result = await getNoteCategories(false);

      expect(result).toEqual({
        success: false,
        error: "Failed to load note categories",
      });
    });
  });

  describe("createNoteCategory", () => {
    it("creates note category on success", async () => {
      const mockValue = {
        id: 1,
        isActive: true,
        value: "general",
        label: "General",
        sortOrder: 1,
        type: "note_category",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      };

      mockApi.post.mockResolvedValue({ data: mockValue });

      const result = await createNoteCategory({
        value: "general",
        label: "General",
        sortOrder: 1,
      });

      expect(mockApi.post).toHaveBeenCalledWith("/settings/note-categories", {
        value: "general",
        label: "General",
        sortOrder: 1,
      });
      expect(result).toEqual({ success: true, value: mockValue });
    });

    it("prefers response message when present", async () => {
      mockApi.post.mockRejectedValue({
        response: { status: 400, data: { message: "Custom create error" } },
      });

      const result = await createNoteCategory({
        value: "x",
        label: "X",
      });

      expect(result).toEqual({ success: false, error: "Custom create error" });
    });
  });

  describe("updateNoteCategory", () => {
    it("updates note category on success", async () => {
      const mockValue = {
        id: 1,
        isActive: true,
        value: "general2",
        label: "General2",
        sortOrder: 1,
        type: "note_category",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      };

      mockApi.patch.mockResolvedValue({ data: mockValue });

      const result = await updateNoteCategory(1, {
        value: "general2",
        label: "General2",
      });

      expect(mockApi.patch).toHaveBeenCalledWith(
        "/settings/note-categories/1",
        { value: "general2", label: "General2" },
      );
      expect(result).toEqual({ success: true, value: mockValue });
    });

    it("uses fallback message when response message is missing", async () => {
      mockApi.patch.mockRejectedValue({ response: { status: 500 } });

      const result = await updateNoteCategory(999, { label: "X" });

      expect(result).toEqual({
        success: false,
        error: "Failed to update note category",
      });
    });
  });

  describe("deleteNoteCategory", () => {
    it("deletes note category on success", async () => {
      mockApi.delete.mockResolvedValue({});

      const result = await deleteNoteCategory(1);

      expect(mockApi.delete).toHaveBeenCalledWith(
        "/settings/note-categories/1",
      );
      expect(result).toEqual({ success: true });
    });

    it("uses fallback message when response message is missing", async () => {
      mockApi.delete.mockRejectedValue({ response: { status: 500 } });

      const result = await deleteNoteCategory(999);

      expect(result).toEqual({
        success: false,
        error: "Failed to delete note category",
      });
    });
  });
});

