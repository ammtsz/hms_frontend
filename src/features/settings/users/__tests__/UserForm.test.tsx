import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserForm from "../UserForm";
import { UserRole, type User } from "@/types/auth";
import { createUser, updateUser } from "@/api/users";

jest.mock("@/api/users", () => ({
  createUser: jest.fn(),
  updateUser: jest.fn(),
}));

const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>;
const mockUpdateUser = updateUser as jest.MockedFunction<typeof updateUser>;

jest.mock("@/api/query/hooks/useUserQueries", () => ({
  useCreateUser: () => ({
    mutateAsync: async (data: unknown) => {
      const { createUser } = jest.requireMock(
        "@/api/users",
      ) as typeof import("@/api/users");
      const result = await createUser(data as Parameters<typeof createUser>[0]);
      if (!result.success)
        throw new Error(result.error ?? "Unexpected error occurred");
      return result.value;
    },
    isPending: false,
  }),
  useUpdateUser: () => ({
    mutateAsync: async ({ id, data }: { id: number; data: unknown }) => {
      const { updateUser } = jest.requireMock(
        "@/api/users",
      ) as typeof import("@/api/users");
      const result = await updateUser(
        id,
        data as Parameters<typeof updateUser>[1],
      );
      if (!result.success)
        throw new Error(result.error ?? "Error updating user");
      return result.value;
    },
    isPending: false,
  }),
}));

