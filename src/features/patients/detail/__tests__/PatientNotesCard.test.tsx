import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PatientNotesCard } from "../PatientNotesCard";
import * as patientsApi from "@/api/patients";
import type { PatientNoteResponseDto } from "@/api/types";
import { useNoteCategories } from "@/api/query/hooks/useNoteCategoriesQueries";
import { SystemOptionType, type SystemOption } from "@/types/systemOptions";

// Mock the API functions
jest.mock("@/api/patients", () => ({
  getPatientNotes: jest.fn(),
  createPatientNote: jest.fn(),
  updatePatientNote: jest.fn(),
  deletePatientNote: jest.fn(),
}));

jest.mock("@/api/query/hooks/useNoteCategoriesQueries");

// Mock the formatDateBR utility
jest.mock("@/utils/dateUtils", () => ({
  formatDateBR: jest.fn((date: string) => {
    const mockDate = new Date(date);
    return mockDate.toLocaleDateString("pt-BR");
  }),
}));

// Expand card in tests by mimicking scroll-from-nav (context sets target to notes section)
jest.mock("@/features/patients/detail/PatientPageSectionNav", () => {
  const actual = jest.requireActual(
    "@/features/patients/detail/PatientPageSectionNav",
  );
  return {
    ...actual,
    usePatientPageScrollTarget: () => ({
      scrollTargetSectionId: "patient-section-notes",
      setScrollTargetSectionId: jest.fn(),
    }),
  };
});

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

// Helper to render with QueryClient wrapper
const renderWithQueryClient = (component: React.ReactElement) => {
  const TestWrapper = createWrapper();
  return render(<TestWrapper>{component}</TestWrapper>);
};

const mockGetPatientNotes = patientsApi.getPatientNotes as jest.MockedFunction<
  typeof patientsApi.getPatientNotes
>;
const mockCreatePatientNote =
  patientsApi.createPatientNote as jest.MockedFunction<
    typeof patientsApi.createPatientNote
  >;
const mockUpdatePatientNote =
  patientsApi.updatePatientNote as jest.MockedFunction<
    typeof patientsApi.updatePatientNote
  >;
const mockDeletePatientNote =
  patientsApi.deletePatientNote as jest.MockedFunction<
    typeof patientsApi.deletePatientNote
  >;

const createMockNote = (
  id: number,
  overrides?: Partial<PatientNoteResponseDto>,
): PatientNoteResponseDto => ({
  id,
  patientId: 123,
  noteContent: `Test note content ${id}`,
  category: "general",
  createdDate: "2025-01-15",
  createdTime: "10:30:00",
  updatedDate: "2025-01-15",
  updatedTime: "10:30:00",
  ...overrides,
});

