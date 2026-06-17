import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PasswordSettings from "../PasswordSettings";
import { changeOwnPassword } from "@/api/users";

jest.mock("@/api/users");

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

describe("PasswordSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders password change form", () => {
    render(<PasswordSettings />, { wrapper: createWrapper() });

    expect(screen.getByText("Senha Atual *")).toBeInTheDocument();
    expect(screen.getByText("Nova Senha *")).toBeInTheDocument();
    expect(screen.getByText("Confirmar Nova Senha *")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /alterar senha/i }),
    ).toBeInTheDocument();
  });

  it("toggles visibility for new password only", () => {
    render(<PasswordSettings />, { wrapper: createWrapper() });

    const currentPasswordInput = screen.getByPlaceholderText(
      /digite sua senha atual/i,
    );
    const newPasswordInput = screen.getByPlaceholderText(/mínimo 12 caracteres/i);

    expect(currentPasswordInput).toHaveAttribute("type", "password");
    expect(newPasswordInput).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: /mostrar nova senha/i }));

    expect(currentPasswordInput).toHaveAttribute("type", "password");
    expect(newPasswordInput).toHaveAttribute("type", "text");
  });

  it("validates required fields", async () => {
    render(<PasswordSettings />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole("button", {
      name: /alterar senha/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Senha atual é obrigatória")).toBeInTheDocument();
      expect(screen.getByText("Nova senha é obrigatória")).toBeInTheDocument();
    });
  });

  it("validates minimum password length", async () => {
    render(<PasswordSettings />, { wrapper: createWrapper() });

    const currentPasswordInput = screen.getByPlaceholderText(
      /digite sua senha atual/i,
    );
    const newPasswordInput =
      screen.getByPlaceholderText(/mínimo 12 caracteres/i);

    fireEvent.change(currentPasswordInput, {
      target: { value: "Current123!" },
    });
    fireEvent.change(newPasswordInput, { target: { value: "Short1!" } });

    const submitButton = screen.getByRole("button", {
      name: /alterar senha/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Nova senha deve ter no mínimo 12 caracteres"),
      ).toBeInTheDocument();
    });
  });

  it("validates password confirmation match", async () => {
    render(<PasswordSettings />, { wrapper: createWrapper() });

    const currentPasswordInput = screen.getByPlaceholderText(
      /digite sua senha atual/i,
    );
    const newPasswordInput =
      screen.getByPlaceholderText(/mínimo 12 caracteres/i);
    const confirmPasswordInput = screen.getByPlaceholderText(
      /digite a senha novamente/i,
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
      name: /alterar senha/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("As senhas não coincidem")).toBeInTheDocument();
    });
  });

  it("validates that new password is different from current", async () => {
    render(<PasswordSettings />, { wrapper: createWrapper() });

    const currentPasswordInput = screen.getByPlaceholderText(
      /digite sua senha atual/i,
    );
    const newPasswordInput =
      screen.getByPlaceholderText(/mínimo 12 caracteres/i);
    const confirmPasswordInput = screen.getByPlaceholderText(
      /digite a senha novamente/i,
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
      name: /alterar senha/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("A nova senha deve ser diferente da atual"),
      ).toBeInTheDocument();
    });
  });

  it("displays password strength indicator", () => {
    render(<PasswordSettings />, { wrapper: createWrapper() });

    const newPasswordInput =
      screen.getByPlaceholderText(/mínimo 12 caracteres/i);

    // Weak password (less than 12 characters)
    fireEvent.change(newPasswordInput, { target: { value: "Weak123" } });
    expect(screen.getByText("Força: Fraca")).toBeInTheDocument();

    // Medium password (12-15 characters)
    fireEvent.change(newPasswordInput, {
      target: { value: "Medium123456" },
    });
    expect(screen.getByText("Força: Média")).toBeInTheDocument();

    // Strong password (16+ characters)
    fireEvent.change(newPasswordInput, {
      target: { value: "StrongPassword123456!" },
    });
    expect(screen.getByText("Força: Forte")).toBeInTheDocument();
  });

  it("successfully changes password", async () => {
    mockChangeOwnPassword.mockResolvedValue({ success: true });

    render(<PasswordSettings />, { wrapper: createWrapper() });

    const currentPasswordInput = screen.getByPlaceholderText(
      /digite sua senha atual/i,
    );
    const newPasswordInput =
      screen.getByPlaceholderText(/mínimo 12 caracteres/i);
    const confirmPasswordInput = screen.getByPlaceholderText(
      /digite a senha novamente/i,
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
      name: /alterar senha/i,
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
        screen.getByText("Senha alterada com sucesso!"),
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
      /digite sua senha atual/i,
    );
    const newPasswordInput =
      screen.getByPlaceholderText(/mínimo 12 caracteres/i);
    const confirmPasswordInput = screen.getByPlaceholderText(
      /digite a senha novamente/i,
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
      name: /alterar senha/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Senha atual incorreta.")).toBeInTheDocument();
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
      /digite sua senha atual/i,
    );
    const newPasswordInput =
      screen.getByPlaceholderText(/mínimo 12 caracteres/i);
    const confirmPasswordInput = screen.getByPlaceholderText(
      /digite a senha novamente/i,
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
      name: /alterar senha/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /alterando/i })).toBeDisabled();
    });
  });

  it("handles unexpected errors gracefully", async () => {
    mockChangeOwnPassword.mockRejectedValue(new Error("Network error"));

    render(<PasswordSettings />, { wrapper: createWrapper() });

    const currentPasswordInput = screen.getByPlaceholderText(
      /digite sua senha atual/i,
    );
    const newPasswordInput =
      screen.getByPlaceholderText(/mínimo 12 caracteres/i);
    const confirmPasswordInput = screen.getByPlaceholderText(
      /digite a senha novamente/i,
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
      name: /alterar senha/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Network error"),
      ).toBeInTheDocument();
    });
  });
});
