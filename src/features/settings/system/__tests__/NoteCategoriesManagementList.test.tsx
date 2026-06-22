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
import { SystemOptionType, type SystemOption } from "@/types/systemOptions";

jest.mock("@/contexts/AuthContext");
jest.mock("@/contexts/ToastContext");
jest.mock("@/api/query/hooks/useNoteCategoriesQueries");

describe("NoteCategoriesManagementList", () => {
  const mockShowToast = jest.fn();

  const categories: SystemOption[] = [
    {
      id: 1,
      type: SystemOptionType.NOTE_CATEGORY,
      value: "general",
      label: "General",
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
      label: "Treatment",
      sortOrder: 2,
      isActive: false,
      usageCount: 1,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: 3,
      type: SystemOptionType.NOTE_CATEGORY,
      value: "status_change",
      label: "Status change",
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

    expect(screen.getByText("general")).toBeInTheDocument();
    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("Treatment")).toBeInTheDocument();
    expect(screen.getByText("status_change")).toBeInTheDocument();

    expect(screen.getByText("4 note(s)")).toBeInTheDocument();
  });

  it("toggles category active state", async () => {
    render(<NoteCategoriesManagementList />);

    // Enter edit mode for the first category row.
    fireEvent.click(screen.getAllByTitle("Edit label")[0]);

    // Now toggle status via the status column button.
    fireEvent.click(screen.getByRole("button", { name: /Active/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        "Category deactivated.",
        "success",
      );
    });
  });

  it("creates a new category", async () => {
    render(<NoteCategoriesManagementList />);

    fireEvent.click(screen.getByRole("button", { name: /New note category/i }));

    const textboxes = screen.getAllByRole("textbox");
    expect(textboxes.length).toBeGreaterThanOrEqual(2);

    fireEvent.change(textboxes[0], { target: { value: "custom" } });
    fireEvent.change(textboxes[1], { target: { value: "Custom" } });

    fireEvent.click(screen.getByRole("button", { name: /Create/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        "Category created successfully.",
        "success",
      );
    });
  });

  it("shows validation error for invalid category code", async () => {
    render(<NoteCategoriesManagementList />);

    fireEvent.click(screen.getByRole("button", { name: /New note category/i }));

    const textboxes = screen.getAllByRole("textbox");
    expect(textboxes.length).toBeGreaterThanOrEqual(2);

    fireEvent.change(textboxes[0], { target: { value: "status$change" } });
    fireEvent.change(textboxes[1], { target: { value: "Custom" } });

    fireEvent.click(screen.getByRole("button", { name: /Create/i }));

    expect(
      screen.getByText(
        "Invalid code. Use only lowercase letters (a-z), numbers (0-9), _ or -.",
      ),
    ).toBeInTheDocument();
  });

  it("prevents editing/removing the 'status_change' category", () => {
    render(<NoteCategoriesManagementList />);

    const statusRow = screen.getByText("status_change").closest("tr");
    expect(statusRow).not.toBeNull();
    if (!statusRow) return;

    const titledElements = within(statusRow).getAllByTitle(
      /generate automatic notes/i,
    );
    const lockedButtons = titledElements.filter(
      (el) => el.tagName.toLowerCase() === "button",
    );
    expect(lockedButtons.length).toBeGreaterThanOrEqual(2);
    lockedButtons.forEach((btn) => expect(btn).toBeDisabled());

    const statusTag = within(statusRow).getByText("Active");
    expect(statusTag).toHaveAttribute(
      "title",
      expect.stringMatching(/Status change|generate automatic notes/i),
    );
  });

  it("prevents removing the default 'general' category", () => {
    render(<NoteCategoriesManagementList />);

    const generalRow = screen.getByText("general").closest("tr");
    expect(generalRow).not.toBeNull();
    if (!generalRow) return;

    const deleteButton = within(generalRow).getByTitle(
      /General.*category cannot be removed/i,
    );
    expect(deleteButton).toBeDisabled();
  });
});