describe("UserForm", () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  const adminUser: User = {
    id: 1,
    name: "Admin User",
    email: "admin@example.com",
    displayName: "Admin",
    role: UserRole.ADMIN,
    isActive: true,
    mustChangePassword: false,
    lastLogin: new Date(),
    createdAt: new Date(),
  };

  const staffUser: User = {
    id: 2,
    name: "Staff User",
    email: "staff@example.com",
    displayName: "Staff",
    role: UserRole.STAFF,
    isActive: true,
    mustChangePassword: false,
    lastLogin: new Date(),
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Create Mode", () => {
    it("should render create form correctly", () => {
      render(
        <UserForm
          mode="create"
          user={null}
          users={[]}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      expect(screen.getByText("New User")).toBeInTheDocument();
      expect(screen.getByLabelText(/Full Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirm Password/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Role/)).toBeInTheDocument();
    });

    it("should validate required fields", async () => {
      render(
        <UserForm
          mode="create"
          user={null}
          users={[]}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      const submitButton = screen.getByRole("button", { name: /Create/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Name is required")).toBeInTheDocument();
        expect(screen.getByText("Email is required")).toBeInTheDocument();
        expect(screen.getByText("Password is required")).toBeInTheDocument();
      });

      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it("should validate email format", async () => {
      render(
        <UserForm
          mode="create"
          user={null}
          users={[]}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      const nameInput = screen.getByLabelText(/Full Name/);
      const emailInput = screen.getByLabelText(/Email/);
      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/);

      // Fill form with invalid email
      fireEvent.change(nameInput, { target: { value: "John Doe" } });
      fireEvent.change(emailInput, { target: { value: "invalid-email" } });
      fireEvent.change(passwordInput, {
        target: { value: "ValidPassword123" },
      });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "ValidPassword123" },
      });

      const submitButton = screen.getByRole("button", { name: /Create/ });
      fireEvent.submit(submitButton.closest("form")!);

      await waitFor(() => {
        expect(screen.getByText("Invalid email")).toBeInTheDocument();
      });
    });

    it("should validate password length", async () => {
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

      const passwordInput = screen.getByLabelText(/^Password/);
      await user.type(passwordInput, "short");

      const submitButton = screen.getByRole("button", { name: /Create/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Password must be at least 12 characters"),
        ).toBeInTheDocument();
      });
    });

    it("should validate password confirmation", async () => {
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

      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/);

      await user.type(passwordInput, "ValidPassword123");
      await user.type(confirmPasswordInput, "DifferentPassword123");

      const submitButton = screen.getByRole("button", { name: /Create/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
      });
    });

    it("should create user successfully", async () => {
      const user = userEvent.setup();
      mockCreateUser.mockResolvedValue({
        success: true,
        value: adminUser,
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

      await user.type(screen.getByLabelText(/Full Name/), "John Doe");
      await user.type(screen.getByLabelText(/Email/), "john@example.com");
      await user.type(screen.getByLabelText(/^Password/), "ValidPassword123");
      await user.type(
        screen.getByLabelText(/Confirm Password/),
        "ValidPassword123",
      );

      const submitButton = screen.getByRole("button", { name: /Create/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateUser).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "John Doe",
            email: "john@example.com",
            password: "ValidPassword123",
            role: UserRole.STAFF,
            isActive: true,
            mustChangePassword: true,
          }),
        );
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  describe("Edit Mode", () => {
    it("should render edit form with user data", () => {
      render(
        <UserForm
          mode="edit"
          user={adminUser}
          users={[adminUser, staffUser]}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      expect(screen.getByText("Edit User")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Admin User")).toBeInTheDocument();
      expect(screen.getByDisplayValue("admin@example.com")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Admin")).toBeInTheDocument();
    });

    it("should not show password fields in edit mode", () => {
      render(
        <UserForm
          mode="edit"
          user={adminUser}
          users={[adminUser, staffUser]}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      expect(screen.queryByLabelText(/^Password/)).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText(/Confirm Password/),
      ).not.toBeInTheDocument();
    });

    it("should update user successfully", async () => {
      const user = userEvent.setup();
      mockUpdateUser.mockResolvedValue({
        success: true,
        value: { ...adminUser, name: "Updated Name" },
      });

      render(
        <UserForm
          mode="edit"
          user={adminUser}
          users={[adminUser, staffUser]}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      const nameInput = screen.getByLabelText(/Full Name/);
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Name");

      const submitButton = screen.getByRole("button", { name: /Save/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith(
          adminUser.id,
          expect.objectContaining({
            name: "Updated Name",
          }),
        );
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    describe("Last Admin Protection", () => {
      it("should prevent changing last admin to staff role", async () => {
        render(
          <UserForm
            mode="edit"
            user={adminUser}
            users={[adminUser, staffUser]}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />,
        );

        const roleSelect = screen.getByLabelText(/Role/);
        fireEvent.change(roleSelect, { target: { value: UserRole.STAFF } });

        const submitButton = screen.getByRole("button", { name: /Save/ });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(
            screen.getByText(
              "Cannot change the role of the last administrator",
            ),
          ).toBeInTheDocument();
        });

        expect(mockUpdateUser).not.toHaveBeenCalled();
      });

      it("should allow changing admin role when there are multiple admins", async () => {
        const secondAdminUser: User = {
          id: 3,
          name: "Second Admin",
          email: "admin2@example.com",
          displayName: "Admin 2",
          role: UserRole.ADMIN,
          isActive: true,
          mustChangePassword: false,
          lastLogin: new Date(),
          createdAt: new Date(),
        };

        mockUpdateUser.mockResolvedValue({
          success: true,
          value: { ...adminUser, role: UserRole.STAFF },
        });

        render(
          <UserForm
            mode="edit"
            user={adminUser}
            users={[adminUser, secondAdminUser, staffUser]}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />,
        );

        const roleSelect = screen.getByLabelText(/Role/);
        fireEvent.change(roleSelect, { target: { value: UserRole.STAFF } });

        const submitButton = screen.getByRole("button", { name: /Save/ });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(mockUpdateUser).toHaveBeenCalledWith(
            adminUser.id,
            expect.objectContaining({
              role: UserRole.STAFF,
            }),
          );
          expect(mockOnSuccess).toHaveBeenCalled();
        });
      });

      it("should allow changing staff user to admin role", async () => {
        mockUpdateUser.mockResolvedValue({
          success: true,
          value: { ...staffUser, role: UserRole.ADMIN },
        });

        render(
          <UserForm
            mode="edit"
            user={staffUser}
            users={[adminUser, staffUser]}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />,
        );

        const roleSelect = screen.getByLabelText(/Role/);
        fireEvent.change(roleSelect, { target: { value: UserRole.ADMIN } });

        const submitButton = screen.getByRole("button", { name: /Save/ });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(mockUpdateUser).toHaveBeenCalledWith(
            staffUser.id,
            expect.objectContaining({
              role: UserRole.ADMIN,
            }),
          );
          expect(mockOnSuccess).toHaveBeenCalled();
        });
      });

      it("should allow keeping admin role as admin", async () => {
        mockUpdateUser.mockResolvedValue({
          success: true,
          value: { ...adminUser, name: "Updated Admin" },
        });

        const user = userEvent.setup();
        render(
          <UserForm
            mode="edit"
            user={adminUser}
            users={[adminUser, staffUser]}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />,
        );

        const nameInput = screen.getByLabelText(/Full Name/);
        await user.clear(nameInput);
        await user.type(nameInput, "Updated Admin");

        const submitButton = screen.getByRole("button", { name: /Save/ });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(mockUpdateUser).toHaveBeenCalledWith(
            adminUser.id,
            expect.objectContaining({
              name: "Updated Admin",
              role: UserRole.ADMIN,
            }),
          );
          expect(mockOnSuccess).toHaveBeenCalled();
        });
      });

      it("should prevent changing role even when admin count is exactly 1", async () => {
        render(
          <UserForm
            mode="edit"
            user={adminUser}
            users={[adminUser]}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />,
        );

        const roleSelect = screen.getByLabelText(/Role/);
        fireEvent.change(roleSelect, { target: { value: UserRole.STAFF } });

        const submitButton = screen.getByRole("button", { name: /Save/ });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(
            screen.getByText(
              "Cannot change the role of the last administrator",
            ),
          ).toBeInTheDocument();
        });

        expect(mockUpdateUser).not.toHaveBeenCalled();
      });
    });
  });

  describe("Form Interactions", () => {
    it("should close modal when cancel button is clicked", () => {
      render(
        <UserForm
          mode="create"
          user={null}
          users={[]}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      const cancelButton = screen.getByRole("button", { name: /Cancel/ });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should close modal when X button is clicked", () => {
      render(
        <UserForm
          mode="create"
          user={null}
          users={[]}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      const closeButton = screen.getByRole("button", { name: "Close" });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should handle API errors gracefully", async () => {
      const user = userEvent.setup();
      mockCreateUser.mockResolvedValue({
        success: false,
        error: "Email already in use",
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

      await user.type(screen.getByLabelText(/Full Name/), "John Doe");
      await user.type(screen.getByLabelText(/Email/), "john@example.com");
      await user.type(screen.getByLabelText(/^Password/), "ValidPassword123");
      await user.type(
        screen.getByLabelText(/Confirm Password/),
        "ValidPassword123",
      );

      const submitButton = screen.getByRole("button", { name: /Create/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Email already in use")).toBeInTheDocument();
        expect(mockOnSuccess).not.toHaveBeenCalled();
      });
    });

    it("should call onSuccess after successful creation", async () => {
      const user = userEvent.setup();
      mockCreateUser.mockResolvedValue({ success: true, value: adminUser });

      render(
        <UserForm
          mode="create"
          user={null}
          users={[]}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      await user.type(screen.getByLabelText(/Full Name/), "John Doe");
      await user.type(screen.getByLabelText(/Email/), "john@example.com");
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
