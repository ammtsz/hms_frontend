import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PasswordSettings from "../PasswordSettings";
import { changeOwnPassword } from "@/api/users";
import { PASSWORD_CHANGE_ERROR_MESSAGES } from "@/utils/passwordChangeErrorMessages";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";

jest.mock("@/api/users");
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "TestQueryWrapper";
  return Wrapper;
};

const mockChangeOwnPassword = changeOwnPassword as jest.MockedFunction<
  typeof changeOwnPassword
>;

function mockAuthUser(overrides: { isDemo?: boolean } = {}) {
  mockUseAuth.mockReturnValue({
    user: {
      id: 1,
      email: "user@example.com",
      name: "Test User",
      role: UserRole.STAFF,
      isActive: true,
      mustChangePassword: false,
      isDemo: false,
      lastLogin: null,
      createdAt: new Date(),
      ...overrides,
    },
    isAuthenticated: true,
    isLoading: false,
    refreshUser: jest.fn(),
  });
}

describe("PasswordSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthUser();
  });

  it("renders password change form", () => {
    render(<PasswordSettings />, { wrapper: createWrapper() });

    expect(screen.getByText("Current Password *")).toBeInTheDocument();
    expect(screen.getByText("New Password *")).toBeInTheDocument();
    expect(screen.getByText("Confirm New Password *")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /change password/i }),
    ).toBeInTheDocument();
  });

  it("disables password change for demo accounts and explains why", () => {
    mockAuthUser({ isDemo: true });

    render(<PasswordSettings />, { wrapper: createWrapper() });

    expect(
      screen.getByText(/public demo account/i),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/enter your current password/i),
    ).toBeDisabled();
    expect(
      screen.getByPlaceholderText(/minimum 12 characters/i),
    ).toBeDisabled();
    expect(
      screen.getByPlaceholderText(/re-enter the password/i),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /change password/i }),
    ).toBeDisabled();
  });

  it("does not submit when demo account form is submitted", async () => {
    mockAuthUser({ isDemo: true });

    render(<PasswordSettings />, { wrapper: createWrapper() });

    fireEvent.submit(
      screen.getByRole("button", { name: /change password/i }).closest("form")!,
    );

    await waitFor(() => {
      expect(mockChangeOwnPassword).not.toHaveBeenCalled();
    });
  });

  it("toggles visibility for new password only", () => {
    render(<PasswordSettings />, { wrapper: createWrapper() });

    const currentPasswordInput = screen.getByPlaceholderText(
      /enter your current password/i,
    );
    const newPasswordInput = screen.getByPlaceholderText(
      /minimum 12 characters/i,
    );

    expect(currentPasswordInput).toHaveAttribute("type", "password");
    expect(newPasswordInput).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: /show new password/i }));

    expect(currentPasswordInput).toHaveAttribute("type", "password");
    expect(newPasswordInput).toHaveAttribute("type", "text");
  });

  it("validates required fields", async () => {
    render(<PasswordSettings />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Current password is required"),
      ).toBeInTheDocument();
      expect(screen.getByText("New password is required")).toBeInTheDocument();
    });
  });

  it("validates minimum password length", async () => {
    render(<PasswordSettings />, { wrapper: createWrapper() });

    const currentPasswordInput = screen.getByPlaceholderText(
      /enter your current password/i,
    );
    const newPasswordInput = screen.getByPlaceholderText(
      /minimum 12 characters/i,
    );

    fireEvent.change(currentPasswordInput, {
      target: { value: "Current123!" },
    });
    fireEvent.change(newPasswordInput, { target: { value: "Short1!" } });

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("New password must be at least 12 characters"),
      ).toBeInTheDocument();
    });
  });

  it("validates password confirmation match", async () => {
    render(<PasswordSettings />, { wrapper: createWrapper() });

    const currentPasswordInput = screen.getByPlaceholderText(
      /enter your current password/i,
    );
    const newPasswordInput = screen.getByPlaceholderText(
      /minimum 12 characters/i,
    );
    const confirmPasswordInput = screen.getByPlaceholderText(
      /re-enter the password/i,
    );

    fireEvent.change(currentPasswordInput, {
      target: { value: "CurrentPassword123!" },
    });
    fireEvent.change(newPasswordInput, {
      target: { value: "NewPassword123!" },
    });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "DifferentPassword123!" },
    });

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });
  });

  it("validates that new password is different from current", async () => {
    render(<PasswordSettings />, { wrapper: createWrapper() });

    const currentPasswordInput = screen.getByPlaceholderText(
      /enter your current password/i,
    );
    const newPasswordInput = screen.getByPlaceholderText(
      /minimum 12 characters/i,
    );
    const confirmPasswordInput = screen.getByPlaceholderText(
      /re-enter the password/i,
    );

    fireEvent.change(currentPasswordInput, {
      target: { value: "SamePassword123!" },
    });
    fireEvent.change(newPasswordInput, {
      target: { value: "SamePassword123!" },
    });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "SamePassword123!" },
    });

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "New password must be different from the current password",
        ),
      ).toBeInTheDocument();
    });
  });

  it("displays password strength indicator", () => {
    render(<PasswordSettings />, { wrapper: createWrapper() });

    const newPasswordInput = screen.getByPlaceholderText(
      /minimum 12 characters/i,
    );

    // Weak password (less than 12 characters)
    fireEvent.change(newPasswordInput, { target: { value: "Weak123" } });
    expect(screen.getByText("Strength: Weak")).toBeInTheDocument();

    // Medium password (12-15 characters)
    fireEvent.change(newPasswordInput, {
      target: { value: "Medium123456" },
    });
    expect(screen.getByText("Strength: Medium")).toBeInTheDocument();

    // Strong password (16+ characters)
    fireEvent.change(newPasswordInput, {
      target: { value: "StrongPassword123456!" },
    });
    expect(screen.getByText("Strength: Strong")).toBeInTheDocument();
  });

  it("successfully changes password", async () => {
    mockChangeOwnPassword.mockResolvedValue({ success: true });

    render(<PasswordSettings />, { wrapper: createWrapper() });

    const currentPasswordInput = screen.getByPlaceholderText(
      /enter your current password/i,
    );
    const newPasswordInput = screen.getByPlaceholderText(
      /minimum 12 characters/i,
    );
    const confirmPasswordInput = screen.getByPlaceholderText(
      /re-enter the password/i,
    );

    fireEvent.change(currentPasswordInput, {
      target: { value: "CurrentPassword123!" },
    });
    fireEvent.change(newPasswordInput, {
      target: { value: "NewPassword123!" },
    });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "NewPassword123!" },
    });

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockChangeOwnPassword).toHaveBeenCalledWith({
        currentPassword: "CurrentPassword123!",
        newPassword: "NewPassword123!",
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText("Password changed successfully!"),
      ).toBeInTheDocument();
    });

    // Check form is cleared
    expect(currentPasswordInput).toHaveValue("");
    expect(newPasswordInput).toHaveValue("");
    expect(confirmPasswordInput).toHaveValue("");
  });

  it("displays error message on password change failure", async () => {
    mockChangeOwnPassword.mockResolvedValue({
      success: false,
      error: "Current password is incorrect",
    });

    render(<PasswordSettings />, { wrapper: createWrapper() });

    const currentPasswordInput = screen.getByPlaceholderText(
      /enter your current password/i,
    );
    const newPasswordInput = screen.getByPlaceholderText(
      /minimum 12 characters/i,
    );
    const confirmPasswordInput = screen.getByPlaceholderText(
      /re-enter the password/i,
    );

    fireEvent.change(currentPasswordInput, {
      target: { value: "WrongPassword123!" },
    });
    fireEvent.change(newPasswordInput, {
      target: { value: "NewPassword123!" },
    });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "NewPassword123!" },
    });

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(PASSWORD_CHANGE_ERROR_MESSAGES.incorrectPassword),
      ).toBeInTheDocument();
    });
  });

  it("disables submit button while loading", async () => {
    mockChangeOwnPassword.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true }), 100),
        ),
    );

    render(<PasswordSettings />, { wrapper: createWrapper() });

    const currentPasswordInput = screen.getByPlaceholderText(
      /enter your current password/i,
    );
    const newPasswordInput = screen.getByPlaceholderText(
      /minimum 12 characters/i,
    );
    const confirmPasswordInput = screen.getByPlaceholderText(
      /re-enter the password/i,
    );

    fireEvent.change(currentPasswordInput, {
      target: { value: "CurrentPassword123!" },
    });
    fireEvent.change(newPasswordInput, {
      target: { value: "NewPassword123!" },
    });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "NewPassword123!" },
    });

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /changing/i })).toBeDisabled();
    });
  });

  it("handles unexpected errors gracefully", async () => {
    mockChangeOwnPassword.mockRejectedValue(new Error("Network error"));

    render(<PasswordSettings />, { wrapper: createWrapper() });

    const currentPasswordInput = screen.getByPlaceholderText(
      /enter your current password/i,
    );
    const newPasswordInput = screen.getByPlaceholderText(
      /minimum 12 characters/i,
    );
    const confirmPasswordInput = screen.getByPlaceholderText(
      /re-enter the password/i,
    );

    fireEvent.change(currentPasswordInput, {
      target: { value: "CurrentPassword123!" },
    });
    fireEvent.change(newPasswordInput, {
      target: { value: "NewPassword123!" },
    });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "NewPassword123!" },
    });

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });
});
