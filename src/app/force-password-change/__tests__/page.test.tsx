/**
 * Unit tests for Force Password Change Page
 * Tests form validation, error handling, and submission flow
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForcePasswordChangePage from "../page";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import * as usersApi from "@/api/users";
import { PASSWORD_CHANGE_ERROR_MESSAGES } from "@/utils/passwordChangeErrorMessages";

// Mock dependencies
jest.mock("next/navigation");
jest.mock("@/contexts/AuthContext");
jest.mock("@/api/users");
jest.mock("@/api/query/hooks/useUserQueries", () => ({
  useChangeOwnPassword: () => ({
    mutateAsync: async (
      data: Parameters<typeof import("@/api/users").changeOwnPassword>[0],
    ) => {
      const { changeOwnPassword } = jest.requireMock(
        "@/api/users",
      ) as typeof import("@/api/users");
      const result = await changeOwnPassword(data);
      if (!result.success)
        throw new Error(result.error ?? "Error changing password");
    },
    isPending: false,
  }),
}));

const mockPush = jest.fn();
const mockRefreshUser = jest.fn();
const mockChangeOwnPassword = usersApi.changeOwnPassword as jest.MockedFunction<
  typeof usersApi.changeOwnPassword
>;

describe("ForcePasswordChangePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  describe("User without mustChangePassword flag", () => {
    it("should redirect to home if user does not need to change password", () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: {
          id: 1,
          name: "Test User",
          email: "test@example.com",
          mustChangePassword: false, // Does not need to change
        },
        refreshUser: mockRefreshUser,
      });

      render(<ForcePasswordChangePage />);

      expect(mockPush).toHaveBeenCalledWith("/");
    });

    it("should redirect to login if user is not logged in", () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        refreshUser: mockRefreshUser,
      });

      render(<ForcePasswordChangePage />);

      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  describe("Password change form", () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: {
          id: 1,
          name: "Test User",
          email: "test@example.com",
          mustChangePassword: true,
        },
        refreshUser: mockRefreshUser,
      });
    });

    it("should render the form with all required fields", () => {
      render(<ForcePasswordChangePage />);

      expect(
        screen.getByPlaceholderText(/Enter your current password/),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/At least 12 characters/),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Enter the new password again/),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Change Password and Continue/ }),
      ).toBeInTheDocument();
    });

    it("should show validation errors when submitting empty form", async () => {
      const user = userEvent.setup();
      render(<ForcePasswordChangePage />);

      const submitButton = screen.getByRole("button", {
        name: /Change Password and Continue/,
      });
      await user.click(submitButton);

      expect(
        screen.getByText("Current password is required"),
      ).toBeInTheDocument();
      expect(screen.getByText("New password is required")).toBeInTheDocument();
    });

    it("should show error when new password is too short", async () => {
      const user = userEvent.setup();
      render(<ForcePasswordChangePage />);

      await user.type(
        screen.getByPlaceholderText(/Enter your current password/),
        "current123",
      );
      await user.type(
        screen.getByPlaceholderText(/At least 12 characters/),
        "short",
      );
      await user.type(
        screen.getByPlaceholderText(/Enter the new password again/),
        "short",
      );

      const submitButton = screen.getByRole("button", {
        name: /Change Password and Continue/,
      });
      await user.click(submitButton);

      expect(
        screen.getByText("New password must be at least 12 characters long"),
      ).toBeInTheDocument();
    });

    it("should show error when passwords do not match", async () => {
      const user = userEvent.setup();
      render(<ForcePasswordChangePage />);

      await user.type(
        screen.getByPlaceholderText(/Enter your current password/),
        "current123",
      );
      await user.type(
        screen.getByPlaceholderText(/At least 12 characters/),
        "ValidPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/Enter the new password again/),
        "DifferentPassword123",
      );

      const submitButton = screen.getByRole("button", {
        name: /Change Password and Continue/,
      });
      await user.click(submitButton);

      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });

    it("should show error when new password is same as current", async () => {
      const user = userEvent.setup();
      render(<ForcePasswordChangePage />);

      await user.type(
        screen.getByPlaceholderText(/Enter your current password/),
        "SamePassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/At least 12 characters/),
        "SamePassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/Enter the new password again/),
        "SamePassword123",
      );

      const submitButton = screen.getByRole("button", {
        name: /Change Password and Continue/,
      });
      await user.click(submitButton);

      expect(
        screen.getByText(
          "The new password must be different from the current password",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("Password submission and error handling", () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: {
          id: 1,
          name: "Test User",
          email: "test@example.com",
          mustChangePassword: true,
        },
        refreshUser: mockRefreshUser,
      });
    });

    it("should display error message when current password is wrong (without page refresh)", async () => {
      const user = userEvent.setup();

      // Mock API to return error for wrong password with remaining attempts
      mockChangeOwnPassword.mockResolvedValue({
        success: false,
        error: "Current password is incorrect. 3 attempt(s) remaining.",
      });

      render(<ForcePasswordChangePage />);

      await user.type(
        screen.getByPlaceholderText(/Enter your current password/),
        "WrongPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/At least 12 characters/),
        "NewValidPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/Enter the new password again/),
        "NewValidPassword123",
      );

      const submitButton = screen.getByRole("button", {
        name: /Change Password and Continue/,
      });
      await user.click(submitButton);

      // Error should be displayed in Portuguese
      await waitFor(() => {
        expect(
          screen.getByText(
            "Current password is incorrect. 3 attempt(s) remaining.",
          ),
        ).toBeInTheDocument();
      });

      // Should NOT redirect to login or home
      expect(mockPush).not.toHaveBeenCalled();

      // Form should still be visible (not refreshed)
      expect(
        screen.getByPlaceholderText(/Enter your current password/),
      ).toBeInTheDocument();
    });

    it("should successfully change password and redirect to home", async () => {
      const user = userEvent.setup();

      // Mock successful password change
      mockChangeOwnPassword.mockResolvedValue({
        success: true,
      });

      render(<ForcePasswordChangePage />);

      await user.type(
        screen.getByPlaceholderText(/Enter your current password/),
        "CorrectPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/At least 12 characters/),
        "NewValidPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/Enter the new password again/),
        "NewValidPassword123",
      );

      const submitButton = screen.getByRole("button", {
        name: /Change Password and Continue/,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockChangeOwnPassword).toHaveBeenCalledWith({
          currentPassword: "CorrectPassword123",
          newPassword: "NewValidPassword123",
        });
        expect(mockRefreshUser).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/");
      });
    });

    it("should handle unexpected errors gracefully", async () => {
      const user = userEvent.setup();

      // Mock API to throw an error
      mockChangeOwnPassword.mockRejectedValue(new Error("Network error"));

      render(<ForcePasswordChangePage />);

      await user.type(
        screen.getByPlaceholderText(/Enter your current password/),
        "SomePassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/At least 12 characters/),
        "NewValidPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/Enter the new password again/),
        "NewValidPassword123",
      );

      const submitButton = screen.getByRole("button", {
        name: /Change Password and Continue/,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should clear previous errors when submitting again", async () => {
      const user = userEvent.setup();

      // First submission returns error
      mockChangeOwnPassword.mockResolvedValueOnce({
        success: false,
        error: "Current password is incorrect",
      });

      render(<ForcePasswordChangePage />);

      await user.type(
        screen.getByPlaceholderText(/Enter your current password/),
        "WrongPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/At least 12 characters/),
        "NewValidPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/Enter the new password again/),
        "NewValidPassword123",
      );

      const submitButton = screen.getByRole("button", {
        name: /Change Password and Continue/,
      });

      // First submission
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(PASSWORD_CHANGE_ERROR_MESSAGES.incorrectPassword),
        ).toBeInTheDocument();
      });

      // Second submission with correct password
      mockChangeOwnPassword.mockResolvedValueOnce({
        success: true,
      });

      await user.clear(
        screen.getByPlaceholderText(/Enter your current password/),
      );
      await user.type(
        screen.getByPlaceholderText(/Enter your current password/),
        "CorrectPassword123",
      );

      await user.click(submitButton);

      // Error should be cleared and redirect should happen
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
      });
    });
  });

  describe("Password visibility toggles", () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: {
          id: 1,
          name: "Test User",
          email: "test@example.com",
          mustChangePassword: true,
        },
        refreshUser: mockRefreshUser,
      });
    });

    it("should toggle password visibility for all fields", async () => {
      const user = userEvent.setup();
      render(<ForcePasswordChangePage />);

      const currentPasswordInput = screen.getByPlaceholderText(
        /Enter your current password/,
      ) as HTMLInputElement;
      const newPasswordInput = screen.getByPlaceholderText(
        /At least 12 characters/,
      ) as HTMLInputElement;
      const confirmPasswordInput = screen.getByPlaceholderText(
        /Enter the new password again/,
      ) as HTMLInputElement;

      // Initially all should be password type
      expect(currentPasswordInput.type).toBe("password");
      expect(newPasswordInput.type).toBe("password");
      expect(confirmPasswordInput.type).toBe("password");

      const currentToggleButton = screen.getByRole("button", {
        name: "Show current password",
      });

      // Toggle current password visibility
      await user.click(currentToggleButton);
      expect(currentPasswordInput.type).toBe("text");

      // Toggle back
      await user.click(
        screen.getByRole("button", { name: "Hide current password" }),
      );
      expect(currentPasswordInput.type).toBe("password");
    });
  });

  describe("Password strength indicator", () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: {
          id: 1,
          name: "Test User",
          email: "test@example.com",
          mustChangePassword: true,
        },
        refreshUser: mockRefreshUser,
      });
    });

    it("should show 'Weak' for passwords shorter than 12 characters", async () => {
      const user = userEvent.setup();
      render(<ForcePasswordChangePage />);

      await user.type(
        screen.getByPlaceholderText(/At least 12 characters/),
        "short",
      );

      expect(screen.getByText(/Strength: Weak/)).toBeInTheDocument();
    });

    it("should show 'Medium' for passwords between 12-15 characters", async () => {
      const user = userEvent.setup();
      render(<ForcePasswordChangePage />);

      await user.type(
        screen.getByPlaceholderText(/At least 12 characters/),
        "Password1234",
      );

      expect(screen.getByText(/Strength: Medium/)).toBeInTheDocument();
    });

    it("should show 'Strong' for passwords 16+ characters", async () => {
      const user = userEvent.setup();
      render(<ForcePasswordChangePage />);

      await user.type(
        screen.getByPlaceholderText(/At least 12 characters/),
        "VeryStrongPassword123!",
      );

      expect(screen.getByText(/Strength: Strong/)).toBeInTheDocument();
    });
  });

  describe("Rate limiting error messages in Portuguese", () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: {
          id: 1,
          name: "Test User",
          email: "test@example.com",
          mustChangePassword: true,
        },
        refreshUser: mockRefreshUser,
      });
    });

    it("should display lockout message in Portuguese", async () => {
      const user = userEvent.setup();

      mockChangeOwnPassword.mockResolvedValue({
        success: false,
        error:
          "Too many failed password change attempts. Your account has been locked for 15 minutes.",
      });

      render(<ForcePasswordChangePage />);

      await user.type(
        screen.getByPlaceholderText(/Enter your current password/),
        "WrongPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/At least 12 characters/),
        "NewValidPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/Enter the new password again/),
        "NewValidPassword123",
      );

      const submitButton = screen.getByRole("button", {
        name: /Change Password and Continue/,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            "Too many failed password change attempts. Your account has been locked for 15 minutes.",
          ),
        ).toBeInTheDocument();
      });
    });

    it("should display wait time message in Portuguese", async () => {
      const user = userEvent.setup();

      mockChangeOwnPassword.mockResolvedValue({
        success: false,
        error:
          "Too many failed password change attempts. Please try again in 10 minute(s).",
      });

      render(<ForcePasswordChangePage />);

      await user.type(
        screen.getByPlaceholderText(/Enter your current password/),
        "WrongPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/At least 12 characters/),
        "NewValidPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/Enter the new password again/),
        "NewValidPassword123",
      );

      const submitButton = screen.getByRole("button", {
        name: /Change Password and Continue/,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            "Too many failed password change attempts. Please try again in 10 minute(s).",
          ),
        ).toBeInTheDocument();
      });
    });

    it("should display remaining attempts in Portuguese", async () => {
      const user = userEvent.setup();

      mockChangeOwnPassword.mockResolvedValue({
        success: false,
        error: "Current password is incorrect. 2 attempt(s) remaining.",
      });

      render(<ForcePasswordChangePage />);

      await user.type(
        screen.getByPlaceholderText(/Enter your current password/),
        "WrongPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/At least 12 characters/),
        "NewValidPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/Enter the new password again/),
        "NewValidPassword123",
      );

      const submitButton = screen.getByRole("button", {
        name: /Change Password and Continue/,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(PASSWORD_CHANGE_ERROR_MESSAGES.remainingAttempts(2)),
        ).toBeInTheDocument();
      });
    });
  });
});
