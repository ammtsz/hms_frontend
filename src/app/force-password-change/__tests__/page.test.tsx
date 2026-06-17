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

// Mock dependencies
jest.mock("next/navigation");
jest.mock("@/contexts/AuthContext");
jest.mock("@/api/users");
jest.mock("@/api/query/hooks/useUserQueries", () => ({
  useChangeOwnPassword: () => ({
    mutateAsync: async (data: Parameters<typeof import("@/api/users").changeOwnPassword>[0]) => {
      const { changeOwnPassword } = jest.requireMock("@/api/users") as typeof import("@/api/users");
      const result = await changeOwnPassword(data);
      if (!result.success) throw new Error(result.error ?? "Erro ao alterar senha");
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
        screen.getByPlaceholderText(/Digite sua senha atual/),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Mínimo 12 caracteres/),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Digite a senha novamente/),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Alterar Senha e Continuar/ }),
      ).toBeInTheDocument();
    });

    it("should show validation errors when submitting empty form", async () => {
      const user = userEvent.setup();
      render(<ForcePasswordChangePage />);

      const submitButton = screen.getByRole("button", {
        name: /Alterar Senha e Continuar/,
      });
      await user.click(submitButton);

      expect(screen.getByText("Senha atual é obrigatória")).toBeInTheDocument();
      expect(screen.getByText("Nova senha é obrigatória")).toBeInTheDocument();
    });

    it("should show error when new password is too short", async () => {
      const user = userEvent.setup();
      render(<ForcePasswordChangePage />);

      await user.type(
        screen.getByPlaceholderText(/Digite sua senha atual/),
        "current123",
      );
      await user.type(
        screen.getByPlaceholderText(/Mínimo 12 caracteres/),
        "short",
      );
      await user.type(
        screen.getByPlaceholderText(/Digite a senha novamente/),
        "short",
      );

      const submitButton = screen.getByRole("button", {
        name: /Alterar Senha e Continuar/,
      });
      await user.click(submitButton);

      expect(
        screen.getByText("Nova senha deve ter no mínimo 12 caracteres"),
      ).toBeInTheDocument();
    });

    it("should show error when passwords do not match", async () => {
      const user = userEvent.setup();
      render(<ForcePasswordChangePage />);

      await user.type(
        screen.getByPlaceholderText(/Digite sua senha atual/),
        "current123",
      );
      await user.type(
        screen.getByPlaceholderText(/Mínimo 12 caracteres/),
        "ValidPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/Digite a senha novamente/),
        "DifferentPassword123",
      );

      const submitButton = screen.getByRole("button", {
        name: /Alterar Senha e Continuar/,
      });
      await user.click(submitButton);

      expect(screen.getByText("As senhas não coincidem")).toBeInTheDocument();
    });

    it("should show error when new password is same as current", async () => {
      const user = userEvent.setup();
      render(<ForcePasswordChangePage />);

      await user.type(
        screen.getByPlaceholderText(/Digite sua senha atual/),
        "SamePassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/Mínimo 12 caracteres/),
        "SamePassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/Digite a senha novamente/),
        "SamePassword123",
      );

      const submitButton = screen.getByRole("button", {
        name: /Alterar Senha e Continuar/,
      });
      await user.click(submitButton);

      expect(
        screen.getByText("A nova senha deve ser diferente da atual"),
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
        screen.getByPlaceholderText(/Digite sua senha atual/),
        "WrongPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/Mínimo 12 caracteres/),
        "NewValidPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/Digite a senha novamente/),
        "NewValidPassword123",
      );

      const submitButton = screen.getByRole("button", {
        name: /Alterar Senha e Continuar/,
      });
      await user.click(submitButton);

      // Error should be displayed in Portuguese
      await waitFor(() => {
        expect(
          screen.getByText(
            "Senha atual incorreta. 3 tentativa(s) restante(s).",
          ),
        ).toBeInTheDocument();
      });

      // Should NOT redirect to login or home
      expect(mockPush).not.toHaveBeenCalled();

      // Form should still be visible (not refreshed)
      expect(
        screen.getByPlaceholderText(/Digite sua senha atual/),
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
        screen.getByPlaceholderText(/Digite sua senha atual/),
        "CorrectPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/Mínimo 12 caracteres/),
        "NewValidPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/Digite a senha novamente/),
        "NewValidPassword123",
      );

      const submitButton = screen.getByRole("button", {
        name: /Alterar Senha e Continuar/,
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
        screen.getByPlaceholderText(/Digite sua senha atual/),
        "SomePassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/Mínimo 12 caracteres/),
        "NewValidPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/Digite a senha novamente/),
        "NewValidPassword123",
      );

      const submitButton = screen.getByRole("button", {
        name: /Alterar Senha e Continuar/,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Network error"),
        ).toBeInTheDocument();
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
        screen.getByPlaceholderText(/Digite sua senha atual/),
        "WrongPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/Mínimo 12 caracteres/),
        "NewValidPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/Digite a senha novamente/),
        "NewValidPassword123",
      );

      const submitButton = screen.getByRole("button", {
        name: /Alterar Senha e Continuar/,
      });

      // First submission
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Senha atual incorreta.")).toBeInTheDocument();
      });

      // Second submission with correct password
      mockChangeOwnPassword.mockResolvedValueOnce({
        success: true,
      });

      await user.clear(screen.getByPlaceholderText(/Digite sua senha atual/));
      await user.type(
        screen.getByPlaceholderText(/Digite sua senha atual/),
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
        /Digite sua senha atual/,
      ) as HTMLInputElement;
      const newPasswordInput = screen.getByPlaceholderText(
        /Mínimo 12 caracteres/,
      ) as HTMLInputElement;
      const confirmPasswordInput = screen.getByPlaceholderText(
        /Digite a senha novamente/,
      ) as HTMLInputElement;

      // Initially all should be password type
      expect(currentPasswordInput.type).toBe("password");
      expect(newPasswordInput.type).toBe("password");
      expect(confirmPasswordInput.type).toBe("password");

      const currentToggleButton = screen.getByRole("button", {
        name: "Mostrar senha atual",
      });

      // Toggle current password visibility
      await user.click(currentToggleButton);
      expect(currentPasswordInput.type).toBe("text");

      // Toggle back
      await user.click(
        screen.getByRole("button", { name: "Ocultar senha atual" }),
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

    it("should show 'Fraca' for passwords shorter than 12 characters", async () => {
      const user = userEvent.setup();
      render(<ForcePasswordChangePage />);

      await user.type(
        screen.getByPlaceholderText(/Mínimo 12 caracteres/),
        "short",
      );

      expect(screen.getByText(/Força: Fraca/)).toBeInTheDocument();
    });

    it("should show 'Média' for passwords between 12-15 characters", async () => {
      const user = userEvent.setup();
      render(<ForcePasswordChangePage />);

      await user.type(
        screen.getByPlaceholderText(/Mínimo 12 caracteres/),
        "Password1234",
      );

      expect(screen.getByText(/Força: Média/)).toBeInTheDocument();
    });

    it("should show 'Forte' for passwords 16+ characters", async () => {
      const user = userEvent.setup();
      render(<ForcePasswordChangePage />);

      await user.type(
        screen.getByPlaceholderText(/Mínimo 12 caracteres/),
        "VeryStrongPassword123!",
      );

      expect(screen.getByText(/Força: Forte/)).toBeInTheDocument();
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
        screen.getByPlaceholderText(/Digite sua senha atual/),
        "WrongPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/Mínimo 12 caracteres/),
        "NewValidPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/Digite a senha novamente/),
        "NewValidPassword123",
      );

      const submitButton = screen.getByRole("button", {
        name: /Alterar Senha e Continuar/,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            "Muitas tentativas de alteração de senha falharam. Sua conta foi bloqueada por 15 minutos.",
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
        screen.getByPlaceholderText(/Digite sua senha atual/),
        "WrongPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/Mínimo 12 caracteres/),
        "NewValidPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/Digite a senha novamente/),
        "NewValidPassword123",
      );

      const submitButton = screen.getByRole("button", {
        name: /Alterar Senha e Continuar/,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            "Muitas tentativas de alteração de senha falharam. Tente novamente em 10 minuto(s).",
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
        screen.getByPlaceholderText(/Digite sua senha atual/),
        "WrongPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/Mínimo 12 caracteres/),
        "NewValidPassword123",
      );
      await user.type(
        screen.getByPlaceholderText(/Digite a senha novamente/),
        "NewValidPassword123",
      );

      const submitButton = screen.getByRole("button", {
        name: /Alterar Senha e Continuar/,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            "Senha atual incorreta. 2 tentativa(s) restante(s).",
          ),
        ).toBeInTheDocument();
      });
    });
  });
});
