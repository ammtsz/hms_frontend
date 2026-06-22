import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TreatmentOptionRow from "../TreatmentOptionRow";
import { useAuth } from "@/contexts/AuthContext";
import {
  useUpdateBodyLocation,
  useDeleteBodyLocation,
  useUpdateColor,
  useDeleteColor,
} from "@/api/query/hooks/useSystemOptionsQueries";
import { UserRole } from "@/types/auth";
import { SystemOptionType, type SystemOption } from "@/types/systemOptions";
import type { User } from "@/types/auth";

// Mock the hooks
jest.mock("@/contexts/AuthContext");
jest.mock("@/api/query/hooks/useSystemOptionsQueries");

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseUpdateBodyLocation = useUpdateBodyLocation as jest.MockedFunction<
  typeof useUpdateBodyLocation
>;
const mockUseDeleteBodyLocation = useDeleteBodyLocation as jest.MockedFunction<
  typeof useDeleteBodyLocation
>;
const mockUseUpdateColor = useUpdateColor as jest.MockedFunction<
  typeof useUpdateColor
>;
const mockUseDeleteColor = useDeleteColor as jest.MockedFunction<
  typeof useDeleteColor
>;

describe("TreatmentOptionRow", () => {
  const mockMutateAsync = jest.fn();
  const mockRefreshUser = jest.fn();

  const mockAdminUser: User = {
    id: 1,
    name: "Admin User",
    email: "admin@example.com",
    role: UserRole.ADMIN,
    isActive: true,
    mustChangePassword: false,
    lastLogin: new Date("2024-01-15T10:00:00.000Z"),
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
  };

  const mockStaffUser: User = {
    id: 2,
    name: "Staff User",
    email: "staff@example.com",
    role: UserRole.STAFF,
    isActive: true,
    mustChangePassword: false,
    lastLogin: new Date("2024-01-15T10:00:00.000Z"),
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
  };

  const mockBodyLocation: SystemOption = {
    id: 1,
    type: SystemOptionType.BODY_LOCATION,
    value: "Right Arm",
    isActive: true,
    usageCount: 5,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const mockColor: SystemOption = {
    id: 2,
    type: SystemOptionType.COLOR,
    value: "Red",
    isActive: true,
    usageCount: 3,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseUpdateBodyLocation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    mockUseDeleteBodyLocation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    mockUseUpdateColor.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    mockUseDeleteColor.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

  describe("Admin User Permissions", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockAdminUser,
        isAuthenticated: true,
        isLoading: false,
        refreshUser: mockRefreshUser,
      });
    });

    it("should render edit button enabled for admin users", () => {
      render(
        <table>
          <tbody>
            <TreatmentOptionRow
              option={mockBodyLocation}
              type={SystemOptionType.BODY_LOCATION}
            />
          </tbody>
        </table>,
      );

      const editButton = screen.getByTitle("Edit");
      expect(editButton).toBeInTheDocument();
      expect(editButton).not.toBeDisabled();
    });

    it("should render delete button enabled for admin users", () => {
      render(
        <table>
          <tbody>
            <TreatmentOptionRow
              option={mockBodyLocation}
              type={SystemOptionType.BODY_LOCATION}
            />
          </tbody>
        </table>,
      );

      const deleteButton = screen.getByTitle("Delete");
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).not.toBeDisabled();
    });

    it("should allow admin to enter edit mode", () => {
      render(
        <table>
          <tbody>
            <TreatmentOptionRow
              option={mockBodyLocation}
              type={SystemOptionType.BODY_LOCATION}
            />
          </tbody>
        </table>,
      );

      const editButton = screen.getByTitle("Edit");
      fireEvent.click(editButton);

      expect(screen.getByDisplayValue("Right Arm")).toBeInTheDocument();
      expect(screen.getByTitle("Save")).toBeInTheDocument();
      expect(screen.getByTitle("Cancel")).toBeInTheDocument();
    });

    it("should allow admin to open delete confirmation modal", () => {
      render(
        <table>
          <tbody>
            <TreatmentOptionRow
              option={mockBodyLocation}
              type={SystemOptionType.BODY_LOCATION}
            />
          </tbody>
        </table>,
      );

      const deleteButton = screen.getByTitle("Delete");
      fireEvent.click(deleteButton);

      expect(screen.getByText("Confirm Deletion")).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to delete/),
      ).toBeInTheDocument();
    });

    it("should call update mutation when admin saves changes", async () => {
      render(
        <table>
          <tbody>
            <TreatmentOptionRow
              option={mockBodyLocation}
              type={SystemOptionType.BODY_LOCATION}
            />
          </tbody>
        </table>,
      );

      const editButton = screen.getByTitle("Edit");
      fireEvent.click(editButton);

      const input = screen.getByDisplayValue("Right Arm");
      fireEvent.change(input, { target: { value: "Left Arm" } });

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: 1,
          updates: { value: "Left Arm" },
        });
      });
    });

    it("should call delete mutation when admin confirms deletion", async () => {
      render(
        <table>
          <tbody>
            <TreatmentOptionRow
              option={mockBodyLocation}
              type={SystemOptionType.BODY_LOCATION}
            />
          </tbody>
        </table>,
      );

      const deleteButton = screen.getByTitle("Delete");
      fireEvent.click(deleteButton);

      // Wait for modal to appear
      expect(screen.getByText("Confirm Deletion")).toBeInTheDocument();

      // Get all buttons and find the confirm button in the modal (second one)
      const confirmButtons = screen.getAllByRole("button", {
        name: /Delete/i,
      });
      fireEvent.click(confirmButtons[1]); // The second one is in the modal

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(1);
      });
    });
  });

  describe("Staff User Permissions", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockStaffUser,
        isAuthenticated: true,
        isLoading: false,
        refreshUser: mockRefreshUser,
      });
    });

    it("should render edit button disabled for staff users", () => {
      render(
        <table>
          <tbody>
            <TreatmentOptionRow
              option={mockBodyLocation}
              type={SystemOptionType.BODY_LOCATION}
            />
          </tbody>
        </table>,
      );

      const editButton = screen.getByTitle(
        "Only administrators can edit",
      );
      expect(editButton).toBeInTheDocument();
      expect(editButton).toBeDisabled();
    });

    it("should render delete button disabled for staff users", () => {
      render(
        <table>
          <tbody>
            <TreatmentOptionRow
              option={mockBodyLocation}
              type={SystemOptionType.BODY_LOCATION}
            />
          </tbody>
        </table>,
      );

      const deleteButton = screen.getByTitle(
        "Only administrators can delete",
      );
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toBeDisabled();
    });

    it("should not allow staff to enter edit mode", () => {
      render(
        <table>
          <tbody>
            <TreatmentOptionRow
              option={mockBodyLocation}
              type={SystemOptionType.BODY_LOCATION}
            />
          </tbody>
        </table>,
      );

      const editButton = screen.getByTitle(
        "Only administrators can edit",
      );
      fireEvent.click(editButton);

      // Should not show edit input
      expect(
        screen.queryByDisplayValue("Right Arm"),
      ).not.toBeInTheDocument();
      expect(screen.queryByTitle("Save")).not.toBeInTheDocument();
    });

    it("should not allow staff to open delete confirmation modal", () => {
      render(
        <table>
          <tbody>
            <TreatmentOptionRow
              option={mockBodyLocation}
              type={SystemOptionType.BODY_LOCATION}
            />
          </tbody>
        </table>,
      );

      const deleteButton = screen.getByTitle(
        "Only administrators can delete",
      );
      fireEvent.click(deleteButton);

      // Should not show confirmation modal
      expect(screen.queryByText("Confirm Deletion")).not.toBeInTheDocument();
    });

    it("should display option data to staff users", () => {
      render(
        <table>
          <tbody>
            <TreatmentOptionRow
              option={mockBodyLocation}
              type={SystemOptionType.BODY_LOCATION}
            />
          </tbody>
        </table>,
      );

      expect(screen.getByText("Right Arm")).toBeInTheDocument();
      expect(screen.getByText("5 sessions")).toBeInTheDocument();
      expect(screen.getByText("● Active")).toBeInTheDocument();
    });
  });

  describe("Color Options", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockAdminUser,
        isAuthenticated: true,
        isLoading: false,
        refreshUser: mockRefreshUser,
      });
    });

    it("should use color mutations for color type options", async () => {
      render(
        <table>
          <tbody>
            <TreatmentOptionRow
              option={mockColor}
              type={SystemOptionType.COLOR}
            />
          </tbody>
        </table>,
      );

      const editButton = screen.getByTitle("Edit");
      fireEvent.click(editButton);

      const input = screen.getByDisplayValue("Red");
      fireEvent.change(input, { target: { value: "Blue" } });

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: 2,
          updates: { value: "Blue" },
        });
      });
    });
  });

  describe("Display States", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockAdminUser,
        isAuthenticated: true,
        isLoading: false,
        refreshUser: mockRefreshUser,
      });
    });

    it("should display inactive option with proper styling", () => {
      const inactiveOption: SystemOption = {
        ...mockBodyLocation,
        isActive: false,
      };

      render(
        <table>
          <tbody>
            <TreatmentOptionRow
              option={inactiveOption}
              type={SystemOptionType.BODY_LOCATION}
            />
          </tbody>
        </table>,
      );

      const optionName = screen.getByText("Right Arm");
      expect(optionName).toHaveClass("text-gray-400", "line-through");
    });

    it("should display usage count when available", () => {
      render(
        <table>
          <tbody>
            <TreatmentOptionRow
              option={mockBodyLocation}
              type={SystemOptionType.BODY_LOCATION}
            />
          </tbody>
        </table>,
      );

      expect(screen.getByText("5 sessions")).toBeInTheDocument();
    });

    it("should display hyphen when no usage count", () => {
      const noUsageOption: SystemOption = {
        ...mockBodyLocation,
        usageCount: 0,
      };

      render(
        <table>
          <tbody>
            <TreatmentOptionRow
              option={noUsageOption}
              type={SystemOptionType.BODY_LOCATION}
            />
          </tbody>
        </table>,
      );

      expect(screen.getByText("-")).toBeInTheDocument();
    });
  });
});
