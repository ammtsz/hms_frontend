/**
 * Unit tests for LoginForm
 * Tests form rendering, validation, login success/error, and returnUrl redirect
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "../LoginForm";
import { LOGIN_FORM_LABELS } from "@/utils/authFormLabels";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { loginAction } from "@/app/actions/auth.actions";

jest.mock("next/navigation");
jest.mock("@tanstack/react-query");
jest.mock("@/app/actions/auth.actions");

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockSetQueryData = jest.fn();

describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
    (useQueryClient as jest.Mock).mockReturnValue({
      setQueryData: mockSetQueryData,
    });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
  });

  it("renders login form with email and password fields", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Sign in/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: LOGIN_FORM_LABELS.clinicHeading,
      }),
    ).toBeInTheDocument();
  });

  it("shows validation error when submitting empty form", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: /Sign in/i }));

    expect(
      screen.getByText(LOGIN_FORM_LABELS.fillAllFields),
    ).toBeInTheDocument();
    expect(loginAction).not.toHaveBeenCalled();
  });

  it("on successful login without returnUrl redirects to /attendance", async () => {
    (loginAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 1,
        email: "test@example.com",
        displayName: "Test User",
        mustChangePassword: false,
      },
    });

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByPlaceholderText(LOGIN_FORM_LABELS.emailPlaceholder),
      "test@example.com",
    );
    await user.type(screen.getByPlaceholderText(/••••••••/), "password123");
    await user.click(screen.getByRole("button", { name: /Sign in/i }));

    await waitFor(() => {
      expect(mockSetQueryData).toHaveBeenCalledWith(
        ["auth", "currentUser"],
        expect.any(Object),
      );
      expect(mockPush).toHaveBeenCalledWith("/attendance");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("on successful login with returnUrl redirects to returnUrl", async () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams({ returnUrl: "/agenda" }),
    );
    (loginAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 1,
        email: "test@example.com",
        displayName: "Test User",
        mustChangePassword: false,
      },
    });

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByPlaceholderText(LOGIN_FORM_LABELS.emailPlaceholder),
      "test@example.com",
    );
    await user.type(screen.getByPlaceholderText(/••••••••/), "password123");
    await user.click(screen.getByRole("button", { name: /Sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/agenda");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("on successful login with encoded returnUrl decodes and redirects", async () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams({ returnUrl: "%2Fagenda" }),
    );
    (loginAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 1,
        email: "test@example.com",
        displayName: "Test User",
        mustChangePassword: false,
      },
    });

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByPlaceholderText(LOGIN_FORM_LABELS.emailPlaceholder),
      "test@example.com",
    );
    await user.type(screen.getByPlaceholderText(/••••••••/), "password123");
    await user.click(screen.getByRole("button", { name: /Sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/agenda");
    });
  });

  it("on successful login with mustChangePassword redirects to /force-password-change", async () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams({ returnUrl: "/agenda" }),
    );
    (loginAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 1,
        email: "test@example.com",
        displayName: "Test User",
        mustChangePassword: true,
      },
    });

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByPlaceholderText(LOGIN_FORM_LABELS.emailPlaceholder),
      "test@example.com",
    );
    await user.type(screen.getByPlaceholderText(/••••••••/), "password123");
    await user.click(screen.getByRole("button", { name: /Sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/force-password-change");
      expect(mockPush).toHaveBeenCalledTimes(1);
    });
  });

  it("on failed login shows error and does not redirect", async () => {
    (loginAction as jest.Mock).mockResolvedValue({
      success: false,
      error: "Invalid credentials",
    });

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByPlaceholderText(LOGIN_FORM_LABELS.emailPlaceholder),
      "test@example.com",
    );
    await user.type(screen.getByPlaceholderText(/••••••••/), "wrong");
    await user.click(screen.getByRole("button", { name: /Sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("ignores unsafe returnUrl and redirects to /attendance", async () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams({ returnUrl: "//evil.com/path" }),
    );
    (loginAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 1,
        email: "test@example.com",
        displayName: "Test User",
        mustChangePassword: false,
      },
    });

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByPlaceholderText(LOGIN_FORM_LABELS.emailPlaceholder),
      "test@example.com",
    );
    await user.type(screen.getByPlaceholderText(/••••••••/), "password123");
    await user.click(screen.getByRole("button", { name: /Sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/attendance");
    });
  });
});