describe("PatientNotesCard", () => {
  const defaultProps = {
    patientId: "123",
    sectionId: "patient-section-notes" as const,
  };

  const mockNoteCategories: SystemOption[] = [
    {
      id: 1,
      type: SystemOptionType.NOTE_CATEGORY,
      value: "general",
      label: "Geral",
      sortOrder: 1,
      isActive: true,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    {
      id: 2,
      type: SystemOptionType.NOTE_CATEGORY,
      value: "treatment",
      label: "Tratamento",
      sortOrder: 2,
      isActive: true,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    {
      id: 3,
      type: SystemOptionType.NOTE_CATEGORY,
      value: "observation",
      label: "Observação",
      sortOrder: 3,
      isActive: true,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    {
      id: 4,
      type: SystemOptionType.NOTE_CATEGORY,
      value: "emergency",
      label: "Emergência",
      sortOrder: 4,
      isActive: true,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    {
      id: 5,
      type: SystemOptionType.NOTE_CATEGORY,
      value: "family",
      label: "Família",
      sortOrder: 5,
      isActive: true,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    (useNoteCategories as jest.Mock).mockReturnValue({
      data: mockNoteCategories,
      isLoading: false,
      error: null,
    });
  });

  it("renders empty state when no notes exist", async () => {
    mockGetPatientNotes.mockResolvedValue({ success: true, value: [] });

    renderWithQueryClient(<PatientNotesCard {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByText("Nenhuma nota adicionada ainda."),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        'Clique em "+ Adicionar" para adicionar observações importantes.',
      ),
    ).toBeInTheDocument();
  });

  it("renders notes list when notes exist", async () => {
    const mockNotes = [
      createMockNote(1, { noteContent: "First note", category: "treatment" }),
      createMockNote(2, {
        noteContent: "Second note",
        category: "observation",
      }),
    ];

    mockGetPatientNotes.mockResolvedValue({ success: true, value: mockNotes });

    renderWithQueryClient(<PatientNotesCard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("First note")).toBeInTheDocument();
      expect(screen.getByText("Second note")).toBeInTheDocument();
    });

    expect(screen.getByText("TRATAMENTO")).toBeInTheDocument();
    expect(screen.getByText("OBSERVAÇÃO")).toBeInTheDocument();
  });

  it("handles API error when loading notes", async () => {
    mockGetPatientNotes.mockResolvedValue({
      success: false,
      error: "Paciente não encontrado",
    });

    renderWithQueryClient(<PatientNotesCard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Paciente não encontrado")).toBeInTheDocument();
    });
  });

  it("allows adding a new note", async () => {
    const newNote = createMockNote(1, { noteContent: "New test note" });

    // Initially return empty list
    mockGetPatientNotes.mockResolvedValueOnce({ success: true, value: [] });
    // After mutation, return the note in subsequent calls
    mockGetPatientNotes.mockResolvedValue({ success: true, value: [newNote] });
    mockCreatePatientNote.mockResolvedValue({ success: true, value: newNote });

    renderWithQueryClient(<PatientNotesCard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("+ Adicionar")).toBeInTheDocument();
    });

    // Click "+ Adicionar" button
    fireEvent.click(screen.getByText("+ Adicionar"));

    // Form should appear
    expect(screen.getByPlaceholderText("Digite a nota...")).toBeInTheDocument();
    expect(screen.getByText("Categoria")).toBeInTheDocument();

    // Fill form
    fireEvent.change(screen.getByPlaceholderText("Digite a nota..."), {
      target: { value: "New test note" },
    });

    // Submit form
    fireEvent.click(screen.getByText("Salvar Nota"));

    await waitFor(() => {
      expect(mockCreatePatientNote).toHaveBeenCalledWith("123", {
        noteContent: "New test note",
        category: "geral",
      });
    });

    // Note should appear in the list
    await waitFor(() => {
      expect(screen.getByText("New test note")).toBeInTheDocument();
    });
  });

  it("allows editing an existing note", async () => {
    const mockNote = createMockNote(1, { noteContent: "Original note" });
    const updatedNote = createMockNote(1, { noteContent: "Updated note" });

    // Initially return original note
    mockGetPatientNotes.mockResolvedValueOnce({
      success: true,
      value: [mockNote],
    });
    // After mutation, return updated note
    mockGetPatientNotes.mockResolvedValue({
      success: true,
      value: [updatedNote],
    });
    mockUpdatePatientNote.mockResolvedValue({
      success: true,
      value: updatedNote,
    });

    renderWithQueryClient(<PatientNotesCard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Original note")).toBeInTheDocument();
    });

    // Click edit button
    fireEvent.click(screen.getByText("Editar"));

    // Edit form should appear
    const textarea = screen.getByDisplayValue("Original note");
    expect(textarea).toBeInTheDocument();

    // Update content
    fireEvent.change(textarea, { target: { value: "Updated note" } });

    // Save changes (edit form uses "Salvar", add form uses "Salvar Nota")
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(mockUpdatePatientNote).toHaveBeenCalledWith("123", "1", {
        noteContent: "Updated note",
      });
    });

    // Updated content should appear
    await waitFor(() => {
      expect(screen.getByText("Updated note")).toBeInTheDocument();
    });
  });

  it("allows deleting a note with confirmation", async () => {
    const mockNote = createMockNote(1, { noteContent: "Note to delete" });

    // Initially return note with content
    mockGetPatientNotes.mockResolvedValueOnce({
      success: true,
      value: [mockNote],
    });
    // After deletion, return empty list
    mockGetPatientNotes.mockResolvedValue({ success: true, value: [] });
    mockDeletePatientNote.mockResolvedValue({ success: true });

    renderWithQueryClient(<PatientNotesCard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Note to delete")).toBeInTheDocument();
    });

    // Click delete button
    fireEvent.click(screen.getByText("Excluir"));

    // Confirmation should appear
    expect(
      screen.getByText("Tem certeza que deseja excluir esta nota?"),
    ).toBeInTheDocument();

    // Confirm deletion (select the confirmation button, not the initial delete button)
    const confirmButtons = screen.getAllByText("Excluir");
    fireEvent.click(confirmButtons[1]); // The confirmation button

    await waitFor(() => {
      expect(mockDeletePatientNote).toHaveBeenCalledWith("123", "1");
    });

    // Note should be removed from the list
    await waitFor(() => {
      expect(screen.queryByText("Note to delete")).not.toBeInTheDocument();
    });
  });

  it("allows canceling note deletion", async () => {
    const mockNote = createMockNote(1, { noteContent: "Note to keep" });
    mockGetPatientNotes.mockResolvedValue({ success: true, value: [mockNote] });

    renderWithQueryClient(<PatientNotesCard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Note to keep")).toBeInTheDocument();
    });

    // Click delete button
    fireEvent.click(screen.getByText("Excluir"));

    // Confirmation should appear
    expect(
      screen.getByText("Tem certeza que deseja excluir esta nota?"),
    ).toBeInTheDocument();

    // Cancel deletion
    fireEvent.click(screen.getByText("Cancelar"));

    // Confirmation should disappear
    expect(
      screen.queryByText("Tem certeza que deseja excluir esta nota?"),
    ).not.toBeInTheDocument();

    // Note should still be there
    expect(screen.getByText("Note to keep")).toBeInTheDocument();
  });

  it("validates form inputs", async () => {
    mockGetPatientNotes.mockResolvedValue({ success: true, value: [] });

    renderWithQueryClient(<PatientNotesCard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("+ Adicionar")).toBeInTheDocument();
    });

    // Click "+ Adicionar" button
    fireEvent.click(screen.getByText("+ Adicionar"));

    // Submit button should be disabled when content is empty
    const submitButton = screen.getByText("Salvar Nota");
    expect(submitButton).toBeDisabled();

    // Add content
    fireEvent.change(screen.getByPlaceholderText("Digite a nota..."), {
      target: { value: "Test content" },
    });

    // Submit button should be enabled
    expect(submitButton).not.toBeDisabled();
  });

  it("shows character count for note content", async () => {
    mockGetPatientNotes.mockResolvedValue({ success: true, value: [] });

    renderWithQueryClient(<PatientNotesCard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("+ Adicionar")).toBeInTheDocument();
    });

    // Click "+ Adicionar" button
    fireEvent.click(screen.getByText("+ Adicionar"));

    // Character count should start at 0
    expect(screen.getByText("0/2000 caracteres")).toBeInTheDocument();

    // Add content
    const testContent = "Test note content";
    fireEvent.change(screen.getByPlaceholderText("Digite a nota..."), {
      target: { value: testContent },
    });

    // Character count should update
    expect(
      screen.getByText(`${testContent.length}/2000 caracteres`),
    ).toBeInTheDocument();
  });

  it("handles different note categories correctly", async () => {
    const mockNotes = [
      createMockNote(1, { category: "treatment" }),
      createMockNote(2, { category: "emergency" }),
      createMockNote(3, { category: "family" }),
    ];

    mockGetPatientNotes.mockResolvedValue({ success: true, value: mockNotes });

    renderWithQueryClient(<PatientNotesCard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("TRATAMENTO")).toBeInTheDocument();
      expect(screen.getByText("EMERGÊNCIA")).toBeInTheDocument();
      expect(screen.getByText("FAMÍLIA")).toBeInTheDocument();
    });
  });
});
