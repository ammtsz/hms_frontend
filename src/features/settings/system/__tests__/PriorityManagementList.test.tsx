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
import { SystemOptionType, type SystemOption } from "@/types/systemOptions";
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
      label: "Priority",
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
      label: "Standard",
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
      label: "Priority 3",
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
      label: "Elderly 80+",
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
      label: "Other",
      sortOrder: 5,
      isActive: false,
      usageCount: 0,
      createdAt: "",
      updatedAt: "",
    },
  ];

  beforeEach(() => {
    // Guard against fake-timer leaks from other suites in the same Jest worker.
    jest.useRealTimers();
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

    expect(screen.getByText("Priority")).toBeInTheDocument();
    expect(screen.getByText("Standard")).toBeInTheDocument();
    expect(screen.getByText("Priority 3")).toBeInTheDocument();

    expect(screen.getByText("3 patient(s)")).toBeInTheDocument();
  });

  it(
    "blocks deactivation and performs bulk reassign",
    async () => {
      const blockingPatients = [
        { id: 10, name: "John Smith", priority: "3" as Priority },
        { id: 11, name: "Emily Williams", priority: "3" as Priority },
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

      (priorityHooks.useBulkUpdatePatientsPriority as jest.Mock).mockReturnValue(
        {
          mutateAsync: bulkMutateAsync,
          isPending: false,
        },
      );

      render(<PriorityManagementList />);

      // Enter edit mode for priority "3" (third row, code 3).
      fireEvent.click(screen.getAllByTitle("Edit label")[2]);

      // Toggle status via the status column button while editing.
      const statusButton = await screen.findByRole("button", {
        name: /Active/i,
      });
      fireEvent.click(statusButton);

      expect(
        await screen.findByText(
          /Reassignment required before deactivating/i,
          {},
          { timeout: 5000 },
        ),
      ).toBeInTheDocument();
      expect(screen.getByText("John Smith")).toBeInTheDocument();
      expect(screen.getByText("Emily Williams")).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", { name: /Reassign and deactivate/i }),
      );

      await waitFor(
        () =>
          expect(mockShowToast).toHaveBeenCalledWith(
            "Priority deactivated successfully.",
            "success",
          ),
        { timeout: 5000 },
      );

      expect(bulkMutateAsync).toHaveBeenCalledWith({
        patientIds: [10, 11],
        priority: "1",
      });

      await waitFor(
        () => {
          expect(screen.queryByText("John Smith")).not.toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    },
    15000,
  );

  it("shows tooltip that priority 1 cannot be deactivated", () => {
    render(<PriorityManagementList />);

    const priority1Row = screen.getByText("1").closest("tr");
    expect(priority1Row).not.toBeNull();
    if (!priority1Row) return;

    const statusTag = within(priority1Row).getByText("Active");
    expect(statusTag).toHaveAttribute(
      "title",
      expect.stringContaining("cannot be deactivated"),
    );
  });
});
