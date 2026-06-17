import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import PriorityManagementList from "../PriorityManagementList";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { UserRole } from "@/types/auth";
import * as priorityHooks from "@/api/query/hooks/usePriorityOptionsQueries";
import {
  SystemOptionType,
  type SystemOption,
} from "@/types/systemOptions";
import type { Priority } from "@/types/types";

jest.mock("@/contexts/AuthContext");
jest.mock("@/contexts/ToastContext");
jest.mock("@/api/query/hooks/usePriorityOptionsQueries");

describe("PriorityManagementList", () => {
  const mockShowToast = jest.fn();
  const mockRefetch = jest.fn();

  const priorities: SystemOption[] = [
    {
      id: 1,
      type: SystemOptionType.PRIORITY,
      value: "1",
      label: "Exceção",
      sortOrder: 1,
      isActive: true,
      usageCount: 5,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: 2,
      type: SystemOptionType.PRIORITY,
      value: "2",
      label: "Idoso/crianças",
      sortOrder: 2,
      isActive: true,
      usageCount: 2,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: 3,
      type: SystemOptionType.PRIORITY,
      value: "3",
      label: "Padrão",
      sortOrder: 3,
      isActive: true,
      usageCount: 3,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: 4,
      type: SystemOptionType.PRIORITY,
      value: "4",
      label: "Idoso 80+",
      sortOrder: 4,
      isActive: false,
      usageCount: 0,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: 5,
      type: SystemOptionType.PRIORITY,
      value: "5",
      label: "Outros",
      sortOrder: 5,
      isActive: false,
      usageCount: 0,
      createdAt: "",
      updatedAt: "",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockRefetch.mockResolvedValue({ data: priorities });

    (useAuthContext as jest.Mock).mockReturnValue({
      user: { role: UserRole.ADMIN },
    });

    (useToast as jest.Mock).mockReturnValue({
      showToast: mockShowToast,
    });

    (priorityHooks.usePriorities as jest.Mock).mockReturnValue({
      data: priorities,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    (priorityHooks.useUpdatePriorityOption as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    (priorityHooks.useDeactivatePriorityOption as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    (priorityHooks.useBulkUpdatePatientsPriority as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });
  });

  it("renders all priority rows", () => {
    render(<PriorityManagementList />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();

    expect(screen.getByText("Exceção")).toBeInTheDocument();
    expect(screen.getByText("Idoso/crianças")).toBeInTheDocument();
    expect(screen.getByText("Padrão")).toBeInTheDocument();

    expect(screen.getByText("3 paciente(s)")).toBeInTheDocument();
  });

  it("blocks deactivation and performs bulk reassign", async () => {
    const blockingPatients = [
      { id: 10, name: "João Silva", priority: "3" as Priority },
      { id: 11, name: "Maria Santos", priority: "3" as Priority },
    ];

    const deactivateMutateAsync = jest
      .fn()
      .mockResolvedValueOnce({
        success: false,
        error: "blocked",
        blockingPatients,
      })
      .mockResolvedValueOnce({
        success: true,
      });

    const bulkMutateAsync = jest.fn().mockResolvedValue({ updatedCount: 2 });

    (priorityHooks.useDeactivatePriorityOption as jest.Mock).mockReturnValue({
      mutateAsync: deactivateMutateAsync,
      isPending: false,
    });

    (priorityHooks.useBulkUpdatePatientsPriority as jest.Mock).mockReturnValue({
      mutateAsync: bulkMutateAsync,
      isPending: false,
    });

    render(<PriorityManagementList />);

    // Enter edit mode for priority "3" (third row, code 3).
    fireEvent.click(screen.getAllByTitle("Editar rótulo")[2]);

    // Toggle status via the status column button while editing.
    fireEvent.click(screen.getByRole("button", { name: /Ativo/i }));

    expect(
      await screen.findByText(/Reatribuição necessária antes de desativar/i),
    ).toBeInTheDocument();
    expect(screen.getByText("João Silva")).toBeInTheDocument();
    expect(screen.getByText("Maria Santos")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Reatribuir e desativar/i }),
    );

    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(
        "Prioridade desativada com sucesso.",
        "success",
      ),
    );

    expect(bulkMutateAsync).toHaveBeenCalledWith({
      patientIds: [10, 11],
      priority: "1",
    });

    await waitFor(() => {
      expect(screen.queryByText("João Silva")).not.toBeInTheDocument();
    });
  });

  it("shows tooltip that priority 1 cannot be deactivated", () => {
    render(<PriorityManagementList />);

    const priority1Row = screen.getByText("1").closest("tr");
    expect(priority1Row).not.toBeNull();
    if (!priority1Row) return;

    const statusTag = within(priority1Row).getByText("Ativo");
    expect(statusTag).toHaveAttribute(
      "title",
      expect.stringContaining("não pode ser desativada"),
    );
  });
});
