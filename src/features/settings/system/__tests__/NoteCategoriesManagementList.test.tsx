import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import NoteCategoriesManagementList from "../NoteCategoriesManagementList";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { UserRole } from "@/types/auth";
import * as noteCategoryHooks from "@/api/query/hooks/useNoteCategoriesQueries";
import {
  SystemOptionType,
  type SystemOption,
} from "@/types/systemOptions";

jest.mock("@/contexts/AuthContext");
jest.mock("@/contexts/ToastContext");
jest.mock("@/api/query/hooks/useNoteCategoriesQueries");

describe("NoteCategoriesManagementList", () => {
  const mockShowToast = jest.fn();

  const categories: SystemOption[] = [
    {
      id: 1,
      type: SystemOptionType.NOTE_CATEGORY,
      value: "geral",
      label: "Geral",
      sortOrder: 1,
      isActive: true,
      usageCount: 4,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: 2,
      type: SystemOptionType.NOTE_CATEGORY,
      value: "treatment",
      label: "Tratamento",
      sortOrder: 2,
      isActive: false,
      usageCount: 1,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: 3,
      type: SystemOptionType.NOTE_CATEGORY,
      value: "alteracao_de_status",
      label: "Mudança de status",
      sortOrder: 3,
      isActive: true,
      usageCount: 2,
      createdAt: "",
      updatedAt: "",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    (useAuthContext as jest.Mock).mockReturnValue({
      user: { role: UserRole.ADMIN },
    });

    (useToast as jest.Mock).mockReturnValue({
      showToast: mockShowToast,
    });

    (noteCategoryHooks.useNoteCategories as jest.Mock).mockReturnValue({
      data: categories,
      isLoading: false,
      error: null,
    });

    (noteCategoryHooks.useUpdateNoteCategory as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue(categories[1]),
      isPending: false,
    });

    (noteCategoryHooks.useDeleteNoteCategory as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue(undefined),
      isPending: false,
    });

    (noteCategoryHooks.useCreateNoteCategory as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue(categories[1]),
      isPending: false,
    });
  });

  it("renders categories rows", () => {
    render(<NoteCategoriesManagementList />);

    expect(screen.getByText("geral")).toBeInTheDocument();
    expect(screen.getByText("Geral")).toBeInTheDocument();
    expect(screen.getByText("Tratamento")).toBeInTheDocument();
    expect(screen.getByText("alteracao_de_status")).toBeInTheDocument();

    expect(screen.getByText("4 nota(s)")).toBeInTheDocument();
  });

  it("toggles category active state", async () => {
    render(<NoteCategoriesManagementList />);

    // Enter edit mode for the first category row.
    fireEvent.click(screen.getAllByTitle("Editar rótulo")[0]);

    // Now toggle status via the status column button.
    fireEvent.click(screen.getByRole("button", { name: /Ativo/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        "Categoria desativada.",
        "success",
      );
    });
  });

  it("creates a new category", async () => {
    render(<NoteCategoriesManagementList />);

    fireEvent.click(screen.getByRole("button", { name: /Nova categoria/i }));

    const textboxes = screen.getAllByRole("textbox");
    expect(textboxes.length).toBeGreaterThanOrEqual(2);

    fireEvent.change(textboxes[0], { target: { value: "custom" } });
    fireEvent.change(textboxes[1], { target: { value: "Custom" } });

    fireEvent.click(screen.getByRole("button", { name: /Criar/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        "Categoria criada com sucesso.",
        "success",
      );
    });
  });

  it("shows validation error for invalid category code", async () => {
    render(<NoteCategoriesManagementList />);

    fireEvent.click(screen.getByRole("button", { name: /Nova categoria/i }));

    const textboxes = screen.getAllByRole("textbox");
    expect(textboxes.length).toBeGreaterThanOrEqual(2);

    fireEvent.change(textboxes[0], { target: { value: "status$change" } });
    fireEvent.change(textboxes[1], { target: { value: "Custom" } });

    fireEvent.click(screen.getByRole("button", { name: /Criar/i }));

    expect(
      screen.getByText(
        "Código inválido. Use apenas letras minúsculas (a-z), números (0-9), _ ou -.",
      ),
    ).toBeInTheDocument();
  });

  it("prevents editing/removing the 'alteracao_de_status' category", () => {
    render(<NoteCategoriesManagementList />);

    const statusRow = screen.getByText("alteracao_de_status").closest("tr");
    expect(statusRow).not.toBeNull();
    if (!statusRow) return;

    const titledElements = within(statusRow).getAllByTitle(
      /gerar notas/i,
    );
    const lockedButtons = titledElements.filter(
      (el) => el.tagName.toLowerCase() === "button",
    );
    expect(lockedButtons.length).toBeGreaterThanOrEqual(2);
    lockedButtons.forEach((btn) => expect(btn).toBeDisabled());

    const statusTag = within(statusRow).getByText("Ativo");
    expect(statusTag).toHaveAttribute(
      "title",
      expect.stringMatching(/Mudança de status|gerar notas/i),
    );
  });

  it("prevents removing the default 'geral' category", () => {
    render(<NoteCategoriesManagementList />);

    const generalRow = screen.getByText("geral").closest("tr");
    expect(generalRow).not.toBeNull();
    if (!generalRow) return;

    const deleteButton = within(generalRow).getByTitle(/categoria 'Geral'/i);
    expect(deleteButton).toBeDisabled();
  });
});
