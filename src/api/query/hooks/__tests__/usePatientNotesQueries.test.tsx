import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import {
  usePatientNotes,
  useCreatePatientNote,
  useUpdatePatientNote,
  useDeletePatientNote,
} from "../usePatientNotesQueries";
import * as patientsApi from "@/api/patients";
import type {
  PatientNoteResponseDto,
  CreatePatientNoteRequest,
} from "@/api/types";

// Mock the API
jest.mock("@/api/patients", () => ({
  getPatientNotes: jest.fn(),
  createPatientNote: jest.fn(),
  updatePatientNote: jest.fn(),
  deletePatientNote: jest.fn(),
}));

const mockedPatientsApi = patientsApi as jest.Mocked<typeof patientsApi>;

// Test setup helpers
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "QueryClientWrapper";
  return Wrapper;
}

// Mock data
const mockPatientId = "123";
const mockNotes: PatientNoteResponseDto[] = [
  {
    id: 1,
    patientId: parseInt(mockPatientId),
    noteContent: "Test note 1",
    category: "general",
    createdDate: "2023-01-01",
    createdTime: "10:00:00",
    updatedDate: "2023-01-01",
    updatedTime: "10:00:00",
  },
  {
    id: 2,
    patientId: parseInt(mockPatientId),
    noteContent: "Test note 2",
    category: "treatment",
    createdDate: "2023-01-02",
    createdTime: "10:00:00",
    updatedDate: "2023-01-02",
    updatedTime: "10:00:00",
  },
];

const mockCreateNoteData: CreatePatientNoteRequest = {
  noteContent: "New test note",
  category: "general",
};

const mockCreatedNote: PatientNoteResponseDto = {
  id: 3,
  patientId: parseInt(mockPatientId),
  noteContent: "New test note",
  category: "general",
  createdDate: "2023-01-03",
  createdTime: "10:00:00",
  updatedDate: "2023-01-03",
  updatedTime: "10:00:00",
};

describe("usePatientNotesQueries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("usePatientNotes", () => {
    it("should fetch patient notes successfully", async () => {
      mockedPatientsApi.getPatientNotes.mockResolvedValue({
        success: true,
        value: mockNotes,
      });

      const { result } = renderHook(() => usePatientNotes(mockPatientId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockNotes);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockedPatientsApi.getPatientNotes).toHaveBeenCalledWith(
        mockPatientId
      );
    });

    it("should handle fetch error", async () => {
      const errorMessage = "Failed to fetch notes";
      mockedPatientsApi.getPatientNotes.mockResolvedValue({
        success: false,
        error: errorMessage,
      });

      const { result } = renderHook(() => usePatientNotes(mockPatientId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe(errorMessage);
    });

    it("should not fetch when patientId is empty", () => {
      const { result } = renderHook(() => usePatientNotes(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockedPatientsApi.getPatientNotes).not.toHaveBeenCalled();
    });
  });

  describe("useCreatePatientNote", () => {
    it("should create patient note successfully", async () => {
      mockedPatientsApi.createPatientNote.mockResolvedValue({
        success: true,
        value: mockCreatedNote,
      });

      const { result } = renderHook(() => useCreatePatientNote(), {
        wrapper: createWrapper(),
      });

      const createResult = await result.current.mutateAsync({
        patientId: mockPatientId,
        noteData: mockCreateNoteData,
      });

      expect(createResult).toEqual(mockCreatedNote);
      expect(mockedPatientsApi.createPatientNote).toHaveBeenCalledWith(
        mockPatientId,
        mockCreateNoteData
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it("should handle create error", async () => {
      const errorMessage = "Failed to create note";
      mockedPatientsApi.createPatientNote.mockResolvedValue({
        success: false,
        error: errorMessage,
      });

      const { result } = renderHook(() => useCreatePatientNote(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({
          patientId: mockPatientId,
          noteData: mockCreateNoteData,
        })
      ).rejects.toThrow(errorMessage);

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe("useUpdatePatientNote", () => {
    it("should update patient note successfully", async () => {
      const updatedNote = { ...mockNotes[0], noteContent: "Updated note" };
      mockedPatientsApi.updatePatientNote.mockResolvedValue({
        success: true,
        value: updatedNote,
      });

      const { result } = renderHook(() => useUpdatePatientNote(), {
        wrapper: createWrapper(),
      });

      const updateResult = await result.current.mutateAsync({
        patientId: mockPatientId,
        noteId: "1",
        noteData: { noteContent: "Updated note" },
      });

      expect(updateResult).toEqual(updatedNote);
      expect(mockedPatientsApi.updatePatientNote).toHaveBeenCalledWith(
        mockPatientId,
        "1",
        { noteContent: "Updated note" }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it("should handle update error", async () => {
      const errorMessage = "Failed to update note";
      mockedPatientsApi.updatePatientNote.mockResolvedValue({
        success: false,
        error: errorMessage,
      });

      const { result } = renderHook(() => useUpdatePatientNote(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({
          patientId: mockPatientId,
          noteId: "1",
          noteData: { noteContent: "Updated note" },
        })
      ).rejects.toThrow(errorMessage);

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe("useDeletePatientNote", () => {
    it("should delete patient note successfully", async () => {
      mockedPatientsApi.deletePatientNote.mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useDeletePatientNote(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        patientId: mockPatientId,
        noteId: "1",
      });

      expect(mockedPatientsApi.deletePatientNote).toHaveBeenCalledWith(
        mockPatientId,
        "1"
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it("should handle delete error", async () => {
      const errorMessage = "Failed to delete note";
      mockedPatientsApi.deletePatientNote.mockResolvedValue({
        success: false,
        error: errorMessage,
      });

      const { result } = renderHook(() => useDeletePatientNote(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({
          patientId: mockPatientId,
          noteId: "1",
        })
      ).rejects.toThrow(errorMessage);

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });
});
