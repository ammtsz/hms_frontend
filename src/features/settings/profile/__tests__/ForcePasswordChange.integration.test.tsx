/**
 * Integration test for Force Password Change on First Login feature
 * Tests the complete flow from user creation to forced password change
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserForm from "../../users/UserForm";
import { UserRole } from "@/types/auth";
import * as usersApi from "@/api/users";

// Mock the API
jest.mock("@/api/users");
jest.mock("@/api/query/hooks/useUserQueries", () => ({
  useCreateUser: () => ({
    mutateAsync: async (data: Parameters<typeof import("@/api/users").createUser>[0]) => {
      const { createUser } = jest.requireMock("@/api/users") as typeof import("@/api/users");
      const result = await createUser(data);
      if (!result.success) throw new Error(result.error ?? "Unexpected error occurred");
      return result.value;
    },
    isPending: false,
  }),
  useUpdateUser: () => ({
    mutateAsync: async ({ id, data }: { id: number; data: Parameters<typeof import("@/api/users").updateUser>[1] }) => {
      const { updateUser } = jest.requireMock("@/api/users") as typeof import("@/api/users");
      const result = await updateUser(id, data);
      if (!result.success) throw new Error(result.error ?? "Error updating user");
      return result.value;
    },
    isPending: false,
  }),
}));

const mockCreateUser = usersApi.createUser as jest.MockedFunction<
  typeof usersApi.createUser
>;

describe("Force Password Change Integration Tests", () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Creating a new user with mustChangePassword=true", () => {
    it("should send mustChangePassword=true by default when creating a new user", async () => {
      const user = userEvent.setup();

      mockCreateUser.mockResolvedValue({
        success: true,
        value: {
          id: 3,
          name: "Test User",
          email: "test@example.com",
          displayName: "Test",
          role: UserRole.STAFF,
          isActive: true,
          mustChangePassword: true, // Default value
          lastLogin: null,
          createdAt: new Date(),
        },
      });

      render(
        <UserForm
          mode="create"
          user={null}
          users={[]}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Fill in the form
      await user.type(screen.getByLabelText(/Full Name/), "Test User");
      await user.type(screen.getByLabelText(/Display Name/), "Test");
      await user.type(screen.getByLabelText(/Email/), "test@example.com");
      await user.type(screen.getByLabelText(/^Password/), "ValidPassword123");
      await user.type(
        screen.getByLabelText(/Confirm Password/),
        "ValidPassword123",
      );

      // The checkbox should be checked by default
      const checkbox = screen.getByLabelText(
        /Require password change on next login/,
      ) as HTMLInputElement;
      expect(checkbox.checked).toBe(true);

      const submitButton = screen.getByRole("button", { name: /Create/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateUser).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Test User",
            email: "test@example.com",
            password: "ValidPassword123",
            role: UserRole.STAFF,
            isActive: true,
            mustChangePassword: true,
          }),
        );
      });
    });

    it("should send mustChangePassword=false when checkbox is unchecked", async () => {
      const user = userEvent.setup();

      mockCreateUser.mockResolvedValue({
        success: true,
        value: {
          id: 3,
          name: "Test User",
          email: "test@example.com",
          displayName: "Test",
          role: UserRole.STAFF,
          isActive: true,
          mustChangePassword: false,
          lastLogin: null,
          createdAt: new Date(),
        },
      });

      render(
        <UserForm
          mode="create"
          user={null}
          users={[]}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Fill in the form
      await user.type(screen.getByLabelText(/Full Name/), "Test User");
      await user.type(screen.getByLabelText(/Display Name/), "Test");
      await user.type(screen.getByLabelText(/Email/), "test@example.com");
      await user.type(screen.getByLabelText(/^Password/), "ValidPassword123");
      await user.type(
        screen.getByLabelText(/Confirm Password/),
        "ValidPassword123",
      );

      // Uncheck the "force password change" checkbox
      const checkbox = screen.getByLabelText(
        /Require password change on next login/,
      ) as HTMLInputElement;
      await user.click(checkbox);
      expect(checkbox.checked).toBe(false);

      const submitButton = screen.getByRole("button", { name: /Create/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateUser).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Test User",
            email: "test@example.com",
            password: "ValidPassword123",
            role: UserRole.STAFF,
            isActive: true,
            mustChangePassword: false,
          }),
        );
      });
    });

    it("should toggle the checkbox state correctly", async () => {
      const user = userEvent.setup();

      render(
        <UserForm
          mode="create"
          user={null}
          users={[]}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      const checkbox = screen.getByLabelText(
        /Require password change on next login/,
      ) as HTMLInputElement;

      // Initial state should be checked
      expect(checkbox.checked).toBe(true);

      // Click to uncheck
      await user.click(checkbox);
      expect(checkbox.checked).toBe(false);

      // Click again to check
      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });
  });

  describe("Backend Integration", () => {
    it("should handle backend response with mustChangePassword in camelCase", async () => {
      const user = userEvent.setup();

      // Backend now returns camelCase (after fix)
      mockCreateUser.mockResolvedValue({
        success: true,
        value: {
          id: 3,
          name: "Test User",
          email: "test@example.com",
          displayName: "Test",
          role: UserRole.STAFF,
          isActive: true,
          mustChangePassword: true, // Now in camelCase
          lastLogin: null,
          createdAt: new Date(),
        },
      });

      render(
        <UserForm
          mode="create"
          user={null}
          users={[]}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      // Fill in the form
      await user.type(screen.getByLabelText(/Full Name/), "Test User");
      await user.type(screen.getByLabelText(/Display Name/), "Test");
      await user.type(screen.getByLabelText(/Email/), "test@example.com");
      await user.type(screen.getByLabelText(/^Password/), "ValidPassword123");
      await user.type(
        screen.getByLabelText(/Confirm Password/),
        "ValidPassword123",
      );

      const submitButton = screen.getByRole("button", { name: /Create/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });
});
